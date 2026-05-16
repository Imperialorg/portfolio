var Ct=Object.defineProperty;var Pt=(i,t,e)=>t in i?Ct(i,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):i[t]=e;var l=(i,t,e)=>Pt(i,typeof t!="symbol"?t+"":t,e);import{i as C,d as oe,I as $,q as le,j as ie,u as Ie,a6 as c,Q as Re,w as R,C as _e,J as E,m as D,v as y,_ as M,f as de,e as V,a as O,K as De,$ as ut,B as Mt,E as Tt,a5 as ee,a2 as At,g as Fe,G as dt,O as kt,L as Et,a1 as vt,X as It,r as ft,a9 as Rt,A as Ft,Z as Lt,o as Vt,P as Nt,H as Ut,U as _t,h as Dt}from"./three-Dka5jm0s.js";import{b as Gt,R as Ot,a as zt,B as ye,C as Wt,V as Bt,N as Ht,S as $t,G as Xt,c as xe,E as jt}from"./postprocessing-dbATgWCK.js";import{g as te}from"./gsap-SFc2wnMY.js";(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))o(a);new MutationObserver(a=>{for(const s of a)if(s.type==="childList")for(const n of s.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&o(n)}).observe(document,{childList:!0,subtree:!0});function e(a){const s={};return a.integrity&&(s.integrity=a.integrity),a.referrerPolicy&&(s.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?s.credentials="include":a.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function o(a){if(a.ep)return;a.ep=!0;const s=e(a);fetch(a.href,s)}})();function Ye(i){return i*i*i*(i*(i*6-15)+10)}function Se(i,t,e){return i+e*(t-i)}function fe(i,t,e){const o=i&3,a=o<2?t:e,s=o<2?e:t;return(i&1?-a:a)+(i&2?-s:s)}const W=Array.from({length:512},(i,t)=>t).sort(()=>Math.random()-.5);for(let i=0;i<256;i++)W[i+256]=W[i];function qt(i,t){const e=Math.floor(i)&255,o=Math.floor(t)&255,a=i-Math.floor(i),s=t-Math.floor(t),n=Ye(a),r=Ye(s),m=W[W[e]+o],f=W[W[e]+o+1],g=W[W[e+1]+o],w=W[W[e+1]+o+1];return Se(Se(fe(m,a,s),fe(g,a-1,s),n),Se(fe(f,a,s-1),fe(w,a-1,s-1),n),r)}function Ke(i,t,e=4,o=2,a=.5){let s=0,n=.5,r=1;for(let m=0;m<e;m++)s+=qt(i*r,t*r)*n,r*=o,n*=a;return s}function I(i,t){return i+Math.random()*(t-i)}function Ze(i,t){return Math.floor(I(i,t+1))}const Yt=`
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
`,Kt=`
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
`,Zt=`
varying vec2 vUv;
varying vec3 vWorldPos;
varying vec3 vNormal;
void main() {
  vUv = uv;
  vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,Jt=`
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
`,Qt=`
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
`,eo=`
varying float vAlpha;
void main() {
  gl_FragColor = vec4(0.55, 0.75, 1.0, vAlpha * 0.35);
}
`,to=`
varying vec3 vLocalPos;
void main() {
  vLocalPos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,oo=`
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
`,io=`
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
`,ao=`
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
`,L=32,J=16,so=6,ce=J+so,he=L/2*ce,Ce={color:new C(197400),near:100,far:500},Le=[new C(62975),new C(62975),new C(16711850),new C(16711850),new C(16739098),new C(8073215),new C(8073215),new C(65416),new C(65416),new C(16770626)];function no(){return new M({vertexShader:Yt,fragmentShader:Kt,uniforms:{uTime:{value:0},uFogColor:{value:Ce.color},uFogNear:{value:Ce.near},uFogFar:{value:Ce.far}}})}function ro(i,t){const e=i/L,o=t/L;return e<.35&&o<.35?0:e<.65&&o<.35?1:e>=.65&&o<.35?2:e<.35&&o<.65?3:e>=.65&&o<.65?4:e<.35&&o>=.65?5:e<.65&&o>=.65?6:e>=.65&&o>=.65?7:o>.45&&o<.55?8:9}class lo{constructor(){l(this,"meshA");l(this,"meshB");l(this,"meshC");l(this,"mats",[])}generate(t){const e=L*L,o=no();this.mats.push(o);const a=new oe(1,1,1),s=new Float32Array(e),n=new Float32Array(e*3);a.setAttribute("aHeight",new $(s,1)),a.setAttribute("aNeonColor",new $(n,3)),this.meshA=new le(a,o.clone(),e),this.meshA.frustumCulled=!1,this.mats.push(this.meshA.material);const r=new ie(.45,.55,1,10),m=new Float32Array(e),f=new Float32Array(e*3);r.setAttribute("aHeight",new $(m,1)),r.setAttribute("aNeonColor",new $(f,3)),this.meshB=new le(r,o.clone(),e),this.meshB.frustumCulled=!1,this.mats.push(this.meshB.material);const g=new oe(1,.4,1),w=new Float32Array(e),h=new Float32Array(e*3);g.setAttribute("aHeight",new $(w,1)),g.setAttribute("aNeonColor",new $(h,3)),this.meshC=new le(g,o.clone(),e),this.meshC.frustumCulled=!1,this.mats.push(this.meshC.material);const v=new Ie,u=new c,d=new c,b=new Re;let p=0,P=0,x=0;for(let A=0;A<L;A++)for(let k=0;k<L;k++){const N=A*ce-he,Y=k*ce-he;if(A%5===0||k%5===0||A%2===0&&k%2===0&&Math.random()<.25)continue;const K=A/L*4-2,be=k/L*4-2,bt=Ke(K,be,5),yt=Math.sqrt(K*K+be*be)/3,xt=Math.max(.18,1-yt*.6),Z=Math.max(8,(22+bt*170)*xt)+I(4,28),Xe=I(J*.42,J*.9),je=I(J*.42,J*.9),St=ro(A,k),B=Le[St],qe=Math.random();if(qe<.65)s[p]=Z,n[p*3]=B.r,n[p*3+1]=B.g,n[p*3+2]=B.b,u.set(N,Z/2,Y),d.set(Xe,Z,je),v.compose(u,b,d),this.meshA.setMatrixAt(p,v),p++;else if(qe<.82){const Q=I(J*.18,J*.32);m[P]=Z,f[P*3]=B.r,f[P*3+1]=B.g,f[P*3+2]=B.b,u.set(N+I(-3,3),Z/2,Y+I(-3,3)),d.set(Q*2,Z,Q*2),v.compose(u,b,d),this.meshB.setMatrixAt(P,v),P++}else{const Q=Math.max(6,Z*.35);w[x]=Q,h[x*3]=B.r,h[x*3+1]=B.g,h[x*3+2]=B.b,u.set(N,Q/2,Y),d.set(Xe*1.4,Q,je*1.4),v.compose(u,b,d),this.meshC.setMatrixAt(x,v),x++}}this.meshA.count=p,this.meshB.count=P,this.meshC.count=x;for(const A of[this.meshA,this.meshB,this.meshC]){A.instanceMatrix.needsUpdate=!0;const k=A.geometry;k.getAttribute("aHeight").needsUpdate=!0,k.getAttribute("aNeonColor").needsUpdate=!0,t.add(A)}}addAntennas(t){const e=new ie(.1,.1,1,4),o=new R({color:16716083}),a=new le(e,o,400);a.frustumCulled=!1;const s=new Ie,n=new c,r=new c,m=new Re;let f=0;for(let g=0;g<400;g++){const w=Ze(0,L-1),h=Ze(0,L-1),v=w*ce-he,u=h*ce-he,d=w/L*4-2,b=h/L*4-2,p=Math.max(.18,1-Math.sqrt(d*d+b*b)/3*.6),P=Math.max(8,(22+Ke(d,b,5)*170)*p)+20,x=I(8,30);n.set(v+I(-3,3),P+x/2,u+I(-3,3)),r.set(1,x,1),s.compose(n,m,r),a.setMatrixAt(f++,s)}a.count=f,a.instanceMatrix.needsUpdate=!0,t.add(a)}addNeonSigns(t,e){e.forEach(({text:o,pos:a,color:s})=>{const n=document.createElement("canvas");n.width=256,n.height=64;const r=n.getContext("2d");r.clearRect(0,0,256,64),r.fillStyle=s+"22",r.fillRect(0,0,256,64),r.strokeStyle=s,r.lineWidth=2,r.strokeRect(2,2,252,60),r.fillStyle=s,r.font="bold 22px monospace",r.textAlign="center",r.fillText(o,128,40);const m=new _e(n),f=new E(18,4.5),g=new R({map:m,transparent:!0,side:D,depthWrite:!1}),w=new y(f,g);w.position.copy(a),t.add(w)})}update(t){for(const e of this.mats)e.uniforms.uTime.value=t}}class co{constructor(){l(this,"mesh");l(this,"mat")}create(t){const e=new E(1200,1200,1,1);return this.mat=new M({vertexShader:Zt,fragmentShader:Jt,uniforms:{uTime:{value:0},uDistrictNeon:{value:new C(62975)},uRainIntensity:{value:1}}}),this.mesh=new y(e,this.mat),this.mesh.rotation.x=-Math.PI/2,this.mesh.position.y=0,t.add(this.mesh),this.mesh}update(t){this.mat.uniforms.uTime.value=t}setDistrictNeon(t){this.mat.uniforms.uDistrictNeon.value.copy(t)}setRainIntensity(t){this.mat.uniforms.uRainIntensity.value=t}}class uo{constructor(){l(this,"points");l(this,"count",8e3)}create(t){const e=new Float32Array(this.count*3),o=new Float32Array(this.count),a=new Float32Array(this.count);for(let r=0;r<this.count;r++)e[r*3]=I(-300,300),e[r*3+1]=I(-60,60),e[r*3+2]=I(-300,300),o[r]=I(.3,1),a[r]=Math.random();const s=new de;s.setAttribute("position",new V(e,3)),s.setAttribute("aSpeed",new V(o,1)),s.setAttribute("aOffset",new V(a,1));const n=new M({vertexShader:Qt,fragmentShader:eo,uniforms:{uTime:{value:0}},transparent:!0,blending:O,depthWrite:!1});this.points=new De(s,n),t.add(this.points)}update(t,e){const o=this.points.material;o.uniforms.uTime.value=t,e&&(this.points.position.x=e.x,this.points.position.z=e.z)}}class vo{constructor(){l(this,"mesh");l(this,"mat")}create(t){const e=new ut(2e3,32,16);this.mat=new M({vertexShader:to,fragmentShader:oo,uniforms:{uTime:{value:0},uZenithColor:{value:new C(132104)},uHorizonColor:{value:new C(1706e3)},uDistrictNeon:{value:new C(62975)}},side:Mt,depthWrite:!1}),this.mesh=new y(e,this.mat),this.mesh.renderOrder=-1,t.add(this.mesh)}update(t,e,o){this.mesh.position.copy(e),this.mat.uniforms.uTime.value=t,o&&this.mat.uniforms.uDistrictNeon.value.copy(o)}setDistrictColors(t,e){this.mat.uniforms.uHorizonColor.value.copy(t),this.mat.uniforms.uDistrictNeon.value.copy(e)}}function fo(i){let t=i;return()=>{t|=0,t=t+1831565813|0;let e=Math.imul(t^t>>>15,1|t);return e=e+Math.imul(e^e>>>7,61|e)^e,((e^e>>>14)>>>0)/4294967296}}const Je=[new C(16720384),new C(61183),new C(22015),new C(16711884),new C(65382),new C(16737792),new C(11141375),new C(16770626)],Ve=32,ht=16,ho=6,Ne=ht+ho,Qe=Ve/2*Ne;class po{constructor(){l(this,"mesh");l(this,"mat")}create(t){const o=new E(5,1.4),a=new Float32Array(150*3),s=new Float32Array(150),n=new Float32Array(150);o.setAttribute("aColor",new $(a,3)),o.setAttribute("aFlickerSeed",new $(s,1)),o.setAttribute("aPulseMode",new $(n,1)),this.mat=new M({vertexShader:io,fragmentShader:ao,uniforms:{uTime:{value:0}},transparent:!0,depthWrite:!1,side:D,blending:O}),this.mesh=new le(o,this.mat,150),this.mesh.frustumCulled=!1;const r=fo(42),m=new Ie,f=new c,g=new Re,w=new c(1,1,1);let h=0;for(let v=0;v<Ve&&h<150;v++)for(let u=0;u<Ve&&h<150;u++){if(v%5===0||u%5===0||r()>.1)continue;const d=v*Ne-Qe,b=u*Ne-Qe,p=6+r()*12,P=Math.floor(r()*4),x=ht*.5+.3;let A=d,k=b,N=0;P===0?(k=b+x,N=0):P===1?(k=b-x,N=Math.PI):P===2?(A=d+x,N=Math.PI*.5):(A=d-x,N=-Math.PI*.5),f.set(A,p,k),g.setFromEuler(new Tt(0,N,0)),m.compose(f,g,w),this.mesh.setMatrixAt(h,m);const Y=Je[Math.floor(r()*Je.length)];a[h*3]=Y.r,a[h*3+1]=Y.g,a[h*3+2]=Y.b,s[h]=r();const K=r();n[h]=K<.6?0:K<.85?1:K<.95?2:3,h++}this.mesh.count=h,this.mesh.instanceMatrix.needsUpdate=!0,o.getAttribute("aColor").needsUpdate=!0,o.getAttribute("aFlickerSeed").needsUpdate=!0,o.getAttribute("aPulseMode").needsUpdate=!0,t.add(this.mesh)}update(t){this.mat.uniforms.uTime.value=t}}const mo=`
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
`;class go extends jt{constructor(t=.45){super("LensStreakEffect",mo,{uniforms:new Map([["uIntensity",new At(t)]])})}}class wo{constructor(){l(this,"composer");l(this,"glitch");l(this,"glitchTimeout",0)}setup(t,e,o){this.composer=new Gt(t);const a=new Ot(e,o),s=new zt({blendFunction:ye.ADD,luminanceThreshold:.25,luminanceSmoothing:.4,intensity:2.4,radius:.6}),n=new go(.45),r=new Wt({offset:new ee(.0018,.0012),radialModulation:!0,modulationOffset:.5}),m=new Bt({eskil:!1,offset:.35,darkness:.75}),f=new Ht({blendFunction:ye.OVERLAY,premultiply:!0});f.blendMode.opacity.value=.04;const g=new $t({blendFunction:ye.OVERLAY,density:1.4});return g.blendMode.opacity.value=.07,this.glitch=new Xt({delay:new ee(99999,99999),duration:new ee(.15,.35),strength:new ee(.15,.4),columns:.04,ratio:.85}),this.composer.addPass(a),this.composer.addPass(new xe(o,s,n)),this.composer.addPass(new xe(o,r,g,m,f)),this.composer.addPass(new xe(o,this.glitch)),this.composer}triggerGlitch(){this.glitch.delay.set(0,.05),clearTimeout(this.glitchTimeout),this.glitchTimeout=window.setTimeout(()=>{this.glitch.delay.set(99999,99999)},600)}resize(t,e){this.composer.setSize(t,e)}render(){this.composer.render()}}const G=[{pos:new c(0,180,220),look:new c(0,0,0),label:"HERO",t:0},{pos:new c(-40,12,110),look:new c(-20,20,60),label:"ABOUT",t:0},{pos:new c(-80,-8,55),look:new c(-80,-8,20),label:"PS3 GPU",t:0},{pos:new c(-75,30,-25),look:new c(-75,0,-25),label:"CPUonGPU",t:0},{pos:new c(-30,10,-60),look:new c(0,20,-90),label:"GPU Stream",t:0},{pos:new c(20,35,-80),look:new c(40,25,-110),label:"Selkies",t:0},{pos:new c(80,55,-70),look:new c(100,35,-100),label:"Oris AI",t:0},{pos:new c(110,40,0),look:new c(90,22,-20),label:"VajraGrid",t:0},{pos:new c(100,20,70),look:new c(70,14,50),label:"VidyaMitra",t:0},{pos:new c(50,16,100),look:new c(20,12,80),label:"Netflip",t:0},{pos:new c(10,22,90),look:new c(-20,16,70),label:"Arena",t:0},{pos:new c(-30,60,70),look:new c(-10,40,40),label:"Hackathon",t:0},{pos:new c(-60,8,30),look:new c(-40,8,0),label:"SKILLS",t:0},{pos:new c(0,120,160),look:new c(0,0,0),label:"CONTACT",t:0}],bo=1600;class yo{constructor(t){l(this,"camera");l(this,"posSpline");l(this,"lookSpline");l(this,"t",0);l(this,"currentSection",0);l(this,"mouseX",0);l(this,"mouseY",0);l(this,"_pos",new c);l(this,"_look",new c);l(this,"_ahead",new c);l(this,"onSectionChange");l(this,"_lastFiredSection",0);this.camera=t,this.buildSpline(),this.init()}buildSpline(){const t=G.map(a=>a.pos.clone()),e=G.map(a=>a.look.clone());this.posSpline=new Fe(t,!1,"catmullrom",.5),this.lookSpline=new Fe(e,!1,"catmullrom",.5);const o=G.length;G.forEach((a,s)=>{a.t=s/(o-1)}),this.t=0,this.posSpline.getPoint(0,this._pos),this.lookSpline.getPoint(0,this._look),this.camera.position.copy(this._pos),this.camera.lookAt(this._look)}init(){window.addEventListener("mousemove",o=>{this.mouseX=(o.clientX/window.innerWidth-.5)*2,this.mouseY=(o.clientY/window.innerHeight-.5)*2});let t=!1;window.addEventListener("wheel",o=>{if(t)return;t=!0;const a=o.deltaY>0?1:-1;this.goTo(this.currentSection+a),setTimeout(()=>{t=!1},bo)},{passive:!0});let e=0;window.addEventListener("touchstart",o=>{e=o.touches[0].clientY}),window.addEventListener("touchend",o=>{const a=e-o.changedTouches[0].clientY;Math.abs(a)>40&&this.goTo(this.currentSection+(a>0?1:-1))}),window.addEventListener("keydown",o=>{(o.key==="ArrowDown"||o.key==="ArrowRight")&&this.goTo(this.currentSection+1),(o.key==="ArrowUp"||o.key==="ArrowLeft")&&this.goTo(this.currentSection-1)})}goTo(t){if(t=Math.max(0,Math.min(G.length-1,t)),t===this.currentSection)return;const e=this.currentSection;this.currentSection=t;const o=G[t].t,s=.6+Math.abs(o-this.t)*5;te.killTweensOf(this),te.to(this,{t:o,duration:s,ease:"power2.inOut",onUpdate:()=>this._fireCrossings(e,t),onComplete:()=>{var n;this._lastFiredSection=t,(n=this.onSectionChange)==null||n.call(this,t),this._updateUI(t)}}),this._updateUI(t)}_fireCrossings(t,e){const o=e>t?1:-1;G.forEach((a,s)=>{var r;(o>0?this.t>=a.t&&s>this._lastFiredSection&&s<=e:this.t<=a.t&&s<this._lastFiredSection&&s>=e)&&(this._lastFiredSection=s,(r=this.onSectionChange)==null||r.call(this,s),this._updateUI(s))})}update(t){this.posSpline.getPoint(this.t,this._pos),this.camera.position.copy(this._pos);const e=Math.min(1,this.t+.015);this.posSpline.getPoint(e,this._ahead),this.lookSpline.getPoint(this.t,this._look);const o=this._look.x*.8+this._ahead.x*.2+this.mouseX*5,a=this._look.y*.8+this._ahead.y*.2-this.mouseY*3,s=this._look.z*.8+this._ahead.z*.2;this.camera.lookAt(o,a,s)}_updateUI(t){document.querySelectorAll(".nav-dot").forEach((o,a)=>o.classList.toggle("active",a===t));const e=document.getElementById("progress-bar");e&&(e.style.height=t/(G.length-1)*100+"%")}getCurrentSection(){return this.currentSection}}const ge=[{id:"ps3-gpu",title:"PS3 Cell GPU Emulator",subtitle:"Systems / Emulation",desc:"Full emulation of the Cell Broadband Engine's SPU pipeline in WebGL. 6 SPU cores, PPE scheduler, DMA bus — running real PS3 shaders in the browser at 200 GIPS.",tags:["C++","WebGL","GLSL","Cell BE","Emulation"],url:"https://github.com/aerosane",neonColor:"#00f5ff",district:"GPU DISTRICT",icon:"⬡"},{id:"cpuongpu",title:"CPUonGPU",subtitle:"Architecture Research",desc:"Runs a full x86 CPU simulation entirely on GPU compute shaders. Register file, ALU, cache hierarchy — all in GLSL. JIT-compiled x86 → SPIR-V at runtime.",tags:["GLSL","Compute Shaders","x86","JIT","SPIR-V"],url:"https://github.com/aerosane",neonColor:"#00f5ff",district:"GPU DISTRICT",icon:"⬢"},{id:"gpu-streaming",title:"GPU Streaming Pipeline",subtitle:"NvFBC + NVENC",desc:"Sub-frame-latency game streaming via NvFBC capture → NVENC H265/AV1 encode → WebRTC TURN relay. <1 frame E2E latency. Deployed on GitHub Codespace GPU.",tags:["NVENC","NvFBC","WebRTC","Rust","H265"],url:"https://github.com/Imperialorg/codespace",neonColor:"#00f5ff",district:"GPU DISTRICT",icon:"▶"},{id:"selkies-rust",title:"Selkies-Rust",subtitle:"Python→Rust Port",desc:"Complete rewrite of the Selkies WebRTC game streaming stack from Python into Rust. 6 crates: pipeline, signaling, input, encoding, metrics, CLI.",tags:["Rust","WebRTC","GStreamer","Tokio","GSAP"],url:"https://github.com/Imperialorg/codespace",neonColor:"#ff6b1a",district:"SYSTEMS CORRIDOR",icon:"⚙"},{id:"oris-ai",title:"Oris — AI SRE",subtitle:"🏆 Runner-up · TechSynapse 2026",desc:"Autonomous Site Reliability Engineer: ingests production logs, PII-masks with Presidio, infers root cause via Gemini 2.0, opens GitHub PRs with fixes. Zero human touch.",tags:["Python","Gemini 2.0","Presidio","LangChain","FastAPI"],url:"https://github.com/aerosane",neonColor:"#ff00aa",district:"AI DISTRICT",icon:"◈"},{id:"vajragrid",title:"VajraGrid",subtitle:"🇮🇳 India Innovates 2026 · Bharat Mandapam",desc:"AI-hardened power grid security: detects SCADA cyberattacks in 16s, 4-layer ML defense stack, adversarial training. Exhibited nationally at Bharat Mandapam.",tags:["Python","PyTorch","SCADA","Adversarial ML","GridSec"],url:"https://github.com/aerosane",neonColor:"#ff00aa",district:"AI DISTRICT",icon:"⚡"},{id:"vidyamitra",title:"VidyaMitra",subtitle:"IISER JEE Prep",desc:"AI tutor for JEE aspirants: adaptive quiz engine, LaTeX equation rendering, spaced repetition. Covers Physics, Chemistry, Math with difficulty auto-calibration.",tags:["TypeScript","React","LaTeX","OpenAI","Supabase"],url:"https://github.com/aerosane",neonColor:"#00ff88",district:"EDTECH ZONE",icon:"⬟"},{id:"netflip",title:"Netflip VOD",subtitle:"Full-Stack Streaming",desc:"Netflix-clone with HLS adaptive streaming, Azure Blob CDN, Fastly edge cache, WebSocket live chat, OAuth2, recommendation engine. 1080p adaptive bitrate.",tags:["Next.js","HLS","Azure","Fastly","PostgreSQL"],url:"https://github.com/aerosane",neonColor:"#7b2fff",district:"WEB DISTRICT",icon:"▨"},{id:"coding-arena",title:"Coding Arena",subtitle:"Competitive Judging Platform",desc:"Online judge with isolated Docker execution, multi-language support, real-time leaderboard, plagiarism detection via AST similarity. 200ms median judge latency.",tags:["Go","Docker","Redis","React","WebSocket"],url:"https://github.com/aerosane",neonColor:"#7b2fff",district:"WEB DISTRICT",icon:"{ }"},{id:"hackathon",title:"Hackathon Wins",subtitle:"Hall of Fame",desc:"🏆 Runner-up at TechSynapse 2026 (Oris AI SRE). 🇮🇳 National exhibition at India Innovates 2026, Bharat Mandapam, New Delhi (VajraGrid). 1st year, two nationals.",tags:["Oris AI","VajraGrid","TechSynapse","India Innovates"],url:"https://github.com/aerosane",neonColor:"#ffe642",district:"HALL OF FAME",icon:"🏆"}],xo={Languages:["C++","Rust","Python","TypeScript","Go","GLSL/HLSL"],Systems:["WebRTC","WebGL/WebGPU","NVENC/NvFBC","Docker","Linux"],"AI/ML":["PyTorch","Gemini API","LangChain","Presidio","HuggingFace"],Web:["React","Next.js","Vite","Node.js","PostgreSQL","Redis"],Tools:["Git","GitHub Actions","Azure","GStreamer","Tokio"]};class ve{constructor(){l(this,"group",new dt);l(this,"hoverTargets",[]);l(this,"visible",!1);l(this,"visibleValue",0)}enter(){this.group.visible=!0,this.visible=!0,te.killTweensOf(this),te.to(this,{visibleValue:1,duration:1.4,ease:"power2.out",onUpdate:()=>this.setVisible(this.visibleValue)})}exit(){this.visible=!1,te.killTweensOf(this),te.to(this,{visibleValue:0,duration:.8,ease:"power2.in",onUpdate:()=>this.setVisible(this.visibleValue),onComplete:()=>{this.group.visible=!1}})}setVisible(t){}dispose(){this.group.traverse(t=>{t.geometry&&t.geometry.dispose()})}}let z=null;function So(){return z||(z=document.createElement("div"),z.id="env-detail-panel",Object.assign(z.style,{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%, -50%) scale(0.92)",background:"rgba(4,6,20,0.92)",border:"1px solid var(--neon, #00f5ff)",boxShadow:"0 0 32px var(--neon, #00f5ff)44",padding:"28px 36px",maxWidth:"480px",width:"90vw",zIndex:"9999",fontFamily:"monospace",color:"#e8f4ff",opacity:"0",pointerEvents:"none",transition:"opacity 0.3s, transform 0.3s",borderRadius:"4px"}),document.body.appendChild(z),document.addEventListener("click",i=>{z&&!z.contains(i.target)&&Oe()}),z)}function Ge(i){var e;const t=So();t.style.setProperty("--neon",i.neonColor),t.style.borderColor=i.neonColor+"88",t.style.boxShadow=`0 0 40px ${i.neonColor}33`,t.innerHTML=`
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
  `,(e=t.querySelector("#env-panel-close"))==null||e.addEventListener("click",o=>{o.stopPropagation(),Oe()}),t.style.pointerEvents="all",t.style.opacity="1",t.style.transform="translate(-50%, -50%) scale(1)"}function Oe(){const i=z;i&&(i.style.opacity="0",i.style.transform="translate(-50%, -50%) scale(0.92)",i.style.pointerEvents="none")}function ze(i,t,e){const s=document.createElement("canvas");s.width=512,s.height=64;const n=s.getContext("2d");n.clearRect(0,0,512,64),n.font="bold 20px monospace",n.textAlign="center",n.shadowColor=t;for(const g of[24,12,6])n.shadowBlur=g,n.fillStyle=t,n.fillText(i,512/2,34);n.shadowBlur=0,n.fillStyle="#ffffff",n.fillText(i,512/2,34),n.font="11px monospace",n.shadowBlur=6,n.shadowColor=t,n.fillStyle=t,n.fillText("▶  CLICK FOR DETAILS",512/2,54);const r=new _e(s),m=new R({map:r,transparent:!0,depthWrite:!1,side:D,alphaTest:.02}),f=new y(new E(9,1.2),m);return f.userData.isLabel=!0,f.userData.onClick=e,f.onBeforeRender=(g,w,h)=>f.quaternion.copy(h.quaternion),f}const U=new c(-80,-8,38),Co=`
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
`,Po=`
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
`,Mo=`
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
`,et=`
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
`,se="varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }";class To extends ve{constructor(){super(...arguments);l(this,"rackMat");l(this,"floorMat");l(this,"busMats",[]);l(this,"ringMats",[]);l(this,"ppeMat")}create(e){e.add(this.group),this.floorMat=new M({vertexShader:se,fragmentShader:Po.replace("col =","vec3 col ="),uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0});const o=new y(new E(64,54),this.floorMat);o.rotation.x=-Math.PI/2,o.position.set(U.x,U.y-6,U.z),this.group.add(o),this.rackMat=new M({vertexShader:se,fragmentShader:Co,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0});const a=[[-18,-9,10],[-12,-9,10],[-6,-9,10],[0,-9,10],[-18,-9,-10],[-12,-9,-10],[-6,-9,-10],[0,-9,-10]];for(const[u,d,b]of a){const p=new y(new oe(4,24,6),this.rackMat);p.position.set(U.x+u,U.y+d+12,U.z+b),this.group.add(p)}const s=new R({color:65450,transparent:!0,opacity:.7});for(let u=0;u<3;u++){const d=new y(new E(42,.5),s.clone());d.rotation.x=Math.PI/2,d.position.set(U.x-9,U.y+5.8,U.z-8+u*8),this.group.add(d)}const n=new c(U.x+14,U.y+2,U.z);this.ppeMat=new R({color:62975,wireframe:!0,transparent:!0,opacity:.9});const r=new y(new kt(2.8,1),this.ppeMat);r.position.copy(n),this.group.add(r),r.userData.rotating=!0;const m=new M({vertexShader:se,fragmentShader:et,uniforms:{uTime:{value:0},uVisible:{value:0},uRadius:{value:.42},uColor:{value:new C(62975)}},transparent:!0,depthWrite:!1,side:D}),f=new y(new E(14,14),m);f.rotation.x=-Math.PI/2,f.position.set(n.x,n.y,n.z),this.group.add(f),this.ringMats.push(m);const g=new R({color:3800852,wireframe:!0,transparent:!0,opacity:.85}),w=[];for(let u=0;u<6;u++){const d=u/6*Math.PI*2,b=new c(n.x+Math.cos(d)*6,n.y,n.z+Math.sin(d)*6);w.push(b);const p=new y(new ie(.9,.9,.5,6),g.clone());p.position.copy(b),this.group.add(p);const P=new M({vertexShader:se,fragmentShader:et,uniforms:{uTime:{value:0},uVisible:{value:0},uRadius:{value:.46},uColor:{value:new C(3800852)}},transparent:!0,depthWrite:!1,side:D}),x=new y(new E(4,4),P);x.rotation.x=-Math.PI/2,x.position.copy(b),this.group.add(x),this.ringMats.push(P)}for(let u=0;u<6;u++){const d=new Et(n,w[u]),b=new vt(d,20,.12,6,!1),p=new M({vertexShader:se,fragmentShader:Mo,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0,depthWrite:!1,blending:O});p.uniforms.uTime.value=u*.16,this.group.add(new y(b,p)),this.busMats.push(p)}const h=ge[0],v=ze(h.title,h.neonColor,()=>Ge(h));v.position.set(n.x+5,n.y+8,n.z),v.scale.setScalar(1.8),this.group.add(v)}update(e){this.rackMat.uniforms.uTime.value=e,this.floorMat.uniforms.uTime.value=e,this.ringMats.forEach(o=>o.uniforms.uTime.value=e),this.busMats.forEach((o,a)=>o.uniforms.uTime.value=e+a*.16),this.group.traverse(o=>{o.userData.rotating&&(o.rotation.y+=.008,o.rotation.x+=.003)})}setVisible(e){this.rackMat.uniforms.uVisible.value=e,this.floorMat.uniforms.uVisible.value=e,this.ringMats.forEach(o=>o.uniforms.uVisible.value=e),this.busMats.forEach(o=>o.uniforms.uVisible.value=e),this.ppeMat&&(this.ppeMat.opacity=e*.9)}onHover(){}}const T=new c(-75,0,-25),Ao=`
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
  // --- POWER BUS (thick horizontal, left to right across middle) ---
  float d;
  d=sdSeg(uv,vec2(0.05,0.50),vec2(0.95,0.50)); if(d<best){best=d;tId=0.;tPos=(uv.x-0.05)/0.90;}
  // --- VDD rail (top) ---
  d=sdSeg(uv,vec2(0.05,0.82),vec2(0.95,0.82)); if(d<best){best=d;tId=1.;tPos=(uv.x-0.05)/0.90;}
  // --- GND rail (bottom) ---
  d=sdSeg(uv,vec2(0.05,0.18),vec2(0.95,0.18)); if(d<best){best=d;tId=2.;tPos=(uv.x-0.05)/0.90;}
  // --- CPU to GPU data bus (L-route: down then across) ---
  d=sdSeg(uv,vec2(0.28,0.68),vec2(0.28,0.50)); if(d<best){best=d;tId=3.;tPos=(0.68-uv.y)/0.18;}
  d=sdSeg(uv,vec2(0.28,0.50),vec2(0.62,0.50)); if(d<best){best=d;tId=3.;tPos=0.5+(uv.x-0.28)/0.68;}
  d=sdSeg(uv,vec2(0.62,0.50),vec2(0.62,0.65)); if(d<best){best=d;tId=3.;tPos=0.8+(uv.y-0.50)/0.30;}
  // --- CPU cache bus (vertical left side) ---
  d=sdSeg(uv,vec2(0.22,0.35),vec2(0.22,0.65)); if(d<best){best=d;tId=4.;tPos=(uv.y-0.35)/0.30;}
  // --- GPU shader bus (multiple parallel horizontals on right) ---
  d=sdSeg(uv,vec2(0.58,0.55),vec2(0.92,0.55)); if(d<best){best=d;tId=5.;tPos=(uv.x-0.58)/0.34;}
  d=sdSeg(uv,vec2(0.58,0.58),vec2(0.92,0.58)); if(d<best){best=d;tId=6.;tPos=(uv.x-0.58)/0.34;}
  d=sdSeg(uv,vec2(0.58,0.61),vec2(0.92,0.61)); if(d<best){best=d;tId=7.;tPos=(uv.x-0.58)/0.34;}
  // --- Differential pair (close parallel traces) ---
  d=sdSeg(uv,vec2(0.10,0.35),vec2(0.45,0.35)); if(d<best){best=d;tId=8.;tPos=(uv.x-0.10)/0.35;}
  d=sdSeg(uv,vec2(0.10,0.37),vec2(0.45,0.37)); if(d<best){best=d;tId=9.;tPos=(uv.x-0.10)/0.35;}
  // --- VIA connect stubs ---
  d=sdSeg(uv,vec2(0.50,0.50),vec2(0.50,0.35)); if(d<best){best=d;tId=10.;tPos=(0.50-uv.y)/0.15;}
  d=sdSeg(uv,vec2(0.35,0.50),vec2(0.35,0.65)); if(d<best){best=d;tId=11.;tPos=(uv.y-0.50)/0.15;}
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
  float TRACE_W   = 0.005;
  float POWER_W   = 0.009;
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
      col += eCol * electron * traceMask * 4.0;
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
`,ko=`
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
`,tt="varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }";class Eo extends ve{constructor(){super(...arguments);l(this,"pcbMat");l(this,"pipeMat")}create(e){e.add(this.group),this.pcbMat=new M({vertexShader:tt,fragmentShader:Ao,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0});const o=new y(new E(70,70),this.pcbMat);o.rotation.x=-Math.PI/2,o.position.copy(T),this.group.add(o),this.pipeMat=new M({vertexShader:tt,fragmentShader:ko,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0,depthWrite:!1,side:D});const a=new y(new E(26,8),this.pipeMat);a.position.set(T.x,T.y+12,T.z),a.rotation.x=-.2,this.group.add(a);const s=new y(new oe(11.2,.9,14),new R({color:658966}));s.position.set(T.x-17,T.y+.45,T.z+1.5),this.group.add(s);const n=new y(new E(9,12),new R({color:399368}));n.rotation.x=-Math.PI/2,n.position.set(T.x-17,T.y+.92,T.z+1.5),this.group.add(n);const r=new y(new oe(14,1.1,11.2),new R({color:395796}));r.position.set(T.x+7,T.y+.55,T.z-2),this.group.add(r);const m=new R({color:13150272});for(let v=0;v<2;v++)for(let u=0;u<14;u++){const d=new y(new oe(.4,.3,.6),m);d.position.set(T.x-22+v*18,T.y+.15,T.z-5+u),this.group.add(d)}const f=new R({color:9136404}),g=[[-10,-8],[-10,4],[-5,-8],[-5,4],[2,-6],[2,2],[12,-6],[12,2]];for(const[v,u]of g){const d=new y(new ie(.5,.5,.8,8),f);d.position.set(T.x+v,T.y+.4,T.z+u),this.group.add(d)}const w=ge[1],h=ze(w.title,w.neonColor,()=>Ge(w));h.position.set(T.x-14,T.y+6,T.z+16),h.rotation.x=-.4,this.group.add(h)}update(e){this.pcbMat.uniforms.uTime.value=e,this.pipeMat.uniforms.uTime.value=e}setVisible(e){this.pcbMat.uniforms.uVisible.value=e,this.pipeMat.uniforms.uVisible.value=e}onHover(){}}const S=new c(-10,10,-80),Io=`
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
`,Ro=`
uniform float uTime;
uniform float uScale;
void main() {
  vec3 pos = position * (1.0 + uScale * 0.3 + sin(uTime) * 0.05 * uScale);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`,Fo=`
uniform float uTime;
uniform float uScale;
uniform float uVisible;
void main() {
  float fade = 1.0 - uScale * 0.28;
  float pulse = 0.5 + 0.5 * sin(uTime * 2.0 - uScale * 2.0);
  vec3 col = vec3(1.0, 0.1, 0.6) * (fade + 0.3 * pulse);
  gl_FragColor = vec4(col, fade * 0.7 * uVisible);
}
`,Lo=`
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
`;function Pe(i,t,e,o){const a=new R({color:8947848}),s=new y(new ie(.2,.3,20,8),a);s.position.set(t,e+10,o),i.add(s);for(let r=0;r<4;r++){const m=new y(new ie(.08,.08,4-r*.6,6),a);m.rotation.z=Math.PI/2,m.position.set(t,e+4+r*4,o),i.add(m)}const n=new y(new ut(.3,8,8),new R({color:16720384}));n.position.set(t,e+21,o),i.add(n)}class Vo extends ve{constructor(){super(...arguments);l(this,"mats",[]);l(this,"rings",[])}create(e){e.add(this.group),Pe(this.group,S.x-20,S.y-4,S.z),Pe(this.group,S.x+15,S.y-4,S.z-10),Pe(this.group,S.x+5,S.y-4,S.z+20);for(let g=0;g<4;g++){const w=new It(6+g*7,6.4+g*7,48),h=new M({vertexShader:Ro,fragmentShader:Fo,uniforms:{uTime:{value:0},uScale:{value:g},uVisible:{value:0}},transparent:!0,depthWrite:!1,side:D,blending:O}),v=new y(w,h);v.rotation.x=-Math.PI/2,v.position.set(S.x-20,S.y+6,S.z),this.group.add(v),this.rings.push({mesh:v,mat:h,delay:g*.4}),this.mats.push(h)}const o=new Fe([new c(S.x-20,S.y+8,S.z),new c(S.x-5,S.y+12,S.z-5),new c(S.x+18,S.y+6,S.z+5)]),a=new vt(o,60,.15,6,!1),s=new M({vertexShader:"varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",fragmentShader:Io,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0,depthWrite:!1,blending:O});this.group.add(new y(a,s)),this.mats.push(s);const n=new M({vertexShader:"varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",fragmentShader:Lo,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0}),r=new y(new E(28,14),n);r.position.set(S.x+18,S.y+8,S.z+5),r.rotation.y=-.6,this.group.add(r),this.mats.push(n);const m=ge[2],f=ze(m.title,m.neonColor,()=>Ge(m));f.position.set(S.x-20,S.y+24,S.z),f.scale.setScalar(1.8),this.group.add(f)}update(e){for(const o of this.mats)o.uniforms.uTime.value=e}setVisible(e){for(const o of this.mats)o.uniforms.uVisible.value=e}onHover(){}}const H=new c(95,40,-90),No=`
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
`,Uo=`
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
`,_o=`
attribute float aEdgePhase;
varying float vEdgePhase;
varying float vT;        // 0=start vertex, 1=end vertex (from position along segment)
void main() {
  vEdgePhase = aEdgePhase;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,Do=`
uniform float uTime;
uniform float uVisible;
varying float vEdgePhase;
void main() {
  float t   = fract(uTime * 0.7 + vEdgePhase);
  float pulse = exp(-abs(t - 0.5) * 9.0);
  vec3 col  = mix(vec3(0.25, 0.0, 0.6), vec3(1.0, 0.5, 1.0), pulse);
  float alpha = (0.25 + 0.75 * pulse * 1.4) * uVisible;
  gl_FragColor = vec4(col, alpha);
}
`,Go="varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",Oo=`
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
`,ue=class ue extends ve{constructor(){super(...arguments);l(this,"nodeMat");l(this,"edgeMat");l(this,"floorMat");l(this,"logTexture");l(this,"logCanvas");l(this,"logCtx");l(this,"logLines",[]);l(this,"logTimer",0);l(this,"anomalyTimer",0);l(this,"currentAnomaly",-1)}create(e){e.add(this.group);const o=new M({vertexShader:Go,fragmentShader:Oo,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0,depthWrite:!1,side:D}),a=new y(new E(90,90),o);a.rotation.x=-Math.PI/2,a.position.set(H.x,H.y-18,H.z),this.group.add(a),this.floorMat=o;const s=5,n=8,r=[],m=new Float32Array(s*n),f=new Float32Array(s*n);for(let p=0;p<s;p++)for(let P=0;P<n;P++){const x=p*n+P;r.push(new c(H.x+(p-2)*8,H.y+(P-n/2+.5)*5.5,H.z)),m[x]=x,f[x]=Math.random()}const g=new Float32Array(r.flatMap(p=>[p.x,p.y,p.z])),w=new de;w.setAttribute("position",new V(g,3)),w.setAttribute("aNodeId",new V(m,1)),w.setAttribute("aActivation",new V(f,1)),this.nodeMat=new M({vertexShader:No,fragmentShader:Uo,uniforms:{uTime:{value:0},uVisible:{value:0},uAnomalyNode:{value:-1}},transparent:!0,depthWrite:!1,blending:O}),this.group.add(new De(w,this.nodeMat));const h=[],v=[];for(let p=0;p<s-1;p++)for(let P=0;P<n;P++)for(let x=0;x<n;x++){if(Math.random()>.3)continue;const A=r[p*n+P],k=r[(p+1)*n+x];h.push(A.x,A.y,A.z,k.x,k.y,k.z);const N=Math.random();v.push(N,N)}const u=new de;u.setAttribute("position",new V(new Float32Array(h),3)),u.setAttribute("aEdgePhase",new V(new Float32Array(v),1)),this.edgeMat=new M({vertexShader:_o,fragmentShader:Do,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0,depthWrite:!1,blending:O}),this.group.add(new ft(u,this.edgeMat)),this.logCanvas=document.createElement("canvas"),this.logCanvas.width=512,this.logCanvas.height=320,this.logCtx=this.logCanvas.getContext("2d"),this.logTexture=new _e(this.logCanvas),this.drawLog();const d=new R({map:this.logTexture,transparent:!0,depthWrite:!1,side:D}),b=new y(new E(16,10),d);b.position.set(H.x+16,H.y-2,H.z+4),b.rotation.y=-.5,this.group.add(b)}drawLog(){const e=this.logCtx,o=512,a=320;e.clearRect(0,0,o,a),e.fillStyle="rgba(4, 0, 18, 0.92)",e.fillRect(0,0,o,a);for(let n=0;n<a;n+=3)e.fillStyle="rgba(0,0,0,0.18)",e.fillRect(0,n,o,1);e.font="12px monospace";const s=this.logLines.slice(-20);for(let n=0;n<s.length;n++){const r=s[n];e.fillStyle=r.startsWith("ERROR")?"#ff4455":r.startsWith("WARN")?"#ffaa22":"#22ee88",e.shadowColor=e.fillStyle,e.shadowBlur=4,e.fillText(r,10,18+n*15)}e.fillStyle="#b000ff",e.shadowColor="#b000ff",e.shadowBlur=8,e.fillText("▋",10,18+s.length*15),this.logTexture.needsUpdate=!0}update(e){this.nodeMat.uniforms.uTime.value=e,this.edgeMat.uniforms.uTime.value=e,this.floorMat.uniforms.uTime.value=e,this.logTimer+=1/60,this.logTimer>.75&&(this.logTimer=0,this.logLines.push(ue.LOG_POOL[Math.floor(Math.random()*ue.LOG_POOL.length)]),this.drawLog()),this.anomalyTimer+=1/60,this.currentAnomaly===-1&&this.anomalyTimer>5?(this.anomalyTimer=0,this.currentAnomaly=Math.floor(Math.random()*40),this.nodeMat.uniforms.uAnomalyNode.value=this.currentAnomaly,this.logLines.push(`ERROR anomaly on node_${this.currentAnomaly}`),this.drawLog()):this.currentAnomaly!==-1&&this.anomalyTimer>2.5&&(this.anomalyTimer=0,this.logLines.push(`INFO  node_${this.currentAnomaly} resolved ✓`),this.drawLog(),this.currentAnomaly=-1,this.nodeMat.uniforms.uAnomalyNode.value=-1)}setVisible(e){this.nodeMat.uniforms.uVisible.value=e,this.edgeMat.uniforms.uVisible.value=e,this.floorMat.uniforms.uVisible.value=e,this.group.traverse(o=>{const a=o.material;(a==null?void 0:a.map)===this.logTexture&&(a.opacity=e)})}onHover(){}};l(ue,"LOG_POOL",["INFO  processing log batch #4821","INFO  PII masking: email→[REDACTED]","WARN  anomaly score: 0.82 (thresh 0.75)","ERROR latency spike: 3.2s on node_07","INFO  filing GitHub PR #89 auto-patch","INFO  LLM class: INCIDENT_RESOLVED","INFO  alert: slack #oncall notified","INFO  MTTR: 16s — system healed","INFO  model confidence: 0.96","WARN  CPU spike 94% → gpu-04 offload"]);let Ue=ue;const _=new c(100,22,-10),zo=`
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
`,Wo=`
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
`,Bo=`
attribute float aLinePhase;
varying float vLinePhase;
void main() {
  vLinePhase = aLinePhase;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,Ho=`
uniform float uTime;
uniform float uVisible;
varying float vLinePhase;
void main() {
  float t     = fract(uTime * 0.5 + vLinePhase);
  float pulse = exp(-abs(t - 0.5) * 10.0);
  vec3 col    = mix(vec3(0.0, 0.5, 0.9), vec3(0.8, 1.0, 1.0), pulse);
  gl_FragColor = vec4(col, (0.2 + 0.8 * pulse * 1.3) * uVisible);
}
`,$o="varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",Xo=`
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
`,jo="varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",qo=`
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
`,Yo="varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",Ko=`
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
`,Me=[[0,28],[16,18],[22,-6],[11,-22],[-11,-22],[-22,-6],[-16,18],[0,6],[8,-8],[-8,-8]];class Zo extends ve{constructor(){super(...arguments);l(this,"nodeMat");l(this,"lineMat");l(this,"attackMat");l(this,"shieldMats",[]);l(this,"gridMat");l(this,"nodeStates");l(this,"nodeAttr");l(this,"attackTimer",3);l(this,"attackActive",!1);l(this,"attackWave",1);l(this,"infectedNode",-1)}create(e){e.add(this.group),this.gridMat=new M({vertexShader:Yo,fragmentShader:Ko,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0,depthWrite:!1,side:D});const o=new y(new E(80,80),this.gridMat);o.rotation.x=-Math.PI/2,o.position.set(_.x,_.y-6,_.z),this.group.add(o);const a=Me.length,s=new Float32Array(a*3);this.nodeStates=new Float32Array(a);const n=new Float32Array(a);Me.forEach(([v,u],d)=>{s[d*3]=_.x+v,s[d*3+1]=_.y-2,s[d*3+2]=_.z+u,n[d]=Math.random()*Math.PI*2});const r=new de;r.setAttribute("position",new V(s,3)),this.nodeAttr=new V(this.nodeStates,1),r.setAttribute("aState",this.nodeAttr),r.setAttribute("aPhase",new V(n,1)),this.nodeMat=new M({vertexShader:zo,fragmentShader:Wo,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0,depthWrite:!1,blending:O}),this.group.add(new De(r,this.nodeMat));const m=[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,0],[7,0],[7,1],[7,6],[8,2],[8,3],[8,7],[9,4],[9,5],[9,7]],f=[],g=[];m.forEach(([v,u])=>{const d=v*3,b=u*3;f.push(s[d],s[d+1],s[d+2]),f.push(s[b],s[b+1],s[b+2]);const p=Math.random();g.push(p,p)});const w=new de;w.setAttribute("position",new V(new Float32Array(f),3)),w.setAttribute("aLinePhase",new V(new Float32Array(g),1)),this.lineMat=new M({vertexShader:Bo,fragmentShader:Ho,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0,depthWrite:!1,blending:O}),this.group.add(new ft(w,this.lineMat)),this.attackMat=new M({vertexShader:$o,fragmentShader:Xo,uniforms:{uTime:{value:0},uVisible:{value:0},uWave:{value:1},uOrigin:{value:new ee(.5,.5)}},transparent:!0,depthWrite:!1,blending:O,side:D});const h=new y(new E(80,80),this.attackMat);h.rotation.x=-Math.PI/2,h.position.set(_.x,_.y-5.5,_.z),this.group.add(h);for(let v=0;v<4;v++){const u=(v+1)*9,d=new M({vertexShader:jo,fragmentShader:qo,uniforms:{uTime:{value:0},uVisible:{value:0},uLayer:{value:v}},transparent:!0,depthWrite:!1,blending:O,side:D}),b=new y(new E(u*2,u*2),d);b.rotation.x=-Math.PI/2,b.position.set(_.x,_.y-5+v*.3,_.z),this.group.add(b),this.shieldMats.push(d)}}update(e){if(this.nodeMat.uniforms.uTime.value=e,this.lineMat.uniforms.uTime.value=e,this.attackMat.uniforms.uTime.value=e,this.gridMat.uniforms.uTime.value=e,this.shieldMats.forEach(o=>o.uniforms.uTime.value=e),this.attackTimer-=1/60,!this.attackActive&&this.attackTimer<=0){this.infectedNode=Math.floor(Math.random()*7),this.nodeStates[this.infectedNode]=1,this.nodeAttr.needsUpdate=!0,this.attackWave=0,this.attackActive=!0;const[o,a]=Me[this.infectedNode];this.attackMat.uniforms.uOrigin.value.set(.5+o/60,.5+a/60)}this.attackActive&&(this.attackWave+=.003,this.attackMat.uniforms.uWave.value=this.attackWave,this.attackWave>.45&&this.infectedNode>=0&&this.nodeStates[this.infectedNode]===1&&(this.nodeStates[this.infectedNode]=2,this.nodeAttr.needsUpdate=!0),this.attackWave>=.9&&(this.infectedNode>=0&&(this.nodeStates[this.infectedNode]=0,this.nodeAttr.needsUpdate=!0,this.infectedNode=-1),this.attackActive=!1,this.attackTimer=5+Math.random()*3))}setVisible(e){this.nodeMat.uniforms.uVisible.value=e,this.lineMat.uniforms.uVisible.value=e,this.attackMat.uniforms.uVisible.value=e,this.gridMat.uniforms.uVisible.value=e,this.shieldMats.forEach(o=>o.uniforms.uVisible.value=e)}onHover(){}}const Jo=new Set([2,3]);class Qo{constructor(t,e){l(this,"envs",new Map);l(this,"activeEnv",null);l(this,"activeIdx",-1);l(this,"cityGroup");l(this,"cityVisible",!0);this.cityGroup=e;const o=[[2,new To],[3,new Eo],[4,new Vo],[6,new Ue],[7,new Zo]];for(const[a,s]of o)s.create(t),s.group.visible=!1,this.envs.set(a,s)}onSection(t){if(t===this.activeIdx)return;this.activeIdx=t,this.activeEnv&&(this.activeEnv.exit(),this.activeEnv=null);const e=Jo.has(t);e&&this.cityVisible?(this.cityVisible=!1,this.cityGroup.visible=!1):!e&&!this.cityVisible&&(this.cityVisible=!0,this.cityGroup.visible=!0);const o=this.envs.get(t);o&&(this.activeEnv=o,o.enter())}update(t){this.activeEnv&&this.activeEnv.update(t)}}const ei=document.getElementById("scene-canvas"),ae=new Rt({canvas:ei,antialias:!0,alpha:!1,powerPreference:"high-performance"});ae.setPixelRatio(Math.min(devicePixelRatio,2));ae.setSize(innerWidth,innerHeight);ae.toneMapping=Ft;ae.toneMappingExposure=.95;const F=new Lt;F.background=new C(131602);F.fog=new Vt(197400,.003);const q=new Nt(60,innerWidth/innerHeight,.5,1200),we=new wo;we.setup(ae,F,q);const We=new vo;We.create(F);const j=new lo;j.generate(F);j.addAntennas(F);const ti=ge.map((i,t)=>{const e=G[t+2];return{text:i.district,pos:new c(e.pos.x+12,80,e.pos.z-18),color:i.neonColor}});j.addNeonSigns(F,ti);const pt=new po;pt.create(F);const Be=new co;Be.create(F);const mt=new uo;mt.create(F);const oi=new Ut(128,0,.4);F.add(oi);const He=new dt;F.add(He);var rt,lt;(lt=(rt=j.cityGroup)==null?void 0:rt.children)==null||lt.forEach(i=>He.add(i));const gt=new Qo(F,He),me=new C(62975);function ii(i){const t=Math.min(i,Le.length-1);me.copy(Le[t]),Be.setDistrictNeon(me),We.update(0,q.position,me)}const $e=new yo(q);$e.onSectionChange=i=>{si(i),ni(i),ii(i),we.triggerGlitch(),gt.onSection(i)};const ai=document.getElementById("nav-dots");G.forEach((i,t)=>{const e=document.createElement("div");e.className="nav-dot"+(t===0?" active":""),e.title=i.label,e.addEventListener("click",()=>$e.goTo(t)),ai.appendChild(e)});function si(i){document.querySelectorAll(".sect").forEach((t,e)=>{t.classList.toggle("active",e===i)}),document.querySelectorAll(".nav-dot").forEach((t,e)=>{t.classList.toggle("active",e===i)})}function ni(i){const t=document.getElementById("hud-section");t&&(t.textContent=`DISTRICT_${String(i).padStart(2,"0")} / ${G[i].label}`)}const ot=document.getElementById("skills-grid");ot&&Object.entries(xo).forEach(([i,t])=>{const e=document.createElement("div");e.className="skill-cat",e.innerHTML=`<div class="skill-cat-name">// ${i}</div>`+t.map(o=>`<div class="skill-item">${o}</div>`).join(""),ot.appendChild(e)});const X=document.getElementById("contact-input"),pe=document.getElementById("contact-input-display");var ct;(ct=document.getElementById("sect-13"))==null||ct.addEventListener("click",()=>X==null?void 0:X.focus());X==null||X.addEventListener("input",()=>{pe&&(pe.textContent=(X.value||"")+"_"),X.value.trim().toLowerCase()==="sudo"&&(ri(),X.value="",pe&&(pe.textContent="_"))});function ri(){const i=document.querySelector("#sect-13 .terminal-body");if(!i)return;const t=document.createElement("p");t.className="output neon-green",t.textContent="> Permission granted. Downloading your future...",i.appendChild(t),setTimeout(()=>{const e=document.createElement("p");e.className="output",e.innerHTML='<span style="color:#ffe642">root@neon-district:~# ██████████ 100%  COMPLETE</span>',i.appendChild(e)},1500)}const it=["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];let ne=0;window.addEventListener("keydown",i=>{i.key===it[ne]?ne++:ne=0,ne===it.length&&(ne=0,li())});let Te=!1;function li(){Te=!Te,[j.meshA,j.meshB,j.meshC].forEach(i=>{const t=i.material;t.wireframe=Te})}const Ae=document.getElementById("boot-log"),at=document.getElementById("boot-bar"),re=document.getElementById("loading-screen"),ke=["Initializing WebGPU context","Generating city geometry","Compiling 47 shader programs","Spawning rain particles","Calibrating post-processing chain","System ready"];async function ci(){for(let i=0;i<ke.length;i++){await new Promise(e=>setTimeout(e,260+Math.random()*200));const t=document.createElement("p");t.innerHTML=`<span style="color:rgba(0,245,255,.5)">[BOOT]</span> ${ke[i]}... <span class="ok">[OK]</span>`,Ae==null||Ae.appendChild(t),at&&(at.style.width=(i+1)/ke.length*100+"%")}await new Promise(i=>setTimeout(i,600)),re==null||re.classList.add("fade-out"),setTimeout(()=>{re&&(re.style.display="none")},850)}ci();const st=new _t,Ee=new ee;window.addEventListener("click",i=>{if(i.target.closest("#env-detail-panel"))return;Ee.x=i.clientX/innerWidth*2-1,Ee.y=-(i.clientY/innerHeight)*2+1,st.setFromCamera(Ee,q);const t=st.intersectObjects(F.children,!0);for(const e of t){const o=e.object;if(o.userData.isLabel&&o.userData.onClick){o.userData.onClick();return}}Oe()});window.addEventListener("resize",()=>{q.aspect=innerWidth/innerHeight,q.updateProjectionMatrix(),ae.setSize(innerWidth,innerHeight),we.resize(innerWidth,innerHeight)});const nt=new Dt;function wt(){requestAnimationFrame(wt);const i=nt.getElapsedTime(),t=nt.getDelta();j.update(i),Be.update(i),mt.update(i,q.position),pt.update(i),We.update(i,q.position,me),$e.update(t),gt.update(i),we.render()}wt();
