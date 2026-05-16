var rt=Object.defineProperty;var lt=(t,e,o)=>e in t?rt(t,e,{enumerable:!0,configurable:!0,writable:!0,value:o}):t[e]=o;var c=(t,e,o)=>lt(t,typeof e!="symbol"?e+"":e,o);import{i as d,d as we,I as R,q as K,j as Le,s as ye,a2 as r,Q as be,u as _,C as qe,x as re,m as Xe,t as ee,X as te,f as Ye,e as se,a as Z,y as Ke,Y as ct,B as dt,E as ut,a1 as j,_ as ht,g as Re,G as xe,p as ft,z as pt,a5 as mt,A as vt,W as gt,o as wt,P as yt,H as bt,S as Ct,h as St}from"./three-uBnUpQ-C.js";import{b as xt,R as Pt,a as At,B as de,C as Tt,V as Et,N as kt,S as Mt,G as It,c as ue,E as Lt}from"./postprocessing-DQ1XEIde.js";import{g as V}from"./gsap-SFc2wnMY.js";(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))i(n);new MutationObserver(n=>{for(const s of n)if(s.type==="childList")for(const l of s.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&i(l)}).observe(document,{childList:!0,subtree:!0});function o(n){const s={};return n.integrity&&(s.integrity=n.integrity),n.referrerPolicy&&(s.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?s.credentials="include":n.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function i(n){if(n.ep)return;n.ep=!0;const s=o(n);fetch(n.href,s)}})();function Ne(t){return t*t*t*(t*(t*6-15)+10)}function he(t,e,o){return t+o*(e-t)}function oe(t,e,o){const i=t&3,n=i<2?e:o,s=i<2?o:e;return(t&1?-n:n)+(t&2?-s:s)}const I=Array.from({length:512},(t,e)=>e).sort(()=>Math.random()-.5);for(let t=0;t<256;t++)I[t+256]=I[t];function Rt(t,e){const o=Math.floor(t)&255,i=Math.floor(e)&255,n=t-Math.floor(t),s=e-Math.floor(e),l=Ne(n),a=Ne(s),u=I[I[o]+i],p=I[I[o]+i+1],m=I[I[o+1]+i],y=I[I[o+1]+i+1];return he(he(oe(u,n,s),oe(m,n-1,s),l),he(oe(p,n,s-1),oe(y,n-1,s-1),l),a)}function Fe(t,e,o=4,i=2,n=.5){let s=0,l=.5,a=1;for(let u=0;u<o;u++)s+=Rt(t*a,e*a)*l,a*=i,l*=n;return s}function P(t,e){return t+Math.random()*(e-t)}function Ue(t,e){return Math.floor(P(t,e+1))}const Nt=`
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
`,Ut=`
varying vec2 vUv;
varying vec3 vWorldPos;
varying vec3 vNormal;
void main() {
  vUv = uv;
  vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,Dt=`
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
`,Ot=`
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
`,Gt=`
varying float vAlpha;
void main() {
  gl_FragColor = vec4(0.55, 0.75, 1.0, vAlpha * 0.35);
}
`,zt=`
varying vec3 vLocalPos;
void main() {
  vLocalPos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,Bt=`
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
`,Ht=`
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
`,Wt=`
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
`,E=32,H=16,_t=6,J=H+_t,ne=E/2*J,fe={color:new d(197400),near:100,far:500},Q=[new d(62975),new d(62975),new d(16711850),new d(16711850),new d(16739098),new d(8073215),new d(8073215),new d(65416),new d(65416),new d(16770626)];function Vt(){return new te({vertexShader:Nt,fragmentShader:Ft,uniforms:{uTime:{value:0},uFogColor:{value:fe.color},uFogNear:{value:fe.near},uFogFar:{value:fe.far}}})}function $t(t,e){const o=t/E,i=e/E;return o<.35&&i<.35?0:o<.65&&i<.35?1:o>=.65&&i<.35?2:o<.35&&i<.65?3:o>=.65&&i<.65?4:o<.35&&i>=.65?5:o<.65&&i>=.65?6:o>=.65&&i>=.65?7:i>.45&&i<.55?8:9}class qt{constructor(){c(this,"meshA");c(this,"meshB");c(this,"meshC");c(this,"mats",[])}generate(e){const o=E*E,i=Vt();this.mats.push(i);const n=new we(1,1,1),s=new Float32Array(o),l=new Float32Array(o*3);n.setAttribute("aHeight",new R(s,1)),n.setAttribute("aNeonColor",new R(l,3)),this.meshA=new K(n,i.clone(),o),this.meshA.frustumCulled=!1,this.mats.push(this.meshA.material);const a=new Le(.45,.55,1,10),u=new Float32Array(o),p=new Float32Array(o*3);a.setAttribute("aHeight",new R(u,1)),a.setAttribute("aNeonColor",new R(p,3)),this.meshB=new K(a,i.clone(),o),this.meshB.frustumCulled=!1,this.mats.push(this.meshB.material);const m=new we(1,.4,1),y=new Float32Array(o),h=new Float32Array(o*3);m.setAttribute("aHeight",new R(y,1)),m.setAttribute("aNeonColor",new R(h,3)),this.meshC=new K(m,i.clone(),o),this.meshC.frustumCulled=!1,this.mats.push(this.meshC.material);const b=new ye,S=new r,C=new r,T=new be;let x=0,v=0,g=0;for(let w=0;w<E;w++)for(let f=0;f<E;f++){const M=w*J-ne,G=f*J-ne;if(w%5===0||f%5===0||w%2===0&&f%2===0&&Math.random()<.25)continue;const z=w/E*4-2,ce=f/E*4-2,nt=Fe(z,ce,5),it=Math.sqrt(z*z+ce*ce)/3,st=Math.max(.18,1-it*.6),B=Math.max(8,(22+nt*170)*st)+P(4,28),ke=P(H*.42,H*.9),Me=P(H*.42,H*.9),at=$t(w,f),L=Q[at],Ie=Math.random();if(Ie<.65)s[x]=B,l[x*3]=L.r,l[x*3+1]=L.g,l[x*3+2]=L.b,S.set(M,B/2,G),C.set(ke,B,Me),b.compose(S,T,C),this.meshA.setMatrixAt(x,b),x++;else if(Ie<.82){const W=P(H*.18,H*.32);u[v]=B,p[v*3]=L.r,p[v*3+1]=L.g,p[v*3+2]=L.b,S.set(M+P(-3,3),B/2,G+P(-3,3)),C.set(W*2,B,W*2),b.compose(S,T,C),this.meshB.setMatrixAt(v,b),v++}else{const W=Math.max(6,B*.35);y[g]=W,h[g*3]=L.r,h[g*3+1]=L.g,h[g*3+2]=L.b,S.set(M,W/2,G),C.set(ke*1.4,W,Me*1.4),b.compose(S,T,C),this.meshC.setMatrixAt(g,b),g++}}this.meshA.count=x,this.meshB.count=v,this.meshC.count=g;for(const w of[this.meshA,this.meshB,this.meshC]){w.instanceMatrix.needsUpdate=!0;const f=w.geometry;f.getAttribute("aHeight").needsUpdate=!0,f.getAttribute("aNeonColor").needsUpdate=!0,e.add(w)}}addAntennas(e){const o=new Le(.1,.1,1,4),i=new _({color:16716083}),n=new K(o,i,400);n.frustumCulled=!1;const s=new ye,l=new r,a=new r,u=new be;let p=0;for(let m=0;m<400;m++){const y=Ue(0,E-1),h=Ue(0,E-1),b=y*J-ne,S=h*J-ne,C=y/E*4-2,T=h/E*4-2,x=Math.max(.18,1-Math.sqrt(C*C+T*T)/3*.6),v=Math.max(8,(22+Fe(C,T,5)*170)*x)+20,g=P(8,30);l.set(b+P(-3,3),v+g/2,S+P(-3,3)),a.set(1,g,1),s.compose(l,u,a),n.setMatrixAt(p++,s)}n.count=p,n.instanceMatrix.needsUpdate=!0,e.add(n)}addNeonSigns(e,o){o.forEach(({text:i,pos:n,color:s})=>{const l=document.createElement("canvas");l.width=256,l.height=64;const a=l.getContext("2d");a.clearRect(0,0,256,64),a.fillStyle=s+"22",a.fillRect(0,0,256,64),a.strokeStyle=s,a.lineWidth=2,a.strokeRect(2,2,252,60),a.fillStyle=s,a.font="bold 22px monospace",a.textAlign="center",a.fillText(i,128,40);const u=new qe(l),p=new re(18,4.5),m=new _({map:u,transparent:!0,side:Xe,depthWrite:!1}),y=new ee(p,m);y.position.copy(n),e.add(y)})}update(e){for(const o of this.mats)o.uniforms.uTime.value=e}}class Xt{constructor(){c(this,"mesh");c(this,"mat")}create(e){const o=new re(1200,1200,1,1);return this.mat=new te({vertexShader:Ut,fragmentShader:Dt,uniforms:{uTime:{value:0},uDistrictNeon:{value:new d(62975)},uRainIntensity:{value:1}}}),this.mesh=new ee(o,this.mat),this.mesh.rotation.x=-Math.PI/2,this.mesh.position.y=0,e.add(this.mesh),this.mesh}update(e){this.mat.uniforms.uTime.value=e}setDistrictNeon(e){this.mat.uniforms.uDistrictNeon.value.copy(e)}setRainIntensity(e){this.mat.uniforms.uRainIntensity.value=e}}class Yt{constructor(){c(this,"points");c(this,"count",8e3)}create(e){const o=new Float32Array(this.count*3),i=new Float32Array(this.count),n=new Float32Array(this.count);for(let a=0;a<this.count;a++)o[a*3]=P(-300,300),o[a*3+1]=P(-60,60),o[a*3+2]=P(-300,300),i[a]=P(.3,1),n[a]=Math.random();const s=new Ye;s.setAttribute("position",new se(o,3)),s.setAttribute("aSpeed",new se(i,1)),s.setAttribute("aOffset",new se(n,1));const l=new te({vertexShader:Ot,fragmentShader:Gt,uniforms:{uTime:{value:0}},transparent:!0,blending:Z,depthWrite:!1});this.points=new Ke(s,l),e.add(this.points)}update(e,o){const i=this.points.material;i.uniforms.uTime.value=e,o&&(this.points.position.x=o.x,this.points.position.z=o.z)}}class Kt{constructor(){c(this,"mesh");c(this,"mat")}create(e){const o=new ct(2e3,32,16);this.mat=new te({vertexShader:zt,fragmentShader:Bt,uniforms:{uTime:{value:0},uZenithColor:{value:new d(132104)},uHorizonColor:{value:new d(1706e3)},uDistrictNeon:{value:new d(62975)}},side:dt,depthWrite:!1}),this.mesh=new ee(o,this.mat),this.mesh.renderOrder=-1,e.add(this.mesh)}update(e,o,i){this.mesh.position.copy(o),this.mat.uniforms.uTime.value=e,i&&this.mat.uniforms.uDistrictNeon.value.copy(i)}setDistrictColors(e,o){this.mat.uniforms.uHorizonColor.value.copy(e),this.mat.uniforms.uDistrictNeon.value.copy(o)}}function jt(t){let e=t;return()=>{e|=0,e=e+1831565813|0;let o=Math.imul(e^e>>>15,1|e);return o=o+Math.imul(o^o>>>7,61|o)^o,((o^o>>>14)>>>0)/4294967296}}const De=[new d(16720384),new d(61183),new d(22015),new d(16711884),new d(65382),new d(16737792),new d(11141375),new d(16770626)],Ce=32,je=16,Jt=6,Se=je+Jt,Oe=Ce/2*Se;class Zt{constructor(){c(this,"mesh");c(this,"mat")}create(e){const i=new re(5,1.4),n=new Float32Array(150*3),s=new Float32Array(150),l=new Float32Array(150);i.setAttribute("aColor",new R(n,3)),i.setAttribute("aFlickerSeed",new R(s,1)),i.setAttribute("aPulseMode",new R(l,1)),this.mat=new te({vertexShader:Ht,fragmentShader:Wt,uniforms:{uTime:{value:0}},transparent:!0,depthWrite:!1,side:Xe,blending:Z}),this.mesh=new K(i,this.mat,150),this.mesh.frustumCulled=!1;const a=jt(42),u=new ye,p=new r,m=new be,y=new r(1,1,1);let h=0;for(let b=0;b<Ce&&h<150;b++)for(let S=0;S<Ce&&h<150;S++){if(b%5===0||S%5===0||a()>.1)continue;const C=b*Se-Oe,T=S*Se-Oe,x=6+a()*12,v=Math.floor(a()*4),g=je*.5+.3;let w=C,f=T,M=0;v===0?(f=T+g,M=0):v===1?(f=T-g,M=Math.PI):v===2?(w=C+g,M=Math.PI*.5):(w=C-g,M=-Math.PI*.5),p.set(w,x,f),m.setFromEuler(new ut(0,M,0)),u.compose(p,m,y),this.mesh.setMatrixAt(h,u);const G=De[Math.floor(a()*De.length)];n[h*3]=G.r,n[h*3+1]=G.g,n[h*3+2]=G.b,s[h]=a();const z=a();l[h]=z<.6?0:z<.85?1:z<.95?2:3,h++}this.mesh.count=h,this.mesh.instanceMatrix.needsUpdate=!0,i.getAttribute("aColor").needsUpdate=!0,i.getAttribute("aFlickerSeed").needsUpdate=!0,i.getAttribute("aPulseMode").needsUpdate=!0,e.add(this.mesh)}update(e){this.mat.uniforms.uTime.value=e}}const Qt=`
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
`;class eo extends Lt{constructor(e=.45){super("LensStreakEffect",Qt,{uniforms:new Map([["uIntensity",new ht(e)]])})}}class to{constructor(){c(this,"composer");c(this,"glitch");c(this,"glitchTimeout",0)}setup(e,o,i){this.composer=new xt(e);const n=new Pt(o,i),s=new At({blendFunction:de.ADD,luminanceThreshold:.25,luminanceSmoothing:.4,intensity:2.4,radius:.6}),l=new eo(.45),a=new Tt({offset:new j(.0018,.0012),radialModulation:!0,modulationOffset:.5}),u=new Et({eskil:!1,offset:.35,darkness:.75}),p=new kt({blendFunction:de.OVERLAY,premultiply:!0});p.blendMode.opacity.value=.04;const m=new Mt({blendFunction:de.OVERLAY,density:1.4});return m.blendMode.opacity.value=.07,this.glitch=new It({delay:new j(99999,99999),duration:new j(.15,.35),strength:new j(.15,.4),columns:.04,ratio:.85}),this.composer.addPass(n),this.composer.addPass(new ue(i,s,l)),this.composer.addPass(new ue(i,a,m,u,p)),this.composer.addPass(new ue(i,this.glitch)),this.composer}triggerGlitch(){this.glitch.delay.set(0,.05),clearTimeout(this.glitchTimeout),this.glitchTimeout=window.setTimeout(()=>{this.glitch.delay.set(99999,99999)},600)}resize(e,o){this.composer.setSize(e,o)}render(){this.composer.render()}}const k=[{pos:new r(0,180,220),look:new r(0,0,0),label:"HERO",t:0},{pos:new r(-40,12,110),look:new r(-20,20,60),label:"ABOUT",t:0},{pos:new r(-80,8,55),look:new r(-80,58,20),label:"PS3 GPU",t:0},{pos:new r(-75,10,5),look:new r(-75,62,-25),label:"CPUonGPU",t:0},{pos:new r(-30,10,-45),look:new r(0,58,-90),label:"GPU Stream",t:0},{pos:new r(20,10,-70),look:new r(40,58,-110),label:"Selkies",t:0},{pos:new r(80,10,-60),look:new r(100,58,-100),label:"Oris AI",t:0},{pos:new r(110,12,20),look:new r(90,58,-20),label:"VajraGrid",t:0},{pos:new r(100,10,70),look:new r(70,55,50),label:"VidyaMitra",t:0},{pos:new r(50,10,100),look:new r(20,55,80),label:"Netflip",t:0},{pos:new r(10,10,90),look:new r(-20,55,70),label:"Arena",t:0},{pos:new r(-30,12,60),look:new r(-10,62,40),label:"Hackathon",t:0},{pos:new r(-60,8,30),look:new r(-40,8,0),label:"SKILLS",t:0},{pos:new r(0,120,160),look:new r(0,0,0),label:"CONTACT",t:0}],oo=1600;class no{constructor(e){c(this,"camera");c(this,"posSpline");c(this,"lookSpline");c(this,"t",0);c(this,"currentSection",0);c(this,"mouseX",0);c(this,"mouseY",0);c(this,"_pos",new r);c(this,"_look",new r);c(this,"_ahead",new r);c(this,"onSectionChange");c(this,"_lastFiredSection",0);this.camera=e,this.buildSpline(),this.init()}buildSpline(){const e=k.map(n=>n.pos.clone()),o=k.map(n=>n.look.clone());this.posSpline=new Re(e,!1,"catmullrom",.5),this.lookSpline=new Re(o,!1,"catmullrom",.5);const i=k.length;k.forEach((n,s)=>{n.t=s/(i-1)}),this.t=0,this.posSpline.getPoint(0,this._pos),this.lookSpline.getPoint(0,this._look),this.camera.position.copy(this._pos),this.camera.lookAt(this._look)}init(){window.addEventListener("mousemove",i=>{this.mouseX=(i.clientX/window.innerWidth-.5)*2,this.mouseY=(i.clientY/window.innerHeight-.5)*2});let e=!1;window.addEventListener("wheel",i=>{if(e)return;e=!0;const n=i.deltaY>0?1:-1;this.goTo(this.currentSection+n),setTimeout(()=>{e=!1},oo)},{passive:!0});let o=0;window.addEventListener("touchstart",i=>{o=i.touches[0].clientY}),window.addEventListener("touchend",i=>{const n=o-i.changedTouches[0].clientY;Math.abs(n)>40&&this.goTo(this.currentSection+(n>0?1:-1))}),window.addEventListener("keydown",i=>{(i.key==="ArrowDown"||i.key==="ArrowRight")&&this.goTo(this.currentSection+1),(i.key==="ArrowUp"||i.key==="ArrowLeft")&&this.goTo(this.currentSection-1)})}goTo(e){if(e=Math.max(0,Math.min(k.length-1,e)),e===this.currentSection)return;const o=this.currentSection;this.currentSection=e;const i=k[e].t,s=.6+Math.abs(i-this.t)*5;V.killTweensOf(this),V.to(this,{t:i,duration:s,ease:"power2.inOut",onUpdate:()=>this._fireCrossings(o,e),onComplete:()=>{var l;this._lastFiredSection=e,(l=this.onSectionChange)==null||l.call(this,e),this._updateUI(e)}}),this._updateUI(e)}_fireCrossings(e,o){const i=o>e?1:-1;k.forEach((n,s)=>{var a;(i>0?this.t>=n.t&&s>this._lastFiredSection&&s<=o:this.t<=n.t&&s<this._lastFiredSection&&s>=o)&&(this._lastFiredSection=s,(a=this.onSectionChange)==null||a.call(this,s),this._updateUI(s))})}update(e){this.posSpline.getPoint(this.t,this._pos),this.camera.position.copy(this._pos);const o=Math.min(1,this.t+.015);this.posSpline.getPoint(o,this._ahead),this.lookSpline.getPoint(this.t,this._look);const i=this._look.x*.8+this._ahead.x*.2+this.mouseX*5,n=this._look.y*.8+this._ahead.y*.2-this.mouseY*3,s=this._look.z*.8+this._ahead.z*.2;this.camera.lookAt(i,n,s)}_updateUI(e){document.querySelectorAll(".nav-dot").forEach((i,n)=>i.classList.toggle("active",n===e));const o=document.getElementById("progress-bar");o&&(o.style.height=e/(k.length-1)*100+"%")}getCurrentSection(){return this.currentSection}}const Je=[{id:"ps3-gpu",title:"PS3 Cell GPU Emulator",subtitle:"Systems / Emulation",desc:"Full emulation of the Cell Broadband Engine's SPU pipeline in WebGL. 6 SPU cores, PPE scheduler, DMA bus — running real PS3 shaders in the browser at 200 GIPS.",tags:["C++","WebGL","GLSL","Cell BE","Emulation"],url:"https://github.com/aerosane",neonColor:"#00f5ff",district:"GPU DISTRICT",icon:"⬡"},{id:"cpuongpu",title:"CPUonGPU",subtitle:"Architecture Research",desc:"Runs a full x86 CPU simulation entirely on GPU compute shaders. Register file, ALU, cache hierarchy — all in GLSL. JIT-compiled x86 → SPIR-V at runtime.",tags:["GLSL","Compute Shaders","x86","JIT","SPIR-V"],url:"https://github.com/aerosane",neonColor:"#00f5ff",district:"GPU DISTRICT",icon:"⬢"},{id:"gpu-streaming",title:"GPU Streaming Pipeline",subtitle:"NvFBC + NVENC",desc:"Sub-frame-latency game streaming via NvFBC capture → NVENC H265/AV1 encode → WebRTC TURN relay. <1 frame E2E latency. Deployed on GitHub Codespace GPU.",tags:["NVENC","NvFBC","WebRTC","Rust","H265"],url:"https://github.com/Imperialorg/codespace",neonColor:"#00f5ff",district:"GPU DISTRICT",icon:"▶"},{id:"selkies-rust",title:"Selkies-Rust",subtitle:"Python→Rust Port",desc:"Complete rewrite of the Selkies WebRTC game streaming stack from Python into Rust. 6 crates: pipeline, signaling, input, encoding, metrics, CLI.",tags:["Rust","WebRTC","GStreamer","Tokio","GSAP"],url:"https://github.com/Imperialorg/codespace",neonColor:"#ff6b1a",district:"SYSTEMS CORRIDOR",icon:"⚙"},{id:"oris-ai",title:"Oris — AI SRE",subtitle:"🏆 Runner-up · TechSynapse 2026",desc:"Autonomous Site Reliability Engineer: ingests production logs, PII-masks with Presidio, infers root cause via Gemini 2.0, opens GitHub PRs with fixes. Zero human touch.",tags:["Python","Gemini 2.0","Presidio","LangChain","FastAPI"],url:"https://github.com/aerosane",neonColor:"#ff00aa",district:"AI DISTRICT",icon:"◈"},{id:"vajragrid",title:"VajraGrid",subtitle:"🇮🇳 India Innovates 2026 · Bharat Mandapam",desc:"AI-hardened power grid security: detects SCADA cyberattacks in 16s, 4-layer ML defense stack, adversarial training. Exhibited nationally at Bharat Mandapam.",tags:["Python","PyTorch","SCADA","Adversarial ML","GridSec"],url:"https://github.com/aerosane",neonColor:"#ff00aa",district:"AI DISTRICT",icon:"⚡"},{id:"vidyamitra",title:"VidyaMitra",subtitle:"IISER JEE Prep",desc:"AI tutor for JEE aspirants: adaptive quiz engine, LaTeX equation rendering, spaced repetition. Covers Physics, Chemistry, Math with difficulty auto-calibration.",tags:["TypeScript","React","LaTeX","OpenAI","Supabase"],url:"https://github.com/aerosane",neonColor:"#00ff88",district:"EDTECH ZONE",icon:"⬟"},{id:"netflip",title:"Netflip VOD",subtitle:"Full-Stack Streaming",desc:"Netflix-clone with HLS adaptive streaming, Azure Blob CDN, Fastly edge cache, WebSocket live chat, OAuth2, recommendation engine. 1080p adaptive bitrate.",tags:["Next.js","HLS","Azure","Fastly","PostgreSQL"],url:"https://github.com/aerosane",neonColor:"#7b2fff",district:"WEB DISTRICT",icon:"▨"},{id:"coding-arena",title:"Coding Arena",subtitle:"Competitive Judging Platform",desc:"Online judge with isolated Docker execution, multi-language support, real-time leaderboard, plagiarism detection via AST similarity. 200ms median judge latency.",tags:["Go","Docker","Redis","React","WebSocket"],url:"https://github.com/aerosane",neonColor:"#7b2fff",district:"WEB DISTRICT",icon:"{ }"},{id:"hackathon",title:"Hackathon Wins",subtitle:"Hall of Fame",desc:"🏆 Runner-up at TechSynapse 2026 (Oris AI SRE). 🇮🇳 National exhibition at India Innovates 2026, Bharat Mandapam, New Delhi (VajraGrid). 1st year, two nationals.",tags:["Oris AI","VajraGrid","TechSynapse","India Innovates"],url:"https://github.com/aerosane",neonColor:"#ffe642",district:"HALL OF FAME",icon:"🏆"}],io={Languages:["C++","Rust","Python","TypeScript","Go","GLSL/HLSL"],Systems:["WebRTC","WebGL/WebGPU","NVENC/NvFBC","Docker","Linux"],"AI/ML":["PyTorch","Gemini API","LangChain","Presidio","HuggingFace"],Web:["React","Next.js","Vite","Node.js","PostgreSQL","Redis"],Tools:["Git","GitHub Actions","Azure","GStreamer","Tokio"]};class so{constructor(){c(this,"group",new xe);c(this,"hoverTargets",[]);c(this,"visible",!1);c(this,"visibleValue",0)}enter(){this.group.visible=!0,this.visible=!0,V.killTweensOf(this),V.to(this,{visibleValue:1,duration:1.4,ease:"power2.out",onUpdate:()=>this.setVisible(this.visibleValue)})}exit(){this.visible=!1,V.killTweensOf(this),V.to(this,{visibleValue:0,duration:.8,ease:"power2.in",onUpdate:()=>this.setVisible(this.visibleValue),onComplete:()=>{this.group.visible=!1}})}setVisible(e){}dispose(){this.group.traverse(e=>{e.geometry&&e.geometry.dispose()})}}let U=null;function ao(){return U||(U=document.createElement("div"),U.id="env-detail-panel",Object.assign(U.style,{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%, -50%) scale(0.92)",background:"rgba(4,6,20,0.92)",border:"1px solid var(--neon, #00f5ff)",boxShadow:"0 0 32px var(--neon, #00f5ff)44",padding:"28px 36px",maxWidth:"480px",width:"90vw",zIndex:"9999",fontFamily:"monospace",color:"#e8f4ff",opacity:"0",pointerEvents:"none",transition:"opacity 0.3s, transform 0.3s",borderRadius:"4px"}),document.body.appendChild(U),U)}function ro(t){var o;const e=ao();e.style.setProperty("--neon",t.neonColor),e.style.borderColor=t.neonColor+"88",e.style.boxShadow=`0 0 40px ${t.neonColor}33`,e.innerHTML=`
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px">
      <div>
        <div style="color:${t.neonColor};font-size:11px;letter-spacing:3px;text-transform:uppercase;margin-bottom:4px">${t.subtitle}</div>
        <div style="font-size:20px;font-weight:bold;color:#fff">${t.title}</div>
      </div>
      <button id="env-panel-close" style="background:none;border:none;color:#888;font-size:20px;cursor:pointer;line-height:1;padding:0 0 0 16px">✕</button>
    </div>
    <div style="font-size:13px;line-height:1.7;color:#c8d8ef;margin-bottom:16px">${t.desc}</div>
    <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:18px">
      ${t.tags.map(i=>`<span style="background:${t.neonColor}18;border:1px solid ${t.neonColor}44;color:${t.neonColor};font-size:10px;padding:3px 8px;border-radius:2px">${i}</span>`).join("")}
    </div>
    <a href="${t.url}" target="_blank" rel="noopener"
       style="display:inline-block;padding:9px 20px;background:${t.neonColor}22;border:1px solid ${t.neonColor};color:${t.neonColor};text-decoration:none;font-size:12px;letter-spacing:1px;transition:background 0.2s"
       onmouseover="this.style.background='${t.neonColor}44'"
       onmouseout="this.style.background='${t.neonColor}22'">
      VIEW ON GITHUB →
    </a>
  `,(o=e.querySelector("#env-panel-close"))==null||o.addEventListener("click",i=>{i.stopPropagation(),Ze()}),e.style.pointerEvents="all",e.style.opacity="1",e.style.transform="translate(-50%, -50%) scale(1)"}function Ze(){const t=U;t&&(t.style.opacity="0",t.style.transform="translate(-50%, -50%) scale(0.92)",t.style.pointerEvents="none")}function lo(t){const i=document.createElement("canvas");i.width=900,i.height=400;const n=i.getContext("2d"),s=t.neonColor;n.clearRect(0,0,900,400),n.fillStyle="rgba(4,6,20,0.82)",n.fillRect(0,0,900,400),n.fillStyle=s,n.shadowColor=s,n.shadowBlur=22,n.fillRect(0,0,6,400),n.shadowBlur=0,n.font="11px monospace",n.fillStyle=s+"88",n.textAlign="left",n.fillText(t.district.toUpperCase(),30,34);const l=t.title.length>16?52:72;n.font=`bold ${l}px monospace`,n.shadowColor=s,n.shadowBlur=48,n.fillStyle="#ffffff",n.fillText(t.title,30,82+(72-l)),n.shadowBlur=24,n.fillStyle=s+"cc",n.fillText(t.title,30,82+(72-l)),n.shadowBlur=0,n.font="20px monospace",n.fillStyle="rgba(255,255,255,0.55)",n.fillText(t.subtitle,30,152),n.strokeStyle=s+"33",n.lineWidth=1,n.beginPath(),n.moveTo(30,174),n.lineTo(870,174),n.stroke(),n.font="bold 15px monospace";let a=30;for(const u of t.tags.slice(0,4)){const p=n.measureText(u).width+24;n.strokeStyle=s+"55",n.lineWidth=1,n.strokeRect(a,190,p,30),n.fillStyle=s+"dd",n.fillText(u,a+12,210),a+=p+10}return n.font="13px monospace",n.fillStyle=s+"66",n.fillText("[ CLICK TO VIEW PROJECT ]",30,380),new qe(i)}function F(t,e,o,i,n){const s=new ee(new we(t,e,o),n);return s.position.copy(i),s.frustumCulled=!1,s}class co extends so{constructor(o,i,n){super();c(this,"projIdx");c(this,"panelPos");c(this,"camPos");c(this,"fadeMats",[]);c(this,"particleMat");this.projIdx=o,this.panelPos=i,this.camPos=n}create(o){o.add(this.group);const i=Je[this.projIdx],n=new d(i.neonColor),s=new xe;s.position.copy(this.panelPos);const l=this.camPos.x-this.panelPos.x,a=this.camPos.z-this.panelPos.z;s.rotation.y=Math.atan2(l,a),this.group.add(s);const u=(f,M)=>(f.opacity=0,this.fadeMats.push([f,M]),f),p=u(new _({map:lo(i),transparent:!0,depthWrite:!1,side:ft,alphaTest:.01}),1),m=new ee(new re(40,18),p);m.frustumCulled=!1,m.userData.isLabel=!0,m.userData.onClick=()=>ro(i),s.add(m);const y=u(new _({color:n,transparent:!0,blending:Z,depthWrite:!1}),.85);s.add(F(41,.5,.4,new r(0,9.25,.1),y)),s.add(F(41,.5,.4,new r(0,-9.25,.1),y)),s.add(F(.5,19,.4,new r(-20.25,0,.1),y)),s.add(F(.5,19,.4,new r(20.25,0,.1),y));const h=60,b=u(new _({color:2763326,transparent:!0}),1),S=new r(-13,-9-h/2,0),C=new r(13,-9-h/2,0);s.add(F(.9,h,.9,S,b)),s.add(F(.9,h,.9,C,b)),s.add(F(27,.7,.9,new r(0,-9-h+.4,0),b));const T=u(new _({color:n,transparent:!0,blending:Z,depthWrite:!1}),.5);s.add(F(41,.3,.1,new r(0,9.25,.2),T));const x=60,v=new Float32Array(x*3);for(let f=0;f<x;f++)v[f*3]=this.panelPos.x+(Math.random()-.5)*60,v[f*3+1]=this.panelPos.y+(Math.random()-.5)*35,v[f*3+2]=this.panelPos.z+(Math.random()-.5)*60;const g=new Ye;g.setAttribute("position",new se(v,3)),this.particleMat=new pt({size:.4,color:n,transparent:!0,opacity:0,blending:Z,sizeAttenuation:!0});const w=new Ke(g,this.particleMat);w.frustumCulled=!1,this.group.add(w)}update(o){}setVisible(o){for(const[i,n]of this.fadeMats)i.opacity=o*n;this.particleMat&&(this.particleMat.opacity=o*.45)}onHover(){}}const uo=[[2,0],[3,1],[4,2],[5,3],[6,4],[7,5],[8,6],[9,7],[10,8],[11,9]];class ho{constructor(e,o){c(this,"envs",new Map);c(this,"activeEnv",null);c(this,"activeIdx",-1);for(const[i,n]of uo){const s=k[i],l=new co(n,s.look.clone(),s.pos.clone());l.create(e),l.group.visible=!1,this.envs.set(i,l)}}onSection(e){if(e===this.activeIdx)return;this.activeIdx=e,this.activeEnv&&(this.activeEnv.exit(),this.activeEnv=null);const o=this.envs.get(e);o&&(this.activeEnv=o,o.enter())}update(e){this.activeEnv&&this.activeEnv.update(e)}}const fo=document.getElementById("scene-canvas"),q=new mt({canvas:fo,antialias:!0,alpha:!1,powerPreference:"high-performance"});q.setPixelRatio(Math.min(devicePixelRatio,2));q.setSize(innerWidth,innerHeight);q.toneMapping=vt;q.toneMappingExposure=.95;const A=new gt;A.background=new d(131602);A.fog=new wt(197400,.003);const O=new yt(60,innerWidth/innerHeight,.5,1200),le=new to;le.setup(q,A,O);const Pe=new Kt;Pe.create(A);const D=new qt;D.generate(A);D.addAntennas(A);const po=Je.map((t,e)=>{const o=k[e+2];return{text:t.district,pos:new r(o.pos.x+12,80,o.pos.z-18),color:t.neonColor}});D.addNeonSigns(A,po);const Qe=new Zt;Qe.create(A);const Ae=new Xt;Ae.create(A);const et=new Yt;et.create(A);const mo=new bt(128,0,.4);A.add(mo);const Te=new xe;A.add(Te);var _e,Ve;(Ve=(_e=D.cityGroup)==null?void 0:_e.children)==null||Ve.forEach(t=>Te.add(t));const tt=new ho(A,Te),ae=new d(62975);function vo(t){const e=Math.min(t,Q.length-1);ae.copy(Q[e]),Ae.setDistrictNeon(ae),Pe.update(0,O.position,ae)}const go=[["NEON DISTRICT","A cyberpunk portfolio"],["ABOUT","Who is behind this"],["PS3 CELL GPU","PS3 SPU emulator in WebGL"],["CPUonGPU","x86 CPU running on GPU"],["GPU STREAMING","Sub-frame game streaming"],["SELKIES RUST","WebRTC stack rebuilt in Rust"],["ORIS AI","Autonomous SRE agent"],["VAJRAGRID","AI power grid security"],["VIDYAMITRA","Adaptive JEE AI tutor"],["NETFLIP","HLS streaming platform"],["ARENA OJ","Online judge platform"],["HACKATHON","Competition highlights"],["TECH STACK","Tools and languages"],["CONTACT","Get in touch"]],$=document.createElement("div");$.id="section-banner";Object.assign($.style,{position:"fixed",bottom:"24px",left:"50%",transform:"translateX(-50%)",textAlign:"center",pointerEvents:"none",zIndex:"50",opacity:"0",transition:"opacity 0.4s",background:"rgba(0,0,8,0.65)",padding:"10px 28px",borderTop:"1px solid currentColor"});document.body.appendChild($);function wo(t){const[e,o]=go[t]??["",""],i=Q[t]?"#"+Q[t].getHexString():"#00f5ff";$.style.color=i,$.innerHTML=`
    <div style="font-family:monospace;font-size:8px;letter-spacing:4px;color:${i};margin-bottom:4px;text-transform:uppercase;opacity:0.7">
      DISTRICT_${String(t).padStart(2,"0")}
    </div>
    <div style="font-family:monospace;font-size:1.1rem;font-weight:900;color:#fff;
                text-shadow:0 0 20px ${i},0 0 40px ${i}88;letter-spacing:0.08em;line-height:1.1">
      ${e}
    </div>
    <div style="font-family:monospace;font-size:0.75rem;color:${i};
                letter-spacing:0.15em;margin-top:4px;opacity:0.85">
      ${o}
    </div>
  `,$.style.opacity="1"}const Ee=new no(O);Ee.onSectionChange=t=>{bo(t),Co(t),vo(t),le.triggerGlitch(),tt.onSection(t),wo(t)};const yo=document.getElementById("nav-dots");k.forEach((t,e)=>{const o=document.createElement("div");o.className="nav-dot"+(e===0?" active":""),o.title=t.label,o.addEventListener("click",()=>Ee.goTo(e)),yo.appendChild(o)});function bo(t){document.querySelectorAll(".sect").forEach((e,o)=>{e.classList.toggle("active",o===t)}),document.querySelectorAll(".nav-dot").forEach((e,o)=>{e.classList.toggle("active",o===t)})}function Co(t){const e=document.getElementById("hud-section");e&&(e.textContent=`DISTRICT_${String(t).padStart(2,"0")} / ${k[t].label}`)}const Ge=document.getElementById("skills-grid");Ge&&Object.entries(io).forEach(([t,e])=>{const o=document.createElement("div");o.className="skill-cat",o.innerHTML=`<div class="skill-cat-name">// ${t}</div>`+e.map(i=>`<div class="skill-item">${i}</div>`).join(""),Ge.appendChild(o)});const N=document.getElementById("contact-input"),ie=document.getElementById("contact-input-display");var $e;($e=document.getElementById("sect-13"))==null||$e.addEventListener("click",()=>N==null?void 0:N.focus());N==null||N.addEventListener("input",()=>{ie&&(ie.textContent=(N.value||"")+"_"),N.value.trim().toLowerCase()==="sudo"&&(So(),N.value="",ie&&(ie.textContent="_"))});function So(){const t=document.querySelector("#sect-13 .terminal-body");if(!t)return;const e=document.createElement("p");e.className="output neon-green",e.textContent="> Permission granted. Downloading your future...",t.appendChild(e),setTimeout(()=>{const o=document.createElement("p");o.className="output",o.innerHTML='<span style="color:#ffe642">root@neon-district:~# ██████████ 100%  COMPLETE</span>',t.appendChild(o)},1500)}const ze=["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];let X=0;window.addEventListener("keydown",t=>{t.key===ze[X]?X++:X=0,X===ze.length&&(X=0,xo())});let pe=!1;function xo(){pe=!pe,[D.meshA,D.meshB,D.meshC].forEach(t=>{const e=t.material;e.wireframe=pe})}const me=document.getElementById("boot-log"),Be=document.getElementById("boot-bar"),Y=document.getElementById("loading-screen"),ve=["Initializing WebGPU context","Generating city geometry","Compiling 47 shader programs","Spawning rain particles","Calibrating post-processing chain","System ready"];async function Po(){for(let t=0;t<ve.length;t++){await new Promise(o=>setTimeout(o,260+Math.random()*200));const e=document.createElement("p");e.innerHTML=`<span style="color:rgba(0,245,255,.5)">[BOOT]</span> ${ve[t]}... <span class="ok">[OK]</span>`,me==null||me.appendChild(e),Be&&(Be.style.width=(t+1)/ve.length*100+"%")}await new Promise(t=>setTimeout(t,600)),Y==null||Y.classList.add("fade-out"),setTimeout(()=>{Y&&(Y.style.display="none")},850)}Po();const He=new Ct,ge=new j;window.addEventListener("click",t=>{if(t.target.closest("#env-detail-panel"))return;ge.x=t.clientX/innerWidth*2-1,ge.y=-(t.clientY/innerHeight)*2+1,He.setFromCamera(ge,O);const e=He.intersectObjects(A.children,!0);for(const o of e){const i=o.object;if(i.userData.isLabel&&i.userData.onClick){t.stopPropagation(),i.userData.onClick();return}}Ze()});window.addEventListener("resize",()=>{O.aspect=innerWidth/innerHeight,O.updateProjectionMatrix(),q.setSize(innerWidth,innerHeight),le.resize(innerWidth,innerHeight)});const We=new St;function ot(){requestAnimationFrame(ot);const t=We.getElapsedTime(),e=We.getDelta();D.update(t),Ae.update(t),et.update(t,O.position),Qe.update(t),Pe.update(t,O.position,ae),Ee.update(e),tt.update(t),le.render()}ot();
