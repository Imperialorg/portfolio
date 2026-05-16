var St=Object.defineProperty;var Pt=(o,t,e)=>t in o?St(o,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):o[t]=e;var l=(o,t,e)=>Pt(o,typeof t!="symbol"?t+"":t,e);import{i as S,d as oe,I as $,q as le,j as ie,u as Ie,a6 as c,Q as Re,w as R,C as _e,J as E,m as D,v as y,_ as M,f as de,e as V,a as O,K as De,$ as ut,B as Mt,E as Tt,a5 as ee,a2 as At,g as Le,G as dt,O as kt,L as Et,a1 as vt,X as It,r as ft,a9 as Rt,A as Lt,Z as Ft,o as Vt,P as Nt,H as Ut,U as _t,h as Dt}from"./three-Dka5jm0s.js";import{b as Gt,R as Ot,a as zt,B as ye,C as Wt,V as Bt,N as Ht,S as $t,G as jt,c as xe,E as Xt}from"./postprocessing-dbATgWCK.js";import{g as te}from"./gsap-SFc2wnMY.js";(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))i(s);new MutationObserver(s=>{for(const a of s)if(a.type==="childList")for(const n of a.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&i(n)}).observe(document,{childList:!0,subtree:!0});function e(s){const a={};return s.integrity&&(a.integrity=s.integrity),s.referrerPolicy&&(a.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?a.credentials="include":s.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function i(s){if(s.ep)return;s.ep=!0;const a=e(s);fetch(s.href,a)}})();function Ye(o){return o*o*o*(o*(o*6-15)+10)}function Ce(o,t,e){return o+e*(t-o)}function he(o,t,e){const i=o&3,s=i<2?t:e,a=i<2?e:t;return(o&1?-s:s)+(o&2?-a:a)}const W=Array.from({length:512},(o,t)=>t).sort(()=>Math.random()-.5);for(let o=0;o<256;o++)W[o+256]=W[o];function qt(o,t){const e=Math.floor(o)&255,i=Math.floor(t)&255,s=o-Math.floor(o),a=t-Math.floor(t),n=Ye(s),r=Ye(a),p=W[W[e]+i],m=W[W[e]+i+1],g=W[W[e+1]+i],b=W[W[e+1]+i+1];return Ce(Ce(he(p,s,a),he(g,s-1,a),n),Ce(he(m,s,a-1),he(b,s-1,a-1),n),r)}function Ke(o,t,e=4,i=2,s=.5){let a=0,n=.5,r=1;for(let p=0;p<e;p++)a+=qt(o*r,t*r)*n,r*=i,n*=s;return a}function I(o,t){return o+Math.random()*(t-o)}function Ze(o,t){return Math.floor(I(o,t+1))}const Yt=`
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
`,F=32,J=16,ao=6,ce=J+ao,pe=F/2*ce,Se={color:new S(197400),near:100,far:500},Fe=[new S(62975),new S(62975),new S(16711850),new S(16711850),new S(16739098),new S(8073215),new S(8073215),new S(65416),new S(65416),new S(16770626)];function no(){return new M({vertexShader:Yt,fragmentShader:Kt,uniforms:{uTime:{value:0},uFogColor:{value:Se.color},uFogNear:{value:Se.near},uFogFar:{value:Se.far}}})}function ro(o,t){const e=o/F,i=t/F;return e<.35&&i<.35?0:e<.65&&i<.35?1:e>=.65&&i<.35?2:e<.35&&i<.65?3:e>=.65&&i<.65?4:e<.35&&i>=.65?5:e<.65&&i>=.65?6:e>=.65&&i>=.65?7:i>.45&&i<.55?8:9}class lo{constructor(){l(this,"meshA");l(this,"meshB");l(this,"meshC");l(this,"mats",[])}generate(t){const e=F*F,i=no();this.mats.push(i);const s=new oe(1,1,1),a=new Float32Array(e),n=new Float32Array(e*3);s.setAttribute("aHeight",new $(a,1)),s.setAttribute("aNeonColor",new $(n,3)),this.meshA=new le(s,i.clone(),e),this.meshA.frustumCulled=!1,this.mats.push(this.meshA.material);const r=new ie(.45,.55,1,10),p=new Float32Array(e),m=new Float32Array(e*3);r.setAttribute("aHeight",new $(p,1)),r.setAttribute("aNeonColor",new $(m,3)),this.meshB=new le(r,i.clone(),e),this.meshB.frustumCulled=!1,this.mats.push(this.meshB.material);const g=new oe(1,.4,1),b=new Float32Array(e),h=new Float32Array(e*3);g.setAttribute("aHeight",new $(b,1)),g.setAttribute("aNeonColor",new $(h,3)),this.meshC=new le(g,i.clone(),e),this.meshC.frustumCulled=!1,this.mats.push(this.meshC.material);const v=new Ie,u=new c,d=new c,w=new Re;let f=0,P=0,x=0;for(let A=0;A<F;A++)for(let k=0;k<F;k++){const N=A*ce-pe,Y=k*ce-pe;if(A%5===0||k%5===0||A%2===0&&k%2===0&&Math.random()<.25)continue;const K=A/F*4-2,be=k/F*4-2,bt=Ke(K,be,5),yt=Math.sqrt(K*K+be*be)/3,xt=Math.max(.18,1-yt*.6),Z=Math.max(8,(22+bt*170)*xt)+I(4,28),je=I(J*.42,J*.9),Xe=I(J*.42,J*.9),Ct=ro(A,k),B=Fe[Ct],qe=Math.random();if(qe<.65)a[f]=Z,n[f*3]=B.r,n[f*3+1]=B.g,n[f*3+2]=B.b,u.set(N,Z/2,Y),d.set(je,Z,Xe),v.compose(u,w,d),this.meshA.setMatrixAt(f,v),f++;else if(qe<.82){const Q=I(J*.18,J*.32);p[P]=Z,m[P*3]=B.r,m[P*3+1]=B.g,m[P*3+2]=B.b,u.set(N+I(-3,3),Z/2,Y+I(-3,3)),d.set(Q*2,Z,Q*2),v.compose(u,w,d),this.meshB.setMatrixAt(P,v),P++}else{const Q=Math.max(6,Z*.35);b[x]=Q,h[x*3]=B.r,h[x*3+1]=B.g,h[x*3+2]=B.b,u.set(N,Q/2,Y),d.set(je*1.4,Q,Xe*1.4),v.compose(u,w,d),this.meshC.setMatrixAt(x,v),x++}}this.meshA.count=f,this.meshB.count=P,this.meshC.count=x;for(const A of[this.meshA,this.meshB,this.meshC]){A.instanceMatrix.needsUpdate=!0;const k=A.geometry;k.getAttribute("aHeight").needsUpdate=!0,k.getAttribute("aNeonColor").needsUpdate=!0,t.add(A)}}addAntennas(t){const e=new ie(.1,.1,1,4),i=new R({color:16716083}),s=new le(e,i,400);s.frustumCulled=!1;const a=new Ie,n=new c,r=new c,p=new Re;let m=0;for(let g=0;g<400;g++){const b=Ze(0,F-1),h=Ze(0,F-1),v=b*ce-pe,u=h*ce-pe,d=b/F*4-2,w=h/F*4-2,f=Math.max(.18,1-Math.sqrt(d*d+w*w)/3*.6),P=Math.max(8,(22+Ke(d,w,5)*170)*f)+20,x=I(8,30);n.set(v+I(-3,3),P+x/2,u+I(-3,3)),r.set(1,x,1),a.compose(n,p,r),s.setMatrixAt(m++,a)}s.count=m,s.instanceMatrix.needsUpdate=!0,t.add(s)}addNeonSigns(t,e){e.forEach(({text:i,pos:s,color:a})=>{const n=document.createElement("canvas");n.width=256,n.height=64;const r=n.getContext("2d");r.clearRect(0,0,256,64),r.fillStyle=a+"22",r.fillRect(0,0,256,64),r.strokeStyle=a,r.lineWidth=2,r.strokeRect(2,2,252,60),r.fillStyle=a,r.font="bold 22px monospace",r.textAlign="center",r.fillText(i,128,40);const p=new _e(n),m=new E(18,4.5),g=new R({map:p,transparent:!0,side:D,depthWrite:!1}),b=new y(m,g);b.position.copy(s),t.add(b)})}update(t){for(const e of this.mats)e.uniforms.uTime.value=t}}class co{constructor(){l(this,"mesh");l(this,"mat")}create(t){const e=new E(1200,1200,1,1);return this.mat=new M({vertexShader:Zt,fragmentShader:Jt,uniforms:{uTime:{value:0},uDistrictNeon:{value:new S(62975)},uRainIntensity:{value:1}}}),this.mesh=new y(e,this.mat),this.mesh.rotation.x=-Math.PI/2,this.mesh.position.y=0,t.add(this.mesh),this.mesh}update(t){this.mat.uniforms.uTime.value=t}setDistrictNeon(t){this.mat.uniforms.uDistrictNeon.value.copy(t)}setRainIntensity(t){this.mat.uniforms.uRainIntensity.value=t}}class uo{constructor(){l(this,"points");l(this,"count",8e3)}create(t){const e=new Float32Array(this.count*3),i=new Float32Array(this.count),s=new Float32Array(this.count);for(let r=0;r<this.count;r++)e[r*3]=I(-300,300),e[r*3+1]=I(-60,60),e[r*3+2]=I(-300,300),i[r]=I(.3,1),s[r]=Math.random();const a=new de;a.setAttribute("position",new V(e,3)),a.setAttribute("aSpeed",new V(i,1)),a.setAttribute("aOffset",new V(s,1));const n=new M({vertexShader:Qt,fragmentShader:eo,uniforms:{uTime:{value:0}},transparent:!0,blending:O,depthWrite:!1});this.points=new De(a,n),t.add(this.points)}update(t,e){const i=this.points.material;i.uniforms.uTime.value=t,e&&(this.points.position.x=e.x,this.points.position.z=e.z)}}class vo{constructor(){l(this,"mesh");l(this,"mat")}create(t){const e=new ut(2e3,32,16);this.mat=new M({vertexShader:to,fragmentShader:oo,uniforms:{uTime:{value:0},uZenithColor:{value:new S(132104)},uHorizonColor:{value:new S(1706e3)},uDistrictNeon:{value:new S(62975)}},side:Mt,depthWrite:!1}),this.mesh=new y(e,this.mat),this.mesh.renderOrder=-1,t.add(this.mesh)}update(t,e,i){this.mesh.position.copy(e),this.mat.uniforms.uTime.value=t,i&&this.mat.uniforms.uDistrictNeon.value.copy(i)}setDistrictColors(t,e){this.mat.uniforms.uHorizonColor.value.copy(t),this.mat.uniforms.uDistrictNeon.value.copy(e)}}function fo(o){let t=o;return()=>{t|=0,t=t+1831565813|0;let e=Math.imul(t^t>>>15,1|t);return e=e+Math.imul(e^e>>>7,61|e)^e,((e^e>>>14)>>>0)/4294967296}}const Je=[new S(16720384),new S(61183),new S(22015),new S(16711884),new S(65382),new S(16737792),new S(11141375),new S(16770626)],Ve=32,ht=16,ho=6,Ne=ht+ho,Qe=Ve/2*Ne;class po{constructor(){l(this,"mesh");l(this,"mat")}create(t){const i=new E(5,1.4),s=new Float32Array(150*3),a=new Float32Array(150),n=new Float32Array(150);i.setAttribute("aColor",new $(s,3)),i.setAttribute("aFlickerSeed",new $(a,1)),i.setAttribute("aPulseMode",new $(n,1)),this.mat=new M({vertexShader:io,fragmentShader:so,uniforms:{uTime:{value:0}},transparent:!0,depthWrite:!1,side:D,blending:O}),this.mesh=new le(i,this.mat,150),this.mesh.frustumCulled=!1;const r=fo(42),p=new Ie,m=new c,g=new Re,b=new c(1,1,1);let h=0;for(let v=0;v<Ve&&h<150;v++)for(let u=0;u<Ve&&h<150;u++){if(v%5===0||u%5===0||r()>.1)continue;const d=v*Ne-Qe,w=u*Ne-Qe,f=6+r()*12,P=Math.floor(r()*4),x=ht*.5+.3;let A=d,k=w,N=0;P===0?(k=w+x,N=0):P===1?(k=w-x,N=Math.PI):P===2?(A=d+x,N=Math.PI*.5):(A=d-x,N=-Math.PI*.5),m.set(A,f,k),g.setFromEuler(new Tt(0,N,0)),p.compose(m,g,b),this.mesh.setMatrixAt(h,p);const Y=Je[Math.floor(r()*Je.length)];s[h*3]=Y.r,s[h*3+1]=Y.g,s[h*3+2]=Y.b,a[h]=r();const K=r();n[h]=K<.6?0:K<.85?1:K<.95?2:3,h++}this.mesh.count=h,this.mesh.instanceMatrix.needsUpdate=!0,i.getAttribute("aColor").needsUpdate=!0,i.getAttribute("aFlickerSeed").needsUpdate=!0,i.getAttribute("aPulseMode").needsUpdate=!0,t.add(this.mesh)}update(t){this.mat.uniforms.uTime.value=t}}const mo=`
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
`;class go extends Xt{constructor(t=.45){super("LensStreakEffect",mo,{uniforms:new Map([["uIntensity",new At(t)]])})}}class wo{constructor(){l(this,"composer");l(this,"glitch");l(this,"glitchTimeout",0)}setup(t,e,i){this.composer=new Gt(t);const s=new Ot(e,i),a=new zt({blendFunction:ye.ADD,luminanceThreshold:.25,luminanceSmoothing:.4,intensity:2.4,radius:.6}),n=new go(.45),r=new Wt({offset:new ee(.0018,.0012),radialModulation:!0,modulationOffset:.5}),p=new Bt({eskil:!1,offset:.35,darkness:.75}),m=new Ht({blendFunction:ye.OVERLAY,premultiply:!0});m.blendMode.opacity.value=.04;const g=new $t({blendFunction:ye.OVERLAY,density:1.4});return g.blendMode.opacity.value=.07,this.glitch=new jt({delay:new ee(99999,99999),duration:new ee(.15,.35),strength:new ee(.15,.4),columns:.04,ratio:.85}),this.composer.addPass(s),this.composer.addPass(new xe(i,a,n)),this.composer.addPass(new xe(i,r,g,p,m)),this.composer.addPass(new xe(i,this.glitch)),this.composer}triggerGlitch(){this.glitch.delay.set(0,.05),clearTimeout(this.glitchTimeout),this.glitchTimeout=window.setTimeout(()=>{this.glitch.delay.set(99999,99999)},600)}resize(t,e){this.composer.setSize(t,e)}render(){this.composer.render()}}const G=[{pos:new c(0,180,220),look:new c(0,0,0),label:"HERO",t:0},{pos:new c(-40,12,110),look:new c(-20,20,60),label:"ABOUT",t:0},{pos:new c(-80,-8,55),look:new c(-80,-8,20),label:"PS3 GPU",t:0},{pos:new c(-75,30,-25),look:new c(-75,0,-25),label:"CPUonGPU",t:0},{pos:new c(-30,10,-60),look:new c(0,20,-90),label:"GPU Stream",t:0},{pos:new c(20,35,-80),look:new c(40,25,-110),label:"Selkies",t:0},{pos:new c(80,55,-70),look:new c(100,35,-100),label:"Oris AI",t:0},{pos:new c(110,40,0),look:new c(90,22,-20),label:"VajraGrid",t:0},{pos:new c(100,20,70),look:new c(70,14,50),label:"VidyaMitra",t:0},{pos:new c(50,16,100),look:new c(20,12,80),label:"Netflip",t:0},{pos:new c(10,22,90),look:new c(-20,16,70),label:"Arena",t:0},{pos:new c(-30,60,70),look:new c(-10,40,40),label:"Hackathon",t:0},{pos:new c(-60,8,30),look:new c(-40,8,0),label:"SKILLS",t:0},{pos:new c(0,120,160),look:new c(0,0,0),label:"CONTACT",t:0}],bo=1600;class yo{constructor(t){l(this,"camera");l(this,"posSpline");l(this,"lookSpline");l(this,"t",0);l(this,"currentSection",0);l(this,"mouseX",0);l(this,"mouseY",0);l(this,"_pos",new c);l(this,"_look",new c);l(this,"_ahead",new c);l(this,"onSectionChange");l(this,"_lastFiredSection",0);this.camera=t,this.buildSpline(),this.init()}buildSpline(){const t=G.map(s=>s.pos.clone()),e=G.map(s=>s.look.clone());this.posSpline=new Le(t,!1,"catmullrom",.5),this.lookSpline=new Le(e,!1,"catmullrom",.5);const i=G.length;G.forEach((s,a)=>{s.t=a/(i-1)}),this.t=0,this.posSpline.getPoint(0,this._pos),this.lookSpline.getPoint(0,this._look),this.camera.position.copy(this._pos),this.camera.lookAt(this._look)}init(){window.addEventListener("mousemove",i=>{this.mouseX=(i.clientX/window.innerWidth-.5)*2,this.mouseY=(i.clientY/window.innerHeight-.5)*2});let t=!1;window.addEventListener("wheel",i=>{if(t)return;t=!0;const s=i.deltaY>0?1:-1;this.goTo(this.currentSection+s),setTimeout(()=>{t=!1},bo)},{passive:!0});let e=0;window.addEventListener("touchstart",i=>{e=i.touches[0].clientY}),window.addEventListener("touchend",i=>{const s=e-i.changedTouches[0].clientY;Math.abs(s)>40&&this.goTo(this.currentSection+(s>0?1:-1))}),window.addEventListener("keydown",i=>{(i.key==="ArrowDown"||i.key==="ArrowRight")&&this.goTo(this.currentSection+1),(i.key==="ArrowUp"||i.key==="ArrowLeft")&&this.goTo(this.currentSection-1)})}goTo(t){if(t=Math.max(0,Math.min(G.length-1,t)),t===this.currentSection)return;const e=this.currentSection;this.currentSection=t;const i=G[t].t,a=.6+Math.abs(i-this.t)*5;te.killTweensOf(this),te.to(this,{t:i,duration:a,ease:"power2.inOut",onUpdate:()=>this._fireCrossings(e,t),onComplete:()=>{var n;this._lastFiredSection=t,(n=this.onSectionChange)==null||n.call(this,t),this._updateUI(t)}}),this._updateUI(t)}_fireCrossings(t,e){const i=e>t?1:-1;G.forEach((s,a)=>{var r;(i>0?this.t>=s.t&&a>this._lastFiredSection&&a<=e:this.t<=s.t&&a<this._lastFiredSection&&a>=e)&&(this._lastFiredSection=a,(r=this.onSectionChange)==null||r.call(this,a),this._updateUI(a))})}update(t){this.posSpline.getPoint(this.t,this._pos),this.camera.position.copy(this._pos);const e=Math.min(1,this.t+.015);this.posSpline.getPoint(e,this._ahead),this.lookSpline.getPoint(this.t,this._look);const i=this._look.x*.8+this._ahead.x*.2+this.mouseX*5,s=this._look.y*.8+this._ahead.y*.2-this.mouseY*3,a=this._look.z*.8+this._ahead.z*.2;this.camera.lookAt(i,s,a)}_updateUI(t){document.querySelectorAll(".nav-dot").forEach((i,s)=>i.classList.toggle("active",s===t));const e=document.getElementById("progress-bar");e&&(e.style.height=t/(G.length-1)*100+"%")}getCurrentSection(){return this.currentSection}}const ve=[{id:"ps3-gpu",title:"PS3 Cell GPU Emulator",subtitle:"Systems / Emulation",desc:"Full emulation of the Cell Broadband Engine's SPU pipeline in WebGL. 6 SPU cores, PPE scheduler, DMA bus — running real PS3 shaders in the browser at 200 GIPS.",tags:["C++","WebGL","GLSL","Cell BE","Emulation"],url:"https://github.com/aerosane",neonColor:"#00f5ff",district:"GPU DISTRICT",icon:"⬡"},{id:"cpuongpu",title:"CPUonGPU",subtitle:"Architecture Research",desc:"Runs a full x86 CPU simulation entirely on GPU compute shaders. Register file, ALU, cache hierarchy — all in GLSL. JIT-compiled x86 → SPIR-V at runtime.",tags:["GLSL","Compute Shaders","x86","JIT","SPIR-V"],url:"https://github.com/aerosane",neonColor:"#00f5ff",district:"GPU DISTRICT",icon:"⬢"},{id:"gpu-streaming",title:"GPU Streaming Pipeline",subtitle:"NvFBC + NVENC",desc:"Sub-frame-latency game streaming via NvFBC capture → NVENC H265/AV1 encode → WebRTC TURN relay. <1 frame E2E latency. Deployed on GitHub Codespace GPU.",tags:["NVENC","NvFBC","WebRTC","Rust","H265"],url:"https://github.com/Imperialorg/codespace",neonColor:"#00f5ff",district:"GPU DISTRICT",icon:"▶"},{id:"selkies-rust",title:"Selkies-Rust",subtitle:"Python→Rust Port",desc:"Complete rewrite of the Selkies WebRTC game streaming stack from Python into Rust. 6 crates: pipeline, signaling, input, encoding, metrics, CLI.",tags:["Rust","WebRTC","GStreamer","Tokio","GSAP"],url:"https://github.com/Imperialorg/codespace",neonColor:"#ff6b1a",district:"SYSTEMS CORRIDOR",icon:"⚙"},{id:"oris-ai",title:"Oris — AI SRE",subtitle:"🏆 Runner-up · TechSynapse 2026",desc:"Autonomous Site Reliability Engineer: ingests production logs, PII-masks with Presidio, infers root cause via Gemini 2.0, opens GitHub PRs with fixes. Zero human touch.",tags:["Python","Gemini 2.0","Presidio","LangChain","FastAPI"],url:"https://github.com/aerosane",neonColor:"#ff00aa",district:"AI DISTRICT",icon:"◈"},{id:"vajragrid",title:"VajraGrid",subtitle:"🇮🇳 India Innovates 2026 · Bharat Mandapam",desc:"AI-hardened power grid security: detects SCADA cyberattacks in 16s, 4-layer ML defense stack, adversarial training. Exhibited nationally at Bharat Mandapam.",tags:["Python","PyTorch","SCADA","Adversarial ML","GridSec"],url:"https://github.com/aerosane",neonColor:"#ff00aa",district:"AI DISTRICT",icon:"⚡"},{id:"vidyamitra",title:"VidyaMitra",subtitle:"IISER JEE Prep",desc:"AI tutor for JEE aspirants: adaptive quiz engine, LaTeX equation rendering, spaced repetition. Covers Physics, Chemistry, Math with difficulty auto-calibration.",tags:["TypeScript","React","LaTeX","OpenAI","Supabase"],url:"https://github.com/aerosane",neonColor:"#00ff88",district:"EDTECH ZONE",icon:"⬟"},{id:"netflip",title:"Netflip VOD",subtitle:"Full-Stack Streaming",desc:"Netflix-clone with HLS adaptive streaming, Azure Blob CDN, Fastly edge cache, WebSocket live chat, OAuth2, recommendation engine. 1080p adaptive bitrate.",tags:["Next.js","HLS","Azure","Fastly","PostgreSQL"],url:"https://github.com/aerosane",neonColor:"#7b2fff",district:"WEB DISTRICT",icon:"▨"},{id:"coding-arena",title:"Coding Arena",subtitle:"Competitive Judging Platform",desc:"Online judge with isolated Docker execution, multi-language support, real-time leaderboard, plagiarism detection via AST similarity. 200ms median judge latency.",tags:["Go","Docker","Redis","React","WebSocket"],url:"https://github.com/aerosane",neonColor:"#7b2fff",district:"WEB DISTRICT",icon:"{ }"},{id:"hackathon",title:"Hackathon Wins",subtitle:"Hall of Fame",desc:"🏆 Runner-up at TechSynapse 2026 (Oris AI SRE). 🇮🇳 National exhibition at India Innovates 2026, Bharat Mandapam, New Delhi (VajraGrid). 1st year, two nationals.",tags:["Oris AI","VajraGrid","TechSynapse","India Innovates"],url:"https://github.com/aerosane",neonColor:"#ffe642",district:"HALL OF FAME",icon:"🏆"}],xo={Languages:["C++","Rust","Python","TypeScript","Go","GLSL/HLSL"],Systems:["WebRTC","WebGL/WebGPU","NVENC/NvFBC","Docker","Linux"],"AI/ML":["PyTorch","Gemini API","LangChain","Presidio","HuggingFace"],Web:["React","Next.js","Vite","Node.js","PostgreSQL","Redis"],Tools:["Git","GitHub Actions","Azure","GStreamer","Tokio"]};class fe{constructor(){l(this,"group",new dt);l(this,"hoverTargets",[]);l(this,"visible",!1);l(this,"visibleValue",0)}enter(){this.group.visible=!0,this.visible=!0,te.killTweensOf(this),te.to(this,{visibleValue:1,duration:1.4,ease:"power2.out",onUpdate:()=>this.setVisible(this.visibleValue)})}exit(){this.visible=!1,te.killTweensOf(this),te.to(this,{visibleValue:0,duration:.8,ease:"power2.in",onUpdate:()=>this.setVisible(this.visibleValue),onComplete:()=>{this.group.visible=!1}})}setVisible(t){}dispose(){this.group.traverse(t=>{t.geometry&&t.geometry.dispose()})}}let z=null;function Co(){return z||(z=document.createElement("div"),z.id="env-detail-panel",Object.assign(z.style,{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%, -50%) scale(0.92)",background:"rgba(4,6,20,0.92)",border:"1px solid var(--neon, #00f5ff)",boxShadow:"0 0 32px var(--neon, #00f5ff)44",padding:"28px 36px",maxWidth:"480px",width:"90vw",zIndex:"9999",fontFamily:"monospace",color:"#e8f4ff",opacity:"0",pointerEvents:"none",transition:"opacity 0.3s, transform 0.3s",borderRadius:"4px"}),document.body.appendChild(z),document.addEventListener("click",o=>{z&&!z.contains(o.target)&&Oe()}),z)}function Ge(o){var e;const t=Co();t.style.setProperty("--neon",o.neonColor),t.style.borderColor=o.neonColor+"88",t.style.boxShadow=`0 0 40px ${o.neonColor}33`,t.innerHTML=`
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px">
      <div>
        <div style="color:${o.neonColor};font-size:11px;letter-spacing:3px;text-transform:uppercase;margin-bottom:4px">${o.subtitle}</div>
        <div style="font-size:20px;font-weight:bold;color:#fff">${o.title}</div>
      </div>
      <button id="env-panel-close" style="background:none;border:none;color:#888;font-size:20px;cursor:pointer;line-height:1;padding:0 0 0 16px">✕</button>
    </div>
    <div style="font-size:13px;line-height:1.7;color:#c8d8ef;margin-bottom:16px">${o.desc}</div>
    <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:18px">
      ${o.tags.map(i=>`<span style="background:${o.neonColor}18;border:1px solid ${o.neonColor}44;color:${o.neonColor};font-size:10px;padding:3px 8px;border-radius:2px">${i}</span>`).join("")}
    </div>
    <a href="${o.url}" target="_blank" rel="noopener"
       style="display:inline-block;padding:9px 20px;background:${o.neonColor}22;border:1px solid ${o.neonColor};color:${o.neonColor};text-decoration:none;font-size:12px;letter-spacing:1px;transition:background 0.2s"
       onmouseover="this.style.background='${o.neonColor}44'"
       onmouseout="this.style.background='${o.neonColor}22'">
      VIEW ON GITHUB →
    </a>
  `,(e=t.querySelector("#env-panel-close"))==null||e.addEventListener("click",i=>{i.stopPropagation(),Oe()}),t.style.pointerEvents="all",t.style.opacity="1",t.style.transform="translate(-50%, -50%) scale(1)"}function Oe(){const o=z;o&&(o.style.opacity="0",o.style.transform="translate(-50%, -50%) scale(0.92)",o.style.pointerEvents="none")}function ze(o,t,e){const a=document.createElement("canvas");a.width=400,a.height=56;const n=a.getContext("2d"),r=n.createLinearGradient(0,0,400,0);r.addColorStop(0,t+"00"),r.addColorStop(.15,t+"18"),r.addColorStop(.85,t+"18"),r.addColorStop(1,t+"00"),n.fillStyle=r,n.fillRect(0,0,400,56),n.fillStyle=t,n.fillRect(0,56*.2,3,56*.6),n.font="bold 18px monospace",n.textAlign="left",n.shadowColor=t,n.shadowBlur=14,n.fillStyle=t,n.fillText(o,16,34),n.font="10px monospace",n.shadowBlur=4,n.fillStyle=t+"aa",n.fillText("[ CLICK FOR DETAILS ]",16,50);const p=new _e(a),m=new R({map:p,transparent:!0,depthWrite:!1,side:D}),g=new y(new E(8,1.12),m);return g.userData.isLabel=!0,g.userData.onClick=e,g}const U=new c(-80,-8,38),So=`
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
`,ae="varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }";class To extends fe{constructor(){super(...arguments);l(this,"rackMat");l(this,"floorMat");l(this,"busMats",[]);l(this,"ringMats",[]);l(this,"ppeMat")}create(e){e.add(this.group),this.floorMat=new M({vertexShader:ae,fragmentShader:Po.replace("col =","vec3 col ="),uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0});const i=new y(new E(64,54),this.floorMat);i.rotation.x=-Math.PI/2,i.position.set(U.x,U.y-6,U.z),this.group.add(i),this.rackMat=new M({vertexShader:ae,fragmentShader:So,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0});const s=[[-18,-9,10],[-12,-9,10],[-6,-9,10],[0,-9,10],[-18,-9,-10],[-12,-9,-10],[-6,-9,-10],[0,-9,-10]];for(const[u,d,w]of s){const f=new y(new oe(4,24,6),this.rackMat);f.position.set(U.x+u,U.y+d+12,U.z+w),this.group.add(f)}const a=new R({color:65450,transparent:!0,opacity:.7});for(let u=0;u<3;u++){const d=new y(new E(42,.5),a.clone());d.rotation.x=Math.PI/2,d.position.set(U.x-9,U.y+5.8,U.z-8+u*8),this.group.add(d)}const n=new c(U.x+14,U.y+2,U.z);this.ppeMat=new R({color:62975,wireframe:!0,transparent:!0,opacity:.9});const r=new y(new kt(2.8,1),this.ppeMat);r.position.copy(n),this.group.add(r),r.userData.rotating=!0;const p=new M({vertexShader:ae,fragmentShader:et,uniforms:{uTime:{value:0},uVisible:{value:0},uRadius:{value:.42},uColor:{value:new S(62975)}},transparent:!0,depthWrite:!1,side:D}),m=new y(new E(14,14),p);m.rotation.x=-Math.PI/2,m.position.set(n.x,n.y,n.z),this.group.add(m),this.ringMats.push(p);const g=new R({color:3800852,wireframe:!0,transparent:!0,opacity:.85}),b=[];for(let u=0;u<6;u++){const d=u/6*Math.PI*2,w=new c(n.x+Math.cos(d)*6,n.y,n.z+Math.sin(d)*6);b.push(w);const f=new y(new ie(.9,.9,.5,6),g.clone());f.position.copy(w),this.group.add(f);const P=new M({vertexShader:ae,fragmentShader:et,uniforms:{uTime:{value:0},uVisible:{value:0},uRadius:{value:.46},uColor:{value:new S(3800852)}},transparent:!0,depthWrite:!1,side:D}),x=new y(new E(4,4),P);x.rotation.x=-Math.PI/2,x.position.copy(w),this.group.add(x),this.ringMats.push(P)}for(let u=0;u<6;u++){const d=new Et(n,b[u]),w=new vt(d,20,.12,6,!1),f=new M({vertexShader:ae,fragmentShader:Mo,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0,depthWrite:!1,blending:O});f.uniforms.uTime.value=u*.16,this.group.add(new y(w,f)),this.busMats.push(f)}const h=ve[0],v=ze(h.title,h.neonColor,()=>Ge(h));v.position.set(n.x+5,n.y+8,n.z),v.scale.setScalar(1.8),this.group.add(v)}update(e){this.rackMat.uniforms.uTime.value=e,this.floorMat.uniforms.uTime.value=e,this.ringMats.forEach(i=>i.uniforms.uTime.value=e),this.busMats.forEach((i,s)=>i.uniforms.uTime.value=e+s*.16),this.group.traverse(i=>{i.userData.rotating&&(i.rotation.y+=.008,i.rotation.x+=.003)})}setVisible(e){this.rackMat.uniforms.uVisible.value=e,this.floorMat.uniforms.uVisible.value=e,this.ringMats.forEach(i=>i.uniforms.uVisible.value=e),this.busMats.forEach(i=>i.uniforms.uVisible.value=e),this.ppeMat&&(this.ppeMat.opacity=e*.9)}onHover(){}}const T=new c(-75,0,-25),Ao=`
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
`,tt="varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }";class Eo extends fe{constructor(){super(...arguments);l(this,"pcbMat");l(this,"pipeMat")}create(e){e.add(this.group),this.pcbMat=new M({vertexShader:tt,fragmentShader:Ao,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0});const i=new y(new E(70,70),this.pcbMat);i.rotation.x=-Math.PI/2,i.position.copy(T),this.group.add(i),this.pipeMat=new M({vertexShader:tt,fragmentShader:ko,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0,depthWrite:!1,side:D});const s=new y(new E(26,8),this.pipeMat);s.position.set(T.x,T.y+12,T.z),s.rotation.x=-.2,this.group.add(s);const a=new y(new oe(11.2,.9,14),new R({color:658966}));a.position.set(T.x-17,T.y+.45,T.z+1.5),this.group.add(a);const n=new y(new E(9,12),new R({color:399368}));n.rotation.x=-Math.PI/2,n.position.set(T.x-17,T.y+.92,T.z+1.5),this.group.add(n);const r=new y(new oe(14,1.1,11.2),new R({color:395796}));r.position.set(T.x+7,T.y+.55,T.z-2),this.group.add(r);const p=new R({color:13150272});for(let v=0;v<2;v++)for(let u=0;u<14;u++){const d=new y(new oe(.4,.3,.6),p);d.position.set(T.x-22+v*18,T.y+.15,T.z-5+u),this.group.add(d)}const m=new R({color:9136404}),g=[[-10,-8],[-10,4],[-5,-8],[-5,4],[2,-6],[2,2],[12,-6],[12,2]];for(const[v,u]of g){const d=new y(new ie(.5,.5,.8,8),m);d.position.set(T.x+v,T.y+.4,T.z+u),this.group.add(d)}const b=ve[1],h=ze(b.title,b.neonColor,()=>Ge(b));h.position.set(T.x-14,T.y+6,T.z+16),h.rotation.x=-.4,this.group.add(h)}update(e){this.pcbMat.uniforms.uTime.value=e,this.pipeMat.uniforms.uTime.value=e}setVisible(e){this.pcbMat.uniforms.uVisible.value=e,this.pipeMat.uniforms.uVisible.value=e}onHover(){}}const C=new c(-10,10,-80),Io=`
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
`,Lo=`
uniform float uTime;
uniform float uScale;
uniform float uVisible;
void main() {
  float fade = 1.0 - uScale * 0.28;
  float pulse = 0.5 + 0.5 * sin(uTime * 2.0 - uScale * 2.0);
  vec3 col = vec3(1.0, 0.1, 0.6) * (fade + 0.3 * pulse);
  gl_FragColor = vec4(col, fade * 0.7 * uVisible);
}
`,Fo=`
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
`;function Pe(o,t,e,i){const s=new R({color:8947848}),a=new y(new ie(.2,.3,20,8),s);a.position.set(t,e+10,i),o.add(a);for(let r=0;r<4;r++){const p=new y(new ie(.08,.08,4-r*.6,6),s);p.rotation.z=Math.PI/2,p.position.set(t,e+4+r*4,i),o.add(p)}const n=new y(new ut(.3,8,8),new R({color:16720384}));n.position.set(t,e+21,i),o.add(n)}class Vo extends fe{constructor(){super(...arguments);l(this,"mats",[]);l(this,"rings",[])}create(e){e.add(this.group),Pe(this.group,C.x-20,C.y-4,C.z),Pe(this.group,C.x+15,C.y-4,C.z-10),Pe(this.group,C.x+5,C.y-4,C.z+20);for(let g=0;g<4;g++){const b=new It(6+g*7,6.4+g*7,48),h=new M({vertexShader:Ro,fragmentShader:Lo,uniforms:{uTime:{value:0},uScale:{value:g},uVisible:{value:0}},transparent:!0,depthWrite:!1,side:D,blending:O}),v=new y(b,h);v.rotation.x=-Math.PI/2,v.position.set(C.x-20,C.y+6,C.z),this.group.add(v),this.rings.push({mesh:v,mat:h,delay:g*.4}),this.mats.push(h)}const i=new Le([new c(C.x-20,C.y+8,C.z),new c(C.x-5,C.y+12,C.z-5),new c(C.x+18,C.y+6,C.z+5)]),s=new vt(i,60,.15,6,!1),a=new M({vertexShader:"varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",fragmentShader:Io,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0,depthWrite:!1,blending:O});this.group.add(new y(s,a)),this.mats.push(a);const n=new M({vertexShader:"varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",fragmentShader:Fo,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0}),r=new y(new E(28,14),n);r.position.set(C.x+18,C.y+8,C.z+5),r.rotation.y=-.6,this.group.add(r),this.mats.push(n);const p=ve[2],m=ze(p.title,p.neonColor,()=>Ge(p));m.position.set(C.x-20,C.y+24,C.z),m.scale.setScalar(1.8),this.group.add(m)}update(e){for(const i of this.mats)i.uniforms.uTime.value=e}setVisible(e){for(const i of this.mats)i.uniforms.uVisible.value=e}onHover(){}}const H=new c(95,40,-90),No=`
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
`,ue=class ue extends fe{constructor(){super(...arguments);l(this,"nodeMat");l(this,"edgeMat");l(this,"floorMat");l(this,"logTexture");l(this,"logCanvas");l(this,"logCtx");l(this,"logLines",[]);l(this,"logTimer",0);l(this,"anomalyTimer",0);l(this,"currentAnomaly",-1)}create(e){e.add(this.group);const i=new M({vertexShader:Go,fragmentShader:Oo,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0,depthWrite:!1,side:D}),s=new y(new E(90,90),i);s.rotation.x=-Math.PI/2,s.position.set(H.x,H.y-18,H.z),this.group.add(s),this.floorMat=i;const a=5,n=8,r=[],p=new Float32Array(a*n),m=new Float32Array(a*n);for(let f=0;f<a;f++)for(let P=0;P<n;P++){const x=f*n+P;r.push(new c(H.x+(f-2)*8,H.y+(P-n/2+.5)*5.5,H.z)),p[x]=x,m[x]=Math.random()}const g=new Float32Array(r.flatMap(f=>[f.x,f.y,f.z])),b=new de;b.setAttribute("position",new V(g,3)),b.setAttribute("aNodeId",new V(p,1)),b.setAttribute("aActivation",new V(m,1)),this.nodeMat=new M({vertexShader:No,fragmentShader:Uo,uniforms:{uTime:{value:0},uVisible:{value:0},uAnomalyNode:{value:-1}},transparent:!0,depthWrite:!1,blending:O}),this.group.add(new De(b,this.nodeMat));const h=[],v=[];for(let f=0;f<a-1;f++)for(let P=0;P<n;P++)for(let x=0;x<n;x++){if(Math.random()>.3)continue;const A=r[f*n+P],k=r[(f+1)*n+x];h.push(A.x,A.y,A.z,k.x,k.y,k.z);const N=Math.random();v.push(N,N)}const u=new de;u.setAttribute("position",new V(new Float32Array(h),3)),u.setAttribute("aEdgePhase",new V(new Float32Array(v),1)),this.edgeMat=new M({vertexShader:_o,fragmentShader:Do,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0,depthWrite:!1,blending:O}),this.group.add(new ft(u,this.edgeMat)),this.logCanvas=document.createElement("canvas"),this.logCanvas.width=512,this.logCanvas.height=320,this.logCtx=this.logCanvas.getContext("2d"),this.logTexture=new _e(this.logCanvas),this.drawLog();const d=new R({map:this.logTexture,transparent:!0,depthWrite:!1,side:D}),w=new y(new E(16,10),d);w.position.set(H.x+16,H.y-2,H.z+4),w.rotation.y=-.5,this.group.add(w)}drawLog(){const e=this.logCtx,i=512,s=320;e.clearRect(0,0,i,s),e.fillStyle="rgba(4, 0, 18, 0.92)",e.fillRect(0,0,i,s);for(let n=0;n<s;n+=3)e.fillStyle="rgba(0,0,0,0.18)",e.fillRect(0,n,i,1);e.font="12px monospace";const a=this.logLines.slice(-20);for(let n=0;n<a.length;n++){const r=a[n];e.fillStyle=r.startsWith("ERROR")?"#ff4455":r.startsWith("WARN")?"#ffaa22":"#22ee88",e.shadowColor=e.fillStyle,e.shadowBlur=4,e.fillText(r,10,18+n*15)}e.fillStyle="#b000ff",e.shadowColor="#b000ff",e.shadowBlur=8,e.fillText("▋",10,18+a.length*15),this.logTexture.needsUpdate=!0}update(e){this.nodeMat.uniforms.uTime.value=e,this.edgeMat.uniforms.uTime.value=e,this.floorMat.uniforms.uTime.value=e,this.logTimer+=1/60,this.logTimer>.75&&(this.logTimer=0,this.logLines.push(ue.LOG_POOL[Math.floor(Math.random()*ue.LOG_POOL.length)]),this.drawLog()),this.anomalyTimer+=1/60,this.currentAnomaly===-1&&this.anomalyTimer>5?(this.anomalyTimer=0,this.currentAnomaly=Math.floor(Math.random()*40),this.nodeMat.uniforms.uAnomalyNode.value=this.currentAnomaly,this.logLines.push(`ERROR anomaly on node_${this.currentAnomaly}`),this.drawLog()):this.currentAnomaly!==-1&&this.anomalyTimer>2.5&&(this.anomalyTimer=0,this.logLines.push(`INFO  node_${this.currentAnomaly} resolved ✓`),this.drawLog(),this.currentAnomaly=-1,this.nodeMat.uniforms.uAnomalyNode.value=-1)}setVisible(e){this.nodeMat.uniforms.uVisible.value=e,this.edgeMat.uniforms.uVisible.value=e,this.floorMat.uniforms.uVisible.value=e,this.group.traverse(i=>{const s=i.material;(s==null?void 0:s.map)===this.logTexture&&(s.opacity=e)})}onHover(){}};l(ue,"LOG_POOL",["INFO  processing log batch #4821","INFO  PII masking: email→[REDACTED]","WARN  anomaly score: 0.82 (thresh 0.75)","ERROR latency spike: 3.2s on node_07","INFO  filing GitHub PR #89 auto-patch","INFO  LLM class: INCIDENT_RESOLVED","INFO  alert: slack #oncall notified","INFO  MTTR: 16s — system healed","INFO  model confidence: 0.96","WARN  CPU spike 94% → gpu-04 offload"]);let Ue=ue;const _=new c(100,22,-10),zo=`
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
`,$o="varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",jo=`
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
`,Xo="varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",qo=`
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
`,Me=[[0,28],[16,18],[22,-6],[11,-22],[-11,-22],[-22,-6],[-16,18],[0,6],[8,-8],[-8,-8]];class Zo extends fe{constructor(){super(...arguments);l(this,"nodeMat");l(this,"lineMat");l(this,"attackMat");l(this,"shieldMats",[]);l(this,"gridMat");l(this,"nodeStates");l(this,"nodeAttr");l(this,"attackTimer",3);l(this,"attackActive",!1);l(this,"attackWave",1);l(this,"infectedNode",-1)}create(e){e.add(this.group),this.gridMat=new M({vertexShader:Yo,fragmentShader:Ko,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0,depthWrite:!1,side:D});const i=new y(new E(80,80),this.gridMat);i.rotation.x=-Math.PI/2,i.position.set(_.x,_.y-6,_.z),this.group.add(i);const s=Me.length,a=new Float32Array(s*3);this.nodeStates=new Float32Array(s);const n=new Float32Array(s);Me.forEach(([v,u],d)=>{a[d*3]=_.x+v,a[d*3+1]=_.y-2,a[d*3+2]=_.z+u,n[d]=Math.random()*Math.PI*2});const r=new de;r.setAttribute("position",new V(a,3)),this.nodeAttr=new V(this.nodeStates,1),r.setAttribute("aState",this.nodeAttr),r.setAttribute("aPhase",new V(n,1)),this.nodeMat=new M({vertexShader:zo,fragmentShader:Wo,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0,depthWrite:!1,blending:O}),this.group.add(new De(r,this.nodeMat));const p=[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,0],[7,0],[7,1],[7,6],[8,2],[8,3],[8,7],[9,4],[9,5],[9,7]],m=[],g=[];p.forEach(([v,u])=>{const d=v*3,w=u*3;m.push(a[d],a[d+1],a[d+2]),m.push(a[w],a[w+1],a[w+2]);const f=Math.random();g.push(f,f)});const b=new de;b.setAttribute("position",new V(new Float32Array(m),3)),b.setAttribute("aLinePhase",new V(new Float32Array(g),1)),this.lineMat=new M({vertexShader:Bo,fragmentShader:Ho,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0,depthWrite:!1,blending:O}),this.group.add(new ft(b,this.lineMat)),this.attackMat=new M({vertexShader:$o,fragmentShader:jo,uniforms:{uTime:{value:0},uVisible:{value:0},uWave:{value:1},uOrigin:{value:new ee(.5,.5)}},transparent:!0,depthWrite:!1,blending:O,side:D});const h=new y(new E(80,80),this.attackMat);h.rotation.x=-Math.PI/2,h.position.set(_.x,_.y-5.5,_.z),this.group.add(h);for(let v=0;v<4;v++){const u=(v+1)*9,d=new M({vertexShader:Xo,fragmentShader:qo,uniforms:{uTime:{value:0},uVisible:{value:0},uLayer:{value:v}},transparent:!0,depthWrite:!1,blending:O,side:D}),w=new y(new E(u*2,u*2),d);w.rotation.x=-Math.PI/2,w.position.set(_.x,_.y-5+v*.3,_.z),this.group.add(w),this.shieldMats.push(d)}}update(e){if(this.nodeMat.uniforms.uTime.value=e,this.lineMat.uniforms.uTime.value=e,this.attackMat.uniforms.uTime.value=e,this.gridMat.uniforms.uTime.value=e,this.shieldMats.forEach(i=>i.uniforms.uTime.value=e),this.attackTimer-=1/60,!this.attackActive&&this.attackTimer<=0){this.infectedNode=Math.floor(Math.random()*7),this.nodeStates[this.infectedNode]=1,this.nodeAttr.needsUpdate=!0,this.attackWave=0,this.attackActive=!0;const[i,s]=Me[this.infectedNode];this.attackMat.uniforms.uOrigin.value.set(.5+i/60,.5+s/60)}this.attackActive&&(this.attackWave+=.003,this.attackMat.uniforms.uWave.value=this.attackWave,this.attackWave>.45&&this.infectedNode>=0&&this.nodeStates[this.infectedNode]===1&&(this.nodeStates[this.infectedNode]=2,this.nodeAttr.needsUpdate=!0),this.attackWave>=.9&&(this.infectedNode>=0&&(this.nodeStates[this.infectedNode]=0,this.nodeAttr.needsUpdate=!0,this.infectedNode=-1),this.attackActive=!1,this.attackTimer=5+Math.random()*3))}setVisible(e){this.nodeMat.uniforms.uVisible.value=e,this.lineMat.uniforms.uVisible.value=e,this.attackMat.uniforms.uVisible.value=e,this.gridMat.uniforms.uVisible.value=e,this.shieldMats.forEach(i=>i.uniforms.uVisible.value=e)}onHover(){}}const Jo=new Set([2,3]);class Qo{constructor(t,e){l(this,"envs",new Map);l(this,"activeEnv",null);l(this,"activeIdx",-1);l(this,"cityGroup");l(this,"cityVisible",!0);this.cityGroup=e;const i=[[2,new To],[3,new Eo],[4,new Vo],[6,new Ue],[7,new Zo]];for(const[s,a]of i)a.create(t),a.group.visible=!1,this.envs.set(s,a)}onSection(t){if(t===this.activeIdx)return;this.activeIdx=t,this.activeEnv&&(this.activeEnv.exit(),this.activeEnv=null);const e=Jo.has(t);e&&this.cityVisible?(this.cityVisible=!1,this.cityGroup.visible=!1):!e&&!this.cityVisible&&(this.cityVisible=!0,this.cityGroup.visible=!0);const i=this.envs.get(t);i&&(this.activeEnv=i,i.enter())}update(t){this.activeEnv&&this.activeEnv.update(t)}}const ei=document.getElementById("scene-canvas"),se=new Rt({canvas:ei,antialias:!0,alpha:!1,powerPreference:"high-performance"});se.setPixelRatio(Math.min(devicePixelRatio,2));se.setSize(innerWidth,innerHeight);se.toneMapping=Lt;se.toneMappingExposure=.95;const L=new Ft;L.background=new S(131602);L.fog=new Vt(197400,.003);const q=new Nt(60,innerWidth/innerHeight,.5,1200),we=new wo;we.setup(se,L,q);const We=new vo;We.create(L);const X=new lo;X.generate(L);X.addAntennas(L);const ti=ve.map((o,t)=>{const e=G[t+2];return{text:o.district,pos:new c(e.pos.x+12,80,e.pos.z-18),color:o.neonColor}});X.addNeonSigns(L,ti);const pt=new po;pt.create(L);const Be=new co;Be.create(L);const mt=new uo;mt.create(L);const oi=new Ut(128,0,.4);L.add(oi);const He=new dt;L.add(He);var rt,lt;(lt=(rt=X.cityGroup)==null?void 0:rt.children)==null||lt.forEach(o=>He.add(o));const gt=new Qo(L,He),ge=new S(62975);function ii(o){const t=Math.min(o,Fe.length-1);ge.copy(Fe[t]),Be.setDistrictNeon(ge),We.update(0,q.position,ge)}const $e=new yo(q);$e.onSectionChange=o=>{ai(o),ni(o),ii(o),we.triggerGlitch(),gt.onSection(o)};const si=document.getElementById("nav-dots");G.forEach((o,t)=>{const e=document.createElement("div");e.className="nav-dot"+(t===0?" active":""),e.title=o.label,e.addEventListener("click",()=>$e.goTo(t)),si.appendChild(e)});function ai(o){document.querySelectorAll(".sect").forEach((t,e)=>{t.classList.toggle("active",e===o)}),document.querySelectorAll(".nav-dot").forEach((t,e)=>{t.classList.toggle("active",e===o)})}function ni(o){const t=document.getElementById("hud-section");t&&(t.textContent=`DISTRICT_${String(o).padStart(2,"0")} / ${G[o].label}`)}ve.forEach((o,t)=>{const e=document.getElementById(`proj-${t+2}`);e&&(e.style.setProperty("--neon",o.neonColor),e.style.borderColor=o.neonColor+"44",e.innerHTML=`
    <div class="proj-icon" style="color:${o.neonColor};text-shadow:0 0 14px ${o.neonColor}">${o.icon}</div>
    <div class="proj-content">
      <div class="proj-district">${o.district}</div>
      <div class="proj-title" style="text-shadow:0 0 20px ${o.neonColor}88">${o.title}</div>
      <div class="proj-subtitle">${o.subtitle}</div>
      <p class="proj-desc">${o.desc}</p>
      <div class="proj-tags">${o.tags.map(i=>`<span class="proj-tag" style="border-color:${o.neonColor}44;color:${o.neonColor}">${i}</span>`).join("")}</div>
      <a class="proj-link" href="${o.url}" target="_blank" style="color:${o.neonColor};border-color:${o.neonColor}">[ VIEW SOURCE → ]</a>
    </div>
  `)});const ot=document.getElementById("skills-grid");ot&&Object.entries(xo).forEach(([o,t])=>{const e=document.createElement("div");e.className="skill-cat",e.innerHTML=`<div class="skill-cat-name">// ${o}</div>`+t.map(i=>`<div class="skill-item">${i}</div>`).join(""),ot.appendChild(e)});const j=document.getElementById("contact-input"),me=document.getElementById("contact-input-display");var ct;(ct=document.getElementById("sect-13"))==null||ct.addEventListener("click",()=>j==null?void 0:j.focus());j==null||j.addEventListener("input",()=>{me&&(me.textContent=(j.value||"")+"_"),j.value.trim().toLowerCase()==="sudo"&&(ri(),j.value="",me&&(me.textContent="_"))});function ri(){const o=document.querySelector("#sect-13 .terminal-body");if(!o)return;const t=document.createElement("p");t.className="output neon-green",t.textContent="> Permission granted. Downloading your future...",o.appendChild(t),setTimeout(()=>{const e=document.createElement("p");e.className="output",e.innerHTML='<span style="color:#ffe642">root@neon-district:~# ██████████ 100%  COMPLETE</span>',o.appendChild(e)},1500)}const it=["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];let ne=0;window.addEventListener("keydown",o=>{o.key===it[ne]?ne++:ne=0,ne===it.length&&(ne=0,li())});let Te=!1;function li(){Te=!Te,[X.meshA,X.meshB,X.meshC].forEach(o=>{const t=o.material;t.wireframe=Te})}const Ae=document.getElementById("boot-log"),st=document.getElementById("boot-bar"),re=document.getElementById("loading-screen"),ke=["Initializing WebGPU context","Generating city geometry","Compiling 47 shader programs","Spawning rain particles","Calibrating post-processing chain","System ready"];async function ci(){for(let o=0;o<ke.length;o++){await new Promise(e=>setTimeout(e,260+Math.random()*200));const t=document.createElement("p");t.innerHTML=`<span style="color:rgba(0,245,255,.5)">[BOOT]</span> ${ke[o]}... <span class="ok">[OK]</span>`,Ae==null||Ae.appendChild(t),st&&(st.style.width=(o+1)/ke.length*100+"%")}await new Promise(o=>setTimeout(o,600)),re==null||re.classList.add("fade-out"),setTimeout(()=>{re&&(re.style.display="none")},850)}ci();const at=new _t,Ee=new ee;window.addEventListener("click",o=>{if(o.target.closest("#env-detail-panel"))return;Ee.x=o.clientX/innerWidth*2-1,Ee.y=-(o.clientY/innerHeight)*2+1,at.setFromCamera(Ee,q);const t=at.intersectObjects(L.children,!0);for(const e of t){const i=e.object;if(i.userData.isLabel&&i.userData.onClick){i.userData.onClick();return}}Oe()});window.addEventListener("resize",()=>{q.aspect=innerWidth/innerHeight,q.updateProjectionMatrix(),se.setSize(innerWidth,innerHeight),we.resize(innerWidth,innerHeight)});const nt=new Dt;function wt(){requestAnimationFrame(wt);const o=nt.getElapsedTime(),t=nt.getDelta();X.update(o),Be.update(o),mt.update(o,q.position),pt.update(o),We.update(o,q.position,ge),$e.update(t),gt.update(o),we.render()}wt();
