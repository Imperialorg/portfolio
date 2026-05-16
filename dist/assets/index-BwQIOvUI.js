var mt=Object.defineProperty;var pt=(i,t,e)=>t in i?mt(i,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):i[t]=e;var l=(i,t,e)=>pt(i,typeof t!="symbol"?t+"":t,e);import{i as C,d as ce,I as B,q as ae,j as ue,t as ke,a4 as c,Q as Ie,v as $,C as Ne,z as F,m as z,u as S,Y as T,f as te,e as L,a as O,J as pe,Z as ot,B as gt,E as wt,a3 as se,a0 as yt,G as it,O as bt,V as xt,g as Ct,$ as St,L as nt,a7 as Mt,A as Tt,X as Pt,o as At,P as Et,H as kt,h as It}from"./three-D9zYRszm.js";import{b as Lt,R as Rt,a as Ft,B as ye,C as Vt,V as Nt,N as Ut,S as Gt,G as Ot,c as be,E as Dt}from"./postprocessing-DbO9Z5Qq.js";import{g as j}from"./gsap-SFc2wnMY.js";(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))o(n);new MutationObserver(n=>{for(const a of n)if(a.type==="childList")for(const s of a.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&o(s)}).observe(document,{childList:!0,subtree:!0});function e(n){const a={};return n.integrity&&(a.integrity=n.integrity),n.referrerPolicy&&(a.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?a.credentials="include":n.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function o(n){if(n.ep)return;n.ep=!0;const a=e(n);fetch(n.href,a)}})();function Be(i){return i*i*i*(i*(i*6-15)+10)}function xe(i,t,e){return i+e*(t-i)}function ve(i,t,e){const o=i&3,n=o<2?t:e,a=o<2?e:t;return(i&1?-n:n)+(i&2?-a:a)}const _=Array.from({length:512},(i,t)=>t).sort(()=>Math.random()-.5);for(let i=0;i<256;i++)_[i+256]=_[i];function _t(i,t){const e=Math.floor(i)&255,o=Math.floor(t)&255,n=i-Math.floor(i),a=t-Math.floor(t),s=Be(n),r=Be(a),u=_[_[e]+o],v=_[_[e]+o+1],m=_[_[e+1]+o],f=_[_[e+1]+o+1];return xe(xe(ve(u,n,a),ve(m,n-1,a),s),xe(ve(v,n,a-1),ve(f,n-1,a-1),s),r)}function He(i,t,e=4,o=2,n=.5){let a=0,s=.5,r=1;for(let u=0;u<e;u++)a+=_t(i*r,t*r)*s,r*=o,s*=n;return a}function R(i,t){return i+Math.random()*(t-i)}function je(i,t){return Math.floor(R(i,t+1))}const zt=`
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
`,Wt=`
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
`,Bt=`
varying vec2 vUv;
varying vec3 vWorldPos;
varying vec3 vNormal;
void main() {
  vUv = uv;
  vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,Ht=`
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
`,jt=`
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
`,$t=`
varying float vAlpha;
void main() {
  gl_FragColor = vec4(0.55, 0.75, 1.0, vAlpha * 0.35);
}
`,Xt=`
varying vec3 vLocalPos;
void main() {
  vLocalPos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,qt=`
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
`,Yt=`
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
`,Kt=`
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
`,N=32,J=16,Zt=6,re=J+Zt,fe=N/2*re,Ce={color:new C(197400),near:100,far:500},Le=[new C(62975),new C(62975),new C(16711850),new C(16711850),new C(16739098),new C(8073215),new C(8073215),new C(65416),new C(65416),new C(16770626)];function Jt(){return new T({vertexShader:zt,fragmentShader:Wt,uniforms:{uTime:{value:0},uFogColor:{value:Ce.color},uFogNear:{value:Ce.near},uFogFar:{value:Ce.far}}})}function Qt(i,t){const e=i/N,o=t/N;return e<.35&&o<.35?0:e<.65&&o<.35?1:e>=.65&&o<.35?2:e<.35&&o<.65?3:e>=.65&&o<.65?4:e<.35&&o>=.65?5:e<.65&&o>=.65?6:e>=.65&&o>=.65?7:o>.45&&o<.55?8:9}class eo{constructor(){l(this,"meshA");l(this,"meshB");l(this,"meshC");l(this,"mats",[])}generate(t){const e=N*N,o=Jt();this.mats.push(o);const n=new ce(1,1,1),a=new Float32Array(e),s=new Float32Array(e*3);n.setAttribute("aHeight",new B(a,1)),n.setAttribute("aNeonColor",new B(s,3)),this.meshA=new ae(n,o.clone(),e),this.meshA.frustumCulled=!1,this.mats.push(this.meshA.material);const r=new ue(.45,.55,1,10),u=new Float32Array(e),v=new Float32Array(e*3);r.setAttribute("aHeight",new B(u,1)),r.setAttribute("aNeonColor",new B(v,3)),this.meshB=new ae(r,o.clone(),e),this.meshB.frustumCulled=!1,this.mats.push(this.meshB.material);const m=new ce(1,.4,1),f=new Float32Array(e),d=new Float32Array(e*3);m.setAttribute("aHeight",new B(f,1)),m.setAttribute("aNeonColor",new B(d,3)),this.meshC=new ae(m,o.clone(),e),this.meshC.frustumCulled=!1,this.mats.push(this.meshC.material);const p=new ke,w=new c,g=new c,P=new Ie;let y=0,h=0,b=0;for(let M=0;M<N;M++)for(let E=0;E<N;E++){const V=M*re-fe,D=E*re-fe;if(M%5===0||E%5===0||M%2===0&&E%2===0&&Math.random()<.25)continue;const K=M/N*4-2,we=E/N*4-2,dt=He(K,we,5),vt=Math.sqrt(K*K+we*we)/3,ft=Math.max(.18,1-vt*.6),Z=Math.max(8,(22+dt*170)*ft)+R(4,28),_e=R(J*.42,J*.9),ze=R(J*.42,J*.9),ht=Qt(M,E),W=Le[ht],We=Math.random();if(We<.65)a[y]=Z,s[y*3]=W.r,s[y*3+1]=W.g,s[y*3+2]=W.b,w.set(V,Z/2,D),g.set(_e,Z,ze),p.compose(w,P,g),this.meshA.setMatrixAt(y,p),y++;else if(We<.82){const ee=R(J*.18,J*.32);u[h]=Z,v[h*3]=W.r,v[h*3+1]=W.g,v[h*3+2]=W.b,w.set(V+R(-3,3),Z/2,D+R(-3,3)),g.set(ee*2,Z,ee*2),p.compose(w,P,g),this.meshB.setMatrixAt(h,p),h++}else{const ee=Math.max(6,Z*.35);f[b]=ee,d[b*3]=W.r,d[b*3+1]=W.g,d[b*3+2]=W.b,w.set(V,ee/2,D),g.set(_e*1.4,ee,ze*1.4),p.compose(w,P,g),this.meshC.setMatrixAt(b,p),b++}}this.meshA.count=y,this.meshB.count=h,this.meshC.count=b;for(const M of[this.meshA,this.meshB,this.meshC]){M.instanceMatrix.needsUpdate=!0;const E=M.geometry;E.getAttribute("aHeight").needsUpdate=!0,E.getAttribute("aNeonColor").needsUpdate=!0,t.add(M)}}addAntennas(t){const e=new ue(.1,.1,1,4),o=new $({color:16716083}),n=new ae(e,o,400);n.frustumCulled=!1;const a=new ke,s=new c,r=new c,u=new Ie;let v=0;for(let m=0;m<400;m++){const f=je(0,N-1),d=je(0,N-1),p=f*re-fe,w=d*re-fe,g=f/N*4-2,P=d/N*4-2,y=Math.max(.18,1-Math.sqrt(g*g+P*P)/3*.6),h=Math.max(8,(22+He(g,P,5)*170)*y)+20,b=R(8,30);s.set(p+R(-3,3),h+b/2,w+R(-3,3)),r.set(1,b,1),a.compose(s,u,r),n.setMatrixAt(v++,a)}n.count=v,n.instanceMatrix.needsUpdate=!0,t.add(n)}addNeonSigns(t,e){e.forEach(({text:o,pos:n,color:a})=>{const s=document.createElement("canvas");s.width=256,s.height=64;const r=s.getContext("2d");r.clearRect(0,0,256,64),r.fillStyle=a+"22",r.fillRect(0,0,256,64),r.strokeStyle=a,r.lineWidth=2,r.strokeRect(2,2,252,60),r.fillStyle=a,r.font="bold 22px monospace",r.textAlign="center",r.fillText(o,128,40);const u=new Ne(s),v=new F(18,4.5),m=new $({map:u,transparent:!0,side:z,depthWrite:!1}),f=new S(v,m);f.position.copy(n),t.add(f)})}update(t){for(const e of this.mats)e.uniforms.uTime.value=t}}class to{constructor(){l(this,"mesh");l(this,"mat")}create(t){const e=new F(1200,1200,1,1);return this.mat=new T({vertexShader:Bt,fragmentShader:Ht,uniforms:{uTime:{value:0},uDistrictNeon:{value:new C(62975)},uRainIntensity:{value:1}}}),this.mesh=new S(e,this.mat),this.mesh.rotation.x=-Math.PI/2,this.mesh.position.y=0,t.add(this.mesh),this.mesh}update(t){this.mat.uniforms.uTime.value=t}setDistrictNeon(t){this.mat.uniforms.uDistrictNeon.value.copy(t)}setRainIntensity(t){this.mat.uniforms.uRainIntensity.value=t}}class oo{constructor(){l(this,"points");l(this,"count",8e3)}create(t){const e=new Float32Array(this.count*3),o=new Float32Array(this.count),n=new Float32Array(this.count);for(let r=0;r<this.count;r++)e[r*3]=R(-300,300),e[r*3+1]=R(-60,60),e[r*3+2]=R(-300,300),o[r]=R(.3,1),n[r]=Math.random();const a=new te;a.setAttribute("position",new L(e,3)),a.setAttribute("aSpeed",new L(o,1)),a.setAttribute("aOffset",new L(n,1));const s=new T({vertexShader:jt,fragmentShader:$t,uniforms:{uTime:{value:0}},transparent:!0,blending:O,depthWrite:!1});this.points=new pe(a,s),t.add(this.points)}update(t,e){const o=this.points.material;o.uniforms.uTime.value=t,e&&(this.points.position.x=e.x,this.points.position.z=e.z)}}class io{constructor(){l(this,"mesh");l(this,"mat")}create(t){const e=new ot(2e3,32,16);this.mat=new T({vertexShader:Xt,fragmentShader:qt,uniforms:{uTime:{value:0},uZenithColor:{value:new C(132104)},uHorizonColor:{value:new C(1706e3)},uDistrictNeon:{value:new C(62975)}},side:gt,depthWrite:!1}),this.mesh=new S(e,this.mat),this.mesh.renderOrder=-1,t.add(this.mesh)}update(t,e,o){this.mesh.position.copy(e),this.mat.uniforms.uTime.value=t,o&&this.mat.uniforms.uDistrictNeon.value.copy(o)}setDistrictColors(t,e){this.mat.uniforms.uHorizonColor.value.copy(t),this.mat.uniforms.uDistrictNeon.value.copy(e)}}function no(i){let t=i;return()=>{t|=0,t=t+1831565813|0;let e=Math.imul(t^t>>>15,1|t);return e=e+Math.imul(e^e>>>7,61|e)^e,((e^e>>>14)>>>0)/4294967296}}const $e=[new C(16720384),new C(61183),new C(22015),new C(16711884),new C(65382),new C(16737792),new C(11141375),new C(16770626)],Re=32,at=16,ao=6,Fe=at+ao,Xe=Re/2*Fe;class so{constructor(){l(this,"mesh");l(this,"mat")}create(t){const o=new F(5,1.4),n=new Float32Array(150*3),a=new Float32Array(150),s=new Float32Array(150);o.setAttribute("aColor",new B(n,3)),o.setAttribute("aFlickerSeed",new B(a,1)),o.setAttribute("aPulseMode",new B(s,1)),this.mat=new T({vertexShader:Yt,fragmentShader:Kt,uniforms:{uTime:{value:0}},transparent:!0,depthWrite:!1,side:z,blending:O}),this.mesh=new ae(o,this.mat,150),this.mesh.frustumCulled=!1;const r=no(42),u=new ke,v=new c,m=new Ie,f=new c(1,1,1);let d=0;for(let p=0;p<Re&&d<150;p++)for(let w=0;w<Re&&d<150;w++){if(p%5===0||w%5===0||r()>.1)continue;const g=p*Fe-Xe,P=w*Fe-Xe,y=6+r()*12,h=Math.floor(r()*4),b=at*.5+.3;let M=g,E=P,V=0;h===0?(E=P+b,V=0):h===1?(E=P-b,V=Math.PI):h===2?(M=g+b,V=Math.PI*.5):(M=g-b,V=-Math.PI*.5),v.set(M,y,E),m.setFromEuler(new wt(0,V,0)),u.compose(v,m,f),this.mesh.setMatrixAt(d,u);const D=$e[Math.floor(r()*$e.length)];n[d*3]=D.r,n[d*3+1]=D.g,n[d*3+2]=D.b,a[d]=r();const K=r();s[d]=K<.6?0:K<.85?1:K<.95?2:3,d++}this.mesh.count=d,this.mesh.instanceMatrix.needsUpdate=!0,o.getAttribute("aColor").needsUpdate=!0,o.getAttribute("aFlickerSeed").needsUpdate=!0,o.getAttribute("aPulseMode").needsUpdate=!0,t.add(this.mesh)}update(t){this.mat.uniforms.uTime.value=t}}const ro=`
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
`;class lo extends Dt{constructor(t=.45){super("LensStreakEffect",ro,{uniforms:new Map([["uIntensity",new yt(t)]])})}}class co{constructor(){l(this,"composer");l(this,"glitch");l(this,"glitchTimeout",0)}setup(t,e,o){this.composer=new Lt(t);const n=new Rt(e,o),a=new Ft({blendFunction:ye.ADD,luminanceThreshold:.25,luminanceSmoothing:.4,intensity:2.4,radius:.6}),s=new lo(.45),r=new Vt({offset:new se(.0018,.0012),radialModulation:!0,modulationOffset:.5}),u=new Nt({eskil:!1,offset:.35,darkness:.75}),v=new Ut({blendFunction:ye.OVERLAY,premultiply:!0});v.blendMode.opacity.value=.04;const m=new Gt({blendFunction:ye.OVERLAY,density:1.4});return m.blendMode.opacity.value=.07,this.glitch=new Ot({delay:new se(99999,99999),duration:new se(.15,.35),strength:new se(.15,.4),columns:.04,ratio:.85}),this.composer.addPass(n),this.composer.addPass(new be(o,a,s)),this.composer.addPass(new be(o,r,m,u,v)),this.composer.addPass(new be(o,this.glitch)),this.composer}triggerGlitch(){this.glitch.delay.set(0,.05),clearTimeout(this.glitchTimeout),this.glitchTimeout=window.setTimeout(()=>{this.glitch.delay.set(99999,99999)},600)}resize(t,e){this.composer.setSize(t,e)}render(){this.composer.render()}}const X=[{pos:new c(0,180,220),look:new c(0,0,0),label:"HERO"},{pos:new c(-40,12,110),look:new c(-20,20,60),label:"ABOUT"},{pos:new c(-80,-8,55),look:new c(-80,-8,20),label:"PS3 GPU"},{pos:new c(-75,30,-25),look:new c(-75,0,-25),label:"CPUonGPU"},{pos:new c(-30,10,-60),look:new c(0,20,-90),label:"GPU Stream"},{pos:new c(20,35,-80),look:new c(40,25,-110),label:"Selkies"},{pos:new c(80,55,-70),look:new c(100,35,-100),label:"Oris AI"},{pos:new c(110,40,0),look:new c(90,22,-20),label:"VajraGrid"},{pos:new c(100,20,70),look:new c(70,14,50),label:"VidyaMitra"},{pos:new c(50,16,100),look:new c(20,12,80),label:"Netflip"},{pos:new c(10,22,90),look:new c(-20,16,70),label:"Arena"},{pos:new c(-30,60,70),look:new c(-10,40,40),label:"Hackathon"},{pos:new c(-60,8,30),look:new c(-40,8,0),label:"SKILLS"},{pos:new c(0,120,160),look:new c(0,0,0),label:"CONTACT"}],Se=2.2,uo=2300;class vo{constructor(t){l(this,"camera");l(this,"currentSection",0);l(this,"mouseX",0);l(this,"mouseY",0);l(this,"liveLook",new c);l(this,"mouseLook",new c);l(this,"transitioning",!1);l(this,"transitionProgress",0);l(this,"onSectionChange");l(this,"_sectionFired",!1);this.camera=t,this.init()}init(){const t=X[0];this.camera.position.copy(t.pos),this.liveLook.copy(t.look),this.camera.lookAt(this.liveLook),window.addEventListener("mousemove",e=>{this.mouseX=(e.clientX/window.innerWidth-.5)*2,this.mouseY=(e.clientY/window.innerHeight-.5)*2}),this.setupScrollListener(),window.addEventListener("keydown",e=>{(e.key==="ArrowDown"||e.key==="ArrowRight")&&this.goTo(this.currentSection+1),(e.key==="ArrowUp"||e.key==="ArrowLeft")&&this.goTo(this.currentSection-1)})}setupScrollListener(){let t=0,e=!1;window.addEventListener("wheel",o=>{if(e)return;e=!0;const n=o.deltaY>0?1:-1;this.goTo(this.currentSection+n),setTimeout(()=>{e=!1},uo)},{passive:!0}),window.addEventListener("touchstart",o=>{t=o.touches[0].clientY}),window.addEventListener("touchend",o=>{const n=t-o.changedTouches[0].clientY;Math.abs(n)>40&&this.goTo(this.currentSection+(n>0?1:-1))})}goTo(t){if(t=Math.max(0,Math.min(X.length-1,t)),t===this.currentSection)return;this.currentSection=t;const e=X[t];this.transitioning=!0,this.transitionProgress=0,j.killTweensOf(this.camera.position),j.killTweensOf(this.liveLook);const o={t:0};j.to(this.camera.position,{x:e.pos.x,y:e.pos.y,z:e.pos.z,duration:Se,ease:"power3.inOut"}),j.to(this.liveLook,{x:e.look.x,y:e.look.y,z:e.look.z,duration:Se,ease:"power3.inOut"}),j.to(o,{t:1,duration:Se,ease:"none",onUpdate:()=>{var n;this.transitionProgress=o.t,o.t>=.65&&!this._sectionFired&&(this._sectionFired=!0,(n=this.onSectionChange)==null||n.call(this,t),this._updateUI(t))},onComplete:()=>{this.transitioning=!1,this._sectionFired=!1}}),this._updateUI(t)}_updateUI(t){document.querySelectorAll(".nav-dot").forEach((n,a)=>n.classList.toggle("active",a===t));const e=t/(X.length-1)*100,o=document.getElementById("progress-bar");o&&(o.style.height=e+"%")}update(t){X[this.currentSection];const e=this.transitioning?0:1;this.mouseLook.set(this.liveLook.x+this.mouseX*6*e,this.liveLook.y-this.mouseY*4*e,this.liveLook.z),this.camera.lookAt(this.mouseLook)}getCurrentSection(){return this.currentSection}}const st=[{id:"ps3-gpu",title:"PS3 Cell GPU Emulator",subtitle:"Systems / Emulation",desc:"Full emulation of the Cell Broadband Engine's SPU pipeline in WebGL. 6 SPU cores, PPE scheduler, DMA bus — running real PS3 shaders in the browser at 200 GIPS.",tags:["C++","WebGL","GLSL","Cell BE","Emulation"],url:"https://github.com/aerosane",neonColor:"#00f5ff",district:"GPU DISTRICT",icon:"⬡"},{id:"cpuongpu",title:"CPUonGPU",subtitle:"Architecture Research",desc:"Runs a full x86 CPU simulation entirely on GPU compute shaders. Register file, ALU, cache hierarchy — all in GLSL. JIT-compiled x86 → SPIR-V at runtime.",tags:["GLSL","Compute Shaders","x86","JIT","SPIR-V"],url:"https://github.com/aerosane",neonColor:"#00f5ff",district:"GPU DISTRICT",icon:"⬢"},{id:"gpu-streaming",title:"GPU Streaming Pipeline",subtitle:"NvFBC + NVENC",desc:"Sub-frame-latency game streaming via NvFBC capture → NVENC H265/AV1 encode → WebRTC TURN relay. <1 frame E2E latency. Deployed on GitHub Codespace GPU.",tags:["NVENC","NvFBC","WebRTC","Rust","H265"],url:"https://github.com/Imperialorg/codespace",neonColor:"#00f5ff",district:"GPU DISTRICT",icon:"▶"},{id:"selkies-rust",title:"Selkies-Rust",subtitle:"Python→Rust Port",desc:"Complete rewrite of the Selkies WebRTC game streaming stack from Python into Rust. 6 crates: pipeline, signaling, input, encoding, metrics, CLI.",tags:["Rust","WebRTC","GStreamer","Tokio","GSAP"],url:"https://github.com/Imperialorg/codespace",neonColor:"#ff6b1a",district:"SYSTEMS CORRIDOR",icon:"⚙"},{id:"oris-ai",title:"Oris — AI SRE",subtitle:"🏆 Runner-up · TechSynapse 2026",desc:"Autonomous Site Reliability Engineer: ingests production logs, PII-masks with Presidio, infers root cause via Gemini 2.0, opens GitHub PRs with fixes. Zero human touch.",tags:["Python","Gemini 2.0","Presidio","LangChain","FastAPI"],url:"https://github.com/aerosane",neonColor:"#ff00aa",district:"AI DISTRICT",icon:"◈"},{id:"vajragrid",title:"VajraGrid",subtitle:"🇮🇳 India Innovates 2026 · Bharat Mandapam",desc:"AI-hardened power grid security: detects SCADA cyberattacks in 16s, 4-layer ML defense stack, adversarial training. Exhibited nationally at Bharat Mandapam.",tags:["Python","PyTorch","SCADA","Adversarial ML","GridSec"],url:"https://github.com/aerosane",neonColor:"#ff00aa",district:"AI DISTRICT",icon:"⚡"},{id:"vidyamitra",title:"VidyaMitra",subtitle:"IISER JEE Prep",desc:"AI tutor for JEE aspirants: adaptive quiz engine, LaTeX equation rendering, spaced repetition. Covers Physics, Chemistry, Math with difficulty auto-calibration.",tags:["TypeScript","React","LaTeX","OpenAI","Supabase"],url:"https://github.com/aerosane",neonColor:"#00ff88",district:"EDTECH ZONE",icon:"⬟"},{id:"netflip",title:"Netflip VOD",subtitle:"Full-Stack Streaming",desc:"Netflix-clone with HLS adaptive streaming, Azure Blob CDN, Fastly edge cache, WebSocket live chat, OAuth2, recommendation engine. 1080p adaptive bitrate.",tags:["Next.js","HLS","Azure","Fastly","PostgreSQL"],url:"https://github.com/aerosane",neonColor:"#7b2fff",district:"WEB DISTRICT",icon:"▨"},{id:"coding-arena",title:"Coding Arena",subtitle:"Competitive Judging Platform",desc:"Online judge with isolated Docker execution, multi-language support, real-time leaderboard, plagiarism detection via AST similarity. 200ms median judge latency.",tags:["Go","Docker","Redis","React","WebSocket"],url:"https://github.com/aerosane",neonColor:"#7b2fff",district:"WEB DISTRICT",icon:"{ }"},{id:"hackathon",title:"Hackathon Wins",subtitle:"Hall of Fame",desc:"🏆 Runner-up at TechSynapse 2026 (Oris AI SRE). 🇮🇳 National exhibition at India Innovates 2026, Bharat Mandapam, New Delhi (VajraGrid). 1st year, two nationals.",tags:["Oris AI","VajraGrid","TechSynapse","India Innovates"],url:"https://github.com/aerosane",neonColor:"#ffe642",district:"HALL OF FAME",icon:"🏆"}],fo={Languages:["C++","Rust","Python","TypeScript","Go","GLSL/HLSL"],Systems:["WebRTC","WebGL/WebGPU","NVENC/NvFBC","Docker","Linux"],"AI/ML":["PyTorch","Gemini API","LangChain","Presidio","HuggingFace"],Web:["React","Next.js","Vite","Node.js","PostgreSQL","Redis"],Tools:["Git","GitHub Actions","Azure","GStreamer","Tokio"]};class de{constructor(){l(this,"group",new it);l(this,"hoverTargets",[]);l(this,"visible",!1);l(this,"visibleValue",0)}enter(){this.group.visible=!0,this.visible=!0,j.killTweensOf(this),j.to(this,{visibleValue:1,duration:1.4,ease:"power2.out",onUpdate:()=>this.setVisible(this.visibleValue)})}exit(){this.visible=!1,j.killTweensOf(this),j.to(this,{visibleValue:0,duration:.8,ease:"power2.in",onUpdate:()=>this.setVisible(this.visibleValue),onComplete:()=>{this.group.visible=!1}})}setVisible(t){}dispose(){this.group.traverse(t=>{t.geometry&&t.geometry.dispose()})}}function ho(i,t,e="#00f5ff"){const a=document.createElement("canvas");a.width=512,a.height=80;const s=a.getContext("2d");s.clearRect(0,0,512,80);const r=s.createRadialGradient(512/2,80/2,4,512/2,80/2,512/2);return r.addColorStop(0,e+"22"),r.addColorStop(1,"transparent"),s.fillStyle=r,s.fillRect(0,0,512,80),s.fillStyle=e,s.font="bold 22px monospace",s.textAlign="center",s.shadowColor=e,s.shadowBlur=12,s.fillText(i,512/2,32),s.fillStyle="rgba(200,230,255,0.6)",s.font="13px monospace",s.shadowBlur=6,s.fillText(t,512/2,54),new Ne(a)}function q(i,t,e="#00f5ff"){const o=ho(i,t,e),n=new $({map:o,transparent:!0,depthWrite:!1,side:z});return new S(new F(5,1.5),n)}const k=new c(-80,-8,38),mo=`
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
`,po=`
attribute float aPhase;
varying float vPhase;
varying vec3 vPos;
void main() {
  vPhase = aPhase;
  vPos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = 4.0;
}
`,go=`
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
`,wo=`
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
`;class yo extends de{constructor(){super(...arguments);l(this,"mats",[]);l(this,"particleMat")}create(e){e.add(this.group);const o=new F(60,50),n=new T({vertexShader:"varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",fragmentShader:wo,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0}),a=new S(o,n);a.rotation.x=-Math.PI/2,a.position.set(k.x,k.y-6,k.z),this.group.add(a),this.mats.push(n);const s=new ce(3,20,5),r=new T({vertexShader:"varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",fragmentShader:mo,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0});this.mats.push(r);const u=[[-18,-9,10],[-12,-9,10],[-6,-9,10],[0,-9,10],[-18,-9,-10],[-12,-9,-10],[-6,-9,-10],[0,-9,-10]];for(const[d,p,w]of u){const g=new S(s,r);g.position.set(k.x+d,k.y+p+10,k.z+w),this.group.add(g)}const v=new F(40,.4),m=new $({color:65450,transparent:!0});for(let d=0;d<3;d++){const p=new S(v,m.clone());p.rotation.x=Math.PI/2,p.position.set(k.x-9,k.y+5,k.z-8+d*8),this.group.add(p)}this.buildCellHologram(),this.buildParticles();const f=q("PS3 CELL BE","GPU Emulator — 6 SPU × 256KB","#00f5ff");f.position.set(k.x+18,k.y+2,k.z),f.scale.setScalar(4),this.group.add(f)}buildCellHologram(){const e=new c(k.x+14,k.y+2,k.z),o=new $({color:62975,wireframe:!0,transparent:!0}),n=new S(new bt(1.5,1),o);n.position.copy(e),this.group.add(n);const a=new $({color:3800852,wireframe:!0,transparent:!0});for(let s=0;s<6;s++){const r=s/6*Math.PI*2,u=new S(new ue(.8,.8,.4,6),a.clone());u.position.set(e.x+Math.cos(r)*4,e.y,e.z+Math.sin(r)*4),this.group.add(u)}}buildParticles(){const o=new Float32Array(600),n=new Float32Array(200),a=new c(k.x+14,k.y+2,k.z);for(let u=0;u<200;u++){const m=u%6/6*Math.PI*2,f=Math.random();o[u*3]=a.x+Math.cos(m)*4*f,o[u*3+1]=a.y+(Math.random()-.5)*.5,o[u*3+2]=a.z+Math.sin(m)*4*f,n[u]=Math.random()}const s=new te;s.setAttribute("position",new L(o,3)),s.setAttribute("aPhase",new L(n,1)),this.particleMat=new T({vertexShader:po,fragmentShader:go,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0,depthWrite:!1,blending:O});const r=new pe(s,this.particleMat);this.group.add(r)}update(e){var o;for(const n of this.mats)(o=n.uniforms)!=null&&o.uTime&&(n.uniforms.uTime.value=e);this.particleMat&&(this.particleMat.uniforms.uTime.value=e)}setVisible(e){for(const o of this.mats)o.uniforms.uVisible.value=e;this.particleMat&&(this.particleMat.uniforms.uVisible.value=e),this.group.traverse(o=>{const n=o;if(!n.isMesh)return;const a=n.material;a&&a.color&&!a.uniforms&&(a.opacity=e)})}onHover(){}}const A=new c(-75,0,-25),bo=`
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
`,xo=`
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
`;class Co extends de{constructor(){super(...arguments);l(this,"mats",[])}create(e){e.add(this.group);const o=new F(50,50),n=new T({vertexShader:"varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",fragmentShader:bo,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0}),a=new S(o,n);a.rotation.x=-Math.PI/2,a.position.copy(A),this.group.add(a),this.mats.push(n);const s=new T({vertexShader:"varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",fragmentShader:qe,uniforms:{uTime:{value:0},uVisible:{value:0},uColor:{value:new C(43263)}},transparent:!0}),r=new S(new ce(10,.6,10),s);r.position.set(A.x+3,A.y+.3,A.z),this.group.add(r),this.mats.push(s);const u=new T({vertexShader:"varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",fragmentShader:qe,uniforms:{uTime:{value:0},uVisible:{value:0},uColor:{value:new C(3800852)}},transparent:!0}),v=new S(new ce(6,.8,6),u);v.position.set(A.x-10,A.y+.4,A.z-6),this.group.add(v),this.mats.push(u);const m=new T({vertexShader:"varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",fragmentShader:xo,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0,depthWrite:!1,side:z}),f=new S(new F(12,3),m);f.position.set(A.x+3,A.y+8,A.z),f.rotation.x=-.3,this.group.add(f),this.mats.push(m);const d=q("GPU DIE","CUDA Cores / SM Array","#00a8ff");d.position.set(A.x+3,A.y+3,A.z+8),d.rotation.x=-Math.PI/2+.3,d.scale.setScalar(3),this.group.add(d);const p=q("CPU DIE","x86 Emulated on GPU","#39ff14");p.position.set(A.x-10,A.y+3,A.z-2),p.rotation.x=-Math.PI/2+.3,p.scale.setScalar(3),this.group.add(p);const w=q("IF  →  ID  →  EX  →  MEM  →  WB","Instruction Pipeline","#ffffff");w.position.set(A.x+3,A.y+12,A.z),w.scale.setScalar(4),this.group.add(w)}update(e){for(const o of this.mats)o.uniforms.uTime.value=e}setVisible(e){for(const o of this.mats)o.uniforms.uVisible.value=e}onHover(){}}const x=new c(-10,10,-80),So=`
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
`,Mo=`
uniform float uTime;
uniform float uScale;
void main() {
  vec3 pos = position * (1.0 + uScale * 0.3 + sin(uTime) * 0.05 * uScale);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`,To=`
uniform float uTime;
uniform float uScale;
uniform float uVisible;
void main() {
  float fade = 1.0 - uScale * 0.28;
  float pulse = 0.5 + 0.5 * sin(uTime * 2.0 - uScale * 2.0);
  vec3 col = vec3(1.0, 0.1, 0.6) * (fade + 0.3 * pulse);
  gl_FragColor = vec4(col, fade * 0.7 * uVisible);
}
`,Po=`
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
`;function Me(i,t,e,o){const n=new $({color:8947848}),a=new S(new ue(.2,.3,20,8),n);a.position.set(t,e+10,o),i.add(a);for(let r=0;r<4;r++){const u=new S(new ue(.08,.08,4-r*.6,6),n);u.rotation.z=Math.PI/2,u.position.set(t,e+4+r*4,o),i.add(u)}const s=new S(new ot(.3,8,8),new $({color:16720384}));s.position.set(t,e+21,o),i.add(s)}class Ao extends de{constructor(){super(...arguments);l(this,"mats",[]);l(this,"rings",[])}create(e){e.add(this.group),Me(this.group,x.x-20,x.y-4,x.z),Me(this.group,x.x+15,x.y-4,x.z-10),Me(this.group,x.x+5,x.y-4,x.z+20);for(let v=0;v<4;v++){const m=new xt(4+v*5,4.3+v*5,48),f=new T({vertexShader:Mo,fragmentShader:To,uniforms:{uTime:{value:0},uScale:{value:v},uVisible:{value:0}},transparent:!0,depthWrite:!1,side:z,blending:O}),d=new S(m,f);d.rotation.x=-Math.PI/2,d.position.set(x.x-20,x.y+6,x.z),this.group.add(d),this.rings.push({mesh:d,mat:f,delay:v*.4}),this.mats.push(f)}const o=new Ct([new c(x.x-20,x.y+8,x.z),new c(x.x-5,x.y+12,x.z-5),new c(x.x+18,x.y+6,x.z+5)]),n=new St(o,60,.15,6,!1),a=new T({vertexShader:"varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",fragmentShader:So,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0,depthWrite:!1,blending:O});this.group.add(new S(n,a)),this.mats.push(a);const s=new T({vertexShader:"varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",fragmentShader:Po,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0}),r=new S(new F(20,10),s);r.position.set(x.x+18,x.y+8,x.z+5),r.rotation.y=-.6,this.group.add(r),this.mats.push(s);const u=q("GPU STREAMING","NvFBC → NVENC → WebRTC → Browser","#ff006e");u.position.set(x.x,x.y+18,x.z),u.scale.setScalar(4.5),this.group.add(u)}update(e){for(const o of this.mats)o.uniforms.uTime.value=e}setVisible(e){for(const o of this.mats)o.uniforms.uVisible.value=e}onHover(){}}const G=new c(95,40,-90),Eo=`
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
  gl_PointSize = 7.0 + 5.0 * vActivation + 4.0 * vIsAnomaly;
}
`,ko=`
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
`,Io=`
attribute float aEdgePhase;
varying float vEdgePhase;
varying float vT;        // 0=start vertex, 1=end vertex (from position along segment)
void main() {
  vEdgePhase = aEdgePhase;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,Lo=`
uniform float uTime;
uniform float uVisible;
varying float vEdgePhase;
void main() {
  float t   = fract(uTime * 0.7 + vEdgePhase);
  float pulse = exp(-abs(t - 0.5) * 9.0);
  vec3 col  = mix(vec3(0.25, 0.0, 0.6), vec3(1.0, 0.5, 1.0), pulse);
  float alpha = (0.10 + 0.90 * pulse) * uVisible;
  gl_FragColor = vec4(col, alpha);
}
`,Ro="varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",Fo=`
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
`,le=class le extends de{constructor(){super(...arguments);l(this,"nodeMat");l(this,"edgeMat");l(this,"floorMat");l(this,"logTexture");l(this,"logCanvas");l(this,"logCtx");l(this,"logLines",[]);l(this,"logTimer",0);l(this,"anomalyTimer",0);l(this,"currentAnomaly",-1)}create(e){e.add(this.group);const o=new T({vertexShader:Ro,fragmentShader:Fo,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0,depthWrite:!1,side:z}),n=new S(new F(60,60),o);n.rotation.x=-Math.PI/2,n.position.set(G.x,G.y-18,G.z),this.group.add(n),this.floorMat=o;const a=5,s=8,r=[],u=new Float32Array(a*s),v=new Float32Array(a*s);for(let h=0;h<a;h++)for(let b=0;b<s;b++){const M=h*s+b;r.push(new c(G.x+(h-2)*5.5,G.y+(b-s/2+.5)*3.8,G.z)),u[M]=M,v[M]=Math.random()}const m=new Float32Array(r.flatMap(h=>[h.x,h.y,h.z])),f=new te;f.setAttribute("position",new L(m,3)),f.setAttribute("aNodeId",new L(u,1)),f.setAttribute("aActivation",new L(v,1)),this.nodeMat=new T({vertexShader:Eo,fragmentShader:ko,uniforms:{uTime:{value:0},uVisible:{value:0},uAnomalyNode:{value:-1}},transparent:!0,depthWrite:!1,blending:O}),this.group.add(new pe(f,this.nodeMat));const d=[],p=[];for(let h=0;h<a-1;h++)for(let b=0;b<s;b++)for(let M=0;M<s;M++){if(Math.random()>.3)continue;const E=r[h*s+b],V=r[(h+1)*s+M];d.push(E.x,E.y,E.z,V.x,V.y,V.z);const D=Math.random();p.push(D,D)}const w=new te;w.setAttribute("position",new L(new Float32Array(d),3)),w.setAttribute("aEdgePhase",new L(new Float32Array(p),1)),this.edgeMat=new T({vertexShader:Io,fragmentShader:Lo,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0,depthWrite:!1,blending:O}),this.group.add(new nt(w,this.edgeMat)),this.logCanvas=document.createElement("canvas"),this.logCanvas.width=512,this.logCanvas.height=320,this.logCtx=this.logCanvas.getContext("2d"),this.logTexture=new Ne(this.logCanvas),this.drawLog();const g=new $({map:this.logTexture,transparent:!0,depthWrite:!1,side:z}),P=new S(new F(16,10),g);P.position.set(G.x+16,G.y-2,G.z+4),P.rotation.y=-.5,this.group.add(P);const y=q("ORIS","AI Site Reliability Engineer","#b000ff");y.position.set(G.x,G.y+20,G.z),y.scale.setScalar(4),this.group.add(y)}drawLog(){const e=this.logCtx,o=512,n=320;e.clearRect(0,0,o,n),e.fillStyle="rgba(4, 0, 18, 0.92)",e.fillRect(0,0,o,n);for(let s=0;s<n;s+=3)e.fillStyle="rgba(0,0,0,0.18)",e.fillRect(0,s,o,1);e.font="12px monospace";const a=this.logLines.slice(-20);for(let s=0;s<a.length;s++){const r=a[s];e.fillStyle=r.startsWith("ERROR")?"#ff4455":r.startsWith("WARN")?"#ffaa22":"#22ee88",e.shadowColor=e.fillStyle,e.shadowBlur=4,e.fillText(r,10,18+s*15)}e.fillStyle="#b000ff",e.shadowColor="#b000ff",e.shadowBlur=8,e.fillText("▋",10,18+a.length*15),this.logTexture.needsUpdate=!0}update(e){this.nodeMat.uniforms.uTime.value=e,this.edgeMat.uniforms.uTime.value=e,this.floorMat.uniforms.uTime.value=e,this.logTimer+=1/60,this.logTimer>.75&&(this.logTimer=0,this.logLines.push(le.LOG_POOL[Math.floor(Math.random()*le.LOG_POOL.length)]),this.drawLog()),this.anomalyTimer+=1/60,this.currentAnomaly===-1&&this.anomalyTimer>5?(this.anomalyTimer=0,this.currentAnomaly=Math.floor(Math.random()*40),this.nodeMat.uniforms.uAnomalyNode.value=this.currentAnomaly,this.logLines.push(`ERROR anomaly on node_${this.currentAnomaly}`),this.drawLog()):this.currentAnomaly!==-1&&this.anomalyTimer>2.5&&(this.anomalyTimer=0,this.logLines.push(`INFO  node_${this.currentAnomaly} resolved ✓`),this.drawLog(),this.currentAnomaly=-1,this.nodeMat.uniforms.uAnomalyNode.value=-1)}setVisible(e){this.nodeMat.uniforms.uVisible.value=e,this.edgeMat.uniforms.uVisible.value=e,this.floorMat.uniforms.uVisible.value=e,this.group.traverse(o=>{const n=o.material;(n==null?void 0:n.map)===this.logTexture&&(n.opacity=e)})}onHover(){}};l(le,"LOG_POOL",["INFO  processing log batch #4821","INFO  PII masking: email→[REDACTED]","WARN  anomaly score: 0.82 (thresh 0.75)","ERROR latency spike: 3.2s on node_07","INFO  filing GitHub PR #89 auto-patch","INFO  LLM class: INCIDENT_RESOLVED","INFO  alert: slack #oncall notified","INFO  MTTR: 16s — system healed","INFO  model confidence: 0.96","WARN  CPU spike 94% → gpu-04 offload"]);let Ve=le;const I=new c(100,22,-10),Vo=`
attribute float aState;   // 0=normal, 1=infected, 2=defended
attribute float aPhase;
varying float vState;
varying float vPhase;
void main() {
  vState = aState;
  vPhase = aPhase;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = 14.0 + 6.0 * step(0.5, aState);
}
`,No=`
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
  float alpha = (ring * 0.35 + core * 1.2) * pulse * uVisible;
  gl_FragColor = vec4(col, alpha);
}
`,Uo=`
attribute float aLinePhase;
varying float vLinePhase;
void main() {
  vLinePhase = aLinePhase;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,Go=`
uniform float uTime;
uniform float uVisible;
varying float vLinePhase;
void main() {
  float t     = fract(uTime * 0.5 + vLinePhase);
  float pulse = exp(-abs(t - 0.5) * 10.0);
  vec3 col    = mix(vec3(0.0, 0.5, 0.9), vec3(0.8, 1.0, 1.0), pulse);
  gl_FragColor = vec4(col, (0.12 + 0.88 * pulse) * uVisible);
}
`,Oo="varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",Do=`
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
`,_o="varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",zo=`
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
`,Wo="varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",Bo=`
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
`,Te=[[0,20],[12,12],[16,-4],[8,-16],[-8,-16],[-16,-4],[-12,12],[0,4],[6,-6],[-6,-6]];class Ho extends de{constructor(){super(...arguments);l(this,"nodeMat");l(this,"lineMat");l(this,"attackMat");l(this,"shieldMats",[]);l(this,"gridMat");l(this,"nodeStates");l(this,"nodeAttr");l(this,"attackTimer",3);l(this,"attackActive",!1);l(this,"attackWave",1);l(this,"infectedNode",-1)}create(e){e.add(this.group),this.gridMat=new T({vertexShader:Wo,fragmentShader:Bo,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0,depthWrite:!1,side:z});const o=new S(new F(60,60),this.gridMat);o.rotation.x=-Math.PI/2,o.position.set(I.x,I.y-6,I.z),this.group.add(o);const n=Te.length,a=new Float32Array(n*3);this.nodeStates=new Float32Array(n);const s=new Float32Array(n);Te.forEach(([g,P],y)=>{a[y*3]=I.x+g,a[y*3+1]=I.y-2,a[y*3+2]=I.z+P,s[y]=Math.random()*Math.PI*2});const r=new te;r.setAttribute("position",new L(a,3)),this.nodeAttr=new L(this.nodeStates,1),r.setAttribute("aState",this.nodeAttr),r.setAttribute("aPhase",new L(s,1)),this.nodeMat=new T({vertexShader:Vo,fragmentShader:No,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0,depthWrite:!1,blending:O}),this.group.add(new pe(r,this.nodeMat));const u=[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,0],[7,0],[7,1],[7,6],[8,2],[8,3],[8,7],[9,4],[9,5],[9,7]],v=[],m=[];u.forEach(([g,P])=>{const y=g*3,h=P*3;v.push(a[y],a[y+1],a[y+2]),v.push(a[h],a[h+1],a[h+2]);const b=Math.random();m.push(b,b)});const f=new te;f.setAttribute("position",new L(new Float32Array(v),3)),f.setAttribute("aLinePhase",new L(new Float32Array(m),1)),this.lineMat=new T({vertexShader:Uo,fragmentShader:Go,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0,depthWrite:!1,blending:O}),this.group.add(new nt(f,this.lineMat)),this.attackMat=new T({vertexShader:Oo,fragmentShader:Do,uniforms:{uTime:{value:0},uVisible:{value:0},uWave:{value:1},uOrigin:{value:new se(.5,.5)}},transparent:!0,depthWrite:!1,blending:O,side:z});const d=new S(new F(60,60),this.attackMat);d.rotation.x=-Math.PI/2,d.position.set(I.x,I.y-5.5,I.z),this.group.add(d);for(let g=0;g<4;g++){const P=(g+1)*9,y=new T({vertexShader:_o,fragmentShader:zo,uniforms:{uTime:{value:0},uVisible:{value:0},uLayer:{value:g}},transparent:!0,depthWrite:!1,blending:O,side:z}),h=new S(new F(P*2,P*2),y);h.rotation.x=-Math.PI/2,h.position.set(I.x,I.y-5+g*.3,I.z),this.group.add(h),this.shieldMats.push(y)}const p=q("VAJRAGRID","Power Grid Cyberdefence — 4-Layer IDS","#ff6b00");p.position.set(I.x,I.y+22,I.z),p.scale.setScalar(4.5),this.group.add(p);const w=q("RECOVERY 16s","India Innovates 2026","#ffcc00");w.position.set(I.x+18,I.y+10,I.z),w.scale.setScalar(3),this.group.add(w)}update(e){if(this.nodeMat.uniforms.uTime.value=e,this.lineMat.uniforms.uTime.value=e,this.attackMat.uniforms.uTime.value=e,this.gridMat.uniforms.uTime.value=e,this.shieldMats.forEach(o=>o.uniforms.uTime.value=e),this.attackTimer-=1/60,!this.attackActive&&this.attackTimer<=0){this.infectedNode=Math.floor(Math.random()*7),this.nodeStates[this.infectedNode]=1,this.nodeAttr.needsUpdate=!0,this.attackWave=0,this.attackActive=!0;const[o,n]=Te[this.infectedNode];this.attackMat.uniforms.uOrigin.value.set(.5+o/60,.5+n/60)}this.attackActive&&(this.attackWave+=.003,this.attackMat.uniforms.uWave.value=this.attackWave,this.attackWave>.45&&this.infectedNode>=0&&this.nodeStates[this.infectedNode]===1&&(this.nodeStates[this.infectedNode]=2,this.nodeAttr.needsUpdate=!0),this.attackWave>=.9&&(this.infectedNode>=0&&(this.nodeStates[this.infectedNode]=0,this.nodeAttr.needsUpdate=!0,this.infectedNode=-1),this.attackActive=!1,this.attackTimer=5+Math.random()*3))}setVisible(e){this.nodeMat.uniforms.uVisible.value=e,this.lineMat.uniforms.uVisible.value=e,this.attackMat.uniforms.uVisible.value=e,this.gridMat.uniforms.uVisible.value=e,this.shieldMats.forEach(o=>o.uniforms.uVisible.value=e)}onHover(){}}const jo=new Set([2,3]);class $o{constructor(t,e){l(this,"envs",new Map);l(this,"activeEnv",null);l(this,"activeIdx",-1);l(this,"cityGroup");l(this,"cityVisible",!0);this.cityGroup=e;const o=[[2,new yo],[3,new Co],[4,new Ao],[6,new Ve],[7,new Ho]];for(const[n,a]of o)a.create(t),a.group.visible=!1,this.envs.set(n,a)}onSection(t){if(t===this.activeIdx)return;this.activeIdx=t,this.activeEnv&&(this.activeEnv.exit(),this.activeEnv=null);const e=jo.has(t);e&&this.cityVisible?(this.cityVisible=!1,this.cityGroup.visible=!1):!e&&!this.cityVisible&&(this.cityVisible=!0,this.cityGroup.visible=!0);const o=this.envs.get(t);o&&(this.activeEnv=o,o.enter())}update(t){this.activeEnv&&this.activeEnv.update(t)}}const Xo=document.getElementById("scene-canvas"),oe=new Mt({canvas:Xo,antialias:!0,alpha:!1,powerPreference:"high-performance"});oe.setPixelRatio(Math.min(devicePixelRatio,2));oe.setSize(innerWidth,innerHeight);oe.toneMapping=Tt;oe.toneMappingExposure=.95;const U=new Pt;U.background=new C(131602);U.fog=new At(197400,.003);const Q=new Et(60,innerWidth/innerHeight,.5,1200),ge=new co;ge.setup(oe,U,Q);const Ue=new io;Ue.create(U);const Y=new eo;Y.generate(U);Y.addAntennas(U);const qo=st.map((i,t)=>{const e=X[t+2];return{text:i.district,pos:new c(e.pos.x+12,80,e.pos.z-18),color:i.neonColor}});Y.addNeonSigns(U,qo);const rt=new so;rt.create(U);const Ge=new to;Ge.create(U);const lt=new oo;lt.create(U);const Yo=new kt(128,0,.4);U.add(Yo);const Oe=new it;U.add(Oe);var Qe,et;(et=(Qe=Y.cityGroup)==null?void 0:Qe.children)==null||et.forEach(i=>Oe.add(i));const ct=new $o(U,Oe),me=new C(62975);function Ko(i){const t=Math.min(i,Le.length-1);me.copy(Le[t]),Ge.setDistrictNeon(me),Ue.update(0,Q.position,me)}const De=new vo(Q);De.onSectionChange=i=>{Jo(i),Qo(i),Ko(i),ge.triggerGlitch(),ct.onSection(i)};const Zo=document.getElementById("nav-dots");X.forEach((i,t)=>{const e=document.createElement("div");e.className="nav-dot"+(t===0?" active":""),e.title=i.label,e.addEventListener("click",()=>De.goTo(t)),Zo.appendChild(e)});function Jo(i){document.querySelectorAll(".sect").forEach((t,e)=>{t.classList.toggle("active",e===i)}),document.querySelectorAll(".nav-dot").forEach((t,e)=>{t.classList.toggle("active",e===i)})}function Qo(i){const t=document.getElementById("hud-section");t&&(t.textContent=`DISTRICT_${String(i).padStart(2,"0")} / ${X[i].label}`)}st.forEach((i,t)=>{const e=document.getElementById(`proj-${t+2}`);e&&(e.style.setProperty("--neon",i.neonColor),e.style.borderColor=i.neonColor+"44",e.innerHTML=`
    <div class="proj-icon" style="color:${i.neonColor};text-shadow:0 0 14px ${i.neonColor}">${i.icon}</div>
    <div class="proj-content">
      <div class="proj-district">${i.district}</div>
      <div class="proj-title" style="text-shadow:0 0 20px ${i.neonColor}88">${i.title}</div>
      <div class="proj-subtitle">${i.subtitle}</div>
      <p class="proj-desc">${i.desc}</p>
      <div class="proj-tags">${i.tags.map(o=>`<span class="proj-tag" style="border-color:${i.neonColor}44;color:${i.neonColor}">${o}</span>`).join("")}</div>
      <a class="proj-link" href="${i.url}" target="_blank" style="color:${i.neonColor};border-color:${i.neonColor}">[ VIEW SOURCE → ]</a>
    </div>
  `)});const Ye=document.getElementById("skills-grid");Ye&&Object.entries(fo).forEach(([i,t])=>{const e=document.createElement("div");e.className="skill-cat",e.innerHTML=`<div class="skill-cat-name">// ${i}</div>`+t.map(o=>`<div class="skill-item">${o}</div>`).join(""),Ye.appendChild(e)});const H=document.getElementById("contact-input"),he=document.getElementById("contact-input-display");var tt;(tt=document.getElementById("sect-13"))==null||tt.addEventListener("click",()=>H==null?void 0:H.focus());H==null||H.addEventListener("input",()=>{he&&(he.textContent=(H.value||"")+"_"),H.value.trim().toLowerCase()==="sudo"&&(ei(),H.value="",he&&(he.textContent="_"))});function ei(){const i=document.querySelector("#sect-13 .terminal-body");if(!i)return;const t=document.createElement("p");t.className="output neon-green",t.textContent="> Permission granted. Downloading your future...",i.appendChild(t),setTimeout(()=>{const e=document.createElement("p");e.className="output",e.innerHTML='<span style="color:#ffe642">root@neon-district:~# ██████████ 100%  COMPLETE</span>',i.appendChild(e)},1500)}const Ke=["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];let ie=0;window.addEventListener("keydown",i=>{i.key===Ke[ie]?ie++:ie=0,ie===Ke.length&&(ie=0,ti())});let Pe=!1;function ti(){Pe=!Pe,[Y.meshA,Y.meshB,Y.meshC].forEach(i=>{const t=i.material;t.wireframe=Pe})}const Ae=document.getElementById("boot-log"),Ze=document.getElementById("boot-bar"),ne=document.getElementById("loading-screen"),Ee=["Initializing WebGPU context","Generating city geometry","Compiling 47 shader programs","Spawning rain particles","Calibrating post-processing chain","System ready"];async function oi(){for(let i=0;i<Ee.length;i++){await new Promise(e=>setTimeout(e,260+Math.random()*200));const t=document.createElement("p");t.innerHTML=`<span style="color:rgba(0,245,255,.5)">[BOOT]</span> ${Ee[i]}... <span class="ok">[OK]</span>`,Ae==null||Ae.appendChild(t),Ze&&(Ze.style.width=(i+1)/Ee.length*100+"%")}await new Promise(i=>setTimeout(i,600)),ne==null||ne.classList.add("fade-out"),setTimeout(()=>{ne&&(ne.style.display="none")},850)}oi();window.addEventListener("resize",()=>{Q.aspect=innerWidth/innerHeight,Q.updateProjectionMatrix(),oe.setSize(innerWidth,innerHeight),ge.resize(innerWidth,innerHeight)});const Je=new It;function ut(){requestAnimationFrame(ut);const i=Je.getElapsedTime(),t=Je.getDelta();Y.update(i),Ge.update(i),lt.update(i,Q.position),rt.update(i),Ue.update(i,Q.position,me),De.update(t),ct.update(i),ge.render()}ut();
