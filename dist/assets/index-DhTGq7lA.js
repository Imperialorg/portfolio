var at=Object.defineProperty;var rt=(t,e,o)=>e in t?at(t,e,{enumerable:!0,configurable:!0,writable:!0,value:o}):t[e]=o;var c=(t,e,o)=>rt(t,typeof e!="symbol"?e+"":e,o);import{i as d,d as Me,I as R,q as X,j as Ie,s as me,a2 as r,Q as ve,u as ge,C as $e,x as ne,m as be,t as ie,X as J,f as qe,e as te,a as Ce,y as Xe,Y as lt,B as ct,E as dt,a1 as Y,_ as ut,g as Le,G as Ye,z as ht,a5 as ft,A as pt,W as mt,o as vt,P as gt,H as wt,S as yt,h as bt}from"./three-uBnUpQ-C.js";import{b as Ct,R as St,a as xt,B as re,C as Pt,V as At,N as Tt,S as Et,G as kt,c as le,E as Mt}from"./postprocessing-DQ1XEIde.js";import{g as _}from"./gsap-SFc2wnMY.js";(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))i(n);new MutationObserver(n=>{for(const s of n)if(s.type==="childList")for(const l of s.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&i(l)}).observe(document,{childList:!0,subtree:!0});function o(n){const s={};return n.integrity&&(s.integrity=n.integrity),n.referrerPolicy&&(s.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?s.credentials="include":n.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function i(n){if(n.ep)return;n.ep=!0;const s=o(n);fetch(n.href,s)}})();function Re(t){return t*t*t*(t*(t*6-15)+10)}function ce(t,e,o){return t+o*(e-t)}function Z(t,e,o){const i=t&3,n=i<2?e:o,s=i<2?o:e;return(t&1?-n:n)+(t&2?-s:s)}const M=Array.from({length:512},(t,e)=>e).sort(()=>Math.random()-.5);for(let t=0;t<256;t++)M[t+256]=M[t];function It(t,e){const o=Math.floor(t)&255,i=Math.floor(e)&255,n=t-Math.floor(t),s=e-Math.floor(e),l=Re(n),a=Re(s),f=M[M[o]+i],u=M[M[o]+i+1],h=M[M[o+1]+i],C=M[M[o+1]+i+1];return ce(ce(Z(f,n,s),Z(h,n-1,s),l),ce(Z(u,n,s-1),Z(C,n-1,s-1),l),a)}function Ne(t,e,o=4,i=2,n=.5){let s=0,l=.5,a=1;for(let f=0;f<o;f++)s+=It(t*a,e*a)*l,a*=i,l*=n;return s}function y(t,e){return t+Math.random()*(e-t)}function Fe(t,e){return Math.floor(y(t,e+1))}const Lt=`
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
`,zt=`
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
`,Bt=`
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
`,A=32,B=16,Ht=6,K=B+Ht,Q=A/2*K,de={color:new d(197400),near:100,far:500},j=[new d(62975),new d(62975),new d(16711850),new d(16711850),new d(16739098),new d(8073215),new d(8073215),new d(65416),new d(65416),new d(16770626)];function _t(){return new J({vertexShader:Lt,fragmentShader:Rt,uniforms:{uTime:{value:0},uFogColor:{value:de.color},uFogNear:{value:de.near},uFogFar:{value:de.far}}})}function Wt(t,e){const o=t/A,i=e/A;return o<.35&&i<.35?0:o<.65&&i<.35?1:o>=.65&&i<.35?2:o<.35&&i<.65?3:o>=.65&&i<.65?4:o<.35&&i>=.65?5:o<.65&&i>=.65?6:o>=.65&&i>=.65?7:i>.45&&i<.55?8:9}class Vt{constructor(){c(this,"meshA");c(this,"meshB");c(this,"meshC");c(this,"mats",[])}generate(e){const o=A*A,i=_t();this.mats.push(i);const n=new Me(1,1,1),s=new Float32Array(o),l=new Float32Array(o*3);n.setAttribute("aHeight",new R(s,1)),n.setAttribute("aNeonColor",new R(l,3)),this.meshA=new X(n,i.clone(),o),this.meshA.frustumCulled=!1,this.mats.push(this.meshA.material);const a=new Ie(.45,.55,1,10),f=new Float32Array(o),u=new Float32Array(o*3);a.setAttribute("aHeight",new R(f,1)),a.setAttribute("aNeonColor",new R(u,3)),this.meshB=new X(a,i.clone(),o),this.meshB.frustumCulled=!1,this.mats.push(this.meshB.material);const h=new Me(1,.4,1),C=new Float32Array(o),p=new Float32Array(o*3);h.setAttribute("aHeight",new R(C,1)),h.setAttribute("aNeonColor",new R(p,3)),this.meshC=new X(h,i.clone(),o),this.meshC.frustumCulled=!1,this.mats.push(this.meshC.material);const S=new me,x=new r,g=new r,T=new ve;let E=0,P=0,m=0;for(let v=0;v<A;v++)for(let w=0;w<A;w++){const I=v*K-Q,G=w*K-Q;if(v%5===0||w%5===0||v%2===0&&w%2===0&&Math.random()<.25)continue;const O=v/A*4-2,ae=w/A*4-2,ot=Ne(O,ae,5),nt=Math.sqrt(O*O+ae*ae)/3,it=Math.max(.18,1-nt*.6),z=Math.max(8,(22+ot*170)*it)+y(4,28),Te=y(B*.42,B*.9),Ee=y(B*.42,B*.9),st=Wt(v,w),L=j[st],ke=Math.random();if(ke<.65)s[E]=z,l[E*3]=L.r,l[E*3+1]=L.g,l[E*3+2]=L.b,x.set(I,z/2,G),g.set(Te,z,Ee),S.compose(x,T,g),this.meshA.setMatrixAt(E,S),E++;else if(ke<.82){const H=y(B*.18,B*.32);f[P]=z,u[P*3]=L.r,u[P*3+1]=L.g,u[P*3+2]=L.b,x.set(I+y(-3,3),z/2,G+y(-3,3)),g.set(H*2,z,H*2),S.compose(x,T,g),this.meshB.setMatrixAt(P,S),P++}else{const H=Math.max(6,z*.35);C[m]=H,p[m*3]=L.r,p[m*3+1]=L.g,p[m*3+2]=L.b,x.set(I,H/2,G),g.set(Te*1.4,H,Ee*1.4),S.compose(x,T,g),this.meshC.setMatrixAt(m,S),m++}}this.meshA.count=E,this.meshB.count=P,this.meshC.count=m;for(const v of[this.meshA,this.meshB,this.meshC]){v.instanceMatrix.needsUpdate=!0;const w=v.geometry;w.getAttribute("aHeight").needsUpdate=!0,w.getAttribute("aNeonColor").needsUpdate=!0,e.add(v)}}addAntennas(e){const o=new Ie(.1,.1,1,4),i=new ge({color:16716083}),n=new X(o,i,400);n.frustumCulled=!1;const s=new me,l=new r,a=new r,f=new ve;let u=0;for(let h=0;h<400;h++){const C=Fe(0,A-1),p=Fe(0,A-1),S=C*K-Q,x=p*K-Q,g=C/A*4-2,T=p/A*4-2,E=Math.max(.18,1-Math.sqrt(g*g+T*T)/3*.6),P=Math.max(8,(22+Ne(g,T,5)*170)*E)+20,m=y(8,30);l.set(S+y(-3,3),P+m/2,x+y(-3,3)),a.set(1,m,1),s.compose(l,f,a),n.setMatrixAt(u++,s)}n.count=u,n.instanceMatrix.needsUpdate=!0,e.add(n)}addNeonSigns(e,o){o.forEach(({text:i,pos:n,color:s})=>{const l=document.createElement("canvas");l.width=256,l.height=64;const a=l.getContext("2d");a.clearRect(0,0,256,64),a.fillStyle=s+"22",a.fillRect(0,0,256,64),a.strokeStyle=s,a.lineWidth=2,a.strokeRect(2,2,252,60),a.fillStyle=s,a.font="bold 22px monospace",a.textAlign="center",a.fillText(i,128,40);const f=new $e(l),u=new ne(18,4.5),h=new ge({map:f,transparent:!0,side:be,depthWrite:!1}),C=new ie(u,h);C.position.copy(n),e.add(C)})}update(e){for(const o of this.mats)o.uniforms.uTime.value=e}}class $t{constructor(){c(this,"mesh");c(this,"mat")}create(e){const o=new ne(1200,1200,1,1);return this.mat=new J({vertexShader:Nt,fragmentShader:Ft,uniforms:{uTime:{value:0},uDistrictNeon:{value:new d(62975)},uRainIntensity:{value:1}}}),this.mesh=new ie(o,this.mat),this.mesh.rotation.x=-Math.PI/2,this.mesh.position.y=0,e.add(this.mesh),this.mesh}update(e){this.mat.uniforms.uTime.value=e}setDistrictNeon(e){this.mat.uniforms.uDistrictNeon.value.copy(e)}setRainIntensity(e){this.mat.uniforms.uRainIntensity.value=e}}class qt{constructor(){c(this,"points");c(this,"count",8e3)}create(e){const o=new Float32Array(this.count*3),i=new Float32Array(this.count),n=new Float32Array(this.count);for(let a=0;a<this.count;a++)o[a*3]=y(-300,300),o[a*3+1]=y(-60,60),o[a*3+2]=y(-300,300),i[a]=y(.3,1),n[a]=Math.random();const s=new qe;s.setAttribute("position",new te(o,3)),s.setAttribute("aSpeed",new te(i,1)),s.setAttribute("aOffset",new te(n,1));const l=new J({vertexShader:Ut,fragmentShader:Dt,uniforms:{uTime:{value:0}},transparent:!0,blending:Ce,depthWrite:!1});this.points=new Xe(s,l),e.add(this.points)}update(e,o){const i=this.points.material;i.uniforms.uTime.value=e,o&&(this.points.position.x=o.x,this.points.position.z=o.z)}}class Xt{constructor(){c(this,"mesh");c(this,"mat")}create(e){const o=new lt(2e3,32,16);this.mat=new J({vertexShader:Gt,fragmentShader:Ot,uniforms:{uTime:{value:0},uZenithColor:{value:new d(132104)},uHorizonColor:{value:new d(1706e3)},uDistrictNeon:{value:new d(62975)}},side:ct,depthWrite:!1}),this.mesh=new ie(o,this.mat),this.mesh.renderOrder=-1,e.add(this.mesh)}update(e,o,i){this.mesh.position.copy(o),this.mat.uniforms.uTime.value=e,i&&this.mat.uniforms.uDistrictNeon.value.copy(i)}setDistrictColors(e,o){this.mat.uniforms.uHorizonColor.value.copy(e),this.mat.uniforms.uDistrictNeon.value.copy(o)}}function Yt(t){let e=t;return()=>{e|=0,e=e+1831565813|0;let o=Math.imul(e^e>>>15,1|e);return o=o+Math.imul(o^o>>>7,61|o)^o,((o^o>>>14)>>>0)/4294967296}}const Ue=[new d(16720384),new d(61183),new d(22015),new d(16711884),new d(65382),new d(16737792),new d(11141375),new d(16770626)],we=32,Ke=16,Kt=6,ye=Ke+Kt,De=we/2*ye;class jt{constructor(){c(this,"mesh");c(this,"mat")}create(e){const i=new ne(5,1.4),n=new Float32Array(150*3),s=new Float32Array(150),l=new Float32Array(150);i.setAttribute("aColor",new R(n,3)),i.setAttribute("aFlickerSeed",new R(s,1)),i.setAttribute("aPulseMode",new R(l,1)),this.mat=new J({vertexShader:zt,fragmentShader:Bt,uniforms:{uTime:{value:0}},transparent:!0,depthWrite:!1,side:be,blending:Ce}),this.mesh=new X(i,this.mat,150),this.mesh.frustumCulled=!1;const a=Yt(42),f=new me,u=new r,h=new ve,C=new r(1,1,1);let p=0;for(let S=0;S<we&&p<150;S++)for(let x=0;x<we&&p<150;x++){if(S%5===0||x%5===0||a()>.1)continue;const g=S*ye-De,T=x*ye-De,E=6+a()*12,P=Math.floor(a()*4),m=Ke*.5+.3;let v=g,w=T,I=0;P===0?(w=T+m,I=0):P===1?(w=T-m,I=Math.PI):P===2?(v=g+m,I=Math.PI*.5):(v=g-m,I=-Math.PI*.5),u.set(v,E,w),h.setFromEuler(new dt(0,I,0)),f.compose(u,h,C),this.mesh.setMatrixAt(p,f);const G=Ue[Math.floor(a()*Ue.length)];n[p*3]=G.r,n[p*3+1]=G.g,n[p*3+2]=G.b,s[p]=a();const O=a();l[p]=O<.6?0:O<.85?1:O<.95?2:3,p++}this.mesh.count=p,this.mesh.instanceMatrix.needsUpdate=!0,i.getAttribute("aColor").needsUpdate=!0,i.getAttribute("aFlickerSeed").needsUpdate=!0,i.getAttribute("aPulseMode").needsUpdate=!0,e.add(this.mesh)}update(e){this.mat.uniforms.uTime.value=e}}const Jt=`
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
`;class Zt extends Mt{constructor(e=.45){super("LensStreakEffect",Jt,{uniforms:new Map([["uIntensity",new ut(e)]])})}}class Qt{constructor(){c(this,"composer");c(this,"glitch");c(this,"glitchTimeout",0)}setup(e,o,i){this.composer=new Ct(e);const n=new St(o,i),s=new xt({blendFunction:re.ADD,luminanceThreshold:.25,luminanceSmoothing:.4,intensity:2.4,radius:.6}),l=new Zt(.45),a=new Pt({offset:new Y(.0018,.0012),radialModulation:!0,modulationOffset:.5}),f=new At({eskil:!1,offset:.35,darkness:.75}),u=new Tt({blendFunction:re.OVERLAY,premultiply:!0});u.blendMode.opacity.value=.04;const h=new Et({blendFunction:re.OVERLAY,density:1.4});return h.blendMode.opacity.value=.07,this.glitch=new kt({delay:new Y(99999,99999),duration:new Y(.15,.35),strength:new Y(.15,.4),columns:.04,ratio:.85}),this.composer.addPass(n),this.composer.addPass(new le(i,s,l)),this.composer.addPass(new le(i,a,h,f,u)),this.composer.addPass(new le(i,this.glitch)),this.composer}triggerGlitch(){this.glitch.delay.set(0,.05),clearTimeout(this.glitchTimeout),this.glitchTimeout=window.setTimeout(()=>{this.glitch.delay.set(99999,99999)},600)}resize(e,o){this.composer.setSize(e,o)}render(){this.composer.render()}}const k=[{pos:new r(0,180,220),look:new r(0,0,0),label:"HERO",t:0},{pos:new r(-40,12,110),look:new r(-20,20,60),label:"ABOUT",t:0},{pos:new r(-80,-8,55),look:new r(-80,-8,20),label:"PS3 GPU",t:0},{pos:new r(-75,30,-25),look:new r(-75,0,-25),label:"CPUonGPU",t:0},{pos:new r(-30,10,-60),look:new r(0,20,-90),label:"GPU Stream",t:0},{pos:new r(20,35,-80),look:new r(40,25,-110),label:"Selkies",t:0},{pos:new r(80,55,-70),look:new r(100,35,-100),label:"Oris AI",t:0},{pos:new r(110,40,0),look:new r(90,22,-20),label:"VajraGrid",t:0},{pos:new r(100,20,70),look:new r(70,14,50),label:"VidyaMitra",t:0},{pos:new r(50,16,100),look:new r(20,12,80),label:"Netflip",t:0},{pos:new r(10,22,90),look:new r(-20,16,70),label:"Arena",t:0},{pos:new r(-30,60,70),look:new r(-10,40,40),label:"Hackathon",t:0},{pos:new r(-60,8,30),look:new r(-40,8,0),label:"SKILLS",t:0},{pos:new r(0,120,160),look:new r(0,0,0),label:"CONTACT",t:0}],eo=1600;class to{constructor(e){c(this,"camera");c(this,"posSpline");c(this,"lookSpline");c(this,"t",0);c(this,"currentSection",0);c(this,"mouseX",0);c(this,"mouseY",0);c(this,"_pos",new r);c(this,"_look",new r);c(this,"_ahead",new r);c(this,"onSectionChange");c(this,"_lastFiredSection",0);this.camera=e,this.buildSpline(),this.init()}buildSpline(){const e=k.map(n=>n.pos.clone()),o=k.map(n=>n.look.clone());this.posSpline=new Le(e,!1,"catmullrom",.5),this.lookSpline=new Le(o,!1,"catmullrom",.5);const i=k.length;k.forEach((n,s)=>{n.t=s/(i-1)}),this.t=0,this.posSpline.getPoint(0,this._pos),this.lookSpline.getPoint(0,this._look),this.camera.position.copy(this._pos),this.camera.lookAt(this._look)}init(){window.addEventListener("mousemove",i=>{this.mouseX=(i.clientX/window.innerWidth-.5)*2,this.mouseY=(i.clientY/window.innerHeight-.5)*2});let e=!1;window.addEventListener("wheel",i=>{if(e)return;e=!0;const n=i.deltaY>0?1:-1;this.goTo(this.currentSection+n),setTimeout(()=>{e=!1},eo)},{passive:!0});let o=0;window.addEventListener("touchstart",i=>{o=i.touches[0].clientY}),window.addEventListener("touchend",i=>{const n=o-i.changedTouches[0].clientY;Math.abs(n)>40&&this.goTo(this.currentSection+(n>0?1:-1))}),window.addEventListener("keydown",i=>{(i.key==="ArrowDown"||i.key==="ArrowRight")&&this.goTo(this.currentSection+1),(i.key==="ArrowUp"||i.key==="ArrowLeft")&&this.goTo(this.currentSection-1)})}goTo(e){if(e=Math.max(0,Math.min(k.length-1,e)),e===this.currentSection)return;const o=this.currentSection;this.currentSection=e;const i=k[e].t,s=.6+Math.abs(i-this.t)*5;_.killTweensOf(this),_.to(this,{t:i,duration:s,ease:"power2.inOut",onUpdate:()=>this._fireCrossings(o,e),onComplete:()=>{var l;this._lastFiredSection=e,(l=this.onSectionChange)==null||l.call(this,e),this._updateUI(e)}}),this._updateUI(e)}_fireCrossings(e,o){const i=o>e?1:-1;k.forEach((n,s)=>{var a;(i>0?this.t>=n.t&&s>this._lastFiredSection&&s<=o:this.t<=n.t&&s<this._lastFiredSection&&s>=o)&&(this._lastFiredSection=s,(a=this.onSectionChange)==null||a.call(this,s),this._updateUI(s))})}update(e){this.posSpline.getPoint(this.t,this._pos),this.camera.position.copy(this._pos);const o=Math.min(1,this.t+.015);this.posSpline.getPoint(o,this._ahead),this.lookSpline.getPoint(this.t,this._look);const i=this._look.x*.8+this._ahead.x*.2+this.mouseX*5,n=this._look.y*.8+this._ahead.y*.2-this.mouseY*3,s=this._look.z*.8+this._ahead.z*.2;this.camera.lookAt(i,n,s)}_updateUI(e){document.querySelectorAll(".nav-dot").forEach((i,n)=>i.classList.toggle("active",n===e));const o=document.getElementById("progress-bar");o&&(o.style.height=e/(k.length-1)*100+"%")}getCurrentSection(){return this.currentSection}}const je=[{id:"ps3-gpu",title:"PS3 Cell GPU Emulator",subtitle:"Systems / Emulation",desc:"Full emulation of the Cell Broadband Engine's SPU pipeline in WebGL. 6 SPU cores, PPE scheduler, DMA bus — running real PS3 shaders in the browser at 200 GIPS.",tags:["C++","WebGL","GLSL","Cell BE","Emulation"],url:"https://github.com/aerosane",neonColor:"#00f5ff",district:"GPU DISTRICT",icon:"⬡"},{id:"cpuongpu",title:"CPUonGPU",subtitle:"Architecture Research",desc:"Runs a full x86 CPU simulation entirely on GPU compute shaders. Register file, ALU, cache hierarchy — all in GLSL. JIT-compiled x86 → SPIR-V at runtime.",tags:["GLSL","Compute Shaders","x86","JIT","SPIR-V"],url:"https://github.com/aerosane",neonColor:"#00f5ff",district:"GPU DISTRICT",icon:"⬢"},{id:"gpu-streaming",title:"GPU Streaming Pipeline",subtitle:"NvFBC + NVENC",desc:"Sub-frame-latency game streaming via NvFBC capture → NVENC H265/AV1 encode → WebRTC TURN relay. <1 frame E2E latency. Deployed on GitHub Codespace GPU.",tags:["NVENC","NvFBC","WebRTC","Rust","H265"],url:"https://github.com/Imperialorg/codespace",neonColor:"#00f5ff",district:"GPU DISTRICT",icon:"▶"},{id:"selkies-rust",title:"Selkies-Rust",subtitle:"Python→Rust Port",desc:"Complete rewrite of the Selkies WebRTC game streaming stack from Python into Rust. 6 crates: pipeline, signaling, input, encoding, metrics, CLI.",tags:["Rust","WebRTC","GStreamer","Tokio","GSAP"],url:"https://github.com/Imperialorg/codespace",neonColor:"#ff6b1a",district:"SYSTEMS CORRIDOR",icon:"⚙"},{id:"oris-ai",title:"Oris — AI SRE",subtitle:"🏆 Runner-up · TechSynapse 2026",desc:"Autonomous Site Reliability Engineer: ingests production logs, PII-masks with Presidio, infers root cause via Gemini 2.0, opens GitHub PRs with fixes. Zero human touch.",tags:["Python","Gemini 2.0","Presidio","LangChain","FastAPI"],url:"https://github.com/aerosane",neonColor:"#ff00aa",district:"AI DISTRICT",icon:"◈"},{id:"vajragrid",title:"VajraGrid",subtitle:"🇮🇳 India Innovates 2026 · Bharat Mandapam",desc:"AI-hardened power grid security: detects SCADA cyberattacks in 16s, 4-layer ML defense stack, adversarial training. Exhibited nationally at Bharat Mandapam.",tags:["Python","PyTorch","SCADA","Adversarial ML","GridSec"],url:"https://github.com/aerosane",neonColor:"#ff00aa",district:"AI DISTRICT",icon:"⚡"},{id:"vidyamitra",title:"VidyaMitra",subtitle:"IISER JEE Prep",desc:"AI tutor for JEE aspirants: adaptive quiz engine, LaTeX equation rendering, spaced repetition. Covers Physics, Chemistry, Math with difficulty auto-calibration.",tags:["TypeScript","React","LaTeX","OpenAI","Supabase"],url:"https://github.com/aerosane",neonColor:"#00ff88",district:"EDTECH ZONE",icon:"⬟"},{id:"netflip",title:"Netflip VOD",subtitle:"Full-Stack Streaming",desc:"Netflix-clone with HLS adaptive streaming, Azure Blob CDN, Fastly edge cache, WebSocket live chat, OAuth2, recommendation engine. 1080p adaptive bitrate.",tags:["Next.js","HLS","Azure","Fastly","PostgreSQL"],url:"https://github.com/aerosane",neonColor:"#7b2fff",district:"WEB DISTRICT",icon:"▨"},{id:"coding-arena",title:"Coding Arena",subtitle:"Competitive Judging Platform",desc:"Online judge with isolated Docker execution, multi-language support, real-time leaderboard, plagiarism detection via AST similarity. 200ms median judge latency.",tags:["Go","Docker","Redis","React","WebSocket"],url:"https://github.com/aerosane",neonColor:"#7b2fff",district:"WEB DISTRICT",icon:"{ }"},{id:"hackathon",title:"Hackathon Wins",subtitle:"Hall of Fame",desc:"🏆 Runner-up at TechSynapse 2026 (Oris AI SRE). 🇮🇳 National exhibition at India Innovates 2026, Bharat Mandapam, New Delhi (VajraGrid). 1st year, two nationals.",tags:["Oris AI","VajraGrid","TechSynapse","India Innovates"],url:"https://github.com/aerosane",neonColor:"#ffe642",district:"HALL OF FAME",icon:"🏆"}],oo={Languages:["C++","Rust","Python","TypeScript","Go","GLSL/HLSL"],Systems:["WebRTC","WebGL/WebGPU","NVENC/NvFBC","Docker","Linux"],"AI/ML":["PyTorch","Gemini API","LangChain","Presidio","HuggingFace"],Web:["React","Next.js","Vite","Node.js","PostgreSQL","Redis"],Tools:["Git","GitHub Actions","Azure","GStreamer","Tokio"]};class no{constructor(){c(this,"group",new Ye);c(this,"hoverTargets",[]);c(this,"visible",!1);c(this,"visibleValue",0)}enter(){this.group.visible=!0,this.visible=!0,_.killTweensOf(this),_.to(this,{visibleValue:1,duration:1.4,ease:"power2.out",onUpdate:()=>this.setVisible(this.visibleValue)})}exit(){this.visible=!1,_.killTweensOf(this),_.to(this,{visibleValue:0,duration:.8,ease:"power2.in",onUpdate:()=>this.setVisible(this.visibleValue),onComplete:()=>{this.group.visible=!1}})}setVisible(e){}dispose(){this.group.traverse(e=>{e.geometry&&e.geometry.dispose()})}}let F=null;function io(){return F||(F=document.createElement("div"),F.id="env-detail-panel",Object.assign(F.style,{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%, -50%) scale(0.92)",background:"rgba(4,6,20,0.92)",border:"1px solid var(--neon, #00f5ff)",boxShadow:"0 0 32px var(--neon, #00f5ff)44",padding:"28px 36px",maxWidth:"480px",width:"90vw",zIndex:"9999",fontFamily:"monospace",color:"#e8f4ff",opacity:"0",pointerEvents:"none",transition:"opacity 0.3s, transform 0.3s",borderRadius:"4px"}),document.body.appendChild(F),F)}function so(t){var o;const e=io();e.style.setProperty("--neon",t.neonColor),e.style.borderColor=t.neonColor+"88",e.style.boxShadow=`0 0 40px ${t.neonColor}33`,e.innerHTML=`
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
  `,(o=e.querySelector("#env-panel-close"))==null||o.addEventListener("click",i=>{i.stopPropagation(),Je()}),e.style.pointerEvents="all",e.style.opacity="1",e.style.transform="translate(-50%, -50%) scale(1)"}function Je(){const t=F;t&&(t.style.opacity="0",t.style.transform="translate(-50%, -50%) scale(0.92)",t.style.pointerEvents="none")}function ao(t){const i=document.createElement("canvas");i.width=900,i.height=400;const n=i.getContext("2d"),s=t.neonColor;n.clearRect(0,0,900,400),n.fillStyle=s,n.shadowColor=s,n.shadowBlur=16,n.fillRect(0,0,5,400),n.shadowBlur=0,n.font="11px monospace",n.fillStyle=s+"88",n.textAlign="left",n.fillText(t.district.toUpperCase(),28,32);const l=t.title.length>16?52:72;n.font=`bold ${l}px monospace`,n.shadowColor=s,n.shadowBlur=48,n.fillStyle="#ffffff",n.fillText(t.title,28,80+(72-l)),n.shadowBlur=20,n.fillStyle=s+"cc",n.fillText(t.title,28,80+(72-l)),n.shadowBlur=0,n.font="20px monospace",n.fillStyle="rgba(255,255,255,0.55)",n.fillText(t.subtitle,28,150),n.strokeStyle=s+"33",n.lineWidth=1,n.beginPath(),n.moveTo(28,172),n.lineTo(872,172),n.stroke(),n.font="bold 15px monospace";let a=28;for(const f of t.tags.slice(0,4)){const u=n.measureText(f).width+24;n.strokeStyle=s+"55",n.lineWidth=1,n.strokeRect(a,188,u,30),n.fillStyle=s+"dd",n.fillText(f,a+12,208),a+=u+10}return n.font="13px monospace",n.fillStyle=s+"66",n.fillText("[ CLICK TO VIEW PROJECT ]",28,380),new $e(i)}class ro extends no{constructor(o,i){super();c(this,"projIdx");c(this,"panelPos");c(this,"panelMat");c(this,"particleMat");this.projIdx=o,this.panelPos=i}create(o){o.add(this.group);const i=je[this.projIdx],n=ao(i);this.panelMat=new ge({map:n,transparent:!0,depthWrite:!1,side:be,alphaTest:.02});const s=new ie(new ne(40,18),this.panelMat);s.position.copy(this.panelPos),s.frustumCulled=!1,s.onBeforeRender=(h,C,p)=>s.quaternion.copy(p.quaternion),s.userData.isLabel=!0,s.userData.onClick=()=>so(i),this.group.add(s);const l=60,a=new Float32Array(l*3);for(let h=0;h<l;h++)a[h*3]=this.panelPos.x+(Math.random()-.5)*60,a[h*3+1]=this.panelPos.y+(Math.random()-.5)*35,a[h*3+2]=this.panelPos.z+(Math.random()-.5)*60;const f=new qe;f.setAttribute("position",new te(a,3)),this.particleMat=new ht({size:.4,color:new d(i.neonColor),transparent:!0,opacity:0,blending:Ce,sizeAttenuation:!0});const u=new Xe(f,this.particleMat);u.frustumCulled=!1,this.group.add(u)}update(o){}setVisible(o){this.panelMat&&(this.panelMat.opacity=o),this.particleMat&&(this.particleMat.opacity=o*.5)}onHover(){}}const lo=[[2,0,new r(-80,-8,20)],[3,1,new r(-75,0,-25)],[4,2,new r(0,20,-90)],[5,3,new r(40,25,-110)],[6,4,new r(100,35,-100)],[7,5,new r(90,22,-20)],[8,6,new r(70,14,50)],[9,7,new r(20,12,80)],[10,8,new r(-20,16,70)],[11,9,new r(-10,40,40)]];class co{constructor(e,o){c(this,"envs",new Map);c(this,"activeEnv",null);c(this,"activeIdx",-1);for(const[i,n,s]of lo){const l=new ro(n,s);l.create(e),l.group.visible=!1,this.envs.set(i,l)}}onSection(e){if(e===this.activeIdx)return;this.activeIdx=e,this.activeEnv&&(this.activeEnv.exit(),this.activeEnv=null);const o=this.envs.get(e);o&&(this.activeEnv=o,o.enter())}update(e){this.activeEnv&&this.activeEnv.update(e)}}const uo=document.getElementById("scene-canvas"),V=new ft({canvas:uo,antialias:!0,alpha:!1,powerPreference:"high-performance"});V.setPixelRatio(Math.min(devicePixelRatio,2));V.setSize(innerWidth,innerHeight);V.toneMapping=pt;V.toneMappingExposure=.95;const b=new mt;b.background=new d(131602);b.fog=new vt(197400,.003);const D=new gt(60,innerWidth/innerHeight,.5,1200),se=new Qt;se.setup(V,b,D);const Se=new Xt;Se.create(b);const U=new Vt;U.generate(b);U.addAntennas(b);const ho=je.map((t,e)=>{const o=k[e+2];return{text:t.district,pos:new r(o.pos.x+12,80,o.pos.z-18),color:t.neonColor}});U.addNeonSigns(b,ho);const Ze=new jt;Ze.create(b);const xe=new $t;xe.create(b);const Qe=new qt;Qe.create(b);const fo=new wt(128,0,.4);b.add(fo);const Pe=new Ye;b.add(Pe);var _e,We;(We=(_e=U.cityGroup)==null?void 0:_e.children)==null||We.forEach(t=>Pe.add(t));const et=new co(b,Pe),oe=new d(62975);function po(t){const e=Math.min(t,j.length-1);oe.copy(j[e]),xe.setDistrictNeon(oe),Se.update(0,D.position,oe)}const mo=[["NEON DISTRICT","A cyberpunk portfolio"],["ABOUT","Who is behind this"],["PS3 CELL GPU","PS3 SPU emulator in WebGL"],["CPUonGPU","x86 CPU running on GPU"],["GPU STREAMING","Sub-frame game streaming"],["SELKIES RUST","WebRTC stack rebuilt in Rust"],["ORIS AI","Autonomous SRE agent"],["VAJRAGRID","AI power grid security"],["VIDYAMITRA","Adaptive JEE AI tutor"],["NETFLIP","HLS streaming platform"],["ARENA OJ","Online judge platform"],["HACKATHON","Competition highlights"],["TECH STACK","Tools and languages"],["CONTACT","Get in touch"]],W=document.createElement("div");W.id="section-banner";Object.assign(W.style,{position:"fixed",bottom:"24px",left:"50%",transform:"translateX(-50%)",textAlign:"center",pointerEvents:"none",zIndex:"50",opacity:"0",transition:"opacity 0.4s",background:"rgba(0,0,8,0.65)",padding:"10px 28px",borderTop:"1px solid currentColor"});document.body.appendChild(W);function vo(t){const[e,o]=mo[t]??["",""],i=j[t]?"#"+j[t].getHexString():"#00f5ff";W.style.color=i,W.innerHTML=`
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
  `,W.style.opacity="1"}const Ae=new to(D);Ae.onSectionChange=t=>{wo(t),yo(t),po(t),se.triggerGlitch(),et.onSection(t),vo(t)};const go=document.getElementById("nav-dots");k.forEach((t,e)=>{const o=document.createElement("div");o.className="nav-dot"+(e===0?" active":""),o.title=t.label,o.addEventListener("click",()=>Ae.goTo(e)),go.appendChild(o)});function wo(t){document.querySelectorAll(".sect").forEach((e,o)=>{e.classList.toggle("active",o===t)}),document.querySelectorAll(".nav-dot").forEach((e,o)=>{e.classList.toggle("active",o===t)})}function yo(t){const e=document.getElementById("hud-section");e&&(e.textContent=`DISTRICT_${String(t).padStart(2,"0")} / ${k[t].label}`)}const Ge=document.getElementById("skills-grid");Ge&&Object.entries(oo).forEach(([t,e])=>{const o=document.createElement("div");o.className="skill-cat",o.innerHTML=`<div class="skill-cat-name">// ${t}</div>`+e.map(i=>`<div class="skill-item">${i}</div>`).join(""),Ge.appendChild(o)});const N=document.getElementById("contact-input"),ee=document.getElementById("contact-input-display");var Ve;(Ve=document.getElementById("sect-13"))==null||Ve.addEventListener("click",()=>N==null?void 0:N.focus());N==null||N.addEventListener("input",()=>{ee&&(ee.textContent=(N.value||"")+"_"),N.value.trim().toLowerCase()==="sudo"&&(bo(),N.value="",ee&&(ee.textContent="_"))});function bo(){const t=document.querySelector("#sect-13 .terminal-body");if(!t)return;const e=document.createElement("p");e.className="output neon-green",e.textContent="> Permission granted. Downloading your future...",t.appendChild(e),setTimeout(()=>{const o=document.createElement("p");o.className="output",o.innerHTML='<span style="color:#ffe642">root@neon-district:~# ██████████ 100%  COMPLETE</span>',t.appendChild(o)},1500)}const Oe=["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];let $=0;window.addEventListener("keydown",t=>{t.key===Oe[$]?$++:$=0,$===Oe.length&&($=0,Co())});let ue=!1;function Co(){ue=!ue,[U.meshA,U.meshB,U.meshC].forEach(t=>{const e=t.material;e.wireframe=ue})}const he=document.getElementById("boot-log"),ze=document.getElementById("boot-bar"),q=document.getElementById("loading-screen"),fe=["Initializing WebGPU context","Generating city geometry","Compiling 47 shader programs","Spawning rain particles","Calibrating post-processing chain","System ready"];async function So(){for(let t=0;t<fe.length;t++){await new Promise(o=>setTimeout(o,260+Math.random()*200));const e=document.createElement("p");e.innerHTML=`<span style="color:rgba(0,245,255,.5)">[BOOT]</span> ${fe[t]}... <span class="ok">[OK]</span>`,he==null||he.appendChild(e),ze&&(ze.style.width=(t+1)/fe.length*100+"%")}await new Promise(t=>setTimeout(t,600)),q==null||q.classList.add("fade-out"),setTimeout(()=>{q&&(q.style.display="none")},850)}So();const Be=new yt,pe=new Y;window.addEventListener("click",t=>{if(t.target.closest("#env-detail-panel"))return;pe.x=t.clientX/innerWidth*2-1,pe.y=-(t.clientY/innerHeight)*2+1,Be.setFromCamera(pe,D);const e=Be.intersectObjects(b.children,!0);for(const o of e){const i=o.object;if(i.userData.isLabel&&i.userData.onClick){t.stopPropagation(),i.userData.onClick();return}}Je()});window.addEventListener("resize",()=>{D.aspect=innerWidth/innerHeight,D.updateProjectionMatrix(),V.setSize(innerWidth,innerHeight),se.resize(innerWidth,innerHeight)});const He=new bt;function tt(){requestAnimationFrame(tt);const t=He.getElapsedTime(),e=He.getDelta();U.update(t),xe.update(t),Qe.update(t,D.position),Ze.update(t),Se.update(t,D.position,oe),Ae.update(e),et.update(t),se.render()}tt();
