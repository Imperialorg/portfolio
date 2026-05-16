// Building window + neon glow vertex shader
export const buildingVert = /* glsl */`
varying vec2 vUv;
varying vec3 vWorldPos;
varying vec3 vNormal;
varying float vHeight;
attribute float aHeight;
attribute vec3 aNeonColor;
varying vec3 vNeonColor;

void main() {
  vUv = uv;
  vNeonColor = aNeonColor;
  vHeight = aHeight;
  vec4 worldPos = instanceMatrix * vec4(position, 1.0);
  vWorldPos = worldPos.xyz;
  vNormal = normalize(mat3(instanceMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`

// Building fragment: procedural windows + neon edge glow
export const buildingFrag = /* glsl */`
uniform float uTime;
uniform vec3 uFogColor;
uniform float uFogDensity;

varying vec2 vUv;
varying vec3 vWorldPos;
varying vec3 vNormal;
varying float vHeight;
varying vec3 vNeonColor;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float windowGrid(vec2 uv, vec2 scale, vec2 id) {
  float h = hash(id);
  float flickerSpeed = hash(id + 0.5) * 4.0 + 0.5;
  float flicker = step(0.03, fract(sin(uTime * flickerSpeed + h * 100.0) * 0.5 + 0.5));
  float isOn = step(0.35, h) * flicker;
  vec2 grid = fract(uv * scale);
  float frame = step(0.08, grid.x) * step(0.08, grid.y) *
                step(grid.x, 0.88) * step(grid.y, 0.82);
  return frame * isOn;
}

void main() {
  vec3 baseColor = vec3(0.05, 0.05, 0.08);
  
  // Window density based on building height
  float density = mix(8.0, 20.0, clamp(vHeight / 200.0, 0.0, 1.0));
  vec2 winScale = vec2(density * 0.6, density);
  vec2 winId = floor(vUv * winScale);
  float win = windowGrid(vUv, winScale, winId);
  
  // Window color palette
  float h = hash(winId + floor(vWorldPos.xz * 0.01));
  vec3 winColor;
  if (h < 0.3) winColor = vec3(1.0, 0.9, 0.6);        // warm yellow
  else if (h < 0.5) winColor = vec3(0.4, 0.7, 1.0);   // cool blue
  else if (h < 0.65) winColor = vNeonColor * 2.0;       // neon (building color)
  else if (h < 0.75) winColor = vec3(0.8, 0.3, 1.0);   // purple
  else winColor = vec3(1.0, 1.0, 1.0);                  // white

  vec3 color = baseColor + win * winColor * 0.9;
  
  // Neon edge glow (Fresnel)
  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 3.0);
  color += vNeonColor * fresnel * 0.6;
  
  // Rooftop neon line
  float rooftop = step(0.97, vUv.y) * 0.8;
  color += vNeonColor * rooftop;

  // Exponential fog
  float dist = length(vWorldPos - cameraPosition);
  float fogFactor = 1.0 - exp(-uFogDensity * dist * dist * 0.00002);
  color = mix(color, uFogColor, clamp(fogFactor, 0.0, 1.0));

  gl_FragColor = vec4(color, 1.0);
}
`

// Ground (wet asphalt) shaders
export const groundVert = /* glsl */`
varying vec2 vUv;
varying vec3 vWorldPos;
void main() {
  vUv = uv;
  vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

export const groundFrag = /* glsl */`
uniform float uTime;
uniform sampler2D uNoise;
varying vec2 vUv;
varying vec3 vWorldPos;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  vec3 asphalt = vec3(0.06, 0.06, 0.07);
  
  // Road grid lines
  vec2 roadUv = vUv * 40.0;
  vec2 gridFract = fract(roadUv);
  float line = step(0.97, gridFract.x) + step(0.97, gridFract.y);
  line = clamp(line, 0.0, 1.0);
  
  // Puddle reflections (simple screen-space approx)
  float puddle = smoothstep(0.6, 0.8, hash(floor(vUv * 12.0)));
  float puddleShimmer = puddle * (0.5 + 0.5 * sin(uTime * 0.5 + vUv.x * 10.0));
  
  vec3 color = asphalt;
  color += line * 0.08;  // road lines
  color += vec3(0.0, 0.08, 0.12) * puddleShimmer;  // cyan puddle tint
  
  // Neon reflections on wet ground
  float neonRef = sin(vWorldPos.x * 0.3 + uTime * 0.2) * 0.5 + 0.5;
  neonRef *= sin(vWorldPos.z * 0.2 + uTime * 0.15) * 0.5 + 0.5;
  color += vec3(0.0, 0.15, 0.3) * neonRef * puddle * 0.4;
  
  gl_FragColor = vec4(color, 1.0);
}
`

// Rain streak shader
export const rainVert = /* glsl */`
attribute float aSpeed;
attribute float aOffset;
uniform float uTime;
uniform vec3 uCameraPos;
varying float vAlpha;

void main() {
  float t = mod(uTime * aSpeed + aOffset, 1.0);
  vec3 pos = position;
  pos.y -= t * 120.0;
  
  // Wrap vertically
  pos.y = mod(pos.y + 60.0, 120.0) - 60.0;
  
  vAlpha = 0.3 + 0.4 * aSpeed;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = 1.5;
}
`

export const rainFrag = /* glsl */`
varying float vAlpha;
void main() {
  gl_FragColor = vec4(0.6, 0.8, 1.0, vAlpha * 0.4);
}
`

// Hologram shader (for UI planes)
export const hologramFrag = /* glsl */`
uniform float uTime;
varying vec2 vUv;
varying vec3 vWorldPos;

void main() {
  // Scanline sweep
  float scan = sin(vUv.y * 80.0 - uTime * 3.0) * 0.5 + 0.5;
  scan = pow(scan, 8.0) * 0.4;
  
  // Edge glow
  float edge = smoothstep(0.0, 0.05, vUv.x) * smoothstep(1.0, 0.95, vUv.x)
             * smoothstep(0.0, 0.05, vUv.y) * smoothstep(1.0, 0.95, vUv.y);
  float rim = 1.0 - edge;
  
  // Flicker
  float flicker = 0.9 + 0.1 * sin(uTime * 13.7);
  
  vec3 color = vec3(0.0, 0.8, 1.0);
  float alpha = (scan + rim * 0.5) * flicker * 0.85;
  
  gl_FragColor = vec4(color, alpha);
}
`
