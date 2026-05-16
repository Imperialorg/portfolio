var ft=Object.defineProperty;var mt=(i,t,e)=>t in i?ft(i,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):i[t]=e;var l=(i,t,e)=>mt(i,typeof t!="symbol"?t+"":t,e);import{i as y,d as le,I as W,q as ne,j as ce,t as Ae,a4 as c,Q as Ee,v as j,C as et,z as F,m as H,u as x,Y as M,f as ee,e as k,a as _,J as me,Z as tt,B as pt,E as gt,a3 as ae,a0 as wt,g as ke,G as ot,O as yt,V as bt,$ as St,L as it,a7 as Ct,A as xt,X as Mt,o as Tt,P as Pt,H as At,h as Et}from"./three-D9zYRszm.js";import{b as kt,R as It,a as Rt,B as we,C as Ft,V as Lt,N as Vt,S as Nt,G as Ut,c as ye,E as _t}from"./postprocessing-DbO9Z5Qq.js";import{g as Q}from"./gsap-SFc2wnMY.js";(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))o(n);new MutationObserver(n=>{for(const a of n)if(a.type==="childList")for(const r of a.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&o(r)}).observe(document,{childList:!0,subtree:!0});function e(n){const a={};return n.integrity&&(a.integrity=n.integrity),n.referrerPolicy&&(a.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?a.credentials="include":n.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function o(n){if(n.ep)return;n.ep=!0;const a=e(n);fetch(n.href,a)}})();function ze(i){return i*i*i*(i*(i*6-15)+10)}function be(i,t,e){return i+e*(t-i)}function de(i,t,e){const o=i&3,n=o<2?t:e,a=o<2?e:t;return(i&1?-n:n)+(i&2?-a:a)}const O=Array.from({length:512},(i,t)=>t).sort(()=>Math.random()-.5);for(let i=0;i<256;i++)O[i+256]=O[i];function Gt(i,t){const e=Math.floor(i)&255,o=Math.floor(t)&255,n=i-Math.floor(i),a=t-Math.floor(t),r=ze(n),s=ze(a),u=O[O[e]+o],h=O[O[e]+o+1],v=O[O[e+1]+o],d=O[O[e+1]+o+1];return be(be(de(u,n,a),de(v,n-1,a),r),be(de(h,n,a-1),de(d,n-1,a-1),r),s)}function We(i,t,e=4,o=2,n=.5){let a=0,r=.5,s=1;for(let u=0;u<e;u++)a+=Gt(i*s,t*s)*r,s*=o,r*=n;return a}function I(i,t){return i+Math.random()*(t-i)}function Be(i,t){return Math.floor(I(i,t+1))}const Ot=`
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
`,Dt=`
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
`,zt=`
varying vec2 vUv;
varying vec3 vWorldPos;
varying vec3 vNormal;
void main() {
  vUv = uv;
  vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,Wt=`
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
`,Bt=`
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
`,Ht=`
varying float vAlpha;
void main() {
  gl_FragColor = vec4(0.55, 0.75, 1.0, vAlpha * 0.35);
}
`,jt=`
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
`,Xt=`
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
`,qt=`
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
`,R=32,K=16,Yt=6,se=K+Yt,ve=R/2*se,Se={color:new y(197400),near:100,far:500},Ie=[new y(62975),new y(62975),new y(16711850),new y(16711850),new y(16739098),new y(8073215),new y(8073215),new y(65416),new y(65416),new y(16770626)];function Kt(){return new M({vertexShader:Ot,fragmentShader:Dt,uniforms:{uTime:{value:0},uFogColor:{value:Se.color},uFogNear:{value:Se.near},uFogFar:{value:Se.far}}})}function Zt(i,t){const e=i/R,o=t/R;return e<.35&&o<.35?0:e<.65&&o<.35?1:e>=.65&&o<.35?2:e<.35&&o<.65?3:e>=.65&&o<.65?4:e<.35&&o>=.65?5:e<.65&&o>=.65?6:e>=.65&&o>=.65?7:o>.45&&o<.55?8:9}class Jt{constructor(){l(this,"meshA");l(this,"meshB");l(this,"meshC");l(this,"mats",[])}generate(t){const e=R*R,o=Kt();this.mats.push(o);const n=new le(1,1,1),a=new Float32Array(e),r=new Float32Array(e*3);n.setAttribute("aHeight",new W(a,1)),n.setAttribute("aNeonColor",new W(r,3)),this.meshA=new ne(n,o.clone(),e),this.meshA.frustumCulled=!1,this.mats.push(this.meshA.material);const s=new ce(.45,.55,1,10),u=new Float32Array(e),h=new Float32Array(e*3);s.setAttribute("aHeight",new W(u,1)),s.setAttribute("aNeonColor",new W(h,3)),this.meshB=new ne(s,o.clone(),e),this.meshB.frustumCulled=!1,this.mats.push(this.meshB.material);const v=new le(1,.4,1),d=new Float32Array(e),f=new Float32Array(e*3);v.setAttribute("aHeight",new W(d,1)),v.setAttribute("aNeonColor",new W(f,3)),this.meshC=new ne(v,o.clone(),e),this.meshC.frustumCulled=!1,this.mats.push(this.meshC.material);const m=new Ae,w=new c,p=new c,S=new Ee;let g=0,T=0,C=0;for(let P=0;P<R;P++)for(let A=0;A<R;A++){const V=P*se-ve,X=A*se-ve;if(P%5===0||A%5===0||P%2===0&&A%2===0&&Math.random()<.25)continue;const q=P/R*4-2,ge=A/R*4-2,ut=We(q,ge,5),dt=Math.sqrt(q*q+ge*ge)/3,vt=Math.max(.18,1-dt*.6),Y=Math.max(8,(22+ut*170)*vt)+I(4,28),Ge=I(K*.42,K*.9),Oe=I(K*.42,K*.9),ht=Zt(P,A),D=Ie[ht],De=Math.random();if(De<.65)a[g]=Y,r[g*3]=D.r,r[g*3+1]=D.g,r[g*3+2]=D.b,w.set(V,Y/2,X),p.set(Ge,Y,Oe),m.compose(w,S,p),this.meshA.setMatrixAt(g,m),g++;else if(De<.82){const J=I(K*.18,K*.32);u[T]=Y,h[T*3]=D.r,h[T*3+1]=D.g,h[T*3+2]=D.b,w.set(V+I(-3,3),Y/2,X+I(-3,3)),p.set(J*2,Y,J*2),m.compose(w,S,p),this.meshB.setMatrixAt(T,m),T++}else{const J=Math.max(6,Y*.35);d[C]=J,f[C*3]=D.r,f[C*3+1]=D.g,f[C*3+2]=D.b,w.set(V,J/2,X),p.set(Ge*1.4,J,Oe*1.4),m.compose(w,S,p),this.meshC.setMatrixAt(C,m),C++}}this.meshA.count=g,this.meshB.count=T,this.meshC.count=C;for(const P of[this.meshA,this.meshB,this.meshC]){P.instanceMatrix.needsUpdate=!0;const A=P.geometry;A.getAttribute("aHeight").needsUpdate=!0,A.getAttribute("aNeonColor").needsUpdate=!0,t.add(P)}}addAntennas(t){const e=new ce(.1,.1,1,4),o=new j({color:16716083}),n=new ne(e,o,400);n.frustumCulled=!1;const a=new Ae,r=new c,s=new c,u=new Ee;let h=0;for(let v=0;v<400;v++){const d=Be(0,R-1),f=Be(0,R-1),m=d*se-ve,w=f*se-ve,p=d/R*4-2,S=f/R*4-2,g=Math.max(.18,1-Math.sqrt(p*p+S*S)/3*.6),T=Math.max(8,(22+We(p,S,5)*170)*g)+20,C=I(8,30);r.set(m+I(-3,3),T+C/2,w+I(-3,3)),s.set(1,C,1),a.compose(r,u,s),n.setMatrixAt(h++,a)}n.count=h,n.instanceMatrix.needsUpdate=!0,t.add(n)}addNeonSigns(t,e){e.forEach(({text:o,pos:n,color:a})=>{const r=document.createElement("canvas");r.width=256,r.height=64;const s=r.getContext("2d");s.clearRect(0,0,256,64),s.fillStyle=a+"22",s.fillRect(0,0,256,64),s.strokeStyle=a,s.lineWidth=2,s.strokeRect(2,2,252,60),s.fillStyle=a,s.font="bold 22px monospace",s.textAlign="center",s.fillText(o,128,40);const u=new et(r),h=new F(18,4.5),v=new j({map:u,transparent:!0,side:H,depthWrite:!1}),d=new x(h,v);d.position.copy(n),t.add(d)})}update(t){for(const e of this.mats)e.uniforms.uTime.value=t}}class Qt{constructor(){l(this,"mesh");l(this,"mat")}create(t){const e=new F(1200,1200,1,1);return this.mat=new M({vertexShader:zt,fragmentShader:Wt,uniforms:{uTime:{value:0},uDistrictNeon:{value:new y(62975)},uRainIntensity:{value:1}}}),this.mesh=new x(e,this.mat),this.mesh.rotation.x=-Math.PI/2,this.mesh.position.y=0,t.add(this.mesh),this.mesh}update(t){this.mat.uniforms.uTime.value=t}setDistrictNeon(t){this.mat.uniforms.uDistrictNeon.value.copy(t)}setRainIntensity(t){this.mat.uniforms.uRainIntensity.value=t}}class eo{constructor(){l(this,"points");l(this,"count",8e3)}create(t){const e=new Float32Array(this.count*3),o=new Float32Array(this.count),n=new Float32Array(this.count);for(let s=0;s<this.count;s++)e[s*3]=I(-300,300),e[s*3+1]=I(-60,60),e[s*3+2]=I(-300,300),o[s]=I(.3,1),n[s]=Math.random();const a=new ee;a.setAttribute("position",new k(e,3)),a.setAttribute("aSpeed",new k(o,1)),a.setAttribute("aOffset",new k(n,1));const r=new M({vertexShader:Bt,fragmentShader:Ht,uniforms:{uTime:{value:0}},transparent:!0,blending:_,depthWrite:!1});this.points=new me(a,r),t.add(this.points)}update(t,e){const o=this.points.material;o.uniforms.uTime.value=t,e&&(this.points.position.x=e.x,this.points.position.z=e.z)}}class to{constructor(){l(this,"mesh");l(this,"mat")}create(t){const e=new tt(2e3,32,16);this.mat=new M({vertexShader:jt,fragmentShader:$t,uniforms:{uTime:{value:0},uZenithColor:{value:new y(132104)},uHorizonColor:{value:new y(1706e3)},uDistrictNeon:{value:new y(62975)}},side:pt,depthWrite:!1}),this.mesh=new x(e,this.mat),this.mesh.renderOrder=-1,t.add(this.mesh)}update(t,e,o){this.mesh.position.copy(e),this.mat.uniforms.uTime.value=t,o&&this.mat.uniforms.uDistrictNeon.value.copy(o)}setDistrictColors(t,e){this.mat.uniforms.uHorizonColor.value.copy(t),this.mat.uniforms.uDistrictNeon.value.copy(e)}}function oo(i){let t=i;return()=>{t|=0,t=t+1831565813|0;let e=Math.imul(t^t>>>15,1|t);return e=e+Math.imul(e^e>>>7,61|e)^e,((e^e>>>14)>>>0)/4294967296}}const He=[new y(16720384),new y(61183),new y(22015),new y(16711884),new y(65382),new y(16737792),new y(11141375),new y(16770626)],Re=32,nt=16,io=6,Fe=nt+io,je=Re/2*Fe;class no{constructor(){l(this,"mesh");l(this,"mat")}create(t){const o=new F(5,1.4),n=new Float32Array(150*3),a=new Float32Array(150),r=new Float32Array(150);o.setAttribute("aColor",new W(n,3)),o.setAttribute("aFlickerSeed",new W(a,1)),o.setAttribute("aPulseMode",new W(r,1)),this.mat=new M({vertexShader:Xt,fragmentShader:qt,uniforms:{uTime:{value:0}},transparent:!0,depthWrite:!1,side:H,blending:_}),this.mesh=new ne(o,this.mat,150),this.mesh.frustumCulled=!1;const s=oo(42),u=new Ae,h=new c,v=new Ee,d=new c(1,1,1);let f=0;for(let m=0;m<Re&&f<150;m++)for(let w=0;w<Re&&f<150;w++){if(m%5===0||w%5===0||s()>.1)continue;const p=m*Fe-je,S=w*Fe-je,g=6+s()*12,T=Math.floor(s()*4),C=nt*.5+.3;let P=p,A=S,V=0;T===0?(A=S+C,V=0):T===1?(A=S-C,V=Math.PI):T===2?(P=p+C,V=Math.PI*.5):(P=p-C,V=-Math.PI*.5),h.set(P,g,A),v.setFromEuler(new gt(0,V,0)),u.compose(h,v,d),this.mesh.setMatrixAt(f,u);const X=He[Math.floor(s()*He.length)];n[f*3]=X.r,n[f*3+1]=X.g,n[f*3+2]=X.b,a[f]=s();const q=s();r[f]=q<.6?0:q<.85?1:q<.95?2:3,f++}this.mesh.count=f,this.mesh.instanceMatrix.needsUpdate=!0,o.getAttribute("aColor").needsUpdate=!0,o.getAttribute("aFlickerSeed").needsUpdate=!0,o.getAttribute("aPulseMode").needsUpdate=!0,t.add(this.mesh)}update(t){this.mat.uniforms.uTime.value=t}}const ao=`
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
`;class so extends _t{constructor(t=.45){super("LensStreakEffect",ao,{uniforms:new Map([["uIntensity",new wt(t)]])})}}class ro{constructor(){l(this,"composer");l(this,"glitch");l(this,"glitchTimeout",0)}setup(t,e,o){this.composer=new kt(t);const n=new It(e,o),a=new Rt({blendFunction:we.ADD,luminanceThreshold:.25,luminanceSmoothing:.4,intensity:2.4,radius:.6}),r=new so(.45),s=new Ft({offset:new ae(.0018,.0012),radialModulation:!0,modulationOffset:.5}),u=new Lt({eskil:!1,offset:.35,darkness:.75}),h=new Vt({blendFunction:we.OVERLAY,premultiply:!0});h.blendMode.opacity.value=.04;const v=new Nt({blendFunction:we.OVERLAY,density:1.4});return v.blendMode.opacity.value=.07,this.glitch=new Ut({delay:new ae(99999,99999),duration:new ae(.15,.35),strength:new ae(.15,.4),columns:.04,ratio:.85}),this.composer.addPass(n),this.composer.addPass(new ye(o,a,r)),this.composer.addPass(new ye(o,s,v,u,h)),this.composer.addPass(new ye(o,this.glitch)),this.composer}triggerGlitch(){this.glitch.delay.set(0,.05),clearTimeout(this.glitchTimeout),this.glitchTimeout=window.setTimeout(()=>{this.glitch.delay.set(99999,99999)},600)}resize(t,e){this.composer.setSize(t,e)}render(){this.composer.render()}}const U=[{pos:new c(0,180,220),look:new c(0,0,0),label:"HERO",t:0},{pos:new c(-40,12,110),look:new c(-20,20,60),label:"ABOUT",t:0},{pos:new c(-80,-8,55),look:new c(-80,-8,20),label:"PS3 GPU",t:0},{pos:new c(-75,30,-25),look:new c(-75,0,-25),label:"CPUonGPU",t:0},{pos:new c(-30,10,-60),look:new c(0,20,-90),label:"GPU Stream",t:0},{pos:new c(20,35,-80),look:new c(40,25,-110),label:"Selkies",t:0},{pos:new c(80,55,-70),look:new c(100,35,-100),label:"Oris AI",t:0},{pos:new c(110,40,0),look:new c(90,22,-20),label:"VajraGrid",t:0},{pos:new c(100,20,70),look:new c(70,14,50),label:"VidyaMitra",t:0},{pos:new c(50,16,100),look:new c(20,12,80),label:"Netflip",t:0},{pos:new c(10,22,90),look:new c(-20,16,70),label:"Arena",t:0},{pos:new c(-30,60,70),look:new c(-10,40,40),label:"Hackathon",t:0},{pos:new c(-60,8,30),look:new c(-40,8,0),label:"SKILLS",t:0},{pos:new c(0,120,160),look:new c(0,0,0),label:"CONTACT",t:0}],lo=1600;class co{constructor(t){l(this,"camera");l(this,"posSpline");l(this,"lookSpline");l(this,"t",0);l(this,"currentSection",0);l(this,"mouseX",0);l(this,"mouseY",0);l(this,"_pos",new c);l(this,"_look",new c);l(this,"_ahead",new c);l(this,"onSectionChange");l(this,"_lastFiredSection",0);this.camera=t,this.buildSpline(),this.init()}buildSpline(){const t=U.map(n=>n.pos.clone()),e=U.map(n=>n.look.clone());this.posSpline=new ke(t,!1,"catmullrom",.5),this.lookSpline=new ke(e,!1,"catmullrom",.5);const o=U.length;U.forEach((n,a)=>{n.t=a/(o-1)}),this.t=0,this.posSpline.getPoint(0,this._pos),this.lookSpline.getPoint(0,this._look),this.camera.position.copy(this._pos),this.camera.lookAt(this._look)}init(){window.addEventListener("mousemove",o=>{this.mouseX=(o.clientX/window.innerWidth-.5)*2,this.mouseY=(o.clientY/window.innerHeight-.5)*2});let t=!1;window.addEventListener("wheel",o=>{if(t)return;t=!0;const n=o.deltaY>0?1:-1;this.goTo(this.currentSection+n),setTimeout(()=>{t=!1},lo)},{passive:!0});let e=0;window.addEventListener("touchstart",o=>{e=o.touches[0].clientY}),window.addEventListener("touchend",o=>{const n=e-o.changedTouches[0].clientY;Math.abs(n)>40&&this.goTo(this.currentSection+(n>0?1:-1))}),window.addEventListener("keydown",o=>{(o.key==="ArrowDown"||o.key==="ArrowRight")&&this.goTo(this.currentSection+1),(o.key==="ArrowUp"||o.key==="ArrowLeft")&&this.goTo(this.currentSection-1)})}goTo(t){if(t=Math.max(0,Math.min(U.length-1,t)),t===this.currentSection)return;const e=this.currentSection;this.currentSection=t;const o=U[t].t,a=.6+Math.abs(o-this.t)*5;Q.killTweensOf(this),Q.to(this,{t:o,duration:a,ease:"power2.inOut",onUpdate:()=>this._fireCrossings(e,t),onComplete:()=>{var r;this._lastFiredSection=t,(r=this.onSectionChange)==null||r.call(this,t),this._updateUI(t)}}),this._updateUI(t)}_fireCrossings(t,e){const o=e>t?1:-1;U.forEach((n,a)=>{var s;(o>0?this.t>=n.t&&a>this._lastFiredSection&&a<=e:this.t<=n.t&&a<this._lastFiredSection&&a>=e)&&(this._lastFiredSection=a,(s=this.onSectionChange)==null||s.call(this,a),this._updateUI(a))})}update(t){this.posSpline.getPoint(this.t,this._pos),this.camera.position.copy(this._pos);const e=Math.min(1,this.t+.015);this.posSpline.getPoint(e,this._ahead),this.lookSpline.getPoint(this.t,this._look);const o=this._look.x*.8+this._ahead.x*.2+this.mouseX*5,n=this._look.y*.8+this._ahead.y*.2-this.mouseY*3,a=this._look.z*.8+this._ahead.z*.2;this.camera.lookAt(o,n,a)}_updateUI(t){document.querySelectorAll(".nav-dot").forEach((o,n)=>o.classList.toggle("active",n===t));const e=document.getElementById("progress-bar");e&&(e.style.height=t/(U.length-1)*100+"%")}getCurrentSection(){return this.currentSection}}const at=[{id:"ps3-gpu",title:"PS3 Cell GPU Emulator",subtitle:"Systems / Emulation",desc:"Full emulation of the Cell Broadband Engine's SPU pipeline in WebGL. 6 SPU cores, PPE scheduler, DMA bus — running real PS3 shaders in the browser at 200 GIPS.",tags:["C++","WebGL","GLSL","Cell BE","Emulation"],url:"https://github.com/aerosane",neonColor:"#00f5ff",district:"GPU DISTRICT",icon:"⬡"},{id:"cpuongpu",title:"CPUonGPU",subtitle:"Architecture Research",desc:"Runs a full x86 CPU simulation entirely on GPU compute shaders. Register file, ALU, cache hierarchy — all in GLSL. JIT-compiled x86 → SPIR-V at runtime.",tags:["GLSL","Compute Shaders","x86","JIT","SPIR-V"],url:"https://github.com/aerosane",neonColor:"#00f5ff",district:"GPU DISTRICT",icon:"⬢"},{id:"gpu-streaming",title:"GPU Streaming Pipeline",subtitle:"NvFBC + NVENC",desc:"Sub-frame-latency game streaming via NvFBC capture → NVENC H265/AV1 encode → WebRTC TURN relay. <1 frame E2E latency. Deployed on GitHub Codespace GPU.",tags:["NVENC","NvFBC","WebRTC","Rust","H265"],url:"https://github.com/Imperialorg/codespace",neonColor:"#00f5ff",district:"GPU DISTRICT",icon:"▶"},{id:"selkies-rust",title:"Selkies-Rust",subtitle:"Python→Rust Port",desc:"Complete rewrite of the Selkies WebRTC game streaming stack from Python into Rust. 6 crates: pipeline, signaling, input, encoding, metrics, CLI.",tags:["Rust","WebRTC","GStreamer","Tokio","GSAP"],url:"https://github.com/Imperialorg/codespace",neonColor:"#ff6b1a",district:"SYSTEMS CORRIDOR",icon:"⚙"},{id:"oris-ai",title:"Oris — AI SRE",subtitle:"🏆 Runner-up · TechSynapse 2026",desc:"Autonomous Site Reliability Engineer: ingests production logs, PII-masks with Presidio, infers root cause via Gemini 2.0, opens GitHub PRs with fixes. Zero human touch.",tags:["Python","Gemini 2.0","Presidio","LangChain","FastAPI"],url:"https://github.com/aerosane",neonColor:"#ff00aa",district:"AI DISTRICT",icon:"◈"},{id:"vajragrid",title:"VajraGrid",subtitle:"🇮🇳 India Innovates 2026 · Bharat Mandapam",desc:"AI-hardened power grid security: detects SCADA cyberattacks in 16s, 4-layer ML defense stack, adversarial training. Exhibited nationally at Bharat Mandapam.",tags:["Python","PyTorch","SCADA","Adversarial ML","GridSec"],url:"https://github.com/aerosane",neonColor:"#ff00aa",district:"AI DISTRICT",icon:"⚡"},{id:"vidyamitra",title:"VidyaMitra",subtitle:"IISER JEE Prep",desc:"AI tutor for JEE aspirants: adaptive quiz engine, LaTeX equation rendering, spaced repetition. Covers Physics, Chemistry, Math with difficulty auto-calibration.",tags:["TypeScript","React","LaTeX","OpenAI","Supabase"],url:"https://github.com/aerosane",neonColor:"#00ff88",district:"EDTECH ZONE",icon:"⬟"},{id:"netflip",title:"Netflip VOD",subtitle:"Full-Stack Streaming",desc:"Netflix-clone with HLS adaptive streaming, Azure Blob CDN, Fastly edge cache, WebSocket live chat, OAuth2, recommendation engine. 1080p adaptive bitrate.",tags:["Next.js","HLS","Azure","Fastly","PostgreSQL"],url:"https://github.com/aerosane",neonColor:"#7b2fff",district:"WEB DISTRICT",icon:"▨"},{id:"coding-arena",title:"Coding Arena",subtitle:"Competitive Judging Platform",desc:"Online judge with isolated Docker execution, multi-language support, real-time leaderboard, plagiarism detection via AST similarity. 200ms median judge latency.",tags:["Go","Docker","Redis","React","WebSocket"],url:"https://github.com/aerosane",neonColor:"#7b2fff",district:"WEB DISTRICT",icon:"{ }"},{id:"hackathon",title:"Hackathon Wins",subtitle:"Hall of Fame",desc:"🏆 Runner-up at TechSynapse 2026 (Oris AI SRE). 🇮🇳 National exhibition at India Innovates 2026, Bharat Mandapam, New Delhi (VajraGrid). 1st year, two nationals.",tags:["Oris AI","VajraGrid","TechSynapse","India Innovates"],url:"https://github.com/aerosane",neonColor:"#ffe642",district:"HALL OF FAME",icon:"🏆"}],uo={Languages:["C++","Rust","Python","TypeScript","Go","GLSL/HLSL"],Systems:["WebRTC","WebGL/WebGPU","NVENC/NvFBC","Docker","Linux"],"AI/ML":["PyTorch","Gemini API","LangChain","Presidio","HuggingFace"],Web:["React","Next.js","Vite","Node.js","PostgreSQL","Redis"],Tools:["Git","GitHub Actions","Azure","GStreamer","Tokio"]};class ue{constructor(){l(this,"group",new ot);l(this,"hoverTargets",[]);l(this,"visible",!1);l(this,"visibleValue",0)}enter(){this.group.visible=!0,this.visible=!0,Q.killTweensOf(this),Q.to(this,{visibleValue:1,duration:1.4,ease:"power2.out",onUpdate:()=>this.setVisible(this.visibleValue)})}exit(){this.visible=!1,Q.killTweensOf(this),Q.to(this,{visibleValue:0,duration:.8,ease:"power2.in",onUpdate:()=>this.setVisible(this.visibleValue),onComplete:()=>{this.group.visible=!1}})}setVisible(t){}dispose(){this.group.traverse(t=>{t.geometry&&t.geometry.dispose()})}}const E=new c(-80,-8,38),vo=`
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
`,fo=`
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
  gl_FragColor = vec4(col * circle * fade * 4.0, circle * fade * uVisible);
}
`,mo=`
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
`;class po extends ue{constructor(){super(...arguments);l(this,"mats",[]);l(this,"particleMat")}create(e){e.add(this.group);const o=new F(60,50),n=new M({vertexShader:"varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",fragmentShader:mo,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0}),a=new x(o,n);a.rotation.x=-Math.PI/2,a.position.set(E.x,E.y-6,E.z),this.group.add(a),this.mats.push(n);const r=new le(4,24,6),s=new M({vertexShader:"varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",fragmentShader:vo,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0});this.mats.push(s);const u=[[-18,-9,10],[-12,-9,10],[-6,-9,10],[0,-9,10],[-18,-9,-10],[-12,-9,-10],[-6,-9,-10],[0,-9,-10]];for(const[d,f,m]of u){const w=new x(r,s);w.position.set(E.x+d,E.y+f+10,E.z+m),this.group.add(w)}const h=new F(40,.4),v=new j({color:65450,transparent:!0});for(let d=0;d<3;d++){const f=new x(h,v.clone());f.rotation.x=Math.PI/2,f.position.set(E.x-9,E.y+5,E.z-8+d*8),this.group.add(f)}this.buildCellHologram(),this.buildParticles()}buildCellHologram(){const e=new c(E.x+14,E.y+2,E.z),o=new j({color:62975,wireframe:!0,transparent:!0}),n=new x(new yt(2.5,1),o);n.position.copy(e),this.group.add(n);const a=new j({color:3800852,wireframe:!0,transparent:!0});for(let r=0;r<6;r++){const s=r/6*Math.PI*2,u=new x(new ce(.8,.8,.4,6),a.clone());u.position.set(e.x+Math.cos(s)*6,e.y,e.z+Math.sin(s)*6),this.group.add(u)}}buildParticles(){const o=new Float32Array(600),n=new Float32Array(200),a=new c(E.x+14,E.y+2,E.z);for(let u=0;u<200;u++){const v=u%6/6*Math.PI*2,d=Math.random();o[u*3]=a.x+Math.cos(v)*6*d,o[u*3+1]=a.y+(Math.random()-.5)*.5,o[u*3+2]=a.z+Math.sin(v)*6*d,n[u]=Math.random()}const r=new ee;r.setAttribute("position",new k(o,3)),r.setAttribute("aPhase",new k(n,1)),this.particleMat=new M({vertexShader:ho,fragmentShader:fo,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0,depthWrite:!1,blending:_});const s=new me(r,this.particleMat);this.group.add(s)}update(e){var o;for(const n of this.mats)(o=n.uniforms)!=null&&o.uTime&&(n.uniforms.uTime.value=e);this.particleMat&&(this.particleMat.uniforms.uTime.value=e)}setVisible(e){for(const o of this.mats)o.uniforms.uVisible.value=e;this.particleMat&&(this.particleMat.uniforms.uVisible.value=e),this.group.traverse(o=>{const n=o;if(!n.isMesh)return;const a=n.material;a&&a.color&&!a.uniforms&&(a.opacity=e)})}onHover(){}}const G=new c(-75,0,-25),go=`
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
  col += vec3(0.3, 1.0, 0.6) * dot * 6.0;

  gl_FragColor = vec4(col, uVisible);
}
`,$e=`
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
`,wo=`
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
`;class yo extends ue{constructor(){super(...arguments);l(this,"mats",[])}create(e){e.add(this.group);const o=new F(70,70),n=new M({vertexShader:"varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",fragmentShader:go,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0}),a=new x(o,n);a.rotation.x=-Math.PI/2,a.position.copy(G),this.group.add(a),this.mats.push(n);const r=new M({vertexShader:"varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",fragmentShader:$e,uniforms:{uTime:{value:0},uVisible:{value:0},uColor:{value:new y(43263)}},transparent:!0}),s=new x(new le(14,.8,14),r);s.position.set(G.x+3,G.y+.3,G.z),this.group.add(s),this.mats.push(r);const u=new M({vertexShader:"varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",fragmentShader:$e,uniforms:{uTime:{value:0},uVisible:{value:0},uColor:{value:new y(3800852)}},transparent:!0}),h=new x(new le(8,1,8),u);h.position.set(G.x-10,G.y+.4,G.z-6),this.group.add(h),this.mats.push(u);const v=new M({vertexShader:"varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",fragmentShader:wo,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0,depthWrite:!1,side:H}),d=new x(new F(18,5),v);d.position.set(G.x+3,G.y+11,G.z),d.rotation.x=-.3,this.group.add(d),this.mats.push(v)}update(e){for(const o of this.mats)o.uniforms.uTime.value=e}setVisible(e){for(const o of this.mats)o.uniforms.uVisible.value=e}onHover(){}}const b=new c(-10,10,-80),bo=`
uniform float uTime;
uniform float uVisible;
varying vec2 vUv;

void main() {
  // Fiber optic tube: animated light pulse racing along it
  float t = fract(vUv.x * 3.0 - uTime * 1.2);
  float pulse = exp(-abs(t - 0.5) * 12.0);
  vec3 fiberBase = vec3(0.05, 0.05, 0.12);
  vec3 pulseColor = vec3(1.0, 0.2, 0.8);
  vec3 col = fiberBase + pulseColor * pulse * 8.0;
  // Glow around the tube body
  float radial = 1.0 - smoothstep(0.3, 0.5, abs(vUv.y - 0.5));
  col *= radial * 2.0;
  gl_FragColor = vec4(col, radial * uVisible);
}
`,So=`
uniform float uTime;
uniform float uScale;
void main() {
  vec3 pos = position * (1.0 + uScale * 0.3 + sin(uTime) * 0.05 * uScale);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`,Co=`
uniform float uTime;
uniform float uScale;
uniform float uVisible;
void main() {
  float fade = 1.0 - uScale * 0.28;
  float pulse = 0.5 + 0.5 * sin(uTime * 2.0 - uScale * 2.0);
  vec3 col = vec3(1.0, 0.1, 0.6) * (fade + 0.3 * pulse);
  gl_FragColor = vec4(col, fade * 0.7 * uVisible);
}
`,xo=`
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
`;function Ce(i,t,e,o){const n=new j({color:8947848}),a=new x(new ce(.2,.3,20,8),n);a.position.set(t,e+10,o),i.add(a);for(let s=0;s<4;s++){const u=new x(new ce(.08,.08,4-s*.6,6),n);u.rotation.z=Math.PI/2,u.position.set(t,e+4+s*4,o),i.add(u)}const r=new x(new tt(.3,8,8),new j({color:16720384}));r.position.set(t,e+21,o),i.add(r)}class Mo extends ue{constructor(){super(...arguments);l(this,"mats",[]);l(this,"rings",[])}create(e){e.add(this.group),Ce(this.group,b.x-20,b.y-4,b.z),Ce(this.group,b.x+15,b.y-4,b.z-10),Ce(this.group,b.x+5,b.y-4,b.z+20);for(let u=0;u<4;u++){const h=new bt(6+u*7,6.4+u*7,48),v=new M({vertexShader:So,fragmentShader:Co,uniforms:{uTime:{value:0},uScale:{value:u},uVisible:{value:0}},transparent:!0,depthWrite:!1,side:H,blending:_}),d=new x(h,v);d.rotation.x=-Math.PI/2,d.position.set(b.x-20,b.y+6,b.z),this.group.add(d),this.rings.push({mesh:d,mat:v,delay:u*.4}),this.mats.push(v)}const o=new ke([new c(b.x-20,b.y+8,b.z),new c(b.x-5,b.y+12,b.z-5),new c(b.x+18,b.y+6,b.z+5)]),n=new St(o,60,.15,6,!1),a=new M({vertexShader:"varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",fragmentShader:bo,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0,depthWrite:!1,blending:_});this.group.add(new x(n,a)),this.mats.push(a);const r=new M({vertexShader:"varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",fragmentShader:xo,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0}),s=new x(new F(28,14),r);s.position.set(b.x+18,b.y+8,b.z+5),s.rotation.y=-.6,this.group.add(s),this.mats.push(r)}update(e){for(const o of this.mats)o.uniforms.uTime.value=e}setVisible(e){for(const o of this.mats)o.uniforms.uVisible.value=e}onHover(){}}const z=new c(95,40,-90),To=`
attribute float aNodeId;
attribute float aActivation;
varying float vActivation;
varying float vIsAnomaly;
uniform int uAnomalyNode;
uniform float uTime;
void main() {
  vActivation = aActivation;
  vIsAnomaly = float(int(aNodeId) == uAnomalyNode ? 1 : 0);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = 14.0 + 8.0 * vActivation + 8.0 * vIsAnomaly;
}
`,Po=`
uniform float uTime;
uniform float uVisible;
varying float vActivation;
varying float vIsAnomaly;
void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;
  float ring  = 1.0 - smoothstep(0.30, 0.50, d);
  float inner = 1.0 - smoothstep(0.08, 0.22, d);
  float pulse = 0.7 + 0.3 * sin(uTime * 3.0 + vActivation * 6.28);
  vec3 normalCol  = mix(vec3(0.4, 0.05, 0.9), vec3(0.9, 0.3, 1.0), vActivation);
  float resolved  = 0.5 + 0.5 * sin(uTime * 2.5);
  vec3 anomalyCol = mix(vec3(1.0, 0.05, 0.1), vec3(0.0, 1.0, 0.5), resolved);
  vec3 col = mix(normalCol, anomalyCol, vIsAnomaly);
  float alpha = (ring * 0.4 + inner) * pulse * uVisible;
  gl_FragColor = vec4(col * (ring + inner * 1.5), alpha);
}
`,Ao=`
attribute float aEdgePhase;
varying float vEdgePhase;
varying float vT;        // 0=start vertex, 1=end vertex (from position along segment)
void main() {
  vEdgePhase = aEdgePhase;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,Eo=`
uniform float uTime;
uniform float uVisible;
varying float vEdgePhase;
void main() {
  float t   = fract(uTime * 0.7 + vEdgePhase);
  float pulse = exp(-abs(t - 0.5) * 9.0);
  vec3 col  = mix(vec3(0.25, 0.0, 0.6), vec3(1.0, 0.5, 1.0), pulse);
  float alpha = (0.18 + 0.82 * pulse) * uVisible;
  gl_FragColor = vec4(col, alpha);
}
`,ko="varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",Io=`
uniform float uTime;
uniform float uVisible;
varying vec2 vUv;
void main() {
  vec2 g  = fract(vUv * 20.0);
  float grid = step(0.96, g.x) + step(0.96, g.y);
  float dist = length(vUv - 0.5);
  float fade = 1.0 - smoothstep(0.2, 0.5, dist);
  vec3 col = vec3(0.3, 0.05, 0.6) * grid * fade;
  gl_FragColor = vec4(col, grid * fade * 0.5 * uVisible);
}
`,re=class re extends ue{constructor(){super(...arguments);l(this,"nodeMat");l(this,"edgeMat");l(this,"floorMat");l(this,"logTexture");l(this,"logCanvas");l(this,"logCtx");l(this,"logLines",[]);l(this,"logTimer",0);l(this,"anomalyTimer",0);l(this,"currentAnomaly",-1)}create(e){e.add(this.group);const o=new M({vertexShader:ko,fragmentShader:Io,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0,depthWrite:!1,side:H}),n=new x(new F(90,90),o);n.rotation.x=-Math.PI/2,n.position.set(z.x,z.y-18,z.z),this.group.add(n),this.floorMat=o;const a=5,r=8,s=[],u=new Float32Array(a*r),h=new Float32Array(a*r);for(let g=0;g<a;g++)for(let T=0;T<r;T++){const C=g*r+T;s.push(new c(z.x+(g-2)*8,z.y+(T-r/2+.5)*5.5,z.z)),u[C]=C,h[C]=Math.random()}const v=new Float32Array(s.flatMap(g=>[g.x,g.y,g.z])),d=new ee;d.setAttribute("position",new k(v,3)),d.setAttribute("aNodeId",new k(u,1)),d.setAttribute("aActivation",new k(h,1)),this.nodeMat=new M({vertexShader:To,fragmentShader:Po,uniforms:{uTime:{value:0},uVisible:{value:0},uAnomalyNode:{value:-1}},transparent:!0,depthWrite:!1,blending:_}),this.group.add(new me(d,this.nodeMat));const f=[],m=[];for(let g=0;g<a-1;g++)for(let T=0;T<r;T++)for(let C=0;C<r;C++){if(Math.random()>.3)continue;const P=s[g*r+T],A=s[(g+1)*r+C];f.push(P.x,P.y,P.z,A.x,A.y,A.z);const V=Math.random();m.push(V,V)}const w=new ee;w.setAttribute("position",new k(new Float32Array(f),3)),w.setAttribute("aEdgePhase",new k(new Float32Array(m),1)),this.edgeMat=new M({vertexShader:Ao,fragmentShader:Eo,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0,depthWrite:!1,blending:_}),this.group.add(new it(w,this.edgeMat)),this.logCanvas=document.createElement("canvas"),this.logCanvas.width=512,this.logCanvas.height=320,this.logCtx=this.logCanvas.getContext("2d"),this.logTexture=new et(this.logCanvas),this.drawLog();const p=new j({map:this.logTexture,transparent:!0,depthWrite:!1,side:H}),S=new x(new F(16,10),p);S.position.set(z.x+16,z.y-2,z.z+4),S.rotation.y=-.5,this.group.add(S)}drawLog(){const e=this.logCtx,o=512,n=320;e.clearRect(0,0,o,n),e.fillStyle="rgba(4, 0, 18, 0.92)",e.fillRect(0,0,o,n);for(let r=0;r<n;r+=3)e.fillStyle="rgba(0,0,0,0.18)",e.fillRect(0,r,o,1);e.font="12px monospace";const a=this.logLines.slice(-20);for(let r=0;r<a.length;r++){const s=a[r];e.fillStyle=s.startsWith("ERROR")?"#ff4455":s.startsWith("WARN")?"#ffaa22":"#22ee88",e.shadowColor=e.fillStyle,e.shadowBlur=4,e.fillText(s,10,18+r*15)}e.fillStyle="#b000ff",e.shadowColor="#b000ff",e.shadowBlur=8,e.fillText("▋",10,18+a.length*15),this.logTexture.needsUpdate=!0}update(e){this.nodeMat.uniforms.uTime.value=e,this.edgeMat.uniforms.uTime.value=e,this.floorMat.uniforms.uTime.value=e,this.logTimer+=1/60,this.logTimer>.75&&(this.logTimer=0,this.logLines.push(re.LOG_POOL[Math.floor(Math.random()*re.LOG_POOL.length)]),this.drawLog()),this.anomalyTimer+=1/60,this.currentAnomaly===-1&&this.anomalyTimer>5?(this.anomalyTimer=0,this.currentAnomaly=Math.floor(Math.random()*40),this.nodeMat.uniforms.uAnomalyNode.value=this.currentAnomaly,this.logLines.push(`ERROR anomaly on node_${this.currentAnomaly}`),this.drawLog()):this.currentAnomaly!==-1&&this.anomalyTimer>2.5&&(this.anomalyTimer=0,this.logLines.push(`INFO  node_${this.currentAnomaly} resolved ✓`),this.drawLog(),this.currentAnomaly=-1,this.nodeMat.uniforms.uAnomalyNode.value=-1)}setVisible(e){this.nodeMat.uniforms.uVisible.value=e,this.edgeMat.uniforms.uVisible.value=e,this.floorMat.uniforms.uVisible.value=e,this.group.traverse(o=>{const n=o.material;(n==null?void 0:n.map)===this.logTexture&&(n.opacity=e)})}onHover(){}};l(re,"LOG_POOL",["INFO  processing log batch #4821","INFO  PII masking: email→[REDACTED]","WARN  anomaly score: 0.82 (thresh 0.75)","ERROR latency spike: 3.2s on node_07","INFO  filing GitHub PR #89 auto-patch","INFO  LLM class: INCIDENT_RESOLVED","INFO  alert: slack #oncall notified","INFO  MTTR: 16s — system healed","INFO  model confidence: 0.96","WARN  CPU spike 94% → gpu-04 offload"]);let Le=re;const N=new c(100,22,-10),Ro=`
attribute float aState;   // 0=normal, 1=infected, 2=defended
attribute float aPhase;
varying float vState;
varying float vPhase;
void main() {
  vState = aState;
  vPhase = aPhase;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = 22.0 + 10.0 * step(0.5, aState);
}
`,Fo=`
uniform float uTime;
uniform float uVisible;
varying float vState;
varying float vPhase;
void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;
  float ring  = 1.0 - smoothstep(0.33, 0.50, d);
  float core  = 1.0 - smoothstep(0.05, 0.18, d);
  float pulse = 0.6 + 0.4 * sin(uTime * 2.0 + vPhase);
  // normal=cyan, infected=red, defended=orange
  vec3 col = vState < 0.5 ? vec3(0.0, 0.9, 1.0)
           : vState < 1.5 ? vec3(1.0, 0.1, 0.15)
                           : vec3(1.0, 0.55, 0.0);
  float alpha = (ring * 0.5 + core * 1.8) * pulse * uVisible;
  gl_FragColor = vec4(col, alpha);
}
`,Lo=`
attribute float aLinePhase;
varying float vLinePhase;
void main() {
  vLinePhase = aLinePhase;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,Vo=`
uniform float uTime;
uniform float uVisible;
varying float vLinePhase;
void main() {
  float t     = fract(uTime * 0.5 + vLinePhase);
  float pulse = exp(-abs(t - 0.5) * 10.0);
  vec3 col    = mix(vec3(0.0, 0.5, 0.9), vec3(0.8, 1.0, 1.0), pulse);
  gl_FragColor = vec4(col, (0.12 + 0.88 * pulse) * uVisible);
}
`,No="varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",Uo=`
uniform float uTime;
uniform float uVisible;
uniform float uWave;      // 0→1 normalized wave radius
uniform vec2  uOrigin;    // uv origin of attack source (0.5,0.5 = center)
varying vec2 vUv;
void main() {
  float r    = length(vUv - uOrigin);
  float ring = abs(r - uWave * 0.55);
  float glow = exp(-ring * 28.0) * (1.0 - uWave * 0.8);
  // trailing ghost rings
  float ghost = exp(-abs(r - uWave * 0.4) * 18.0) * 0.25 * (1.0 - uWave);
  vec3 col = vec3(1.0, 0.08, 0.12) * (glow + ghost);
  gl_FragColor = vec4(col, (glow + ghost) * uVisible);
}
`,_o="varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",Go=`
uniform float uTime;
uniform float uLayer;
uniform float uVisible;
varying vec2 vUv;
void main() {
  float r         = length(vUv - 0.5);
  float ringR     = 0.44;
  float ring      = 1.0 - smoothstep(0.0, 0.035, abs(r - ringR));
  float t         = fract(uTime * 0.25 - uLayer * 0.1);
  float active    = smoothstep(0.0, 0.25, t) * (1.0 - smoothstep(0.55, 0.85, t));
  float scanAngle = atan(vUv.y - 0.5, vUv.x - 0.5);
  float scan      = 0.5 + 0.5 * sin(scanAngle * 6.0 - uTime * 2.0);
  vec3 col        = mix(vec3(0.9, 0.45, 0.0), vec3(0.0, 0.8, 1.0), uLayer / 3.0);
  col            *= ring * (0.4 + 0.6 * active * scan);
  gl_FragColor    = vec4(col, ring * active * 0.65 * uVisible);
}
`,Oo="varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",Do=`
uniform float uTime;
uniform float uVisible;
varying vec2 vUv;
void main() {
  vec2 g    = fract(vUv * 18.0);
  float line = step(0.94, g.x) + step(0.94, g.y);
  float dist = length(vUv - 0.5);
  float fade = 1.0 - smoothstep(0.2, 0.5, dist);
  float pulse = 0.6 + 0.4 * sin(uTime * 0.8 - dist * 6.0);
  vec3 col  = vec3(0.0, 0.55, 0.9) * line * fade * pulse;
  gl_FragColor = vec4(col, line * fade * 0.45 * uVisible);
}
`,xe=[[0,28],[16,18],[22,-6],[11,-22],[-11,-22],[-22,-6],[-16,18],[0,6],[8,-8],[-8,-8]];class zo extends ue{constructor(){super(...arguments);l(this,"nodeMat");l(this,"lineMat");l(this,"attackMat");l(this,"shieldMats",[]);l(this,"gridMat");l(this,"nodeStates");l(this,"nodeAttr");l(this,"attackTimer",3);l(this,"attackActive",!1);l(this,"attackWave",1);l(this,"infectedNode",-1)}create(e){e.add(this.group),this.gridMat=new M({vertexShader:Oo,fragmentShader:Do,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0,depthWrite:!1,side:H});const o=new x(new F(80,80),this.gridMat);o.rotation.x=-Math.PI/2,o.position.set(N.x,N.y-6,N.z),this.group.add(o);const n=xe.length,a=new Float32Array(n*3);this.nodeStates=new Float32Array(n);const r=new Float32Array(n);xe.forEach(([m,w],p)=>{a[p*3]=N.x+m,a[p*3+1]=N.y-2,a[p*3+2]=N.z+w,r[p]=Math.random()*Math.PI*2});const s=new ee;s.setAttribute("position",new k(a,3)),this.nodeAttr=new k(this.nodeStates,1),s.setAttribute("aState",this.nodeAttr),s.setAttribute("aPhase",new k(r,1)),this.nodeMat=new M({vertexShader:Ro,fragmentShader:Fo,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0,depthWrite:!1,blending:_}),this.group.add(new me(s,this.nodeMat));const u=[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,0],[7,0],[7,1],[7,6],[8,2],[8,3],[8,7],[9,4],[9,5],[9,7]],h=[],v=[];u.forEach(([m,w])=>{const p=m*3,S=w*3;h.push(a[p],a[p+1],a[p+2]),h.push(a[S],a[S+1],a[S+2]);const g=Math.random();v.push(g,g)});const d=new ee;d.setAttribute("position",new k(new Float32Array(h),3)),d.setAttribute("aLinePhase",new k(new Float32Array(v),1)),this.lineMat=new M({vertexShader:Lo,fragmentShader:Vo,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0,depthWrite:!1,blending:_}),this.group.add(new it(d,this.lineMat)),this.attackMat=new M({vertexShader:No,fragmentShader:Uo,uniforms:{uTime:{value:0},uVisible:{value:0},uWave:{value:1},uOrigin:{value:new ae(.5,.5)}},transparent:!0,depthWrite:!1,blending:_,side:H});const f=new x(new F(80,80),this.attackMat);f.rotation.x=-Math.PI/2,f.position.set(N.x,N.y-5.5,N.z),this.group.add(f);for(let m=0;m<4;m++){const w=(m+1)*9,p=new M({vertexShader:_o,fragmentShader:Go,uniforms:{uTime:{value:0},uVisible:{value:0},uLayer:{value:m}},transparent:!0,depthWrite:!1,blending:_,side:H}),S=new x(new F(w*2,w*2),p);S.rotation.x=-Math.PI/2,S.position.set(N.x,N.y-5+m*.3,N.z),this.group.add(S),this.shieldMats.push(p)}}update(e){if(this.nodeMat.uniforms.uTime.value=e,this.lineMat.uniforms.uTime.value=e,this.attackMat.uniforms.uTime.value=e,this.gridMat.uniforms.uTime.value=e,this.shieldMats.forEach(o=>o.uniforms.uTime.value=e),this.attackTimer-=1/60,!this.attackActive&&this.attackTimer<=0){this.infectedNode=Math.floor(Math.random()*7),this.nodeStates[this.infectedNode]=1,this.nodeAttr.needsUpdate=!0,this.attackWave=0,this.attackActive=!0;const[o,n]=xe[this.infectedNode];this.attackMat.uniforms.uOrigin.value.set(.5+o/60,.5+n/60)}this.attackActive&&(this.attackWave+=.003,this.attackMat.uniforms.uWave.value=this.attackWave,this.attackWave>.45&&this.infectedNode>=0&&this.nodeStates[this.infectedNode]===1&&(this.nodeStates[this.infectedNode]=2,this.nodeAttr.needsUpdate=!0),this.attackWave>=.9&&(this.infectedNode>=0&&(this.nodeStates[this.infectedNode]=0,this.nodeAttr.needsUpdate=!0,this.infectedNode=-1),this.attackActive=!1,this.attackTimer=5+Math.random()*3))}setVisible(e){this.nodeMat.uniforms.uVisible.value=e,this.lineMat.uniforms.uVisible.value=e,this.attackMat.uniforms.uVisible.value=e,this.gridMat.uniforms.uVisible.value=e,this.shieldMats.forEach(o=>o.uniforms.uVisible.value=e)}onHover(){}}const Wo=new Set([2,3]);class Bo{constructor(t,e){l(this,"envs",new Map);l(this,"activeEnv",null);l(this,"activeIdx",-1);l(this,"cityGroup");l(this,"cityVisible",!0);this.cityGroup=e;const o=[[2,new po],[3,new yo],[4,new Mo],[6,new Le],[7,new zo]];for(const[n,a]of o)a.create(t),a.group.visible=!1,this.envs.set(n,a)}onSection(t){if(t===this.activeIdx)return;this.activeIdx=t,this.activeEnv&&(this.activeEnv.exit(),this.activeEnv=null);const e=Wo.has(t);e&&this.cityVisible?(this.cityVisible=!1,this.cityGroup.visible=!1):!e&&!this.cityVisible&&(this.cityVisible=!0,this.cityGroup.visible=!0);const o=this.envs.get(t);o&&(this.activeEnv=o,o.enter())}update(t){this.activeEnv&&this.activeEnv.update(t)}}const Ho=document.getElementById("scene-canvas"),te=new Ct({canvas:Ho,antialias:!0,alpha:!1,powerPreference:"high-performance"});te.setPixelRatio(Math.min(devicePixelRatio,2));te.setSize(innerWidth,innerHeight);te.toneMapping=xt;te.toneMappingExposure=.95;const L=new Mt;L.background=new y(131602);L.fog=new Tt(197400,.003);const Z=new Pt(60,innerWidth/innerHeight,.5,1200),pe=new ro;pe.setup(te,L,Z);const Ve=new to;Ve.create(L);const $=new Jt;$.generate(L);$.addAntennas(L);const jo=at.map((i,t)=>{const e=U[t+2];return{text:i.district,pos:new c(e.pos.x+12,80,e.pos.z-18),color:i.neonColor}});$.addNeonSigns(L,jo);const st=new no;st.create(L);const Ne=new Qt;Ne.create(L);const rt=new eo;rt.create(L);const $o=new At(128,0,.4);L.add($o);const Ue=new ot;L.add(Ue);var Ze,Je;(Je=(Ze=$.cityGroup)==null?void 0:Ze.children)==null||Je.forEach(i=>Ue.add(i));const lt=new Bo(L,Ue),fe=new y(62975);function Xo(i){const t=Math.min(i,Ie.length-1);fe.copy(Ie[t]),Ne.setDistrictNeon(fe),Ve.update(0,Z.position,fe)}const _e=new co(Z);_e.onSectionChange=i=>{Yo(i),Ko(i),Xo(i),pe.triggerGlitch(),lt.onSection(i)};const qo=document.getElementById("nav-dots");U.forEach((i,t)=>{const e=document.createElement("div");e.className="nav-dot"+(t===0?" active":""),e.title=i.label,e.addEventListener("click",()=>_e.goTo(t)),qo.appendChild(e)});function Yo(i){document.querySelectorAll(".sect").forEach((t,e)=>{t.classList.toggle("active",e===i)}),document.querySelectorAll(".nav-dot").forEach((t,e)=>{t.classList.toggle("active",e===i)})}function Ko(i){const t=document.getElementById("hud-section");t&&(t.textContent=`DISTRICT_${String(i).padStart(2,"0")} / ${U[i].label}`)}at.forEach((i,t)=>{const e=document.getElementById(`proj-${t+2}`);e&&(e.style.setProperty("--neon",i.neonColor),e.style.borderColor=i.neonColor+"44",e.innerHTML=`
    <div class="proj-icon" style="color:${i.neonColor};text-shadow:0 0 14px ${i.neonColor}">${i.icon}</div>
    <div class="proj-content">
      <div class="proj-district">${i.district}</div>
      <div class="proj-title" style="text-shadow:0 0 20px ${i.neonColor}88">${i.title}</div>
      <div class="proj-subtitle">${i.subtitle}</div>
      <p class="proj-desc">${i.desc}</p>
      <div class="proj-tags">${i.tags.map(o=>`<span class="proj-tag" style="border-color:${i.neonColor}44;color:${i.neonColor}">${o}</span>`).join("")}</div>
      <a class="proj-link" href="${i.url}" target="_blank" style="color:${i.neonColor};border-color:${i.neonColor}">[ VIEW SOURCE → ]</a>
    </div>
  `)});const Xe=document.getElementById("skills-grid");Xe&&Object.entries(uo).forEach(([i,t])=>{const e=document.createElement("div");e.className="skill-cat",e.innerHTML=`<div class="skill-cat-name">// ${i}</div>`+t.map(o=>`<div class="skill-item">${o}</div>`).join(""),Xe.appendChild(e)});const B=document.getElementById("contact-input"),he=document.getElementById("contact-input-display");var Qe;(Qe=document.getElementById("sect-13"))==null||Qe.addEventListener("click",()=>B==null?void 0:B.focus());B==null||B.addEventListener("input",()=>{he&&(he.textContent=(B.value||"")+"_"),B.value.trim().toLowerCase()==="sudo"&&(Zo(),B.value="",he&&(he.textContent="_"))});function Zo(){const i=document.querySelector("#sect-13 .terminal-body");if(!i)return;const t=document.createElement("p");t.className="output neon-green",t.textContent="> Permission granted. Downloading your future...",i.appendChild(t),setTimeout(()=>{const e=document.createElement("p");e.className="output",e.innerHTML='<span style="color:#ffe642">root@neon-district:~# ██████████ 100%  COMPLETE</span>',i.appendChild(e)},1500)}const qe=["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];let oe=0;window.addEventListener("keydown",i=>{i.key===qe[oe]?oe++:oe=0,oe===qe.length&&(oe=0,Jo())});let Me=!1;function Jo(){Me=!Me,[$.meshA,$.meshB,$.meshC].forEach(i=>{const t=i.material;t.wireframe=Me})}const Te=document.getElementById("boot-log"),Ye=document.getElementById("boot-bar"),ie=document.getElementById("loading-screen"),Pe=["Initializing WebGPU context","Generating city geometry","Compiling 47 shader programs","Spawning rain particles","Calibrating post-processing chain","System ready"];async function Qo(){for(let i=0;i<Pe.length;i++){await new Promise(e=>setTimeout(e,260+Math.random()*200));const t=document.createElement("p");t.innerHTML=`<span style="color:rgba(0,245,255,.5)">[BOOT]</span> ${Pe[i]}... <span class="ok">[OK]</span>`,Te==null||Te.appendChild(t),Ye&&(Ye.style.width=(i+1)/Pe.length*100+"%")}await new Promise(i=>setTimeout(i,600)),ie==null||ie.classList.add("fade-out"),setTimeout(()=>{ie&&(ie.style.display="none")},850)}Qo();window.addEventListener("resize",()=>{Z.aspect=innerWidth/innerHeight,Z.updateProjectionMatrix(),te.setSize(innerWidth,innerHeight),pe.resize(innerWidth,innerHeight)});const Ke=new Et;function ct(){requestAnimationFrame(ct);const i=Ke.getElapsedTime(),t=Ke.getDelta();$.update(i),Ne.update(i),rt.update(i,Z.position),st.update(i),Ve.update(i,Z.position,fe),_e.update(t),lt.update(i),pe.render()}ct();
