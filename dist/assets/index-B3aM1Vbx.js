var Pt=Object.defineProperty;var Mt=(i,t,e)=>t in i?Pt(i,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):i[t]=e;var l=(i,t,e)=>Mt(i,typeof t!="symbol"?t+"":t,e);import{i as x,d as ie,I as X,q as fe,j as ae,u as De,a6 as c,Q as Oe,w as F,C as Ce,J as k,m as G,v as b,_ as T,f as pe,e as O,a as H,K as He,$ as ht,B as At,E as Et,a5 as te,a2 as kt,g as Ge,G as pt,O as It,L as Rt,a1 as mt,X as Lt,r as gt,a9 as Ft,A as Nt,Z as Vt,o as Ut,P as _t,H as Dt,U as Ot,h as Gt}from"./three-Dka5jm0s.js";import{b as zt,R as Wt,a as Bt,B as Ee,C as Ht,V as $t,N as jt,S as Xt,G as qt,c as ke,E as Kt}from"./postprocessing-dbATgWCK.js";import{g as oe}from"./gsap-SFc2wnMY.js";(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))o(n);new MutationObserver(n=>{for(const a of n)if(a.type==="childList")for(const s of a.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&o(s)}).observe(document,{childList:!0,subtree:!0});function e(n){const a={};return n.integrity&&(a.integrity=n.integrity),n.referrerPolicy&&(a.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?a.credentials="include":n.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function o(n){if(n.ep)return;n.ep=!0;const a=e(n);fetch(n.href,a)}})();function Ze(i){return i*i*i*(i*(i*6-15)+10)}function Ie(i,t,e){return i+e*(t-i)}function be(i,t,e){const o=i&3,n=o<2?t:e,a=o<2?e:t;return(i&1?-n:n)+(i&2?-a:a)}const $=Array.from({length:512},(i,t)=>t).sort(()=>Math.random()-.5);for(let i=0;i<256;i++)$[i+256]=$[i];function Yt(i,t){const e=Math.floor(i)&255,o=Math.floor(t)&255,n=i-Math.floor(i),a=t-Math.floor(t),s=Ze(n),r=Ze(a),m=$[$[e]+o],v=$[$[e]+o+1],g=$[$[e+1]+o],w=$[$[e+1]+o+1];return Ie(Ie(be(m,n,a),be(g,n-1,a),s),Ie(be(v,n,a-1),be(w,n-1,a-1),s),r)}function Qe(i,t,e=4,o=2,n=.5){let a=0,s=.5,r=1;for(let m=0;m<e;m++)a+=Yt(i*r,t*r)*s,r*=o,s*=n;return a}function N(i,t){return i+Math.random()*(t-i)}function et(i,t){return Math.floor(N(i,t+1))}const Jt=`
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
`,Zt=`
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
`,Qt=`
varying vec2 vUv;
varying vec3 vWorldPos;
varying vec3 vNormal;
void main() {
  vUv = uv;
  vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,eo=`
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
`,to=`
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
`,oo=`
varying float vAlpha;
void main() {
  gl_FragColor = vec4(0.55, 0.75, 1.0, vAlpha * 0.35);
}
`,io=`
varying vec3 vLocalPos;
void main() {
  vLocalPos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,no=`
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
`,ao=`
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
`,so=`
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
`,D=32,Q=16,ro=6,ve=Q+ro,ye=D/2*ve,Re={color:new x(197400),near:100,far:500},Te=[new x(62975),new x(62975),new x(16711850),new x(16711850),new x(16739098),new x(8073215),new x(8073215),new x(65416),new x(65416),new x(16770626)];function lo(){return new T({vertexShader:Jt,fragmentShader:Zt,uniforms:{uTime:{value:0},uFogColor:{value:Re.color},uFogNear:{value:Re.near},uFogFar:{value:Re.far}}})}function co(i,t){const e=i/D,o=t/D;return e<.35&&o<.35?0:e<.65&&o<.35?1:e>=.65&&o<.35?2:e<.35&&o<.65?3:e>=.65&&o<.65?4:e<.35&&o>=.65?5:e<.65&&o>=.65?6:e>=.65&&o>=.65?7:o>.45&&o<.55?8:9}class uo{constructor(){l(this,"meshA");l(this,"meshB");l(this,"meshC");l(this,"mats",[])}generate(t){const e=D*D,o=lo();this.mats.push(o);const n=new ie(1,1,1),a=new Float32Array(e),s=new Float32Array(e*3);n.setAttribute("aHeight",new X(a,1)),n.setAttribute("aNeonColor",new X(s,3)),this.meshA=new fe(n,o.clone(),e),this.meshA.frustumCulled=!1,this.mats.push(this.meshA.material);const r=new ae(.45,.55,1,10),m=new Float32Array(e),v=new Float32Array(e*3);r.setAttribute("aHeight",new X(m,1)),r.setAttribute("aNeonColor",new X(v,3)),this.meshB=new fe(r,o.clone(),e),this.meshB.frustumCulled=!1,this.mats.push(this.meshB.material);const g=new ie(1,.4,1),w=new Float32Array(e),p=new Float32Array(e*3);g.setAttribute("aHeight",new X(w,1)),g.setAttribute("aNeonColor",new X(p,3)),this.meshC=new fe(g,o.clone(),e),this.meshC.frustumCulled=!1,this.mats.push(this.meshC.material);const h=new De,d=new c,u=new c,f=new Oe;let S=0,P=0,C=0;for(let E=0;E<D;E++)for(let R=0;R<D;R++){const U=E*ve-ye,M=R*ve-ye;if(E%5===0||R%5===0||E%2===0&&R%2===0&&Math.random()<.25)continue;const I=E/D*4-2,_=R/D*4-2,re=Qe(I,_,5),le=Math.sqrt(I*I+_*_)/3,we=Math.max(.18,1-le*.6),Z=Math.max(8,(22+re*170)*we)+N(4,28),Ke=N(Q*.42,Q*.9),Ye=N(Q*.42,Q*.9),Tt=co(E,R),j=Te[Tt],Je=Math.random();if(Je<.65)a[S]=Z,s[S*3]=j.r,s[S*3+1]=j.g,s[S*3+2]=j.b,d.set(U,Z/2,M),u.set(Ke,Z,Ye),h.compose(d,f,u),this.meshA.setMatrixAt(S,h),S++;else if(Je<.82){const ee=N(Q*.18,Q*.32);m[P]=Z,v[P*3]=j.r,v[P*3+1]=j.g,v[P*3+2]=j.b,d.set(U+N(-3,3),Z/2,M+N(-3,3)),u.set(ee*2,Z,ee*2),h.compose(d,f,u),this.meshB.setMatrixAt(P,h),P++}else{const ee=Math.max(6,Z*.35);w[C]=ee,p[C*3]=j.r,p[C*3+1]=j.g,p[C*3+2]=j.b,d.set(U,ee/2,M),u.set(Ke*1.4,ee,Ye*1.4),h.compose(d,f,u),this.meshC.setMatrixAt(C,h),C++}}this.meshA.count=S,this.meshB.count=P,this.meshC.count=C;for(const E of[this.meshA,this.meshB,this.meshC]){E.instanceMatrix.needsUpdate=!0;const R=E.geometry;R.getAttribute("aHeight").needsUpdate=!0,R.getAttribute("aNeonColor").needsUpdate=!0,t.add(E)}}addAntennas(t){const e=new ae(.1,.1,1,4),o=new F({color:16716083}),n=new fe(e,o,400);n.frustumCulled=!1;const a=new De,s=new c,r=new c,m=new Oe;let v=0;for(let g=0;g<400;g++){const w=et(0,D-1),p=et(0,D-1),h=w*ve-ye,d=p*ve-ye,u=w/D*4-2,f=p/D*4-2,S=Math.max(.18,1-Math.sqrt(u*u+f*f)/3*.6),P=Math.max(8,(22+Qe(u,f,5)*170)*S)+20,C=N(8,30);s.set(h+N(-3,3),P+C/2,d+N(-3,3)),r.set(1,C,1),a.compose(s,m,r),n.setMatrixAt(v++,a)}n.count=v,n.instanceMatrix.needsUpdate=!0,t.add(n)}addNeonSigns(t,e){e.forEach(({text:o,pos:n,color:a})=>{const s=document.createElement("canvas");s.width=256,s.height=64;const r=s.getContext("2d");r.clearRect(0,0,256,64),r.fillStyle=a+"22",r.fillRect(0,0,256,64),r.strokeStyle=a,r.lineWidth=2,r.strokeRect(2,2,252,60),r.fillStyle=a,r.font="bold 22px monospace",r.textAlign="center",r.fillText(o,128,40);const m=new Ce(s),v=new k(18,4.5),g=new F({map:m,transparent:!0,side:G,depthWrite:!1}),w=new b(v,g);w.position.copy(n),t.add(w)})}update(t){for(const e of this.mats)e.uniforms.uTime.value=t}}class fo{constructor(){l(this,"mesh");l(this,"mat")}create(t){const e=new k(1200,1200,1,1);return this.mat=new T({vertexShader:Qt,fragmentShader:eo,uniforms:{uTime:{value:0},uDistrictNeon:{value:new x(62975)},uRainIntensity:{value:1}}}),this.mesh=new b(e,this.mat),this.mesh.rotation.x=-Math.PI/2,this.mesh.position.y=0,t.add(this.mesh),this.mesh}update(t){this.mat.uniforms.uTime.value=t}setDistrictNeon(t){this.mat.uniforms.uDistrictNeon.value.copy(t)}setRainIntensity(t){this.mat.uniforms.uRainIntensity.value=t}}class vo{constructor(){l(this,"points");l(this,"count",8e3)}create(t){const e=new Float32Array(this.count*3),o=new Float32Array(this.count),n=new Float32Array(this.count);for(let r=0;r<this.count;r++)e[r*3]=N(-300,300),e[r*3+1]=N(-60,60),e[r*3+2]=N(-300,300),o[r]=N(.3,1),n[r]=Math.random();const a=new pe;a.setAttribute("position",new O(e,3)),a.setAttribute("aSpeed",new O(o,1)),a.setAttribute("aOffset",new O(n,1));const s=new T({vertexShader:to,fragmentShader:oo,uniforms:{uTime:{value:0}},transparent:!0,blending:H,depthWrite:!1});this.points=new He(a,s),t.add(this.points)}update(t,e){const o=this.points.material;o.uniforms.uTime.value=t,e&&(this.points.position.x=e.x,this.points.position.z=e.z)}}class ho{constructor(){l(this,"mesh");l(this,"mat")}create(t){const e=new ht(2e3,32,16);this.mat=new T({vertexShader:io,fragmentShader:no,uniforms:{uTime:{value:0},uZenithColor:{value:new x(132104)},uHorizonColor:{value:new x(1706e3)},uDistrictNeon:{value:new x(62975)}},side:At,depthWrite:!1}),this.mesh=new b(e,this.mat),this.mesh.renderOrder=-1,t.add(this.mesh)}update(t,e,o){this.mesh.position.copy(e),this.mat.uniforms.uTime.value=t,o&&this.mat.uniforms.uDistrictNeon.value.copy(o)}setDistrictColors(t,e){this.mat.uniforms.uHorizonColor.value.copy(t),this.mat.uniforms.uDistrictNeon.value.copy(e)}}function po(i){let t=i;return()=>{t|=0,t=t+1831565813|0;let e=Math.imul(t^t>>>15,1|t);return e=e+Math.imul(e^e>>>7,61|e)^e,((e^e>>>14)>>>0)/4294967296}}const tt=[new x(16720384),new x(61183),new x(22015),new x(16711884),new x(65382),new x(16737792),new x(11141375),new x(16770626)],ze=32,wt=16,mo=6,We=wt+mo,ot=ze/2*We;class go{constructor(){l(this,"mesh");l(this,"mat")}create(t){const o=new k(5,1.4),n=new Float32Array(150*3),a=new Float32Array(150),s=new Float32Array(150);o.setAttribute("aColor",new X(n,3)),o.setAttribute("aFlickerSeed",new X(a,1)),o.setAttribute("aPulseMode",new X(s,1)),this.mat=new T({vertexShader:ao,fragmentShader:so,uniforms:{uTime:{value:0}},transparent:!0,depthWrite:!1,side:G,blending:H}),this.mesh=new fe(o,this.mat,150),this.mesh.frustumCulled=!1;const r=po(42),m=new De,v=new c,g=new Oe,w=new c(1,1,1);let p=0;for(let h=0;h<ze&&p<150;h++)for(let d=0;d<ze&&p<150;d++){if(h%5===0||d%5===0||r()>.1)continue;const u=h*We-ot,f=d*We-ot,S=6+r()*12,P=Math.floor(r()*4),C=wt*.5+.3;let E=u,R=f,U=0;P===0?(R=f+C,U=0):P===1?(R=f-C,U=Math.PI):P===2?(E=u+C,U=Math.PI*.5):(E=u-C,U=-Math.PI*.5),v.set(E,S,R),g.setFromEuler(new Et(0,U,0)),m.compose(v,g,w),this.mesh.setMatrixAt(p,m);const M=tt[Math.floor(r()*tt.length)];n[p*3]=M.r,n[p*3+1]=M.g,n[p*3+2]=M.b,a[p]=r();const I=r();s[p]=I<.6?0:I<.85?1:I<.95?2:3,p++}this.mesh.count=p,this.mesh.instanceMatrix.needsUpdate=!0,o.getAttribute("aColor").needsUpdate=!0,o.getAttribute("aFlickerSeed").needsUpdate=!0,o.getAttribute("aPulseMode").needsUpdate=!0,t.add(this.mesh)}update(t){this.mat.uniforms.uTime.value=t}}const wo=`
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
`;class bo extends Kt{constructor(t=.45){super("LensStreakEffect",wo,{uniforms:new Map([["uIntensity",new kt(t)]])})}}class yo{constructor(){l(this,"composer");l(this,"glitch");l(this,"glitchTimeout",0)}setup(t,e,o){this.composer=new zt(t);const n=new Wt(e,o),a=new Bt({blendFunction:Ee.ADD,luminanceThreshold:.25,luminanceSmoothing:.4,intensity:2.4,radius:.6}),s=new bo(.45),r=new Ht({offset:new te(.0018,.0012),radialModulation:!0,modulationOffset:.5}),m=new $t({eskil:!1,offset:.35,darkness:.75}),v=new jt({blendFunction:Ee.OVERLAY,premultiply:!0});v.blendMode.opacity.value=.04;const g=new Xt({blendFunction:Ee.OVERLAY,density:1.4});return g.blendMode.opacity.value=.07,this.glitch=new qt({delay:new te(99999,99999),duration:new te(.15,.35),strength:new te(.15,.4),columns:.04,ratio:.85}),this.composer.addPass(n),this.composer.addPass(new ke(o,a,s)),this.composer.addPass(new ke(o,r,g,m,v)),this.composer.addPass(new ke(o,this.glitch)),this.composer}triggerGlitch(){this.glitch.delay.set(0,.05),clearTimeout(this.glitchTimeout),this.glitchTimeout=window.setTimeout(()=>{this.glitch.delay.set(99999,99999)},600)}resize(t,e){this.composer.setSize(t,e)}render(){this.composer.render()}}const B=[{pos:new c(0,180,220),look:new c(0,0,0),label:"HERO",t:0},{pos:new c(-40,12,110),look:new c(-20,20,60),label:"ABOUT",t:0},{pos:new c(-80,-8,55),look:new c(-80,-8,20),label:"PS3 GPU",t:0},{pos:new c(-75,30,-25),look:new c(-75,0,-25),label:"CPUonGPU",t:0},{pos:new c(-30,10,-60),look:new c(0,20,-90),label:"GPU Stream",t:0},{pos:new c(20,35,-80),look:new c(40,25,-110),label:"Selkies",t:0},{pos:new c(80,55,-70),look:new c(100,35,-100),label:"Oris AI",t:0},{pos:new c(110,40,0),look:new c(90,22,-20),label:"VajraGrid",t:0},{pos:new c(100,20,70),look:new c(70,14,50),label:"VidyaMitra",t:0},{pos:new c(50,16,100),look:new c(20,12,80),label:"Netflip",t:0},{pos:new c(10,22,90),look:new c(-20,16,70),label:"Arena",t:0},{pos:new c(-30,60,70),look:new c(-10,40,40),label:"Hackathon",t:0},{pos:new c(-60,8,30),look:new c(-40,8,0),label:"SKILLS",t:0},{pos:new c(0,120,160),look:new c(0,0,0),label:"CONTACT",t:0}],xo=1600;class So{constructor(t){l(this,"camera");l(this,"posSpline");l(this,"lookSpline");l(this,"t",0);l(this,"currentSection",0);l(this,"mouseX",0);l(this,"mouseY",0);l(this,"_pos",new c);l(this,"_look",new c);l(this,"_ahead",new c);l(this,"onSectionChange");l(this,"_lastFiredSection",0);this.camera=t,this.buildSpline(),this.init()}buildSpline(){const t=B.map(n=>n.pos.clone()),e=B.map(n=>n.look.clone());this.posSpline=new Ge(t,!1,"catmullrom",.5),this.lookSpline=new Ge(e,!1,"catmullrom",.5);const o=B.length;B.forEach((n,a)=>{n.t=a/(o-1)}),this.t=0,this.posSpline.getPoint(0,this._pos),this.lookSpline.getPoint(0,this._look),this.camera.position.copy(this._pos),this.camera.lookAt(this._look)}init(){window.addEventListener("mousemove",o=>{this.mouseX=(o.clientX/window.innerWidth-.5)*2,this.mouseY=(o.clientY/window.innerHeight-.5)*2});let t=!1;window.addEventListener("wheel",o=>{if(t)return;t=!0;const n=o.deltaY>0?1:-1;this.goTo(this.currentSection+n),setTimeout(()=>{t=!1},xo)},{passive:!0});let e=0;window.addEventListener("touchstart",o=>{e=o.touches[0].clientY}),window.addEventListener("touchend",o=>{const n=e-o.changedTouches[0].clientY;Math.abs(n)>40&&this.goTo(this.currentSection+(n>0?1:-1))}),window.addEventListener("keydown",o=>{(o.key==="ArrowDown"||o.key==="ArrowRight")&&this.goTo(this.currentSection+1),(o.key==="ArrowUp"||o.key==="ArrowLeft")&&this.goTo(this.currentSection-1)})}goTo(t){if(t=Math.max(0,Math.min(B.length-1,t)),t===this.currentSection)return;const e=this.currentSection;this.currentSection=t;const o=B[t].t,a=.6+Math.abs(o-this.t)*5;oe.killTweensOf(this),oe.to(this,{t:o,duration:a,ease:"power2.inOut",onUpdate:()=>this._fireCrossings(e,t),onComplete:()=>{var s;this._lastFiredSection=t,(s=this.onSectionChange)==null||s.call(this,t),this._updateUI(t)}}),this._updateUI(t)}_fireCrossings(t,e){const o=e>t?1:-1;B.forEach((n,a)=>{var r;(o>0?this.t>=n.t&&a>this._lastFiredSection&&a<=e:this.t<=n.t&&a<this._lastFiredSection&&a>=e)&&(this._lastFiredSection=a,(r=this.onSectionChange)==null||r.call(this,a),this._updateUI(a))})}update(t){this.posSpline.getPoint(this.t,this._pos),this.camera.position.copy(this._pos);const e=Math.min(1,this.t+.015);this.posSpline.getPoint(e,this._ahead),this.lookSpline.getPoint(this.t,this._look);const o=this._look.x*.8+this._ahead.x*.2+this.mouseX*5,n=this._look.y*.8+this._ahead.y*.2-this.mouseY*3,a=this._look.z*.8+this._ahead.z*.2;this.camera.lookAt(o,n,a)}_updateUI(t){document.querySelectorAll(".nav-dot").forEach((o,n)=>o.classList.toggle("active",n===t));const e=document.getElementById("progress-bar");e&&(e.style.height=t/(B.length-1)*100+"%")}getCurrentSection(){return this.currentSection}}const me=[{id:"ps3-gpu",title:"PS3 Cell GPU Emulator",subtitle:"Systems / Emulation",desc:"Full emulation of the Cell Broadband Engine's SPU pipeline in WebGL. 6 SPU cores, PPE scheduler, DMA bus — running real PS3 shaders in the browser at 200 GIPS.",tags:["C++","WebGL","GLSL","Cell BE","Emulation"],url:"https://github.com/aerosane",neonColor:"#00f5ff",district:"GPU DISTRICT",icon:"⬡"},{id:"cpuongpu",title:"CPUonGPU",subtitle:"Architecture Research",desc:"Runs a full x86 CPU simulation entirely on GPU compute shaders. Register file, ALU, cache hierarchy — all in GLSL. JIT-compiled x86 → SPIR-V at runtime.",tags:["GLSL","Compute Shaders","x86","JIT","SPIR-V"],url:"https://github.com/aerosane",neonColor:"#00f5ff",district:"GPU DISTRICT",icon:"⬢"},{id:"gpu-streaming",title:"GPU Streaming Pipeline",subtitle:"NvFBC + NVENC",desc:"Sub-frame-latency game streaming via NvFBC capture → NVENC H265/AV1 encode → WebRTC TURN relay. <1 frame E2E latency. Deployed on GitHub Codespace GPU.",tags:["NVENC","NvFBC","WebRTC","Rust","H265"],url:"https://github.com/Imperialorg/codespace",neonColor:"#00f5ff",district:"GPU DISTRICT",icon:"▶"},{id:"selkies-rust",title:"Selkies-Rust",subtitle:"Python→Rust Port",desc:"Complete rewrite of the Selkies WebRTC game streaming stack from Python into Rust. 6 crates: pipeline, signaling, input, encoding, metrics, CLI.",tags:["Rust","WebRTC","GStreamer","Tokio","GSAP"],url:"https://github.com/Imperialorg/codespace",neonColor:"#ff6b1a",district:"SYSTEMS CORRIDOR",icon:"⚙"},{id:"oris-ai",title:"Oris — AI SRE",subtitle:"🏆 Runner-up · TechSynapse 2026",desc:"Autonomous Site Reliability Engineer: ingests production logs, PII-masks with Presidio, infers root cause via Gemini 2.0, opens GitHub PRs with fixes. Zero human touch.",tags:["Python","Gemini 2.0","Presidio","LangChain","FastAPI"],url:"https://github.com/aerosane",neonColor:"#ff00aa",district:"AI DISTRICT",icon:"◈"},{id:"vajragrid",title:"VajraGrid",subtitle:"🇮🇳 India Innovates 2026 · Bharat Mandapam",desc:"AI-hardened power grid security: detects SCADA cyberattacks in 16s, 4-layer ML defense stack, adversarial training. Exhibited nationally at Bharat Mandapam.",tags:["Python","PyTorch","SCADA","Adversarial ML","GridSec"],url:"https://github.com/aerosane",neonColor:"#ff00aa",district:"AI DISTRICT",icon:"⚡"},{id:"vidyamitra",title:"VidyaMitra",subtitle:"IISER JEE Prep",desc:"AI tutor for JEE aspirants: adaptive quiz engine, LaTeX equation rendering, spaced repetition. Covers Physics, Chemistry, Math with difficulty auto-calibration.",tags:["TypeScript","React","LaTeX","OpenAI","Supabase"],url:"https://github.com/aerosane",neonColor:"#00ff88",district:"EDTECH ZONE",icon:"⬟"},{id:"netflip",title:"Netflip VOD",subtitle:"Full-Stack Streaming",desc:"Netflix-clone with HLS adaptive streaming, Azure Blob CDN, Fastly edge cache, WebSocket live chat, OAuth2, recommendation engine. 1080p adaptive bitrate.",tags:["Next.js","HLS","Azure","Fastly","PostgreSQL"],url:"https://github.com/aerosane",neonColor:"#7b2fff",district:"WEB DISTRICT",icon:"▨"},{id:"coding-arena",title:"Coding Arena",subtitle:"Competitive Judging Platform",desc:"Online judge with isolated Docker execution, multi-language support, real-time leaderboard, plagiarism detection via AST similarity. 200ms median judge latency.",tags:["Go","Docker","Redis","React","WebSocket"],url:"https://github.com/aerosane",neonColor:"#7b2fff",district:"WEB DISTRICT",icon:"{ }"},{id:"hackathon",title:"Hackathon Wins",subtitle:"Hall of Fame",desc:"🏆 Runner-up at TechSynapse 2026 (Oris AI SRE). 🇮🇳 National exhibition at India Innovates 2026, Bharat Mandapam, New Delhi (VajraGrid). 1st year, two nationals.",tags:["Oris AI","VajraGrid","TechSynapse","India Innovates"],url:"https://github.com/aerosane",neonColor:"#ffe642",district:"HALL OF FAME",icon:"🏆"}],Co={Languages:["C++","Rust","Python","TypeScript","Go","GLSL/HLSL"],Systems:["WebRTC","WebGL/WebGPU","NVENC/NvFBC","Docker","Linux"],"AI/ML":["PyTorch","Gemini API","LangChain","Presidio","HuggingFace"],Web:["React","Next.js","Vite","Node.js","PostgreSQL","Redis"],Tools:["Git","GitHub Actions","Azure","GStreamer","Tokio"]};class ge{constructor(){l(this,"group",new pt);l(this,"hoverTargets",[]);l(this,"visible",!1);l(this,"visibleValue",0)}enter(){this.group.visible=!0,this.visible=!0,oe.killTweensOf(this),oe.to(this,{visibleValue:1,duration:1.4,ease:"power2.out",onUpdate:()=>this.setVisible(this.visibleValue)})}exit(){this.visible=!1,oe.killTweensOf(this),oe.to(this,{visibleValue:0,duration:.8,ease:"power2.in",onUpdate:()=>this.setVisible(this.visibleValue),onComplete:()=>{this.group.visible=!1}})}setVisible(t){}dispose(){this.group.traverse(t=>{t.geometry&&t.geometry.dispose()})}}let K=null;function To(){return K||(K=document.createElement("div"),K.id="env-detail-panel",Object.assign(K.style,{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%, -50%) scale(0.92)",background:"rgba(4,6,20,0.92)",border:"1px solid var(--neon, #00f5ff)",boxShadow:"0 0 32px var(--neon, #00f5ff)44",padding:"28px 36px",maxWidth:"480px",width:"90vw",zIndex:"9999",fontFamily:"monospace",color:"#e8f4ff",opacity:"0",pointerEvents:"none",transition:"opacity 0.3s, transform 0.3s",borderRadius:"4px"}),document.body.appendChild(K),K)}function Pe(i){var e;const t=To();t.style.setProperty("--neon",i.neonColor),t.style.borderColor=i.neonColor+"88",t.style.boxShadow=`0 0 40px ${i.neonColor}33`,t.innerHTML=`
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px">
      <div>
        <div style="color:${i.neonColor};font-size:11px;letter-spacing:3px;text-transform:uppercase;margin-bottom:4px">${i.subtitle}</div>
        <div style="font-size:20px;font-weight:bold;color:#fff">${i.title}</div>
      </div>
      <button id="env-panel-close" style="background:none;border:none;color:#888;font-size:20px;cursor:pointer;line-height:1;padding:0 0 0 16px">✕</button>
    </div>
    <div style="font-size:13px;line-height:1.7;color:#c8d8ef;margin-bottom:16px">${i.desc}</div>
    <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:18px">
      ${i.tags.map(o=>`<span style="background:${i.neonColor}18;border:1px solid ${i.neonColor}44;color:${i.neonColor};font-size:10px;padding:3px 8px;border-radius:2px">${o}</span>`).join("")}
    </div>
    <a href="${i.url}" target="_blank" rel="noopener"
       style="display:inline-block;padding:9px 20px;background:${i.neonColor}22;border:1px solid ${i.neonColor};color:${i.neonColor};text-decoration:none;font-size:12px;letter-spacing:1px;transition:background 0.2s"
       onmouseover="this.style.background='${i.neonColor}44'"
       onmouseout="this.style.background='${i.neonColor}22'">
      VIEW ON GITHUB →
    </a>
  `,(e=t.querySelector("#env-panel-close"))==null||e.addEventListener("click",o=>{o.stopPropagation(),bt()}),t.style.pointerEvents="all",t.style.opacity="1",t.style.transform="translate(-50%, -50%) scale(1)"}function bt(){const i=K;i&&(i.style.opacity="0",i.style.transform="translate(-50%, -50%) scale(0.92)",i.style.pointerEvents="none")}function Me(i,t,e){const a=document.createElement("canvas");a.width=512,a.height=64;const s=a.getContext("2d");s.clearRect(0,0,512,64),s.font="bold 20px monospace",s.textAlign="center",s.shadowColor=t;for(const g of[24,12,6])s.shadowBlur=g,s.fillStyle=t,s.fillText(i,512/2,34);s.shadowBlur=0,s.fillStyle="#ffffff",s.fillText(i,512/2,34),s.font="11px monospace",s.shadowBlur=6,s.shadowColor=t,s.fillStyle=t,s.fillText("▶  CLICK FOR DETAILS",512/2,54);const r=new Ce(a),m=new F({map:r,transparent:!0,depthWrite:!1,side:G,alphaTest:.02}),v=new b(new k(9,1.2),m);return v.userData.isLabel=!0,v.userData.onClick=e,v.frustumCulled=!1,v.onBeforeRender=(g,w,p)=>v.quaternion.copy(p.quaternion),v}const z=new c(-80,-8,38),Po=`
uniform float uTime;
uniform float uVisible;
varying vec2 vUv;
float hash(float n){ return fract(sin(n)*43758.5); }
void main() {
  vec3 col = vec3(0.06, 0.07, 0.11);
  float row = floor(vUv.y * 24.0);
  float rowF = fract(vUv.y * 24.0);
  float ledX = fract(vUv.x * 6.0);
  float h    = hash(row);
  float flicker = 0.82 + 0.18*sin(uTime*3.2 + h*12.0);
  float led  = step(0.70,ledX)*step(ledX,0.86)*step(0.1,rowF)*step(rowF,0.3);
  vec3 lCol  = h>0.15 ? vec3(0.0,0.9,0.25) : vec3(0.9,0.4,0.0);
  col += lCol * led * flicker * 3.0;
  col *= 1.0 - step(0.88,rowF)*0.6;
  col += vec3(0.0,0.25,0.12)*(1.0-abs(vUv.x-0.5)*2.0)*0.04;
  gl_FragColor = vec4(col, uVisible);
}
`,Mo=`
uniform float uTime;
uniform float uVisible;
varying vec2 vUv;
void main() {
  vec2 g  = fract(vUv*32.0);
  float grid = step(0.91,g.x)+step(0.91,g.y);
  float dist  = length(vUv-0.5);
  float fade  = 1.0-smoothstep(0.2,0.5,dist);
  float pulse = 0.5+0.5*sin(uTime*0.6-dist*8.0);
  col = vec3(0.0,0.55,0.35)*grid*fade*(0.4+0.6*pulse);
  gl_FragColor = vec4(col, grid*fade*0.55*uVisible);
}
`,Ao=`
uniform float uTime;
uniform float uVisible;
varying vec2 vUv;
void main() {
  // Tube cross-section: distance from center
  float radial = 1.0 - smoothstep(0.28,0.5,abs(vUv.y-0.5)*2.0);
  // Core glow
  float core = exp(-abs(vUv.y-0.5)*12.0);
  // Electron packets: 4 per bus
  float flow = 0.0;
  for(int k=0;k<4;k++){
    float t = fract(uTime*0.9 + float(k)*0.25);
    float pkt = exp(-abs(vUv.x - t)*22.0);
    flow += pkt;
  }
  vec3 col = vec3(0.1,0.85,1.0)*(core*0.6 + flow*radial*1.8);
  gl_FragColor = vec4(col, (radial*0.35+flow*radial*0.9)*uVisible);
}
`,it=`
uniform float uTime;
uniform float uRadius;
uniform float uVisible;
uniform vec3  uColor;
varying vec2 vUv;
void main() {
  vec2 uv = vUv - 0.5;
  float r   = length(uv);
  float ring = 1.0-smoothstep(0.,0.025,abs(r-uRadius));
  float angle = atan(uv.y,uv.x);
  float scan = 0.5+0.5*sin(angle*4.0 - uTime*2.5);
  float pulse = 0.6+0.4*sin(uTime*2.0);
  gl_FragColor = vec4(uColor*(ring*(0.5+0.5*scan)*pulse), ring*0.8*uVisible);
}
`,ce="varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }";class Eo extends ge{constructor(){super(...arguments);l(this,"rackMat");l(this,"floorMat");l(this,"busMats",[]);l(this,"ringMats",[]);l(this,"ppeMat")}create(e){e.add(this.group),this.floorMat=new T({vertexShader:ce,fragmentShader:Mo.replace("col =","vec3 col ="),uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0});const o=new b(new k(64,54),this.floorMat);o.rotation.x=-Math.PI/2,o.position.set(z.x,z.y-6,z.z),this.group.add(o),this.rackMat=new T({vertexShader:ce,fragmentShader:Po,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0});const n=[[-18,-9,10],[-12,-9,10],[-6,-9,10],[0,-9,10],[-18,-9,-10],[-12,-9,-10],[-6,-9,-10],[0,-9,-10]];for(const[d,u,f]of n){const S=new b(new ie(4,24,6),this.rackMat);S.position.set(z.x+d,z.y+u+12,z.z+f),this.group.add(S)}const a=new F({color:65450,transparent:!0,opacity:.7});for(let d=0;d<3;d++){const u=new b(new k(42,.5),a.clone());u.rotation.x=Math.PI/2,u.position.set(z.x-9,z.y+5.8,z.z-8+d*8),this.group.add(u)}const s=new c(z.x+14,z.y+2,z.z);this.ppeMat=new F({color:62975,wireframe:!0,transparent:!0,opacity:.9});const r=new b(new It(2.8,1),this.ppeMat);r.position.copy(s),this.group.add(r),r.userData.rotating=!0;const m=new T({vertexShader:ce,fragmentShader:it,uniforms:{uTime:{value:0},uVisible:{value:0},uRadius:{value:.42},uColor:{value:new x(62975)}},transparent:!0,depthWrite:!1,side:G}),v=new b(new k(14,14),m);v.rotation.x=-Math.PI/2,v.position.set(s.x,s.y,s.z),this.group.add(v),this.ringMats.push(m);const g=new F({color:3800852,wireframe:!0,transparent:!0,opacity:.85}),w=[];for(let d=0;d<6;d++){const u=d/6*Math.PI*2,f=new c(s.x+Math.cos(u)*6,s.y,s.z+Math.sin(u)*6);w.push(f);const S=new b(new ae(.9,.9,.5,6),g.clone());S.position.copy(f),this.group.add(S);const P=new T({vertexShader:ce,fragmentShader:it,uniforms:{uTime:{value:0},uVisible:{value:0},uRadius:{value:.46},uColor:{value:new x(3800852)}},transparent:!0,depthWrite:!1,side:G}),C=new b(new k(4,4),P);C.rotation.x=-Math.PI/2,C.position.copy(f),this.group.add(C),this.ringMats.push(P)}for(let d=0;d<6;d++){const u=new Rt(s,w[d]),f=new mt(u,20,.12,6,!1),S=new T({vertexShader:ce,fragmentShader:Ao,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0,depthWrite:!1,blending:H});S.uniforms.uTime.value=d*.16,this.group.add(new b(f,S)),this.busMats.push(S)}const p=me[0],h=Me(p.title,p.neonColor,()=>Pe(p));h.position.set(s.x+5,s.y+8,s.z),h.scale.setScalar(1.8),this.group.add(h)}update(e){this.rackMat.uniforms.uTime.value=e,this.floorMat.uniforms.uTime.value=e,this.ringMats.forEach(o=>o.uniforms.uTime.value=e),this.busMats.forEach((o,n)=>o.uniforms.uTime.value=e+n*.16),this.group.traverse(o=>{o.userData.rotating&&(o.rotation.y+=.008,o.rotation.x+=.003)})}setVisible(e){this.rackMat.uniforms.uVisible.value=e,this.floorMat.uniforms.uVisible.value=e,this.ringMats.forEach(o=>o.uniforms.uVisible.value=e),this.busMats.forEach(o=>o.uniforms.uVisible.value=e),this.ppeMat&&(this.ppeMat.opacity=e*.9)}onHover(){}}const A=new c(-75,0,-25),ko=`
uniform float uTime;
uniform float uVisible;
varying vec2 vUv;

// SDF: distance from point p to line segment (a→b)
float sdSeg(vec2 p, vec2 a, vec2 b) {
  vec2 pa=p-a, ba=b-a;
  float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.);
  return length(pa-ba*h);
}
// Rounded pad
float sdPad(vec2 p, vec2 c, float r) { return length(p-c)-r; }
// IC package rectangle
float sdRect(vec2 p, vec2 c, vec2 hs) {
  vec2 d=abs(p-c)-hs; return length(max(d,0.))+min(max(d.x,d.y),0.);
}

// Trace SDF — returns distance to nearest trace and which trace index (for electron animation)
// Returns: (dist, traceId, traceT)
float traceNet(vec2 uv, float traceW, out float tId, out float tPos) {
  tId=-1.; tPos=0.;
  float best=1e9;
  float d;
  // --- POWER BUS (thick horizontal center) ---
  d=sdSeg(uv,vec2(0.04,0.50),vec2(0.96,0.50)); if(d<best){best=d;tId=0.;tPos=(uv.x-0.04)/0.92;}
  // --- VDD rail (top) ---
  d=sdSeg(uv,vec2(0.04,0.80),vec2(0.96,0.80)); if(d<best){best=d;tId=1.;tPos=(uv.x-0.04)/0.92;}
  // --- GND rail (bottom) ---
  d=sdSeg(uv,vec2(0.04,0.20),vec2(0.96,0.20)); if(d<best){best=d;tId=2.;tPos=(uv.x-0.04)/0.92;}
  // --- CPU→GPU data bus (L-route) ---
  d=sdSeg(uv,vec2(0.30,0.65),vec2(0.30,0.50)); if(d<best){best=d;tId=3.;tPos=(0.65-uv.y)/0.15;}
  d=sdSeg(uv,vec2(0.30,0.50),vec2(0.65,0.50)); if(d<best){best=d;tId=3.;tPos=0.5+(uv.x-0.30)/0.70;}
  d=sdSeg(uv,vec2(0.65,0.50),vec2(0.65,0.65)); if(d<best){best=d;tId=3.;tPos=0.85+(uv.y-0.50)/0.30;}
  // --- Cache bus (vertical) ---
  d=sdSeg(uv,vec2(0.20,0.35),vec2(0.20,0.65)); if(d<best){best=d;tId=4.;tPos=(uv.y-0.35)/0.30;}
  // --- GPU shader bus x3 parallel ---
  d=sdSeg(uv,vec2(0.60,0.55),vec2(0.93,0.55)); if(d<best){best=d;tId=5.;tPos=(uv.x-0.60)/0.33;}
  d=sdSeg(uv,vec2(0.60,0.59),vec2(0.93,0.59)); if(d<best){best=d;tId=6.;tPos=(uv.x-0.60)/0.33;}
  d=sdSeg(uv,vec2(0.60,0.63),vec2(0.93,0.63)); if(d<best){best=d;tId=7.;tPos=(uv.x-0.60)/0.33;}
  return best;
}

// Pad locations
float padNet(vec2 uv, float r) {
  float d=1e9;
  // CPU die pads
  d=min(d,sdPad(uv,vec2(0.28,0.68),r));
  d=min(d,sdPad(uv,vec2(0.22,0.65),r));
  d=min(d,sdPad(uv,vec2(0.22,0.35),r));
  d=min(d,sdPad(uv,vec2(0.28,0.50),r));
  // GPU die pads
  d=min(d,sdPad(uv,vec2(0.62,0.65),r));
  d=min(d,sdPad(uv,vec2(0.62,0.50),r));
  d=min(d,sdPad(uv,vec2(0.50,0.50),r));
  // Decap pads
  d=min(d,sdPad(uv,vec2(0.50,0.35),r));
  d=min(d,sdPad(uv,vec2(0.35,0.50),r));
  d=min(d,sdPad(uv,vec2(0.35,0.65),r));
  return d;
}

void main() {
  vec2 uv = vUv;
  // Solder-mask green substrate
  vec3 col = vec3(0.025, 0.085, 0.038);

  // ── Trace network ─────────────────────────────────────────────
  float tId, tPos;
  float TRACE_W   = 0.010;
  float POWER_W   = 0.018;
  float dist = traceNet(uv, TRACE_W, tId, tPos);

  // Power bus wider
  float isPower = step(tId, 2.5) * step(-0.5, tId);
  float width   = mix(TRACE_W, POWER_W, isPower);

  float traceMask = 1.0 - smoothstep(0., width, dist);
  // Copper colour — warm gold
  vec3 copper = vec3(0.85, 0.62, 0.18);
  col = mix(col, copper, traceMask);

  // ── Via / pad pads ────────────────────────────────────────────
  float padR   = 0.012;
  float viaR   = 0.007;
  float padD   = padNet(uv, padR);
  float viaMask= 1.0 - smoothstep(0., 0.002, padD);
  float holeD  = padNet(uv, viaR * 0.55);
  float holeMask = 1.0 - smoothstep(0., 0.002, holeD);
  col = mix(col, copper, viaMask * (1.0 - holeMask));
  // Drill hole: dark
  col = mix(col, vec3(0.01), holeMask);

  // ── IC package outlines ───────────────────────────────────────
  // CPU die (left-center)
  float cpuD  = sdRect(uv, vec2(0.25, 0.52), vec2(0.08, 0.10));
  float cpuPkg = 1.0 - smoothstep(0., 0.003, abs(cpuD) - 0.001);
  // GPU die (right-center)
  float gpuD  = sdRect(uv, vec2(0.70, 0.57), vec2(0.10, 0.08));
  float gpuPkg = 1.0 - smoothstep(0., 0.003, abs(gpuD) - 0.001);
  // Chip body fill
  float cpuFill = 1.0 - smoothstep(0., 0.003, cpuD);
  float gpuFill = 1.0 - smoothstep(0., 0.003, gpuD);
  col = mix(col, vec3(0.08, 0.11, 0.15), cpuFill);
  col = mix(col, vec3(0.05, 0.09, 0.14), gpuFill);
  // Package outline in silk-screen white
  col += vec3(0.7) * cpuPkg * 0.6;
  col += vec3(0.7) * gpuPkg * 0.6;

  // Small passives (capacitors / resistors)
  for(int i=0;i<6;i++){
    vec2 cPos = vec2(0.12+float(i)*0.13, 0.25 + sin(float(i)*2.1)*0.04);
    float compD = sdRect(uv, cPos, vec2(0.018, 0.008));
    float cap = 1.0 - smoothstep(0.,0.002,compD);
    col = mix(col, vec3(0.55,0.45,0.35), cap * 0.9);
    col += vec3(0.6) * (1.0-smoothstep(0.,0.002,abs(compD)-0.001)) * 0.4;
  }

  // ── Electron flow along traces ────────────────────────────────
  // Only animate if we're near a trace
  if(traceMask > 0.05 && tId >= 0.) {
    // Multiple electrons spaced along each trace
    float speed = mix(0.5, 1.4, fract(tId * 0.37));
    for(int k=0;k<3;k++){
      float offset = float(k) / 3.0 + tId * 0.17;
      float t      = fract(uTime * speed + offset);
      float electron = exp(-abs(tPos - t) * 80.0);
      // Electrons on power/GND are yellow; signal traces cyan/green
      vec3 eCol = tId < 2.5
        ? vec3(1.0, 0.85, 0.2)   // power: yellow
        : tId < 4.5
        ? vec3(0.2, 1.0, 0.6)    // data bus: green
        : vec3(0.2, 0.8, 1.0);   // signals: cyan
      col += eCol * electron * traceMask * 8.0;
    }
  }

  // ── Silkscreen text areas (faint white marks) ─────────────────
  float silkU = fract(uv.x * 40.0);
  float silkV = fract(uv.y * 40.0);
  float silkDot = step(0.92, silkU) * step(0.92, silkV) * 0.07;
  col += vec3(0.5) * silkDot;

  // ── Edge fade ─────────────────────────────────────────────────
  float edgeFade = 1.0 - smoothstep(0.38, 0.50, length(uv - 0.5));
  gl_FragColor = vec4(col * edgeFade, edgeFade * uVisible);
}
`,Io=`
uniform float uTime;
uniform float uVisible;
varying vec2 vUv;

float sdRect(vec2 p, vec2 c, vec2 hs) {
  vec2 d=abs(p-c)-hs; return length(max(d,0.))+min(max(d.x,d.y),0.);
}

void main() {
  vec2 uv = vUv;
  vec3 col = vec3(0.02, 0.03, 0.07);

  // 5 pipeline stage boxes
  vec3 stageColors[5];
  stageColors[0] = vec3(0.0, 0.85, 1.0);
  stageColors[1] = vec3(0.35, 0.6, 1.0);
  stageColors[2] = vec3(0.85, 0.3, 1.0);
  stageColors[3] = vec3(1.0, 0.55, 0.15);
  stageColors[4] = vec3(0.25, 1.0, 0.4);

  for(int i=0;i<5;i++){
    float cx  = (float(i) + 0.5) / 5.0;
    float d   = sdRect(uv, vec2(cx, 0.55), vec2(0.08, 0.28));
    float fill = 1.0-smoothstep(0.,0.004,d);
    float edge = 1.0-smoothstep(0.,0.003,abs(d)-0.002);
    float act = 0.3+0.7*(0.5+0.5*sin(uTime*1.8-float(i)*1.3));
    col = mix(col, stageColors[i]*0.18, fill);
    col += stageColors[i] * edge * 0.9;
    col += stageColors[i] * fill * act * 0.25;

    // Arrow connector to next stage
    if(i<4){
      float ax = (float(i)+1.0)/5.0;
      float arrow = step(0.97, 1.0-abs(uv.x - ax)*20.0) * step(0.45,uv.y)*step(uv.y,0.65);
      col += vec3(0.4) * arrow * 0.5;
    }
  }

  // Instruction packet travelling right
  float pktT   = fract(uTime * 0.35) * 1.05;
  float pktX   = 0.0 + pktT * 1.0;
  float pkt    = exp(-abs(uv.x - pktX) * 60.0) * step(0.27,uv.y) * step(uv.y,0.83);
  col += vec3(1.0,1.0,0.8) * pkt * 2.5;

  // Stage labels via scanlines hint
  col += vec3(0.06) * step(0.96, fract(uv.y * 22.0));

  gl_FragColor = vec4(col, 0.92 * uVisible);
}
`,nt="varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }";class Ro extends ge{constructor(){super(...arguments);l(this,"pcbMat");l(this,"pipeMat")}create(e){e.add(this.group),this.pcbMat=new T({vertexShader:nt,fragmentShader:ko,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0});const o=new b(new k(45,45),this.pcbMat);o.rotation.x=-Math.PI/2,o.position.copy(A),o.renderOrder=1,this.group.add(o),this.pipeMat=new T({vertexShader:nt,fragmentShader:Io,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0,depthWrite:!1,side:G});const n=new b(new k(26,8),this.pipeMat);n.position.set(A.x,A.y+12,A.z),n.rotation.x=-.2,this.group.add(n);const a=new b(new ie(11.2,.9,14),new F({color:658966}));a.position.set(A.x-17,A.y+.45,A.z+1.5),this.group.add(a);const s=new b(new k(9,12),new F({color:399368}));s.rotation.x=-Math.PI/2,s.position.set(A.x-17,A.y+.92,A.z+1.5),this.group.add(s);const r=new b(new ie(14,1.1,11.2),new F({color:395796}));r.position.set(A.x+7,A.y+.55,A.z-2),this.group.add(r);const m=new F({color:13150272});for(let h=0;h<2;h++)for(let d=0;d<14;d++){const u=new b(new ie(.4,.3,.6),m);u.position.set(A.x-22+h*18,A.y+.15,A.z-5+d),this.group.add(u)}const v=new F({color:9136404}),g=[[-10,-8],[-10,4],[-5,-8],[-5,4],[2,-6],[2,2],[12,-6],[12,2]];for(const[h,d]of g){const u=new b(new ae(.5,.5,.8,8),v);u.position.set(A.x+h,A.y+.4,A.z+d),this.group.add(u)}const w=me[1],p=Me(w.title,w.neonColor,()=>Pe(w));p.position.set(A.x-14,A.y+6,A.z+16),p.rotation.x=-.4,this.group.add(p)}update(e){this.pcbMat.uniforms.uTime.value=e,this.pipeMat.uniforms.uTime.value=e}setVisible(e){this.pcbMat.uniforms.uVisible.value=e,this.pipeMat.uniforms.uVisible.value=e}onHover(){}}const y=new c(-10,10,-80),Lo=`
uniform float uTime;
uniform float uVisible;
varying vec2 vUv;

void main() {
  // Fiber optic tube: animated light pulse racing along it
  float t = fract(vUv.x * 3.0 - uTime * 1.2);
  float pulse = exp(-abs(t - 0.5) * 24.0);
  vec3 fiberBase = vec3(0.05, 0.05, 0.12);
  vec3 pulseColor = vec3(1.0, 0.2, 0.8);
  vec3 // Tight core + wider cladding glow
  float cladding = exp(-abs(t-0.5)*8.0)*0.3;
  col = fiberBase + pulseColor*(pulse*8.0+cladding);
  // Glow around the tube body
  float radial = 1.0 - smoothstep(0.3, 0.5, abs(vUv.y - 0.5));
  col *= radial * 2.0;
  gl_FragColor = vec4(col, radial * uVisible);
}
`,Fo=`
uniform float uTime;
uniform float uScale;
void main() {
  vec3 pos = position * (1.0 + uScale * 0.3 + sin(uTime) * 0.05 * uScale);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`,No=`
uniform float uTime;
uniform float uScale;
uniform float uVisible;
void main() {
  float fade = 1.0 - uScale * 0.28;
  float pulse = 0.5 + 0.5 * sin(uTime * 2.0 - uScale * 2.0);
  vec3 col = vec3(1.0, 0.1, 0.6) * (fade + 0.3 * pulse);
  gl_FragColor = vec4(col, fade * 0.7 * uVisible);
}
`,Vo=`
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
`;function Le(i,t,e,o){const n=new F({color:8947848}),a=new b(new ae(.2,.3,20,8),n);a.position.set(t,e+10,o),i.add(a);for(let r=0;r<4;r++){const m=new b(new ae(.08,.08,4-r*.6,6),n);m.rotation.z=Math.PI/2,m.position.set(t,e+4+r*4,o),i.add(m)}const s=new b(new ht(.3,8,8),new F({color:16720384}));s.position.set(t,e+21,o),i.add(s)}class Uo extends ge{constructor(){super(...arguments);l(this,"mats",[]);l(this,"rings",[])}create(e){e.add(this.group),Le(this.group,y.x-20,y.y-4,y.z),Le(this.group,y.x+15,y.y-4,y.z-10),Le(this.group,y.x+5,y.y-4,y.z+20);for(let g=0;g<4;g++){const w=new Lt(6+g*7,6.4+g*7,48),p=new T({vertexShader:Fo,fragmentShader:No,uniforms:{uTime:{value:0},uScale:{value:g},uVisible:{value:0}},transparent:!0,depthWrite:!1,side:G,blending:H}),h=new b(w,p);h.rotation.x=-Math.PI/2,h.position.set(y.x-20,y.y+6,y.z),this.group.add(h),this.rings.push({mesh:h,mat:p,delay:g*.4}),this.mats.push(p)}const o=new Ge([new c(y.x-20,y.y+8,y.z),new c(y.x-5,y.y+12,y.z-5),new c(y.x+18,y.y+6,y.z+5)]),n=new mt(o,60,.15,6,!1),a=new T({vertexShader:"varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",fragmentShader:Lo,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0,depthWrite:!1,blending:H});this.group.add(new b(n,a)),this.mats.push(a);const s=new T({vertexShader:"varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",fragmentShader:Vo,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0}),r=new b(new k(28,14),s);r.position.set(y.x+18,y.y+8,y.z+5),r.rotation.y=-.6,this.group.add(r),this.mats.push(s);const m=me[2],v=Me(m.title,m.neonColor,()=>Pe(m));v.position.set(y.x-20,y.y+24,y.z),v.scale.setScalar(1.8),this.group.add(v)}update(e){for(const o of this.mats)o.uniforms.uTime.value=e}setVisible(e){for(const o of this.mats)o.uniforms.uVisible.value=e}onHover(){}}const L=new c(95,40,-90),_o=`
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
  gl_PointSize = 40.0 + 24.0 * vActivation + 20.0 * vIsAnomaly;
}
`,Do=`
uniform float uTime;
uniform float uVisible;
varying float vActivation;
varying float vIsAnomaly;
void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;
  float ring  = 1.0 - smoothstep(0.30, 0.50, d);
  float inner = 1.0 - smoothstep(0.05, 0.20, d);
  float pulse = 0.7 + 0.3 * sin(uTime * 3.0 + vActivation * 6.28);
  vec3 normalCol  = mix(vec3(0.4, 0.05, 0.9), vec3(0.9, 0.3, 1.0), vActivation);
  float resolved  = 0.5 + 0.5 * sin(uTime * 2.5);
  vec3 anomalyCol = mix(vec3(1.0, 0.05, 0.1), vec3(0.0, 1.0, 0.5), resolved);
  vec3 col = mix(normalCol, anomalyCol, vIsAnomaly);
  float alpha = (ring * 0.6 + inner * 1.2) * pulse * uVisible;
  gl_FragColor = vec4(col * (ring * 1.5 + inner * 2.5), alpha);
}`,Oo=`
attribute float aEdgePhase;
varying float vEdgePhase;
varying float vT;        // 0=start vertex, 1=end vertex (from position along segment)
void main() {
  vEdgePhase = aEdgePhase;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,Go=`
uniform float uTime;
uniform float uVisible;
varying float vEdgePhase;
void main() {
  float t     = fract(uTime * 0.9 + vEdgePhase);
  float pulse = exp(-abs(t - 0.5) * 6.0);
  float base  = 0.18;
  vec3 col    = mix(vec3(0.4, 0.0, 0.9), vec3(1.0, 0.6, 1.0), pulse);
  float alpha = (base + (1.0 - base) * pulse * 2.2) * uVisible;
  gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
}`,zo="varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",Wo=`
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
`,he=class he extends ge{constructor(){super(...arguments);l(this,"nodeMat");l(this,"edgeMat");l(this,"floorMat");l(this,"logTexture");l(this,"logCanvas");l(this,"logCtx");l(this,"logLines",[]);l(this,"logTimer",0);l(this,"anomalyTimer",0);l(this,"currentAnomaly",-1)}create(e){e.add(this.group);const o=new T({vertexShader:zo,fragmentShader:Wo,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0,depthWrite:!1,side:G}),n=new b(new k(90,90),o);n.rotation.x=-Math.PI/2,n.position.set(L.x,L.y-18,L.z),this.group.add(n),this.floorMat=o;const a=5,s=8,r=[],m=new Float32Array(a*s),v=new Float32Array(a*s);for(let M=0;M<a;M++)for(let I=0;I<s;I++){const _=M*s+I;r.push(new c(L.x+(M-2)*8,L.y+(I-s/2+.5)*5.5,L.z)),m[_]=_,v[_]=Math.random()}const g=new Float32Array(r.flatMap(M=>[M.x,M.y,M.z])),w=new pe;w.setAttribute("position",new O(g,3)),w.setAttribute("aNodeId",new O(m,1)),w.setAttribute("aActivation",new O(v,1)),this.nodeMat=new T({vertexShader:_o,fragmentShader:Do,uniforms:{uTime:{value:0},uVisible:{value:0},uAnomalyNode:{value:-1}},transparent:!0,depthWrite:!1,blending:H}),this.group.add(new He(w,this.nodeMat));const p=[],h=[];for(let M=0;M<a-1;M++)for(let I=0;I<s;I++)for(let _=0;_<s;_++){if(Math.random()>.3)continue;const re=r[M*s+I],le=r[(M+1)*s+_];p.push(re.x,re.y,re.z,le.x,le.y,le.z);const we=Math.random();h.push(we,we)}const d=new pe;d.setAttribute("position",new O(new Float32Array(p),3)),d.setAttribute("aEdgePhase",new O(new Float32Array(h),1)),this.edgeMat=new T({vertexShader:Oo,fragmentShader:Go,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0,depthWrite:!1,blending:H}),this.group.add(new gt(d,this.edgeMat));const u=document.createElement("canvas");u.width=512,u.height=128;const f=u.getContext("2d");f.clearRect(0,0,512,128),f.font="bold 36px monospace",f.textAlign="center",f.shadowColor="#b000ff",f.shadowBlur=28,f.fillStyle="#ffffff",f.fillText("ORIS AI",256,52),f.shadowBlur=10,f.font="16px monospace",f.fillStyle="#b000ff",f.fillText("5-LAYER ANOMALY DETECTION NETWORK",256,86),f.shadowBlur=6,f.font="11px monospace",f.fillStyle="#7040ff88",f.fillText("40 NODES  ·  5 LAYERS  ·  GEMINI 2.0 BACKEND",256,112);const S=new Ce(u),P=new b(new k(28,7),new F({map:S,transparent:!0,depthWrite:!1,side:G,alphaTest:.02}));P.position.set(L.x,L.y+30,L.z),P.frustumCulled=!1,P.onBeforeRender=(M,I,_)=>P.quaternion.copy(_.quaternion),this.group.add(P);const C=me[4],E=Me(C.title,C.neonColor,()=>Pe(C));E.position.set(L.x+20,L.y+20,L.z),E.scale.setScalar(2),this.group.add(E),this.logCanvas=document.createElement("canvas"),this.logCanvas.width=512,this.logCanvas.height=320,this.logCtx=this.logCanvas.getContext("2d"),this.logTexture=new Ce(this.logCanvas),this.drawLog();const R=new F({map:this.logTexture,transparent:!0,depthWrite:!1,side:G}),U=new b(new k(16,10),R);U.position.set(L.x+16,L.y-2,L.z+4),U.rotation.y=-.5,this.group.add(U)}drawLog(){const e=this.logCtx,o=512,n=320;e.clearRect(0,0,o,n),e.fillStyle="rgba(4, 0, 18, 0.92)",e.fillRect(0,0,o,n);for(let s=0;s<n;s+=3)e.fillStyle="rgba(0,0,0,0.18)",e.fillRect(0,s,o,1);e.font="12px monospace";const a=this.logLines.slice(-20);for(let s=0;s<a.length;s++){const r=a[s];e.fillStyle=r.startsWith("ERROR")?"#ff4455":r.startsWith("WARN")?"#ffaa22":"#22ee88",e.shadowColor=e.fillStyle,e.shadowBlur=4,e.fillText(r,10,18+s*15)}e.fillStyle="#b000ff",e.shadowColor="#b000ff",e.shadowBlur=8,e.fillText("▋",10,18+a.length*15),this.logTexture.needsUpdate=!0}update(e){this.nodeMat.uniforms.uTime.value=e,this.edgeMat.uniforms.uTime.value=e,this.floorMat.uniforms.uTime.value=e,this.logTimer+=1/60,this.logTimer>.75&&(this.logTimer=0,this.logLines.push(he.LOG_POOL[Math.floor(Math.random()*he.LOG_POOL.length)]),this.drawLog()),this.anomalyTimer+=1/60,this.currentAnomaly===-1&&this.anomalyTimer>5?(this.anomalyTimer=0,this.currentAnomaly=Math.floor(Math.random()*40),this.nodeMat.uniforms.uAnomalyNode.value=this.currentAnomaly,this.logLines.push(`ERROR anomaly on node_${this.currentAnomaly}`),this.drawLog()):this.currentAnomaly!==-1&&this.anomalyTimer>2.5&&(this.anomalyTimer=0,this.logLines.push(`INFO  node_${this.currentAnomaly} resolved ✓`),this.drawLog(),this.currentAnomaly=-1,this.nodeMat.uniforms.uAnomalyNode.value=-1)}setVisible(e){this.nodeMat.uniforms.uVisible.value=e,this.edgeMat.uniforms.uVisible.value=e,this.floorMat.uniforms.uVisible.value=e,this.group.traverse(o=>{const n=o.material;(n==null?void 0:n.map)===this.logTexture&&(n.opacity=e)})}onHover(){}};l(he,"LOG_POOL",["INFO  processing log batch #4821","INFO  PII masking: email→[REDACTED]","WARN  anomaly score: 0.82 (thresh 0.75)","ERROR latency spike: 3.2s on node_07","INFO  filing GitHub PR #89 auto-patch","INFO  LLM class: INCIDENT_RESOLVED","INFO  alert: slack #oncall notified","INFO  MTTR: 16s — system healed","INFO  model confidence: 0.96","WARN  CPU spike 94% → gpu-04 offload"]);let Be=he;const W=new c(100,22,-10),Bo=`
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
`,Ho=`
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
`,$o=`
attribute float aLinePhase;
varying float vLinePhase;
void main() {
  vLinePhase = aLinePhase;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,jo=`
uniform float uTime;
uniform float uVisible;
varying float vLinePhase;
void main() {
  float t     = fract(uTime * 0.5 + vLinePhase);
  float pulse = exp(-abs(t - 0.5) * 10.0);
  vec3 col    = mix(vec3(0.0, 0.5, 0.9), vec3(0.8, 1.0, 1.0), pulse);
  gl_FragColor = vec4(col, (0.2 + 0.8 * pulse * 1.3) * uVisible);
}
`,Xo="varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",qo=`
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
`,Ko="varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",Yo=`
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
`,Jo="varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",Zo=`
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
`,Fe=[[0,28],[16,18],[22,-6],[11,-22],[-11,-22],[-22,-6],[-16,18],[0,6],[8,-8],[-8,-8]];class Qo extends ge{constructor(){super(...arguments);l(this,"nodeMat");l(this,"lineMat");l(this,"attackMat");l(this,"shieldMats",[]);l(this,"gridMat");l(this,"nodeStates");l(this,"nodeAttr");l(this,"attackTimer",3);l(this,"attackActive",!1);l(this,"attackWave",1);l(this,"infectedNode",-1)}create(e){e.add(this.group),this.gridMat=new T({vertexShader:Jo,fragmentShader:Zo,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0,depthWrite:!1,side:G});const o=new b(new k(80,80),this.gridMat);o.rotation.x=-Math.PI/2,o.position.set(W.x,W.y-6,W.z),this.group.add(o);const n=Fe.length,a=new Float32Array(n*3);this.nodeStates=new Float32Array(n);const s=new Float32Array(n);Fe.forEach(([h,d],u)=>{a[u*3]=W.x+h,a[u*3+1]=W.y-2,a[u*3+2]=W.z+d,s[u]=Math.random()*Math.PI*2});const r=new pe;r.setAttribute("position",new O(a,3)),this.nodeAttr=new O(this.nodeStates,1),r.setAttribute("aState",this.nodeAttr),r.setAttribute("aPhase",new O(s,1)),this.nodeMat=new T({vertexShader:Bo,fragmentShader:Ho,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0,depthWrite:!1,blending:H}),this.group.add(new He(r,this.nodeMat));const m=[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,0],[7,0],[7,1],[7,6],[8,2],[8,3],[8,7],[9,4],[9,5],[9,7]],v=[],g=[];m.forEach(([h,d])=>{const u=h*3,f=d*3;v.push(a[u],a[u+1],a[u+2]),v.push(a[f],a[f+1],a[f+2]);const S=Math.random();g.push(S,S)});const w=new pe;w.setAttribute("position",new O(new Float32Array(v),3)),w.setAttribute("aLinePhase",new O(new Float32Array(g),1)),this.lineMat=new T({vertexShader:$o,fragmentShader:jo,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0,depthWrite:!1,blending:H}),this.group.add(new gt(w,this.lineMat)),this.attackMat=new T({vertexShader:Xo,fragmentShader:qo,uniforms:{uTime:{value:0},uVisible:{value:0},uWave:{value:1},uOrigin:{value:new te(.5,.5)}},transparent:!0,depthWrite:!1,blending:H,side:G});const p=new b(new k(80,80),this.attackMat);p.rotation.x=-Math.PI/2,p.position.set(W.x,W.y-5.5,W.z),this.group.add(p);for(let h=0;h<4;h++){const d=(h+1)*9,u=new T({vertexShader:Ko,fragmentShader:Yo,uniforms:{uTime:{value:0},uVisible:{value:0},uLayer:{value:h}},transparent:!0,depthWrite:!1,blending:H,side:G}),f=new b(new k(d*2,d*2),u);f.rotation.x=-Math.PI/2,f.position.set(W.x,W.y-5+h*.3,W.z),this.group.add(f),this.shieldMats.push(u)}}update(e){if(this.nodeMat.uniforms.uTime.value=e,this.lineMat.uniforms.uTime.value=e,this.attackMat.uniforms.uTime.value=e,this.gridMat.uniforms.uTime.value=e,this.shieldMats.forEach(o=>o.uniforms.uTime.value=e),this.attackTimer-=1/60,!this.attackActive&&this.attackTimer<=0){this.infectedNode=Math.floor(Math.random()*7),this.nodeStates[this.infectedNode]=1,this.nodeAttr.needsUpdate=!0,this.attackWave=0,this.attackActive=!0;const[o,n]=Fe[this.infectedNode];this.attackMat.uniforms.uOrigin.value.set(.5+o/60,.5+n/60)}this.attackActive&&(this.attackWave+=.003,this.attackMat.uniforms.uWave.value=this.attackWave,this.attackWave>.45&&this.infectedNode>=0&&this.nodeStates[this.infectedNode]===1&&(this.nodeStates[this.infectedNode]=2,this.nodeAttr.needsUpdate=!0),this.attackWave>=.9&&(this.infectedNode>=0&&(this.nodeStates[this.infectedNode]=0,this.nodeAttr.needsUpdate=!0,this.infectedNode=-1),this.attackActive=!1,this.attackTimer=5+Math.random()*3))}setVisible(e){this.nodeMat.uniforms.uVisible.value=e,this.lineMat.uniforms.uVisible.value=e,this.attackMat.uniforms.uVisible.value=e,this.gridMat.uniforms.uVisible.value=e,this.shieldMats.forEach(o=>o.uniforms.uVisible.value=e)}onHover(){}}const ei=new Set([2,3]);class ti{constructor(t,e){l(this,"envs",new Map);l(this,"activeEnv",null);l(this,"activeIdx",-1);l(this,"cityGroup");l(this,"cityVisible",!0);this.cityGroup=e;const o=[[2,new Eo],[3,new Ro],[4,new Uo],[6,new Be],[7,new Qo]];for(const[n,a]of o)a.create(t),a.group.visible=!1,this.envs.set(n,a)}onSection(t){if(t===this.activeIdx)return;this.activeIdx=t,this.activeEnv&&(this.activeEnv.exit(),this.activeEnv=null);const e=ei.has(t);e&&this.cityVisible?(this.cityVisible=!1,this.cityGroup.visible=!1):!e&&!this.cityVisible&&(this.cityVisible=!0,this.cityGroup.visible=!0);const o=this.envs.get(t);o&&(this.activeEnv=o,o.enter())}update(t){this.activeEnv&&this.activeEnv.update(t)}}const oi=document.getElementById("scene-canvas"),se=new Ft({canvas:oi,antialias:!0,alpha:!1,powerPreference:"high-performance"});se.setPixelRatio(Math.min(devicePixelRatio,2));se.setSize(innerWidth,innerHeight);se.toneMapping=Nt;se.toneMappingExposure=.95;const V=new Vt;V.background=new x(131602);V.fog=new Ut(197400,.003);const J=new _t(60,innerWidth/innerHeight,.5,1200),Ae=new yo;Ae.setup(se,V,J);const $e=new ho;$e.create(V);const Y=new uo;Y.generate(V);Y.addAntennas(V);const ii=me.map((i,t)=>{const e=B[t+2];return{text:i.district,pos:new c(e.pos.x+12,80,e.pos.z-18),color:i.neonColor}});Y.addNeonSigns(V,ii);const yt=new go;yt.create(V);const je=new fo;je.create(V);const xt=new vo;xt.create(V);const ni=new Dt(128,0,.4);V.add(ni);const Xe=new pt;V.add(Xe);var dt,ft;(ft=(dt=Y.cityGroup)==null?void 0:dt.children)==null||ft.forEach(i=>Xe.add(i));const St=new ti(V,Xe),Se=new x(62975);function ai(i){const t=Math.min(i,Te.length-1);Se.copy(Te[t]),je.setDistrictNeon(Se),$e.update(0,J.position,Se)}const si=[["NEON DISTRICT","A cyberpunk portfolio"],["ABOUT","Who is behind this"],["PS3 CELL GPU","PS3 SPU emulator in WebGL"],["CPUonGPU","x86 CPU running on GPU"],["GPU STREAMING","Sub-frame game streaming"],["SELKIES RUST","WebRTC stack rebuilt in Rust"],["ORIS AI","Autonomous SRE agent"],["VAJRAGRID","AI power grid security"],["VIDYAMITRA","Adaptive JEE AI tutor"],["NETFLIP","HLS streaming platform"],["ARENA OJ","Online judge platform"],["HACKATHON","Competition highlights"],["TECH STACK","Tools and languages"],["CONTACT","Get in touch"]],ne=document.createElement("div");ne.id="section-banner";Object.assign(ne.style,{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%, -50%)",textAlign:"center",pointerEvents:"none",zIndex:"50",opacity:"0",transition:"opacity 0.4s"});document.body.appendChild(ne);let at=0;function ri(i){const[t,e]=si[i]??["",""],o=Te[i]??"#00f5ff";ne.innerHTML=`
    <div style="font-family:monospace;font-size:9px;letter-spacing:4px;color:${o};margin-bottom:6px;text-transform:uppercase;opacity:0.7">
      DISTRICT_${String(i).padStart(2,"0")}
    </div>
    <div style="font-family:monospace;font-size:clamp(1.4rem,4vw,2.6rem);font-weight:900;color:#fff;
                text-shadow:0 0 30px ${o},0 0 60px ${o}88;letter-spacing:0.08em;line-height:1.1">
      ${t}
    </div>
    <div style="font-family:monospace;font-size:clamp(0.7rem,1.8vw,0.95rem);color:${o};
                letter-spacing:0.15em;margin-top:8px;opacity:0.85">
      ${e}
    </div>
  `,ne.style.opacity="1",clearTimeout(at),at=window.setTimeout(()=>{ne.style.opacity="0"},2200)}const qe=new So(J);qe.onSectionChange=i=>{ci(i),ui(i),ai(i),Ae.triggerGlitch(),St.onSection(i),ri(i)};const li=document.getElementById("nav-dots");B.forEach((i,t)=>{const e=document.createElement("div");e.className="nav-dot"+(t===0?" active":""),e.title=i.label,e.addEventListener("click",()=>qe.goTo(t)),li.appendChild(e)});function ci(i){document.querySelectorAll(".sect").forEach((t,e)=>{t.classList.toggle("active",e===i)}),document.querySelectorAll(".nav-dot").forEach((t,e)=>{t.classList.toggle("active",e===i)})}function ui(i){const t=document.getElementById("hud-section");t&&(t.textContent=`DISTRICT_${String(i).padStart(2,"0")} / ${B[i].label}`)}const st=document.getElementById("skills-grid");st&&Object.entries(Co).forEach(([i,t])=>{const e=document.createElement("div");e.className="skill-cat",e.innerHTML=`<div class="skill-cat-name">// ${i}</div>`+t.map(o=>`<div class="skill-item">${o}</div>`).join(""),st.appendChild(e)});const q=document.getElementById("contact-input"),xe=document.getElementById("contact-input-display");var vt;(vt=document.getElementById("sect-13"))==null||vt.addEventListener("click",()=>q==null?void 0:q.focus());q==null||q.addEventListener("input",()=>{xe&&(xe.textContent=(q.value||"")+"_"),q.value.trim().toLowerCase()==="sudo"&&(di(),q.value="",xe&&(xe.textContent="_"))});function di(){const i=document.querySelector("#sect-13 .terminal-body");if(!i)return;const t=document.createElement("p");t.className="output neon-green",t.textContent="> Permission granted. Downloading your future...",i.appendChild(t),setTimeout(()=>{const e=document.createElement("p");e.className="output",e.innerHTML='<span style="color:#ffe642">root@neon-district:~# ██████████ 100%  COMPLETE</span>',i.appendChild(e)},1500)}const rt=["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];let ue=0;window.addEventListener("keydown",i=>{i.key===rt[ue]?ue++:ue=0,ue===rt.length&&(ue=0,fi())});let Ne=!1;function fi(){Ne=!Ne,[Y.meshA,Y.meshB,Y.meshC].forEach(i=>{const t=i.material;t.wireframe=Ne})}const Ve=document.getElementById("boot-log"),lt=document.getElementById("boot-bar"),de=document.getElementById("loading-screen"),Ue=["Initializing WebGPU context","Generating city geometry","Compiling 47 shader programs","Spawning rain particles","Calibrating post-processing chain","System ready"];async function vi(){for(let i=0;i<Ue.length;i++){await new Promise(e=>setTimeout(e,260+Math.random()*200));const t=document.createElement("p");t.innerHTML=`<span style="color:rgba(0,245,255,.5)">[BOOT]</span> ${Ue[i]}... <span class="ok">[OK]</span>`,Ve==null||Ve.appendChild(t),lt&&(lt.style.width=(i+1)/Ue.length*100+"%")}await new Promise(i=>setTimeout(i,600)),de==null||de.classList.add("fade-out"),setTimeout(()=>{de&&(de.style.display="none")},850)}vi();const ct=new Ot,_e=new te;window.addEventListener("click",i=>{if(i.target.closest("#env-detail-panel"))return;_e.x=i.clientX/innerWidth*2-1,_e.y=-(i.clientY/innerHeight)*2+1,ct.setFromCamera(_e,J);const t=ct.intersectObjects(V.children,!0);for(const e of t){const o=e.object;if(o.userData.isLabel&&o.userData.onClick){i.stopPropagation(),o.userData.onClick();return}}bt()});window.addEventListener("resize",()=>{J.aspect=innerWidth/innerHeight,J.updateProjectionMatrix(),se.setSize(innerWidth,innerHeight),Ae.resize(innerWidth,innerHeight)});const ut=new Gt;function Ct(){requestAnimationFrame(Ct);const i=ut.getElapsedTime(),t=ut.getDelta();Y.update(i),je.update(i),xt.update(i,J.position),yt.update(i),$e.update(i,J.position,Se),qe.update(t),St.update(i),Ae.render()}Ct();
