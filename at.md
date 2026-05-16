# Active Theory — Deep Technical Analysis

Source: `/workspaces/codespace/activetheory/activetheory.net/`  
Shaders: `assets/shaders/compiled.vs` — 173 shaders, 8877 lines  
App JS: `assets/js/app.1778129964370.js` — 1.78MB minified  
Total shader output analyzed: 243KB

---

## 1. Architecture Overview

AT is not built on Three.js. It uses **Hydra** — their own closed-source WebGL2 engine.

### World Singleton
```
World.RENDERER   — WebGL2 renderer
World.CAMERA     — perspective camera
World.SCENE      — single root scene (one continuous world)
World.NUKE       — custom post-processing compositor
World.CONTROLS   — camera controller
World.DPR        — device pixel ratio
```

### Page System
Pages: `Home`, `About`, `Work` (with WorkDetail), `Lab`, `CleanRoom`, `Chat`  
Each page has: `[Name]Page`, `[Name]Composite.fs`, optional `[Name]Refraction`  
Routing via `ViewController` + `ViewState` — state machine, not URL routing  
**Key**: pages overlap during transitions. Both old and new page can be partially visible simultaneously.

### Frame Rate Independence
```js
LerpAlpha = t => 1 - Math.exp(Math.log(1 - t) * Render.FRAME_HZ_MULTIPLIER)
```
`FRAME_HZ_MULTIPLIER` = `deltaTime / (1/60)`. All shader uniforms named `HZ` use this.  
Result: lerp at `alpha = 0.05` looks the same at 30fps and 144fps.

---

## 2. Render Pipeline — Multi-Pass

AT renders in this order every frame:

```
1. Scene → tRefraction FBO          (capture scene for glass/refraction)
2. Mirror/Cube camera renders        (real-time floor reflections)
3. Main scene render → MRT           (Color + HomeRefraction + WorkRefraction + VolumetricLight)
4. VolumetricLight pass              (20-step radial march from light screen pos)
5. FXAA with stencil mask            (anti-alias, skips UI)
6. Fluid simulation ping-pong        (Navier-Stokes velocity → density → splat)
7. UnrealBloom pipeline              (Luminosity threshold → 5-level Gaussian pyramid → composite)
8. Lens flare                        (Prefilter → DownSample → UpSample with horizontal stretch → CompositeStreak)
9. HydraBloom composite              (screen blend of bloom over scene)
10. GlobalComposite.fs               (MEGA PASS: frost, fluid distortion, RGB shift, gradients, film grain)
11. Final output
```

### MRT (Multiple Render Targets)
AT writes to multiple color buffers in one fragment shader pass:
```glsl
// Inside WorkItemShader.glsl
#drawbuffer Color gl_FragColor = color;
#drawbuffer WorkRefraction gl_FragColor = refractionOut;
```
This is AT's custom preprocessor syntax. In WebGL2 this maps to `gl_FragData[0]`, `gl_FragData[1]`.  
Saves rendering the scene twice for refraction capture.

---

## 3. The `uVisible` Pattern — Entry/Exit Animations

**This is the single most important AT technique.** Never use opacity fades. Always deform geometry.

### HomeColumnShader (the canonical example)
```glsl
uniform float uVisible;      // GSAP tweened 0→1 on enter, 1→0 on exit
uniform float uOffset;       // per-column phase offset
uniform float uDirection;    // +1 or -1

void main() {
    vec3 pos = position;

    // Vertical rise: columns fall from above when uVisible < 1
    pos.y -= pow((1.0 - uVisible), 1.15) * 20.0;

    // Spiral unwinding: radius shrinks as uVisible approaches 1
    float radius = mix(1.9, 4.0, smoothstep(10.0, -10.0, pos.y));
    pos.x += cos(-pos.y * 0.32 * uDirection + uOffset) * radius;
    pos.z += sin(-pos.y * 0.32 * uDirection + uOffset) * radius;

    // High-frequency twist at leading edge (small noise)
    pos.x += cos(-pos.y * 10.0 * uDirection) * 0.1 * pow((1.0-uVisible), 1.25);
    pos.z += sin(-pos.y * 10.0 * uDirection) * 0.1 * pow((1.0-uVisible), 1.25);
}
```
When `uVisible = 0`: columns are 20 units below floor AND twisted into a tight helix.  
When `uVisible = 1`: columns stand straight.  
The `uOffset` per-column phase = stagger delay baked as an attribute or JS-set uniform.

### LogoParticleShader (GPGPU particles)
```glsl
// uScroll 0→1 drives all particle motion
float offset = pow((1.0 - uScroll), 2.5) * pow(random.x, 20.0) * 6.0;
pos.y += offset;   // particles hang below then rise into position
pos.y += pow((1.0 - uScroll), 5.0) * 4.0;  // global lift, stronger at start

// Spiral inward as uScroll increases
pos.x -= cos(pos.y * 2.0) * 0.05 * step(0.7, random.y);
pos.z -= sin(pos.y * 2.0) * 0.05 * step(0.7, random.y);
```
`random` is a `vec4` attribute on each particle — 4 independent random values.  
Per-particle stagger via `pow(random.x, 20.0)` — most particles slow to start, a few are fast.

### ChainShader (helix motion from scroll)
```glsl
// Entire chain shifts down with scroll, pulling into a helix
pos.y -= 17.0 * uScroll;
pos.x -= cos(-pos.y * 0.4) * 1.1;  // helix X
pos.z -= sin(-pos.y * 0.4) * 1.1;  // helix Z
```

### JellyShader (continuous organic motion)
```glsl
// Organic breathing with cnoise
pos.y += cnoise(pos * vec3(0.1, 0.5, 0.1) * 0.8 + time * 0.5 * 0.35) * 0.6;
// Swaying side-to-side
pos.x += sin(pos.y + time * 0.1 + uScroll) * 0.1;
pos.z += cos(pos.y + time * 0.1 + uScroll) * 0.1;
```

### WorkItemShader (interactive card deformation)
```glsl
uniform float uHover;  // 0→1 on hover
uniform vec2 uMouse;   // normalized cursor position

// Card bends toward viewer on hover
pos.z += sin(time * 0.5 + abs(0.5-pos.x) * 3.0) * 0.1 + uHover * 0.2;
// Slight phone-like perspective tilt 
pos.y -= pos.x * mix(0.08, 0.14, uPhone);
// Mouse-driven subtle horizontal shift
pos.x -= vec2(uMouse-0.5).x * 0.03;
```
Fragment uses fresnel-based rainbow iridescence + refraction distortion + mouse-offset spotlight.

---

## 4. GPGPU Particle System (Antimatter)

Every particle system stores positions in a **FBO texture**, NOT in CPU buffers.

### Architecture
```
tPos    FBO  — particle world positions (vec3 per texel)
tLife   FBO  — lifecycle: [age, ?, splineProgress, ...]
tAttribs FBO — random attributes baked at spawn
tOrigin  FBO — spawn positions
```

### Vertex shader pattern (every particle shader)
```glsl
attribute vec4 random;      // per-particle random vec4 baked at creation
uniform sampler2D tPos;     // FBO containing world positions

void main() {
    // Read world position from FBO (position.xy = UV into tPos)
    vec4 decodedPos = texture2D(tPos, position.xy);
    vec3 pos = decodedPos.xyz;

    // Apply deformation using random attributes
    pos += cnoise(pos * 0.1 + time * 0.2) * 0.2;

    // Scale point size with distance (perspective-correct)
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = (0.02 * DPR) * vScale * (1000.0 / length(mvPosition.xyz));
    gl_Position = projectionMatrix * mvPosition;
}
```

### Lifecycle (AntimatterSpawn.fs)
```glsl
// Per-frame: update life FBO via render-to-texture
float life = texture2D(tLife, uv).x;
data.x -= 0.005 * decay * crange(random.w, 0.0, 1.0, decayRandom.x, decayRandom.y) * HZ;
// When life reaches 0, respawn at origin:
if (life.x > 0.5) {
    data.xyz = life.yzw;  // teleport to spawn position
    data.x -= 999.0;      // reset age
}
```

### ProtonTubes (tube rendering from particle chains)
Particles chained in order inside tPos FBO. ProtonTube.glsl extrudes tube geometry:
```glsl
// Read consecutive positions for tangent calculation
vec3 current = texture2D(tPos, getUVFromIndex(posIndex, textureSize)).xyz;
vec3 next    = texture2D(tPos, getUVFromIndex(nextIndex, textureSize)).xyz;
// Frenet frame
vec3 T = normalize(next - current);
vec3 B = normalize(cross(T, next + current));
vec3 N = -normalize(cross(B, T));
// Extrude circle
transformed = current + B * volume.x * cos(angle) + N * volume.y * sin(angle);
```
Each tube = one continuous geometry strip. Thousands of tubes = millions of polygons, all from FBO data.

### SplineParticles (particles following baked splines)
```glsl
uniform sampler2D tSpline;  // baked spline curve as texture
float travel = texture2D(tLife, vUv).z;  // progress along spline 0→1
vec3 target = getSplinePos(travel);       // lookup position on spline
pos += (target - pos) * 0.07 * HZ;       // lerp toward spline (HZ-normalized)
```
Multiple splines stored in tSpline atlas. Per-particle `sRandom.x` picks which spline.

---

## 5. Fluid Simulation (Real Navier-Stokes)

Full WebGL2 fluid simulation running every frame on GPU ping-pong FBOs.

### Steps each frame
```
1. advection.fs        — velocity field self-advects (particles carry momentum)
2. curlShader.fs       — compute vorticity (curl of velocity field)
3. vorticityShader.fs  — add vorticity confinement (prevents energy dissipation)
4. divergenceShader.fs — compute divergence (measure of compressibility)
5. pressureShader.fs   — Jacobi iteration (4 iterations) to solve pressure
6. gradientSubtract.fs — subtract pressure gradient from velocity (make divergence-free)
7. splatShader.fs      — inject mouse movement as velocity + dye
8. advection again     — advect the dye/density field
```

### Usage in GlobalComposite.fs
```glsl
uniform sampler2D tFluid;      // velocity field
uniform sampler2D tFluidMask;  // mask for where fluid applies

vec2 fluid = texture2D(tFluid, uv).xy;
float fluidMask = smoothstep(0.0, 1.0, texture2D(tFluidMask, uv).r);
float fluidPush = pow(abs(fluid.x) * 0.01, 2.0);  // small but nonzero push
// Distort final composite UV with fluid velocity
uv += fluid.xy * fluidMask * strength;
// Creates frosted glass / liquid distortion on mouse trail
```

### splatShader (mouse injection)
```glsl
// Line splat from prevPoint to point
float l(vec2 uv, vec2 p1, vec2 p2) {
    vec2 pa = uv - p1, ba = p2 - p1;
    pa.x *= aspectRatio; ba.x *= aspectRatio;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h);
}
// Circular falloff from line
float splat = (1.0 - cubicOut(clamp(l(vUv, prevPoint, point) / radius, 0.0, 1.0))) * color;
```

---

## 6. Post-Processing Chain (GlobalComposite.fs)

This is the single most complex shader in AT. Everything happens here.

### Operations in order
1. **Fluid distortion**: UV warped by fluid velocity field
2. **Frosted glass**: Normal map (repeat tiling, animated) distorts UV near screen edges and contact zones
3. **RGB shift**: `getRGB()` samples R/G/B channels with angular offset. Magnitude driven by `uScrollDelta`, fluid edge, contact
4. **Contrast**: `adjustContrast(color, uContrast.x, uContrast.y)` — two-param contrast
5. **UnrealBloom**: Pre-computed bloom FBO added with `pow(bloom, vec3(1.8))` for non-linear response
6. **Lens streak**: `texture2D(tLightStreak, uv)` added with `pow(streak, vec3(1.25))`
7. **Corner gradients**: Animated HSV color at corners, noise-driven oscillation with `cnoise(noiseUV * scale + time * 0.03 + scroll * 0.08)`
8. **Film grain**: `blendOverlay(color, vec3(getNoise(vUv, time)), 0.15)` — `getNoise` uses `sin/fract` approximation
9. **Contact zoom**: `scaleUV(vUv, 1.0 + uContact * 0.06)` — slight zoom when UI overlay opens
10. **Global visibility fade**: `color *= smoothstep(0.0, 0.5, uVisible)` — scene fades in/out

---

## 7. PBR / Lighting

### Full PBR pipeline (pbr.fs)
- `tBaseColor` — albedo
- `tMRO` — Metallic / Roughness / AO packed in RGB
- `tNormal` — tangent-space normal map
- `tLUT` — BRDF lookup texture (pre-integrated GGX)
- `tEnvDiffuse` + `tEnvSpecular` — equirectangular IBL maps (RGBM encoded: `corsica_beach`)
- `tLightmap` — baked lightmap in uv2 channel for static indirect lighting
- Custom `unpackNormalPBR` using `dFdx/dFdy` for cotangent-space TBN

### FloorShader (real-time mirror reflections)
```glsl
uniform mat4 uMirrorMatrix;           // mirror camera projection matrix
uniform sampler2D tMirrorReflection;  // rendered from below-floor camera

vec2 mirrorUV = vMirrorCoord.xy / vMirrorCoord.w;  // projective texturing
mirrorUV += normal.xy * uDistortStrength;            // normal-map perturbation
vec3 reflectionColor = radialBlur(tMirrorReflection, mirrorUV, 15.0 * strength, 5.0);
```
`radialBlur` samples 8 directions × 5 steps for soft reflection.  
The blur radius scales with roughness (from MRO texture).

### FBR (Full Baked Render) — used on environment geometry
AT's lighter alternative to full PBR for prelit geometry. Uses: `tBaseColor`, `tMRO`, `tNormal`, lightmap `uv2`.  
`setupFBR()` in vertex shader, `getFBR()` in fragment. Faster than PBR, used on room/spine/jelly geometry.

---

## 8. Glass & Refraction System

### Two-pass refraction
```
Pass 1: Render opaque scene to tRefraction FBO
Pass 2: Render glass objects; sample tRefraction with distorted UV
```

### WorkDetailCube (frosted glass box)
```glsl
// Normal map distorts refraction UV
ruv += 0.04 * normal.xy * uDistortStrength * frostedStrength;
vec3 refraction = texture2D(tRefraction, ruv).rgb;

// Frosted strength increases toward edges and with cnoise
float frostedStrength = smoothstep(-0.2, 0.6, length(screenUV - 0.5));
frostedStrength *= 2.0 + cnoise(screenUV * 0.8 + time * 0.5) * 1.0;
```

### CleanRoom glass scene
Separate refraction scene (`CleanRoomRefractionScene`) renders the inner room from outside.  
`GlassInner.glsl` and `GlassReflection.glsl` sample it with GlassReflection using cube camera.

---

## 9. Math / Utility Shaders

### simplenoise.glsl — NOT Perlin noise
```glsl
float cnoise(vec3 v) {
    float t = v.z * 0.3;
    v.y *= 0.8;
    float noise = 0.0;
    // 8 sin terms with different frequencies/phases
    noise += (sin(v.x * 0.9/s + t*10) + sin(v.x * 2.4/s + t*15) + ...) * 0.3;
    noise += (sin(v.y * -0.3/s + t*18) + ...) * 0.3;
    return noise;
}
```
Fast, cheap, good enough for organic motion. No texture lookups.  
On mobile: `sin()` approximated via polynomial for speed.

### curl.glsl — Analytical curl noise
```glsl
// Divergence-free flow via analytical derivative of potential field
float potential1(vec3 v) {
    return sin(v.x*1.8 + v.z*3) + sin(v.x*4.8 + v.z*4.5) + ...;  // 8 sin terms
}
vec3 curlNoise(vec3 p) {
    // Analytical derivatives of potential1/2/3
    // Returns divergence-free vector field
}
```
Used for organic particle flow that never "piles up" (divergence-free = no sinks/sources).

### fresnel.glsl — Two variants
```glsl
// Simple power: dot(N, V) → 1 at edges
float getFresnel(vec3 normal, vec3 viewDir, float power) {
    float d = dot(normalize(normal), normalize(viewDir));
    return 1.0 - pow(abs(d), power);
}
// Physics-accurate Schlick: needs IOR
float getFresnel(float inIOR, float outIOR, vec3 normal, vec3 viewDir) {
    float ro = (inIOR - outIOR) / (inIOR + outIOR);
    float d = dot(normalize(normal), normalize(viewDir));
    return ro + (1.0 - ro) * pow((1.0 - d), 5.0);
}
```

### eases.glsl — Full easing library in GLSL
`backIn/Out/InOut`, `bounceIn/Out`, `circularIn/Out`, `cubicIn/Out`, `elasticInOut`, `exponentialIn/Out`, `quadraticIn/Out`, `quarticIn/Out`, `quinticIn/Out`, `sineIn/Out`.  
Used for non-linear animation inside shaders (e.g. entrance easing without GSAP).

### sdfs.glsl — Neural network SDF logo
```glsl
float logo_sdf(vec3 p) {
    // Trained neural net: 55 seconds training, loss 6.77e-5
    // 3-layer sin network with hardcoded weights as mat4 literals
    // Input: 3D position → Output: signed distance
}
```
SDF evaluated in fragment shader to render logo with perfect anti-aliasing at any resolution.

### range.glsl
```glsl
float crange(float v, float a, float b, float c, float d) {
    return mix(c, d, clamp((v - a) / (b - a), 0.0, 1.0));
}
```
Remaps `v` from `[a,b]` to `[c,d]` with clamping. Used **everywhere** in AT shaders (100+ instances).

### transformUV.glsl
```glsl
vec2 scaleUV(vec2 uv, vec2 scale);          // scale UV from center
vec2 scaleUV(vec2 uv, vec2 scale, vec2 pivot); // scale from custom pivot
vec2 rotateUV(vec2 uv, float angle);        // rotate UV around center
```

### blendmodes.glsl
`blendSoftLight`, `blendAdd`, `blendMultiply`, `blendOverlay`, `blendScreen`  
Photoshop blend modes in GLSL. AT chains 3–5 blend operations per fragment.

### rgbshift.fs
```glsl
vec4 getRGB(sampler2D tex, vec2 uv, float angle, float amount) {
    vec2 offset = vec2(cos(angle), sin(angle)) * amount;
    vec4 r = texture2D(tex, uv + offset);  // R shifted +
    vec4 g = texture2D(tex, uv);           // G unshifted
    vec4 b = texture2D(tex, uv - offset);  // B shifted -
    return vec4(r.r, g.g, b.b, g.a);
}
```

### VolumetricLight.fs — 20-step radial march
```glsl
const int iSamples = 20;
vec2 deltaTextCoord = (vUv - lightPos) / float(iSamples) * fDensity;
float illuminationDecay = 1.0;
for (int i = 0; i < iSamples; i++) {
    coord -= deltaTextCoord;
    vec4 texel = texture2D(tDiffuse, coord);
    texel *= illuminationDecay * fWeight;
    color += texel;
    illuminationDecay *= fDecay;  // exponential decay from light source
}
color *= fExposure;
```
Inputs: screen-space light position, exposure, decay, density, weight.

---

## 10. Background & Scene Shaders

### LoaderBGShader (4 variants)
Four animated backgrounds used during the boot sequence.  
Based on varying combinations of: `cnoise`, `curl`, time animation, color gradients.

### NavBGShader / ChatBGShader
Animated backgrounds behind navigation / chat overlays.

### FXScrollTransition.glsl
Full-screen scroll transition effect. Used between page transitions alongside `uVisible` geometry deformation.

---

## 11. Assets

### Geometry (binary + JSON)
```
geometry/hand_indexed.bin   — hand mesh for VR
geometry/hexgrid            — hexagonal grid mesh
geometry/home               — home scene geometry
geometry/jellyfish          — jellyfish mesh
geometry/logo               — AT logo geometry
geometry/logo_animation     — animated logo frames
geometry/panels             — flat panels for work cards
geometry/particles          — particle positions (pre-baked)
geometry/room               — CleanRoom geometry
geometry/spine              — spinal cord / chain geometry
geometry/tree_room          — tree room environment
geometry/work               — work page geometry
```

### Video
`video/reel.mp4` — main showreel, played on work cards as texture.  
Renders are used as `tVideo` uniform across many shaders for screen content.

### Images
- `images/pbr/damaged_road_*.png` — road material (basecolor, normal, mro)
- `images/pbr/lut.png` — BRDF integration LUT
- `images/pbr/corsica_beach-diffuse/specular-RGBM.png` — IBL environment maps
- `images/room/matcap-test.jpg` — matcap for organic objects
- `images/_scenelayout/*` — scene composition maps (UV, black, mask)
- `images/_lightvolume/*` — volumetric light textures
- `images/ui/*` — icon sprites

### Music (8 tracks, ambient loop)
`music/Sergey Azbel - Themis.mp3`, `music/BXRDVJA - Ghost Cities.mp3`, etc.

---

## 12. Interaction System

### RayManager
AT has a custom `RayManager` class that wraps `THREE.Raycaster` equivalent.  
Objects register with `onHover(callback)` and `onClick(callback)`.  
`uHover` uniform is tweened 0→1 when hover is detected.

### Mouse Fluid
Mouse movement → velocity splat into fluid FBO → distorts composited output.  
`MouseFluid` converts cursor delta to fluid velocity injection (splatShader.fs).

---

## 13. Key Takeaways (What to Steal)

| Technique | How AT Does It | How We Implement It |
|-----------|---------------|---------------------|
| Entry animations | `uVisible` uniform drives vertex deformation | Same pattern, GSAP tweens 0→1 |
| Particle system | GPGPU: positions in FBO, read in VS | Three.js `DataTexture` + custom ShaderMaterial |
| Fluid distortion | Full Navier-Stokes on GPU | Same shader code (copy advection/vorticity/pressure chain) |
| Post-processing | GlobalComposite mega-pass | Three.js EffectComposer + custom ShaderPasses |
| Refraction | Scene → FBO → glass objects sample it | Three.js `WebGLRenderTarget` + sample in shader |
| Frame rate independence | `1 - exp(log(1-t) * deltaMultiplier)` | Use same formula, pass as `uHZ` uniform |
| Per-element stagger | `random` vec4 attribute per instance | `InstancedBufferAttribute` with random values |
| SDF rendering | Neural net weights as mat4 chain | Can reuse sdfs.glsl if we want logo SDF |
| PBR + IBL | tEnvDiffuse/tEnvSpecular equirectangular | Three.js `RGBMLoader` + `PMREMGenerator` |
| Organic noise | `cnoise()` via sin superposition | Copy simplenoise.glsl, use everywhere |
| Curl noise | Analytical divergence-free field | Copy curl.glsl, use for particle trails |
| RGB shift | Angle + amount → channel offset | Copy rgbshift.fs |
| Volumetric light | 20-step radial march | Copy VolumetricLight.fs as ShaderPass |
| Bloom | UnrealBloom: luminosity → pyramid → composite | Three.js UnrealBloomPass (same algorithm) |
| Lens streak | Down/Up sample horizontal stretch | Custom ShaderPass chain |
| Fresnel iridescence | Rainbow `getFresnel(pow)` with per-channel | Copy fresnel.glsl + rainbowColor() |

### AT's Core Design Principle
> Objects don't appear. They **arrive**. From somewhere specific, with weight, via physics that matches what they represent.

Columns spiral upward like they're being assembled from raw material.  
Particles rise from below, still settling, some faster than others.  
Cards warp toward the viewer on hover, responding to mouse as if they have mass.  
The floor reflects, the glass refracts, the mouse leaves a fluid wake.  
**Nothing is flat. Nothing is instant. Nothing is opacity.**
