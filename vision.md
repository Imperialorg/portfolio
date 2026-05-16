# NEON DISTRICT — Vision & Planning Document

> "Objects don't appear. They arrive. From somewhere specific, with weight."  
> — The AT principle we build on.

---

## What We're Building

A first-person fly-through of a procedural cyberpunk city at night. Each section of the portfolio is a **distinct location** in that world — not a new page, not a slide, but a place you travel to. The city is alive: rain, reflections, neon, fog. The project sections are scenes that represent *what the code actually does*, not generic decorations around text.

**The bar**: At minimum, every frame should look like a still you'd want to screenshot. At its best, it should feel like playing a demo scene from 2026.

---

## Core Constraints (Non-Negotiable)

1. **No opacity fades for entering elements.** Everything arrives physically — rising from below, spiraling in, assembling from fragments.
2. **Every project section = a spatial metaphor** for the project's internals. Not a building. Not a server rack. The *inside* of what the code does.
3. **Continuous world.** Camera moves through one space. No page reloads, no hard cuts.
4. **Detail scales with proximity.** Far: read the silhouette. Close: see the material, the glow bands on floors, the rust on antenna bases.
5. **Interactions are local physics.** Hover a GPU core → it pulses and emits heat shimmer. Hover a transmission tower → the arc jumps toward cursor.

---

## AT Learnings Applied Here

### What We Directly Borrow from AT Source
- `uVisible` pattern: float 0→1 GSAP-tweened uniform drives **vertex shader geometry deformation**. Not opacity. Columns rise, rings expand, grids assemble.
- `cnoise()` from `simplenoise.glsl`: fast sin-superposition noise. Copy verbatim. Used for organic jitter, fog, surface perturbation.
- `curl.glsl`: analytical divergence-free noise for particle trails that flow without sinking.
- `fresnel.glsl`: both IOR-based and power-based. Used on glass buildings, hologram edges.
- `eases.glsl`: full GLSL easing library. Use `cubicOut`, `backOut` inside vertex shaders for per-element entry feel.
- `range.glsl` (`crange()`): our most-used utility. Remap any float range with clamp.
- `rgbshift.fs`: RGB channel offset for chromatic aberration on transitions and post.
- `VolumetricLight.fs`: 20-step radial march. Copy for street light god rays and our WebRTC RF visualization.
- `blendmodes.glsl`: `blendSoftLight`, `blendAdd`, `blendOverlay` — use for HDR-style material layering.
- `sdfs.glsl` pattern: custom SDFs for holographic logos/icons rendered in fragment shader.
- Frame-rate independence formula: `1 - exp(log(1-t) * (deltaTime / 0.01667))` passed as `uHZ` everywhere.
- GPGPU particle pattern: `DataTexture` positions, read via `texture2D(tPos, position.xy)` in vertex shader.

### What We Do Differently
- **Three.js WebGPURenderer** (r171+) — not Hydra, not WebGL. One-line swap, auto-fallback to WebGL2.
- **Vite + TypeScript** build pipeline.
- Our environments are **symbolic/abstract** (inside a chip, inside a GPU array) — AT's environments are more literal (clean room, ocean, trees).
- We DO have the full Navier-Stokes fluid sim — as a **compute shader**, not FBO ping-pong.
- We DO need the full bloom + lens streak pipeline — this is what separates "looks good" from "looks 2026".

---

## WebGPU Strategy

### Why WebGPU Now (May 2026)
WebGPU hit baseline across all major browsers:

| Browser | Stable Since | Notes |
|---------|-------------|-------|
| Chrome/Edge | May 2023 (v113) | All platforms including Android 12+ |
| Safari | Sept 2025 (v26) | All Apple OS: macOS Tahoe, iOS/iPadOS 26 |
| Firefox | July 2025 (v141+) | Windows + macOS ARM64; Linux 2026 |

**Global coverage**: ~95%+ of modern desktop browsers. Remaining 5% (old corporate browsers, Linux Firefox) get automatic WebGL2 fallback via Three.js.

### Three.js WebGPU Migration (r171+)
```ts
// BEFORE (WebGL):
import { WebGLRenderer } from 'three'
const renderer = new WebGLRenderer({ antialias: true })

// AFTER (WebGPU with auto-fallback):
import WebGPU from 'three/addons/capabilities/WebGPU.js'
import WebGPURenderer from 'three/addons/renderers/webgpu/WebGPURenderer.js'

const renderer = WebGPU.isAvailable()
  ? new WebGPURenderer({ antialias: true })
  : new WebGLRenderer({ antialias: true })
await renderer.init()
```

Standard materials, lighting, shadows, camera: **identical behavior** on both backends.

### TSL — Three Shading Language
Write shaders once, compile to GLSL (WebGL) or WGSL (WebGPU):
```ts
import { tslFn, uniform, vec3, sin, time } from 'three/tsl'

const myShader = tslFn(({ position }) => {
  const wave = sin(position.y.mul(0.5).add(time))
  return vec3(wave, 0.0, 1.0)
})
// Compiles to GLSL for WebGL, WGSL for WebGPU — same source
```
TSL is the right approach for all new shaders. Old GLSL strings still work on WebGL path.

### What WebGPU Specifically Unlocks for Us

#### 1. Compute Shaders → True GPGPU (biggest win)
AT uses FBO ping-pong for particle positions (read texture, write to other texture, swap). WebGPU compute shaders eliminate the FBO entirely — particles live in **storage buffers**, updated in-place.

```wgsl
// compute_particles.wgsl (WGSL, or write in TSL)
@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
  let i = id.x;
  var pos = positions[i];
  var vel = velocities[i];
  
  // Apply forces directly — no texture read/write overhead
  vel += curlNoise(pos * 0.2 + uniforms.time * 0.05) * 0.3;
  vel.y += 0.05;  // slight upward drift
  pos += vel * uniforms.dt;
  
  // Wrap
  if (pos.y > 40.0) { pos.y = -5.0; }
  
  positions[i] = pos;
  velocities[i] = vel;
}
```

**Performance**: AT's 50k particles at ~3ms/frame → WebGPU compute → **500k particles at ~1ms/frame**.  
CellBE environment: 262k particles (full 512² GPGPU) becomes feasible at 60fps.

#### 2. Real Fluid Simulation as Compute
AT runs Navier-Stokes as 8 sequential render-to-texture passes (8 draw calls per frame). WebGPU runs it as **one dispatch** with proper memory barriers between steps.

```ts
// FluidCompute.ts
class FluidCompute {
  velocityBuffer: GPUBuffer   // vec2 per texel, ping-pong pair
  pressureBuffer: GPUBuffer
  divergenceBuffer: GPUBuffer
  
  dispatch(encoder: GPUCommandEncoder) {
    // All 8 Navier-Stokes steps in one command buffer
    // Between steps: memory barriers, not full pipeline flushes
    // Result: ~3× faster than FBO approach at same resolution
    this.dispatchAdvection(encoder)
    this.dispatchVorticity(encoder)
    this.dispatchDivergence(encoder)
    this.dispatchPressure(encoder)  // 4 Jacobi iterations in one dispatch
    this.dispatchGradientSubtract(encoder)
    this.dispatchSplat(encoder)
  }
}
```

Full Navier-Stokes fluid sim is now in budget. Mouse trail can be real fluid, not just spring physics.

#### 3. Indirect Draw — Variable-Count Geometry
WebGPU supports **indirect draw calls**: GPU computes how many vertices to draw, CPU never reads back the count. Perfect for variable-density particle effects (rain only where camera faces, LOD without CPU bottleneck).

#### 4. Storage Textures — Write in Compute, Read in Vertex
AT's GPGPU requires: write to texture A in fragment shader → swap → read A in vertex shader (2 passes minimum). WebGPU: compute writes to storage texture → vertex shader reads it **same frame**, **same buffer**. No copies.

#### 5. Timestamp Queries — Real Performance Budget
```ts
// Know exactly how long each pass takes (GPU time, not CPU)
const query = device.createQuerySet({ type: 'timestamp', count: 2 })
// → "bloom: 0.4ms | fluid: 0.8ms | particles: 0.3ms | total: 6.2ms"
// → auto-disable expensive passes when > 12ms/frame budget
```

### Migration Plan

Phase 0 (now): Keep `WebGLRenderer`, finish architecture  
Phase 1 (after environments work in WebGL): Switch to `WebGPURenderer`, verify visual parity  
Phase 2: Migrate particle systems to compute shaders (one environment at a time)  
Phase 3: Migrate fluid sim to compute  
Phase 4: TSL all custom shaders for portability  

**Risk**: WebGPURenderer still has occasional edge-case bugs. Never ship WebGPU-only — always keep the `WebGPU.isAvailable()` guard.

### What Stays the Same
- All Three.js geometry (BoxGeometry, TubeGeometry, InstancedMesh) — identical API
- All GSAP animations — not GPU-side
- Post-processing (Three.js WebGPURenderer has its own post stack, API slightly different but same passes)
- All DOM/CSS overlays

### WebGPU Particle Budget (Revised Upward)

| System | WebGL Budget | WebGPU Budget |
|--------|-------------|--------------|
| GPGPU per environment | 262k (512²) | 1M+ (1024²) |
| Rain streaks | 8,000 | 25,000 |
| City ambient particles | 100/district | 500/district |
| Rain splashes | 200 | 1,000 |
| Fluid sim resolution | 256² (limited) | 512² (comfortable) |
| Total particles | ~280k | ~1.1M |

---

## Scene Architecture

### Section Map

| Section | Title | Environment | Camera | City Visible |
|---------|-------|-------------|--------|-------------|
| 0 | LANDING | Procedural city + holographic name | High altitude → dive | ✅ |
| 1 | ABOUT | City alley with holographic panels | Street level | ✅ |
| 2 | PS3 Cell GPU | Inside Cell BE die (bird's eye) | Y=25, looking down | ❌ |
| 3 | CPUonGPU | Vast GPU shader-core grid | Y=35, looking down-fwd | ❌ |
| 4 | GPU Streaming | Linear pipeline corridor | Mid-height side-on | ❌ |
| 5 | Selkies-Rust | Particle transformation (Python→Rust) | Close, level | ❌ |
| 6 | Oris AI | Holographic investigation wall | Eye level, facing wall | ❌ |
| 7 | VajraGrid | HV transmission towers + catenary | Street, looking up | ✅ partial |
| 8 | Netflip VOD | CDN edge node network map | Aerial, tilted | ❌ |
| 9 | Coding Arena | Colosseum ring with code brackets | Inside ring looking in | ❌ |
| 10 | VidyaMitra | Knowledge tower stacking books | Low looking up | ❌ |
| 11 | Skills | Skill node graph (force-directed) | Free-floating | ❌ |
| 12 | Achievements | Trophy hall, confetti, plaques | Inside, level | ❌ |
| 13 | Contact | CRT terminal, rain outside window | Close, intimate | ✅ partial |

---

## Per-Scene Micro-Design

### Section 2 — PS3 Cell BE (`CellBEEnvironment`)

**What it is**: You are looking down at the actual Cell Broadband Engine die layout. Silicon scale.

**Geometry**:
- Ground plane = silicon substrate shader (hex lattice procedural, animated current pulses along traces)
- Center: PPE core — octagonal box, amber-gold glow, labeled `PPE`
- Ring of 6: SPU cores — hexagonal prisms, cyan glow, labeled `SPU-0` through `SPU-5`
- Ring of 8: outer EIB (Element Interconnect Bus) — torus tube with data packets racing around it at 300 GB/s pace
- Connecting lines: thin tube geometry from PPE → EIB, SPUs → EIB

**Entry animation** (`uVisible` 0→1):
```glsl
// PPE rises from substrate (no spiral, straight up — it's the fixed master)
pos.y -= pow((1.0 - uVisible), 1.4) * 8.0;

// SPUs spiral in from their positions (each has aDelay attribute)
float t = clamp((uVisible - aDelay) / (1.0 - aDelay), 0.0, 1.0);
float radius = mix(4.0, 0.0, cubicOut(t));
pos.x += cos(aAngle + (1.0 - t) * PI * 2.0) * radius;  // spiral inward
pos.z += sin(aAngle + (1.0 - t) * PI * 2.0) * radius;
pos.y -= pow(1.0 - t, 1.15) * 12.0;

// EIB ring expands from zero radius
float ringScale = cubicOut(clamp((uVisible - 0.4) / 0.6, 0.0, 1.0));
pos.xz *= ringScale;
```

**Continuous animation**:
- Data packets (small instanced cubes) race around EIB ring using animated `t` uniform for position
- SPUs pulse emissive brightness: `0.5 + 0.5 * sin(time * 2.0 + coreIndex * 1.0)` — staggered
- Occasional "data burst" from PPE to random SPU: bright line geometry that spawns and fades

**Hover** (raycasting):
- Hover any SPU → scale 1→1.3, show info card: "SPU-N: 256KB LS | 25.6 GFLOPS"
- Hover PPE → show: "PPE: PowerPC 970 | 3.2 GHz | L2: 512KB"
- Hover EIB → show: "Ring bus: 300 GB/s bidirectional"

**Substrate shader** (fragment, PlaneGeometry):
```glsl
// Hex grid via dual-lattice method
vec2 hex = hexCoord(vWorldPos.xz * 0.5);
float line = smoothstep(0.45, 0.42, length(hex));
// Animated current pulses along random trace directions
float traceDir = floor(cnoise(vWorldPos.xz * 0.1) * 6.0) / 6.0 * TAU;
float pulse = fract(dot(vWorldPos.xz, vec2(cos(traceDir), sin(traceDir))) * 0.3 - time * 0.8);
pulse = smoothstep(0.0, 0.1, pulse) * smoothstep(0.3, 0.1, pulse);
vec3 silicon = vec3(0.06, 0.06, 0.12);
vec3 trace   = vec3(0.0, 0.8, 1.0);
color = mix(silicon, trace, line * 0.4 + pulse * 0.6);
```

---

### Section 3 — CPUonGPU (`GPUGridEnvironment`)

**What it is**: You are in orbit above a vast GPU compute array. 2048 shader cores arranged in a 64×32 grid. One amber zone in the center is where the x86 instruction decoder runs.

**Geometry**:
- Single `PlaneGeometry(64, 32)` with procedural shader = the entire GPU array (1 draw call)
- Camera at Y=35, looking slightly down and forward. Array stretches to horizon.
- 3 floating "JIT pipeline" panels to the left/right: show `mov eax, ebx → vmovaps ymm0, ymm1 → vfmadd231ps`
- Wavefront progress bar above the grid: thin horizontal line sweeping left to right

**Grid shader** (the key technique — NOT instanced meshes):
```glsl
uniform float uTime;
uniform float uWavefront;  // 0→64, sweeping left-to-right
varying vec2 vUv;

void main() {
    vec2 grid = vec2(64.0, 32.0);
    vec2 cell = floor(vUv * grid);
    vec2 cellUV = fract(vUv * grid);
    float gap = 0.1;
    float inside = step(gap, cellUV.x) * step(gap, cellUV.y)
                 * step(cellUV.x, 1.0-gap) * step(cellUV.y, 1.0-gap);
    
    // Stable per-cell hash
    float h = fract(sin(dot(cell, vec2(127.1, 311.7))) * 43758.5453);
    
    // x86 zone: 8×8 block in center
    vec2 center = vec2(32.0, 16.0);
    float isX86 = step(length(cell - center), 5.0);
    
    // Per-cell activity: random blinking
    float activity = step(0.65, fract(h * 10.0 + uTime * (0.3 + h * 0.7)));
    
    // Wavefront sweep: bright horizontal band advancing
    float waveDist = abs(cell.x - uWavefront);
    float waveFront = smoothstep(3.0, 0.0, waveDist);
    
    // CU cluster borders (8 CUs of 8×4 cells each)
    vec2 cuCell = mod(cell, vec2(8.0, 4.0));
    float cuBorder = step(max(cuCell.x, cuCell.y), 0.5) * 0.08;
    
    vec3 gpuColor = mix(vec3(0.0, 0.35, 0.55), vec3(0.0, 0.5, 0.8), activity);
    vec3 x86Color = mix(vec3(0.5, 0.25, 0.0), vec3(0.9, 0.5, 0.0), activity);
    
    vec3 color = mix(gpuColor, x86Color, isX86);
    color *= inside;
    color += waveFront * vec3(0.2, 0.6, 1.0) * inside;
    color += cuBorder;
    
    gl_FragColor = vec4(color, inside * 0.95 + 0.03);
}
```

**Entry animation** (`uVisible`):
- `uWavefront` animated from -10 to 64 as uVisible goes 0→1 (the grid "boots up" from left to right)
- JIT panels rise from below with stagger delays
- Camera starts high and tilts down as uVisible increases

**Hover**: Mouse position projects onto grid plane → highlight entire CU cluster containing cursor, show: "CU #N: 64 ALUs | SIMT width: 32"

---

### Section 4 — GPU Streaming (`StreamingEnv`)

**What it is**: A linear pipeline in space. Left to right: Screen capture → NVENC box → fiber cable → WebRTC antenna → expanding RF rings → distant viewer. You watch data packets flow the whole path in real-time.

**Geometry** (left-to-right along Z axis, camera looking along it):
- `LEFT`: Large flat screen with video noise shader (`mod(fract(uv * 512.0 + time) * 10.0)` as frame capture visualization)
- `CENTER-LEFT`: NVENC encoder box — dark metal with `NV-ENC` holographic label, input/output ports with blinking lights
- `CENTER`: Curved `TubeGeometry` fiber cable from NVENC to antenna (catenary curve `y = a*cosh(x/a)`)
- `CENTER-RIGHT`: WebRTC antenna tower — thin vertical pole with 3 horizontal elements, pulsing
- `RIGHT`: Expanding concentric ring planes (3 rings, different radii, animated outward propagation)

**Fiber shader** (the optical fiber look):
```glsl
// Animated light pulse traveling along tube
float t = mod(vUv.x * 2.0 - uTime * 1.2, 1.0);  // 2 simultaneous pulses
float pulse = smoothstep(0.0, 0.08, t) * smoothstep(0.18, 0.08, t);
vec3 fiber = mix(vec3(0.02, 0.0, 0.05), vec3(0.8, 0.4, 1.0), pulse * 2.0);
gl_FragColor = vec4(fiber, 0.6 + pulse * 0.4);
```

**RF ring shader**:
```glsl
// Rings expand outward at "light speed" and fade
float ringPhase = mod(uTime * 0.4 + vRingIndex * 0.33, 1.0);
float radius = ringPhase * 8.0;
float ring = smoothstep(0.08, 0.0, abs(length(vWorldPos.xz) - radius));
ring *= 1.0 - ringPhase;  // fade as it expands
vec3 color = mix(vec3(0.0, 0.8, 0.4), vec3(0.0, 0.4, 1.0), ringPhase);
```

**Data packets**: 12 instanced small cubes, positions animated along the pipeline path using JS-updated instanceMatrix. Speed = `< 1 frame latency` → very fast, barely visible as streaks.

**Latency counter**: `< 1 FRAME` blinking in green neon text above NVENC box.

**Entry animation**: NVENC box rises from below, fiber cable uncoils left-to-right (animate tube vertex positions from zero length), rings start from radius 0.

---

### Section 5 — Selkies-Rust (`RustTransformEnv`)

**What it is**: Particles dissolve from blue (Python) into orange (Rust). A gear made of assembling fragments. 6 floating crate labels (cargo crates) connect to a central `tokio` runtime core.

**Geometry**:
- 2000 GPGPU particles: each has `aLanguage` attribute (0=Python/blue, 1=Rust/orange)
- Over time (driven by `uProgress` 0→1): `aLanguage = 0` particles dissolve and reform as `aLanguage = 1`
- Central sphere = tokio runtime, emissive orange
- 6 orbital crates (thin box geometry) labeled: `selkies-core`, `gst-plugin`, `input-handler`, `webrtc-rs`, `nvenc-bridge`, `x11-capture`

**Transformation particle shader**:
```glsl
// Language transition: particles slide from Python cluster to Rust cluster
float t = clamp((uProgress - aDelay) / (1.0 - aDelay), 0.0, 1.0);
t = cubicInOut(t);
vec3 pos = mix(aPythonPos, aRustPos, t);
// Size pulses at transition moment
float transitionBurst = smoothstep(0.3, 0.0, abs(t - 0.5));
gl_PointSize *= 1.0 + transitionBurst * 2.0;
// Color shifts blue→orange
vec3 color = mix(vec3(0.2, 0.4, 0.8), vec3(0.9, 0.4, 0.1), t);
color += transitionBurst * vec3(1.0, 0.8, 0.0);
```

---

### Section 6 — Oris AI (`SREEnvironment`)

**What it is**: A holographic detective board floating in dark space. Walls of scrolling log streams converge on a central analysis orb. Anomalies pulse red. A PR card materializes when detection fires.

**Geometry**:
- 4 `PlaneGeometry` panels arranged in arc: each has scrolling log text shader
- Central orb: `IcosahedronGeometry` (detail 4), wireframe with `uVisible`-driven assembly
- 3 connecting beams from panels to orb (thin `CylinderGeometry`, additive blend)
- PR card: flat plane that materializes from particles (GPGPU: particles converge to form rectangle)
- Trophy badge: hovering `TorusGeometry` with gold emissive, slowly rotating

**Log panel shader**:
```glsl
// Scrolling terminal text (procedural characters via hash)
vec2 charGrid = vec2(40.0, 20.0);  // 40 chars × 20 lines
vec2 charPos = fract(vUv * charGrid);
vec2 charIdx = floor(vUv * charGrid);
// Scroll: shift charIdx.y down over time
charIdx.y = mod(charIdx.y + uTime * 3.0, charGrid.y);
// Hash to char brightness
float h = fract(sin(dot(charIdx, vec2(127.1, 311.7)) + uScrollOffset) * 43758.5);
float isChar = step(0.3, h);  // 70% of cells have a character
// Character shape (just a rectangle approximation for now)
float char = step(0.1, charPos.x) * step(0.1, charPos.y)
           * step(charPos.x, 0.8) * step(charPos.y, 0.85);
// Anomaly highlight: some lines turn red
float isAnomaly = step(0.92, fract(charIdx.y * 0.1 + uAnomaly));
vec3 color = mix(vec3(0.0, 0.7, 0.3), vec3(1.0, 0.1, 0.1), isAnomaly);
gl_FragColor = vec4(color * char * isChar, char * isChar * 0.8);
```

**Anomaly event** (triggered every 8 seconds):
1. One panel's text goes all red
2. Central orb emissive pulses bright
3. Connecting beams flash
4. PR card materializes (particles converge) with label "PR #247 merged"
5. Trophy glows gold for 2 seconds
6. Everything resets, loop continues

**Entry animation**: orb wireframe assembles face-by-face (each face has `aFaceIndex` attribute, `uVisible` threshold per face). Panels slide in from sides.

---

### Section 7 — VajraGrid (`PowerGridEnv`)

**What it is**: 4 high-voltage transmission towers connected by catenary cables. In the background: procedural city (visible). A SCADA terminal panel floats in the foreground. Every 10 seconds: attack (red wave) → defense activates (4 rings) → recovery (green sweep).

**Geometry**:
- 4 towers: composed of `CylinderGeometry` segments, scaffolded with `BoxGeometry` cross-braces. NOT instanced — each tower is a `THREE.Group` with ~12 geometry pieces.
- Catenary cables between towers: parametric curve `y = a * cosh(x/a) - a`, rendered as `TubeGeometry`
- Cable shader: animated arc-flash possibility (near top when attack active)
- 4 concentric rings (defense layers): `RingGeometry` planes, lit from within on defense activation
- SCADA panel: HTML-overlay terminal with live stats OR 3D plane with shader-rendered readout

**Tower material** (weathered metal):
```glsl
// Rust and wear at base, clean at top
float height = crange(vWorldPos.y, 0.0, 30.0, 0.0, 1.0);
float rust = cnoise(vWorldPos * 2.0) * (1.0 - height);  // more rust at bottom
vec3 metal = mix(vec3(0.6, 0.4, 0.2), vec3(0.7, 0.72, 0.74), height);
metal = mix(metal, vec3(0.55, 0.35, 0.15), rust * 0.4);
// Fresnel edge highlight
float f = getFresnel(vNormal, vViewDir, 3.0);
metal += f * vec3(0.3, 0.4, 0.5) * 0.3;
```

**Attack cycle** (10-second loop, JS-driven state machine):
```
0-1s:   Red pulse expands from "attacker" direction (sphere at distance 200 expanding)
1-3s:   Cables flicker (arc flash shader: random bright flashes along cable vUv)
3-5s:   Defense rings activate one by one (uVisible 0→1 per ring with 0.3s stagger)
5-8s:   Green "healing" sweep from tower tops downward
8-10s:  Idle, all systems normal, SCADA shows "NOMINAL"
```

---

### Section 8 — Netflip VOD (`CDNEnv`)

**What it is**: Aerial view of a network topology map. Azure cloud (large glowing sphere) in center, 6 Fastly CDN edge nodes as smaller spheres at various distances, thin streaming tubes connecting them, and 3 "viewer" nodes at edges receiving data.

**Geometry**:
- Origin sphere: `SphereGeometry(3)`, animated "heartbeat" scale pulse, azure blue
- 6 edge nodes: `SphereGeometry(0.8)`, green-white, positioned at varied distances/angles
- Streaming tubes: `TubeGeometry` on CatmullRom curves, animated data flow shader
- HLS segment packets: small instanced cubes moving along tubes

**Data flow tube shader**:
```glsl
// Multiple segments flowing simultaneously
float segmentT = mod(vUv.x * 5.0 - uTime * 0.6, 1.0);
float segment = smoothstep(0.0, 0.15, segmentT) * smoothstep(0.5, 0.15, segmentT);
vec3 color = mix(vec3(0.0, 0.3, 0.6), vec3(0.3, 0.9, 1.0), segment);
// Latency: tube length / speed
```

---

### Section 9 — Coding Arena (`ArenaEnv`)

**What it is**: Inside a cylindrical colosseum. Code brackets `{` `}` float at the top. A central platform shows a judge verdict animation. Leaderboard hologram on one side. Docker whale wireframe orbiting.

**Geometry**:
- `CylinderGeometry(20, 20, 15, 32, 1, true)` — open-ended cylinder as arena walls
- Arena shader: repeating seat pattern via UV + hash, crowd as instanced small boxes
- Floating `{` `}` glyphs: plane geometry + SDF character shader, slowly rotating
- Judge podium: box with animated gavel (cylinder arm, rotates from rest to strike)
- Verdict text: `ACCEPTED` (green) / `WRONG` (red) — plane + SDF shader, materializes on verdict

**Arena wall shader**:
```glsl
// Seat rows: UV grid with per-seat color (some lit, some dark)
vec2 seatGrid = vec2(60.0, 30.0);  // 60 seats wide, 30 rows
vec2 seat = floor(vUv * seatGrid);
float occupied = step(0.4, fract(sin(dot(seat, vec2(127.1, 311.7))) * 43758.5));
vec3 seatColor = mix(vec3(0.1, 0.02, 0.02), vec3(0.3, 0.05, 0.05), occupied);
// Glow from verdict: radial spread when verdict fires
float verdictGlow = uVerdict * smoothstep(2.0, 0.0, length(vUv - vec2(0.5)));
seatColor += verdictGlow * uVerdictColor;
```

---

### Section 11 — Skills (`SkillGraphEnv`)

**What it is**: A force-directed graph of skills as nodes, floating in dark space with connecting edges. Clusters by category: Systems (blue), AI/ML (purple), Web (green), Hardware (amber). Camera floats around it gently.

**Geometry**:
- Skill nodes: `SphereGeometry(r)` where r = proficiency 0.3–1.0. ~30 nodes.
- Edges: thin `CylinderGeometry` between connected nodes, semi-transparent
- Labels: `makeLabel()` sprites on each node
- Force simulation: JS spring-force update (not full d3-force, custom simple repulsion/attraction). Runs in JS, updates instanceMatrix.

**Node hover**: scale 1→1.6, show label with percentage and "used in: [projects]"

---

### Section 12 — Achievements (`TrophyHallEnv`)

**What it is**: A dark hall with two illuminated trophy cases floating in space.

**Trophy Case 1** — TechSynapse Runner-Up:
- Gold `TorusGeometry` trophy, rotating slowly
- Gold neon text: `🏆 RUNNER-UP — TECHSYNAPSE 2026`
- Particle confetti bursting upward when camera enters (GPGPU: 300 particles rising with gravity)

**Trophy Case 2** — India Innovates Exhibition:
- Tricolor-accented flat plaque panel with `🇮🇳` and `BHARAT MANDAPAM 2026`
- Subtle Indian flag color gradient on edges

**Confetti shader**:
```glsl
// Particles rise, affected by gravity, random colors
pos.y += uTime * mix(2.0, 5.0, aRandom.x);  // rise speed
pos.y -= 0.5 * 9.8 * uTime * uTime;          // gravity
pos.x += sin(uTime * 3.0 + aRandom.z * 20.0) * 0.3;  // drift
// Color: random from palette
vec3 color = mix(vec3(1.0, 0.8, 0.0), vec3(1.0, 0.2, 0.4), aRandom.w);
```

---

## City + Background (Sections 0, 1, 7, 13)

### Building Close-Up Detail Shader
Current buildings lack detail when close. Add to `buildingFrag`:
```glsl
// Distance-based detail blend
float camDist = length(vWorldPos - cameraPosition);
float closeBlend = smoothstep(40.0, 12.0, camDist);

// Floor ledge bands (horizontal concrete lines)
float floorCount = 12.0;
float ledge = smoothstep(0.06, 0.01, fract(vUv.y * floorCount));

// Corner edge glow (vertical neon trace at building corners)
float cornerDist = min(vUv.x, 1.0 - vUv.x);
float cornerEdge = smoothstep(0.04, 0.0, cornerDist);

// Concrete surface noise (close-up grain)
vec2 noiseUV = floor(vUv * vec2(60.0, 120.0));
float grain = fract(sin(dot(noiseUV, vec2(127.1, 311.7))) * 43758.5);

// Apply only when close
color.rgb += ledge * closeBlend * 0.08 * vec3(1.0, 1.0, 1.2);
color.rgb += cornerEdge * closeBlend * neonColor * 0.4;
color.rgb += (grain - 0.5) * closeBlend * 0.04;
```

### Ground Reflection Enhancement
Add to `groundFrag`:
```glsl
// Wet asphalt: mirror-like at grazing angles
float f = getFresnel(vNormal, vViewDir, 4.0);
// Puddle pattern: voronoi-based
float puddle = smoothstep(0.4, 0.45, fract(cnoise(vWorldPos.xz * 0.3)));
// Reflect bloom pass (if available as uniform)
color.rgb = mix(color.rgb, reflectedColor * 0.8, f * puddle);
```

### Rain Enhancement
Current rain is basic. Add:
- Camera lens rain overlay: full-screen quad with animated water drops (UV-space circles that fall and spread)
- Rain splash particles at ground level: instanced small circles, spawn from rain hit positions
- `rainLensShader`: droplet SDF on screen, distorts behind like real water

---

## Post-Processing Pipeline

Stack (order matters):

```
1. RenderPass              — main scene render
2. Custom WetLens pass     — rain on lens (optional, disabled when no rain)
3. UnrealBloomPass         — threshold: 0.55, strength: 1.8, radius: 0.4
4. Custom LensStreak pass  — directional horizontal streak from bright sources
5. Custom VolumetricLight  — 20-step radial from street lamps' screen positions
6. Custom RGBShift pass    — angle: 120°, amount: 0.0008 base + 0.003 on transition
7. Custom Scanlines pass   — 0.08 opacity, 2px spacing, slow drift
8. Custom FilmGrain pass   — 0.03 opacity, animated noise
9. Custom Vignette pass    — 0.35 intensity
10. OutputPass             — tone mapping + gamma
```

Detailed shader for each pass exists in AT source or is straightforward.  
**Lens streak** implementation: `LensFlarePrefilter` → horizontal downsample (`LensFlareDown/Up`) → `CompositeStreak`.  
Use `CompositeStreak.glsl` from AT directly — it handles halo ring SDF, chromatic streak, glow.

---

## Interaction System

### Mouse Trail
Not full Navier-Stokes — simpler spring physics:
```ts
// In main.ts update loop:
mouse.lerp(targetMouse, 0.08 * HZ)  // smooth follow
velocity = targetMouse - mouse        // velocity for streak
// Pass to shaders: uMouse, uMouseVelocity
// ShaderPass: UV distortion = uMouseVelocity * gaussianFalloff(dist to mouse)
```

### Hover (Raycaster)
Each environment exposes `hoverTargets: THREE.Object3D[]`.  
In EnvironmentManager.update():
```ts
raycaster.setFromCamera(mouseNDC, camera)
const hits = raycaster.intersectObjects(activeEnv.hoverTargets)
activeEnv.onHover(hits[0]?.object ?? null)
```

### Info Cards
Hover triggers a `<div class="info-card">` positioned via `THREE.Vector3.project()` to screen space.  
Card enters with `transform: translateY(8px) → translateY(0)` CSS transition, 150ms.  
Content = environment-specific HTML injected by environment class.

### Keyboard Navigation
- Arrow keys / scroll: section navigation (existing)
- `W`/`E`: warp to prev/next section instantly
- Konami code: wireframe mode toggle

---

## Loading Screen

```
╔══════════════════════════════════════════════════════╗
║  NEON DISTRICT  v2.0 ── D. SHANTAN DHEER             ║
║  ─────────────────────────────────────────────────── ║
║                                                      ║
║  [BOOT] Initializing WebGL2 context...          [OK] ║
║  [BOOT] Generating city geometry...             [OK] ║
║  [BOOT] Compiling 47 shader programs...         [OK] ║
║  [BOOT] Spawning rain particles...              [OK] ║
║  [BOOT] Calibrating post-processing chain...    [OK] ║
║  [BOOT] Environments ready...                   [OK] ║
║                                                      ║
║  ██████████████████████████████░░░░  84%             ║
║                                                      ║
║  press ENTER or scroll to enter the district         ║
╚══════════════════════════════════════════════════════╝
```

Progress bar tied to actual Three.js `LoadingManager.onProgress`.  
Each boot line appears when its corresponding async task resolves.  
Final line glitches in with `@keyframes glitch` CSS animation.

---

## Performance Budget

Target: 60fps on GTX 1060 / RX 580. Degrade gracefully on integrated GPU.

| System | Budget | Notes |
|--------|--------|-------|
| City buildings | 2000 instances | 3 InstancedMesh types, 1 draw call each |
| Rain particles | 8000 points | Points geometry, custom vert/frag |
| Environment geo | < 50k tris | Per environment, only one active at a time |
| GPGPU particles | 512×512 = 262k | For sections 2/5 only |
| Post-processing | 8 passes | Disable grain + streak on mobile |
| Shadow maps | 0 | All fake (emissive + bloom) |
| Texture memory | < 128MB | Use compressed textures where possible |

### Mobile Fallback
```ts
const isLowEnd = renderer.capabilities.maxVaryings < 16 
  || !renderer.capabilities.isWebGL2
if (isLowEnd) {
  bloomPass.strength = 0.8;
  rainSystem.count = 2000;
  postChain.removePass(lensStreakPass);
  postChain.removePass(filmGrainPass);
  environments.forEach(e => e.simplify());  // each env has a simplified mode
}
```

---

## Shader Inventory We Need to Write

### New shaders (not in AT):
| Shader | Purpose |
|--------|---------|
| `siliconSubstrate.frag` | Hex lattice with current pulses for Cell BE floor |
| `gpuGrid.frag` | 64×32 procedural GPU core array |
| `fiberOptic.frag` | Animated light pulse traveling along tube |
| `rfRing.frag` | Expanding radio frequency rings |
| `logPanel.frag` | Scrolling procedural terminal text |
| `catenary.vert` | Catenary curve deformation for power cables |
| `hvCable.frag` | Weathered cable with arc-flash possibility |
| `arena.frag` | Colosseum seat rows via UV grid |
| `lensRain.frag` | Lens water droplets (screen-space) |
| `buildingDetail.frag` | Enhanced building with floor ledges + corner edges |

### Borrowed directly from AT (copy + adapt):
| AT Shader | Our Use |
|-----------|---------|
| `simplenoise.glsl` → `cnoise()` | Everywhere — organic motion, fog, grain |
| `curl.glsl` | Particle trail flow fields |
| `fresnel.glsl` | Building edges, glass panels, hologram borders |
| `eases.glsl` | Shader-side animation easing |
| `range.glsl` → `crange()` | Everywhere |
| `blendmodes.glsl` | Material layering |
| `rgbshift.fs` | Chromatic aberration |
| `VolumetricLight.fs` | Street lamp god rays |
| `transformUV.glsl` | UV scale/rotate |
| `sdfs.glsl` pattern | Logo/icon SDF rendering |
| `AntimatterPosition.vs` pattern | GPGPU particle position readback |
| `GlobalComposite.fs` structure | Our main composite pass (adapted) |
| `UnrealBloom*.glsl` | Bloom pipeline (Three.js has this, use it) |
| `CompositeStreak.glsl` | Lens streak composite |
| `FXAA.glsl` | Anti-aliasing |

---

## What Makes This Different from AT

| | Active Theory | Neon District |
|--|------|------|
| **World** | Abstract studio space | Cyberpunk city + abstracted interiors |
| **Content** | Product portfolio (closed) | Engineering portfolio (technical projects) |
| **Metaphors** | Aesthetic beauty | Functional precision — scenes show what code does |
| **Interactivity** | Hover cards, mouse fluid | Per-element technical readouts, event simulations |
| **City** | No city | Full procedural city as base world |
| **Weather** | None | Rain, fog, lightning |
| **Audio** | Background music | Rain ambience + UI electric sounds |
| **Particle count** | ~50k max | Up to 262k (GPGPU) |
| **Transitions** | `uVisible` vertex deform | Same + camera GSAP spline flight |
| **Narrative** | Studio → work → contact | Explore city → dive into project realities |

---

## Open Questions / Decisions Needed

1. **GPGPU or JS particles** for sections 2 and 5? GPGPU = better visual but harder to debug. JS = easier hover detection.
2. **Section order** — should Selkies-Rust be before or after streaming? The pipeline makes more sense as: GPU work → streaming → AI → power.
3. **Info cards**: HTML overlay (easy, SEO-friendly) or 3D billboard geometry (more immersive)? Recommend HTML overlay positioned via project().
4. **Mobile**: 2D CSS fallback or just LOD reduction? Recommend LOD reduction since most of this looks passable at half res.
5. **Sound**: ambient rain always on (muted by default, toggle button) or opt-in only? Recommend opt-in with a subtle "🔊" button.
6. **Contact section**: CRT terminal is iconic but slow to type in. Should it auto-type or wait for user? Recommend: auto-type on enter, user can interrupt with real typing.

---

---

# MICRO-DETAIL EXPANSION — Surroundings, Effects & Implementation

> This section covers everything that isn't the main scene geometry: the city fabric, atmospheric layers, transition effects, particle life, camera behavior, district identity, and implementation contracts. If the main scenes are the nouns, this is the grammar holding the world together.

---

## I. City World — Street Level Fabric

### A. Street Layout & Districts

The city is divided into **named districts** that the camera passes through. Each district has its own dominant color temperature, building density, and ambient life.

```
DISTRICT MAP (top-down, camera path flows through them):

[APEX SPIRE]  →  [SILICON ROW]  →  [DEEP GRID]  →  [SIGNAL YARD]
  sect 0-1          sect 2-4          sect 5-7         sect 8-10
  cold white        warm amber        teal + blue       green + static
  glass towers      low/medium bldg   underground       industrial
```

| District | Neon Palette | Fog Color | Density | Vibe |
|----------|-------------|-----------|---------|------|
| Apex Spire | `#e0f0ff`, `#aaddff` | `#0a1520` | Very high, sky-touching towers | Finance, tech HQ |
| Silicon Row | `#ffcc00`, `#ff8800` | `#100a00` | Medium, older buildings | Hardware labs, workshops |
| Deep Grid | `#00f5ff`, `#0066ff` | `#000d1a` | Dense low-rise | Server farms, data centers |
| Signal Yard | `#00ff88`, `#00cc44` | `#001408` | Sparse, industrial | Transmission, grid infrastructure |

**Implementation**: `CityGenerator.ts` already zones by section index. Expand to set per-district:
- `districtFogColor: THREE.Color`
- `districtNeonPalette: THREE.Color[]` (3 colors per district used by building shader `uNeonColor`)
- `districtBuildingHeight: [min, max]`

---

### B. Street Level Detail Objects (LOD-gated, within 30 units of camera)

These are individual `THREE.Group` objects, placed procedurally along street edges. They do **not** cast shadow maps — all shading is emissive + AO approximation.

#### 1. Street Lamps
```
Geometry:
  - Post:    CylinderGeometry(0.04, 0.06, 5, 6)   — hexagonal pole
  - Arm:     CylinderGeometry(0.03, 0.03, 2, 4) rotated 80° — cantilevered
  - Head:    BoxGeometry(0.4, 0.15, 0.4) — lamp housing, dark metal
  - Bulb:    SphereGeometry(0.08, 8, 6) — emissive white/amber, MeshBasicMaterial

Visual tricks:
  - VolumetricLight cone below bulb: PlaneGeometry facing down, cone-shaped UV mask,
    alpha 0.15, additive blend, emissive color matches district palette
  - God ray: full-screen VolumetricLight pass samples this bulb's screen-space position
  - Rain diffraction halo: ring sprite (256×256 texture, radial gradient) around bulb,
    billboard-aligned, opacity 0.4, scale pulses 1.0→1.15 on 3s sine
  - Flicker: each lamp has a random flicker timer. 2% chance per frame to dim to 0.3
    for 80ms then snap back. Probability increases near "damaged" district markers.
```

**Placement**: Every 15 units along street edges. Offset ±0.5 random. Alternate sides.

#### 2. Steam Vents (manhole covers)
```
Geometry:
  - Cover: CylinderGeometry(0.4, 0.4, 0.05, 12) — dark iron
  - Grille: custom geometry with slots cut via UV masking shader
  - Steam: particle system — 40 SphereGeometry(0.02) instances, upward velocity
           + cnoise horizontal drift, fade to transparent at Y+2, loop

Steam particle shader:
  float age = mod(uTime + aOffset, uLifetime) / uLifetime;  // 0→1 age
  pos.y += age * 2.5;                       // rise
  pos.xz += cnoise(pos * 0.5 + uTime) * 0.3; // drift
  float alpha = smoothstep(0.0, 0.2, age) * smoothstep(1.0, 0.6, age);
  gl_PointSize = mix(4.0, 18.0, age) * DPR; // expand as it rises
  color = vec3(0.7, 0.7, 0.8);              // cool white steam
```

**Frequency**: Every 30–50 units along alley floors, only in Deep Grid and Signal Yard districts.

#### 3. Neon Signs (procedural + readable)
Signs are flat `PlaneGeometry` with a custom `neonSign.frag` shader. Text is NOT a canvas texture — it's SDF-rendered procedurally from encoded character data.

For performance, only 5–8 unique sign "templates" exist, randomized per placement:

```
TEMPLATES:
  "CYBER RAMEN"          — horizontal, warm red  #ff2200
  "NET-LINK 24/7"        — vertical stack, cyan  #00eeff
  "DATA HAVEN"           — wide horizontal, blue #0055ff
  "VOID ARCADE"          — blinking, magenta     #ff00cc
  "ZERO LATENCY"         — diagonal bars, green  #00ff66
  "SYSTEM FAILURE ▓▓▓"  — glitchy, red+white    #ff4400
  "御用禁止"              — kanji, white+red       #ffffff
  "UPLOAD COMPLETE"      — status, green+dark    #00cc44
```

**Neon Sign Shader**:
```glsl
uniform float uTime;
uniform vec3 uColor;
uniform float uFlicker;    // per-sign random, updated in JS

void main() {
    // Tube glow: bright center, falloff outward
    float dist = length(vUv - 0.5);
    float tube = smoothstep(0.04, 0.0, dist);  // the actual lit tube
    float halo = smoothstep(0.4, 0.0, dist) * 0.3;
    
    // Flicker: occasional dimming, stochastic
    float flicker = 1.0 - uFlicker * smoothstep(0.95, 1.0, fract(uTime * 47.3));
    
    // Color: base + white hot center + halo glow
    vec3 color = uColor * (tube * flicker + halo);
    color += vec3(1.0) * tube * flicker * 0.5;  // white-hot center
    
    // Power buzz: subtle high-frequency noise on tube
    float buzz = cnoise(vec2(vUv.x * 80.0, uTime * 30.0)) * 0.05;
    color += uColor * buzz * tube;
    
    gl_FragColor = vec4(color, tube + halo);
}
```

**Sign body** (dark housing behind the tubes): `MeshStandardMaterial` with roughness 0.9, metalness 0.3. The sign body slightly occludes scene behind it.

**Animation states**:
- `STATIC` — steady glow, just flicker noise
- `BLINK` — 0.5Hz square wave, alternates between 100% and 0% brightness
- `PULSE` — 0.2Hz sine, 60%→100%→60% intensity
- `GLITCH` — rapid random segment dropouts, 0.1s duration, fires every 3–8s

Assign states randomly at generation time: 60% static, 25% pulse, 10% blink, 5% glitch.

#### 4. Shop Windows (ground floor, close range only)
Visible below `Y=4` on buildings within 20 units of camera. Procedural "shop interior" via shader:

```glsl
// Window: PlaneGeometry flush with building face, slightly inset
// Interior simulation: a warm grid of shelves/products hinted by color blobs

float shelf = smoothstep(0.02, 0.0, fract(vUv.y * 5.0));  // 5 shelf lines
float product = step(0.7, fract(sin(dot(floor(vUv * vec2(8.0, 5.0)), 
                                        vec2(127.1, 311.7))) * 43758.5));
vec3 warmAmber = vec3(0.9, 0.7, 0.3);
vec3 interior = warmAmber * (shelf * 0.2 + product * 0.4);

// Window reflection: tint + subtle fresnel
float f = getFresnel(vNormal, vViewDir, 4.0);
vec3 reflection = sceneColor * 0.15;  // tRefraction sampled
color = mix(interior, reflection, f * 0.4);
```

#### 5. Cable Wires Between Buildings
Procedural catenary curves connecting building tops. Important for depth and atmosphere.

```ts
// CableSystem.ts
// For each pair of buildings within 25 units, 30% chance to add a cable
// Catenary: y = a * cosh(x/a) - a, with a tuned for sag

function catenary(x: number, span: number, sag: number): number {
  const a = span * span / (8 * sag);
  return a * Math.cosh(x / a) - a;
}

// Each cable: TubeGeometry(CatmullRomCurve3(32 points), 3, 0.015, 4)
// Material: MeshBasicMaterial, dark grey #222, emissive 0
// Some cables: random chance to have blinking lights (small SphereGeometry 
//              emissive cubes spaced 2 units apart)
```

**Performance**: Max 50 cables total. Only generate for buildings the camera will pass near.

#### 6. Ground Detail
**Base layer**: `PlaneGeometry(400, 400, 1, 1)` with `groundFrag` shader (existing, enhance).

**Puddle system** (the most impactful ground detail):
```glsl
// groundFrag additions:

// Puddle mask: Voronoi-based irregular patches
float voronoi(vec2 uv) {
    vec2 i = floor(uv);
    vec2 f = fract(uv);
    float minDist = 1.0;
    for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
            vec2 neighbor = vec2(float(x), float(y));
            vec2 point = fract(sin(dot(i + neighbor, vec2(127.1, 311.7))) 
                                * 43758.5453) + neighbor;
            minDist = min(minDist, length(f - point));
        }
    }
    return minDist;
}

float puddleMask = smoothstep(0.3, 0.4, voronoi(vWorldPos.xz * 0.4));

// Puddle surface: animated rain ripples
float ripple(vec2 uv, float t) {
    float r = length(uv);
    return sin(r * 20.0 - t * 8.0) * exp(-r * 4.0);
}
// 6 ripples per puddle at random offsets, spawned at rain drop interval
float rippleSum = 0.0;
for (int i = 0; i < 6; i++) {
    vec2 offset = vec2(uRipplePos[i]) * 0.5;  // pre-computed random offsets
    float age = mod(uTime + uRipplePhase[i], 1.2) / 1.2;
    float r = ripple((vWorldPos.xz - offset) * 2.0, uTime + uRipplePhase[i]);
    rippleSum += r * (1.0 - age) * 0.3;
}

// Puddle color: reflects bloom (approximated as uBloomColor uniform)
vec2 reflUV = gl_FragCoord.xy / uResolution;
reflUV += rippleSum * 0.01;
vec3 puddleColor = texture2D(tBloom, reflUV).rgb * 2.0;
puddleColor += uDistrictNeon * 0.3;

color.rgb = mix(color.rgb, puddleColor, puddleMask * 0.7);
```

**Asphalt detail** (close range):
- Road line markings: white/yellow stripes, partially worn away via noise mask
- Crack pattern: Voronoi edge detection, dark gaps with slight AO darkening
- Gum/stain splatters: random dark circles, radius 0.05–0.15 units
- Manhole covers: circular dark iron with cross-hatch UV pattern

---

### C. Sky & Horizon

**Sky dome**: `SphereGeometry(500, 16, 8)` inverted normals. Single `skyFrag` shader.

```glsl
// skyFrag
uniform float uTime;
uniform vec3 uZenithColor;   // near-black: #020408
uniform vec3 uHorizonColor;  // city-glow orange-pink: #1a0810
uniform sampler2D tClouds;   // 512×512 cloud noise texture (tileable)

void main() {
    // Gradient zenith → horizon
    float h = pow(max(0.0, normalize(vWorldPos).y), 0.3);
    vec3 sky = mix(uHorizonColor, uZenithColor, h);
    
    // City glow on horizon: radial warm bloom from city center direction
    float cityGlow = smoothstep(0.4, 0.0, length(normalize(vWorldPos.xz)));
    sky = blendAdd(sky, vec3(0.4, 0.1, 0.05), cityGlow * 0.3 * (1.0 - h));
    
    // Cloud layer: dark with neon-lit undersides
    vec2 cloudUV = vWorldPos.xz / 500.0 * 1.5 + uTime * vec2(0.002, 0.001);
    float cloud = smoothstep(0.45, 0.65, texture2D(tClouds, cloudUV).r);
    float cloudUnderglow = smoothstep(0.3, 0.0, normalize(vWorldPos).y) * cloud;
    sky = mix(sky, sky * 0.3 + uHorizonColor * cloud * 0.5, cloud * 0.6);
    // Neon underglow on cloud bottoms
    sky += uHorizonColor * cloudUnderglow * 0.4;
    
    // Stars: visible at zenith only, tiny bright points
    vec2 starUV = vWorldPos.xz / 500.0 * 8.0;
    float star = step(0.998, fract(sin(dot(floor(starUV * 200.0), 
                                          vec2(127.1, 311.7))) * 43758.5));
    sky += star * h * vec3(0.6, 0.7, 1.0) * 0.8;
    
    gl_FragColor = vec4(sky, 1.0);
}
```

**Distant city silhouette**: `PlaneGeometry` billboard at Z=400, with silhouette shader (black building outlines with lit windows as random bright dots). Adds depth to the sky without geometry cost.

---

## II. Atmospheric Effects — Full Specification

### A. Volumetric Fog System

**Not** actual volumetric fog (too expensive). Achieved via 3-layer compositing:

**Layer 1 — Ground fog** (the most important):
```glsl
// In main scene composite, after tone mapping:
// exponential height fog: thickest at Y=0, gone by Y=15
float fogFactor = exp(-max(0.0, vWorldPos.y) * 0.08);
fogFactor *= exp(-length(vWorldPos - cameraPosition) * 0.004);  // distance fog
fogFactor = clamp(fogFactor, 0.0, 1.0);

// Fog color: district-tinted dark
vec3 fogColor = uDistrictFogColor + uDistrictNeon[0] * 0.08;
// Fog is NOT uniform — it has slow billowing cnoise
float fogNoise = 0.7 + cnoise(vWorldPos * vec3(0.05, 0.2, 0.05) + uTime * 0.02) * 0.3;
color.rgb = mix(color.rgb, fogColor * fogNoise, fogFactor);
```

**Layer 2 — Mid-height atmospheric haze**:
```glsl
// Distance-based blue-shift (aerial perspective)
float dist = length(vWorldPos - cameraPosition);
float hazeFactor = 1.0 - exp(-dist * 0.002);
vec3 hazeColor = vec3(0.04, 0.06, 0.12);  // dark atmospheric blue
color.rgb = mix(color.rgb, hazeColor, hazeFactor * 0.5);
```

**Layer 3 — Full-screen fog pass** (ShaderPass, runs before bloom):
```glsl
// Fog feathers across the full image, tinted by neon colors from below
// Sample the frame, add exponential radial fade toward screen center-bottom
float screenFogFactor = smoothstep(0.0, 1.0, vUv.y) * 0.15;
color.rgb = mix(color.rgb, uFogColor, screenFogFactor);
```

**Fog density changes by district**:
```ts
const fogDensity = { apexSpire: 0.003, siliconRow: 0.005, deepGrid: 0.008, signalYard: 0.006 };
// Lerp fog uniforms as camera crosses district boundaries
```

---

### B. Rain System — Full Detail

**Existing**: Rain geometry exists. What's missing: density variation, lens effect, splashes, sound sync.

#### Rain Streaks (existing, enhance):
```glsl
// rainVert: each streak is a line segment, instanced
// Add wind direction: streaks lean based on camera movement delta
float windLean = uWindDir.x * 0.3;  // uWindDir = smoothed camera velocity X
pos.x += windLean * (1.0 - uv.y);  // top of streak leans more

// rainFrag: add specular bright spot to each streak
float specular = pow(max(0.0, dot(normalize(vViewDir), 
                                  normalize(vec3(0.3, 1.0, 0.2)))), 8.0);
color += vec3(1.0) * specular * 0.4;
```

#### Lens Rain (full-screen post pass):
A screen-space effect. A 512×512 texture stores "wet droplet accumulation". Updated per-frame in JS.

```ts
// LensRainSystem.ts
// Maintain array of active droplets: { x, y, age, size, trailLength }
// Each frame:
//   - Age all droplets, remove if age > maxAge
//   - Occasionally spawn new droplet at random position at top of screen
//   - Draw to offscreen canvas, upload as DataTexture every 2 frames
class LensRain {
  droplets: Droplet[] = []
  canvas: OffscreenCanvas = new OffscreenCanvas(512, 512)
  
  update(dt: number) {
    // Spawn ~0.5 droplets/frame
    if (Math.random() < 0.5) this.spawn()
    
    this.droplets.forEach(d => {
      d.y += d.speed * dt  // fall downward
      d.x += d.drift * dt  // slight horizontal drift
      d.age += dt
      this.draw(d)
    })
    this.droplets = this.droplets.filter(d => d.age < d.maxAge)
  }
  
  draw(d: Droplet) {
    // Draw teardrop SDF shape with smear trail
    // Front: bright specular spot
    // Trail: elongated fade
    const ctx = this.canvas.getContext('2d')!
    const gradient = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.size)
    gradient.addColorStop(0, `rgba(255,255,255,${0.8 * (1 - d.age/d.maxAge)})`)
    gradient.addColorStop(0.3, `rgba(180,200,230,${0.3 * (1 - d.age/d.maxAge)})`)
    gradient.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.ellipse(d.x, d.y, d.size * 0.4, d.size, 0, 0, Math.PI * 2)
    ctx.fill()
  }
}
```

**Lens rain shader** (post-processing pass, before bloom):
```glsl
uniform sampler2D tLensRain;  // the droplet accumulation texture
uniform sampler2D tDiffuse;
void main() {
    vec4 rain = texture2D(tLensRain, vUv);
    // Droplets distort UV (refraction through water)
    vec2 distortedUV = vUv + rain.xy * 0.015;
    vec3 color = texture2D(tDiffuse, distortedUV).rgb;
    // Bright specular on droplets
    color += rain.zzz * 0.4;  // z channel = specular intensity
    gl_FragColor = vec4(color, 1.0);
}
```

#### Rain Splash Particles:
At the ground level, rain hits produce small radial splash rings. 200 instances, rapid lifecycle.
```glsl
// splashVert: each instance is a flat ring, animated outward + fade
float age = mod(uTime + aSpawnTime, 0.4) / 0.4;  // 0.4s lifetime
float radius = age * 0.6;  // expand to 0.6 units
pos.xz *= radius;          // ring expands
pos.y = 0.01;              // sit just above ground

// splashFrag: thin bright ring, fades with age
float ringDist = abs(length(vUv - 0.5) - 0.45);
float ring = smoothstep(0.05, 0.0, ringDist);
float alpha = ring * (1.0 - age) * 0.5;
gl_FragColor = vec4(vec3(0.5, 0.6, 0.8), alpha);
```

---

### C. Lightning System

Rare (every 15–30 seconds), dramatic. Two-step: pre-flash + main strike.

```ts
// LightningSystem.ts
class LightningSystem {
  trigger() {
    // Step 1: pre-flash (0.05s)
    this.ambientLight.intensity = 3.0
    setTimeout(() => this.ambientLight.intensity = 0.3, 50)
    
    // Step 2: main flash (0.1s, slightly offset)
    setTimeout(() => {
      this.ambientLight.intensity = 8.0  // bleaches entire scene white
      this.updateBoltGeometry()           // regenerate fractal bolt
      this.boltMesh.visible = true
      this.triggerThunder()
      setTimeout(() => {
        this.ambientLight.intensity = 0.3
        this.boltMesh.visible = false
        // Step 3: after-glow (1s fade)
        gsap.to(this.skyColorUniform, { value: new Color(0.2, 0.25, 0.4), 
                                        duration: 1.0 })
      }, 100)
    }, 80)
  }
  
  updateBoltGeometry() {
    // Fractal lightning: recursive midpoint displacement
    // Start: top of screen to random city point
    // 4 levels of subdivision, displacement × 0.5 each level
    // Result: CatmullRomCurve3 with 32 points → TubeGeometry(r=0.02)
  }
}
```

**Lightning bolt shader**:
```glsl
// Emissive white-blue, additive blend
float core = smoothstep(0.3, 0.0, length(vUv - 0.5) * 2.0);
float glow = smoothstep(1.0, 0.0, length(vUv - 0.5) * 2.0) * 0.3;
vec3 color = mix(vec3(0.6, 0.7, 1.0), vec3(1.0, 1.0, 1.0), core);
gl_FragColor = vec4(color * (core + glow), core + glow);
```

---

### D. Ambient Particles — City Life

Not characters, not vehicles. Environmental particles that make the world feel inhabited.

#### 1. Ember/Dust Motes (100 particles per district)
Slowly drifting upward, faint orange tint in Silicon Row, blue in Deep Grid.
```glsl
// Very subtle. Size: 1–3 pixels. Alpha: 0.1–0.3. 
// Motion: curl noise drift + slow rise
pos += curlNoise(pos * 0.2 + uTime * 0.05) * 0.3;
pos.y += 0.1 * dt;
if (pos.y > cameraPos.y + 20.0) pos.y = cameraPos.y - 5.0;  // respawn below
```

#### 2. Holographic Ad Billboards (2–3 per district)
Large `PlaneGeometry(8, 4)` floating between buildings. Animated procedural ads.

```glsl
// Billboard shader: animated "scanning line" + color regions
float scanLine = fract(uTime * 0.3 - vUv.y * 2.0);
scanLine = smoothstep(0.0, 0.05, scanLine) * smoothstep(0.1, 0.05, scanLine);

// Procedural "product image": colored regions via noise
float regions = floor(cnoise(vUv * 3.0 + uTime * 0.02) * 4.0) / 4.0;
vec3 adColor = mix(uBrandColor1, uBrandColor2, regions);

// Holographic shimmer: rainbow bands moving downward
float holo = fract(vUv.y * 8.0 - uTime * 0.4);
vec3 holoRainbow = rainbowColor(holo);

color = mix(adColor, holoRainbow, 0.3) * (0.7 + scanLine * 0.4);
// Semi-transparent: alpha 0.85, additively blended edges
float edgeFade = smoothstep(0.0, 0.05, vUv.x) * smoothstep(1.0, 0.95, vUv.x)
               * smoothstep(0.0, 0.05, vUv.y) * smoothstep(1.0, 0.95, vUv.y);
gl_FragColor = vec4(color, edgeFade * 0.9);
```

**Ad content** (text drawn on `CanvasTexture`, uploaded once at load):
```
"UPLOAD YOUR MIND — NEURAL LINK CORP"
"SYNTHETIC RAIN TODAY — WEATHER CTRL BUREAU"
"GCET NEON DISTRICT ALUMNI 2028"
"LATENCY: 0ms — QUANTUM FIBER"
```

#### 3. Screen Flicker Cubes (near building windows)
Tiny box geometry `(0.3, 0.3, 0.3)` placed in window clusters. Emissive material cycles through blue/white/green, simulating terminal screens.
```ts
// Each "screen cluster": 3–8 boxes, slightly different flicker rates
// Material: MeshBasicMaterial, emissive
// JS animation: 
const flickerRate = 0.5 + Math.random() * 2.0  // flicker every 0.5–2.5s
const flickerStrength = 0.3 + Math.random() * 0.7
// Color randomly from: #0040ff, #00ccff, #ffffff, #00ff44
```

---

## III. Camera System — Full Specification

### A. Camera Path Architecture

14 keyframes. Between each, camera travels via **GSAP + CatmullRomCurve3** interpolation.

```ts
// CameraPath.ts
interface Keyframe {
  position: THREE.Vector3   // camera eye
  target: THREE.Vector3     // look-at point
  fov: number               // field of view (default 75)
  rollAngle: number         // camera roll in degrees (default 0, subtle for drama)
  districtId: number        // triggers district fog/color transition
}

// During transition (goTo called):
// 1. Build CatmullRomCurve3 from [current, midpoint, target] for smooth arc
// 2. GSAP tween progress 0→1 over 1.2s with 'power2.inOut'
// 3. At each tick: camera.position = curve.getPoint(t)
//                 camera.lookAt(lerp(currentTarget, newTarget, ease))
// 4. At t=0.5: trigger environment exit (old) + enter (new)
//    This means environments overlap during the middle of the transition
// 5. Camera.fov lerped separately with GSAP
```

### B. Camera Motion — Micro-Oscillation (Always Active)

The camera is never perfectly still. It breathes.

```ts
// CameraBreath.ts — runs every frame
class CameraBreath {
  private t = 0
  
  apply(camera: THREE.PerspectiveCamera, dt: number) {
    this.t += dt
    const breathCycle = this.t * 0.25  // 0.25Hz breathing
    
    // Vertical breath: subtle Y oscillation
    const breathY = Math.sin(breathCycle * Math.PI * 2) * 0.015
    
    // Lateral micro-sway: very slow, independent frequency
    const swayX = Math.sin(this.t * 0.13 * Math.PI * 2) * 0.008
    const swayZ = Math.cos(this.t * 0.17 * Math.PI * 2) * 0.006
    
    // High-frequency camera shake (only when it's raining hard)
    const shakeAmt = this.rainIntensity * 0.002
    const shakeX = (Math.random() - 0.5) * shakeAmt
    const shakeY = (Math.random() - 0.5) * shakeAmt
    
    // Apply as additive offset (stored separately, not baked into path position)
    this.offset.set(swayX + shakeX, breathY + shakeY, swayZ)
  }
}
```

### C. Field-of-View Changes

| Section | FOV | Reason |
|---------|-----|--------|
| Landing (aerial) | 85° | Wide, dramatic descent |
| About (street) | 72° | Natural street perspective |
| Cell BE (bird's eye) | 65° | Looking down, feels precise |
| GPU Grid (orbit) | 80° | Wide to convey scale |
| Streaming (side-on) | 70° | Standard |
| Investigation wall | 68° | Tight, focused, like looking at a wall close |
| Power towers | 78° | Slight wide to show towers' height |
| Contact (intimate) | 65° | Cozy, CRT up close |

FOV lerped via `gsap.to(camera, { fov: newFov, duration: 1.2, onUpdate: () => camera.updateProjectionMatrix() })`.

### D. Depth of Field (post-processing pass)

```glsl
// BokehPass - applied only in certain sections
// Thin lens model: objects at uFocusDistance are sharp, blur increases with distance
uniform float uFocusDistance;  // set per-section
uniform float uFocusRange;     // sharpness range
uniform float uBokehStrength;  // 0 = off, 1 = max

float coc = abs(vDepth - uFocusDistance) / uFocusRange;
coc = clamp(coc * uBokehStrength, 0.0, 1.0);
// Circular bokeh: sample tDiffuse in spiral pattern weighted by CoC
// 16 samples, golden angle spiral
```

Active in: Section 6 (SRE wall — background blurs), Section 12 (trophies — shallow DoF), Contact (CRT in focus, room blurs).

---

## IV. Section Transitions — Frame-by-Frame

### What Happens When You Scroll to Next Section

```
Frame 0:    User scrolls. goTo(nextIdx) called.
Frame 0-4:  GSAP starts camera path tween (1.2s). RGB shift increases (uRGBStrength → 0.008).
Frame 30:   Camera reaches midpoint of path arc.
Frame 30:   Old environment: uVisible starts tweening 1→0 (0.8s).
Frame 30:   New environment: created if needed, uVisible starts tweening 0→1 (1.4s).
Frame 30:   City visibility changes (if transitioning to/from abstract scene).
Frame 30:   Fog color starts lerping to new district color.
Frame 30:   DOM: old section panel slides out (CSS transform translateX(-100vw), 0.4s).
Frame 30:   DOM: new section panel slides in (translateX(100vw)→0, 0.4s, delay 0.1s).
Frame 60:   Camera arrives at new keyframe.
Frame 60:   RGB shift decreases back to baseline.
Frame 90:   New environment fully assembled (uVisible = 1).
Frame 120:  Section settled. Normal state.
```

### Visual Effects During Transition
1. **Motion blur**: post-processing pass, strength proportional to camera velocity. `blur = camDelta * 0.3`, max 2px
2. **RGB shift spike**: peaks at camera midpoint, 4× normal strength → feels like signal interference
3. **Brightness dip**: 0.85× at midpoint, quick (100ms) — like a blink
4. **Scan line wipe** (optional, for dramatic sections): horizontal scan line sweeps top→bottom at t=0.5

---

## V. Environment Transition — Surroundings Detail

When entering an **abstract environment** (sections 2-6), the city doesn't just disappear. It **retreats**:

```ts
// CityRetreater: when entering abstract sections
enter() {
  // Buildings shrink down into ground (uVisible on CityGenerator's building mesh)
  gsap.to(cityUniforms.uCityVisible, { value: 0, duration: 1.0, ease: 'power2.in',
    onUpdate: () => {
      // Fog thickens to swallow the city as it shrinks
      fogDensity = THREE.MathUtils.lerp(0.004, 0.04, 1 - cityUniforms.uCityVisible.value)
    }
  })
  // Sky color transitions to solid black void
  gsap.to(skyUniforms.uHorizonColor, { value: new THREE.Color(0, 0, 0), duration: 1.2 })
}

exit() {
  // Reverse: buildings rise back up through the fog
  gsap.to(cityUniforms.uCityVisible, { value: 1, duration: 1.4, ease: 'power2.out' })
  gsap.to(skyUniforms.uHorizonColor, { value: districtHorizonColor, duration: 1.4 })
}
```

**City building shader `uCityVisible`**:
```glsl
// buildingVert: buildings sink into ground when city is hidden
float hideDepth = pow((1.0 - uCityVisible), 1.5) * 60.0;
pos.y -= hideDepth;  // buildings submerge into ground

// buildingFrag: opacity fade + fog thickening at base
float baseFade = smoothstep(2.0, 0.0, vWorldPos.y - hideDepth);
color.a *= uCityVisible * (1.0 - baseFade * (1.0 - uCityVisible));
```

---

## VI. Abstract Environment — Surrounding Atmosphere

Even when the city is hidden, abstract environments need visual atmosphere.

### Shared Environment Background
Every environment that hides the city has:

1. **Void floor**: `PlaneGeometry(200, 200)` with animated grid shader
```glsl
// Perspective grid: brighter lines near horizon, thinner far away
vec2 grid = fract(vWorldPos.xz * 0.5);
float lineX = smoothstep(0.03, 0.0, min(grid.x, 1.0-grid.x));
float lineZ = smoothstep(0.03, 0.0, min(grid.y, 1.0-grid.y));
float gridLine = max(lineX, lineZ);
// Fade with distance
float dist = length(vWorldPos.xz);
float fade = exp(-dist * 0.02);
color = vec3(0.0, 0.1, 0.15) * fade + gridLine * vec3(0.0, 0.3, 0.4) * fade * 0.5;
```

2. **Ambient particles**: 50 dust motes using curl noise, tinted to environment color
3. **Vignette**: strong screen-edge darkening (0.5 opacity, smoothstep 0.4→0.8 from center)
4. **Environment-specific skybox**: sold-color `#000305` base, no stars, no clouds

### Per-Environment Atmosphere

| Environment | Ambient Color | Background Particles | Special Atmosphere |
|------------|---------------|---------------------|-------------------|
| CellBE | `#001a2e` deep silicon blue | None (too clinical) | Faint hex lattice on void floor |
| GPUGrid | `#000d1a` dark navy | Rare amber sparks from x86 zone | Subtle scan line across grid floor |
| Streaming | `#050010` near-black | RF interference dots (white noise, 0.02 opacity) | Fiber glow illuminates local area |
| SRE | `#000a05` dark green | Green data fragments drifting | Panels cast colored light on void |
| PowerGrid | Dark with city behind | Actual city (towers blend into it) | Distant city skyline stays visible |

---

## VII. Audio Design

### Sound Categories

| Sound | Trigger | Implementation |
|-------|---------|---------------|
| Rain ambience | Always (when city visible) | Looping `AudioBuffer`, volume tied to `rainIntensity` |
| Thunder | Lightning strike | 1-shot, 1.5s delay after flash, volume tied to strike distance |
| Neon buzz | Camera within 8 units of any neon sign | `PositionalAudio` on each sign group, volume falloff |
| Wind | Section transition | Short 0.5s burst on camera move, pitch = speed |
| Servo click | Hover any interactive element | Tiny `AudioBuffer`, 80ms, high-frequency click |
| Data pulse | Section enter (abstract envs) | Low electronic thump, 200ms |
| Ambient drone | Inside abstract environments | Per-environment synth pad loop: Cell BE = deep saw, GPU Grid = digital buzz |

### Implementation
```ts
// AudioSystem.ts
// Three.js AudioListener attached to camera
// AudioLoader for .mp3/.ogg
// THREE.Audio for global sounds (rain, drone)
// THREE.PositionalAudio for spatial sounds (neon signs, transmission towers)
// Web Audio API gain nodes for smooth volume transitions

class AudioSystem {
  listener = new THREE.AudioListener()
  rain: THREE.Audio
  thunder: THREE.Audio[]  // pool of 3 for rapid succession
  
  setRainIntensity(v: number) {
    gsap.to(this.rain.gain, { gain: v * 0.4, duration: 1.0 })
  }
  
  playNeonBuzz(position: THREE.Vector3) {
    // Create PositionalAudio at position, auto-remove when camera moves away
  }
}
```

**Music**: No background music by default. One optional ambient track: dark ambient, 120BPM but no discernible beat (just evolving pads). Toggle via `🎵` button. Candidate: generative via Web Audio API oscillators — no file needed.

---

## VIII. HUD Elements — Full Spec

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ND  ──  D. SHANTAN DHEER  ──  EEE @ GCET                [🔊] [⌨] [?]  │
│                                                                         │
│                                                                         │
│  ◉ ───────────────────────────────────────────────────────────────── ◎  │
│  APEX SPIRE                              SECTION 02/13  CPU ARCH         │
│                                                                         │
│                                  [canvas]                              │
│                                                                         │
│  ↑ LANDING                                             SKILL GRAPH ↓   │
└─────────────────────────────────────────────────────────────────────────┘
```

### HUD Components

**Top bar** (`position: fixed`, `z-index: 100`):
- Left: `ND` logo (glitchable, same CSS glitch animation as hero)
- Center: Name + affiliation in monospace, dim
- Right: Sound toggle `🔊`, keyboard shortcut hint `⌨`, help `?`

**Progress bar** (thin `2px` line spanning full width):
```css
.progress-bar {
  position: fixed; bottom: 0; left: 0;
  height: 2px; background: linear-gradient(90deg, var(--neon-current), transparent);
  width: calc(var(--progress) * 100%);  /* CSS var updated from JS */
  transition: width 0.1s linear;
  box-shadow: 0 0 8px var(--neon-current);
}
```

**Section indicator** (bottom-left):
```
DISTRICT: DEEP GRID  |  02 / 13  |  PS3 CELL GPU ARCHITECTURE
```
Each field updates with a brief "type-in" animation (characters appear left to right, 20ms/char).

**Navigation dots** (right edge, vertical):
14 dots. Active dot: filled + glowing with district neon color. Inactive: hollow `○`, dim. Hover: tooltip with section name.

**Navigation arrows** (bottom-center):
```
[ ← PREVIOUS ]   [ NEXT → ]
```
Only visible on hover near bottom 15% of screen. Subtle `opacity: 0 → 0.7` CSS transition.

**Camera coordinates** (bottom-right, tiny, monospace, optional "dev mode" toggle):
```
X: -48.3  Y: +22.1  Z: +14.7  |  SECT: 02  |  ENV: CELL_BE
```

---

## IX. DOM Panel System — Exact Behavior

Each section has a DOM panel overlay. The panel and the 3D scene coexist — the panel is transparent in regions where the 3D scene is the content.

### Panel Layout Template
```
┌────────────────────────────────────────┐
│ [SECTION_ID]  PROJECT_TITLE            │
│ ─────────────────────────────────────  │
│ SUBTITLE / TECH STACK                  │
│                                        │
│ ████████████████████░░░░░░  72%        │  ← scroll progress (only on long sections)
│                                        │
│ Description paragraph. 2–3 sentences.  │
│ Technically precise, no fluff.         │
│                                        │
│ [TAG] [TAG] [TAG]                      │
│                                        │
│ [→ VIEW SOURCE]   [→ LIVE DEMO]        │
└────────────────────────────────────────┘
```

**Panel enter animation** (triggered when section becomes active):
```css
@keyframes panel-enter {
  from { 
    transform: translateX(-20px) translateY(8px);
    opacity: 0;
    filter: blur(4px);
  }
  to { 
    transform: translateX(0) translateY(0);
    opacity: 1;
    filter: blur(0);
  }
}
/* Duration: 400ms, ease: cubic-bezier(0.23, 1, 0.32, 1) */
/* Stagger: title 0ms, subtitle 80ms, description 160ms, tags 240ms, buttons 320ms */
```

**Panel exit animation**:
```css
@keyframes panel-exit {
  to {
    transform: translateX(-30px);
    opacity: 0;
  }
}
/* Duration: 200ms, ease: ease-in */
```

**Panel position** varies by section: most panels are bottom-left, some are bottom-right (when the 3D focus is on the left side of screen), section 6 (SRE) is top-right.

---

## X. Material & Shader Uniform Contracts

### Global Uniforms (injected into every ShaderMaterial via onBeforeRender)
```ts
const GLOBAL_UNIFORMS = {
  uTime:          { value: 0.0 },          // elapsed time in seconds
  uHZ:            { value: 1.0 },          // frame-rate normalizer
  uCameraPos:     { value: new Vector3() },
  uResolution:    { value: new Vector2() },
  uMouse:         { value: new Vector2() }, // NDC −1..1
  uMouseVelocity: { value: new Vector2() }, // per-frame delta
  uDistrictColor: { value: new Color() },  // current district neon
  uRainIntensity: { value: 0.0 },          // 0=dry, 1=heavy rain
  uFogColor:      { value: new Color() },
  uFogDensity:    { value: 0.004 },
}
```

### Per-Environment Uniforms (set by EnvironmentManager)
```ts
interface EnvironmentUniforms {
  uVisible:     { value: number }  // 0→1 entry progress
  uTime:        // from global
  // Plus environment-specific:
  // CellBE: uDataPacketT, uHoveredCore
  // GPUGrid: uWavefront, uHoveredCU
  // Streaming: uPipelineT, uLatency
  // SRE: uAnomalyTime, uVerdict
  // PowerGrid: uAttackPhase, uTowerHealth[4]
}
```

### Material Naming Convention
```
[system].[type].[variant]
city.building.boxA          // main city building (type A)
city.building.cylinder      // cylindrical tower
city.ground.base            // street ground
city.sign.neon              // neon sign plane
env.cellbe.substrate        // CellBE silicon floor
env.cellbe.core             // PPE/SPU core mesh
env.cellbe.eib              // EIB ring tube
env.gpugrid.plane           // the GPU array plane
env.stream.fiber            // optical fiber tube
env.stream.rfring           // RF expansion rings
env.sre.logpanel            // scrolling log plane
env.powergrid.tower         // HV tower metal
env.powergrid.cable         // catenary wire
atm.rain.streak             // rain streak instanced
atm.rain.splash             // ground splash ring
atm.fog.volume              // volumetric fog quad
atm.lightning.bolt          // lightning strike tube
ui.lens.rain                // screen-space droplets
```

---

## XI. Implementation Order (Recommended)

The most impactful visual improvements, in order of effort vs. payoff:

### Phase 1 — Foundation (get it looking alive)
1. **Enhanced building shader** — floor ledge bands + corner edge glow + close-up concrete noise. Biggest immediate impact.
2. **Puddle system** — Voronoi puddles with rain ripple rings on ground. Transforms ground from flat to alive.
3. **Neon sign shader** — Replace current static signs with the flicker/buzz/pulse system.
4. **Full post-processing chain** — Wire up all 10 passes. Bloom + lens streak alone transforms the aesthetic.
5. **Sky dome** — Replace void sky. Gradient + cloud layer + city glow at horizon.

### Phase 2 — Environments
6. **CellBE environment** — First and most distinctive. Silicon substrate shader + cores rising + EIB ring.
7. **GPU Grid environment** — Single plane with procedural shader. Fastest to implement, high payoff.
8. **EnvironmentManager** — Wire up section routing, city visibility toggle, fog transitions.
9. **Streaming environment** — Fiber tube + RF rings + data packets.
10. **PowerGrid environment** — Towers + catenary cables + attack cycle.

### Phase 3 — Atmosphere
11. **Volumetric fog** — Multi-layer fog with district color variation.
12. **Street lamp god rays** — VolumetricLight pass for 3 nearest lamps.
13. **Cable wires** — 30–50 catenary cables between buildings.
14. **Steam vents** — Particle steam at manhole positions.
15. **Holographic billboards** — 2–3 per district.

### Phase 4 — Polish
16. **Lens rain** — Screen-space droplets with refraction.
17. **Lightning system** — Rare but dramatic.
18. **Camera breath** — Micro-oscillation always active.
19. **DOF pass** — For sections 6, 12, 13.
20. **SRE + Skills + Trophy environments** — Remaining environments.
21. **Audio** — Ambient rain + positional neon buzz.
22. **DOM panel animations** — Staggered entry/exit transitions.

---

## XII. Edge Cases & Failure Modes

| Scenario | Handling |
|----------|----------|
| WebGL2 not available | Fallback to static HTML resume (`portfolio.html`), show message |
| GPU too slow (< 30fps) | Auto-disable: rain splash, lens rain, DOF, lightning, half particle count |
| Mobile touch | Swipe up/down = section nav, no mouse hover effects, simplified post-processing |
| No scroll (accessibility) | Tab key navigates sections, Enter = confirm, arrow keys work |
| Shader compile error | Try-catch around material creation, fallback to `MeshBasicMaterial` in error color `#ff0000` |
| Very large screen (4K) | `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))` — cap at 2x |
| User in reduced-motion mode | `matchMedia('prefers-reduced-motion')` → disable camera animation, instant section cuts |
| `visibility: hidden` tab | `document.addEventListener('visibilitychange', pauseRenderLoop)` to save GPU |
