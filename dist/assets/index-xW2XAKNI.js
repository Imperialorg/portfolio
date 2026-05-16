var st=Object.defineProperty;var at=(n,e,o)=>e in n?st(n,e,{enumerable:!0,configurable:!0,writable:!0,value:o}):n[e]=o;var c=(n,e,o)=>at(n,typeof e!="symbol"?e+"":e,o);import{i as m,d as ge,I as R,q as $,j as Ie,s as we,a2 as r,Q as ye,u as W,C as je,x as ae,m as Xe,t as Q,X as ee,f as qe,e as ie,a as J,y as $e,Y as rt,B as lt,E as ct,a1 as Y,_ as ut,g as Le,G as Ce,p as dt,z as ht,a5 as ft,A as mt,W as pt,o as vt,P as gt,H as wt,S as yt,h as bt}from"./three-uBnUpQ-C.js";import{b as St,R as Ct,a as Pt,B as ce,C as At,V as xt,N as Tt,S as Et,G as kt,c as ue,E as Mt}from"./postprocessing-DQ1XEIde.js";import{g as _}from"./gsap-SFc2wnMY.js";(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const t of document.querySelectorAll('link[rel="modulepreload"]'))i(t);new MutationObserver(t=>{for(const s of t)if(s.type==="childList")for(const l of s.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&i(l)}).observe(document,{childList:!0,subtree:!0});function o(t){const s={};return t.integrity&&(s.integrity=t.integrity),t.referrerPolicy&&(s.referrerPolicy=t.referrerPolicy),t.crossOrigin==="use-credentials"?s.credentials="include":t.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function i(t){if(t.ep)return;t.ep=!0;const s=o(t);fetch(t.href,s)}})();function Re(n){return n*n*n*(n*(n*6-15)+10)}function de(n,e,o){return n+o*(e-n)}function te(n,e,o){const i=n&3,t=i<2?e:o,s=i<2?o:e;return(n&1?-t:t)+(n&2?-s:s)}const I=Array.from({length:512},(n,e)=>e).sort(()=>Math.random()-.5);for(let n=0;n<256;n++)I[n+256]=I[n];function It(n,e){const o=Math.floor(n)&255,i=Math.floor(e)&255,t=n-Math.floor(n),s=e-Math.floor(e),l=Re(t),a=Re(s),g=I[I[o]+i],w=I[I[o]+i+1],h=I[I[o+1]+i],f=I[I[o+1]+i+1];return de(de(te(g,t,s),te(h,t-1,s),l),de(te(w,t,s-1),te(f,t-1,s-1),l),a)}function Ne(n,e,o=4,i=2,t=.5){let s=0,l=.5,a=1;for(let g=0;g<o;g++)s+=It(n*a,e*a)*l,a*=i,l*=t;return s}function A(n,e){return n+Math.random()*(e-n)}function Fe(n,e){return Math.floor(A(n,e+1))}const Lt=`
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
`,Rt=`
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
`,Nt=`
varying vec2 vUv;
varying vec3 vWorldPos;
varying vec3 vNormal;
void main() {
  vUv = uv;
  vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,Ft=`
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
`,Ut=`
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
`,Dt=`
varying float vAlpha;
void main() {
  gl_FragColor = vec4(0.55, 0.75, 1.0, vAlpha * 0.35);
}
`,Gt=`
varying vec3 vLocalPos;
void main() {
  vLocalPos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,Ot=`
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
`,Bt=`
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
`,zt=`
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
`,T=32,B=16,Ht=6,K=B+Ht,oe=T/2*K,he={color:new m(197400),near:100,far:500},Z=[new m(62975),new m(62975),new m(16711850),new m(16711850),new m(16739098),new m(8073215),new m(8073215),new m(65416),new m(65416),new m(16770626)];function Wt(){return new ee({vertexShader:Lt,fragmentShader:Rt,uniforms:{uTime:{value:0},uFogColor:{value:he.color},uFogNear:{value:he.near},uFogFar:{value:he.far}}})}function _t(n,e){const o=n/T,i=e/T;return o<.35&&i<.35?0:o<.65&&i<.35?1:o>=.65&&i<.35?2:o<.35&&i<.65?3:o>=.65&&i<.65?4:o<.35&&i>=.65?5:o<.65&&i>=.65?6:o>=.65&&i>=.65?7:i>.45&&i<.55?8:9}class Vt{constructor(){c(this,"meshA");c(this,"meshB");c(this,"meshC");c(this,"mats",[])}generate(e){const o=T*T,i=Wt();this.mats.push(i);const t=new ge(1,1,1),s=new Float32Array(o),l=new Float32Array(o*3);t.setAttribute("aHeight",new R(s,1)),t.setAttribute("aNeonColor",new R(l,3)),this.meshA=new $(t,i.clone(),o),this.meshA.frustumCulled=!1,this.mats.push(this.meshA.material);const a=new Ie(.45,.55,1,10),g=new Float32Array(o),w=new Float32Array(o*3);a.setAttribute("aHeight",new R(g,1)),a.setAttribute("aNeonColor",new R(w,3)),this.meshB=new $(a,i.clone(),o),this.meshB.frustumCulled=!1,this.mats.push(this.meshB.material);const h=new ge(1,.4,1),f=new Float32Array(o),u=new Float32Array(o*3);h.setAttribute("aHeight",new R(f,1)),h.setAttribute("aNeonColor",new R(u,3)),this.meshC=new $(h,i.clone(),o),this.meshC.frustumCulled=!1,this.mats.push(this.meshC.material);const d=new we,p=new r,C=new r,x=new ye;let P=0,y=0,b=0;for(let S=0;S<T;S++)for(let v=0;v<T;v++){const M=S*K-oe,D=v*K-oe;if(S%5===0||v%5===0||S%2===0&&v%2===0&&Math.random()<.25)continue;const G=S/T*4-2,le=v/T*4-2,tt=Ne(G,le,5),ot=Math.sqrt(G*G+le*le)/3,nt=Math.max(.18,1-ot*.6),O=Math.max(8,(22+tt*170)*nt)+A(4,28),Ee=A(B*.42,B*.9),ke=A(B*.42,B*.9),it=_t(S,v),L=Z[it],Me=Math.random();if(Me<.65)s[P]=O,l[P*3]=L.r,l[P*3+1]=L.g,l[P*3+2]=L.b,p.set(M,O/2,D),C.set(Ee,O,ke),d.compose(p,x,C),this.meshA.setMatrixAt(P,d),P++;else if(Me<.82){const H=A(B*.18,B*.32);g[y]=O,w[y*3]=L.r,w[y*3+1]=L.g,w[y*3+2]=L.b,p.set(M+A(-3,3),O/2,D+A(-3,3)),C.set(H*2,O,H*2),d.compose(p,x,C),this.meshB.setMatrixAt(y,d),y++}else{const H=Math.max(6,O*.35);f[b]=H,u[b*3]=L.r,u[b*3+1]=L.g,u[b*3+2]=L.b,p.set(M,H/2,D),C.set(Ee*1.4,H,ke*1.4),d.compose(p,x,C),this.meshC.setMatrixAt(b,d),b++}}this.meshA.count=P,this.meshB.count=y,this.meshC.count=b;for(const S of[this.meshA,this.meshB,this.meshC]){S.instanceMatrix.needsUpdate=!0;const v=S.geometry;v.getAttribute("aHeight").needsUpdate=!0,v.getAttribute("aNeonColor").needsUpdate=!0,e.add(S)}}addAntennas(e){const o=new Ie(.1,.1,1,4),i=new W({color:16716083}),t=new $(o,i,400);t.frustumCulled=!1;const s=new we,l=new r,a=new r,g=new ye;let w=0;for(let h=0;h<400;h++){const f=Fe(0,T-1),u=Fe(0,T-1),d=f*K-oe,p=u*K-oe,C=f/T*4-2,x=u/T*4-2,P=Math.max(.18,1-Math.sqrt(C*C+x*x)/3*.6),y=Math.max(8,(22+Ne(C,x,5)*170)*P)+20,b=A(8,30);l.set(d+A(-3,3),y+b/2,p+A(-3,3)),a.set(1,b,1),s.compose(l,g,a),t.setMatrixAt(w++,s)}t.count=w,t.instanceMatrix.needsUpdate=!0,e.add(t)}addNeonSigns(e,o){o.forEach(({text:i,pos:t,color:s})=>{const l=document.createElement("canvas");l.width=256,l.height=64;const a=l.getContext("2d");a.clearRect(0,0,256,64),a.fillStyle=s+"22",a.fillRect(0,0,256,64),a.strokeStyle=s,a.lineWidth=2,a.strokeRect(2,2,252,60),a.fillStyle=s,a.font="bold 22px monospace",a.textAlign="center",a.fillText(i,128,40);const g=new je(l),w=new ae(18,4.5),h=new W({map:g,transparent:!0,side:Xe,depthWrite:!1}),f=new Q(w,h);f.position.copy(t),e.add(f)})}update(e){for(const o of this.mats)o.uniforms.uTime.value=e}}class jt{constructor(){c(this,"mesh");c(this,"mat")}create(e){const o=new ae(1200,1200,1,1);return this.mat=new ee({vertexShader:Nt,fragmentShader:Ft,uniforms:{uTime:{value:0},uDistrictNeon:{value:new m(62975)},uRainIntensity:{value:1}}}),this.mesh=new Q(o,this.mat),this.mesh.rotation.x=-Math.PI/2,this.mesh.position.y=0,e.add(this.mesh),this.mesh}update(e){this.mat.uniforms.uTime.value=e}setDistrictNeon(e){this.mat.uniforms.uDistrictNeon.value.copy(e)}setRainIntensity(e){this.mat.uniforms.uRainIntensity.value=e}}class Xt{constructor(){c(this,"points");c(this,"count",8e3)}create(e){const o=new Float32Array(this.count*3),i=new Float32Array(this.count),t=new Float32Array(this.count);for(let a=0;a<this.count;a++)o[a*3]=A(-300,300),o[a*3+1]=A(-60,60),o[a*3+2]=A(-300,300),i[a]=A(.3,1),t[a]=Math.random();const s=new qe;s.setAttribute("position",new ie(o,3)),s.setAttribute("aSpeed",new ie(i,1)),s.setAttribute("aOffset",new ie(t,1));const l=new ee({vertexShader:Ut,fragmentShader:Dt,uniforms:{uTime:{value:0}},transparent:!0,blending:J,depthWrite:!1});this.points=new $e(s,l),e.add(this.points)}update(e,o){const i=this.points.material;i.uniforms.uTime.value=e,o&&(this.points.position.x=o.x,this.points.position.z=o.z)}}class qt{constructor(){c(this,"mesh");c(this,"mat")}create(e){const o=new rt(2e3,32,16);this.mat=new ee({vertexShader:Gt,fragmentShader:Ot,uniforms:{uTime:{value:0},uZenithColor:{value:new m(132104)},uHorizonColor:{value:new m(1706e3)},uDistrictNeon:{value:new m(62975)}},side:lt,depthWrite:!1}),this.mesh=new Q(o,this.mat),this.mesh.renderOrder=-1,e.add(this.mesh)}update(e,o,i){this.mesh.position.copy(o),this.mat.uniforms.uTime.value=e,i&&this.mat.uniforms.uDistrictNeon.value.copy(i)}setDistrictColors(e,o){this.mat.uniforms.uHorizonColor.value.copy(e),this.mat.uniforms.uDistrictNeon.value.copy(o)}}function $t(n){let e=n;return()=>{e|=0,e=e+1831565813|0;let o=Math.imul(e^e>>>15,1|e);return o=o+Math.imul(o^o>>>7,61|o)^o,((o^o>>>14)>>>0)/4294967296}}const Ue=[new m(16720384),new m(61183),new m(22015),new m(16711884),new m(65382),new m(16737792),new m(11141375),new m(16770626)],be=32,Ye=16,Yt=6,Se=Ye+Yt,De=be/2*Se;class Kt{constructor(){c(this,"mesh");c(this,"mat")}create(e){const i=new ae(5,1.4),t=new Float32Array(150*3),s=new Float32Array(150),l=new Float32Array(150);i.setAttribute("aColor",new R(t,3)),i.setAttribute("aFlickerSeed",new R(s,1)),i.setAttribute("aPulseMode",new R(l,1)),this.mat=new ee({vertexShader:Bt,fragmentShader:zt,uniforms:{uTime:{value:0}},transparent:!0,depthWrite:!1,side:Xe,blending:J}),this.mesh=new $(i,this.mat,150),this.mesh.frustumCulled=!1;const a=$t(42),g=new we,w=new r,h=new ye,f=new r(1,1,1);let u=0;for(let d=0;d<be&&u<150;d++)for(let p=0;p<be&&u<150;p++){if(d%5===0||p%5===0||a()>.1)continue;const C=d*Se-De,x=p*Se-De,P=6+a()*12,y=Math.floor(a()*4),b=Ye*.5+.3;let S=C,v=x,M=0;y===0?(v=x+b,M=0):y===1?(v=x-b,M=Math.PI):y===2?(S=C+b,M=Math.PI*.5):(S=C-b,M=-Math.PI*.5),w.set(S,P,v),h.setFromEuler(new ct(0,M,0)),g.compose(w,h,f),this.mesh.setMatrixAt(u,g);const D=Ue[Math.floor(a()*Ue.length)];t[u*3]=D.r,t[u*3+1]=D.g,t[u*3+2]=D.b,s[u]=a();const G=a();l[u]=G<.6?0:G<.85?1:G<.95?2:3,u++}this.mesh.count=u,this.mesh.instanceMatrix.needsUpdate=!0,i.getAttribute("aColor").needsUpdate=!0,i.getAttribute("aFlickerSeed").needsUpdate=!0,i.getAttribute("aPulseMode").needsUpdate=!0,e.add(this.mesh)}update(e){this.mat.uniforms.uTime.value=e}}const Jt=`
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
`;class Zt extends Mt{constructor(e=.45){super("LensStreakEffect",Jt,{uniforms:new Map([["uIntensity",new ut(e)]])})}}class Qt{constructor(){c(this,"composer");c(this,"glitch");c(this,"glitchTimeout",0)}setup(e,o,i){this.composer=new St(e);const t=new Ct(o,i),s=new Pt({blendFunction:ce.ADD,luminanceThreshold:.25,luminanceSmoothing:.4,intensity:2.4,radius:.6}),l=new Zt(.45),a=new At({offset:new Y(.0018,.0012),radialModulation:!0,modulationOffset:.5}),g=new xt({eskil:!1,offset:.35,darkness:.75}),w=new Tt({blendFunction:ce.OVERLAY,premultiply:!0});w.blendMode.opacity.value=.04;const h=new Et({blendFunction:ce.OVERLAY,density:1.4});return h.blendMode.opacity.value=.07,this.glitch=new kt({delay:new Y(99999,99999),duration:new Y(.15,.35),strength:new Y(.15,.4),columns:.04,ratio:.85}),this.composer.addPass(t),this.composer.addPass(new ue(i,s,l)),this.composer.addPass(new ue(i,a,h,g,w)),this.composer.addPass(new ue(i,this.glitch)),this.composer}triggerGlitch(){this.glitch.delay.set(0,.05),clearTimeout(this.glitchTimeout),this.glitchTimeout=window.setTimeout(()=>{this.glitch.delay.set(99999,99999)},600)}resize(e,o){this.composer.setSize(e,o)}render(){this.composer.render()}}const k=[{pos:new r(0,180,220),look:new r(0,0,0),label:"HERO",t:0},{pos:new r(-40,12,110),look:new r(-20,20,60),label:"ABOUT",t:0},{pos:new r(-80,58,48),look:new r(-80,58,20),label:"PS3 GPU",t:0},{pos:new r(-75,62,3),look:new r(-75,62,-25),label:"CPUonGPU",t:0},{pos:new r(-13,58,-62),look:new r(0,58,-90),label:"GPU Stream",t:0},{pos:new r(19,58,-82),look:new r(40,58,-110),label:"Selkies",t:0},{pos:new r(90,58,-71),look:new r(100,58,-100),label:"Oris AI",t:0},{pos:new r(101,58,8),look:new r(90,58,-20),label:"VajraGrid",t:0},{pos:new r(84,55,76),look:new r(70,55,50),label:"VidyaMitra",t:0},{pos:new r(34,55,106),look:new r(20,55,80),label:"Netflip",t:0},{pos:new r(-5,55,96),look:new r(-20,55,70),label:"Arena",t:0},{pos:new r(-20,62,67),look:new r(-10,62,40),label:"Hackathon",t:0},{pos:new r(-60,8,30),look:new r(-40,8,0),label:"SKILLS",t:0},{pos:new r(0,120,160),look:new r(0,0,0),label:"CONTACT",t:0}],eo=1600;class to{constructor(e){c(this,"camera");c(this,"posSpline");c(this,"lookSpline");c(this,"t",0);c(this,"currentSection",0);c(this,"mouseX",0);c(this,"mouseY",0);c(this,"_pos",new r);c(this,"_look",new r);c(this,"_ahead",new r);c(this,"onSectionChange");c(this,"_lastFiredSection",0);this.camera=e,this.buildSpline(),this.init()}buildSpline(){const e=k.map(t=>t.pos.clone()),o=k.map(t=>t.look.clone());this.posSpline=new Le(e,!1,"catmullrom",.5),this.lookSpline=new Le(o,!1,"catmullrom",.5);const i=k.length;k.forEach((t,s)=>{t.t=s/(i-1)}),this.t=0,this.posSpline.getPoint(0,this._pos),this.lookSpline.getPoint(0,this._look),this.camera.position.copy(this._pos),this.camera.lookAt(this._look)}init(){window.addEventListener("mousemove",i=>{this.mouseX=(i.clientX/window.innerWidth-.5)*2,this.mouseY=(i.clientY/window.innerHeight-.5)*2});let e=!1;window.addEventListener("wheel",i=>{if(e)return;e=!0;const t=i.deltaY>0?1:-1;this.goTo(this.currentSection+t),setTimeout(()=>{e=!1},eo)},{passive:!0});let o=0;window.addEventListener("touchstart",i=>{o=i.touches[0].clientY}),window.addEventListener("touchend",i=>{const t=o-i.changedTouches[0].clientY;Math.abs(t)>40&&this.goTo(this.currentSection+(t>0?1:-1))}),window.addEventListener("keydown",i=>{(i.key==="ArrowDown"||i.key==="ArrowRight")&&this.goTo(this.currentSection+1),(i.key==="ArrowUp"||i.key==="ArrowLeft")&&this.goTo(this.currentSection-1)})}goTo(e){if(e=Math.max(0,Math.min(k.length-1,e)),e===this.currentSection)return;const o=this.currentSection;this.currentSection=e;const i=k[e].t,s=.6+Math.abs(i-this.t)*5;_.killTweensOf(this),_.to(this,{t:i,duration:s,ease:"power2.inOut",onUpdate:()=>this._fireCrossings(o,e),onComplete:()=>{var l;this._lastFiredSection=e,(l=this.onSectionChange)==null||l.call(this,e),this._updateUI(e)}}),this._updateUI(e)}_fireCrossings(e,o){const i=o>e?1:-1;k.forEach((t,s)=>{var a;(i>0?this.t>=t.t&&s>this._lastFiredSection&&s<=o:this.t<=t.t&&s<this._lastFiredSection&&s>=o)&&(this._lastFiredSection=s,(a=this.onSectionChange)==null||a.call(this,s),this._updateUI(s))})}update(e){this.posSpline.getPoint(this.t,this._pos),this.camera.position.copy(this._pos);const o=Math.min(1,this.t+.015);this.posSpline.getPoint(o,this._ahead),this.lookSpline.getPoint(this.t,this._look);const i=this._look.x*.8+this._ahead.x*.2+this.mouseX*5,t=this._look.y*.8+this._ahead.y*.2-this.mouseY*3,s=this._look.z*.8+this._ahead.z*.2;this.camera.lookAt(i,t,s)}_updateUI(e){document.querySelectorAll(".nav-dot").forEach((i,t)=>i.classList.toggle("active",t===e));const o=document.getElementById("progress-bar");o&&(o.style.height=e/(k.length-1)*100+"%")}getCurrentSection(){return this.currentSection}}const Ke=[{id:"ps3-gpu",title:"PS3 Cell GPU Emulator",subtitle:"Systems / Emulation",desc:"Full emulation of the Cell Broadband Engine's SPU pipeline in WebGL. 6 SPU cores, PPE scheduler, DMA bus — running real PS3 shaders in the browser at 200 GIPS.",tags:["C++","WebGL","GLSL","Cell BE","Emulation"],url:"https://github.com/Aerosane/ps3-cell-gpu-emulator",neonColor:"#00f5ff",district:"GPU DISTRICT",icon:"⬡"},{id:"cpuongpu",title:"CPUonGPU",subtitle:"Architecture Research",desc:"Runs a full x86 CPU simulation entirely on GPU compute shaders. Register file, ALU, cache hierarchy — all in GLSL. JIT-compiled x86 → SPIR-V at runtime.",tags:["GLSL","Compute Shaders","x86","JIT","SPIR-V"],url:"https://github.com/Aerosane/cpuongpu",neonColor:"#00f5ff",district:"GPU DISTRICT",icon:"⬢"},{id:"gpu-streaming",title:"GPU Streaming Pipeline",subtitle:"NvFBC + NVENC",desc:"Sub-frame-latency game streaming via NvFBC capture → NVENC H265/AV1 encode → WebRTC TURN relay. <1 frame E2E latency. Deployed on GitHub Codespace GPU.",tags:["NVENC","NvFBC","WebRTC","Rust","H265"],url:"https://github.com/Aerosane/gpu-streaming-nvfbc",neonColor:"#00f5ff",district:"GPU DISTRICT",icon:"▶"},{id:"selkies-rust",title:"Selkies-Rust",subtitle:"Python→Rust Port",desc:"Complete rewrite of the Selkies WebRTC game streaming stack from Python into Rust. 6 crates: pipeline, signaling, input, encoding, metrics, CLI.",tags:["Rust","WebRTC","GStreamer","Tokio","GSAP"],url:"https://github.com/Aerosane/selkies-rust",neonColor:"#ff6b1a",district:"SYSTEMS CORRIDOR",icon:"⚙"},{id:"oris-ai",title:"Oris — AI SRE",subtitle:"🏆 Runner-up · TechSynapse 2026",desc:"Autonomous Site Reliability Engineer: ingests production logs, PII-masks with Presidio, infers root cause via Gemini 2.0, opens GitHub PRs with fixes. Zero human touch.",tags:["Python","Gemini 2.0","Presidio","LangChain","FastAPI"],url:"https://github.com/Aerosane/oris",neonColor:"#ff00aa",district:"AI DISTRICT",icon:"◈"},{id:"vajragrid",title:"VajraGrid",subtitle:"🇮🇳 India Innovates 2026 · Bharat Mandapam",desc:"AI-hardened power grid security: detects SCADA cyberattacks in 16s, 4-layer ML defense stack, adversarial training. Exhibited nationally at Bharat Mandapam.",tags:["Python","PyTorch","SCADA","Adversarial ML","GridSec"],url:"https://github.com/Aerosane/vajragridr",neonColor:"#ff00aa",district:"AI DISTRICT",icon:"⚡"},{id:"vidyamitra",title:"VidyaMitra",subtitle:"IISER JEE Prep",desc:"AI tutor for JEE aspirants: adaptive quiz engine, LaTeX equation rendering, spaced repetition. Covers Physics, Chemistry, Math with difficulty auto-calibration.",tags:["TypeScript","React","LaTeX","OpenAI","Supabase"],url:"https://github.com/Aerosane/vidyamitra",neonColor:"#00ff88",district:"EDTECH ZONE",icon:"⬟"},{id:"netflip",title:"Netflip VOD",subtitle:"Full-Stack Streaming",desc:"Netflix-clone with HLS adaptive streaming, Azure Blob CDN, Fastly edge cache, WebSocket live chat, OAuth2, recommendation engine. 1080p adaptive bitrate.",tags:["Next.js","HLS","Azure","Fastly","PostgreSQL"],url:"https://github.com/Aerosane/netflip-vod",neonColor:"#7b2fff",district:"WEB DISTRICT",icon:"▨"},{id:"coding-arena",title:"Coding Arena",subtitle:"Competitive Judging Platform",desc:"Online judge with isolated Docker execution, multi-language support, real-time leaderboard, plagiarism detection via AST similarity. 200ms median judge latency.",tags:["Go","Docker","Redis","React","WebSocket"],url:"https://github.com/Aerosane/coding_arena",neonColor:"#7b2fff",district:"WEB DISTRICT",icon:"{ }"},{id:"hackathon",title:"Hackathon Wins",subtitle:"Hall of Fame",desc:"🏆 Runner-up at TechSynapse 2026 (Oris AI SRE). 🇮🇳 National exhibition at India Innovates 2026, Bharat Mandapam, New Delhi (VajraGrid). 1st year, two nationals.",tags:["Oris AI","VajraGrid","TechSynapse","India Innovates"],url:"https://github.com/Aerosane",neonColor:"#ffe642",district:"HALL OF FAME",icon:"🏆"}],oo={Languages:["C++","Rust","Python","TypeScript","Go","GLSL/HLSL"],Systems:["WebRTC","WebGL/WebGPU","NVENC/NvFBC","Docker","Linux"],"AI/ML":["PyTorch","Gemini API","LangChain","Presidio","HuggingFace"],Web:["React","Next.js","Vite","Node.js","PostgreSQL","Redis"],Tools:["Git","GitHub Actions","Azure","GStreamer","Tokio"]};class no{constructor(){c(this,"group",new Ce);c(this,"hoverTargets",[]);c(this,"visible",!1);c(this,"visibleValue",0)}enter(){this.group.visible=!0,this.visible=!0,_.killTweensOf(this),_.to(this,{visibleValue:1,duration:1.4,ease:"power2.out",onUpdate:()=>this.setVisible(this.visibleValue)})}exit(){this.visible=!1,_.killTweensOf(this),_.to(this,{visibleValue:0,duration:.8,ease:"power2.in",onUpdate:()=>this.setVisible(this.visibleValue),onComplete:()=>{this.group.visible=!1}})}setVisible(e){}dispose(){this.group.traverse(e=>{e.geometry&&e.geometry.dispose()})}}function io(n){const i=document.createElement("canvas");i.width=900,i.height=440;const t=i.getContext("2d"),s=n.neonColor;t.fillStyle="#03040f",t.fillRect(0,0,900,440);for(let d=0;d<440;d+=4)t.fillStyle="rgba(0,0,0,0.18)",t.fillRect(0,d,900,2);const l=t.createLinearGradient(0,0,14,0);l.addColorStop(0,s),l.addColorStop(1,"transparent"),t.fillStyle=l,t.shadowColor=s,t.shadowBlur=28,t.fillRect(0,0,7,440),t.shadowBlur=0,t.font="bold 11px monospace",t.fillStyle=s+"aa",t.textAlign="left",t.fillText("◈ "+n.district.toUpperCase(),24,28);const a=n.title.length>18?48:n.title.length>13?58:70;t.font=`bold ${a}px monospace`,t.shadowColor=s,t.shadowBlur=50,t.fillStyle="#ffffff",t.fillText(n.title,24,62+(70-a)),t.shadowBlur=26,t.fillStyle=s+"bb",t.fillText(n.title,24,62+(70-a)),t.shadowBlur=0,t.font="18px monospace",t.fillStyle="rgba(255,255,255,0.65)",t.fillText(n.subtitle,24,138),t.font="14px monospace",t.fillStyle="rgba(200,220,255,0.45)";const g=852,w=n.desc.split(" "),h=[];let f="";for(const d of w){const p=f?f+" "+d:d;if(t.measureText(p).width>g){if(h.length===1){h.push(f+"…"),f="";break}h.push(f),f=d}else f=p}f&&h.length<2&&h.push(f),h.forEach((d,p)=>t.fillText(d,24,164+p*20)),t.strokeStyle=s+"30",t.lineWidth=1,t.beginPath(),t.moveTo(24,212),t.lineTo(876,212),t.stroke(),t.font="bold 13px monospace";let u=24;for(const d of n.tags.slice(0,5)){const p=t.measureText(d).width+20;if(u+p>876)break;t.fillStyle=s+"18",t.fillRect(u,224,p,26),t.strokeStyle=s+"66",t.lineWidth=1,t.strokeRect(u,224,p,26),t.fillStyle=s+"ee",t.fillText(d,u+10,241),u+=p+8}return t.font="12px monospace",t.fillStyle="rgba(255,255,255,0.22)",t.fillText(n.url.replace("https://",""),24,278),t.font="bold 13px monospace",t.shadowColor=s,t.shadowBlur=14,t.fillStyle=s+"99",t.fillText("▶  CLICK TO VIEW PROJECT",24,422),t.shadowBlur=0,new je(i)}function F(n,e,o,i,t){const s=new Q(new ge(n,e,o),t);return s.position.copy(i),s.frustumCulled=!1,s}class so extends no{constructor(o,i,t){super();c(this,"projIdx");c(this,"panelPos");c(this,"camPos");c(this,"fadeMats",[]);c(this,"particleMat");this.projIdx=o,this.panelPos=i,this.camPos=t}create(o){o.add(this.group);const i=Ke[this.projIdx],t=new m(i.neonColor),s=new Ce;s.position.copy(this.panelPos);const l=this.camPos.x-this.panelPos.x,a=this.camPos.z-this.panelPos.z;s.rotation.y=Math.atan2(l,a),this.group.add(s);const g=(v,M)=>(v.opacity=0,this.fadeMats.push([v,M]),v),w=g(new W({map:io(i),transparent:!0,depthWrite:!1,side:dt,alphaTest:.01}),1),h=new Q(new ae(40,19.5),w);h.frustumCulled=!1,h.userData.isLabel=!0,h.userData.onClick=()=>window.open(i.url,"_blank"),s.add(h);const f=g(new W({color:t,transparent:!0,blending:J,depthWrite:!1}),.85);s.add(F(41,.5,.4,new r(0,9.75,.1),f)),s.add(F(41,.5,.4,new r(0,-9.75,.1),f)),s.add(F(.5,20.5,.4,new r(-20.25,0,.1),f)),s.add(F(.5,20.5,.4,new r(20.25,0,.1),f));const u=60,d=g(new W({color:2763326,transparent:!0}),1),p=new r(-13,-9.75-u/2,0),C=new r(13,-9.75-u/2,0);s.add(F(.9,u,.9,p,d)),s.add(F(.9,u,.9,C,d)),s.add(F(27,.7,.9,new r(0,-9.75-u+.4,0),d));const x=g(new W({color:t,transparent:!0,blending:J,depthWrite:!1}),.5);s.add(F(41,.3,.1,new r(0,9.75,.2),x));const P=60,y=new Float32Array(P*3);for(let v=0;v<P;v++)y[v*3]=this.panelPos.x+(Math.random()-.5)*60,y[v*3+1]=this.panelPos.y+(Math.random()-.5)*35,y[v*3+2]=this.panelPos.z+(Math.random()-.5)*60;const b=new qe;b.setAttribute("position",new ie(y,3)),this.particleMat=new ht({size:.4,color:t,transparent:!0,opacity:0,blending:J,sizeAttenuation:!0});const S=new $e(b,this.particleMat);S.frustumCulled=!1,this.group.add(S)}update(o){}setVisible(o){for(const[i,t]of this.fadeMats)i.opacity=o*t;this.particleMat&&(this.particleMat.opacity=o*.45)}onHover(){}}const ao=[[2,0],[3,1],[4,2],[5,3],[6,4],[7,5],[8,6],[9,7],[10,8],[11,9]];class ro{constructor(e,o){c(this,"envs",new Map);c(this,"activeEnv",null);c(this,"activeIdx",-1);for(const[i,t]of ao){const s=k[i],l=new so(t,s.look.clone(),s.pos.clone());l.create(e),l.group.visible=!1,this.envs.set(i,l)}}onSection(e){if(e===this.activeIdx)return;this.activeIdx=e,this.activeEnv&&(this.activeEnv.exit(),this.activeEnv=null);const o=this.envs.get(e);o&&(this.activeEnv=o,o.enter())}update(e){this.activeEnv&&this.activeEnv.update(e)}}const lo=document.getElementById("scene-canvas"),j=new ft({canvas:lo,antialias:!0,alpha:!1,powerPreference:"high-performance"});j.setPixelRatio(Math.min(devicePixelRatio,2));j.setSize(innerWidth,innerHeight);j.toneMapping=mt;j.toneMappingExposure=.95;const E=new pt;E.background=new m(131602);E.fog=new vt(197400,.003);const U=new gt(60,innerWidth/innerHeight,.5,1200),re=new Qt;re.setup(j,E,U);const Pe=new qt;Pe.create(E);const z=new Vt;z.generate(E);const co=Ke.map((n,e)=>{const o=k[e+2];return{text:n.district,pos:new r(o.pos.x+12,80,o.pos.z-18),color:n.neonColor}});z.addNeonSigns(E,co);const Je=new Kt;Je.create(E);const Ae=new jt;Ae.create(E);const Ze=new Xt;Ze.create(E);const uo=new wt(128,0,.4);E.add(uo);const xe=new Ce;E.add(xe);var We,_e;(_e=(We=z.cityGroup)==null?void 0:We.children)==null||_e.forEach(n=>xe.add(n));const Qe=new ro(E,xe),se=new m(62975);function ho(n){const e=Math.min(n,Z.length-1);se.copy(Z[e]),Ae.setDistrictNeon(se),Pe.update(0,U.position,se)}const fo=[["NEON DISTRICT","A cyberpunk portfolio"],["ABOUT","Who is behind this"],["PS3 CELL GPU","PS3 SPU emulator in WebGL"],["CPUonGPU","x86 CPU running on GPU"],["GPU STREAMING","Sub-frame game streaming"],["SELKIES RUST","WebRTC stack rebuilt in Rust"],["ORIS AI","Autonomous SRE agent"],["VAJRAGRID","AI power grid security"],["VIDYAMITRA","Adaptive JEE AI tutor"],["NETFLIP","HLS streaming platform"],["ARENA OJ","Online judge platform"],["HACKATHON","Competition highlights"],["TECH STACK","Tools and languages"],["CONTACT","Get in touch"]],V=document.createElement("div");V.id="section-banner";Object.assign(V.style,{position:"fixed",bottom:"24px",left:"50%",transform:"translateX(-50%)",textAlign:"center",pointerEvents:"none",zIndex:"50",opacity:"0",transition:"opacity 0.4s",background:"rgba(0,0,8,0.65)",padding:"10px 28px",borderTop:"1px solid currentColor"});document.body.appendChild(V);function mo(n){const[e,o]=fo[n]??["",""],i=Z[n]?"#"+Z[n].getHexString():"#00f5ff";V.style.color=i,V.innerHTML=`
    <div style="font-family:monospace;font-size:8px;letter-spacing:4px;color:${i};margin-bottom:4px;text-transform:uppercase;opacity:0.7">
      DISTRICT_${String(n).padStart(2,"0")}
    </div>
    <div style="font-family:monospace;font-size:1.1rem;font-weight:900;color:#fff;
                text-shadow:0 0 20px ${i},0 0 40px ${i}88;letter-spacing:0.08em;line-height:1.1">
      ${e}
    </div>
    <div style="font-family:monospace;font-size:0.75rem;color:${i};
                letter-spacing:0.15em;margin-top:4px;opacity:0.85">
      ${o}
    </div>
  `,V.style.opacity="1"}const Te=new to(U);Te.onSectionChange=n=>{vo(n),go(n),ho(n),re.triggerGlitch(),Qe.onSection(n),mo(n)};const po=document.getElementById("nav-dots");k.forEach((n,e)=>{const o=document.createElement("div");o.className="nav-dot"+(e===0?" active":""),o.title=n.label,o.addEventListener("click",()=>Te.goTo(e)),po.appendChild(o)});function vo(n){document.querySelectorAll(".sect").forEach((e,o)=>{e.classList.toggle("active",o===n)}),document.querySelectorAll(".nav-dot").forEach((e,o)=>{e.classList.toggle("active",o===n)})}function go(n){const e=document.getElementById("hud-section");e&&(e.textContent=`DISTRICT_${String(n).padStart(2,"0")} / ${k[n].label}`)}const Ge=document.getElementById("skills-grid");Ge&&Object.entries(oo).forEach(([n,e])=>{const o=document.createElement("div");o.className="skill-cat",o.innerHTML=`<div class="skill-cat-name">// ${n}</div>`+e.map(i=>`<div class="skill-item">${i}</div>`).join(""),Ge.appendChild(o)});const N=document.getElementById("contact-input"),ne=document.getElementById("contact-input-display");var Ve;(Ve=document.getElementById("sect-13"))==null||Ve.addEventListener("click",()=>N==null?void 0:N.focus());N==null||N.addEventListener("input",()=>{ne&&(ne.textContent=(N.value||"")+"_"),N.value.trim().toLowerCase()==="sudo"&&(wo(),N.value="",ne&&(ne.textContent="_"))});function wo(){const n=document.querySelector("#sect-13 .terminal-body");if(!n)return;const e=document.createElement("p");e.className="output neon-green",e.textContent="> Permission granted. Downloading your future...",n.appendChild(e),setTimeout(()=>{const o=document.createElement("p");o.className="output",o.innerHTML='<span style="color:#ffe642">root@neon-district:~# ██████████ 100%  COMPLETE</span>',n.appendChild(o)},1500)}const Oe=["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];let X=0;window.addEventListener("keydown",n=>{n.key===Oe[X]?X++:X=0,X===Oe.length&&(X=0,yo())});let fe=!1;function yo(){fe=!fe,[z.meshA,z.meshB,z.meshC].forEach(n=>{const e=n.material;e.wireframe=fe})}const me=document.getElementById("boot-log"),Be=document.getElementById("boot-bar"),q=document.getElementById("loading-screen"),pe=["Initializing WebGPU context","Generating city geometry","Compiling 47 shader programs","Spawning rain particles","Calibrating post-processing chain","System ready"];async function bo(){for(let n=0;n<pe.length;n++){await new Promise(o=>setTimeout(o,260+Math.random()*200));const e=document.createElement("p");e.innerHTML=`<span style="color:rgba(0,245,255,.5)">[BOOT]</span> ${pe[n]}... <span class="ok">[OK]</span>`,me==null||me.appendChild(e),Be&&(Be.style.width=(n+1)/pe.length*100+"%")}await new Promise(n=>setTimeout(n,600)),q==null||q.classList.add("fade-out"),setTimeout(()=>{q&&(q.style.display="none")},850)}bo();const ze=new yt,ve=new Y;window.addEventListener("click",n=>{if(n.target.closest("#env-detail-panel"))return;ve.x=n.clientX/innerWidth*2-1,ve.y=-(n.clientY/innerHeight)*2+1,ze.setFromCamera(ve,U);const e=ze.intersectObjects(E.children,!0);for(const o of e){const i=o.object;if(i.userData.isLabel&&i.userData.onClick){n.stopPropagation(),i.userData.onClick();return}}});window.addEventListener("resize",()=>{U.aspect=innerWidth/innerHeight,U.updateProjectionMatrix(),j.setSize(innerWidth,innerHeight),re.resize(innerWidth,innerHeight)});const He=new bt;function et(){requestAnimationFrame(et);const n=He.getElapsedTime(),e=He.getDelta();z.update(n),Ae.update(n),Ze.update(n,U.position),Je.update(n),Pe.update(n,U.position,se),Te.update(e),Qe.update(n),re.render()}et();
