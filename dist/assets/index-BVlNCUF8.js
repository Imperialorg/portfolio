var gt=Object.defineProperty;var vt=(n,e,t)=>e in n?gt(n,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):n[e]=t;var c=(n,e,t)=>vt(n,typeof e!="symbol"?e+"":e,t);import{i as m,d as he,I as F,q as W,j as le,s as fe,a2 as r,u as _,a as X,Q as pe,m as De,C as st,x as ve,t as ae,X as re,f as it,e as me,y as at,Y as wt,B as bt,E as yt,a1 as se,_ as St,g as qe,G as Oe,p as Ct,z as At,a5 as Pt,A as xt,W as Tt,o as Et,P as Mt,H as kt,S as It,h as Lt}from"./three-uBnUpQ-C.js";import{b as Rt,R as Nt,a as Dt,B as xe,C as Ft,V as Ut,N as Ot,S as Gt,G as Bt,c as Te,E as Ht}from"./postprocessing-DQ1XEIde.js";import{g as Z}from"./gsap-SFc2wnMY.js";(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))s(o);new MutationObserver(o=>{for(const i of o)if(i.type==="childList")for(const l of i.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&s(l)}).observe(document,{childList:!0,subtree:!0});function t(o){const i={};return o.integrity&&(i.integrity=o.integrity),o.referrerPolicy&&(i.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?i.credentials="include":o.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function s(o){if(o.ep)return;o.ep=!0;const i=t(o);fetch(o.href,i)}})();function Xe(n){return n*n*n*(n*(n*6-15)+10)}function Ee(n,e,t){return n+t*(e-n)}function ce(n,e,t){const s=n&3,o=s<2?e:t,i=s<2?t:e;return(n&1?-o:o)+(n&2?-i:i)}const U=Array.from({length:512},(n,e)=>e).sort(()=>Math.random()-.5);for(let n=0;n<256;n++)U[n+256]=U[n];function zt(n,e){const t=Math.floor(n)&255,s=Math.floor(e)&255,o=n-Math.floor(n),i=e-Math.floor(e),l=Xe(o),a=Xe(i),p=U[U[t]+s],v=U[U[t]+s+1],d=U[U[t+1]+s],h=U[U[t+1]+s+1];return Ee(Ee(ce(p,o,i),ce(d,o-1,i),l),Ee(ce(v,o,i-1),ce(h,o-1,i-1),l),a)}function Me(n,e,t=4,s=2,o=.5){let i=0,l=.5,a=1;for(let p=0;p<t;p++)i+=zt(n*a,e*a)*l,a*=s,l*=o;return i}function C(n,e){return n+Math.random()*(e-n)}function de(n,e){return Math.floor(C(n,e+1))}const Wt=`
attribute float aHeight;
attribute vec3 aNeonColor;

varying vec2 vUv;
varying vec3 vWorldPos;
varying vec3 vNormal;
varying float vHeight;
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
`,_t=`
uniform float uTime;
uniform vec3 uFogColor;
uniform float uFogNear;
uniform float uFogFar;

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
  float flickerSpeed = hash(id + vec2(0.5, 0.3)) * 4.0 + 0.5;
  float flicker = step(0.03, fract(sin(uTime * flickerSpeed + h * 100.0) * 0.5 + 0.5));
  float isOn = step(0.3, h) * flicker;
  vec2 grid = fract(uv * scale);
  float frame = step(0.1, grid.x) * step(0.1, grid.y) *
                step(grid.x, 0.87) * step(grid.y, 0.83);
  return frame * isOn;
}

void main() {
  // Very dark near-black base
  vec3 base = vec3(0.012, 0.012, 0.020);

  // Window grid with higher density variation
  float density = mix(8.0, 28.0, clamp(vHeight / 200.0, 0.0, 1.0));
  vec2 winScale = vec2(density * 0.52, density);
  vec2 winId = floor(vUv * winScale);
  float win = windowGrid(vUv, winScale, winId);

  // Richer window color palette: amber, cool blue, neon, purple, white
  float h = hash(winId + floor(vWorldPos.xz * 0.01));
  vec3 winColor;
  if      (h < 0.22) winColor = vec3(1.0, 0.82, 0.38);   // warm amber
  else if (h < 0.40) winColor = vec3(0.28, 0.55, 1.0);   // cool blue
  else if (h < 0.58) winColor = vNeonColor * 2.6;         // district neon
  else if (h < 0.72) winColor = vec3(1.0, 0.1, 0.55);    // hot magenta
  else if (h < 0.84) winColor = vec3(0.1, 0.9, 1.0);     // bright cyan
  else               winColor = vec3(0.95, 0.97, 1.0);   // white

  vec3 color = base + win * winColor * 1.3;

  // ── HORIZONTAL NEON BANDS ────────────────────────────────
  // Use building footprint hash to place 1–3 bands at random Y positions
  vec2 bldSeed = floor(vWorldPos.xz * 0.015);
  float bldHash = hash(bldSeed);
  float numBands = floor(bldHash * 3.0) + 1.0;  // 1, 2, or 3 bands
  float bandPulse = 0.75 + 0.25 * sin(uTime * 0.8 + bldHash * 6.28);

  for (int bi = 0; bi < 3; bi++) {
    if (float(bi) >= numBands) break;
    float bandSeed = hash(bldSeed + vec2(float(bi) * 3.7, 1.3));
    float bandY = 0.1 + bandSeed * 0.75;  // position along UV height
    float bandWidth = 0.005 + hash(bldSeed + vec2(float(bi), 9.1)) * 0.010;
    float bandDist = abs(vUv.y - bandY);
    float band = 1.0 - smoothstep(0.0, bandWidth, bandDist);

    // Cycle color between neon, magenta, cyan by band index
    vec3 bandColor;
    float colorSel = hash(bldSeed + vec2(float(bi) * 2.1, 5.5));
    if      (colorSel < 0.33) bandColor = vNeonColor;
    else if (colorSel < 0.66) bandColor = vec3(1.0, 0.1, 0.55);
    else                      bandColor = vec3(0.1, 0.9, 1.0);

    color += band * bandColor * 3.5 * bandPulse;
  }

  // ── VERTICAL NEON EDGE STRIPS ────────────────────────────
  float edgeL = 1.0 - smoothstep(0.0, 0.025, vUv.x);
  float edgeR = 1.0 - smoothstep(0.0, 0.025, 1.0 - vUv.x);
  color += (edgeL + edgeR) * vNeonColor * 1.8;

  // ── ROOFTOP CAP GLOW ─────────────────────────────────────
  color += smoothstep(0.92, 1.0, vUv.y) * vNeonColor * 3.0;

  // ── NEON SIGN PATTERN on 30% of buildings ────────────────
  float signHash = hash(floor(vWorldPos.xz * 0.02));
  if (signHash < 0.30) {
    // Large geometric pattern: diagonal triangle stripe in mid-face region
    float px = vUv.x;
    float py = vUv.y;
    // Triangle mask: area where py > 0.25 && py < 0.65 && px between diagonal lines
    float inZone = step(0.22, py) * step(py, 0.68);
    float diagA = step(px + py * 0.6, 1.1);
    float diagB = step(0.4, px + py * 0.5);
    float tri = inZone * diagA * diagB;
    // Outline only — thin band around the pattern
    float outerA = step(px + py * 0.6, 1.15) * (1.0 - step(px + py * 0.6, 1.05));
    float outerB = step(0.35, px + py * 0.5) * (1.0 - step(0.45, px + py * 0.5));
    float outline = inZone * (outerA + outerB);
    vec3 signColor = (signHash < 0.15) ? vec3(1.0, 0.1, 0.5) : vNeonColor;
    color += outline * signColor * 4.0;
  }

  // ── CLOSE-UP DETAIL (distance-gated at 40→12 units) ──────
  float camDist = length(vWorldPos - cameraPosition);
  float closeBlend = 1.0 - smoothstep(12.0, 40.0, camDist);

  // Floor ledge bands — horizontal concrete lines per floor
  float floorFract = fract(vUv.y * 12.0);
  float ledge = 1.0 - smoothstep(0.01, 0.06, floorFract);
  color += ledge * closeBlend * 0.09 * vec3(1.0, 1.0, 1.2);

  // Corner edge glow — vertical neon trace at building corners (close-up boost)
  float cornerDist = min(vUv.x, 1.0 - vUv.x);
  float cornerEdge = 1.0 - smoothstep(0.0, 0.04, cornerDist);
  color += cornerEdge * closeBlend * vNeonColor * 0.5;

  // Concrete surface grain — close-up noise texture
  vec2 grainUV = floor(vUv * vec2(60.0, 120.0));
  float grain = hash(grainUV);
  color += (grain - 0.5) * closeBlend * 0.04;

  // ── FRESNEL ───────────────────────────────────────────────
  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 2.8);
  color += vNeonColor * fresnel * 0.6;

  // ── FOG ──────────────────────────────────────────────────
  float dist = length(vWorldPos - cameraPosition);
  float fog = clamp((dist - uFogNear) / (uFogFar - uFogNear), 0.0, 1.0);
  color = mix(color, uFogColor, fog * 0.85);

  gl_FragColor = vec4(color, 1.0);
}
`,Vt=`
varying vec2 vUv;
varying vec3 vWorldPos;
varying vec3 vNormal;
void main() {
  vUv = uv;
  vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,jt=`
uniform float uTime;
uniform vec3 uDistrictNeon;
uniform float uRainIntensity;

varying vec2 vUv;
varying vec3 vWorldPos;
varying vec3 vNormal;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float hash21(vec2 p) {
  return fract(sin(dot(p, vec2(13.9898, 78.233))) * 43758.5453);
}

// Cheap Voronoi — returns min distance to nearest point in cell grid
float voronoi(vec2 uv) {
  vec2 i = floor(uv);
  vec2 f = fract(uv);
  float minDist = 1.0;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 nb = vec2(float(x), float(y));
      // Two independent hashes per cell → random 2D point inside cell
      vec2 pt = vec2(
        hash21(i + nb),
        hash21(i + nb + vec2(17.3, 31.7))
      );
      minDist = min(minDist, length(f - (nb + pt)));
    }
  }
  return minDist;
}

// Ripple ring centered at origin
float ripple(vec2 uv, float t) {
  float r = length(uv);
  return sin(r * 20.0 - t * 8.0) * exp(-r * 4.0) * 0.5 + 0.5;
}

void main() {
  vec3 asphalt = vec3(0.045, 0.045, 0.06);

  // ── ROAD GRID LINES ────────────────────────────────────────
  vec2 roadUv = vWorldPos.xz * 0.08;
  vec2 gf = fract(roadUv);
  float lineX = 1.0 - smoothstep(0.0, 0.015, min(gf.x, 1.0 - gf.x));
  float lineZ = 1.0 - smoothstep(0.0, 0.015, min(gf.y, 1.0 - gf.y));
  float gridLine = max(lineX, lineZ);

  // ── VORONOI PUDDLE MASK ────────────────────────────────────
  vec2 puddleUV = vWorldPos.xz * 0.4;
  float puddleMask = 1.0 - smoothstep(0.30, 0.42, voronoi(puddleUV));

  // ── RAIN RIPPLES IN PUDDLES (4 rings at staggered phases) ──
  float rippleSum = 0.0;
  for (int i = 0; i < 4; i++) {
    vec2 cellCenter = floor(puddleUV + vec2(float(i) * 0.37, float(i) * 0.61));
    vec2 offset = vec2(
      hash(cellCenter + vec2(float(i) * 3.7, 1.1)),
      hash(cellCenter + vec2(2.3, float(i) * 1.9))
    ) * 4.0 - 2.0;
    float phase = hash(vec2(float(i), 7.3)) * 1.2;
    float age = mod(uTime * 0.75 + phase, 1.2) / 1.2;
    rippleSum += ripple((vWorldPos.xz - offset) * 1.2, uTime + phase * 10.0)
                 * (1.0 - age) * 0.25 * uRainIntensity;
  }

  // ── PUDDLE REFLECTION (approximate bloom via neon colors) ──
  float neonPulse = 0.55 + 0.45 * sin(uTime * 0.25 + vWorldPos.x * 0.08 + vWorldPos.z * 0.06);
  vec3 skyReflect = vec3(0.05, 0.08, 0.16);          // dark sky base tint
  vec3 puddleColor = skyReflect + uDistrictNeon * neonPulse * 0.7;
  puddleColor += uDistrictNeon * rippleSum * 0.8;     // ripples brighten neon

  // ── ASPHALT SURFACE VARIATION (subtle grain) ──────────────
  float surfGrain = hash(floor(vWorldPos.xz * 4.0));
  asphalt += (surfGrain - 0.5) * 0.01;

  // ── COMPOSE ───────────────────────────────────────────────
  vec3 color = asphalt;
  color += gridLine * 0.08;                           // faint grid reflection
  color = mix(color, puddleColor, puddleMask * 0.6 * uRainIntensity);

  // Ambient neon bleed on wet surface
  float neonBleed = sin(vWorldPos.x * 0.12 + uTime * 0.1) * 0.5 + 0.5;
  neonBleed      *= sin(vWorldPos.z * 0.09 + uTime * 0.07) * 0.5 + 0.5;
  color += uDistrictNeon * neonBleed * puddleMask * 0.10 * uRainIntensity;

  gl_FragColor = vec4(color, 1.0);
}
`,qt=`
attribute float aSpeed;
attribute float aOffset;
uniform float uTime;
varying float vAlpha;

void main() {
  float t = mod(uTime * aSpeed + aOffset, 1.0);
  vec3 pos = position;
  pos.y -= t * 120.0;
  pos.y = mod(pos.y + 60.0, 120.0) - 60.0;
  vAlpha = 0.3 + 0.4 * aSpeed;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = 1.5;
}
`,Xt=`
varying float vAlpha;
void main() {
  gl_FragColor = vec4(0.55, 0.75, 1.0, vAlpha * 0.35);
}
`,Yt=`
varying vec3 vLocalPos;
void main() {
  vLocalPos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,$t=`
uniform float uTime;
uniform vec3 uZenithColor;
uniform vec3 uHorizonColor;
uniform vec3 uDistrictNeon;

varying vec3 vLocalPos;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// Layered sin cloud noise — cheap, no texture needed
float cloudNoise(vec2 uv) {
  float n = 0.0;
  float amp = 0.5, freq = 1.0;
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    n += amp * (sin(uv.x * freq + uTime * 0.008 * (fi + 1.0)) * 0.5 + 0.5)
             * (sin(uv.y * freq * 0.71 + uTime * 0.006 * (fi + 1.0)) * 0.5 + 0.5);
    amp  *= 0.5;
    freq *= 2.1;
  }
  return n;
}

void main() {
  vec3 dir = normalize(vLocalPos);

  // Hard horizon clamp — below ground just shows horizon color
  float elevation = dir.y;

  // Zenith→horizon gradient
  float h = clamp(elevation, 0.0, 1.0);
  float hPow = pow(h, 0.4);
  vec3 sky = mix(uHorizonColor, uZenithColor, hPow);

  // City glow blooms up from below the horizon
  float cityGlow = 1.0 - smoothstep(0.0, 0.35, elevation);
  sky += uDistrictNeon * 0.18 * cityGlow;

  // Cloud layer — only when looking somewhat upward
  if (elevation > 0.02) {
    vec2 cloudUV = dir.xz / (elevation + 0.08) * 0.28 + vec2(uTime * 0.002, uTime * 0.001);
    float cloud = cloudNoise(cloudUV);
    cloud = smoothstep(0.42, 0.68, cloud);
    // Dark cloud bottoms, neon-lit on underside near horizon
    vec3 cloudBase = vec3(0.015, 0.015, 0.022);
    vec3 cloudUnderlit = cloudBase + uDistrictNeon * 0.12 * cityGlow;
    sky = mix(sky, cloudUnderlit, cloud * (1.0 - hPow) * 0.65);
  }

  // Stars — only near zenith, tiny bright points
  if (elevation > 0.15) {
    vec2 starUV = dir.xz / (abs(elevation) + 0.01);
    float starHash = hash(floor(starUV * 130.0));
    float star = step(0.996, starHash) * smoothstep(0.15, 0.55, elevation);
    sky += star * vec3(0.5, 0.6, 1.0) * 0.9;
  }

  gl_FragColor = vec4(sky, 1.0);
}
`,Kt=`
attribute vec3 aColor;
attribute float aFlickerSeed;
attribute float aPulseMode;

varying vec2 vUv;
varying vec3 vColor;
varying float vFlickerSeed;
varying float vPulseMode;

void main() {
  vUv = uv;
  vColor = aColor;
  vFlickerSeed = aFlickerSeed;
  vPulseMode = aPulseMode;
  // instanceMatrix contains the per-sign world transform
  vec4 worldPos = instanceMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`,Zt=`
uniform float uTime;

varying vec2 vUv;
varying vec3 vColor;
varying float vFlickerSeed;
varying float vPulseMode;

float hashF(float p) {
  return fract(sin(p * 127.1) * 43758.5453);
}

void main() {
  // Elongated horizontal tube shape
  vec2 centered = vUv - 0.5;
  float dist = length(centered * vec2(1.0, 4.0));
  float tube = 1.0 - smoothstep(0.0, 0.28, dist);
  float halo = 1.0 - smoothstep(0.05, 0.55, length(centered));

  // Stochastic flicker — brief dimming events
  float flickerNoise = fract(sin(uTime * 47.3 + vFlickerSeed * 100.0) * 43758.5);
  float flicker = 1.0 - step(0.97, flickerNoise) * 0.75;

  // Mode: 0=static  1=pulse  2=blink  3=glitch
  float brightness;
  if (vPulseMode < 0.5) {
    brightness = flicker;
  } else if (vPulseMode < 1.5) {
    brightness = (0.6 + 0.4 * sin(uTime * 1.2 + vFlickerSeed * 20.0)) * flicker;
  } else if (vPulseMode < 2.5) {
    brightness = step(0.5, fract(uTime * 0.5 + vFlickerSeed));
  } else {
    // Glitch — rapid segment dropout
    float glitchT = floor(uTime * 8.0 + vFlickerSeed * 37.0);
    brightness = step(0.2, hashF(glitchT));
    brightness = mix(brightness, 1.0, step(0.0, sin(uTime * 0.5 + vFlickerSeed * 5.0)));
  }

  // Power buzz — high-frequency shimmer along tube
  float buzz = sin(vUv.x * 80.0 + uTime * 30.0) * 0.06 * tube;

  vec3 col = vColor * (tube * brightness + halo * 0.25);
  col += vec3(1.0) * tube * brightness * 0.5;   // white-hot core
  col += vColor * buzz * brightness;

  float alpha = (tube * brightness + halo * 0.25) * 0.9;
  if (alpha < 0.01) discard;
  gl_FragColor = vec4(col, alpha);
}
`,x=32,j=16,Jt=6,q=j+Jt,K=x/2*q,ke={color:new m(197400),near:100,far:500},ie=[new m(62975),new m(62975),new m(16711850),new m(16711850),new m(16739098),new m(8073215),new m(8073215),new m(65416),new m(65416),new m(16770626)];function Qt(){return new re({vertexShader:Wt,fragmentShader:_t,uniforms:{uTime:{value:0},uFogColor:{value:ke.color},uFogNear:{value:ke.near},uFogFar:{value:ke.far}}})}function eo(n,e){const t=n/x,s=e/x;return t<.35&&s<.35?0:t<.65&&s<.35?1:t>=.65&&s<.35?2:t<.35&&s<.65?3:t>=.65&&s<.65?4:t<.35&&s>=.65?5:t<.65&&s>=.65?6:t>=.65&&s>=.65?7:s>.45&&s<.55?8:9}class to{constructor(){c(this,"meshA");c(this,"meshB");c(this,"meshC");c(this,"meshD");c(this,"mats",[])}generate(e){const t=x*x,s=Qt();this.mats.push(s);const o=new he(1,1,1),i=new Float32Array(t),l=new Float32Array(t*3);o.setAttribute("aHeight",new F(i,1)),o.setAttribute("aNeonColor",new F(l,3)),this.meshA=new W(o,s.clone(),t),this.meshA.frustumCulled=!1,this.mats.push(this.meshA.material);const a=new le(.45,.55,1,10),p=new Float32Array(t),v=new Float32Array(t*3);a.setAttribute("aHeight",new F(p,1)),a.setAttribute("aNeonColor",new F(v,3)),this.meshB=new W(a,s.clone(),t),this.meshB.frustumCulled=!1,this.mats.push(this.meshB.material);const d=new he(1,.4,1),h=new Float32Array(t),u=new Float32Array(t*3);d.setAttribute("aHeight",new F(h,1)),d.setAttribute("aNeonColor",new F(u,3)),this.meshC=new W(d,s.clone(),t),this.meshC.frustumCulled=!1,this.mats.push(this.meshC.material);const f=new he(1,1,1),w=new Float32Array(t),T=new Float32Array(t*3);f.setAttribute("aHeight",new F(w,1)),f.setAttribute("aNeonColor",new F(T,3)),this.meshD=new W(f,s.clone(),t),this.meshD.frustumCulled=!1,this.mats.push(this.meshD.material);const g=new fe,y=new r,b=new r,P=new pe;let M=0,S=0,E=0,D=0;const ee=new le(1,1,.3,16),Y=[],be=[62975,16711850,16739098,8073215,65416,16770626];for(const A of be){const I=new _({color:A,transparent:!0,opacity:.7,blending:X,depthWrite:!1}),O=new W(ee,I,34);O.frustumCulled=!1,O.count=0,Y.push(O)}const ye=new Int32Array(be.length);for(let A=0;A<x;A++)for(let I=0;I<x;I++){const O=A*q-K,te=I*q-K;if(A%5===0||I%5===0||A%2===0&&I%2===0&&Math.random()<.25)continue;const Se=A/x*4-2,Ce=I/x*4-2,ft=Me(Se,Ce,5),pt=Math.sqrt(Se*Se+Ce*Ce)/3,mt=Math.max(.18,1-pt*.6),G=Math.max(8,(22+ft*170)*mt)+C(4,28),Ae=C(j*.42,j*.9),We=C(j*.42,j*.9),_e=eo(A,I),L=ie[_e],Ve=Math.random();if(Ve<.65)i[M]=G,l[M*3]=L.r,l[M*3+1]=L.g,l[M*3+2]=L.b,y.set(O,G/2,te),b.set(Ae,G,We),g.compose(y,P,b),this.meshA.setMatrixAt(M,g),M++;else if(Ve<.82){const R=C(j*.18,j*.32);p[S]=G,v[S*3]=L.r,v[S*3+1]=L.g,v[S*3+2]=L.b,y.set(O+C(-3,3),G/2,te+C(-3,3)),b.set(R*2,G,R*2),g.compose(y,P,b),this.meshB.setMatrixAt(S,g),S++}else{const R=Math.max(6,G*.35);h[E]=R,u[E*3]=L.r,u[E*3+1]=L.g,u[E*3+2]=L.b,y.set(O,R/2,te),b.set(Ae*1.4,R,We*1.4),g.compose(y,P,b),this.meshC.setMatrixAt(E,g),E++}if(Math.random()>=.95){const R=C(1.5,4),Pe=C(1.5,4),$=G*1.8;w[D]=$,T[D*3]=L.r,T[D*3+1]=L.g,T[D*3+2]=L.b,y.set(O+C(-2,2),$/2,te+C(-2,2)),b.set(R,$,Pe),g.compose(y,P,b),this.meshD.setMatrixAt(D,g),D++}if(Math.random()<.15){const R=_e%be.length,Pe=Y[R],$=ye[R];if($<34){const je=Ae*.6;y.set(O,G,te),b.set(je,1,je),g.compose(y,P,b),Pe.setMatrixAt($,g),ye[R]++}}}this.meshA.count=M,this.meshB.count=S,this.meshC.count=E,this.meshD.count=D;for(const A of[this.meshA,this.meshB,this.meshC,this.meshD]){A.instanceMatrix.needsUpdate=!0;const I=A.geometry;I.getAttribute("aHeight").needsUpdate=!0,I.getAttribute("aNeonColor").needsUpdate=!0,e.add(A)}for(let A=0;A<Y.length;A++)Y[A].count=ye[A],Y[A].instanceMatrix.needsUpdate=!0,e.add(Y[A])}addSearchlights(e){const t=new le(.3,2.5,1,6,1,!0),s=[{color:16777215,opacity:.08,count:34},{color:4521983,opacity:.07,count:26},{color:16729258,opacity:.07,count:20}],o=new fe,i=new r,l=new r,a=new pe;for(const p of s){const v=new _({color:p.color,transparent:!0,opacity:p.opacity,side:De,blending:X,depthWrite:!1}),d=new W(t,v,p.count);d.frustumCulled=!1;for(let h=0;h<p.count;h++){const u=de(0,x-1),f=de(0,x-1),w=u*q-K,T=f*q-K,g=u/x*4-2,y=f/x*4-2,b=Math.max(.18,1-Math.sqrt(g*g+y*y)/3*.6),P=Math.max(8,(22+Me(g,y,5)*170)*b)+C(4,28);i.set(w+C(-2,2),P+150,T+C(-2,2)),l.set(1,300,1),o.compose(i,a,l),d.setMatrixAt(h,o)}d.instanceMatrix.needsUpdate=!0,e.add(d)}}addAntennas(e){const t=new le(.1,.1,1,4),s=new _({color:16716083}),o=new W(t,s,400);o.frustumCulled=!1;const i=new fe,l=new r,a=new r,p=new pe;let v=0;for(let d=0;d<400;d++){const h=de(0,x-1),u=de(0,x-1),f=h*q-K,w=u*q-K,T=h/x*4-2,g=u/x*4-2,y=Math.max(.18,1-Math.sqrt(T*T+g*g)/3*.6),b=Math.max(8,(22+Me(T,g,5)*170)*y)+20,P=C(8,30);l.set(f+C(-3,3),b+P/2,w+C(-3,3)),a.set(1,P,1),i.compose(l,p,a),o.setMatrixAt(v++,i)}o.count=v,o.instanceMatrix.needsUpdate=!0,e.add(o)}addNeonSigns(e,t){t.forEach(({text:s,pos:o,color:i})=>{const l=document.createElement("canvas");l.width=256,l.height=64;const a=l.getContext("2d");a.clearRect(0,0,256,64),a.fillStyle=i+"22",a.fillRect(0,0,256,64),a.strokeStyle=i,a.lineWidth=2,a.strokeRect(2,2,252,60),a.fillStyle=i,a.font="bold 22px monospace",a.textAlign="center",a.fillText(s,128,40);const p=new st(l),v=new ve(18,4.5),d=new _({map:p,transparent:!0,side:De,depthWrite:!1}),h=new ae(v,d);h.position.copy(o),e.add(h)})}update(e){for(const t of this.mats)t.uniforms.uTime.value=e}}class oo{constructor(){c(this,"mesh");c(this,"mat")}create(e){const t=new ve(1200,1200,1,1);return this.mat=new re({vertexShader:Vt,fragmentShader:jt,uniforms:{uTime:{value:0},uDistrictNeon:{value:new m(62975)},uRainIntensity:{value:1}}}),this.mesh=new ae(t,this.mat),this.mesh.rotation.x=-Math.PI/2,this.mesh.position.y=0,e.add(this.mesh),this.mesh}update(e){this.mat.uniforms.uTime.value=e}setDistrictNeon(e){this.mat.uniforms.uDistrictNeon.value.copy(e)}setRainIntensity(e){this.mat.uniforms.uRainIntensity.value=e}}class no{constructor(){c(this,"points");c(this,"count",8e3)}create(e){const t=new Float32Array(this.count*3),s=new Float32Array(this.count),o=new Float32Array(this.count);for(let a=0;a<this.count;a++)t[a*3]=C(-300,300),t[a*3+1]=C(-60,60),t[a*3+2]=C(-300,300),s[a]=C(.3,1),o[a]=Math.random();const i=new it;i.setAttribute("position",new me(t,3)),i.setAttribute("aSpeed",new me(s,1)),i.setAttribute("aOffset",new me(o,1));const l=new re({vertexShader:qt,fragmentShader:Xt,uniforms:{uTime:{value:0}},transparent:!0,blending:X,depthWrite:!1});this.points=new at(i,l),e.add(this.points)}update(e,t){const s=this.points.material;s.uniforms.uTime.value=e,t&&(this.points.position.x=t.x,this.points.position.z=t.z)}}class so{constructor(){c(this,"mesh");c(this,"mat")}create(e){const t=new wt(2e3,32,16);this.mat=new re({vertexShader:Yt,fragmentShader:$t,uniforms:{uTime:{value:0},uZenithColor:{value:new m(132104)},uHorizonColor:{value:new m(1706e3)},uDistrictNeon:{value:new m(62975)}},side:bt,depthWrite:!1}),this.mesh=new ae(t,this.mat),this.mesh.renderOrder=-1,e.add(this.mesh)}update(e,t,s){this.mesh.position.copy(t),this.mat.uniforms.uTime.value=e,s&&this.mat.uniforms.uDistrictNeon.value.copy(s)}setDistrictColors(e,t){this.mat.uniforms.uHorizonColor.value.copy(e),this.mat.uniforms.uDistrictNeon.value.copy(t)}}function io(n){let e=n;return()=>{e|=0,e=e+1831565813|0;let t=Math.imul(e^e>>>15,1|e);return t=t+Math.imul(t^t>>>7,61|t)^t,((t^t>>>14)>>>0)/4294967296}}const Ye=[new m(16720384),new m(61183),new m(22015),new m(16711884),new m(65382),new m(16737792),new m(11141375),new m(16770626)],Fe=32,rt=16,ao=6,Ue=rt+ao,$e=Fe/2*Ue;class ro{constructor(){c(this,"mesh");c(this,"mat")}create(e){const s=new ve(5,1.4),o=new Float32Array(150*3),i=new Float32Array(150),l=new Float32Array(150);s.setAttribute("aColor",new F(o,3)),s.setAttribute("aFlickerSeed",new F(i,1)),s.setAttribute("aPulseMode",new F(l,1)),this.mat=new re({vertexShader:Kt,fragmentShader:Zt,uniforms:{uTime:{value:0}},transparent:!0,depthWrite:!1,side:De,blending:X}),this.mesh=new W(s,this.mat,150),this.mesh.frustumCulled=!1;const a=io(42),p=new fe,v=new r,d=new pe,h=new r(1,1,1);let u=0;for(let f=0;f<Fe&&u<150;f++)for(let w=0;w<Fe&&u<150;w++){if(f%5===0||w%5===0||a()>.1)continue;const T=f*Ue-$e,g=w*Ue-$e,y=6+a()*12,b=Math.floor(a()*4),P=rt*.5+.3;let M=T,S=g,E=0;b===0?(S=g+P,E=0):b===1?(S=g-P,E=Math.PI):b===2?(M=T+P,E=Math.PI*.5):(M=T-P,E=-Math.PI*.5),v.set(M,y,S),d.setFromEuler(new yt(0,E,0)),p.compose(v,d,h),this.mesh.setMatrixAt(u,p);const D=Ye[Math.floor(a()*Ye.length)];o[u*3]=D.r,o[u*3+1]=D.g,o[u*3+2]=D.b,i[u]=a();const ee=a();l[u]=ee<.6?0:ee<.85?1:ee<.95?2:3,u++}this.mesh.count=u,this.mesh.instanceMatrix.needsUpdate=!0,s.getAttribute("aColor").needsUpdate=!0,s.getAttribute("aFlickerSeed").needsUpdate=!0,s.getAttribute("aPulseMode").needsUpdate=!0,e.add(this.mesh)}update(e){this.mat.uniforms.uTime.value=e}}const lo=`
  uniform float uIntensity;

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    const int TAPS = 8;
    const float THRESHOLD = 0.78;
    const float TAP_SPACING = 0.005;

    vec3 streak = vec3(0.0);

    for (int i = 1; i <= TAPS; i++) {
      float ofs    = float(i) * TAP_SPACING;
      float weight = 1.0 / float(i);

      // Sample left
      vec4 sL = texture2D(inputBuffer, vec2(uv.x - ofs, uv.y));
      float lL = dot(sL.rgb, vec3(0.299, 0.587, 0.114));
      streak += sL.rgb * max(0.0, lL - THRESHOLD) * weight;

      // Sample right
      vec4 sR = texture2D(inputBuffer, vec2(uv.x + ofs, uv.y));
      float lR = dot(sR.rgb, vec3(0.299, 0.587, 0.114));
      streak += sR.rgb * max(0.0, lR - THRESHOLD) * weight;
    }

    outputColor = vec4(inputColor.rgb + streak * uIntensity, inputColor.a);
  }
`;class co extends Ht{constructor(e=.45){super("LensStreakEffect",lo,{uniforms:new Map([["uIntensity",new St(e)]])})}}class uo{constructor(){c(this,"composer");c(this,"glitch");c(this,"glitchTimeout",0)}setup(e,t,s){this.composer=new Rt(e);const o=new Nt(t,s),i=new Dt({blendFunction:xe.ADD,luminanceThreshold:.25,luminanceSmoothing:.4,intensity:2.4,radius:.6}),l=new co(.45),a=new Ft({offset:new se(.0018,.0012),radialModulation:!0,modulationOffset:.5}),p=new Ut({eskil:!1,offset:.35,darkness:.75}),v=new Ot({blendFunction:xe.OVERLAY,premultiply:!0});v.blendMode.opacity.value=.04;const d=new Gt({blendFunction:xe.OVERLAY,density:1.4});return d.blendMode.opacity.value=.07,this.glitch=new Bt({delay:new se(99999,99999),duration:new se(.15,.35),strength:new se(.15,.4),columns:.04,ratio:.85}),this.composer.addPass(o),this.composer.addPass(new Te(s,i,l)),this.composer.addPass(new Te(s,a,d,p,v)),this.composer.addPass(new Te(s,this.glitch)),this.composer}triggerGlitch(){this.glitch.delay.set(0,.05),clearTimeout(this.glitchTimeout),this.glitchTimeout=window.setTimeout(()=>{this.glitch.delay.set(99999,99999)},600)}resize(e,t){this.composer.setSize(e,t)}render(){this.composer.render()}}const N=[{pos:new r(0,180,220),look:new r(0,0,0),label:"HERO",t:0},{pos:new r(-40,12,110),look:new r(-20,20,60),label:"ABOUT",t:0},{pos:new r(-80,200,65),look:new r(-80,200,20),label:"PS3 GPU",t:0},{pos:new r(-75,200,25),look:new r(-75,200,-25),label:"CPUonGPU",t:0},{pos:new r(-13,200,-55),look:new r(0,200,-90),label:"GPU Stream",t:0},{pos:new r(19,200,-80),look:new r(40,200,-110),label:"Selkies",t:0},{pos:new r(90,200,-65),look:new r(100,200,-100),label:"Oris AI",t:0},{pos:new r(101,200,8),look:new r(90,200,-20),label:"VajraGrid",t:0},{pos:new r(84,200,76),look:new r(70,200,50),label:"VidyaMitra",t:0},{pos:new r(34,200,106),look:new r(20,200,80),label:"Netflip",t:0},{pos:new r(-5,200,96),look:new r(-20,200,70),label:"Arena",t:0},{pos:new r(-20,200,67),look:new r(-10,200,40),label:"Hackathon",t:0},{pos:new r(-60,8,30),look:new r(-40,8,0),label:"SKILLS",t:0},{pos:new r(0,120,160),look:new r(0,0,0),label:"CONTACT",t:0}],ho=1600;class fo{constructor(e){c(this,"camera");c(this,"posSpline");c(this,"lookSpline");c(this,"t",0);c(this,"currentSection",0);c(this,"mouseX",0);c(this,"mouseY",0);c(this,"_pos",new r);c(this,"_look",new r);c(this,"_ahead",new r);c(this,"onSectionChange");c(this,"_lastFiredSection",0);this.camera=e,this.buildSpline(),this.init()}buildSpline(){const e=N.map(o=>o.pos.clone()),t=N.map(o=>o.look.clone());this.posSpline=new qe(e,!1,"catmullrom",.5),this.lookSpline=new qe(t,!1,"catmullrom",.5);const s=N.length;N.forEach((o,i)=>{o.t=i/(s-1)}),this.t=0,this.posSpline.getPoint(0,this._pos),this.lookSpline.getPoint(0,this._look),this.camera.position.copy(this._pos),this.camera.lookAt(this._look)}init(){window.addEventListener("mousemove",s=>{this.mouseX=(s.clientX/window.innerWidth-.5)*2,this.mouseY=(s.clientY/window.innerHeight-.5)*2});let e=!1;window.addEventListener("wheel",s=>{if(e)return;e=!0;const o=s.deltaY>0?1:-1;this.goTo(this.currentSection+o),setTimeout(()=>{e=!1},ho)},{passive:!0});let t=0;window.addEventListener("touchstart",s=>{t=s.touches[0].clientY}),window.addEventListener("touchend",s=>{const o=t-s.changedTouches[0].clientY;Math.abs(o)>40&&this.goTo(this.currentSection+(o>0?1:-1))}),window.addEventListener("keydown",s=>{(s.key==="ArrowDown"||s.key==="ArrowRight")&&this.goTo(this.currentSection+1),(s.key==="ArrowUp"||s.key==="ArrowLeft")&&this.goTo(this.currentSection-1)})}goTo(e){if(e=Math.max(0,Math.min(N.length-1,e)),e===this.currentSection)return;const t=this.currentSection;this.currentSection=e;const s=N[e].t,i=.6+Math.abs(s-this.t)*5;Z.killTweensOf(this),Z.to(this,{t:s,duration:i,ease:"power2.inOut",onUpdate:()=>this._fireCrossings(t,e),onComplete:()=>{var l;this._lastFiredSection=e,(l=this.onSectionChange)==null||l.call(this,e),this._updateUI(e)}}),this._updateUI(e)}_fireCrossings(e,t){const s=t>e?1:-1;N.forEach((o,i)=>{var a;(s>0?this.t>=o.t&&i>this._lastFiredSection&&i<=t:this.t<=o.t&&i<this._lastFiredSection&&i>=t)&&(this._lastFiredSection=i,(a=this.onSectionChange)==null||a.call(this,i),this._updateUI(i))})}update(e){this.posSpline.getPoint(this.t,this._pos),this.camera.position.copy(this._pos);const t=Math.min(1,this.t+.015);this.posSpline.getPoint(t,this._ahead),this.lookSpline.getPoint(this.t,this._look);const s=this._look.x*.8+this._ahead.x*.2+this.mouseX*5,o=this._look.y*.8+this._ahead.y*.2-this.mouseY*3,i=this._look.z*.8+this._ahead.z*.2;this.camera.lookAt(s,o,i)}_updateUI(e){document.querySelectorAll(".nav-dot").forEach((s,o)=>s.classList.toggle("active",o===e));const t=document.getElementById("progress-bar");t&&(t.style.height=e/(N.length-1)*100+"%")}getCurrentSection(){return this.currentSection}}const lt=[{id:"ps3-gpu",title:"PS3 Cell GPU Emulator",subtitle:"Systems / Emulation",desc:"Full emulation of the Cell Broadband Engine's SPU pipeline in WebGL. 6 SPU cores, PPE scheduler, DMA bus — running real PS3 shaders in the browser at 200 GIPS.",tags:["C++","WebGL","GLSL","Cell BE","Emulation"],url:"https://github.com/Aerosane/ps3-cell-gpu-emulator",neonColor:"#00f5ff",district:"GPU DISTRICT",icon:"⬡"},{id:"cpuongpu",title:"CPUonGPU",subtitle:"Architecture Research",desc:"Runs a full x86 CPU simulation entirely on GPU compute shaders. Register file, ALU, cache hierarchy — all in GLSL. JIT-compiled x86 → SPIR-V at runtime.",tags:["GLSL","Compute Shaders","x86","JIT","SPIR-V"],url:"https://github.com/Aerosane/cpuongpu",neonColor:"#00f5ff",district:"GPU DISTRICT",icon:"⬢"},{id:"gpu-streaming",title:"GPU Streaming Pipeline",subtitle:"NvFBC + NVENC",desc:"Sub-frame-latency game streaming via NvFBC capture → NVENC H265/AV1 encode → WebRTC TURN relay. <1 frame E2E latency. Deployed on GitHub Codespace GPU.",tags:["NVENC","NvFBC","WebRTC","Rust","H265"],url:"https://github.com/Aerosane/gpu-streaming-nvfbc",neonColor:"#00f5ff",district:"GPU DISTRICT",icon:"▶"},{id:"selkies-rust",title:"Selkies-Rust",subtitle:"Python→Rust Port",desc:"Complete rewrite of the Selkies WebRTC game streaming stack from Python into Rust. 6 crates: pipeline, signaling, input, encoding, metrics, CLI.",tags:["Rust","WebRTC","GStreamer","Tokio","GSAP"],url:"https://github.com/Aerosane/selkies-rust",neonColor:"#ff6b1a",district:"SYSTEMS CORRIDOR",icon:"⚙"},{id:"oris-ai",title:"Oris — AI SRE",subtitle:"🏆 Runner-up · TechSynapse 2026",desc:"Autonomous Site Reliability Engineer: ingests production logs, PII-masks with Presidio, infers root cause via Gemini 2.0, opens GitHub PRs with fixes. Zero human touch.",tags:["Python","Gemini 2.0","Presidio","LangChain","FastAPI"],url:"https://github.com/Aerosane/oris",neonColor:"#ff00aa",district:"AI DISTRICT",icon:"◈"},{id:"vajragrid",title:"VajraGrid",subtitle:"🇮🇳 India Innovates 2026 · Bharat Mandapam",desc:"AI-hardened power grid security: detects SCADA cyberattacks in 16s, 4-layer ML defense stack, adversarial training. Exhibited nationally at Bharat Mandapam.",tags:["Python","PyTorch","SCADA","Adversarial ML","GridSec"],url:"https://github.com/Aerosane/vajragridr",neonColor:"#ff00aa",district:"AI DISTRICT",icon:"⚡"},{id:"vidyamitra",title:"VidyaMitra",subtitle:"IISER JEE Prep",desc:"AI tutor for JEE aspirants: adaptive quiz engine, LaTeX equation rendering, spaced repetition. Covers Physics, Chemistry, Math with difficulty auto-calibration.",tags:["TypeScript","React","LaTeX","OpenAI","Supabase"],url:"https://github.com/Aerosane/vidyamitra",neonColor:"#00ff88",district:"EDTECH ZONE",icon:"⬟"},{id:"netflip",title:"Netflip VOD",subtitle:"Full-Stack Streaming",desc:"Netflix-clone with HLS adaptive streaming, Azure Blob CDN, Fastly edge cache, WebSocket live chat, OAuth2, recommendation engine. 1080p adaptive bitrate.",tags:["Next.js","HLS","Azure","Fastly","PostgreSQL"],url:"https://github.com/Aerosane/netflip-vod",neonColor:"#7b2fff",district:"WEB DISTRICT",icon:"▨"},{id:"coding-arena",title:"Coding Arena",subtitle:"Competitive Judging Platform",desc:"Online judge with isolated Docker execution, multi-language support, real-time leaderboard, plagiarism detection via AST similarity. 200ms median judge latency.",tags:["Go","Docker","Redis","React","WebSocket"],url:"https://github.com/Aerosane/coding_arena",neonColor:"#7b2fff",district:"WEB DISTRICT",icon:"{ }"},{id:"hackathon",title:"Hackathon Wins",subtitle:"Hall of Fame",desc:"🏆 Runner-up at TechSynapse 2026 (Oris AI SRE). 🇮🇳 National exhibition at India Innovates 2026, Bharat Mandapam, New Delhi (VajraGrid). 1st year, two nationals.",tags:["Oris AI","VajraGrid","TechSynapse","India Innovates"],url:"https://github.com/Aerosane",neonColor:"#ffe642",district:"HALL OF FAME",icon:"🏆"}],po={Languages:["C++","Rust","Python","TypeScript","Go","GLSL/HLSL"],Systems:["WebRTC","WebGL/WebGPU","NVENC/NvFBC","Docker","Linux"],"AI/ML":["PyTorch","Gemini API","LangChain","Presidio","HuggingFace"],Web:["React","Next.js","Vite","Node.js","PostgreSQL","Redis"],Tools:["Git","GitHub Actions","Azure","GStreamer","Tokio"]};class mo{constructor(){c(this,"group",new Oe);c(this,"hoverTargets",[]);c(this,"visible",!1);c(this,"visibleValue",0)}enter(){this.group.visible=!0,this.visible=!0,Z.killTweensOf(this),Z.to(this,{visibleValue:1,duration:1.4,ease:"power2.out",onUpdate:()=>this.setVisible(this.visibleValue)})}exit(){this.visible=!1,Z.killTweensOf(this),Z.to(this,{visibleValue:0,duration:.8,ease:"power2.in",onUpdate:()=>this.setVisible(this.visibleValue),onComplete:()=>{this.group.visible=!1}})}setVisible(e){}dispose(){this.group.traverse(e=>{e.geometry&&e.geometry.dispose()})}}function go(n){const s=document.createElement("canvas");s.width=900,s.height=440;const o=s.getContext("2d"),i=n.neonColor;o.fillStyle="#03040f",o.fillRect(0,0,900,440);for(let f=0;f<440;f+=4)o.fillStyle="rgba(0,0,0,0.18)",o.fillRect(0,f,900,2);const l=o.createLinearGradient(0,0,14,0);l.addColorStop(0,i),l.addColorStop(1,"transparent"),o.fillStyle=l,o.shadowColor=i,o.shadowBlur=28,o.fillRect(0,0,7,440),o.shadowBlur=0,o.font="bold 11px monospace",o.fillStyle=i+"aa",o.textAlign="left",o.fillText("◈ "+n.district.toUpperCase(),24,28);const a=n.title.length>18?48:n.title.length>13?58:70;o.font=`bold ${a}px monospace`,o.shadowColor=i,o.shadowBlur=50,o.fillStyle="#ffffff",o.fillText(n.title,24,62+(70-a)),o.shadowBlur=26,o.fillStyle=i+"bb",o.fillText(n.title,24,62+(70-a)),o.shadowBlur=0,o.font="18px monospace",o.fillStyle="rgba(255,255,255,0.65)",o.fillText(n.subtitle,24,138),o.font="14px monospace",o.fillStyle="rgba(200,220,255,0.45)";const p=852,v=n.desc.split(" "),d=[];let h="";for(const f of v){const w=h?h+" "+f:f;if(o.measureText(w).width>p){if(d.length===1){d.push(h+"…"),h="";break}d.push(h),h=f}else h=w}h&&d.length<2&&d.push(h),d.forEach((f,w)=>o.fillText(f,24,164+w*20)),o.strokeStyle=i+"30",o.lineWidth=1,o.beginPath(),o.moveTo(24,212),o.lineTo(876,212),o.stroke(),o.font="bold 13px monospace";let u=24;for(const f of n.tags.slice(0,5)){const w=o.measureText(f).width+20;if(u+w>876)break;o.fillStyle=i+"18",o.fillRect(u,224,w,26),o.strokeStyle=i+"66",o.lineWidth=1,o.strokeRect(u,224,w,26),o.fillStyle=i+"ee",o.fillText(f,u+10,241),u+=w+8}return o.font="12px monospace",o.fillStyle="rgba(255,255,255,0.22)",o.fillText(n.url.replace("https://",""),24,278),o.font="bold 13px monospace",o.shadowColor=i,o.shadowBlur=14,o.fillStyle=i+"99",o.fillText("▶  CLICK TO VIEW PROJECT",24,422),o.shadowBlur=0,new st(s)}function z(n,e,t,s,o){const i=new ae(new he(n,e,t),o);return i.position.copy(s),i.frustumCulled=!1,i}class vo extends mo{constructor(t,s,o){super();c(this,"projIdx");c(this,"panelPos");c(this,"camPos");c(this,"fadeMats",[]);c(this,"particleMat");this.projIdx=t,this.panelPos=s,this.camPos=o}create(t){t.add(this.group);const s=lt[this.projIdx],o=new m(s.neonColor),i=new Oe;i.position.copy(this.panelPos);const l=this.camPos.x-this.panelPos.x,a=this.camPos.z-this.panelPos.z;i.rotation.y=Math.atan2(l,a),this.group.add(i);const p=(S,E)=>(S.opacity=0,this.fadeMats.push([S,E]),S),v=p(new _({map:go(s),transparent:!0,depthWrite:!1,side:Ct,alphaTest:.01}),1),d=new ae(new ve(40,19.5),v);d.frustumCulled=!1,d.userData.isLabel=!0,d.userData.onClick=()=>window.open(s.url,"_blank"),i.add(d);const h=p(new _({color:o,transparent:!0,blending:X,depthWrite:!1}),.85);i.add(z(41,.5,.4,new r(0,9.75,.1),h)),i.add(z(41,.5,.4,new r(0,-9.75,.1),h)),i.add(z(.5,20.5,.4,new r(-20.25,0,.1),h)),i.add(z(.5,20.5,.4,new r(20.25,0,.1),h));const u=190,f=p(new _({color:2763326,transparent:!0}),1),w=new r(-13,-9.75-u/2,0),T=new r(13,-9.75-u/2,0);i.add(z(.9,u,.9,w,f)),i.add(z(.9,u,.9,T,f)),i.add(z(27,.7,.9,new r(0,-9.75-u+.4,0),f));const g=p(new _({color:o,transparent:!0,blending:X,depthWrite:!1}),.5);i.add(z(41,.3,.1,new r(0,9.75,.2),g));const y=60,b=new Float32Array(y*3);for(let S=0;S<y;S++)b[S*3]=this.panelPos.x+(Math.random()-.5)*60,b[S*3+1]=this.panelPos.y+(Math.random()-.5)*35,b[S*3+2]=this.panelPos.z+(Math.random()-.5)*60;const P=new it;P.setAttribute("position",new me(b,3)),this.particleMat=new At({size:.4,color:o,transparent:!0,opacity:0,blending:X,sizeAttenuation:!0});const M=new at(P,this.particleMat);M.frustumCulled=!1,this.group.add(M)}update(t){}setVisible(t){for(const[s,o]of this.fadeMats)s.opacity=t*o;this.particleMat&&(this.particleMat.opacity=t*.45)}onHover(){}}const wo=[[2,0],[3,1],[4,2],[5,3],[6,4],[7,5],[8,6],[9,7],[10,8],[11,9]];class bo{constructor(e,t){c(this,"envs",new Map);c(this,"activeEnv",null);c(this,"activeIdx",-1);for(const[s,o]of wo){const i=N[s],l=new vo(o,i.look.clone(),i.pos.clone());l.create(e),l.group.visible=!1,this.envs.set(s,l)}}onSection(e){if(e===this.activeIdx)return;this.activeIdx=e,this.activeEnv&&(this.activeEnv.exit(),this.activeEnv=null);const t=this.envs.get(e);t&&(this.activeEnv=t,t.enter())}update(e){this.activeEnv&&this.activeEnv.update(e)}}const yo=document.getElementById("scene-canvas"),Q=new Pt({canvas:yo,antialias:!0,alpha:!1,powerPreference:"high-performance"});Q.setPixelRatio(Math.min(devicePixelRatio,2));Q.setSize(innerWidth,innerHeight);Q.toneMapping=xt;Q.toneMappingExposure=.95;const k=new Tt;k.background=new m(131602);k.fog=new Et(197400,.003);const V=new Mt(60,innerWidth/innerHeight,.5,1200),we=new uo;we.setup(Q,k,V);const Ge=new so;Ge.create(k);const H=new to;H.generate(k);H.addSearchlights(k);const So=lt.map((n,e)=>{const t=N[e+2];return{text:n.district,pos:new r(t.pos.x+12,80,t.pos.z-18),color:n.neonColor}});H.addNeonSigns(k,So);const ct=new ro;ct.create(k);const Be=new oo;Be.create(k);const dt=new no;dt.create(k);const Co=new kt(128,0,.4);k.add(Co);const He=new Oe;k.add(He);var tt,ot;(ot=(tt=H.cityGroup)==null?void 0:tt.children)==null||ot.forEach(n=>He.add(n));const ut=new bo(k,He),ge=new m(62975);function Ao(n){const e=Math.min(n,ie.length-1);ge.copy(ie[e]),Be.setDistrictNeon(ge),Ge.update(0,V.position,ge)}const Po=[["NEON DISTRICT","A cyberpunk portfolio"],["ABOUT","Who is behind this"],["PS3 CELL GPU","PS3 SPU emulator in WebGL"],["CPUonGPU","x86 CPU running on GPU"],["GPU STREAMING","Sub-frame game streaming"],["SELKIES RUST","WebRTC stack rebuilt in Rust"],["ORIS AI","Autonomous SRE agent"],["VAJRAGRID","AI power grid security"],["VIDYAMITRA","Adaptive JEE AI tutor"],["NETFLIP","HLS streaming platform"],["ARENA OJ","Online judge platform"],["HACKATHON","Competition highlights"],["TECH STACK","Tools and languages"],["CONTACT","Get in touch"]],J=document.createElement("div");J.id="section-banner";Object.assign(J.style,{position:"fixed",bottom:"24px",left:"50%",transform:"translateX(-50%)",textAlign:"center",pointerEvents:"none",zIndex:"50",opacity:"0",transition:"opacity 0.4s",background:"rgba(0,0,8,0.65)",padding:"10px 28px",borderTop:"1px solid currentColor"});document.body.appendChild(J);function xo(n){const[e,t]=Po[n]??["",""],s=ie[n]?"#"+ie[n].getHexString():"#00f5ff";J.style.color=s,J.innerHTML=`
    <div style="font-family:monospace;font-size:8px;letter-spacing:4px;color:${s};margin-bottom:4px;text-transform:uppercase;opacity:0.7">
      DISTRICT_${String(n).padStart(2,"0")}
    </div>
    <div style="font-family:monospace;font-size:1.1rem;font-weight:900;color:#fff;
                text-shadow:0 0 20px ${s},0 0 40px ${s}88;letter-spacing:0.08em;line-height:1.1">
      ${e}
    </div>
    <div style="font-family:monospace;font-size:0.75rem;color:${s};
                letter-spacing:0.15em;margin-top:4px;opacity:0.85">
      ${t}
    </div>
  `,J.style.opacity="1"}const ze=new fo(V);ze.onSectionChange=n=>{Eo(n),Mo(n),Ao(n),we.triggerGlitch(),ut.onSection(n),xo(n)};const To=document.getElementById("nav-dots");N.forEach((n,e)=>{const t=document.createElement("div");t.className="nav-dot"+(e===0?" active":""),t.title=n.label,t.addEventListener("click",()=>ze.goTo(e)),To.appendChild(t)});function Eo(n){document.querySelectorAll(".sect").forEach((e,t)=>{e.classList.toggle("active",t===n)}),document.querySelectorAll(".nav-dot").forEach((e,t)=>{e.classList.toggle("active",t===n)})}function Mo(n){const e=document.getElementById("hud-section");e&&(e.textContent=`DISTRICT_${String(n).padStart(2,"0")} / ${N[n].label}`)}const Ke=document.getElementById("skills-grid");Ke&&Object.entries(po).forEach(([n,e])=>{const t=document.createElement("div");t.className="skill-cat",t.innerHTML=`<div class="skill-cat-name">// ${n}</div>`+e.map(s=>`<div class="skill-item">${s}</div>`).join(""),Ke.appendChild(t)});const B=document.getElementById("contact-input"),ue=document.getElementById("contact-input-display");var nt;(nt=document.getElementById("sect-13"))==null||nt.addEventListener("click",()=>B==null?void 0:B.focus());B==null||B.addEventListener("input",()=>{ue&&(ue.textContent=(B.value||"")+"_"),B.value.trim().toLowerCase()==="sudo"&&(ko(),B.value="",ue&&(ue.textContent="_"))});function ko(){const n=document.querySelector("#sect-13 .terminal-body");if(!n)return;const e=document.createElement("p");e.className="output neon-green",e.textContent="> Permission granted. Downloading your future...",n.appendChild(e),setTimeout(()=>{const t=document.createElement("p");t.className="output",t.innerHTML='<span style="color:#ffe642">root@neon-district:~# ██████████ 100%  COMPLETE</span>',n.appendChild(t)},1500)}const Ze=["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];let oe=0;window.addEventListener("keydown",n=>{n.key===Ze[oe]?oe++:oe=0,oe===Ze.length&&(oe=0,Io())});let Ie=!1;function Io(){Ie=!Ie,[H.meshA,H.meshB,H.meshC,H.meshD].forEach(n=>{const e=n.material;e.wireframe=Ie})}const Le=document.getElementById("boot-log"),Je=document.getElementById("boot-bar"),ne=document.getElementById("loading-screen"),Re=["Initializing WebGPU context","Generating city geometry","Compiling 47 shader programs","Spawning rain particles","Calibrating post-processing chain","System ready"];async function Lo(){for(let n=0;n<Re.length;n++){await new Promise(t=>setTimeout(t,260+Math.random()*200));const e=document.createElement("p");e.innerHTML=`<span style="color:rgba(0,245,255,.5)">[BOOT]</span> ${Re[n]}... <span class="ok">[OK]</span>`,Le==null||Le.appendChild(e),Je&&(Je.style.width=(n+1)/Re.length*100+"%")}await new Promise(n=>setTimeout(n,600)),ne==null||ne.classList.add("fade-out"),setTimeout(()=>{ne&&(ne.style.display="none")},850)}Lo();const Qe=new It,Ne=new se;window.addEventListener("click",n=>{if(n.target.closest("#env-detail-panel"))return;Ne.x=n.clientX/innerWidth*2-1,Ne.y=-(n.clientY/innerHeight)*2+1,Qe.setFromCamera(Ne,V);const e=Qe.intersectObjects(k.children,!0);for(const t of e){const s=t.object;if(s.userData.isLabel&&s.userData.onClick){n.stopPropagation(),s.userData.onClick();return}}});window.addEventListener("resize",()=>{V.aspect=innerWidth/innerHeight,V.updateProjectionMatrix(),Q.setSize(innerWidth,innerHeight),we.resize(innerWidth,innerHeight)});const et=new Lt;function ht(){requestAnimationFrame(ht);const n=et.getElapsedTime(),e=et.getDelta();H.update(n),Be.update(n),dt.update(n,V.position),ct.update(n),Ge.update(n,V.position,ge),ze.update(e),ut.update(n),we.render()}ht();
