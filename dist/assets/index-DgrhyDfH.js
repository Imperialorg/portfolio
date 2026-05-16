var ft=Object.defineProperty;var ut=(i,t,n)=>t in i?ft(i,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):i[t]=n;var h=(i,t,n)=>ut(i,typeof t!="symbol"?t+"":t,n);import{i as M,d as me,I as oe,q as X,u as Y,s as ne,a2 as d,Q as se,x as ge,m as Ae,j as Ce,a as ae,C as Oe,t as we,X as ye,f as nt,e as Me,y as st,Y as ht,B as mt,E as pt,a1 as pe,_ as gt,g as qe,G as ze,p as vt,z as wt,a5 as yt,A as St,W as bt,o as Ct,P as Tt,H as Pt,S as At,h as Mt}from"./three-uBnUpQ-C.js";import{b as Et,R as kt,a as Rt,B as Re,C as It,V as Lt,N as Nt,S as xt,G as Dt,c as Ie,E as Ut}from"./postprocessing-DQ1XEIde.js";import{g as ie}from"./gsap-SFc2wnMY.js";(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))s(o);new MutationObserver(o=>{for(const a of o)if(a.type==="childList")for(const c of a.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&s(c)}).observe(document,{childList:!0,subtree:!0});function n(o){const a={};return o.integrity&&(a.integrity=o.integrity),o.referrerPolicy&&(a.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?a.credentials="include":o.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function s(o){if(o.ep)return;o.ep=!0;const a=n(o);fetch(o.href,a)}})();function Xe(i){return i*i*i*(i*(i*6-15)+10)}function Le(i,t,n){return i+n*(t-i)}function Te(i,t,n){const s=i&3,o=s<2?t:n,a=s<2?n:t;return(i&1?-o:o)+(i&2?-a:a)}const j=Array.from({length:512},(i,t)=>t).sort(()=>Math.random()-.5);for(let i=0;i<256;i++)j[i+256]=j[i];function Gt(i,t){const n=Math.floor(i)&255,s=Math.floor(t)&255,o=i-Math.floor(i),a=t-Math.floor(t),c=Xe(o),l=Xe(a),v=j[j[n]+s],C=j[j[n]+s+1],p=j[j[n+1]+s],w=j[j[n+1]+s+1];return Le(Le(Te(v,o,a),Te(p,o-1,a),c),Le(Te(C,o,a-1),Te(w,o-1,a-1),c),l)}function fe(i,t,n=4,s=2,o=.5){let a=0,c=.5,l=1;for(let v=0;v<n;v++)a+=Gt(i*l,t*l)*c,l*=s,c*=o;return a}function y(i,t){return i+Math.random()*(t-i)}function te(i,t){return Math.floor(y(i,t+1))}const Ot=`
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
`,Ft=`
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
  return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453);
}

void main() {
  // ── WALL BASE — fake path-traced ambient (never pitch black) ──
  // Sky bounce: cool blue-purple from above
  vec3 skyAmbient  = vec3(0.038, 0.038, 0.072);
  // Street glow: warm orange rising from ground, fades with height
  float streetBlend = clamp(1.0 - vWorldPos.y / 80.0, 0.0, 1.0);
  vec3 cityAmbient = vec3(0.055, 0.028, 0.008) * streetBlend;
  // District neon bleed: subtle tint from nearest neon zone
  vec3 neonAmbient = vNeonColor * 0.038;
  // Face-angle variation: surfaces facing viewer get slightly more light
  vec3 viewDir2 = normalize(cameraPosition - vWorldPos);
  float facing  = max(0.0, dot(vNormal, viewDir2));
  vec3 faceBounce = vec3(0.02, 0.022, 0.03) * facing;
  vec3 color = skyAmbient + cityAmbient + neonAmbient + faceBounce;

  // ── WINDOW GRID ────────────────────────────────────────────
  float density = mix(10.0, 32.0, clamp(vHeight/250.0,0.0,1.0));
  vec2 wScale = vec2(16.0, 24.0);
  vec2 wCell  = floor(vUv * wScale);
  vec2 wFrac  = fract(vUv * wScale);

  // Window frame — thicker borders → small windows
  float frame = step(0.22, wFrac.x) * step(0.18, wFrac.y) *
                step(wFrac.x, 0.78) * step(wFrac.y, 0.80);

  // Per-window random: static on/off (no flicker)
  float wh = hash(wCell + floor(vWorldPos.xz * 0.008));
  float isOn = step(0.70, wh);

  vec3 wColor;
  if (wh < 0.85) wColor = vec3(1.0, 0.75, 0.35) * 1.4;  // warm amber
  else           wColor = vec3(0.4, 0.6, 1.0) * 1.2;     // cool blue

  color += frame * isOn * wColor;

  // ── VERTICAL EDGE STRIPS ────────────────────────────────────
  float edgeGlow = (1.0 - smoothstep(0.0, 0.008, vUv.x)) +
                   (1.0 - smoothstep(0.0, 0.008, 1.0 - vUv.x));
  color += edgeGlow * vNeonColor * 0.6;

  // ── ROOFTOP CAP ─────────────────────────────────────────────
  float roofLine = smoothstep(0.985, 1.0, vUv.y);
  color += roofLine * vNeonColor * 2.0;

  // ── PANEL SEAM LINES ────────────────────────────────────────
  float panelSeamV = 1.0 - smoothstep(0.0, 0.006, fract(vUv.x * 8.0));
  color -= panelSeamV * 0.008;
  float panelSeamH = 1.0 - smoothstep(0.0, 0.004, fract(vUv.y * 6.0));
  color -= panelSeamH * 0.006;

  // ── CLOSE-UP CONCRETE DETAIL ────────────────────────────────
  float camDist = length(vWorldPos - cameraPosition);
  float closeBlend = 1.0 - smoothstep(8.0, 35.0, camDist);
  vec2 grainUV = floor(vUv * vec2(80.0, 160.0));
  float grain = hash(grainUV + floor(vWorldPos.xz * 0.02));
  color += (grain - 0.5) * closeBlend * 0.015;

  // ── FOG ─────────────────────────────────────────────────────
  float dist = length(vWorldPos - cameraPosition);
  float fog = clamp((dist - uFogNear)/(uFogFar - uFogNear), 0.0, 1.0);
  color = mix(color, uFogColor, fog * 0.78);

  gl_FragColor = vec4(color, 1.0);
}
`,Wt=`
varying vec2 vUv;
varying vec3 vWorldPos;
varying vec3 vNormal;
void main() {
  vUv = uv;
  vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,zt=`
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
`,Ht=`
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
`,Bt=`
varying float vAlpha;
void main() {
  gl_FragColor = vec4(0.55, 0.75, 1.0, vAlpha * 0.35);
}
`,_t=`
varying vec3 vLocalPos;
void main() {
  vLocalPos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,Vt=`
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
`,qt=`
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
`,Xt=`
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
`,A=32,O=16,jt=6,_=O+jt,q=A/2*_,Ne={color:new M(197400),near:100,far:500},ve=[new M(62975),new M(62975),new M(16711850),new M(16711850),new M(16739098),new M(8073215),new M(8073215),new M(65416),new M(65416),new M(16770626)];function Yt(){return new ye({vertexShader:Ot,fragmentShader:Ft,uniforms:{uTime:{value:0},uFogColor:{value:Ne.color},uFogNear:{value:Ne.near},uFogFar:{value:Ne.far}}})}function $t(i,t){const n=i/A,s=t/A;return n<.35&&s<.35?0:n<.65&&s<.35?1:n>=.65&&s<.35?2:n<.35&&s<.65?3:n>=.65&&s<.65?4:n<.35&&s>=.65?5:n<.65&&s>=.65?6:n>=.65&&s>=.65?7:s>.45&&s<.55?8:9}class Kt{constructor(){h(this,"sectionLow");h(this,"sectionMid");h(this,"sectionTop");h(this,"meshD");h(this,"meshLedge");h(this,"mats",[])}generate(t){const n=A*A,s=Yt();this.mats.push(s);const o=()=>{const e=new me(1,1,1),r=new Float32Array(n),m=new Float32Array(n*3);e.setAttribute("aHeight",new oe(r,1)),e.setAttribute("aNeonColor",new oe(m,3));const I=new X(e,s.clone(),n);return I.frustumCulled=!1,{geo:e,heights:r,colors:m,mesh:I}},a=o(),c=o(),l=o();this.sectionLow=a.mesh,this.sectionMid=c.mesh,this.sectionTop=l.mesh;for(const e of[a.mesh,c.mesh,l.mesh])this.mats.push(e.material);const v=new me(1,1,1),C=new Float32Array(n),p=new Float32Array(n*3);v.setAttribute("aHeight",new oe(C,1)),v.setAttribute("aNeonColor",new oe(p,3)),this.meshD=new X(v,s.clone(),n),this.meshD.frustumCulled=!1,this.mats.push(this.meshD.material);const w=new me(1,1,1),g=new Y({color:789524});this.meshLedge=new X(w,g,A*A*6),this.meshLedge.frustumCulled=!1,this.meshLedge.count=0;const f=new ne,u=new d,S=new d,b=new se;let T=0,E=0,k=0,L=0,P=0;for(let e=0;e<A;e++)for(let r=0;r<A;r++){const m=e*_-q,I=r*_-q;if(e%5===0||r%5===0||e%2===0&&r%2===0&&Math.random()<.25)continue;const W=e/A*4-2,G=r/A*4-2,$=fe(W,G,5),K=Math.sqrt(W*W+G*G)/3,J=Math.max(.18,1-K*.6),R=Math.max(8,(22+$*170)*J)+y(4,28),x=y(O*.42,O*.9),z=y(O*.42,O*.9),Se=$t(e,r),U=ve[Se],ce=R*.62;if(a.heights[T]=R,a.colors[T*3]=U.r,a.colors[T*3+1]=U.g,a.colors[T*3+2]=U.b,u.set(m,ce/2,I),S.set(x,ce,z),f.compose(u,b,S),this.sectionLow.setMatrixAt(T,f),T++,R>40){const D=R*.23,H=x*.68,B=z*.68;c.heights[E]=R,c.colors[E*3]=U.r,c.colors[E*3+1]=U.g,c.colors[E*3+2]=U.b,u.set(m,R*.62+D/2,I),S.set(H,D,B),f.compose(u,b,S),this.sectionMid.setMatrixAt(E,f),E++}if(R>100){const D=R*.15,H=x*.38,B=z*.38;l.heights[k]=R,l.colors[k*3]=U.r,l.colors[k*3+1]=U.g,l.colors[k*3+2]=U.b,u.set(m,R*.85+D/2,I),S.set(H,D,B),f.compose(u,b,S),this.sectionTop.setMatrixAt(k,f),k++}if(Math.random()>=.95){const D=y(1.5,4),H=y(1.5,4),B=R*1.8;C[L]=B,p[L*3]=U.r,p[L*3+1]=U.g,p[L*3+2]=U.b,u.set(m+y(-2,2),B/2,I+y(-2,2)),S.set(D,B,H),f.compose(u,b,S),this.meshD.setMatrixAt(L,f),L++}const be=Math.floor(y(2,4));for(let D=1;D<=be;D++){const H=D/(be+1)*ce;u.set(m,H,I),S.set(x+1.2,.7,z+1.2),f.compose(u,b,S),this.meshLedge.setMatrixAt(P,f),P++}R>40&&(u.set(m,R*.62,I),S.set(x*.72,.7,z*.72),f.compose(u,b,S),this.meshLedge.setMatrixAt(P,f),P++),R>100&&(u.set(m,R*.85,I),S.set(x*.42,.7,z*.42),f.compose(u,b,S),this.meshLedge.setMatrixAt(P,f),P++)}this.sectionLow.count=T,this.sectionMid.count=E,this.sectionTop.count=k,this.meshD.count=L;for(const e of[this.sectionLow,this.sectionMid,this.sectionTop,this.meshD]){e.instanceMatrix.needsUpdate=!0;const r=e.geometry;r.getAttribute("aHeight").needsUpdate=!0,r.getAttribute("aNeonColor").needsUpdate=!0,t.add(e)}this.meshLedge.count=P,this.meshLedge.instanceMatrix.needsUpdate=!0,t.add(this.meshLedge)}addBillboardScreens(t){const s=e=>{const r=document.createElement("canvas");r.width=512,r.height=256;const m=r.getContext("2d");return e(m),new Oe(r)},o=s(e=>{e.fillStyle="#000",e.fillRect(0,0,512,256),e.strokeStyle="#00f5ff",e.lineWidth=2;for(let r=0;r<6;r++)e.beginPath(),e.moveTo(20,30+r*36),e.lineTo(492,30+r*36),e.stroke();e.fillStyle="#00f5ff";for(let r=0;r<8;r++)for(let m=0;m<5;m++)e.beginPath(),e.arc(40+r*60,30+m*36,5,0,Math.PI*2),e.fill();e.font="bold 32px monospace",e.fillStyle="#00f5ff88",e.textAlign="center",e.fillText("SYSTEM ONLINE",256,230)}),a=s(e=>{e.fillStyle="#000",e.fillRect(0,0,512,256),e.fillStyle="#ff00aa18";for(let r=-4;r<20;r+=2)e.beginPath(),e.moveTo(r*30,0),e.lineTo(r*30+30,0),e.lineTo(r*30+30+256,256),e.lineTo(r*30+256,256),e.closePath(),e.fill();e.strokeStyle="#ff00aa",e.lineWidth=3,e.strokeRect(6,6,500,244),e.fillStyle="#ff00aa",e.font="bold 56px monospace",e.textAlign="center",e.fillText("DANGER",256,110),e.font="bold 42px serif",e.fillText("危険区域",256,180),e.font="18px monospace",e.fillStyle="#ff00aa88",e.fillText("AUTHORIZED PERSONNEL ONLY",256,230)}),c=s(e=>{e.fillStyle="#0a0500",e.fillRect(0,0,512,256),e.fillStyle="#ff8800",e.font="bold 28px monospace",e.textAlign="left",["GPU-X  ▲ 4821.3","NET-7  ▼ 219.08","SYS-4  ▲ 1104.7","AI-12  ▲ 8820.0","HRD-3  ▼  553.2"].forEach((m,I)=>e.fillText(m,20,48+I*44)),e.strokeStyle="#ff8800",e.lineWidth=2,e.strokeRect(6,6,500,244),e.fillStyle="#ff880044",e.fillRect(6,6,500,30),e.fillStyle="#ff8800",e.font="bold 22px monospace",e.textAlign="center",e.fillText("◈ NEON DISTRICT EXCHANGE ◈",256,26)}),l=s(e=>{e.fillStyle="#000510",e.fillRect(0,0,512,256),e.strokeStyle="#4488ff",e.lineWidth=2;for(let r=20;r<110;r+=22){e.beginPath();for(let m=0;m<6;m++){const I=m*Math.PI/3-Math.PI/6,W=256+Math.cos(I)*r,G=128+Math.sin(I)*r;m===0?e.moveTo(W,G):e.lineTo(W,G)}e.closePath(),e.stroke()}e.fillStyle="#4488ff",e.font="bold 22px monospace",e.textAlign="center",e.fillText("NEXUS CORP",256,220),e.font="14px monospace",e.fillStyle="#4488ff88",e.fillText("EST. 2047  |  SECTOR 7",256,248)}),v=s(e=>{e.fillStyle="#000a00",e.fillRect(0,0,512,256),e.fillStyle="#00ff44",e.font="12px monospace";for(let r=0;r<32;r++)for(let m=0;m<16;m++)Math.random()>.45&&e.fillText(Math.random()>.5?"1":"0",8+r*16,14+m*15);e.fillStyle="#00ff4422",e.fillRect(0,0,512,256),e.strokeStyle="#00ff44",e.lineWidth=2,e.strokeRect(4,4,504,248),e.fillStyle="#00ff44",e.font="bold 34px monospace",e.textAlign="center",e.shadowBlur=16,e.shadowColor="#00ff44",e.fillText("MATRIX CORE",256,148),e.shadowBlur=0}),C=s(e=>{e.fillStyle="#05000a",e.fillRect(0,0,512,256),e.strokeStyle="#aa00ff",e.lineWidth=3,e.strokeRect(6,6,500,244),e.strokeStyle="#aa00ff66",e.lineWidth=1,e.strokeRect(16,16,480,224),e.fillStyle="#aa00ff",e.font="bold 40px monospace",e.textAlign="center",e.shadowBlur=20,e.shadowColor="#aa00ff",e.fillText("RESTRICTED",256,100),e.fillText("ACCESS",256,155),e.shadowBlur=0,e.font="16px monospace",e.fillStyle="#aa00ff88",e.fillText("CLEARANCE LEVEL Ω REQUIRED",256,220)}),p=s(e=>{e.fillStyle="#0a0000",e.fillRect(0,0,512,256),e.fillStyle="#ff112244",e.fillRect(0,0,512,256),e.strokeStyle="#ff1122",e.lineWidth=4,e.strokeRect(6,6,500,244),e.fillStyle="#ff1122",e.font="bold 80px monospace",e.textAlign="center",e.fillText("⚠",256,140),e.font="bold 28px monospace",e.fillText("ALERT",256,200),e.font="14px monospace",e.fillStyle="#ff112288",e.fillText("EMERGENCY BROADCAST ACTIVE",256,240)}),w=s(e=>{e.fillStyle="#080400",e.fillRect(0,0,512,256),e.fillStyle="#ff8800";for(let r=-4;r<20;r+=2)e.beginPath(),e.moveTo(r*28,0),e.lineTo(r*28+28,0),e.lineTo(r*28+28+256,256),e.lineTo(r*28+256,256),e.closePath(),e.fill();e.fillStyle="#080400";for(let r=-4;r<20;r+=2)e.beginPath(),e.moveTo((r+1)*28,0),e.lineTo((r+1)*28+28,0),e.lineTo((r+1)*28+28+256,256),e.lineTo((r+1)*28+256,256),e.closePath(),e.fill();e.fillStyle="#ff8800",e.font="bold 52px monospace",e.textAlign="center",e.fillText("UNDER",256,110),e.fillText("CONSTRUCTION",256,175),e.font="16px monospace",e.fillText("SECTOR 4 - ZONE B",256,230)}),g=[o,a,c,l,v,C,p,w],f=new ge(1,1),u=g.map(e=>{const r=new Y({map:e,transparent:!1,side:Ae}),m=new X(f,r,20);return m.frustumCulled=!1,m.count=0,m}),S=new Array(8).fill(0),b=new ne,T=new d,E=new se,k=new d,L=new d(0,1,0),P=8*20;for(let e=0;e<P;e++){const r=e%8,m=S[r];if(m>=20)continue;const I=te(1,A-2),W=te(1,A-2),G=I*_-q,$=W*_-q,K=I/A*4-2,J=W/A*4-2,R=Math.max(.18,1-Math.sqrt(K*K+J*J)/3*.6),x=Math.max(8,(22+fe(K,J,5)*170)*R)+y(4,28),z=y(O*.55,O*.85),Se=y(O*.55,O*.85),U=y(18,50),ce=y(10,28),be=y(x*.25,x*.55),D=Math.floor(Math.random()*4);let H=G,B=$,de=0;D===0?(B=$+Se/2+.3,de=0):D===1?(B=$-Se/2-.3,de=Math.PI):D===2?(H=G+z/2+.3,de=Math.PI/2):(H=G-z/2-.3,de=-Math.PI/2),T.set(H,be,B),E.setFromAxisAngle(L,de),k.set(U,ce,1),b.compose(T,E,k),u[r].setMatrixAt(m,b),S[r]++}for(let e=0;e<8;e++)u[e].count=S[e],u[e].instanceMatrix.needsUpdate=!0,t.add(u[e])}addRooftopEquipment(t){const n=new Y({color:526352}),s=new me(1,1,1),o=new Ce(.5,.5,1,8),a=new Ce(.05,1,.6,12),c=new X(s,n.clone(),200),l=new X(o,n.clone(),200),v=new X(a,n.clone(),200);c.frustumCulled=l.frustumCulled=v.frustumCulled=!1;let C=0,p=0,w=0;const g=new ne,f=new d,u=new d,S=new se;for(let b=0;b<A;b++)for(let T=0;T<A;T++){if(b%5===0||T%5===0)continue;const E=b*_-q,k=T*_-q,L=b/A*4-2,P=T/A*4-2,e=Math.max(.18,1-Math.sqrt(L*L+P*P)/3*.6),r=Math.max(8,(22+fe(L,P,5)*170)*e)+y(4,28),m=y(O*.55,O*.85),I=y(O*.55,O*.85);if(r<60||Math.random()>.2)continue;const W=te(1,3);for(let G=0;G<W;G++){const $=E+y(-m*.3,m*.3),K=k+y(-I*.3,I*.3),J=Math.random();if(J<.5&&C<200){const R=y(2,6),x=y(3,8),z=y(2,6);f.set($,r+x/2,K),u.set(R,x,z),g.compose(f,S,u),c.setMatrixAt(C++,g)}else if(J<.8&&p<200){const R=y(1,3),x=y(4,10);f.set($,r+x/2,K),u.set(R*2,x,R*2),g.compose(f,S,u),l.setMatrixAt(p++,g)}else if(w<200){const R=y(2,5);f.set($,r+.3,K),u.set(R*2,1,R*2),g.compose(f,S,u),v.setMatrixAt(w++,g)}}}c.count=C,c.instanceMatrix.needsUpdate=!0,t.add(c),l.count=p,l.instanceMatrix.needsUpdate=!0,t.add(l),v.count=w,v.instanceMatrix.needsUpdate=!0,t.add(v)}addSearchlights(t){const n=new Ce(.3,2.5,1,6,1,!0),s=[{color:16777215,opacity:.08,count:34},{color:4521983,opacity:.07,count:26},{color:16729258,opacity:.07,count:20}],o=new ne,a=new d,c=new d,l=new se;for(const v of s){const C=new Y({color:v.color,transparent:!0,opacity:v.opacity,side:Ae,blending:ae,depthWrite:!1}),p=new X(n,C,v.count);p.frustumCulled=!1;for(let w=0;w<v.count;w++){const g=te(0,A-1),f=te(0,A-1),u=g*_-q,S=f*_-q,b=g/A*4-2,T=f/A*4-2,E=Math.max(.18,1-Math.sqrt(b*b+T*T)/3*.6),k=Math.max(8,(22+fe(b,T,5)*170)*E)+y(4,28);a.set(u+y(-2,2),k+150,S+y(-2,2)),c.set(1,300,1),o.compose(a,l,c),p.setMatrixAt(w,o)}p.instanceMatrix.needsUpdate=!0,t.add(p)}}addAntennas(t){const n=new Ce(.1,.1,1,4),s=new Y({color:16716083}),o=new X(n,s,400);o.frustumCulled=!1;const a=new ne,c=new d,l=new d,v=new se;let C=0;for(let p=0;p<400;p++){const w=te(0,A-1),g=te(0,A-1),f=w*_-q,u=g*_-q,S=w/A*4-2,b=g/A*4-2,T=Math.max(.18,1-Math.sqrt(S*S+b*b)/3*.6),E=Math.max(8,(22+fe(S,b,5)*170)*T)+20,k=y(8,30);c.set(f+y(-3,3),E+k/2,u+y(-3,3)),l.set(1,k,1),a.compose(c,v,l),o.setMatrixAt(C++,a)}o.count=C,o.instanceMatrix.needsUpdate=!0,t.add(o)}addNeonSigns(t,n){n.forEach(({text:s,pos:o,color:a})=>{const c=document.createElement("canvas");c.width=256,c.height=64;const l=c.getContext("2d");l.clearRect(0,0,256,64),l.fillStyle=a+"22",l.fillRect(0,0,256,64),l.strokeStyle=a,l.lineWidth=2,l.strokeRect(2,2,252,60),l.fillStyle=a,l.font="bold 22px monospace",l.textAlign="center",l.fillText(s,128,40);const v=new Oe(c),C=new ge(18,4.5),p=new Y({map:v,transparent:!0,side:Ae,depthWrite:!1}),w=new we(C,p);w.position.copy(o),t.add(w)})}update(t){for(const n of this.mats)n.uniforms.uTime.value=t}}class Zt{constructor(){h(this,"mesh");h(this,"mat")}create(t){const n=new ge(1200,1200,1,1);return this.mat=new ye({vertexShader:Wt,fragmentShader:zt,uniforms:{uTime:{value:0},uDistrictNeon:{value:new M(62975)},uRainIntensity:{value:1}}}),this.mesh=new we(n,this.mat),this.mesh.rotation.x=-Math.PI/2,this.mesh.position.y=0,t.add(this.mesh),this.mesh}update(t){this.mat.uniforms.uTime.value=t}setDistrictNeon(t){this.mat.uniforms.uDistrictNeon.value.copy(t)}setRainIntensity(t){this.mat.uniforms.uRainIntensity.value=t}}class Jt{constructor(){h(this,"points");h(this,"count",8e3)}create(t){const n=new Float32Array(this.count*3),s=new Float32Array(this.count),o=new Float32Array(this.count);for(let l=0;l<this.count;l++)n[l*3]=y(-300,300),n[l*3+1]=y(-60,60),n[l*3+2]=y(-300,300),s[l]=y(.3,1),o[l]=Math.random();const a=new nt;a.setAttribute("position",new Me(n,3)),a.setAttribute("aSpeed",new Me(s,1)),a.setAttribute("aOffset",new Me(o,1));const c=new ye({vertexShader:Ht,fragmentShader:Bt,uniforms:{uTime:{value:0}},transparent:!0,blending:ae,depthWrite:!1});this.points=new st(a,c),t.add(this.points)}update(t,n){const s=this.points.material;s.uniforms.uTime.value=t,n&&(this.points.position.x=n.x,this.points.position.z=n.z)}}class Qt{constructor(){h(this,"mesh");h(this,"mat")}create(t){const n=new ht(2e3,32,16);this.mat=new ye({vertexShader:_t,fragmentShader:Vt,uniforms:{uTime:{value:0},uZenithColor:{value:new M(132104)},uHorizonColor:{value:new M(1706e3)},uDistrictNeon:{value:new M(62975)}},side:mt,depthWrite:!1}),this.mesh=new we(n,this.mat),this.mesh.renderOrder=-1,t.add(this.mesh)}update(t,n,s){this.mesh.position.copy(n),this.mat.uniforms.uTime.value=t,s&&this.mat.uniforms.uDistrictNeon.value.copy(s)}setDistrictColors(t,n){this.mat.uniforms.uHorizonColor.value.copy(t),this.mat.uniforms.uDistrictNeon.value.copy(n)}}function eo(i){let t=i;return()=>{t|=0,t=t+1831565813|0;let n=Math.imul(t^t>>>15,1|t);return n=n+Math.imul(n^n>>>7,61|n)^n,((n^n>>>14)>>>0)/4294967296}}const je=[new M(16720384),new M(61183),new M(22015),new M(16711884),new M(65382),new M(16737792),new M(11141375),new M(16770626)],Fe=32,it=16,to=6,We=it+to,Ye=Fe/2*We;class oo{constructor(){h(this,"mesh");h(this,"mat")}create(t){const s=new ge(5,1.4),o=new Float32Array(150*3),a=new Float32Array(150),c=new Float32Array(150);s.setAttribute("aColor",new oe(o,3)),s.setAttribute("aFlickerSeed",new oe(a,1)),s.setAttribute("aPulseMode",new oe(c,1)),this.mat=new ye({vertexShader:qt,fragmentShader:Xt,uniforms:{uTime:{value:0}},transparent:!0,depthWrite:!1,side:Ae,blending:ae}),this.mesh=new X(s,this.mat,150),this.mesh.frustumCulled=!1;const l=eo(42),v=new ne,C=new d,p=new se,w=new d(1,1,1);let g=0;for(let f=0;f<Fe&&g<150;f++)for(let u=0;u<Fe&&g<150;u++){if(f%5===0||u%5===0||l()>.1)continue;const S=f*We-Ye,b=u*We-Ye,T=6+l()*12,E=Math.floor(l()*4),k=it*.5+.3;let L=S,P=b,e=0;E===0?(P=b+k,e=0):E===1?(P=b-k,e=Math.PI):E===2?(L=S+k,e=Math.PI*.5):(L=S-k,e=-Math.PI*.5),C.set(L,T,P),p.setFromEuler(new pt(0,e,0)),v.compose(C,p,w),this.mesh.setMatrixAt(g,v);const r=je[Math.floor(l()*je.length)];o[g*3]=r.r,o[g*3+1]=r.g,o[g*3+2]=r.b,a[g]=l();const m=l();c[g]=m<.6?0:m<.85?1:m<.95?2:3,g++}this.mesh.count=g,this.mesh.instanceMatrix.needsUpdate=!0,s.getAttribute("aColor").needsUpdate=!0,s.getAttribute("aFlickerSeed").needsUpdate=!0,s.getAttribute("aPulseMode").needsUpdate=!0,t.add(this.mesh)}update(t){this.mat.uniforms.uTime.value=t}}const no=`
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
`;class so extends Ut{constructor(t=.45){super("LensStreakEffect",no,{uniforms:new Map([["uIntensity",new gt(t)]])})}}class io{constructor(){h(this,"composer");h(this,"glitch");h(this,"glitchTimeout",0)}setup(t,n,s){this.composer=new Et(t);const o=new kt(n,s),a=new Rt({blendFunction:Re.ADD,luminanceThreshold:.55,luminanceSmoothing:.3,intensity:3.2,radius:.5}),c=new so(.45),l=new It({offset:new pe(.0018,.0012),radialModulation:!0,modulationOffset:.5}),v=new Lt({eskil:!1,offset:.35,darkness:.75}),C=new Nt({blendFunction:Re.OVERLAY,premultiply:!0});C.blendMode.opacity.value=.04;const p=new xt({blendFunction:Re.OVERLAY,density:1.4});return p.blendMode.opacity.value=.07,this.glitch=new Dt({delay:new pe(99999,99999),duration:new pe(.15,.35),strength:new pe(.15,.4),columns:.04,ratio:.85}),this.composer.addPass(o),this.composer.addPass(new Ie(s,a,c)),this.composer.addPass(new Ie(s,l,p,v,C)),this.composer.addPass(new Ie(s,this.glitch)),this.composer}triggerGlitch(){this.glitch.delay.set(0,.05),clearTimeout(this.glitchTimeout),this.glitchTimeout=window.setTimeout(()=>{this.glitch.delay.set(99999,99999)},600)}resize(t,n){this.composer.setSize(t,n)}render(){this.composer.render()}}const F=[{pos:new d(0,180,220),look:new d(0,0,0),label:"HERO",t:0},{pos:new d(-40,12,110),look:new d(-20,20,60),label:"ABOUT",t:0},{pos:new d(-80,200,65),look:new d(-80,200,20),label:"PS3 GPU",t:0},{pos:new d(-75,200,25),look:new d(-75,200,-25),label:"CPUonGPU",t:0},{pos:new d(-13,200,-55),look:new d(0,200,-90),label:"GPU Stream",t:0},{pos:new d(19,200,-80),look:new d(40,200,-110),label:"Selkies",t:0},{pos:new d(90,200,-65),look:new d(100,200,-100),label:"Oris AI",t:0},{pos:new d(101,200,8),look:new d(90,200,-20),label:"VajraGrid",t:0},{pos:new d(84,200,76),look:new d(70,200,50),label:"VidyaMitra",t:0},{pos:new d(34,200,106),look:new d(20,200,80),label:"Netflip",t:0},{pos:new d(-5,200,96),look:new d(-20,200,70),label:"Arena",t:0},{pos:new d(-20,200,67),look:new d(-10,200,40),label:"Hackathon",t:0},{pos:new d(-60,8,30),look:new d(-40,8,0),label:"SKILLS",t:0},{pos:new d(0,120,160),look:new d(0,0,0),label:"CONTACT",t:0}],ao=1600;class ro{constructor(t){h(this,"camera");h(this,"posSpline");h(this,"lookSpline");h(this,"t",0);h(this,"currentSection",0);h(this,"mouseX",0);h(this,"mouseY",0);h(this,"_pos",new d);h(this,"_look",new d);h(this,"_ahead",new d);h(this,"onSectionChange");h(this,"_lastFiredSection",0);this.camera=t,this.buildSpline(),this.init()}buildSpline(){const t=F.map(o=>o.pos.clone()),n=F.map(o=>o.look.clone());this.posSpline=new qe(t,!1,"catmullrom",.5),this.lookSpline=new qe(n,!1,"catmullrom",.5);const s=F.length;F.forEach((o,a)=>{o.t=a/(s-1)}),this.t=0,this.posSpline.getPoint(0,this._pos),this.lookSpline.getPoint(0,this._look),this.camera.position.copy(this._pos),this.camera.lookAt(this._look)}init(){window.addEventListener("mousemove",s=>{this.mouseX=(s.clientX/window.innerWidth-.5)*2,this.mouseY=(s.clientY/window.innerHeight-.5)*2});let t=!1;window.addEventListener("wheel",s=>{if(t)return;t=!0;const o=s.deltaY>0?1:-1;this.goTo(this.currentSection+o),setTimeout(()=>{t=!1},ao)},{passive:!0});let n=0;window.addEventListener("touchstart",s=>{n=s.touches[0].clientY}),window.addEventListener("touchend",s=>{const o=n-s.changedTouches[0].clientY;Math.abs(o)>40&&this.goTo(this.currentSection+(o>0?1:-1))}),window.addEventListener("keydown",s=>{(s.key==="ArrowDown"||s.key==="ArrowRight")&&this.goTo(this.currentSection+1),(s.key==="ArrowUp"||s.key==="ArrowLeft")&&this.goTo(this.currentSection-1)})}goTo(t){if(t=Math.max(0,Math.min(F.length-1,t)),t===this.currentSection)return;const n=this.currentSection;this.currentSection=t;const s=F[t].t,a=.6+Math.abs(s-this.t)*5;ie.killTweensOf(this),ie.to(this,{t:s,duration:a,ease:"power2.inOut",onUpdate:()=>this._fireCrossings(n,t),onComplete:()=>{var c;this._lastFiredSection=t,(c=this.onSectionChange)==null||c.call(this,t),this._updateUI(t)}}),this._updateUI(t)}_fireCrossings(t,n){const s=n>t?1:-1;F.forEach((o,a)=>{var l;(s>0?this.t>=o.t&&a>this._lastFiredSection&&a<=n:this.t<=o.t&&a<this._lastFiredSection&&a>=n)&&(this._lastFiredSection=a,(l=this.onSectionChange)==null||l.call(this,a),this._updateUI(a))})}update(t){this.posSpline.getPoint(this.t,this._pos),this.camera.position.copy(this._pos);const n=Math.min(1,this.t+.015);this.posSpline.getPoint(n,this._ahead),this.lookSpline.getPoint(this.t,this._look);const s=this._look.x*.8+this._ahead.x*.2+this.mouseX*5,o=this._look.y*.8+this._ahead.y*.2-this.mouseY*3,a=this._look.z*.8+this._ahead.z*.2;this.camera.lookAt(s,o,a)}_updateUI(t){document.querySelectorAll(".nav-dot").forEach((s,o)=>s.classList.toggle("active",o===t));const n=document.getElementById("progress-bar");n&&(n.style.height=t/(F.length-1)*100+"%")}getCurrentSection(){return this.currentSection}}const at=[{id:"ps3-gpu",title:"PS3 Cell GPU Emulator",subtitle:"Systems / Emulation",desc:"Full emulation of the Cell Broadband Engine's SPU pipeline in WebGL. 6 SPU cores, PPE scheduler, DMA bus — running real PS3 shaders in the browser at 200 GIPS.",tags:["C++","WebGL","GLSL","Cell BE","Emulation"],url:"https://github.com/Aerosane/ps3-cell-gpu-emulator",neonColor:"#00f5ff",district:"GPU DISTRICT",icon:"⬡"},{id:"cpuongpu",title:"CPUonGPU",subtitle:"Architecture Research",desc:"Runs a full x86 CPU simulation entirely on GPU compute shaders. Register file, ALU, cache hierarchy — all in GLSL. JIT-compiled x86 → SPIR-V at runtime.",tags:["GLSL","Compute Shaders","x86","JIT","SPIR-V"],url:"https://github.com/Aerosane/cpuongpu",neonColor:"#00f5ff",district:"GPU DISTRICT",icon:"⬢"},{id:"gpu-streaming",title:"GPU Streaming Pipeline",subtitle:"NvFBC + NVENC",desc:"Sub-frame-latency game streaming via NvFBC capture → NVENC H265/AV1 encode → WebRTC TURN relay. <1 frame E2E latency. Deployed on GitHub Codespace GPU.",tags:["NVENC","NvFBC","WebRTC","Rust","H265"],url:"https://github.com/Aerosane/gpu-streaming-nvfbc",neonColor:"#00f5ff",district:"GPU DISTRICT",icon:"▶"},{id:"selkies-rust",title:"Selkies-Rust",subtitle:"Python→Rust Port",desc:"Complete rewrite of the Selkies WebRTC game streaming stack from Python into Rust. 6 crates: pipeline, signaling, input, encoding, metrics, CLI.",tags:["Rust","WebRTC","GStreamer","Tokio","GSAP"],url:"https://github.com/Aerosane/selkies-rust",neonColor:"#ff6b1a",district:"SYSTEMS CORRIDOR",icon:"⚙"},{id:"oris-ai",title:"Oris — AI SRE",subtitle:"🏆 Runner-up · TechSynapse 2026",desc:"Autonomous Site Reliability Engineer: ingests production logs, PII-masks with Presidio, infers root cause via Gemini 2.0, opens GitHub PRs with fixes. Zero human touch.",tags:["Python","Gemini 2.0","Presidio","LangChain","FastAPI"],url:"https://github.com/Aerosane/oris",neonColor:"#ff00aa",district:"AI DISTRICT",icon:"◈"},{id:"vajragrid",title:"VajraGrid",subtitle:"🇮🇳 India Innovates 2026 · Bharat Mandapam",desc:"AI-hardened power grid security: detects SCADA cyberattacks in 16s, 4-layer ML defense stack, adversarial training. Exhibited nationally at Bharat Mandapam.",tags:["Python","PyTorch","SCADA","Adversarial ML","GridSec"],url:"https://github.com/Aerosane/vajragridr",neonColor:"#ff00aa",district:"AI DISTRICT",icon:"⚡"},{id:"vidyamitra",title:"VidyaMitra",subtitle:"IISER JEE Prep",desc:"AI tutor for JEE aspirants: adaptive quiz engine, LaTeX equation rendering, spaced repetition. Covers Physics, Chemistry, Math with difficulty auto-calibration.",tags:["TypeScript","React","LaTeX","OpenAI","Supabase"],url:"https://github.com/Aerosane/vidyamitra",neonColor:"#00ff88",district:"EDTECH ZONE",icon:"⬟"},{id:"netflip",title:"Netflip VOD",subtitle:"Full-Stack Streaming",desc:"Netflix-clone with HLS adaptive streaming, Azure Blob CDN, Fastly edge cache, WebSocket live chat, OAuth2, recommendation engine. 1080p adaptive bitrate.",tags:["Next.js","HLS","Azure","Fastly","PostgreSQL"],url:"https://github.com/Aerosane/netflip-vod",neonColor:"#7b2fff",district:"WEB DISTRICT",icon:"▨"},{id:"coding-arena",title:"Coding Arena",subtitle:"Competitive Judging Platform",desc:"Online judge with isolated Docker execution, multi-language support, real-time leaderboard, plagiarism detection via AST similarity. 200ms median judge latency.",tags:["Go","Docker","Redis","React","WebSocket"],url:"https://github.com/Aerosane/coding_arena",neonColor:"#7b2fff",district:"WEB DISTRICT",icon:"{ }"},{id:"hackathon",title:"Hackathon Wins",subtitle:"Hall of Fame",desc:"🏆 Runner-up at TechSynapse 2026 (Oris AI SRE). 🇮🇳 National exhibition at India Innovates 2026, Bharat Mandapam, New Delhi (VajraGrid). 1st year, two nationals.",tags:["Oris AI","VajraGrid","TechSynapse","India Innovates"],url:"https://github.com/Aerosane",neonColor:"#ffe642",district:"HALL OF FAME",icon:"🏆"}],lo={Languages:["C++","Rust","Python","TypeScript","Go","GLSL/HLSL"],Systems:["WebRTC","WebGL/WebGPU","NVENC/NvFBC","Docker","Linux"],"AI/ML":["PyTorch","Gemini API","LangChain","Presidio","HuggingFace"],Web:["React","Next.js","Vite","Node.js","PostgreSQL","Redis"],Tools:["Git","GitHub Actions","Azure","GStreamer","Tokio"]};class co{constructor(){h(this,"group",new ze);h(this,"hoverTargets",[]);h(this,"visible",!1);h(this,"visibleValue",0)}enter(){this.group.visible=!0,this.visible=!0,ie.killTweensOf(this),ie.to(this,{visibleValue:1,duration:1.4,ease:"power2.out",onUpdate:()=>this.setVisible(this.visibleValue)})}exit(){this.visible=!1,ie.killTweensOf(this),ie.to(this,{visibleValue:0,duration:.8,ease:"power2.in",onUpdate:()=>this.setVisible(this.visibleValue),onComplete:()=>{this.group.visible=!1}})}setVisible(t){}dispose(){this.group.traverse(t=>{t.geometry&&t.geometry.dispose()})}}function fo(i){const s=document.createElement("canvas");s.width=900,s.height=440;const o=s.getContext("2d"),a=i.neonColor;o.fillStyle="#03040f",o.fillRect(0,0,900,440);for(let f=0;f<440;f+=4)o.fillStyle="rgba(0,0,0,0.18)",o.fillRect(0,f,900,2);const c=o.createLinearGradient(0,0,14,0);c.addColorStop(0,a),c.addColorStop(1,"transparent"),o.fillStyle=c,o.shadowColor=a,o.shadowBlur=28,o.fillRect(0,0,7,440),o.shadowBlur=0,o.font="bold 11px monospace",o.fillStyle=a+"aa",o.textAlign="left",o.fillText("◈ "+i.district.toUpperCase(),24,28);const l=i.title.length>18?48:i.title.length>13?58:70;o.font=`bold ${l}px monospace`,o.shadowColor=a,o.shadowBlur=50,o.fillStyle="#ffffff",o.fillText(i.title,24,62+(70-l)),o.shadowBlur=26,o.fillStyle=a+"bb",o.fillText(i.title,24,62+(70-l)),o.shadowBlur=0,o.font="18px monospace",o.fillStyle="rgba(255,255,255,0.65)",o.fillText(i.subtitle,24,138),o.font="14px monospace",o.fillStyle="rgba(200,220,255,0.45)";const v=852,C=i.desc.split(" "),p=[];let w="";for(const f of C){const u=w?w+" "+f:f;if(o.measureText(u).width>v){if(p.length===1){p.push(w+"…"),w="";break}p.push(w),w=f}else w=u}w&&p.length<2&&p.push(w),p.forEach((f,u)=>o.fillText(f,24,164+u*20)),o.strokeStyle=a+"30",o.lineWidth=1,o.beginPath(),o.moveTo(24,212),o.lineTo(876,212),o.stroke(),o.font="bold 13px monospace";let g=24;for(const f of i.tags.slice(0,5)){const u=o.measureText(f).width+20;if(g+u>876)break;o.fillStyle=a+"18",o.fillRect(g,224,u,26),o.strokeStyle=a+"66",o.lineWidth=1,o.strokeRect(g,224,u,26),o.fillStyle=a+"ee",o.fillText(f,g+10,241),g+=u+8}return o.font="12px monospace",o.fillStyle="rgba(255,255,255,0.22)",o.fillText(i.url.replace("https://",""),24,278),o.font="bold 13px monospace",o.shadowColor=a,o.shadowBlur=14,o.fillStyle=a+"99",o.fillText("▶  CLICK TO VIEW PROJECT",24,422),o.shadowBlur=0,new Oe(s)}function Q(i,t,n,s,o){const a=new we(new me(i,t,n),o);return a.position.copy(s),a.frustumCulled=!1,a}class uo extends co{constructor(n,s,o){super();h(this,"projIdx");h(this,"panelPos");h(this,"camPos");h(this,"fadeMats",[]);h(this,"particleMat");this.projIdx=n,this.panelPos=s,this.camPos=o}create(n){n.add(this.group);const s=at[this.projIdx],o=new M(s.neonColor),a=new ze;a.position.copy(this.panelPos);const c=this.camPos.x-this.panelPos.x,l=this.camPos.z-this.panelPos.z;a.rotation.y=Math.atan2(c,l),this.group.add(a);const v=(P,e)=>(P.opacity=0,this.fadeMats.push([P,e]),P),C=v(new Y({map:fo(s),transparent:!0,depthWrite:!1,side:vt,alphaTest:.01}),1),p=new we(new ge(40,19.5),C);p.frustumCulled=!1,p.userData.isLabel=!0,p.userData.onClick=()=>window.open(s.url,"_blank"),a.add(p);const w=v(new Y({color:o,transparent:!0,blending:ae,depthWrite:!1}),.85);a.add(Q(41,.5,.4,new d(0,9.75,.1),w)),a.add(Q(41,.5,.4,new d(0,-9.75,.1),w)),a.add(Q(.5,20.5,.4,new d(-20.25,0,.1),w)),a.add(Q(.5,20.5,.4,new d(20.25,0,.1),w));const g=190,f=v(new Y({color:2763326,transparent:!0}),1),u=new d(-13,-9.75-g/2,0),S=new d(13,-9.75-g/2,0);a.add(Q(.9,g,.9,u,f)),a.add(Q(.9,g,.9,S,f)),a.add(Q(27,.7,.9,new d(0,-9.75-g+.4,0),f));const b=v(new Y({color:o,transparent:!0,blending:ae,depthWrite:!1}),.5);a.add(Q(41,.3,.1,new d(0,9.75,.2),b));const T=60,E=new Float32Array(T*3);for(let P=0;P<T;P++)E[P*3]=this.panelPos.x+(Math.random()-.5)*60,E[P*3+1]=this.panelPos.y+(Math.random()-.5)*35,E[P*3+2]=this.panelPos.z+(Math.random()-.5)*60;const k=new nt;k.setAttribute("position",new Me(E,3)),this.particleMat=new wt({size:.4,color:o,transparent:!0,opacity:0,blending:ae,sizeAttenuation:!0});const L=new st(k,this.particleMat);L.frustumCulled=!1,this.group.add(L)}update(n){}setVisible(n){for(const[s,o]of this.fadeMats)s.opacity=n*o;this.particleMat&&(this.particleMat.opacity=n*.45)}onHover(){}}const ho=[[2,0],[3,1],[4,2],[5,3],[6,4],[7,5],[8,6],[9,7],[10,8],[11,9]];class mo{constructor(t,n){h(this,"envs",new Map);h(this,"activeEnv",null);h(this,"activeIdx",-1);for(const[s,o]of ho){const a=F[s],c=new uo(o,a.look.clone(),a.pos.clone());c.create(t),c.group.visible=!1,this.envs.set(s,c)}}onSection(t){if(t===this.activeIdx)return;this.activeIdx=t,this.activeEnv&&(this.activeEnv.exit(),this.activeEnv=null);const n=this.envs.get(t);n&&(this.activeEnv=n,n.enter())}update(t){this.activeEnv&&this.activeEnv.update(t)}}const po=document.getElementById("scene-canvas"),le=new yt({canvas:po,antialias:!0,alpha:!1,powerPreference:"high-performance"});le.setPixelRatio(Math.min(devicePixelRatio,2));le.setSize(innerWidth,innerHeight);le.toneMapping=St;le.toneMappingExposure=.95;const N=new bt;N.background=new M(131602);N.fog=new Ct(197400,.003);const ee=new Tt(60,innerWidth/innerHeight,.5,1200),ke=new io;ke.setup(le,N,ee);const He=new Qt;He.create(N);const V=new Kt;V.generate(N);V.addBillboardScreens(N);V.addRooftopEquipment(N);V.addSearchlights(N);const go=at.map((i,t)=>{const n=F[t+2];return{text:i.district,pos:new d(n.pos.x+12,80,n.pos.z-18),color:i.neonColor}});V.addNeonSigns(N,go);const rt=new oo;rt.create(N);const Be=new Zt;Be.create(N);const lt=new Jt;lt.create(N);const vo=new Pt(128,0,.4);N.add(vo);const _e=new ze;N.add(_e);var et,tt;(tt=(et=V.cityGroup)==null?void 0:et.children)==null||tt.forEach(i=>_e.add(i));const ct=new mo(N,_e),Ee=new M(62975);function wo(i){const t=Math.min(i,ve.length-1);Ee.copy(ve[t]),Be.setDistrictNeon(Ee),He.update(0,ee.position,Ee)}const yo=[["NEON DISTRICT","A cyberpunk portfolio"],["ABOUT","Who is behind this"],["PS3 CELL GPU","PS3 SPU emulator in WebGL"],["CPUonGPU","x86 CPU running on GPU"],["GPU STREAMING","Sub-frame game streaming"],["SELKIES RUST","WebRTC stack rebuilt in Rust"],["ORIS AI","Autonomous SRE agent"],["VAJRAGRID","AI power grid security"],["VIDYAMITRA","Adaptive JEE AI tutor"],["NETFLIP","HLS streaming platform"],["ARENA OJ","Online judge platform"],["HACKATHON","Competition highlights"],["TECH STACK","Tools and languages"],["CONTACT","Get in touch"]],re=document.createElement("div");re.id="section-banner";Object.assign(re.style,{position:"fixed",bottom:"24px",left:"50%",transform:"translateX(-50%)",textAlign:"center",pointerEvents:"none",zIndex:"50",opacity:"0",transition:"opacity 0.4s",background:"rgba(0,0,8,0.65)",padding:"10px 28px",borderTop:"1px solid currentColor"});document.body.appendChild(re);function So(i){const[t,n]=yo[i]??["",""],s=ve[i]?"#"+ve[i].getHexString():"#00f5ff";re.style.color=s,re.innerHTML=`
    <div style="font-family:monospace;font-size:8px;letter-spacing:4px;color:${s};margin-bottom:4px;text-transform:uppercase;opacity:0.7">
      DISTRICT_${String(i).padStart(2,"0")}
    </div>
    <div style="font-family:monospace;font-size:1.1rem;font-weight:900;color:#fff;
                text-shadow:0 0 20px ${s},0 0 40px ${s}88;letter-spacing:0.08em;line-height:1.1">
      ${t}
    </div>
    <div style="font-family:monospace;font-size:0.75rem;color:${s};
                letter-spacing:0.15em;margin-top:4px;opacity:0.85">
      ${n}
    </div>
  `,re.style.opacity="1"}const Ve=new ro(ee);Ve.onSectionChange=i=>{Co(i),To(i),wo(i),ke.triggerGlitch(),ct.onSection(i),So(i)};const bo=document.getElementById("nav-dots");F.forEach((i,t)=>{const n=document.createElement("div");n.className="nav-dot"+(t===0?" active":""),n.title=i.label,n.addEventListener("click",()=>Ve.goTo(t)),bo.appendChild(n)});function Co(i){document.querySelectorAll(".sect").forEach((t,n)=>{t.classList.toggle("active",n===i)}),document.querySelectorAll(".nav-dot").forEach((t,n)=>{t.classList.toggle("active",n===i)})}function To(i){const t=document.getElementById("hud-section");t&&(t.textContent=`DISTRICT_${String(i).padStart(2,"0")} / ${F[i].label}`)}const $e=document.getElementById("skills-grid");$e&&Object.entries(lo).forEach(([i,t])=>{const n=document.createElement("div");n.className="skill-cat",n.innerHTML=`<div class="skill-cat-name">// ${i}</div>`+t.map(s=>`<div class="skill-item">${s}</div>`).join(""),$e.appendChild(n)});const Z=document.getElementById("contact-input"),Pe=document.getElementById("contact-input-display");var ot;(ot=document.getElementById("sect-13"))==null||ot.addEventListener("click",()=>Z==null?void 0:Z.focus());Z==null||Z.addEventListener("input",()=>{Pe&&(Pe.textContent=(Z.value||"")+"_"),Z.value.trim().toLowerCase()==="sudo"&&(Po(),Z.value="",Pe&&(Pe.textContent="_"))});function Po(){const i=document.querySelector("#sect-13 .terminal-body");if(!i)return;const t=document.createElement("p");t.className="output neon-green",t.textContent="> Permission granted. Downloading your future...",i.appendChild(t),setTimeout(()=>{const n=document.createElement("p");n.className="output",n.innerHTML='<span style="color:#ffe642">root@neon-district:~# ██████████ 100%  COMPLETE</span>',i.appendChild(n)},1500)}const Ke=["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];let ue=0;window.addEventListener("keydown",i=>{i.key===Ke[ue]?ue++:ue=0,ue===Ke.length&&(ue=0,Ao())});let xe=!1;function Ao(){xe=!xe,[V.sectionLow,V.sectionMid,V.sectionTop,V.meshD].forEach(i=>{const t=i.material;t.wireframe=xe})}const De=document.getElementById("boot-log"),Ze=document.getElementById("boot-bar"),he=document.getElementById("loading-screen"),Ue=["Initializing WebGPU context","Generating city geometry","Compiling 47 shader programs","Spawning rain particles","Calibrating post-processing chain","System ready"];async function Mo(){for(let i=0;i<Ue.length;i++){await new Promise(n=>setTimeout(n,260+Math.random()*200));const t=document.createElement("p");t.innerHTML=`<span style="color:rgba(0,245,255,.5)">[BOOT]</span> ${Ue[i]}... <span class="ok">[OK]</span>`,De==null||De.appendChild(t),Ze&&(Ze.style.width=(i+1)/Ue.length*100+"%")}await new Promise(i=>setTimeout(i,600)),he==null||he.classList.add("fade-out"),setTimeout(()=>{he&&(he.style.display="none")},850)}Mo();const Je=new At,Ge=new pe;window.addEventListener("click",i=>{if(i.target.closest("#env-detail-panel"))return;Ge.x=i.clientX/innerWidth*2-1,Ge.y=-(i.clientY/innerHeight)*2+1,Je.setFromCamera(Ge,ee);const t=Je.intersectObjects(N.children,!0);for(const n of t){const s=n.object;if(s.userData.isLabel&&s.userData.onClick){i.stopPropagation(),s.userData.onClick();return}}});window.addEventListener("resize",()=>{ee.aspect=innerWidth/innerHeight,ee.updateProjectionMatrix(),le.setSize(innerWidth,innerHeight),ke.resize(innerWidth,innerHeight)});const Qe=new Mt;function dt(){requestAnimationFrame(dt);const i=Qe.getElapsedTime(),t=Qe.getDelta();V.update(i),Be.update(i),lt.update(i,ee.position),rt.update(i),He.update(i,ee.position,Ee),Ve.update(t),ct.update(i),ke.render()}dt();
