var ht=Object.defineProperty;var mt=(i,t,e)=>t in i?ht(i,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):i[t]=e;var c=(i,t,e)=>mt(i,typeof t!="symbol"?t+"":t,e);import{i as b,d as ce,I as j,q as ae,j as q,u as Pe,a5 as u,Q as Ee,w as G,C as Fe,J as z,m as Z,v as x,Z as T,f as ue,e as O,a as _,K as Ne,_ as Ue,B as pt,E as gt,a4 as fe,a1 as wt,G as ot,O as yt,W as bt,g as it,a0 as nt,r as xt,L as Ct,a8 as St,A as Mt,Y as Tt,o as At,P as Pt,H as Et,h as kt}from"./three-NinbW0Xw.js";import{b as It,R as Rt,a as Lt,B as ye,C as Ft,V as Nt,N as Ut,S as Vt,G as Gt,c as be,E as zt}from"./postprocessing-DTqDKnlr.js";import{g as oe}from"./gsap-SFc2wnMY.js";(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))o(n);new MutationObserver(n=>{for(const s of n)if(s.type==="childList")for(const a of s.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&o(a)}).observe(document,{childList:!0,subtree:!0});function e(n){const s={};return n.integrity&&(s.integrity=n.integrity),n.referrerPolicy&&(s.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?s.credentials="include":n.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function o(n){if(n.ep)return;n.ep=!0;const s=e(n);fetch(n.href,s)}})();function Be(i){return i*i*i*(i*(i*6-15)+10)}function xe(i,t,e){return i+e*(t-i)}function he(i,t,e){const o=i&3,n=o<2?t:e,s=o<2?e:t;return(i&1?-n:n)+(i&2?-s:s)}const D=Array.from({length:512},(i,t)=>t).sort(()=>Math.random()-.5);for(let i=0;i<256;i++)D[i+256]=D[i];function Ot(i,t){const e=Math.floor(i)&255,o=Math.floor(t)&255,n=i-Math.floor(i),s=t-Math.floor(t),a=Be(n),r=Be(s),l=D[D[e]+o],f=D[D[e]+o+1],v=D[D[e+1]+o],h=D[D[e+1]+o+1];return xe(xe(he(l,n,s),he(v,n-1,s),a),xe(he(f,n,s-1),he(h,n-1,s-1),a),r)}function He(i,t,e=4,o=2,n=.5){let s=0,a=.5,r=1;for(let l=0;l<e;l++)s+=Ot(i*r,t*r)*a,r*=o,a*=n;return s}function L(i,t){return i+Math.random()*(t-i)}function je(i,t){return Math.floor(L(i,t+1))}const Dt=`
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
  vec3 base = vec3(0.033, 0.033, 0.052);

  float density = mix(7.0, 24.0, clamp(vHeight / 200.0, 0.0, 1.0));
  vec2 winScale = vec2(density * 0.55, density);
  vec2 winId = floor(vUv * winScale);
  float win = windowGrid(vUv, winScale, winId);

  float h = hash(winId + floor(vWorldPos.xz * 0.01));
  vec3 winColor;
  if      (h < 0.28) winColor = vec3(1.0, 0.88, 0.5);
  else if (h < 0.48) winColor = vec3(0.35, 0.62, 1.0);
  else if (h < 0.64) winColor = vNeonColor * 2.4;
  else if (h < 0.76) winColor = vec3(0.72, 0.22, 1.0);
  else               winColor = vec3(0.95, 0.97, 1.0);

  vec3 color = base + win * winColor * 1.15;

  // ── CLOSE-UP DETAIL (distance-gated at 40→12 units) ──────
  float camDist = length(vWorldPos - cameraPosition);
  float closeBlend = 1.0 - smoothstep(12.0, 40.0, camDist);

  // Floor ledge bands — horizontal concrete lines per floor
  float floorFract = fract(vUv.y * 12.0);
  float ledge = 1.0 - smoothstep(0.01, 0.06, floorFract);
  color += ledge * closeBlend * 0.09 * vec3(1.0, 1.0, 1.2);

  // Corner edge glow — vertical neon trace at building corners
  float cornerDist = min(vUv.x, 1.0 - vUv.x);
  float cornerEdge = 1.0 - smoothstep(0.0, 0.04, cornerDist);
  color += cornerEdge * closeBlend * vNeonColor * 0.5;

  // Concrete surface grain — close-up noise texture
  vec2 grainUV = floor(vUv * vec2(60.0, 120.0));
  float grain = hash(grainUV);
  color += (grain - 0.5) * closeBlend * 0.04;

  // ── ROOF TOP CAP + FRESNEL ────────────────────────────────
  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 2.8);
  color += vNeonColor * fresnel * 0.6;
  color += vNeonColor * step(0.975, vUv.y) * 1.1;

  // ── FOG ──────────────────────────────────────────────────
  float dist = length(vWorldPos - cameraPosition);
  float fog = clamp((dist - uFogNear) / (uFogFar - uFogNear), 0.0, 1.0);
  color = mix(color, uFogColor, fog * 0.85);

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
`,Bt=`
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
`,jt=`
varying float vAlpha;
void main() {
  gl_FragColor = vec4(0.55, 0.75, 1.0, vAlpha * 0.35);
}
`,$t=`
varying vec3 vLocalPos;
void main() {
  vLocalPos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,Xt=`
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
`,Yt=`
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
`,U=32,Q=16,Kt=6,re=Q+Kt,me=U/2*re,Ce={color:new b(197400),near:100,far:500},ke=[new b(62975),new b(62975),new b(16711850),new b(16711850),new b(16739098),new b(8073215),new b(8073215),new b(65416),new b(65416),new b(16770626)];function Zt(){return new T({vertexShader:Dt,fragmentShader:_t,uniforms:{uTime:{value:0},uFogColor:{value:Ce.color},uFogNear:{value:Ce.near},uFogFar:{value:Ce.far}}})}function Jt(i,t){const e=i/U,o=t/U;return e<.35&&o<.35?0:e<.65&&o<.35?1:e>=.65&&o<.35?2:e<.35&&o<.65?3:e>=.65&&o<.65?4:e<.35&&o>=.65?5:e<.65&&o>=.65?6:e>=.65&&o>=.65?7:o>.45&&o<.55?8:9}class Qt{constructor(){c(this,"meshA");c(this,"meshB");c(this,"meshC");c(this,"mats",[])}generate(t){const e=U*U,o=Zt();this.mats.push(o);const n=new ce(1,1,1),s=new Float32Array(e),a=new Float32Array(e*3);n.setAttribute("aHeight",new j(s,1)),n.setAttribute("aNeonColor",new j(a,3)),this.meshA=new ae(n,o.clone(),e),this.meshA.frustumCulled=!1,this.mats.push(this.meshA.material);const r=new q(.45,.55,1,10),l=new Float32Array(e),f=new Float32Array(e*3);r.setAttribute("aHeight",new j(l,1)),r.setAttribute("aNeonColor",new j(f,3)),this.meshB=new ae(r,o.clone(),e),this.meshB.frustumCulled=!1,this.mats.push(this.meshB.material);const v=new ce(1,.4,1),h=new Float32Array(e),d=new Float32Array(e*3);v.setAttribute("aHeight",new j(h,1)),v.setAttribute("aNeonColor",new j(d,3)),this.meshC=new ae(v,o.clone(),e),this.meshC.frustumCulled=!1,this.mats.push(this.meshC.material);const m=new Pe,g=new u,C=new u,R=new Ee;let A=0,I=0,S=0;for(let M=0;M<U;M++)for(let w=0;w<U;w++){const E=M*re-me,F=w*re-me;if(M%5===0||w%5===0||M%2===0&&w%2===0&&Math.random()<.25)continue;const N=M/U*4-2,W=w/U*4-2,ve=He(N,W,5),dt=Math.sqrt(N*N+W*W)/3,vt=Math.max(.18,1-dt*.6),J=Math.max(8,(22+ve*170)*vt)+L(4,28),De=L(Q*.42,Q*.9),_e=L(Q*.42,Q*.9),ft=Jt(M,w),B=ke[ft],We=Math.random();if(We<.65)s[A]=J,a[A*3]=B.r,a[A*3+1]=B.g,a[A*3+2]=B.b,g.set(E,J/2,F),C.set(De,J,_e),m.compose(g,R,C),this.meshA.setMatrixAt(A,m),A++;else if(We<.82){const te=L(Q*.18,Q*.32);l[I]=J,f[I*3]=B.r,f[I*3+1]=B.g,f[I*3+2]=B.b,g.set(E+L(-3,3),J/2,F+L(-3,3)),C.set(te*2,J,te*2),m.compose(g,R,C),this.meshB.setMatrixAt(I,m),I++}else{const te=Math.max(6,J*.35);h[S]=te,d[S*3]=B.r,d[S*3+1]=B.g,d[S*3+2]=B.b,g.set(E,te/2,F),C.set(De*1.4,te,_e*1.4),m.compose(g,R,C),this.meshC.setMatrixAt(S,m),S++}}this.meshA.count=A,this.meshB.count=I,this.meshC.count=S;for(const M of[this.meshA,this.meshB,this.meshC]){M.instanceMatrix.needsUpdate=!0;const w=M.geometry;w.getAttribute("aHeight").needsUpdate=!0,w.getAttribute("aNeonColor").needsUpdate=!0,t.add(M)}}addAntennas(t){const e=new q(.1,.1,1,4),o=new G({color:16716083}),n=new ae(e,o,400);n.frustumCulled=!1;const s=new Pe,a=new u,r=new u,l=new Ee;let f=0;for(let v=0;v<400;v++){const h=je(0,U-1),d=je(0,U-1),m=h*re-me,g=d*re-me,C=h/U*4-2,R=d/U*4-2,A=Math.max(.18,1-Math.sqrt(C*C+R*R)/3*.6),I=Math.max(8,(22+He(C,R,5)*170)*A)+20,S=L(8,30);a.set(m+L(-3,3),I+S/2,g+L(-3,3)),r.set(1,S,1),s.compose(a,l,r),n.setMatrixAt(f++,s)}n.count=f,n.instanceMatrix.needsUpdate=!0,t.add(n)}addNeonSigns(t,e){e.forEach(({text:o,pos:n,color:s})=>{const a=document.createElement("canvas");a.width=256,a.height=64;const r=a.getContext("2d");r.clearRect(0,0,256,64),r.fillStyle=s+"22",r.fillRect(0,0,256,64),r.strokeStyle=s,r.lineWidth=2,r.strokeRect(2,2,252,60),r.fillStyle=s,r.font="bold 22px monospace",r.textAlign="center",r.fillText(o,128,40);const l=new Fe(a),f=new z(18,4.5),v=new G({map:l,transparent:!0,side:Z,depthWrite:!1}),h=new x(f,v);h.position.copy(n),t.add(h)})}update(t){for(const e of this.mats)e.uniforms.uTime.value=t}}class eo{constructor(){c(this,"mesh");c(this,"mat")}create(t){const e=new z(1200,1200,1,1);return this.mat=new T({vertexShader:Wt,fragmentShader:Bt,uniforms:{uTime:{value:0},uDistrictNeon:{value:new b(62975)},uRainIntensity:{value:1}}}),this.mesh=new x(e,this.mat),this.mesh.rotation.x=-Math.PI/2,this.mesh.position.y=0,t.add(this.mesh),this.mesh}update(t){this.mat.uniforms.uTime.value=t}setDistrictNeon(t){this.mat.uniforms.uDistrictNeon.value.copy(t)}setRainIntensity(t){this.mat.uniforms.uRainIntensity.value=t}}class to{constructor(){c(this,"points");c(this,"count",8e3)}create(t){const e=new Float32Array(this.count*3),o=new Float32Array(this.count),n=new Float32Array(this.count);for(let r=0;r<this.count;r++)e[r*3]=L(-300,300),e[r*3+1]=L(-60,60),e[r*3+2]=L(-300,300),o[r]=L(.3,1),n[r]=Math.random();const s=new ue;s.setAttribute("position",new O(e,3)),s.setAttribute("aSpeed",new O(o,1)),s.setAttribute("aOffset",new O(n,1));const a=new T({vertexShader:Ht,fragmentShader:jt,uniforms:{uTime:{value:0}},transparent:!0,blending:_,depthWrite:!1});this.points=new Ne(s,a),t.add(this.points)}update(t,e){const o=this.points.material;o.uniforms.uTime.value=t,e&&(this.points.position.x=e.x,this.points.position.z=e.z)}}class oo{constructor(){c(this,"mesh");c(this,"mat")}create(t){const e=new Ue(2e3,32,16);this.mat=new T({vertexShader:$t,fragmentShader:Xt,uniforms:{uTime:{value:0},uZenithColor:{value:new b(132104)},uHorizonColor:{value:new b(1706e3)},uDistrictNeon:{value:new b(62975)}},side:pt,depthWrite:!1}),this.mesh=new x(e,this.mat),this.mesh.renderOrder=-1,t.add(this.mesh)}update(t,e,o){this.mesh.position.copy(e),this.mat.uniforms.uTime.value=t,o&&this.mat.uniforms.uDistrictNeon.value.copy(o)}setDistrictColors(t,e){this.mat.uniforms.uHorizonColor.value.copy(t),this.mat.uniforms.uDistrictNeon.value.copy(e)}}function io(i){let t=i;return()=>{t|=0,t=t+1831565813|0;let e=Math.imul(t^t>>>15,1|t);return e=e+Math.imul(e^e>>>7,61|e)^e,((e^e>>>14)>>>0)/4294967296}}const $e=[new b(16720384),new b(61183),new b(22015),new b(16711884),new b(65382),new b(16737792),new b(11141375),new b(16770626)],Ie=32,st=16,no=6,Re=st+no,Xe=Ie/2*Re;class so{constructor(){c(this,"mesh");c(this,"mat")}create(t){const o=new z(5,1.4),n=new Float32Array(150*3),s=new Float32Array(150),a=new Float32Array(150);o.setAttribute("aColor",new j(n,3)),o.setAttribute("aFlickerSeed",new j(s,1)),o.setAttribute("aPulseMode",new j(a,1)),this.mat=new T({vertexShader:qt,fragmentShader:Yt,uniforms:{uTime:{value:0}},transparent:!0,depthWrite:!1,side:Z,blending:_}),this.mesh=new ae(o,this.mat,150),this.mesh.frustumCulled=!1;const r=io(42),l=new Pe,f=new u,v=new Ee,h=new u(1,1,1);let d=0;for(let m=0;m<Ie&&d<150;m++)for(let g=0;g<Ie&&d<150;g++){if(m%5===0||g%5===0||r()>.1)continue;const C=m*Re-Xe,R=g*Re-Xe,A=6+r()*12,I=Math.floor(r()*4),S=st*.5+.3;let M=C,w=R,E=0;I===0?(w=R+S,E=0):I===1?(w=R-S,E=Math.PI):I===2?(M=C+S,E=Math.PI*.5):(M=C-S,E=-Math.PI*.5),f.set(M,A,w),v.setFromEuler(new gt(0,E,0)),l.compose(f,v,h),this.mesh.setMatrixAt(d,l);const F=$e[Math.floor(r()*$e.length)];n[d*3]=F.r,n[d*3+1]=F.g,n[d*3+2]=F.b,s[d]=r();const N=r();a[d]=N<.6?0:N<.85?1:N<.95?2:3,d++}this.mesh.count=d,this.mesh.instanceMatrix.needsUpdate=!0,o.getAttribute("aColor").needsUpdate=!0,o.getAttribute("aFlickerSeed").needsUpdate=!0,o.getAttribute("aPulseMode").needsUpdate=!0,t.add(this.mesh)}update(t){this.mat.uniforms.uTime.value=t}}const ao=`
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
`;class ro extends zt{constructor(t=.45){super("LensStreakEffect",ao,{uniforms:new Map([["uIntensity",new wt(t)]])})}}class lo{constructor(){c(this,"composer");c(this,"glitch");c(this,"glitchTimeout",0)}setup(t,e,o){this.composer=new It(t);const n=new Rt(e,o),s=new Lt({blendFunction:ye.ADD,luminanceThreshold:.25,luminanceSmoothing:.4,intensity:2.4,radius:.6}),a=new ro(.45),r=new Ft({offset:new fe(.0018,.0012),radialModulation:!0,modulationOffset:.5}),l=new Nt({eskil:!1,offset:.35,darkness:.75}),f=new Ut({blendFunction:ye.OVERLAY,premultiply:!0});f.blendMode.opacity.value=.04;const v=new Vt({blendFunction:ye.OVERLAY,density:1.4});return v.blendMode.opacity.value=.07,this.glitch=new Gt({delay:new fe(99999,99999),duration:new fe(.15,.35),strength:new fe(.15,.4),columns:.04,ratio:.85}),this.composer.addPass(n),this.composer.addPass(new be(o,s,a)),this.composer.addPass(new be(o,r,v,l,f)),this.composer.addPass(new be(o,this.glitch)),this.composer}triggerGlitch(){this.glitch.delay.set(0,.05),clearTimeout(this.glitchTimeout),this.glitchTimeout=window.setTimeout(()=>{this.glitch.delay.set(99999,99999)},600)}resize(t,e){this.composer.setSize(t,e)}render(){this.composer.render()}}const X=[{pos:new u(0,180,220),look:new u(0,0,0),label:"HERO"},{pos:new u(-40,12,110),look:new u(-20,20,60),label:"ABOUT"},{pos:new u(-80,-8,55),look:new u(-80,-8,20),label:"PS3 GPU"},{pos:new u(-75,30,-25),look:new u(-75,0,-25),label:"CPUonGPU"},{pos:new u(-30,10,-60),look:new u(0,20,-90),label:"GPU Stream"},{pos:new u(20,35,-80),look:new u(40,25,-110),label:"Selkies"},{pos:new u(80,55,-70),look:new u(100,35,-100),label:"Oris AI"},{pos:new u(110,40,0),look:new u(90,22,-20),label:"VajraGrid"},{pos:new u(100,20,70),look:new u(70,14,50),label:"VidyaMitra"},{pos:new u(50,16,100),look:new u(20,12,80),label:"Netflip"},{pos:new u(10,22,90),look:new u(-20,16,70),label:"Arena"},{pos:new u(-30,60,70),look:new u(-10,40,40),label:"Hackathon"},{pos:new u(-60,8,30),look:new u(-40,8,0),label:"SKILLS"},{pos:new u(0,120,160),look:new u(0,0,0),label:"CONTACT"}];class co{constructor(t){c(this,"camera");c(this,"currentSection",0);c(this,"mouseX",0);c(this,"mouseY",0);c(this,"parallaxTarget",new u);c(this,"onSectionChange");this.camera=t,this.init()}init(){const t=X[0];this.camera.position.copy(t.pos),this.camera.lookAt(t.look),window.addEventListener("mousemove",e=>{this.mouseX=(e.clientX/window.innerWidth-.5)*2,this.mouseY=(e.clientY/window.innerHeight-.5)*2}),this.setupScrollListener(),window.addEventListener("keydown",e=>{(e.key==="ArrowDown"||e.key==="ArrowRight")&&this.goTo(this.currentSection+1),(e.key==="ArrowUp"||e.key==="ArrowLeft")&&this.goTo(this.currentSection-1)})}setupScrollListener(){let t=0,e=!1;window.addEventListener("wheel",o=>{if(e)return;e=!0;const n=o.deltaY>0?1:-1;this.goTo(this.currentSection+n),setTimeout(()=>{e=!1},900)},{passive:!0}),window.addEventListener("touchstart",o=>{t=o.touches[0].clientY}),window.addEventListener("touchend",o=>{const n=t-o.changedTouches[0].clientY;Math.abs(n)>40&&this.goTo(this.currentSection+(n>0?1:-1))})}goTo(t){var a;if(t=Math.max(0,Math.min(X.length-1,t)),t===this.currentSection)return;this.currentSection=t;const e=X[t];oe.to(this.camera.position,{x:e.pos.x,y:e.pos.y,z:e.pos.z,duration:1.8,ease:"power2.inOut"}),oe.to(this.parallaxTarget,{x:e.look.x,y:e.look.y,z:e.look.z,duration:1.8,ease:"power2.inOut",onUpdate:()=>this.camera.lookAt(this.parallaxTarget)}),(a=this.onSectionChange)==null||a.call(this,t),document.querySelectorAll(".nav-dot").forEach((r,l)=>r.classList.toggle("active",l===t));const n=t/(X.length-1)*100,s=document.getElementById("progress-bar");s&&(s.style.height=n+"%")}update(t){const e=X[this.currentSection],o=new u(e.look.x+this.mouseX*8,e.look.y-this.mouseY*5,e.look.z);this.camera.lookAt(o)}getCurrentSection(){return this.currentSection}}const at=[{id:"ps3-gpu",title:"PS3 Cell GPU Emulator",subtitle:"Systems / Emulation",desc:"Full emulation of the Cell Broadband Engine's SPU pipeline in WebGL. 6 SPU cores, PPE scheduler, DMA bus — running real PS3 shaders in the browser at 200 GIPS.",tags:["C++","WebGL","GLSL","Cell BE","Emulation"],url:"https://github.com/aerosane",neonColor:"#00f5ff",district:"GPU DISTRICT",icon:"⬡"},{id:"cpuongpu",title:"CPUonGPU",subtitle:"Architecture Research",desc:"Runs a full x86 CPU simulation entirely on GPU compute shaders. Register file, ALU, cache hierarchy — all in GLSL. JIT-compiled x86 → SPIR-V at runtime.",tags:["GLSL","Compute Shaders","x86","JIT","SPIR-V"],url:"https://github.com/aerosane",neonColor:"#00f5ff",district:"GPU DISTRICT",icon:"⬢"},{id:"gpu-streaming",title:"GPU Streaming Pipeline",subtitle:"NvFBC + NVENC",desc:"Sub-frame-latency game streaming via NvFBC capture → NVENC H265/AV1 encode → WebRTC TURN relay. <1 frame E2E latency. Deployed on GitHub Codespace GPU.",tags:["NVENC","NvFBC","WebRTC","Rust","H265"],url:"https://github.com/Imperialorg/codespace",neonColor:"#00f5ff",district:"GPU DISTRICT",icon:"▶"},{id:"selkies-rust",title:"Selkies-Rust",subtitle:"Python→Rust Port",desc:"Complete rewrite of the Selkies WebRTC game streaming stack from Python into Rust. 6 crates: pipeline, signaling, input, encoding, metrics, CLI.",tags:["Rust","WebRTC","GStreamer","Tokio","GSAP"],url:"https://github.com/Imperialorg/codespace",neonColor:"#ff6b1a",district:"SYSTEMS CORRIDOR",icon:"⚙"},{id:"oris-ai",title:"Oris — AI SRE",subtitle:"🏆 Runner-up · TechSynapse 2026",desc:"Autonomous Site Reliability Engineer: ingests production logs, PII-masks with Presidio, infers root cause via Gemini 2.0, opens GitHub PRs with fixes. Zero human touch.",tags:["Python","Gemini 2.0","Presidio","LangChain","FastAPI"],url:"https://github.com/aerosane",neonColor:"#ff00aa",district:"AI DISTRICT",icon:"◈"},{id:"vajragrid",title:"VajraGrid",subtitle:"🇮🇳 India Innovates 2026 · Bharat Mandapam",desc:"AI-hardened power grid security: detects SCADA cyberattacks in 16s, 4-layer ML defense stack, adversarial training. Exhibited nationally at Bharat Mandapam.",tags:["Python","PyTorch","SCADA","Adversarial ML","GridSec"],url:"https://github.com/aerosane",neonColor:"#ff00aa",district:"AI DISTRICT",icon:"⚡"},{id:"vidyamitra",title:"VidyaMitra",subtitle:"IISER JEE Prep",desc:"AI tutor for JEE aspirants: adaptive quiz engine, LaTeX equation rendering, spaced repetition. Covers Physics, Chemistry, Math with difficulty auto-calibration.",tags:["TypeScript","React","LaTeX","OpenAI","Supabase"],url:"https://github.com/aerosane",neonColor:"#00ff88",district:"EDTECH ZONE",icon:"⬟"},{id:"netflip",title:"Netflip VOD",subtitle:"Full-Stack Streaming",desc:"Netflix-clone with HLS adaptive streaming, Azure Blob CDN, Fastly edge cache, WebSocket live chat, OAuth2, recommendation engine. 1080p adaptive bitrate.",tags:["Next.js","HLS","Azure","Fastly","PostgreSQL"],url:"https://github.com/aerosane",neonColor:"#7b2fff",district:"WEB DISTRICT",icon:"▨"},{id:"coding-arena",title:"Coding Arena",subtitle:"Competitive Judging Platform",desc:"Online judge with isolated Docker execution, multi-language support, real-time leaderboard, plagiarism detection via AST similarity. 200ms median judge latency.",tags:["Go","Docker","Redis","React","WebSocket"],url:"https://github.com/aerosane",neonColor:"#7b2fff",district:"WEB DISTRICT",icon:"{ }"},{id:"hackathon",title:"Hackathon Wins",subtitle:"Hall of Fame",desc:"🏆 Runner-up at TechSynapse 2026 (Oris AI SRE). 🇮🇳 National exhibition at India Innovates 2026, Bharat Mandapam, New Delhi (VajraGrid). 1st year, two nationals.",tags:["Oris AI","VajraGrid","TechSynapse","India Innovates"],url:"https://github.com/aerosane",neonColor:"#ffe642",district:"HALL OF FAME",icon:"🏆"}],uo={Languages:["C++","Rust","Python","TypeScript","Go","GLSL/HLSL"],Systems:["WebRTC","WebGL/WebGPU","NVENC/NvFBC","Docker","Linux"],"AI/ML":["PyTorch","Gemini API","LangChain","Presidio","HuggingFace"],Web:["React","Next.js","Vite","Node.js","PostgreSQL","Redis"],Tools:["Git","GitHub Actions","Azure","GStreamer","Tokio"]};class de{constructor(){c(this,"group",new ot);c(this,"hoverTargets",[]);c(this,"visible",!1);c(this,"visibleValue",0)}enter(){this.group.visible=!0,this.visible=!0,oe.killTweensOf(this),oe.to(this,{visibleValue:1,duration:1.4,ease:"power2.out",onUpdate:()=>this.setVisible(this.visibleValue)})}exit(){this.visible=!1,oe.killTweensOf(this),oe.to(this,{visibleValue:0,duration:.8,ease:"power2.in",onUpdate:()=>this.setVisible(this.visibleValue),onComplete:()=>{this.group.visible=!1}})}setVisible(t){}dispose(){this.group.traverse(t=>{t.geometry&&t.geometry.dispose()})}}function vo(i,t,e="#00f5ff"){const s=document.createElement("canvas");s.width=320,s.height=96;const a=s.getContext("2d");return a.clearRect(0,0,320,96),a.strokeStyle=e,a.lineWidth=1.5,a.strokeRect(1,1,318,94),a.fillStyle=e+"18",a.fillRect(0,0,320,96),a.fillStyle=e,a.font="bold 20px monospace",a.textAlign="center",a.fillText(i,320/2,34),a.fillStyle="rgba(200,230,255,0.7)",a.font="13px monospace",a.fillText(t,320/2,58),new Fe(s)}function Y(i,t,e="#00f5ff"){const o=vo(i,t,e),n=new G({map:o,transparent:!0,depthWrite:!1,side:Z});return new x(new z(5,1.5),n)}const k=new u(-80,-8,38),fo=`
uniform float uTime;
uniform float uVisible;
varying vec2 vUv;

float hash(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5); }

void main() {
  // Rack body: dark metal
  vec3 col = vec3(0.06, 0.07, 0.10);

  // 1U blade rows
  float row = floor(vUv.y * 24.0);
  float rowFrac = fract(vUv.y * 24.0);

  // LED strip on each blade
  float ledX = fract(vUv.x * 8.0);
  float ledRow = mod(row, 2.0);

  // Flicker per blade
  float h = hash(vec2(row, 0.0));
  float flicker = 0.85 + 0.15 * sin(uTime * 3.0 + h * 12.0);
  float led = step(0.72, ledX) * step(ledX, 0.86) * step(0.08, rowFrac) * step(rowFrac, 0.28);
  vec3 ledColor = mix(vec3(0.0, 0.9, 0.2), vec3(0.9, 0.4, 0.0), step(h, 0.15));
  col += ledColor * led * flicker * 2.0;

  // Blade gap
  col *= 1.0 - step(0.9, rowFrac) * 0.5;

  // Glow edge
  col += vec3(0.0, 0.3, 0.15) * (1.0 - abs(vUv.x - 0.5) * 2.0) * 0.03;

  gl_FragColor = vec4(col, uVisible);
}
`,ho=`
attribute float aPhase;
varying float vPhase;
varying vec3 vPos;
void main() {
  vPhase = aPhase;
  vPos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = 4.0;
}
`,mo=`
uniform float uTime;
uniform float uVisible;
varying float vPhase;
varying vec3 vPos;
void main() {
  float t = fract(uTime * 0.6 + vPhase);
  float alive = step(0.0, t) * step(t, 0.8);
  float fade = alive * sin(t * 3.14159);
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;
  float circle = 1.0 - smoothstep(0.2, 0.5, d);
  vec3 col = mix(vec3(0.0, 0.9, 1.0), vec3(0.8, 0.3, 1.0), vPhase);
  gl_FragColor = vec4(col * circle * fade * 2.0, circle * fade * uVisible);
}
`,po=`
uniform float uTime;
uniform float uVisible;
varying vec2 vUv;
void main() {
  vec2 grid = fract(vUv * 30.0);
  float lines = step(0.92, grid.x) + step(0.92, grid.y);
  float glow = lines * 0.6;
  vec3 col = vec3(0.0, 0.6, 0.4) * glow;
  col += vec3(0.01, 0.02, 0.04); // dark base
  gl_FragColor = vec4(col, uVisible);
}
`;class go extends de{constructor(){super(...arguments);c(this,"mats",[]);c(this,"particleMat")}create(e){e.add(this.group);const o=new z(60,50),n=new T({vertexShader:"varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",fragmentShader:po,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0}),s=new x(o,n);s.rotation.x=-Math.PI/2,s.position.set(k.x,k.y-6,k.z),this.group.add(s),this.mats.push(n);const a=new ce(3,20,5),r=new T({vertexShader:"varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",fragmentShader:fo,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0});this.mats.push(r);const l=[[-18,-9,10],[-12,-9,10],[-6,-9,10],[0,-9,10],[-18,-9,-10],[-12,-9,-10],[-6,-9,-10],[0,-9,-10]];for(const[d,m,g]of l){const C=new x(a,r);C.position.set(k.x+d,k.y+m+10,k.z+g),this.group.add(C)}const f=new z(40,.4),v=new G({color:65450,transparent:!0});for(let d=0;d<3;d++){const m=new x(f,v.clone());m.rotation.x=Math.PI/2,m.position.set(k.x-9,k.y+5,k.z-8+d*8),this.group.add(m)}this.buildCellHologram(),this.buildParticles();const h=Y("PS3 CELL BE","GPU Emulator — 6 SPU × 256KB","#00f5ff");h.position.set(k.x+18,k.y+2,k.z),h.scale.setScalar(4),this.group.add(h)}buildCellHologram(){const e=new u(k.x+14,k.y+2,k.z),o=new G({color:62975,wireframe:!0,transparent:!0}),n=new x(new yt(1.5,1),o);n.position.copy(e),this.group.add(n);const s=new G({color:3800852,wireframe:!0,transparent:!0});for(let a=0;a<6;a++){const r=a/6*Math.PI*2,l=new x(new q(.8,.8,.4,6),s.clone());l.position.set(e.x+Math.cos(r)*4,e.y,e.z+Math.sin(r)*4),this.group.add(l)}}buildParticles(){const o=new Float32Array(600),n=new Float32Array(200),s=new u(k.x+14,k.y+2,k.z);for(let l=0;l<200;l++){const v=l%6/6*Math.PI*2,h=Math.random();o[l*3]=s.x+Math.cos(v)*4*h,o[l*3+1]=s.y+(Math.random()-.5)*.5,o[l*3+2]=s.z+Math.sin(v)*4*h,n[l]=Math.random()}const a=new ue;a.setAttribute("position",new O(o,3)),a.setAttribute("aPhase",new O(n,1)),this.particleMat=new T({vertexShader:ho,fragmentShader:mo,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0,depthWrite:!1,blending:_});const r=new Ne(a,this.particleMat);this.group.add(r)}update(e){var o;for(const n of this.mats)(o=n.uniforms)!=null&&o.uTime&&(n.uniforms.uTime.value=e);this.particleMat&&(this.particleMat.uniforms.uTime.value=e)}setVisible(e){for(const o of this.mats)o.uniforms.uVisible.value=e;this.particleMat&&(this.particleMat.uniforms.uVisible.value=e),this.group.traverse(o=>{const n=o;if(!n.isMesh)return;const s=n.material;s&&s.color&&!s.uniforms&&(s.opacity=e)})}onHover(){}}const P=new u(-75,0,-25),wo=`
uniform float uTime;
uniform float uVisible;
varying vec2 vUv;

float hash(float n){ return fract(sin(n)*43758.5); }

void main() {
  vec2 uv = vUv;
  vec3 col = vec3(0.04, 0.12, 0.06); // dark green PCB

  // Circuit trace grid
  vec2 grid = fract(uv * 24.0);
  float hline = step(0.94, grid.y) * step(grid.x, 0.5);
  float vline = step(0.94, grid.x) * step(grid.y, 0.5);
  col += vec3(0.6, 0.9, 0.4) * (hline + vline) * 0.5;

  // Via pads: small circles on grid intersections
  vec2 cell = floor(uv * 24.0);
  vec2 gf = fract(uv * 24.0) - 0.5;
  float h = hash(cell.x * 17.0 + cell.y * 43.0);
  if (h > 0.7) {
    float via = 1.0 - smoothstep(0.08, 0.14, length(gf));
    col += vec3(0.9, 0.8, 0.2) * via; // gold via
  }

  // Electron flow along horizontal traces: animated bright dots
  float traceLine = step(0.96, grid.y);
  float dotX = fract(uv.x * 8.0 - uTime * 0.4 + hash(floor(uv.y * 24.0) * 7.1) * 10.0);
  float dot = traceLine * step(0.86, dotX) * step(dotX, 0.96);
  col += vec3(0.3, 1.0, 0.6) * dot * 3.0;

  gl_FragColor = vec4(col, uVisible);
}
`,qe=`
uniform float uTime;
uniform float uVisible;
uniform vec3 uColor;
varying vec2 vUv;
void main() {
  vec3 col = vec3(0.12, 0.14, 0.20);
  // grid of functional units
  vec2 cell = fract(vUv * 8.0);
  float border = step(0.88, cell.x) + step(0.88, cell.y);
  col = mix(col, uColor * 0.6, border * 0.5);
  // edge glow
  float edge = 1.0 - smoothstep(0.0, 0.08, min(min(vUv.x, 1.0-vUv.x), min(vUv.y, 1.0-vUv.y)));
  col += uColor * edge;
  gl_FragColor = vec4(col, uVisible);
}
`,yo=`
uniform float uTime;
uniform float uVisible;
varying vec2 vUv;

void main() {
  // Pipeline stages: IF ID EX MEM WB
  int stage = int(floor(vUv.x * 5.0));
  float stageF = fract(vUv.x * 5.0);
  float active = sin(uTime * 1.5 - float(stage) * 1.2);
  active = 0.5 + 0.5 * active;

  vec3 cols[5];
  cols[0] = vec3(0.0, 0.8, 1.0);   // IF cyan
  cols[1] = vec3(0.4, 0.6, 1.0);   // ID blue
  cols[2] = vec3(0.9, 0.4, 1.0);   // EX purple
  cols[3] = vec3(1.0, 0.6, 0.2);   // MEM orange
  cols[4] = vec3(0.3, 1.0, 0.4);   // WB green

  vec3 c = vec3(0.0);
  for (int i = 0; i < 5; i++) {
    float sel = float(i == stage ? 1 : 0);
    c += cols[i] * sel;
  }

  float border = step(0.88, stageF) + step(stageF, 0.04);
  c = mix(c * active, vec3(1.0), border * 0.3);

  // Instruction packet: moving left to right
  float pkt = fract(uTime * 0.4) * 5.0;
  float pktCell = floor(pkt);
  float pktFrac = fract(pkt);
  float inStage = float(stage) == pktCell ? 1.0 : 0.0;
  float dot = inStage * (1.0 - smoothstep(0.3, 0.7, abs(stageF - pktFrac)));
  c += vec3(1.0) * dot * 2.0;

  gl_FragColor = vec4(c, 0.85 * uVisible);
}
`;class bo extends de{constructor(){super(...arguments);c(this,"mats",[])}create(e){e.add(this.group);const o=new z(50,50),n=new T({vertexShader:"varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",fragmentShader:wo,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0}),s=new x(o,n);s.rotation.x=-Math.PI/2,s.position.copy(P),this.group.add(s),this.mats.push(n);const a=new T({vertexShader:"varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",fragmentShader:qe,uniforms:{uTime:{value:0},uVisible:{value:0},uColor:{value:new b(43263)}},transparent:!0}),r=new x(new ce(10,.6,10),a);r.position.set(P.x+3,P.y+.3,P.z),this.group.add(r),this.mats.push(a);const l=new T({vertexShader:"varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",fragmentShader:qe,uniforms:{uTime:{value:0},uVisible:{value:0},uColor:{value:new b(3800852)}},transparent:!0}),f=new x(new ce(6,.8,6),l);f.position.set(P.x-10,P.y+.4,P.z-6),this.group.add(f),this.mats.push(l);const v=new T({vertexShader:"varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",fragmentShader:yo,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0,depthWrite:!1,side:Z}),h=new x(new z(12,3),v);h.position.set(P.x+3,P.y+8,P.z),h.rotation.x=-.3,this.group.add(h),this.mats.push(v);const d=Y("GPU DIE","CUDA Cores / SM Array","#00a8ff");d.position.set(P.x+3,P.y+3,P.z+8),d.rotation.x=-Math.PI/2+.3,d.scale.setScalar(3),this.group.add(d);const m=Y("CPU DIE","x86 Emulated on GPU","#39ff14");m.position.set(P.x-10,P.y+3,P.z-2),m.rotation.x=-Math.PI/2+.3,m.scale.setScalar(3),this.group.add(m);const g=Y("IF  →  ID  →  EX  →  MEM  →  WB","Instruction Pipeline","#ffffff");g.position.set(P.x+3,P.y+12,P.z),g.scale.setScalar(4),this.group.add(g)}update(e){for(const o of this.mats)o.uniforms.uTime.value=e}setVisible(e){for(const o of this.mats)o.uniforms.uVisible.value=e}onHover(){}}const y=new u(-10,10,-80),xo=`
uniform float uTime;
uniform float uVisible;
varying vec2 vUv;

void main() {
  // Fiber optic tube: animated light pulse racing along it
  float t = fract(vUv.x * 3.0 - uTime * 1.2);
  float pulse = exp(-abs(t - 0.5) * 12.0);
  vec3 fiberBase = vec3(0.05, 0.05, 0.12);
  vec3 pulseColor = vec3(1.0, 0.4, 0.9);
  vec3 col = fiberBase + pulseColor * pulse * 4.0;
  // Glow around the tube body
  float radial = 1.0 - smoothstep(0.3, 0.5, abs(vUv.y - 0.5));
  col *= radial * 2.0;
  gl_FragColor = vec4(col, radial * uVisible);
}
`,Co=`
uniform float uTime;
uniform float uScale;
void main() {
  vec3 pos = position * (1.0 + uScale * 0.3 + sin(uTime) * 0.05 * uScale);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`,So=`
uniform float uTime;
uniform float uScale;
uniform float uVisible;
void main() {
  float fade = 1.0 - uScale * 0.28;
  float pulse = 0.5 + 0.5 * sin(uTime * 2.0 - uScale * 2.0);
  vec3 col = vec3(1.0, 0.1, 0.6) * (fade + 0.3 * pulse);
  gl_FragColor = vec4(col, fade * 0.7 * uVisible);
}
`,Mo=`
uniform float uTime;
uniform float uVisible;
varying vec2 vUv;

float hash(float n){ return fract(sin(n)*43758.5); }

void main() {
  vec2 uv = vUv;
  // Screen background
  vec3 col = vec3(0.02, 0.04, 0.08);

  // Pipeline stages: 4 boxes
  int stage = int(floor(uv.x * 4.0));
  float stx = fract(uv.x * 4.0);
  float sty = uv.y;

  // Box borders
  float border = step(0.91, stx) + step(stx, 0.05) + step(0.88, sty) + step(sty, 0.08);
  vec3 stageColors[4];
  stageColors[0] = vec3(0.0, 0.9, 1.0);   // Capture
  stageColors[1] = vec3(1.0, 0.4, 0.0);   // NVENC
  stageColors[2] = vec3(0.8, 0.2, 1.0);   // RTP stream
  stageColors[3] = vec3(0.2, 1.0, 0.4);   // Browser decode

  vec3 stCol = vec3(0.0);
  for(int i=0;i<4;i++) stCol += stageColors[i] * float(i==stage ? 1:0);

  float active = 0.3 + 0.7 * (0.5 + 0.5 * sin(uTime * 2.0 - float(stage) * 1.5));
  col = mix(col, stCol * active, border * 0.6 + 0.15);

  // Data packet arrow
  float pkt = fract(uTime * 0.35) * 4.0;
  float pktStage = floor(pkt);
  float inStage = float(stage) == pktStage ? 1.0 : 0.0;
  float arrowX = fract(pkt);
  float arrow = inStage * step(0.4, arrowX) * step(arrowX, 0.55);
  col += vec3(1.0) * arrow * 2.0;

  // Label scanlines
  col += vec3(0.0, 0.2, 0.1) * step(0.95, fract(uv.y * 30.0));

  // Latency readout: blink "< 1 FRAME" green
  float inHUD = step(0.0, uv.y - 0.88) * step(uv.y, 1.0) * step(0.25, uv.x) * step(uv.x, 0.75);
  float blink = step(0.4, sin(uTime * 1.5) * 0.5 + 0.5);
  col = mix(col, vec3(0.0, 1.0, 0.3) * blink, inHUD * 0.8);

  gl_FragColor = vec4(col, uVisible);
}
`;function Se(i,t,e,o){const n=new G({color:8947848}),s=new x(new q(.2,.3,20,8),n);s.position.set(t,e+10,o),i.add(s);for(let r=0;r<4;r++){const l=new x(new q(.08,.08,4-r*.6,6),n);l.rotation.z=Math.PI/2,l.position.set(t,e+4+r*4,o),i.add(l)}const a=new x(new Ue(.3,8,8),new G({color:16720384}));a.position.set(t,e+21,o),i.add(a)}class To extends de{constructor(){super(...arguments);c(this,"mats",[]);c(this,"rings",[])}create(e){e.add(this.group),Se(this.group,y.x-20,y.y-4,y.z),Se(this.group,y.x+15,y.y-4,y.z-10),Se(this.group,y.x+5,y.y-4,y.z+20);for(let f=0;f<4;f++){const v=new bt(4+f*5,4.3+f*5,48),h=new T({vertexShader:Co,fragmentShader:So,uniforms:{uTime:{value:0},uScale:{value:f},uVisible:{value:0}},transparent:!0,depthWrite:!1,side:Z,blending:_}),d=new x(v,h);d.rotation.x=-Math.PI/2,d.position.set(y.x-20,y.y+6,y.z),this.group.add(d),this.rings.push({mesh:d,mat:h,delay:f*.4}),this.mats.push(h)}const o=new it([new u(y.x-20,y.y+8,y.z),new u(y.x-5,y.y+12,y.z-5),new u(y.x+18,y.y+6,y.z+5)]),n=new nt(o,60,.15,6,!1),s=new T({vertexShader:"varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",fragmentShader:xo,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0,depthWrite:!1,blending:_});this.group.add(new x(n,s)),this.mats.push(s);const a=new T({vertexShader:"varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",fragmentShader:Mo,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0}),r=new x(new z(20,10),a);r.position.set(y.x+18,y.y+8,y.z+5),r.rotation.y=-.6,this.group.add(r),this.mats.push(a);const l=Y("GPU STREAMING","NvFBC → NVENC → WebRTC → Browser","#ff006e");l.position.set(y.x,y.y+18,y.z),l.scale.setScalar(4.5),this.group.add(l)}update(e){for(const o of this.mats)o.uniforms.uTime.value=e}setVisible(e){for(const o of this.mats)o.uniforms.uVisible.value=e}onHover(){}}const H=new u(95,40,-90),Ao=`
uniform float uTime;
uniform float uVisible;
uniform int uAnomalyNode;
attribute float aNodeId;
attribute float aActivation;
varying float vActivation;
varying float vAnomaly;

void main() {
  vActivation = aActivation;
  vAnomaly = float(int(aNodeId) == uAnomalyNode ? 1 : 0);

  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;
  float circle = 1.0 - smoothstep(0.3, 0.5, d);

  // Normal node: violet. Anomaly node: red. Resolved: green.
  float resolved = step(0.6, vAnomaly * sin(uTime * 2.0 + 1.0) * 0.5 + 0.5);
  vec3 normalCol = mix(vec3(0.5, 0.1, 1.0), vec3(0.9, 0.2, 1.0), vActivation);
  vec3 anomalyCol = mix(vec3(1.0, 0.1, 0.1), vec3(0.1, 1.0, 0.4), resolved);
  vec3 col = mix(normalCol, anomalyCol, vAnomaly);

  float pulse = 0.7 + 0.3 * sin(uTime * 3.0 + aNodeId * 1.3);
  gl_FragColor = vec4(col * circle * pulse * (0.6 + 0.4 * vActivation), circle * uVisible);
}
`,Po=`
uniform float uTime;
uniform float uVisible;
attribute float aEdgePhase;
varying float vEdgePhase;
void main() {
  vEdgePhase = aEdgePhase;
  float t = fract(uTime * 0.8 + vEdgePhase);
  float pulse = exp(-abs(t - 0.5) * 8.0);
  vec3 col = mix(vec3(0.3, 0.0, 0.7), vec3(1.0, 0.5, 1.0), pulse);
  gl_FragColor = vec4(col, (0.15 + 0.85 * pulse) * uVisible);
}
`,le=class le extends de{constructor(){super(...arguments);c(this,"nodeMat");c(this,"edgeMat");c(this,"logTexture");c(this,"logCanvas");c(this,"logCtx");c(this,"logLines",[]);c(this,"logTimer",0);c(this,"anomalyTimer",0);c(this,"currentAnomaly",-1)}create(e){e.add(this.group);const o=5,n=8,s=5,a=3.5,r=[],l=[],f=[];for(let w=0;w<o;w++)for(let E=0;E<n;E++){const F=H.x+(w-2)*s,N=H.y+(E-n/2+.5)*a,W=H.z;r.push(new u(F,N,W)),l.push(w*n+E),f.push(Math.random())}const v=new ue,h=new Float32Array(r.flatMap(w=>[w.x,w.y,w.z])),d=new Float32Array(l),m=new Float32Array(f);v.setAttribute("position",new O(h,3)),v.setAttribute("aNodeId",new O(d,1)),v.setAttribute("aActivation",new O(m,1)),this.nodeMat=new T({vertexShader:`
        attribute float aNodeId;
        attribute float aActivation;
        varying float vActivation;
        varying float vAnomaly;
        uniform int uAnomalyNode;
        void main() {
          vActivation = aActivation;
          vAnomaly = float(int(aNodeId) == uAnomalyNode ? 1 : 0);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = 6.0 + 4.0 * vActivation;
        }
      `,fragmentShader:Ao,uniforms:{uTime:{value:0},uVisible:{value:0},uAnomalyNode:{value:-1}},transparent:!0,depthWrite:!1,blending:_});const g=new Ne(v,this.nodeMat);this.group.add(g);const C=[],R=[];for(let w=0;w<o-1;w++)for(let E=0;E<n;E++)for(let F=0;F<n;F++){if(Math.random()>.3)continue;const N=r[w*n+E],W=r[(w+1)*n+F];C.push(N.x,N.y,N.z,W.x,W.y,W.z);const ve=Math.random();R.push(ve,ve)}const A=new ue;A.setAttribute("position",new O(new Float32Array(C),3)),A.setAttribute("aEdgePhase",new O(new Float32Array(R),1)),this.edgeMat=new T({vertexShader:`
        attribute float aEdgePhase;
        varying float vEdgePhase;
        void main() {
          vEdgePhase = aEdgePhase;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,fragmentShader:Po,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0,depthWrite:!1,blending:_});const I=new xt(A,this.edgeMat);this.group.add(I),this.logCanvas=document.createElement("canvas"),this.logCanvas.width=512,this.logCanvas.height=256,this.logCtx=this.logCanvas.getContext("2d"),this.logTexture=new Fe(this.logCanvas),this.drawLog();const S=new x(new z(18,9),new G({map:this.logTexture,transparent:!0,depthWrite:!1,side:Z}));S.position.set(H.x+14,H.y,H.z),S.rotation.y=-.4,this.group.add(S);const M=Y("ORIS","AI Site Reliability Engineer","#b000ff");M.position.set(H.x,H.y+20,H.z),M.scale.setScalar(4),this.group.add(M)}drawLog(){const e=this.logCtx,o=this.logCanvas.width,n=this.logCanvas.height;e.clearRect(0,0,o,n),e.fillStyle="rgba(5,0,20,0.9)",e.fillRect(0,0,o,n),e.strokeStyle="#b000ff",e.lineWidth=1,e.strokeRect(0,0,o,n),e.font="11px monospace";const s=this.logLines.slice(-16);for(let a=0;a<s.length;a++){const r=s[a];e.fillStyle=r.startsWith("ERROR")?"#ff4444":r.startsWith("WARN")?"#ffaa00":"#00ee88",e.fillText(r,10,20+a*14)}e.fillStyle="#b000ff",e.fillText("▋",10,20+s.length*14),this.logTexture.needsUpdate=!0}update(e){if(this.nodeMat.uniforms.uTime.value=e,this.edgeMat.uniforms.uTime.value=e,this.logTimer+=1/60,this.logTimer>.8){this.logTimer=0;const o=le.LOG_POOL[Math.floor(Math.random()*le.LOG_POOL.length)];this.logLines.push(o),this.drawLog()}this.anomalyTimer+=1/60,this.currentAnomaly===-1&&this.anomalyTimer>5?(this.anomalyTimer=0,this.currentAnomaly=Math.floor(Math.random()*40),this.nodeMat.uniforms.uAnomalyNode.value=this.currentAnomaly,this.logLines.push(`ERROR anomaly on node_${this.currentAnomaly}`),this.drawLog()):this.currentAnomaly!==-1&&this.anomalyTimer>2&&(this.anomalyTimer=0,this.logLines.push(`INFO  node_${this.currentAnomaly} resolved`),this.drawLog(),this.currentAnomaly=-1,this.nodeMat.uniforms.uAnomalyNode.value=-1)}setVisible(e){this.nodeMat.uniforms.uVisible.value=e,this.edgeMat.uniforms.uVisible.value=e,this.group.traverse(o=>{const n=o.material;(n==null?void 0:n.map)===this.logTexture&&(n.opacity=e)})}onHover(){}};c(le,"LOG_POOL",["INFO  processing log batch #4821","INFO  PII masking: email redacted","WARN  anomaly score: 0.82 (threshold 0.75)","ERROR latency spike detected: 3.2s","INFO  filing GitHub PR #89: auto-patch","INFO  LLM classification: INCIDENT","INFO  alert: slack #oncall notified","INFO  MTTR: 16s — system healed","INFO  model confidence: 0.96","WARN  CPU spike 94% on node gpu-04"]);let Le=le;const p=new u(100,22,-10),Eo=`
uniform float uTime;
uniform float uVisible;
varying vec2 vUv;
void main() {
  float pulse = 0.5 + 0.5 * sin(uTime * 2.0 - vUv.x * 6.0);
  vec3 col = mix(vec3(0.6, 0.6, 0.7), vec3(1.0, 0.8, 0.2), pulse * 0.3);
  float alpha = (1.0 - smoothstep(0.3, 0.5, abs(vUv.y - 0.5) * 2.0)) * uVisible;
  gl_FragColor = vec4(col, alpha * 0.9);
}
`,ko=`
uniform float uTime;
uniform float uVisible;
uniform float uAttackT; // 0=idle, >0 = normalized attack progress
varying vec2 vUv;
void main() {
  // Expanding red ring with decay
  float ring = abs(length(vUv - vec2(0.5)) - uAttackT * 0.5);
  float glow = exp(-ring * 30.0) * (1.0 - uAttackT);
  vec3 col = vec3(1.0, 0.15, 0.15) * glow * 4.0;
  gl_FragColor = vec4(col, glow * uVisible);
}
`,Io=`
uniform float uTime;
uniform float uVisible;
uniform float uLayer;   // 0-3 shield layer
varying vec2 vUv;
void main() {
  float r = length(vUv - vec2(0.5));
  float ringR = 0.45;
  float thickness = 0.04;
  float ring = 1.0 - smoothstep(0.0, thickness, abs(r - ringR));

  // Shield activates when attack happens: uLayer controls timing
  float t = fract(uTime * 0.3 - uLayer * 0.12);
  float active = smoothstep(0.1, 0.3, t) * (1.0 - smoothstep(0.5, 0.8, t));

  vec3 col = mix(vec3(0.8, 0.4, 0.0), vec3(0.2, 0.9, 1.0), uLayer / 3.0);
  gl_FragColor = vec4(col * ring * (0.3 + 0.7 * active), ring * active * 0.7 * uVisible);
}
`,Ro=`
void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,Lo=`
uniform float uTime;
uniform float uVisible;
uniform float uFlash; // 0-1 flash intensity
void main() {
  float flicker = step(0.4, sin(uTime * 25.0));
  gl_FragColor = vec4(vec3(0.7, 0.9, 1.0) * uFlash * flicker, uFlash * flicker * uVisible);
}
`;function Fo(i,t,e,o){const n=new G({color:8947865,wireframe:!1}),s=new G({color:4473941}),a=new x(new q(.4,.7,30,6),s);a.position.set(t,e+15,o),i.add(a);const r=[8,14,20,26],l=[8,6,4,2.5];for(let d=0;d<r.length;d++){const m=new x(new q(.1,.1,l[d],4),n);m.rotation.z=Math.PI/2,m.position.set(t,e+r[d],o),i.add(m)}const f=new q(.06,.06,10,4),v=new x(f,n);v.rotation.z=Math.PI/4,v.position.set(t+2,e+10,o),i.add(v);const h=new G({color:8952234});for(const d of l)for(const m of[-1,1]){const g=new x(new Ue(.2,6,6),h);g.position.set(t+m*d/2,e+r[l.indexOf(d)]-.5,o),i.add(g)}}function No(i,t,e,o=30){const n=[];for(let a=0;a<=o;a++){const r=a/o,l=i.clone().lerp(t,r);l.y-=e*4*r*(1-r),n.push(l)}const s=new it(n);return new nt(s,o,.08,6,!1)}class Uo extends de{constructor(){super(...arguments);c(this,"mats",[]);c(this,"lightningMat");c(this,"lightningGeo");c(this,"lightningLine");c(this,"lightningTimer",0);c(this,"flashIntensity",0);c(this,"attackPlane");c(this,"attackMat");c(this,"shieldMats",[])}create(e){e.add(this.group);const o=[[p.x-22,p.y-6,p.z-12],[p.x-8,p.y-6,p.z-20],[p.x+10,p.y-6,p.z-16],[p.x+20,p.y-6,p.z+4],[p.x+6,p.y-6,p.z+18],[p.x-14,p.y-6,p.z+14]];for(const[l,f,v]of o)Fo(this.group,l,f,v);const n=30,s=new T({vertexShader:"varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",fragmentShader:Eo,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0});this.mats.push(s);for(let l=0;l<o.length;l++){const[f,v,h]=o[l],[d,m,g]=o[(l+1)%o.length],C=new u(f,v+20,h),R=new u(d,m+20,g);for(let A=0;A<3;A++){const I=C.clone().add(new u(A*.6-.6,0,0)),S=R.clone().add(new u(A*.6-.6,0,0)),M=No(I,S,2.5,n);this.group.add(new x(M,s))}}this.attackMat=new T({vertexShader:"varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",fragmentShader:ko,uniforms:{uTime:{value:0},uVisible:{value:0},uAttackT:{value:0}},transparent:!0,depthWrite:!1,blending:_,side:Z}),this.attackPlane=new x(new z(60,60),this.attackMat),this.attackPlane.rotation.x=-Math.PI/2,this.attackPlane.position.set(p.x,p.y-4,p.z),this.group.add(this.attackPlane),this.mats.push(this.attackMat);for(let l=0;l<4;l++){const f=new T({vertexShader:"varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",fragmentShader:Io,uniforms:{uTime:{value:0},uVisible:{value:0},uLayer:{value:l}},transparent:!0,depthWrite:!1,blending:_,side:Z}),v=10+l*5,h=new x(new z(v*2,v*2),f);h.rotation.x=-Math.PI/2,h.position.set(p.x,p.y-3+l*.5,p.z),this.group.add(h),this.shieldMats.push(f)}this.lightningGeo=new ue,this.lightningGeo.setAttribute("position",new O(new Float32Array(20*3),3)),this.lightningMat=new T({vertexShader:Ro,fragmentShader:Lo,uniforms:{uTime:{value:0},uVisible:{value:0},uFlash:{value:0}},transparent:!0,depthWrite:!1,blending:_}),this.lightningLine=new Ct(this.lightningGeo,this.lightningMat),this.group.add(this.lightningLine);const a=Y("VAJRAGRID","Power Grid Cybersecurity — 4-Layer Shield","#ff6b00");a.position.set(p.x,p.y+22,p.z),a.scale.setScalar(4.5),this.group.add(a);const r=Y("RECOVERY: 16s","India Innovates 2026 — Exhibited","#ffcc00");r.position.set(p.x+20,p.y+14,p.z),r.scale.setScalar(3),this.group.add(r)}regenerateLightning(e,o){const[n,s,a]=e,[r,l,f]=o,v=this.lightningGeo.attributes.position,h=20;for(let d=0;d<h;d++){const m=d/(h-1),g=(1-Math.abs(m-.5)*2)*3;v.setXYZ(d,n+(r-n)*m+(Math.random()-.5)*g,s+20+(l+20-(s+20))*m+(Math.random()-.5)*g,a+(f-a)*m+(Math.random()-.5)*g)}v.needsUpdate=!0}update(e){for(const n of this.mats)n.uniforms.uTime.value=e;for(const n of this.shieldMats)n.uniforms.uTime.value=e;if(this.lightningMat.uniforms.uTime.value=e,this.lightningTimer+=1/60,this.lightningTimer>4){this.lightningTimer=0,this.flashIntensity=1;const n=[[p.x-22,p.y-6,p.z-12],[p.x+20,p.y-6,p.z+4]];this.regenerateLightning(n[0],n[1]),this.attackMat.uniforms.uAttackT.value=0}this.flashIntensity=Math.max(0,this.flashIntensity-1/30),this.lightningMat.uniforms.uFlash.value=this.flashIntensity;const o=this.attackMat.uniforms.uAttackT;o.value<1&&(o.value+=.004)}setVisible(e){for(const o of this.mats)o.uniforms.uVisible.value=e;for(const o of this.shieldMats)o.uniforms.uVisible.value=e;this.lightningMat.uniforms.uVisible.value=e}onHover(){}}const Vo=new Set([2,3]);class Go{constructor(t,e){c(this,"envs",new Map);c(this,"activeEnv",null);c(this,"activeIdx",-1);c(this,"cityGroup");c(this,"cityVisible",!0);this.cityGroup=e;const o=[[2,new go],[3,new bo],[4,new To],[6,new Le],[7,new Uo]];for(const[n,s]of o)s.create(t),s.group.visible=!1,this.envs.set(n,s)}onSection(t){if(t===this.activeIdx)return;this.activeIdx=t,this.activeEnv&&(this.activeEnv.exit(),this.activeEnv=null);const e=Vo.has(t);e&&this.cityVisible?(this.cityVisible=!1,this.cityGroup.visible=!1):!e&&!this.cityVisible&&(this.cityVisible=!0,this.cityGroup.visible=!0);const o=this.envs.get(t);o&&(this.activeEnv=o,o.enter())}update(t){this.activeEnv&&this.activeEnv.update(t)}}const zo=document.getElementById("scene-canvas"),ie=new St({canvas:zo,antialias:!0,alpha:!1,powerPreference:"high-performance"});ie.setPixelRatio(Math.min(devicePixelRatio,2));ie.setSize(innerWidth,innerHeight);ie.toneMapping=Mt;ie.toneMappingExposure=.95;const V=new Tt;V.background=new b(131602);V.fog=new At(197400,.003);const ee=new Pt(60,innerWidth/innerHeight,.5,1200),we=new lo;we.setup(ie,V,ee);const Ve=new oo;Ve.create(V);const K=new Qt;K.generate(V);K.addAntennas(V);const Oo=at.map((i,t)=>{const e=X[t+2];return{text:i.district,pos:new u(e.pos.x+12,80,e.pos.z-18),color:i.neonColor}});K.addNeonSigns(V,Oo);const rt=new so;rt.create(V);const Ge=new eo;Ge.create(V);const lt=new to;lt.create(V);const Do=new Et(128,0,.4);V.add(Do);const ze=new ot;V.add(ze);var Qe,et;(et=(Qe=K.cityGroup)==null?void 0:Qe.children)==null||et.forEach(i=>ze.add(i));const ct=new Go(V,ze),ge=new b(62975);function _o(i){const t=Math.min(i,ke.length-1);ge.copy(ke[t]),Ge.setDistrictNeon(ge),Ve.update(0,ee.position,ge)}const Oe=new co(ee);Oe.onSectionChange=i=>{Bo(i),Ho(i),_o(i),we.triggerGlitch(),ct.onSection(i)};const Wo=document.getElementById("nav-dots");X.forEach((i,t)=>{const e=document.createElement("div");e.className="nav-dot"+(t===0?" active":""),e.title=i.label,e.addEventListener("click",()=>Oe.goTo(t)),Wo.appendChild(e)});function Bo(i){document.querySelectorAll(".sect").forEach((t,e)=>{t.classList.toggle("active",e===i)}),document.querySelectorAll(".nav-dot").forEach((t,e)=>{t.classList.toggle("active",e===i)})}function Ho(i){const t=document.getElementById("hud-section");t&&(t.textContent=`DISTRICT_${String(i).padStart(2,"0")} / ${X[i].label}`)}at.forEach((i,t)=>{const e=document.getElementById(`proj-${t+2}`);e&&(e.style.setProperty("--neon",i.neonColor),e.style.borderColor=i.neonColor+"44",e.innerHTML=`
    <div class="proj-icon" style="color:${i.neonColor};text-shadow:0 0 14px ${i.neonColor}">${i.icon}</div>
    <div class="proj-content">
      <div class="proj-district">${i.district}</div>
      <div class="proj-title" style="text-shadow:0 0 20px ${i.neonColor}88">${i.title}</div>
      <div class="proj-subtitle">${i.subtitle}</div>
      <p class="proj-desc">${i.desc}</p>
      <div class="proj-tags">${i.tags.map(o=>`<span class="proj-tag" style="border-color:${i.neonColor}44;color:${i.neonColor}">${o}</span>`).join("")}</div>
      <a class="proj-link" href="${i.url}" target="_blank" style="color:${i.neonColor};border-color:${i.neonColor}">[ VIEW SOURCE → ]</a>
    </div>
  `)});const Ye=document.getElementById("skills-grid");Ye&&Object.entries(uo).forEach(([i,t])=>{const e=document.createElement("div");e.className="skill-cat",e.innerHTML=`<div class="skill-cat-name">// ${i}</div>`+t.map(o=>`<div class="skill-item">${o}</div>`).join(""),Ye.appendChild(e)});const $=document.getElementById("contact-input"),pe=document.getElementById("contact-input-display");var tt;(tt=document.getElementById("sect-13"))==null||tt.addEventListener("click",()=>$==null?void 0:$.focus());$==null||$.addEventListener("input",()=>{pe&&(pe.textContent=($.value||"")+"_"),$.value.trim().toLowerCase()==="sudo"&&(jo(),$.value="",pe&&(pe.textContent="_"))});function jo(){const i=document.querySelector("#sect-13 .terminal-body");if(!i)return;const t=document.createElement("p");t.className="output neon-green",t.textContent="> Permission granted. Downloading your future...",i.appendChild(t),setTimeout(()=>{const e=document.createElement("p");e.className="output",e.innerHTML='<span style="color:#ffe642">root@neon-district:~# ██████████ 100%  COMPLETE</span>',i.appendChild(e)},1500)}const Ke=["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];let ne=0;window.addEventListener("keydown",i=>{i.key===Ke[ne]?ne++:ne=0,ne===Ke.length&&(ne=0,$o())});let Me=!1;function $o(){Me=!Me,[K.meshA,K.meshB,K.meshC].forEach(i=>{const t=i.material;t.wireframe=Me})}const Te=document.getElementById("boot-log"),Ze=document.getElementById("boot-bar"),se=document.getElementById("loading-screen"),Ae=["Initializing WebGPU context","Generating city geometry","Compiling 47 shader programs","Spawning rain particles","Calibrating post-processing chain","System ready"];async function Xo(){for(let i=0;i<Ae.length;i++){await new Promise(e=>setTimeout(e,260+Math.random()*200));const t=document.createElement("p");t.innerHTML=`<span style="color:rgba(0,245,255,.5)">[BOOT]</span> ${Ae[i]}... <span class="ok">[OK]</span>`,Te==null||Te.appendChild(t),Ze&&(Ze.style.width=(i+1)/Ae.length*100+"%")}await new Promise(i=>setTimeout(i,600)),se==null||se.classList.add("fade-out"),setTimeout(()=>{se&&(se.style.display="none")},850)}Xo();window.addEventListener("resize",()=>{ee.aspect=innerWidth/innerHeight,ee.updateProjectionMatrix(),ie.setSize(innerWidth,innerHeight),we.resize(innerWidth,innerHeight)});const Je=new kt;function ut(){requestAnimationFrame(ut);const i=Je.getElapsedTime(),t=Je.getDelta();K.update(i),Ge.update(i),lt.update(i,ee.position),rt.update(i),Ve.update(i,ee.position,ge),Oe.update(t),ct.update(i),we.render()}ut();
