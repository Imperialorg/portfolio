var _e=Object.defineProperty;var qe=(o,t,e)=>t in o?_e(o,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):o[t]=e;var u=(o,t,e)=>qe(o,typeof t!="symbol"?t+"":t,e);import{h as c,d as be,I,p as j,i as Se,r as le,_ as a,Q as ce,t as Ae,C as Xe,w as fe,l as De,s as me,T as _,f as Ye,e as ee,a as Ue,x as Ke,U as Ze,B as Je,E as Qe,Z as q,W as et,a1 as tt,A as ot,K as nt,n as it,P as st,H as rt,g as at}from"./three-CeWgN7No.js";import{b as lt,R as ct,a as ut,B as te,C as dt,V as ht,N as ft,S as mt,G as pt,c as oe,E as vt}from"./postprocessing-CMvRDKUy.js";import{g as Pe}from"./gsap-SFc2wnMY.js";(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))n(i);new MutationObserver(i=>{for(const s of i)if(s.type==="childList")for(const l of s.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&n(l)}).observe(document,{childList:!0,subtree:!0});function e(i){const s={};return i.integrity&&(s.integrity=i.integrity),i.referrerPolicy&&(s.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?s.credentials="include":i.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function n(i){if(i.ep)return;i.ep=!0;const s=e(i);fetch(i.href,s)}})();function Te(o){return o*o*o*(o*(o*6-15)+10)}function ne(o,t,e){return o+e*(t-o)}function X(o,t,e){const n=o&3,i=n<2?t:e,s=n<2?e:t;return(o&1?-i:i)+(o&2?-s:s)}const E=Array.from({length:512},(o,t)=>t).sort(()=>Math.random()-.5);for(let o=0;o<256;o++)E[o+256]=E[o];function gt(o,t){const e=Math.floor(o)&255,n=Math.floor(t)&255,i=o-Math.floor(o),s=t-Math.floor(t),l=Te(i),r=Te(s),d=E[E[e]+n],f=E[E[e]+n+1],m=E[E[e+1]+n],P=E[E[e+1]+n+1];return ne(ne(X(d,i,s),X(m,i-1,s),l),ne(X(f,i,s-1),X(P,i-1,s-1),l),r)}function xe(o,t,e=4,n=2,i=.5){let s=0,l=.5,r=1;for(let d=0;d<e;d++)s+=gt(o*r,t*r)*l,r*=n,l*=i;return s}function y(o,t){return o+Math.random()*(t-o)}function ke(o,t){return Math.floor(y(o,t+1))}const wt=`
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
`,yt=`
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
`,Ct=`
varying vec2 vUv;
varying vec3 vWorldPos;
varying vec3 vNormal;
void main() {
  vUv = uv;
  vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,bt=`
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
`,St=`
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
`,At=`
varying float vAlpha;
void main() {
  gl_FragColor = vec4(0.55, 0.75, 1.0, vAlpha * 0.35);
}
`,Pt=`
varying vec3 vLocalPos;
void main() {
  vLocalPos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,Tt=`
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
`,xt=`
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
`,kt=`
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
`,A=32,G=16,Et=6,$=G+Et,Y=A/2*$,ie={color:new c(197400),near:100,far:500},ue=[new c(62975),new c(62975),new c(16711850),new c(16711850),new c(16739098),new c(8073215),new c(8073215),new c(65416),new c(65416),new c(16770626)];function Mt(){return new _({vertexShader:wt,fragmentShader:yt,uniforms:{uTime:{value:0},uFogColor:{value:ie.color},uFogNear:{value:ie.near},uFogFar:{value:ie.far}}})}function Lt(o,t){const e=o/A,n=t/A;return e<.35&&n<.35?0:e<.65&&n<.35?1:e>=.65&&n<.35?2:e<.35&&n<.65?3:e>=.65&&n<.65?4:e<.35&&n>=.65?5:e<.65&&n>=.65?6:e>=.65&&n>=.65?7:n>.45&&n<.55?8:9}class It{constructor(){u(this,"meshA");u(this,"meshB");u(this,"meshC");u(this,"mats",[])}generate(t){const e=A*A,n=Mt();this.mats.push(n);const i=new be(1,1,1),s=new Float32Array(e),l=new Float32Array(e*3);i.setAttribute("aHeight",new I(s,1)),i.setAttribute("aNeonColor",new I(l,3)),this.meshA=new j(i,n.clone(),e),this.meshA.frustumCulled=!1,this.mats.push(this.meshA.material);const r=new Se(.45,.55,1,10),d=new Float32Array(e),f=new Float32Array(e*3);r.setAttribute("aHeight",new I(d,1)),r.setAttribute("aNeonColor",new I(f,3)),this.meshB=new j(r,n.clone(),e),this.meshB.frustumCulled=!1,this.mats.push(this.meshB.material);const m=new be(1,.4,1),P=new Float32Array(e),h=new Float32Array(e*3);m.setAttribute("aHeight",new I(P,1)),m.setAttribute("aNeonColor",new I(h,3)),this.meshC=new j(m,n.clone(),e),this.meshC.frustumCulled=!1,this.mats.push(this.meshC.material);const C=new le,b=new a,g=new a,T=new ce;let x=0,S=0,p=0;for(let v=0;v<A;v++)for(let w=0;w<A;w++){const M=v*$-Y,F=w*$-Y;if(v%5===0||w%5===0||v%2===0&&w%2===0&&Math.random()<.25)continue;const D=v/A*4-2,Q=w/A*4-2,We=xe(D,Q,5),Ve=Math.sqrt(D*D+Q*Q)/3,je=Math.max(.18,1-Ve*.6),U=Math.max(8,(22+We*170)*je)+y(4,28),we=y(G*.42,G*.9),ye=y(G*.42,G*.9),$e=Lt(v,w),L=ue[$e],Ce=Math.random();if(Ce<.65)s[x]=U,l[x*3]=L.r,l[x*3+1]=L.g,l[x*3+2]=L.b,b.set(M,U/2,F),g.set(we,U,ye),C.compose(b,T,g),this.meshA.setMatrixAt(x,C),x++;else if(Ce<.82){const z=y(G*.18,G*.32);d[S]=U,f[S*3]=L.r,f[S*3+1]=L.g,f[S*3+2]=L.b,b.set(M+y(-3,3),U/2,F+y(-3,3)),g.set(z*2,U,z*2),C.compose(b,T,g),this.meshB.setMatrixAt(S,C),S++}else{const z=Math.max(6,U*.35);P[p]=z,h[p*3]=L.r,h[p*3+1]=L.g,h[p*3+2]=L.b,b.set(M,z/2,F),g.set(we*1.4,z,ye*1.4),C.compose(b,T,g),this.meshC.setMatrixAt(p,C),p++}}this.meshA.count=x,this.meshB.count=S,this.meshC.count=p;for(const v of[this.meshA,this.meshB,this.meshC]){v.instanceMatrix.needsUpdate=!0;const w=v.geometry;w.getAttribute("aHeight").needsUpdate=!0,w.getAttribute("aNeonColor").needsUpdate=!0,t.add(v)}}addAntennas(t){const e=new Se(.1,.1,1,4),n=new Ae({color:16716083}),i=new j(e,n,400);i.frustumCulled=!1;const s=new le,l=new a,r=new a,d=new ce;let f=0;for(let m=0;m<400;m++){const P=ke(0,A-1),h=ke(0,A-1),C=P*$-Y,b=h*$-Y,g=P/A*4-2,T=h/A*4-2,x=Math.max(.18,1-Math.sqrt(g*g+T*T)/3*.6),S=Math.max(8,(22+xe(g,T,5)*170)*x)+20,p=y(8,30);l.set(C+y(-3,3),S+p/2,b+y(-3,3)),r.set(1,p,1),s.compose(l,d,r),i.setMatrixAt(f++,s)}i.count=f,i.instanceMatrix.needsUpdate=!0,t.add(i)}addNeonSigns(t,e){e.forEach(({text:n,pos:i,color:s})=>{const l=document.createElement("canvas");l.width=256,l.height=64;const r=l.getContext("2d");r.clearRect(0,0,256,64),r.fillStyle=s+"22",r.fillRect(0,0,256,64),r.strokeStyle=s,r.lineWidth=2,r.strokeRect(2,2,252,60),r.fillStyle=s,r.font="bold 22px monospace",r.textAlign="center",r.fillText(n,128,40);const d=new Xe(l),f=new fe(18,4.5),m=new Ae({map:d,transparent:!0,side:De,depthWrite:!1}),P=new me(f,m);P.position.copy(i),t.add(P)})}update(t){for(const e of this.mats)e.uniforms.uTime.value=t}}class Nt{constructor(){u(this,"mesh");u(this,"mat")}create(t){const e=new fe(1200,1200,1,1);return this.mat=new _({vertexShader:Ct,fragmentShader:bt,uniforms:{uTime:{value:0},uDistrictNeon:{value:new c(62975)},uRainIntensity:{value:1}}}),this.mesh=new me(e,this.mat),this.mesh.rotation.x=-Math.PI/2,this.mesh.position.y=0,t.add(this.mesh),this.mesh}update(t){this.mat.uniforms.uTime.value=t}setDistrictNeon(t){this.mat.uniforms.uDistrictNeon.value.copy(t)}setRainIntensity(t){this.mat.uniforms.uRainIntensity.value=t}}class Rt{constructor(){u(this,"points");u(this,"count",8e3)}create(t){const e=new Float32Array(this.count*3),n=new Float32Array(this.count),i=new Float32Array(this.count);for(let r=0;r<this.count;r++)e[r*3]=y(-300,300),e[r*3+1]=y(-60,60),e[r*3+2]=y(-300,300),n[r]=y(.3,1),i[r]=Math.random();const s=new Ye;s.setAttribute("position",new ee(e,3)),s.setAttribute("aSpeed",new ee(n,1)),s.setAttribute("aOffset",new ee(i,1));const l=new _({vertexShader:St,fragmentShader:At,uniforms:{uTime:{value:0}},transparent:!0,blending:Ue,depthWrite:!1});this.points=new Ke(s,l),t.add(this.points)}update(t,e){const n=this.points.material;n.uniforms.uTime.value=t,e&&(this.points.position.x=e.x,this.points.position.z=e.z)}}class Ft{constructor(){u(this,"mesh");u(this,"mat")}create(t){const e=new Ze(2e3,32,16);this.mat=new _({vertexShader:Pt,fragmentShader:Tt,uniforms:{uTime:{value:0},uZenithColor:{value:new c(132104)},uHorizonColor:{value:new c(1706e3)},uDistrictNeon:{value:new c(62975)}},side:Je,depthWrite:!1}),this.mesh=new me(e,this.mat),this.mesh.renderOrder=-1,t.add(this.mesh)}update(t,e,n){this.mesh.position.copy(e),this.mat.uniforms.uTime.value=t,n&&this.mat.uniforms.uDistrictNeon.value.copy(n)}setDistrictColors(t,e){this.mat.uniforms.uHorizonColor.value.copy(t),this.mat.uniforms.uDistrictNeon.value.copy(e)}}function Dt(o){let t=o;return()=>{t|=0,t=t+1831565813|0;let e=Math.imul(t^t>>>15,1|t);return e=e+Math.imul(e^e>>>7,61|e)^e,((e^e>>>14)>>>0)/4294967296}}const Ee=[new c(16720384),new c(61183),new c(22015),new c(16711884),new c(65382),new c(16737792),new c(11141375),new c(16770626)],de=32,Ge=16,Ut=6,he=Ge+Ut,Me=de/2*he;class Gt{constructor(){u(this,"mesh");u(this,"mat")}create(t){const n=new fe(5,1.4),i=new Float32Array(150*3),s=new Float32Array(150),l=new Float32Array(150);n.setAttribute("aColor",new I(i,3)),n.setAttribute("aFlickerSeed",new I(s,1)),n.setAttribute("aPulseMode",new I(l,1)),this.mat=new _({vertexShader:xt,fragmentShader:kt,uniforms:{uTime:{value:0}},transparent:!0,depthWrite:!1,side:De,blending:Ue}),this.mesh=new j(n,this.mat,150),this.mesh.frustumCulled=!1;const r=Dt(42),d=new le,f=new a,m=new ce,P=new a(1,1,1);let h=0;for(let C=0;C<de&&h<150;C++)for(let b=0;b<de&&h<150;b++){if(C%5===0||b%5===0||r()>.1)continue;const g=C*he-Me,T=b*he-Me,x=6+r()*12,S=Math.floor(r()*4),p=Ge*.5+.3;let v=g,w=T,M=0;S===0?(w=T+p,M=0):S===1?(w=T-p,M=Math.PI):S===2?(v=g+p,M=Math.PI*.5):(v=g-p,M=-Math.PI*.5),f.set(v,x,w),m.setFromEuler(new Qe(0,M,0)),d.compose(f,m,P),this.mesh.setMatrixAt(h,d);const F=Ee[Math.floor(r()*Ee.length)];i[h*3]=F.r,i[h*3+1]=F.g,i[h*3+2]=F.b,s[h]=r();const D=r();l[h]=D<.6?0:D<.85?1:D<.95?2:3,h++}this.mesh.count=h,this.mesh.instanceMatrix.needsUpdate=!0,n.getAttribute("aColor").needsUpdate=!0,n.getAttribute("aFlickerSeed").needsUpdate=!0,n.getAttribute("aPulseMode").needsUpdate=!0,t.add(this.mesh)}update(t){this.mat.uniforms.uTime.value=t}}const Bt=`
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
`;class Ot extends vt{constructor(t=.45){super("LensStreakEffect",Bt,{uniforms:new Map([["uIntensity",new et(t)]])})}}class zt{constructor(){u(this,"composer");u(this,"glitch");u(this,"glitchTimeout",0)}setup(t,e,n){this.composer=new lt(t);const i=new ct(e,n),s=new ut({blendFunction:te.ADD,luminanceThreshold:.25,luminanceSmoothing:.4,intensity:2.4,radius:.6}),l=new Ot(.45),r=new dt({offset:new q(.0018,.0012),radialModulation:!0,modulationOffset:.5}),d=new ht({eskil:!1,offset:.35,darkness:.75}),f=new ft({blendFunction:te.OVERLAY,premultiply:!0});f.blendMode.opacity.value=.04;const m=new mt({blendFunction:te.OVERLAY,density:1.4});return m.blendMode.opacity.value=.07,this.glitch=new pt({delay:new q(99999,99999),duration:new q(.15,.35),strength:new q(.15,.4),columns:.04,ratio:.85}),this.composer.addPass(i),this.composer.addPass(new oe(n,s,l)),this.composer.addPass(new oe(n,r,m,d,f)),this.composer.addPass(new oe(n,this.glitch)),this.composer}triggerGlitch(){this.glitch.delay.set(0,.05),clearTimeout(this.glitchTimeout),this.glitchTimeout=window.setTimeout(()=>{this.glitch.delay.set(99999,99999)},600)}resize(t,e){this.composer.setSize(t,e)}render(){this.composer.render()}}const R=[{pos:new a(0,180,220),look:new a(0,0,0),label:"HERO"},{pos:new a(-40,12,110),look:new a(-20,20,60),label:"ABOUT"},{pos:new a(-90,28,60),look:new a(-60,18,30),label:"PS3 GPU"},{pos:new a(-80,18,-10),look:new a(-50,12,-30),label:"CPUonGPU"},{pos:new a(-30,10,-60),look:new a(0,20,-90),label:"GPU Stream"},{pos:new a(20,35,-80),look:new a(40,25,-110),label:"Selkies"},{pos:new a(80,55,-70),look:new a(100,35,-100),label:"Oris AI"},{pos:new a(110,40,0),look:new a(90,22,-20),label:"VajraGrid"},{pos:new a(100,20,70),look:new a(70,14,50),label:"VidyaMitra"},{pos:new a(50,16,100),look:new a(20,12,80),label:"Netflip"},{pos:new a(10,22,90),look:new a(-20,16,70),label:"Arena"},{pos:new a(-30,60,70),look:new a(-10,40,40),label:"Hackathon"},{pos:new a(-60,8,30),look:new a(-40,8,0),label:"SKILLS"},{pos:new a(0,120,160),look:new a(0,0,0),label:"CONTACT"}];class Ht{constructor(t){u(this,"camera");u(this,"currentSection",0);u(this,"mouseX",0);u(this,"mouseY",0);u(this,"parallaxTarget",new a);u(this,"onSectionChange");this.camera=t,this.init()}init(){const t=R[0];this.camera.position.copy(t.pos),this.camera.lookAt(t.look),window.addEventListener("mousemove",e=>{this.mouseX=(e.clientX/window.innerWidth-.5)*2,this.mouseY=(e.clientY/window.innerHeight-.5)*2}),this.setupScrollListener(),window.addEventListener("keydown",e=>{(e.key==="ArrowDown"||e.key==="ArrowRight")&&this.goTo(this.currentSection+1),(e.key==="ArrowUp"||e.key==="ArrowLeft")&&this.goTo(this.currentSection-1)})}setupScrollListener(){let t=0,e=!1;window.addEventListener("wheel",n=>{if(e)return;e=!0;const i=n.deltaY>0?1:-1;this.goTo(this.currentSection+i),setTimeout(()=>{e=!1},900)},{passive:!0}),window.addEventListener("touchstart",n=>{t=n.touches[0].clientY}),window.addEventListener("touchend",n=>{const i=t-n.changedTouches[0].clientY;Math.abs(i)>40&&this.goTo(this.currentSection+(i>0?1:-1))})}goTo(t){var l;if(t=Math.max(0,Math.min(R.length-1,t)),t===this.currentSection)return;this.currentSection=t;const e=R[t];Pe.to(this.camera.position,{x:e.pos.x,y:e.pos.y,z:e.pos.z,duration:1.8,ease:"power2.inOut"}),Pe.to(this.parallaxTarget,{x:e.look.x,y:e.look.y,z:e.look.z,duration:1.8,ease:"power2.inOut",onUpdate:()=>this.camera.lookAt(this.parallaxTarget)}),(l=this.onSectionChange)==null||l.call(this,t),document.querySelectorAll(".nav-dot").forEach((r,d)=>r.classList.toggle("active",d===t));const i=t/(R.length-1)*100,s=document.getElementById("progress-bar");s&&(s.style.height=i+"%")}update(t){const e=R[this.currentSection],n=new a(e.look.x+this.mouseX*8,e.look.y-this.mouseY*5,e.look.z);this.camera.lookAt(n)}getCurrentSection(){return this.currentSection}}const Be=[{id:"ps3-gpu",title:"PS3 Cell GPU Emulator",subtitle:"Systems / Emulation",desc:"Full emulation of the Cell Broadband Engine's SPU pipeline in WebGL. 6 SPU cores, PPE scheduler, DMA bus — running real PS3 shaders in the browser at 200 GIPS.",tags:["C++","WebGL","GLSL","Cell BE","Emulation"],url:"https://github.com/aerosane",neonColor:"#00f5ff",district:"GPU DISTRICT",icon:"⬡"},{id:"cpuongpu",title:"CPUonGPU",subtitle:"Architecture Research",desc:"Runs a full x86 CPU simulation entirely on GPU compute shaders. Register file, ALU, cache hierarchy — all in GLSL. JIT-compiled x86 → SPIR-V at runtime.",tags:["GLSL","Compute Shaders","x86","JIT","SPIR-V"],url:"https://github.com/aerosane",neonColor:"#00f5ff",district:"GPU DISTRICT",icon:"⬢"},{id:"gpu-streaming",title:"GPU Streaming Pipeline",subtitle:"NvFBC + NVENC",desc:"Sub-frame-latency game streaming via NvFBC capture → NVENC H265/AV1 encode → WebRTC TURN relay. <1 frame E2E latency. Deployed on GitHub Codespace GPU.",tags:["NVENC","NvFBC","WebRTC","Rust","H265"],url:"https://github.com/Imperialorg/codespace",neonColor:"#00f5ff",district:"GPU DISTRICT",icon:"▶"},{id:"selkies-rust",title:"Selkies-Rust",subtitle:"Python→Rust Port",desc:"Complete rewrite of the Selkies WebRTC game streaming stack from Python into Rust. 6 crates: pipeline, signaling, input, encoding, metrics, CLI.",tags:["Rust","WebRTC","GStreamer","Tokio","GSAP"],url:"https://github.com/Imperialorg/codespace",neonColor:"#ff6b1a",district:"SYSTEMS CORRIDOR",icon:"⚙"},{id:"oris-ai",title:"Oris — AI SRE",subtitle:"🏆 Runner-up · TechSynapse 2026",desc:"Autonomous Site Reliability Engineer: ingests production logs, PII-masks with Presidio, infers root cause via Gemini 2.0, opens GitHub PRs with fixes. Zero human touch.",tags:["Python","Gemini 2.0","Presidio","LangChain","FastAPI"],url:"https://github.com/aerosane",neonColor:"#ff00aa",district:"AI DISTRICT",icon:"◈"},{id:"vajragrid",title:"VajraGrid",subtitle:"🇮🇳 India Innovates 2026 · Bharat Mandapam",desc:"AI-hardened power grid security: detects SCADA cyberattacks in 16s, 4-layer ML defense stack, adversarial training. Exhibited nationally at Bharat Mandapam.",tags:["Python","PyTorch","SCADA","Adversarial ML","GridSec"],url:"https://github.com/aerosane",neonColor:"#ff00aa",district:"AI DISTRICT",icon:"⚡"},{id:"vidyamitra",title:"VidyaMitra",subtitle:"IISER JEE Prep",desc:"AI tutor for JEE aspirants: adaptive quiz engine, LaTeX equation rendering, spaced repetition. Covers Physics, Chemistry, Math with difficulty auto-calibration.",tags:["TypeScript","React","LaTeX","OpenAI","Supabase"],url:"https://github.com/aerosane",neonColor:"#00ff88",district:"EDTECH ZONE",icon:"⬟"},{id:"netflip",title:"Netflip VOD",subtitle:"Full-Stack Streaming",desc:"Netflix-clone with HLS adaptive streaming, Azure Blob CDN, Fastly edge cache, WebSocket live chat, OAuth2, recommendation engine. 1080p adaptive bitrate.",tags:["Next.js","HLS","Azure","Fastly","PostgreSQL"],url:"https://github.com/aerosane",neonColor:"#7b2fff",district:"WEB DISTRICT",icon:"▨"},{id:"coding-arena",title:"Coding Arena",subtitle:"Competitive Judging Platform",desc:"Online judge with isolated Docker execution, multi-language support, real-time leaderboard, plagiarism detection via AST similarity. 200ms median judge latency.",tags:["Go","Docker","Redis","React","WebSocket"],url:"https://github.com/aerosane",neonColor:"#7b2fff",district:"WEB DISTRICT",icon:"{ }"},{id:"hackathon",title:"Hackathon Wins",subtitle:"Hall of Fame",desc:"🏆 Runner-up at TechSynapse 2026 (Oris AI SRE). 🇮🇳 National exhibition at India Innovates 2026, Bharat Mandapam, New Delhi (VajraGrid). 1st year, two nationals.",tags:["Oris AI","VajraGrid","TechSynapse","India Innovates"],url:"https://github.com/aerosane",neonColor:"#ffe642",district:"HALL OF FAME",icon:"🏆"}],Wt={Languages:["C++","Rust","Python","TypeScript","Go","GLSL/HLSL"],Systems:["WebRTC","WebGL/WebGPU","NVENC/NvFBC","Docker","Linux"],"AI/ML":["PyTorch","Gemini API","LangChain","Presidio","HuggingFace"],Web:["React","Next.js","Vite","Node.js","PostgreSQL","Redis"],Tools:["Git","GitHub Actions","Azure","GStreamer","Tokio"]},Vt=document.getElementById("scene-canvas"),H=new tt({canvas:Vt,antialias:!0,alpha:!1,powerPreference:"high-performance"});H.setPixelRatio(Math.min(devicePixelRatio,2));H.setSize(innerWidth,innerHeight);H.toneMapping=ot;H.toneMappingExposure=.95;const k=new nt;k.background=new c(131602);k.fog=new it(197400,.003);const O=new st(60,innerWidth/innerHeight,.5,1200),J=new zt;J.setup(H,k,O);const pe=new Ft;pe.create(k);const B=new It;B.generate(k);B.addAntennas(k);const jt=Be.map((o,t)=>{const e=R[t+2];return{text:o.district,pos:new a(e.pos.x+12,80,e.pos.z-18),color:o.neonColor}});B.addNeonSigns(k,jt);const Oe=new Gt;Oe.create(k);const ve=new Nt;ve.create(k);const ze=new Rt;ze.create(k);const $t=new rt(128,0,.4);k.add($t);const Z=new c(62975);function _t(o){const t=Math.min(o,ue.length-1);Z.copy(ue[t]),ve.setDistrictNeon(Z),pe.update(0,O.position,Z)}const ge=new Ht(O);ge.onSectionChange=o=>{Xt(o),Yt(o),_t(o),J.triggerGlitch()};const qt=document.getElementById("nav-dots");R.forEach((o,t)=>{const e=document.createElement("div");e.className="nav-dot"+(t===0?" active":""),e.title=o.label,e.addEventListener("click",()=>ge.goTo(t)),qt.appendChild(e)});function Xt(o){document.querySelectorAll(".sect").forEach((t,e)=>{t.classList.toggle("active",e===o)}),document.querySelectorAll(".nav-dot").forEach((t,e)=>{t.classList.toggle("active",e===o)})}function Yt(o){const t=document.getElementById("hud-section");t&&(t.textContent=`DISTRICT_${String(o).padStart(2,"0")} / ${R[o].label}`)}Be.forEach((o,t)=>{const e=document.getElementById(`proj-${t+2}`);e&&(e.style.setProperty("--neon",o.neonColor),e.style.borderColor=o.neonColor+"44",e.innerHTML=`
    <div class="proj-icon" style="color:${o.neonColor};text-shadow:0 0 14px ${o.neonColor}">${o.icon}</div>
    <div class="proj-content">
      <div class="proj-district">${o.district}</div>
      <div class="proj-title" style="text-shadow:0 0 20px ${o.neonColor}88">${o.title}</div>
      <div class="proj-subtitle">${o.subtitle}</div>
      <p class="proj-desc">${o.desc}</p>
      <div class="proj-tags">${o.tags.map(n=>`<span class="proj-tag" style="border-color:${o.neonColor}44;color:${o.neonColor}">${n}</span>`).join("")}</div>
      <a class="proj-link" href="${o.url}" target="_blank" style="color:${o.neonColor};border-color:${o.neonColor}">[ VIEW SOURCE → ]</a>
    </div>
  `)});const Le=document.getElementById("skills-grid");Le&&Object.entries(Wt).forEach(([o,t])=>{const e=document.createElement("div");e.className="skill-cat",e.innerHTML=`<div class="skill-cat-name">// ${o}</div>`+t.map(n=>`<div class="skill-item">${n}</div>`).join(""),Le.appendChild(e)});const N=document.getElementById("contact-input"),K=document.getElementById("contact-input-display");var Fe;(Fe=document.getElementById("sect-13"))==null||Fe.addEventListener("click",()=>N==null?void 0:N.focus());N==null||N.addEventListener("input",()=>{K&&(K.textContent=(N.value||"")+"_"),N.value.trim().toLowerCase()==="sudo"&&(Kt(),N.value="",K&&(K.textContent="_"))});function Kt(){const o=document.querySelector("#sect-13 .terminal-body");if(!o)return;const t=document.createElement("p");t.className="output neon-green",t.textContent="> Permission granted. Downloading your future...",o.appendChild(t),setTimeout(()=>{const e=document.createElement("p");e.className="output",e.innerHTML='<span style="color:#ffe642">root@neon-district:~# ██████████ 100%  COMPLETE</span>',o.appendChild(e)},1500)}const Ie=["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];let W=0;window.addEventListener("keydown",o=>{o.key===Ie[W]?W++:W=0,W===Ie.length&&(W=0,Zt())});let se=!1;function Zt(){se=!se,[B.meshA,B.meshB,B.meshC].forEach(o=>{const t=o.material;t.wireframe=se})}const re=document.getElementById("boot-log"),Ne=document.getElementById("boot-bar"),V=document.getElementById("loading-screen"),ae=["Initializing WebGPU context","Generating city geometry","Compiling 47 shader programs","Spawning rain particles","Calibrating post-processing chain","System ready"];async function Jt(){for(let o=0;o<ae.length;o++){await new Promise(e=>setTimeout(e,260+Math.random()*200));const t=document.createElement("p");t.innerHTML=`<span style="color:rgba(0,245,255,.5)">[BOOT]</span> ${ae[o]}... <span class="ok">[OK]</span>`,re==null||re.appendChild(t),Ne&&(Ne.style.width=(o+1)/ae.length*100+"%")}await new Promise(o=>setTimeout(o,600)),V==null||V.classList.add("fade-out"),setTimeout(()=>{V&&(V.style.display="none")},850)}Jt();window.addEventListener("resize",()=>{O.aspect=innerWidth/innerHeight,O.updateProjectionMatrix(),H.setSize(innerWidth,innerHeight),J.resize(innerWidth,innerHeight)});const Re=new at;function He(){requestAnimationFrame(He);const o=Re.getElapsedTime(),t=Re.getDelta();B.update(o),ve.update(o),ze.update(o,O.position),Oe.update(o),pe.update(o,O.position,Z),ge.update(t),J.render()}He();
