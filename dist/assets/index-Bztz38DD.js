var Pt=Object.defineProperty;var At=(n,o,e)=>o in n?Pt(n,o,{enumerable:!0,configurable:!0,writable:!0,value:e}):n[o]=e;var l=(n,o,e)=>At(n,typeof o!="symbol"?o+"":o,e);import{i as P,d as ue,I as Z,q as ne,j as he,u as $e,a8 as h,S as je,w as I,C as se,K as N,m as z,v as S,a0 as L,f as fe,e as $,a as W,Q as Ne,a1 as Le,B as Et,E as kt,a7 as le,a4 as Rt,g as Xe,G as vt,z as It,L as Lt,a3 as gt,R as wt,Z as Nt,r as yt,O as Ft,ab as Ut,A as Vt,$ as Ot,o as zt,P as Gt,H as _t,W as Dt,h as Wt}from"./three-BoaZUbwP.js";import{b as Bt,R as Ht,a as $t,B as Ue,C as jt,V as Xt,N as qt,S as Kt,G as Yt,c as Ve,E as Zt}from"./postprocessing-D8IqWZOr.js";import{g as ce}from"./gsap-SFc2wnMY.js";(function(){const o=document.createElement("link").relList;if(o&&o.supports&&o.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))t(a);new MutationObserver(a=>{for(const r of a)if(r.type==="childList")for(const i of r.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&t(i)}).observe(document,{childList:!0,subtree:!0});function e(a){const r={};return a.integrity&&(r.integrity=a.integrity),a.referrerPolicy&&(r.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?r.credentials="include":a.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function t(a){if(a.ep)return;a.ep=!0;const r=e(a);fetch(a.href,r)}})();function ot(n){return n*n*n*(n*(n*6-15)+10)}function Oe(n,o,e){return n+e*(o-n)}function Ee(n,o,e){const t=n&3,a=t<2?o:e,r=t<2?e:o;return(n&1?-a:a)+(n&2?-r:r)}const q=Array.from({length:512},(n,o)=>o).sort(()=>Math.random()-.5);for(let n=0;n<256;n++)q[n+256]=q[n];function Jt(n,o){const e=Math.floor(n)&255,t=Math.floor(o)&255,a=n-Math.floor(n),r=o-Math.floor(o),i=ot(a),s=ot(r),d=q[q[e]+t],m=q[q[e]+t+1],w=q[q[e+1]+t],y=q[q[e+1]+t+1];return Oe(Oe(Ee(d,a,r),Ee(w,a-1,r),i),Oe(Ee(m,a,r-1),Ee(y,a-1,r-1),i),s)}function it(n,o,e=4,t=2,a=.5){let r=0,i=.5,s=1;for(let d=0;d<e;d++)r+=Jt(n*s,o*s)*i,s*=t,i*=a;return r}function O(n,o){return n+Math.random()*(o-n)}function nt(n,o){return Math.floor(O(n,o+1))}const Qt=`
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
`,eo=`
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
`,to=`
varying vec2 vUv;
varying vec3 vWorldPos;
varying vec3 vNormal;
void main() {
  vUv = uv;
  vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,oo=`
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
`,io=`
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
`,no=`
varying float vAlpha;
void main() {
  gl_FragColor = vec4(0.55, 0.75, 1.0, vAlpha * 0.35);
}
`,so=`
varying vec3 vLocalPos;
void main() {
  vLocalPos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,ao=`
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
`,ro=`
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
`,lo=`
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
`,D=32,ie=16,co=6,xe=ie+co,ke=D/2*xe,ze={color:new P(197400),near:100,far:500},Ce=[new P(62975),new P(62975),new P(16711850),new P(16711850),new P(16739098),new P(8073215),new P(8073215),new P(65416),new P(65416),new P(16770626)];function uo(){return new L({vertexShader:Qt,fragmentShader:eo,uniforms:{uTime:{value:0},uFogColor:{value:ze.color},uFogNear:{value:ze.near},uFogFar:{value:ze.far}}})}function ho(n,o){const e=n/D,t=o/D;return e<.35&&t<.35?0:e<.65&&t<.35?1:e>=.65&&t<.35?2:e<.35&&t<.65?3:e>=.65&&t<.65?4:e<.35&&t>=.65?5:e<.65&&t>=.65?6:e>=.65&&t>=.65?7:t>.45&&t<.55?8:9}class fo{constructor(){l(this,"meshA");l(this,"meshB");l(this,"meshC");l(this,"mats",[])}generate(o){const e=D*D,t=uo();this.mats.push(t);const a=new ue(1,1,1),r=new Float32Array(e),i=new Float32Array(e*3);a.setAttribute("aHeight",new Z(r,1)),a.setAttribute("aNeonColor",new Z(i,3)),this.meshA=new ne(a,t.clone(),e),this.meshA.frustumCulled=!1,this.mats.push(this.meshA.material);const s=new he(.45,.55,1,10),d=new Float32Array(e),m=new Float32Array(e*3);s.setAttribute("aHeight",new Z(d,1)),s.setAttribute("aNeonColor",new Z(m,3)),this.meshB=new ne(s,t.clone(),e),this.meshB.frustumCulled=!1,this.mats.push(this.meshB.material);const w=new ue(1,.4,1),y=new Float32Array(e),v=new Float32Array(e*3);w.setAttribute("aHeight",new Z(y,1)),w.setAttribute("aNeonColor",new Z(v,3)),this.meshC=new ne(w,t.clone(),e),this.meshC.frustumCulled=!1,this.mats.push(this.meshC.material);const g=new $e,c=new h,p=new h,u=new je;let x=0,T=0,b=0;for(let C=0;C<D;C++)for(let M=0;M<D;M++){const k=C*xe-ke,F=M*xe-ke;if(C%5===0||M%5===0||C%2===0&&M%2===0&&Math.random()<.25)continue;const _=C/D*4-2,K=M/D*4-2,ae=it(_,K,5),Pe=Math.sqrt(_*_+K*K)/3,Ae=Math.max(.18,1-Pe*.6),j=Math.max(8,(22+ae*170)*Ae)+O(4,28),re=O(ie*.42,ie*.9),A=O(ie*.42,ie*.9),U=ho(C,M),R=Ce[U],oe=Math.random();if(oe<.65)r[x]=j,i[x*3]=R.r,i[x*3+1]=R.g,i[x*3+2]=R.b,c.set(k,j/2,F),p.set(re,j,A),g.compose(c,u,p),this.meshA.setMatrixAt(x,g),x++;else if(oe<.82){const Y=O(ie*.18,ie*.32);d[T]=j,m[T*3]=R.r,m[T*3+1]=R.g,m[T*3+2]=R.b,c.set(k+O(-3,3),j/2,F+O(-3,3)),p.set(Y*2,j,Y*2),g.compose(c,u,p),this.meshB.setMatrixAt(T,g),T++}else{const Y=Math.max(6,j*.35);y[b]=Y,v[b*3]=R.r,v[b*3+1]=R.g,v[b*3+2]=R.b,c.set(k,Y/2,F),p.set(re*1.4,Y,A*1.4),g.compose(c,u,p),this.meshC.setMatrixAt(b,g),b++}}this.meshA.count=x,this.meshB.count=T,this.meshC.count=b;for(const C of[this.meshA,this.meshB,this.meshC]){C.instanceMatrix.needsUpdate=!0;const M=C.geometry;M.getAttribute("aHeight").needsUpdate=!0,M.getAttribute("aNeonColor").needsUpdate=!0,o.add(C)}}addAntennas(o){const e=new he(.1,.1,1,4),t=new I({color:16716083}),a=new ne(e,t,400);a.frustumCulled=!1;const r=new $e,i=new h,s=new h,d=new je;let m=0;for(let w=0;w<400;w++){const y=nt(0,D-1),v=nt(0,D-1),g=y*xe-ke,c=v*xe-ke,p=y/D*4-2,u=v/D*4-2,x=Math.max(.18,1-Math.sqrt(p*p+u*u)/3*.6),T=Math.max(8,(22+it(p,u,5)*170)*x)+20,b=O(8,30);i.set(g+O(-3,3),T+b/2,c+O(-3,3)),s.set(1,b,1),r.compose(i,d,s),a.setMatrixAt(m++,r)}a.count=m,a.instanceMatrix.needsUpdate=!0,o.add(a)}addNeonSigns(o,e){e.forEach(({text:t,pos:a,color:r})=>{const i=document.createElement("canvas");i.width=256,i.height=64;const s=i.getContext("2d");s.clearRect(0,0,256,64),s.fillStyle=r+"22",s.fillRect(0,0,256,64),s.strokeStyle=r,s.lineWidth=2,s.strokeRect(2,2,252,60),s.fillStyle=r,s.font="bold 22px monospace",s.textAlign="center",s.fillText(t,128,40);const d=new se(i),m=new N(18,4.5),w=new I({map:d,transparent:!0,side:z,depthWrite:!1}),y=new S(m,w);y.position.copy(a),o.add(y)})}update(o){for(const e of this.mats)e.uniforms.uTime.value=o}}class po{constructor(){l(this,"mesh");l(this,"mat")}create(o){const e=new N(1200,1200,1,1);return this.mat=new L({vertexShader:to,fragmentShader:oo,uniforms:{uTime:{value:0},uDistrictNeon:{value:new P(62975)},uRainIntensity:{value:1}}}),this.mesh=new S(e,this.mat),this.mesh.rotation.x=-Math.PI/2,this.mesh.position.y=0,o.add(this.mesh),this.mesh}update(o){this.mat.uniforms.uTime.value=o}setDistrictNeon(o){this.mat.uniforms.uDistrictNeon.value.copy(o)}setRainIntensity(o){this.mat.uniforms.uRainIntensity.value=o}}class mo{constructor(){l(this,"points");l(this,"count",8e3)}create(o){const e=new Float32Array(this.count*3),t=new Float32Array(this.count),a=new Float32Array(this.count);for(let s=0;s<this.count;s++)e[s*3]=O(-300,300),e[s*3+1]=O(-60,60),e[s*3+2]=O(-300,300),t[s]=O(.3,1),a[s]=Math.random();const r=new fe;r.setAttribute("position",new $(e,3)),r.setAttribute("aSpeed",new $(t,1)),r.setAttribute("aOffset",new $(a,1));const i=new L({vertexShader:io,fragmentShader:no,uniforms:{uTime:{value:0}},transparent:!0,blending:W,depthWrite:!1});this.points=new Ne(r,i),o.add(this.points)}update(o,e){const t=this.points.material;t.uniforms.uTime.value=o,e&&(this.points.position.x=e.x,this.points.position.z=e.z)}}class vo{constructor(){l(this,"mesh");l(this,"mat")}create(o){const e=new Le(2e3,32,16);this.mat=new L({vertexShader:so,fragmentShader:ao,uniforms:{uTime:{value:0},uZenithColor:{value:new P(132104)},uHorizonColor:{value:new P(1706e3)},uDistrictNeon:{value:new P(62975)}},side:Et,depthWrite:!1}),this.mesh=new S(e,this.mat),this.mesh.renderOrder=-1,o.add(this.mesh)}update(o,e,t){this.mesh.position.copy(e),this.mat.uniforms.uTime.value=o,t&&this.mat.uniforms.uDistrictNeon.value.copy(t)}setDistrictColors(o,e){this.mat.uniforms.uHorizonColor.value.copy(o),this.mat.uniforms.uDistrictNeon.value.copy(e)}}function go(n){let o=n;return()=>{o|=0,o=o+1831565813|0;let e=Math.imul(o^o>>>15,1|o);return e=e+Math.imul(e^e>>>7,61|e)^e,((e^e>>>14)>>>0)/4294967296}}const st=[new P(16720384),new P(61183),new P(22015),new P(16711884),new P(65382),new P(16737792),new P(11141375),new P(16770626)],qe=32,bt=16,wo=6,Ke=bt+wo,at=qe/2*Ke;class yo{constructor(){l(this,"mesh");l(this,"mat")}create(o){const t=new N(5,1.4),a=new Float32Array(150*3),r=new Float32Array(150),i=new Float32Array(150);t.setAttribute("aColor",new Z(a,3)),t.setAttribute("aFlickerSeed",new Z(r,1)),t.setAttribute("aPulseMode",new Z(i,1)),this.mat=new L({vertexShader:ro,fragmentShader:lo,uniforms:{uTime:{value:0}},transparent:!0,depthWrite:!1,side:z,blending:W}),this.mesh=new ne(t,this.mat,150),this.mesh.frustumCulled=!1;const s=go(42),d=new $e,m=new h,w=new je,y=new h(1,1,1);let v=0;for(let g=0;g<qe&&v<150;g++)for(let c=0;c<qe&&v<150;c++){if(g%5===0||c%5===0||s()>.1)continue;const p=g*Ke-at,u=c*Ke-at,x=6+s()*12,T=Math.floor(s()*4),b=bt*.5+.3;let C=p,M=u,k=0;T===0?(M=u+b,k=0):T===1?(M=u-b,k=Math.PI):T===2?(C=p+b,k=Math.PI*.5):(C=p-b,k=-Math.PI*.5),m.set(C,x,M),w.setFromEuler(new kt(0,k,0)),d.compose(m,w,y),this.mesh.setMatrixAt(v,d);const F=st[Math.floor(s()*st.length)];a[v*3]=F.r,a[v*3+1]=F.g,a[v*3+2]=F.b,r[v]=s();const _=s();i[v]=_<.6?0:_<.85?1:_<.95?2:3,v++}this.mesh.count=v,this.mesh.instanceMatrix.needsUpdate=!0,t.getAttribute("aColor").needsUpdate=!0,t.getAttribute("aFlickerSeed").needsUpdate=!0,t.getAttribute("aPulseMode").needsUpdate=!0,o.add(this.mesh)}update(o){this.mat.uniforms.uTime.value=o}}const bo=`
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
`;class xo extends Zt{constructor(o=.45){super("LensStreakEffect",bo,{uniforms:new Map([["uIntensity",new Rt(o)]])})}}class So{constructor(){l(this,"composer");l(this,"glitch");l(this,"glitchTimeout",0)}setup(o,e,t){this.composer=new Bt(o);const a=new Ht(e,t),r=new $t({blendFunction:Ue.ADD,luminanceThreshold:.25,luminanceSmoothing:.4,intensity:2.4,radius:.6}),i=new xo(.45),s=new jt({offset:new le(.0018,.0012),radialModulation:!0,modulationOffset:.5}),d=new Xt({eskil:!1,offset:.35,darkness:.75}),m=new qt({blendFunction:Ue.OVERLAY,premultiply:!0});m.blendMode.opacity.value=.04;const w=new Kt({blendFunction:Ue.OVERLAY,density:1.4});return w.blendMode.opacity.value=.07,this.glitch=new Yt({delay:new le(99999,99999),duration:new le(.15,.35),strength:new le(.15,.4),columns:.04,ratio:.85}),this.composer.addPass(a),this.composer.addPass(new Ve(t,r,i)),this.composer.addPass(new Ve(t,s,w,d,m)),this.composer.addPass(new Ve(t,this.glitch)),this.composer}triggerGlitch(){this.glitch.delay.set(0,.05),clearTimeout(this.glitchTimeout),this.glitchTimeout=window.setTimeout(()=>{this.glitch.delay.set(99999,99999)},600)}resize(o,e){this.composer.setSize(o,e)}render(){this.composer.render()}}const X=[{pos:new h(0,180,220),look:new h(0,0,0),label:"HERO",t:0},{pos:new h(-40,12,110),look:new h(-20,20,60),label:"ABOUT",t:0},{pos:new h(-80,-8,55),look:new h(-80,-8,20),label:"PS3 GPU",t:0},{pos:new h(-75,30,-25),look:new h(-75,0,-25),label:"CPUonGPU",t:0},{pos:new h(-30,10,-60),look:new h(0,20,-90),label:"GPU Stream",t:0},{pos:new h(20,35,-80),look:new h(40,25,-110),label:"Selkies",t:0},{pos:new h(80,55,-70),look:new h(100,35,-100),label:"Oris AI",t:0},{pos:new h(110,40,0),look:new h(90,22,-20),label:"VajraGrid",t:0},{pos:new h(100,20,70),look:new h(70,14,50),label:"VidyaMitra",t:0},{pos:new h(50,16,100),look:new h(20,12,80),label:"Netflip",t:0},{pos:new h(10,22,90),look:new h(-20,16,70),label:"Arena",t:0},{pos:new h(-30,60,70),look:new h(-10,40,40),label:"Hackathon",t:0},{pos:new h(-60,8,30),look:new h(-40,8,0),label:"SKILLS",t:0},{pos:new h(0,120,160),look:new h(0,0,0),label:"CONTACT",t:0}],Co=1600;class Mo{constructor(o){l(this,"camera");l(this,"posSpline");l(this,"lookSpline");l(this,"t",0);l(this,"currentSection",0);l(this,"mouseX",0);l(this,"mouseY",0);l(this,"_pos",new h);l(this,"_look",new h);l(this,"_ahead",new h);l(this,"onSectionChange");l(this,"_lastFiredSection",0);this.camera=o,this.buildSpline(),this.init()}buildSpline(){const o=X.map(a=>a.pos.clone()),e=X.map(a=>a.look.clone());this.posSpline=new Xe(o,!1,"catmullrom",.5),this.lookSpline=new Xe(e,!1,"catmullrom",.5);const t=X.length;X.forEach((a,r)=>{a.t=r/(t-1)}),this.t=0,this.posSpline.getPoint(0,this._pos),this.lookSpline.getPoint(0,this._look),this.camera.position.copy(this._pos),this.camera.lookAt(this._look)}init(){window.addEventListener("mousemove",t=>{this.mouseX=(t.clientX/window.innerWidth-.5)*2,this.mouseY=(t.clientY/window.innerHeight-.5)*2});let o=!1;window.addEventListener("wheel",t=>{if(o)return;o=!0;const a=t.deltaY>0?1:-1;this.goTo(this.currentSection+a),setTimeout(()=>{o=!1},Co)},{passive:!0});let e=0;window.addEventListener("touchstart",t=>{e=t.touches[0].clientY}),window.addEventListener("touchend",t=>{const a=e-t.changedTouches[0].clientY;Math.abs(a)>40&&this.goTo(this.currentSection+(a>0?1:-1))}),window.addEventListener("keydown",t=>{(t.key==="ArrowDown"||t.key==="ArrowRight")&&this.goTo(this.currentSection+1),(t.key==="ArrowUp"||t.key==="ArrowLeft")&&this.goTo(this.currentSection-1)})}goTo(o){if(o=Math.max(0,Math.min(X.length-1,o)),o===this.currentSection)return;const e=this.currentSection;this.currentSection=o;const t=X[o].t,r=.6+Math.abs(t-this.t)*5;ce.killTweensOf(this),ce.to(this,{t,duration:r,ease:"power2.inOut",onUpdate:()=>this._fireCrossings(e,o),onComplete:()=>{var i;this._lastFiredSection=o,(i=this.onSectionChange)==null||i.call(this,o),this._updateUI(o)}}),this._updateUI(o)}_fireCrossings(o,e){const t=e>o?1:-1;X.forEach((a,r)=>{var s;(t>0?this.t>=a.t&&r>this._lastFiredSection&&r<=e:this.t<=a.t&&r<this._lastFiredSection&&r>=e)&&(this._lastFiredSection=r,(s=this.onSectionChange)==null||s.call(this,r),this._updateUI(r))})}update(o){this.posSpline.getPoint(this.t,this._pos),this.camera.position.copy(this._pos);const e=Math.min(1,this.t+.015);this.posSpline.getPoint(e,this._ahead),this.lookSpline.getPoint(this.t,this._look);const t=this._look.x*.8+this._ahead.x*.2+this.mouseX*5,a=this._look.y*.8+this._ahead.y*.2-this.mouseY*3,r=this._look.z*.8+this._ahead.z*.2;this.camera.lookAt(t,a,r)}_updateUI(o){document.querySelectorAll(".nav-dot").forEach((t,a)=>t.classList.toggle("active",a===o));const e=document.getElementById("progress-bar");e&&(e.style.height=o/(X.length-1)*100+"%")}getCurrentSection(){return this.currentSection}}const pe=[{id:"ps3-gpu",title:"PS3 Cell GPU Emulator",subtitle:"Systems / Emulation",desc:"Full emulation of the Cell Broadband Engine's SPU pipeline in WebGL. 6 SPU cores, PPE scheduler, DMA bus — running real PS3 shaders in the browser at 200 GIPS.",tags:["C++","WebGL","GLSL","Cell BE","Emulation"],url:"https://github.com/aerosane",neonColor:"#00f5ff",district:"GPU DISTRICT",icon:"⬡"},{id:"cpuongpu",title:"CPUonGPU",subtitle:"Architecture Research",desc:"Runs a full x86 CPU simulation entirely on GPU compute shaders. Register file, ALU, cache hierarchy — all in GLSL. JIT-compiled x86 → SPIR-V at runtime.",tags:["GLSL","Compute Shaders","x86","JIT","SPIR-V"],url:"https://github.com/aerosane",neonColor:"#00f5ff",district:"GPU DISTRICT",icon:"⬢"},{id:"gpu-streaming",title:"GPU Streaming Pipeline",subtitle:"NvFBC + NVENC",desc:"Sub-frame-latency game streaming via NvFBC capture → NVENC H265/AV1 encode → WebRTC TURN relay. <1 frame E2E latency. Deployed on GitHub Codespace GPU.",tags:["NVENC","NvFBC","WebRTC","Rust","H265"],url:"https://github.com/Imperialorg/codespace",neonColor:"#00f5ff",district:"GPU DISTRICT",icon:"▶"},{id:"selkies-rust",title:"Selkies-Rust",subtitle:"Python→Rust Port",desc:"Complete rewrite of the Selkies WebRTC game streaming stack from Python into Rust. 6 crates: pipeline, signaling, input, encoding, metrics, CLI.",tags:["Rust","WebRTC","GStreamer","Tokio","GSAP"],url:"https://github.com/Imperialorg/codespace",neonColor:"#ff6b1a",district:"SYSTEMS CORRIDOR",icon:"⚙"},{id:"oris-ai",title:"Oris — AI SRE",subtitle:"🏆 Runner-up · TechSynapse 2026",desc:"Autonomous Site Reliability Engineer: ingests production logs, PII-masks with Presidio, infers root cause via Gemini 2.0, opens GitHub PRs with fixes. Zero human touch.",tags:["Python","Gemini 2.0","Presidio","LangChain","FastAPI"],url:"https://github.com/aerosane",neonColor:"#ff00aa",district:"AI DISTRICT",icon:"◈"},{id:"vajragrid",title:"VajraGrid",subtitle:"🇮🇳 India Innovates 2026 · Bharat Mandapam",desc:"AI-hardened power grid security: detects SCADA cyberattacks in 16s, 4-layer ML defense stack, adversarial training. Exhibited nationally at Bharat Mandapam.",tags:["Python","PyTorch","SCADA","Adversarial ML","GridSec"],url:"https://github.com/aerosane",neonColor:"#ff00aa",district:"AI DISTRICT",icon:"⚡"},{id:"vidyamitra",title:"VidyaMitra",subtitle:"IISER JEE Prep",desc:"AI tutor for JEE aspirants: adaptive quiz engine, LaTeX equation rendering, spaced repetition. Covers Physics, Chemistry, Math with difficulty auto-calibration.",tags:["TypeScript","React","LaTeX","OpenAI","Supabase"],url:"https://github.com/aerosane",neonColor:"#00ff88",district:"EDTECH ZONE",icon:"⬟"},{id:"netflip",title:"Netflip VOD",subtitle:"Full-Stack Streaming",desc:"Netflix-clone with HLS adaptive streaming, Azure Blob CDN, Fastly edge cache, WebSocket live chat, OAuth2, recommendation engine. 1080p adaptive bitrate.",tags:["Next.js","HLS","Azure","Fastly","PostgreSQL"],url:"https://github.com/aerosane",neonColor:"#7b2fff",district:"WEB DISTRICT",icon:"▨"},{id:"coding-arena",title:"Coding Arena",subtitle:"Competitive Judging Platform",desc:"Online judge with isolated Docker execution, multi-language support, real-time leaderboard, plagiarism detection via AST similarity. 200ms median judge latency.",tags:["Go","Docker","Redis","React","WebSocket"],url:"https://github.com/aerosane",neonColor:"#7b2fff",district:"WEB DISTRICT",icon:"{ }"},{id:"hackathon",title:"Hackathon Wins",subtitle:"Hall of Fame",desc:"🏆 Runner-up at TechSynapse 2026 (Oris AI SRE). 🇮🇳 National exhibition at India Innovates 2026, Bharat Mandapam, New Delhi (VajraGrid). 1st year, two nationals.",tags:["Oris AI","VajraGrid","TechSynapse","India Innovates"],url:"https://github.com/aerosane",neonColor:"#ffe642",district:"HALL OF FAME",icon:"🏆"}],To={Languages:["C++","Rust","Python","TypeScript","Go","GLSL/HLSL"],Systems:["WebRTC","WebGL/WebGPU","NVENC/NvFBC","Docker","Linux"],"AI/ML":["PyTorch","Gemini API","LangChain","Presidio","HuggingFace"],Web:["React","Next.js","Vite","Node.js","PostgreSQL","Redis"],Tools:["Git","GitHub Actions","Azure","GStreamer","Tokio"]};class me{constructor(){l(this,"group",new vt);l(this,"hoverTargets",[]);l(this,"visible",!1);l(this,"visibleValue",0)}enter(){this.group.visible=!0,this.visible=!0,ce.killTweensOf(this),ce.to(this,{visibleValue:1,duration:1.4,ease:"power2.out",onUpdate:()=>this.setVisible(this.visibleValue)})}exit(){this.visible=!1,ce.killTweensOf(this),ce.to(this,{visibleValue:0,duration:.8,ease:"power2.in",onUpdate:()=>this.setVisible(this.visibleValue),onComplete:()=>{this.group.visible=!1}})}setVisible(o){}dispose(){this.group.traverse(o=>{o.geometry&&o.geometry.dispose()})}}let Q=null;function Po(){return Q||(Q=document.createElement("div"),Q.id="env-detail-panel",Object.assign(Q.style,{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%, -50%) scale(0.92)",background:"rgba(4,6,20,0.92)",border:"1px solid var(--neon, #00f5ff)",boxShadow:"0 0 32px var(--neon, #00f5ff)44",padding:"28px 36px",maxWidth:"480px",width:"90vw",zIndex:"9999",fontFamily:"monospace",color:"#e8f4ff",opacity:"0",pointerEvents:"none",transition:"opacity 0.3s, transform 0.3s",borderRadius:"4px"}),document.body.appendChild(Q),Q)}function Me(n){var e;const o=Po();o.style.setProperty("--neon",n.neonColor),o.style.borderColor=n.neonColor+"88",o.style.boxShadow=`0 0 40px ${n.neonColor}33`,o.innerHTML=`
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px">
      <div>
        <div style="color:${n.neonColor};font-size:11px;letter-spacing:3px;text-transform:uppercase;margin-bottom:4px">${n.subtitle}</div>
        <div style="font-size:20px;font-weight:bold;color:#fff">${n.title}</div>
      </div>
      <button id="env-panel-close" style="background:none;border:none;color:#888;font-size:20px;cursor:pointer;line-height:1;padding:0 0 0 16px">✕</button>
    </div>
    <div style="font-size:13px;line-height:1.7;color:#c8d8ef;margin-bottom:16px">${n.desc}</div>
    <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:18px">
      ${n.tags.map(t=>`<span style="background:${n.neonColor}18;border:1px solid ${n.neonColor}44;color:${n.neonColor};font-size:10px;padding:3px 8px;border-radius:2px">${t}</span>`).join("")}
    </div>
    <a href="${n.url}" target="_blank" rel="noopener"
       style="display:inline-block;padding:9px 20px;background:${n.neonColor}22;border:1px solid ${n.neonColor};color:${n.neonColor};text-decoration:none;font-size:12px;letter-spacing:1px;transition:background 0.2s"
       onmouseover="this.style.background='${n.neonColor}44'"
       onmouseout="this.style.background='${n.neonColor}22'">
      VIEW ON GITHUB →
    </a>
  `,(e=o.querySelector("#env-panel-close"))==null||e.addEventListener("click",t=>{t.stopPropagation(),xt()}),o.style.pointerEvents="all",o.style.opacity="1",o.style.transform="translate(-50%, -50%) scale(1)"}function xt(){const n=Q;n&&(n.style.opacity="0",n.style.transform="translate(-50%, -50%) scale(0.92)",n.style.pointerEvents="none")}function Te(n,o,e){const r=document.createElement("canvas");r.width=512,r.height=64;const i=r.getContext("2d");i.clearRect(0,0,512,64),i.font="bold 20px monospace",i.textAlign="center",i.shadowColor=o;for(const w of[24,12,6])i.shadowBlur=w,i.fillStyle=o,i.fillText(n,512/2,34);i.shadowBlur=0,i.fillStyle="#ffffff",i.fillText(n,512/2,34),i.font="11px monospace",i.shadowBlur=6,i.shadowColor=o,i.fillStyle=o,i.fillText("▶  CLICK FOR DETAILS",512/2,54);const s=new se(r),d=new I({map:s,transparent:!0,depthWrite:!1,side:z,alphaTest:.02}),m=new S(new N(9,1.2),d);return m.userData.isLabel=!0,m.userData.onClick=e,m.frustumCulled=!1,m.onBeforeRender=(w,y,v)=>m.quaternion.copy(v.quaternion),m}const B=new h(-80,-8,38),Ao=`
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
`,Eo=`
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
`,ko=`
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
`,rt=`
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
`,we="varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }";class Ro extends me{constructor(){super(...arguments);l(this,"rackMat");l(this,"floorMat");l(this,"busMats",[]);l(this,"ringMats",[]);l(this,"ppeMat")}create(e){e.add(this.group),this.floorMat=new L({vertexShader:we,fragmentShader:Eo.replace("col =","vec3 col ="),uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0});const t=new S(new N(64,54),this.floorMat);t.rotation.x=-Math.PI/2,t.position.set(B.x,B.y-6,B.z),this.group.add(t),this.rackMat=new L({vertexShader:we,fragmentShader:Ao,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0});const a=[[-18,-9,10],[-12,-9,10],[-6,-9,10],[0,-9,10],[-18,-9,-10],[-12,-9,-10],[-6,-9,-10],[0,-9,-10]];for(const[c,p,u]of a){const x=new S(new ue(4,24,6),this.rackMat);x.position.set(B.x+c,B.y+p+12,B.z+u),this.group.add(x)}const r=new I({color:65450,transparent:!0,opacity:.7});for(let c=0;c<3;c++){const p=new S(new N(42,.5),r.clone());p.rotation.x=Math.PI/2,p.position.set(B.x-9,B.y+5.8,B.z-8+c*8),this.group.add(p)}const i=new h(B.x+14,B.y+2,B.z);this.ppeMat=new I({color:62975,wireframe:!0,transparent:!0,opacity:.9});const s=new S(new It(2.8,1),this.ppeMat);s.position.copy(i),this.group.add(s),s.userData.rotating=!0;const d=new L({vertexShader:we,fragmentShader:rt,uniforms:{uTime:{value:0},uVisible:{value:0},uRadius:{value:.42},uColor:{value:new P(62975)}},transparent:!0,depthWrite:!1,side:z}),m=new S(new N(14,14),d);m.rotation.x=-Math.PI/2,m.position.set(i.x,i.y,i.z),this.group.add(m),this.ringMats.push(d);const w=new I({color:3800852,wireframe:!0,transparent:!0,opacity:.85}),y=[];for(let c=0;c<6;c++){const p=c/6*Math.PI*2,u=new h(i.x+Math.cos(p)*6,i.y,i.z+Math.sin(p)*6);y.push(u);const x=new S(new he(.9,.9,.5,6),w.clone());x.position.copy(u),this.group.add(x);const T=new L({vertexShader:we,fragmentShader:rt,uniforms:{uTime:{value:0},uVisible:{value:0},uRadius:{value:.46},uColor:{value:new P(3800852)}},transparent:!0,depthWrite:!1,side:z}),b=new S(new N(4,4),T);b.rotation.x=-Math.PI/2,b.position.copy(u),this.group.add(b),this.ringMats.push(T)}for(let c=0;c<6;c++){const p=new Lt(i,y[c]),u=new gt(p,20,.12,6,!1),x=new L({vertexShader:we,fragmentShader:ko,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0,depthWrite:!1,blending:W});x.uniforms.uTime.value=c*.16,this.group.add(new S(u,x)),this.busMats.push(x)}const v=pe[0],g=Te(v.title,v.neonColor,()=>Me(v));g.position.set(i.x+5,i.y+8,i.z),g.scale.setScalar(1.8),this.group.add(g)}update(e){this.rackMat.uniforms.uTime.value=e,this.floorMat.uniforms.uTime.value=e,this.ringMats.forEach(t=>t.uniforms.uTime.value=e),this.busMats.forEach((t,a)=>t.uniforms.uTime.value=e+a*.16),this.group.traverse(t=>{t.userData.rotating&&(t.rotation.y+=.008,t.rotation.x+=.003)})}setVisible(e){this.rackMat.uniforms.uVisible.value=e,this.floorMat.uniforms.uVisible.value=e,this.ringMats.forEach(t=>t.uniforms.uVisible.value=e),this.busMats.forEach(t=>t.uniforms.uVisible.value=e),this.ppeMat&&(this.ppeMat.opacity=e*.9)}onHover(){}}const f=new h(-75,0,-25);class Io extends me{constructor(){super(...arguments);l(this,"pcbMeshMat");l(this,"pipeMeshMat");l(this,"electrons");l(this,"electronMat");l(this,"ePos");l(this,"tracePaths")}create(e){e.add(this.group);const t=1024,a=1024,r=document.createElement("canvas");r.width=t,r.height=a;const i=r.getContext("2d");i.fillStyle="#051408",i.fillRect(0,0,t,a),i.strokeStyle="#c8a030",i.lineWidth=8;const s=[[40,500,960,500],[40,800,960,800],[40,200,960,200],[300,650,300,500],[300,500,650,500],[650,500,650,650],[200,350,200,650],[600,550,930,550],[600,590,930,590],[600,630,930,630]];for(const[A,U,R,oe]of s)i.shadowColor="#c8a030",i.shadowBlur=6,i.beginPath(),i.moveTo(A,U),i.lineTo(R,oe),i.stroke();i.fillStyle="#d4a820";const d=[[300,650],[200,650],[200,350],[300,500],[650,650],[650,500],[500,500],[500,350],[350,500],[350,650]];for(const[A,U]of d)i.shadowColor="#d4a820",i.shadowBlur=10,i.beginPath(),i.arc(A,U,14,0,Math.PI*2),i.fill(),i.fillStyle="#111",i.beginPath(),i.arc(A,U,7,0,Math.PI*2),i.fill(),i.fillStyle="#d4a820";i.fillStyle="#0d1420",i.fillRect(180,430,145,230),i.strokeStyle="rgba(200,200,255,0.6)",i.lineWidth=2,i.strokeRect(182,432,141,226),i.fillStyle="rgba(200,220,255,0.7)",i.font="bold 22px monospace",i.shadowColor="transparent",i.shadowBlur=0,i.fillText("CPU",230,560),i.fillStyle="#080d1a",i.fillRect(600,500,210,180),i.strokeStyle="rgba(200,200,255,0.6)",i.lineWidth=2,i.strokeRect(602,502,206,176),i.fillStyle="rgba(200,220,255,0.7)",i.font="bold 28px monospace",i.fillText("GPU",660,600),i.fillStyle="#7a5c18";const m=[[480,250],[480,280],[350,250],[350,280],[120,450],[120,470],[120,500],[120,530]];for(const[A,U]of m)i.fillRect(A-12,U-5,24,10),i.strokeStyle="rgba(255,255,255,0.3)",i.lineWidth=1,i.strokeRect(A-12,U-5,24,10);const w=i.createRadialGradient(512,512,200,512,512,600);w.addColorStop(0,"transparent"),w.addColorStop(1,"rgba(0,8,4,0.85)"),i.fillStyle=w,i.fillRect(0,0,t,a);const y=new se(r);this.pcbMeshMat=new I({map:y,transparent:!0});const v=new S(new N(45,45),this.pcbMeshMat);v.rotation.x=-Math.PI/2,v.position.copy(f),v.renderOrder=1,v.frustumCulled=!1,this.group.add(v);const g=1024,c=256,p=document.createElement("canvas");p.width=g,p.height=c;const u=p.getContext("2d");u.fillStyle="#020307",u.fillRect(0,0,g,c);const x=["IF","ID","EX","MEM","WB"],T=["#00d4ff","#5a9aff","#d44dff","#ff8c26","#40ff66"];for(let A=0;A<5;A++){const U=(A+.5)*(g/5),R=U-80,oe=20,Y=160,tt=c-40;if(u.strokeStyle=T[A],u.lineWidth=2,u.shadowColor=T[A],u.shadowBlur=12,u.strokeRect(R,oe,Y,tt),u.fillStyle=T[A]+"20",u.fillRect(R,oe,Y,tt),u.fillStyle=T[A],u.font="bold 36px monospace",u.textAlign="center",u.shadowBlur=16,u.fillText(x[A],U,c/2+12),A<4){const ge=(A+1)*(g/5)-10;u.strokeStyle="rgba(200,200,200,0.5)",u.lineWidth=2,u.shadowBlur=0,u.beginPath(),u.moveTo(ge-10,c/2),u.lineTo(ge+10,c/2),u.moveTo(ge+4,c/2-8),u.lineTo(ge+10,c/2),u.lineTo(ge+4,c/2+8),u.stroke()}}const b=new se(p);this.pipeMeshMat=new I({map:b,transparent:!0,depthWrite:!1,side:z});const C=new S(new N(26,8),this.pipeMeshMat);C.position.set(f.x,f.y+12,f.z),C.rotation.x=-.2,C.frustumCulled=!1,this.group.add(C);const M=new S(new ue(11.2,.9,14),new I({color:658966}));M.position.set(f.x-17,f.y+.45,f.z+1.5),this.group.add(M);const k=new S(new N(9,12),new I({color:399368}));k.rotation.x=-Math.PI/2,k.position.set(f.x-17,f.y+.92,f.z+1.5),this.group.add(k);const F=new S(new ue(14,1.1,11.2),new I({color:395796}));F.position.set(f.x+7,f.y+.55,f.z-2),this.group.add(F);const _=new I({color:13150272});for(let A=0;A<2;A++)for(let U=0;U<14;U++){const R=new S(new ue(.4,.3,.6),_);R.position.set(f.x-22+A*18,f.y+.15,f.z-5+U),this.group.add(R)}const K=new I({color:9136404}),ae=[[-10,-8],[-10,4],[-5,-8],[-5,4],[2,-6],[2,2],[12,-6],[12,2]];for(const[A,U]of ae){const R=new S(new he(.5,.5,.8,8),K);R.position.set(f.x+A,f.y+.4,f.z+U),this.group.add(R)}const Pe=new fe,Ae=new Float32Array(30*3);Pe.setAttribute("position",new $(Ae,3)),this.electronMat=new wt({size:1.2,color:65484,sizeAttenuation:!0,transparent:!0,opacity:1,blending:W}),this.electrons=new Ne(Pe,this.electronMat),this.electrons.frustumCulled=!1,this.group.add(this.electrons),this.ePos=Ae,this.tracePaths=[[[f.x-22,f.z],[f.x+22,f.z]],[[f.x-22,f.z-14],[f.x+22,f.z-14]],[[f.x-22,f.z+14],[f.x+22,f.z+14]],[[f.x-10,f.z-7],[f.x-10,f.z],[f.x+7,f.z],[f.x+7,f.z-7]],[[f.x-12,f.z+7],[f.x-12,f.z-7]],[[f.x+4,f.z-2],[f.x+20,f.z-2]]];const j=pe[1],re=Te(j.title,j.neonColor,()=>Me(j));re.position.set(f.x-14,f.y+6,f.z+16),re.rotation.x=-.4,this.group.add(re)}update(e){let t=0;const a=f.y+.1;for(let r=0;r<this.tracePaths.length&&t<30;r++){const i=this.tracePaths[r],s=i.length-1;for(let d=0;d<5&&t<30;d++,t++){const w=(e*.6+d/5+r*.16)%1*s,y=Math.floor(w),v=w-y,g=Math.min(y,s-1),c=i[g],p=i[Math.min(g+1,s)];this.ePos[t*3+0]=c[0]+(p[0]-c[0])*v,this.ePos[t*3+1]=a,this.ePos[t*3+2]=c[1]+(p[1]-c[1])*v}}this.electrons.geometry.attributes.position.needsUpdate=!0}setVisible(e){this.pcbMeshMat.opacity=e,this.pipeMeshMat.opacity=e,this.electronMat.opacity=e}onHover(){}}const E=new h(-10,10,-80),Lo=`
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
`,No=`
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
`,Uo=`
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
`;function Ge(n,o,e,t){const a=new I({color:8947848}),r=new S(new he(.2,.3,20,8),a);r.position.set(o,e+10,t),n.add(r);for(let s=0;s<4;s++){const d=new S(new he(.08,.08,4-s*.6,6),a);d.rotation.z=Math.PI/2,d.position.set(o,e+4+s*4,t),n.add(d)}const i=new S(new Le(.3,8,8),new I({color:16720384}));i.position.set(o,e+21,t),n.add(i)}class Vo extends me{constructor(){super(...arguments);l(this,"mats",[]);l(this,"rings",[])}create(e){e.add(this.group),Ge(this.group,E.x-20,E.y-4,E.z),Ge(this.group,E.x+15,E.y-4,E.z-10),Ge(this.group,E.x+5,E.y-4,E.z+20);for(let w=0;w<4;w++){const y=new Nt(6+w*7,6.4+w*7,48),v=new L({vertexShader:No,fragmentShader:Fo,uniforms:{uTime:{value:0},uScale:{value:w},uVisible:{value:0}},transparent:!0,depthWrite:!1,side:z,blending:W}),g=new S(y,v);g.rotation.x=-Math.PI/2,g.position.set(E.x-20,E.y+6,E.z),this.group.add(g),this.rings.push({mesh:g,mat:v,delay:w*.4}),this.mats.push(v)}const t=new Xe([new h(E.x-20,E.y+8,E.z),new h(E.x-5,E.y+12,E.z-5),new h(E.x+18,E.y+6,E.z+5)]),a=new gt(t,60,.15,6,!1),r=new L({vertexShader:"varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",fragmentShader:Lo,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0,depthWrite:!1,blending:W});this.group.add(new S(a,r)),this.mats.push(r);const i=new L({vertexShader:"varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",fragmentShader:Uo,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0}),s=new S(new N(28,14),i);s.position.set(E.x+18,E.y+8,E.z+5),s.rotation.y=-.6,this.group.add(s),this.mats.push(i);const d=pe[2],m=Te(d.title,d.neonColor,()=>Me(d));m.position.set(E.x-20,E.y+24,E.z),m.scale.setScalar(1.8),this.group.add(m)}update(e){for(const t of this.mats)t.uniforms.uTime.value=e}setVisible(e){for(const t of this.mats)t.uniforms.uVisible.value=e}onHover(){}}const V=new h(95,40,-90),Oo=`
attribute float aEdgePhase;
varying float vEdgePhase;
varying float vT;        // 0=start vertex, 1=end vertex (from position along segment)
void main() {
  vEdgePhase = aEdgePhase;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,zo=`
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
}`,Go="varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",_o=`
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
`,Se=class Se extends me{constructor(){super(...arguments);l(this,"coreNodes");l(this,"glowNodes");l(this,"coreMat");l(this,"glowMat");l(this,"activations",new Float32Array(40));l(this,"nodePositions",[]);l(this,"anomalyNode",-1);l(this,"edgeMat");l(this,"floorMat");l(this,"logTexture");l(this,"logCanvas");l(this,"logCtx");l(this,"logLines",[]);l(this,"logTimer",0);l(this,"anomalyTimer",0)}create(e){e.add(this.group);const t=new L({vertexShader:Go,fragmentShader:_o,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0,depthWrite:!1,side:z}),a=new S(new N(90,90),t);a.rotation.x=-Math.PI/2,a.position.set(V.x,V.y-18,V.z),this.group.add(a),this.floorMat=t;const r=5,i=8;for(let M=0;M<r;M++)for(let k=0;k<i;k++){const F=M*i+k;this.activations[F]=Math.random(),this.nodePositions.push(new h(V.x+(M-2)*12,V.y+(k-i/2+.5)*8,V.z))}const s=new Le(1.4,10,8);this.coreMat=new I({vertexColors:!0,transparent:!0,opacity:0}),this.coreNodes=new ne(s,this.coreMat,40),this.coreNodes.frustumCulled=!1,this.group.add(this.coreNodes);const d=new Le(3.2,8,6);this.glowMat=new I({vertexColors:!0,transparent:!0,opacity:0,blending:W,depthWrite:!1}),this.glowNodes=new ne(d,this.glowMat,40),this.glowNodes.frustumCulled=!1,this.group.add(this.glowNodes);const m=[],w=[];for(let M=0;M<r-1;M++)for(let k=0;k<i;k++)for(let F=0;F<i;F++){if(Math.random()>.3)continue;const _=this.nodePositions[M*i+k],K=this.nodePositions[(M+1)*i+F];m.push(_.x,_.y,_.z,K.x,K.y,K.z);const ae=Math.random();w.push(ae,ae)}const y=new fe;y.setAttribute("position",new $(new Float32Array(m),3)),y.setAttribute("aEdgePhase",new $(new Float32Array(w),1)),this.edgeMat=new L({vertexShader:Oo,fragmentShader:zo,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0,depthWrite:!1,blending:W});const v=new yt(y,this.edgeMat);v.frustumCulled=!1,this.group.add(v);const g=document.createElement("canvas");g.width=512,g.height=128;const c=g.getContext("2d");c.clearRect(0,0,512,128),c.font="bold 36px monospace",c.textAlign="center",c.shadowColor="#b000ff",c.shadowBlur=28,c.fillStyle="#ffffff",c.fillText("ORIS AI",256,52),c.shadowBlur=10,c.font="16px monospace",c.fillStyle="#b000ff",c.fillText("5-LAYER ANOMALY DETECTION NETWORK",256,86),c.shadowBlur=6,c.font="11px monospace",c.fillStyle="#7040ff88",c.fillText("40 NODES  ·  5 LAYERS  ·  GEMINI 2.0 BACKEND",256,112);const p=new se(g),u=new S(new N(28,7),new I({map:p,transparent:!0,depthWrite:!1,side:z,alphaTest:.02}));u.position.set(V.x,V.y+30,V.z),u.frustumCulled=!1,u.onBeforeRender=(M,k,F)=>u.quaternion.copy(F.quaternion),this.group.add(u);const x=pe[4],T=Te(x.title,x.neonColor,()=>Me(x));T.position.set(V.x+20,V.y+20,V.z),T.scale.setScalar(2),this.group.add(T),this.logCanvas=document.createElement("canvas"),this.logCanvas.width=512,this.logCanvas.height=320,this.logCtx=this.logCanvas.getContext("2d"),this.logTexture=new se(this.logCanvas),this.drawLog();const b=new I({map:this.logTexture,transparent:!0,depthWrite:!1,side:z}),C=new S(new N(16,10),b);C.position.set(V.x+16,V.y-2,V.z+4),C.rotation.y=-.5,this.group.add(C)}drawLog(){const e=this.logCtx,t=512,a=320;e.clearRect(0,0,t,a),e.fillStyle="rgba(4, 0, 18, 0.92)",e.fillRect(0,0,t,a);for(let i=0;i<a;i+=3)e.fillStyle="rgba(0,0,0,0.18)",e.fillRect(0,i,t,1);e.font="12px monospace";const r=this.logLines.slice(-20);for(let i=0;i<r.length;i++){const s=r[i];e.fillStyle=s.startsWith("ERROR")?"#ff4455":s.startsWith("WARN")?"#ffaa22":"#22ee88",e.shadowColor=e.fillStyle,e.shadowBlur=4,e.fillText(s,10,18+i*15)}e.fillStyle="#b000ff",e.shadowColor="#b000ff",e.shadowBlur=8,e.fillText("▋",10,18+r.length*15),this.logTexture.needsUpdate=!0}update(e){this.edgeMat.uniforms.uTime.value=e,this.floorMat.uniforms.uTime.value=e;const t=new Ft;for(let a=0;a<40;a++){const r=this.activations[a],i=.85+.15*Math.sin(e*2+a*.73),s=a===this.anomalyNode?1:0,d=(.8+r*.7)*i*(1+s*1);t.position.copy(this.nodePositions[a]),t.scale.setScalar(d),t.updateMatrix(),this.coreNodes.setMatrixAt(a,t.matrix),t.scale.setScalar(d*2.2),t.updateMatrix(),this.glowNodes.setMatrixAt(a,t.matrix);const m=s>0?Math.sin(e*3)>0?0:.33:.75+r*.12,w=new P().setHSL(m,1,.55+r*.3);this.coreNodes.setColorAt(a,w),this.glowNodes.setColorAt(a,w)}this.coreNodes.instanceMatrix.needsUpdate=!0,this.coreNodes.instanceColor.needsUpdate=!0,this.glowNodes.instanceMatrix.needsUpdate=!0,this.glowNodes.instanceColor.needsUpdate=!0,this.logTimer+=1/60,this.logTimer>.75&&(this.logTimer=0,this.logLines.push(Se.LOG_POOL[Math.floor(Math.random()*Se.LOG_POOL.length)]),this.drawLog()),this.anomalyTimer+=1/60,this.anomalyNode===-1&&this.anomalyTimer>5?(this.anomalyTimer=0,this.anomalyNode=Math.floor(Math.random()*40),this.logLines.push(`ERROR anomaly on node_${this.anomalyNode}`),this.drawLog()):this.anomalyNode!==-1&&this.anomalyTimer>2.5&&(this.anomalyTimer=0,this.logLines.push(`INFO  node_${this.anomalyNode} resolved ✓`),this.drawLog(),this.anomalyNode=-1)}setVisible(e){this.coreMat.opacity=e,this.glowMat.opacity=e*.3,this.edgeMat.uniforms.uVisible.value=e,this.floorMat.uniforms.uVisible.value=e,this.group.traverse(t=>{const a=t.material;(a==null?void 0:a.map)===this.logTexture&&(a.opacity=e)})}onHover(){}};l(Se,"LOG_POOL",["INFO  processing log batch #4821","INFO  PII masking: email→[REDACTED]","WARN  anomaly score: 0.82 (thresh 0.75)","ERROR latency spike: 3.2s on node_07","INFO  filing GitHub PR #89 auto-patch","INFO  LLM class: INCIDENT_RESOLVED","INFO  alert: slack #oncall notified","INFO  MTTR: 16s — system healed","INFO  model confidence: 0.96","WARN  CPU spike 94% → gpu-04 offload"]);let Ye=Se;const H=new h(100,22,-10),Do=`
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
`,Ko="varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",Yo=`
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
`,_e=[[0,28],[16,18],[22,-6],[11,-22],[-11,-22],[-22,-6],[-16,18],[0,6],[8,-8],[-8,-8]];class Zo extends me{constructor(){super(...arguments);l(this,"nodeMat");l(this,"lineMat");l(this,"attackMat");l(this,"shieldMats",[]);l(this,"gridMat");l(this,"nodeStates");l(this,"nodeAttr");l(this,"attackTimer",3);l(this,"attackActive",!1);l(this,"attackWave",1);l(this,"infectedNode",-1)}create(e){e.add(this.group),this.gridMat=new L({vertexShader:Ko,fragmentShader:Yo,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0,depthWrite:!1,side:z});const t=new S(new N(80,80),this.gridMat);t.rotation.x=-Math.PI/2,t.position.set(H.x,H.y-6,H.z),this.group.add(t);const a=_e.length,r=new Float32Array(a*3);this.nodeStates=new Float32Array(a);const i=new Float32Array(a);_e.forEach(([g,c],p)=>{r[p*3]=H.x+g,r[p*3+1]=H.y-2,r[p*3+2]=H.z+c,i[p]=Math.random()*Math.PI*2});const s=new fe;s.setAttribute("position",new $(r,3)),this.nodeAttr=new $(this.nodeStates,1),s.setAttribute("aState",this.nodeAttr),s.setAttribute("aPhase",new $(i,1)),this.nodeMat=new L({vertexShader:Do,fragmentShader:Wo,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0,depthWrite:!1,blending:W}),this.group.add(new Ne(s,this.nodeMat));const d=[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,0],[7,0],[7,1],[7,6],[8,2],[8,3],[8,7],[9,4],[9,5],[9,7]],m=[],w=[];d.forEach(([g,c])=>{const p=g*3,u=c*3;m.push(r[p],r[p+1],r[p+2]),m.push(r[u],r[u+1],r[u+2]);const x=Math.random();w.push(x,x)});const y=new fe;y.setAttribute("position",new $(new Float32Array(m),3)),y.setAttribute("aLinePhase",new $(new Float32Array(w),1)),this.lineMat=new L({vertexShader:Bo,fragmentShader:Ho,uniforms:{uTime:{value:0},uVisible:{value:0}},transparent:!0,depthWrite:!1,blending:W}),this.group.add(new yt(y,this.lineMat)),this.attackMat=new L({vertexShader:$o,fragmentShader:jo,uniforms:{uTime:{value:0},uVisible:{value:0},uWave:{value:1},uOrigin:{value:new le(.5,.5)}},transparent:!0,depthWrite:!1,blending:W,side:z});const v=new S(new N(80,80),this.attackMat);v.rotation.x=-Math.PI/2,v.position.set(H.x,H.y-5.5,H.z),this.group.add(v);for(let g=0;g<4;g++){const c=(g+1)*9,p=new L({vertexShader:Xo,fragmentShader:qo,uniforms:{uTime:{value:0},uVisible:{value:0},uLayer:{value:g}},transparent:!0,depthWrite:!1,blending:W,side:z}),u=new S(new N(c*2,c*2),p);u.rotation.x=-Math.PI/2,u.position.set(H.x,H.y-5+g*.3,H.z),this.group.add(u),this.shieldMats.push(p)}}update(e){if(this.nodeMat.uniforms.uTime.value=e,this.lineMat.uniforms.uTime.value=e,this.attackMat.uniforms.uTime.value=e,this.gridMat.uniforms.uTime.value=e,this.shieldMats.forEach(t=>t.uniforms.uTime.value=e),this.attackTimer-=1/60,!this.attackActive&&this.attackTimer<=0){this.infectedNode=Math.floor(Math.random()*7),this.nodeStates[this.infectedNode]=1,this.nodeAttr.needsUpdate=!0,this.attackWave=0,this.attackActive=!0;const[t,a]=_e[this.infectedNode];this.attackMat.uniforms.uOrigin.value.set(.5+t/60,.5+a/60)}this.attackActive&&(this.attackWave+=.003,this.attackMat.uniforms.uWave.value=this.attackWave,this.attackWave>.45&&this.infectedNode>=0&&this.nodeStates[this.infectedNode]===1&&(this.nodeStates[this.infectedNode]=2,this.nodeAttr.needsUpdate=!0),this.attackWave>=.9&&(this.infectedNode>=0&&(this.nodeStates[this.infectedNode]=0,this.nodeAttr.needsUpdate=!0,this.infectedNode=-1),this.attackActive=!1,this.attackTimer=5+Math.random()*3))}setVisible(e){this.nodeMat.uniforms.uVisible.value=e,this.lineMat.uniforms.uVisible.value=e,this.attackMat.uniforms.uVisible.value=e,this.gridMat.uniforms.uVisible.value=e,this.shieldMats.forEach(t=>t.uniforms.uVisible.value=e)}onHover(){}}class Jo extends me{constructor(e,t){super();l(this,"projIdx");l(this,"panelPos");l(this,"panelMat");l(this,"particles");l(this,"particleMat");this.projIdx=e,this.panelPos=t}create(e){e.add(this.group);const t=pe[this.projIdx],a=1024,r=512,i=document.createElement("canvas");i.width=a,i.height=r;const s=i.getContext("2d"),d=t.neonColor;s.clearRect(0,0,a,r),s.strokeStyle=d+"aa",s.lineWidth=2,s.beginPath(),s.moveTo(0,2),s.lineTo(a,2),s.stroke(),s.beginPath(),s.moveTo(0,r-2),s.lineTo(a,r-2),s.stroke(),s.font="13px monospace",s.fillStyle=d+"99",s.textAlign="left",s.shadowColor=d,s.shadowBlur=8,s.fillText(`DISTRICT_${String(this.projIdx+2).padStart(2,"0")}  ·  ${t.district}`,32,40),s.font="bold 80px monospace",s.fillStyle="#ffffff",s.shadowColor=d,s.shadowBlur=40,s.fillText(t.title,32,130),s.shadowBlur=20,s.fillStyle=d,s.fillText(t.title,32,130),s.font="22px monospace",s.fillStyle="#ffffffbb",s.shadowBlur=8,s.fillText(t.subtitle,32,172),s.font="16px monospace",s.shadowBlur=0;let m=32;for(const b of t.tags.slice(0,5)){s.fillStyle=d+"cc",s.strokeStyle=d+"66",s.lineWidth=1;const C=s.measureText(b).width;s.strokeRect(m,196,C+16,28),s.fillText(b,m+8,215),m+=C+28}s.font="17px monospace",s.fillStyle="#cce0ff",s.shadowBlur=0;const w=t.desc.split(" ");let y="",v=268;for(const b of w){const C=y+b+" ";s.measureText(C).width>a-64&&y?(s.fillText(y,32,v),v+=28,y=b+" "):y=C}y&&s.fillText(y.trim(),32,v),s.font="13px monospace",s.fillStyle=d+"88",s.shadowColor=d,s.shadowBlur=6,s.fillText("▶  CLICK LABEL FOR FULL DETAILS",32,r-18);const g=new se(i);this.panelMat=new I({map:g,transparent:!0,depthWrite:!1,side:z,alphaTest:.02});const c=new S(new N(36,18),this.panelMat);c.position.copy(this.panelPos),c.frustumCulled=!1,c.onBeforeRender=(b,C,M)=>c.quaternion.copy(M.quaternion),this.group.add(c);const p=80,u=new Float32Array(p*3);for(let b=0;b<p;b++)u[b*3]=this.panelPos.x+(Math.random()-.5)*50,u[b*3+1]=this.panelPos.y+(Math.random()-.5)*30,u[b*3+2]=this.panelPos.z+(Math.random()-.5)*50;const x=new fe;x.setAttribute("position",new $(u,3)),this.particleMat=new wt({size:.5,color:new P(d),transparent:!0,opacity:0,blending:W,sizeAttenuation:!0}),this.particles=new Ne(x,this.particleMat),this.particles.frustumCulled=!1,this.group.add(this.particles);const T=Te(t.title,t.neonColor,()=>Me(t));T.position.set(this.panelPos.x,this.panelPos.y-12,this.panelPos.z),T.scale.setScalar(2),this.group.add(T)}update(e){}setVisible(e){this.panelMat&&(this.panelMat.opacity=e),this.particleMat&&(this.particleMat.opacity=e*.7)}onHover(){}}const Qo=new Set([2,3]);class ei{constructor(o,e){l(this,"envs",new Map);l(this,"activeEnv",null);l(this,"activeIdx",-1);l(this,"cityGroup");l(this,"cityVisible",!0);this.cityGroup=e;const t=[[2,new Ro],[3,new Io],[4,new Vo],[6,new Ye],[7,new Zo]];for(const[r,i]of t)i.create(o),i.group.visible=!1,this.envs.set(r,i);const a=[[5,3,new h(40,25,-110)],[8,6,new h(70,14,50)],[9,7,new h(20,12,80)],[10,8,new h(-20,16,70)],[11,9,new h(-10,40,40)]];for(const[r,i,s]of a){const d=new Jo(i,s);d.create(o),d.group.visible=!1,this.envs.set(r,d)}}onSection(o){if(o===this.activeIdx)return;this.activeIdx=o,this.activeEnv&&(this.activeEnv.exit(),this.activeEnv=null);const e=Qo.has(o);e&&this.cityVisible?(this.cityVisible=!1,this.cityGroup.visible=!1):!e&&!this.cityVisible&&(this.cityVisible=!0,this.cityGroup.visible=!0);const t=this.envs.get(o);t&&(this.activeEnv=t,t.enter())}update(o){this.activeEnv&&this.activeEnv.update(o)}}const ti=document.getElementById("scene-canvas"),ve=new Ut({canvas:ti,antialias:!0,alpha:!1,powerPreference:"high-performance"});ve.setPixelRatio(Math.min(devicePixelRatio,2));ve.setSize(innerWidth,innerHeight);ve.toneMapping=Vt;ve.toneMappingExposure=.95;const G=new Ot;G.background=new P(131602);G.fog=new zt(197400,.003);const te=new Gt(60,innerWidth/innerHeight,.5,1200),Fe=new So;Fe.setup(ve,G,te);const Ze=new vo;Ze.create(G);const ee=new fo;ee.generate(G);ee.addAntennas(G);const oi=pe.map((n,o)=>{const e=X[o+2];return{text:n.district,pos:new h(e.pos.x+12,80,e.pos.z-18),color:n.neonColor}});ee.addNeonSigns(G,oi);const St=new yo;St.create(G);const Je=new po;Je.create(G);const Ct=new mo;Ct.create(G);const ii=new _t(128,0,.4);G.add(ii);const Qe=new vt;G.add(Qe);var ft,pt;(pt=(ft=ee.cityGroup)==null?void 0:ft.children)==null||pt.forEach(n=>Qe.add(n));const Mt=new ei(G,Qe),Ie=new P(62975);function ni(n){const o=Math.min(n,Ce.length-1);Ie.copy(Ce[o]),Je.setDistrictNeon(Ie),Ze.update(0,te.position,Ie)}const si=[["NEON DISTRICT","A cyberpunk portfolio"],["ABOUT","Who is behind this"],["PS3 CELL GPU","PS3 SPU emulator in WebGL"],["CPUonGPU","x86 CPU running on GPU"],["GPU STREAMING","Sub-frame game streaming"],["SELKIES RUST","WebRTC stack rebuilt in Rust"],["ORIS AI","Autonomous SRE agent"],["VAJRAGRID","AI power grid security"],["VIDYAMITRA","Adaptive JEE AI tutor"],["NETFLIP","HLS streaming platform"],["ARENA OJ","Online judge platform"],["HACKATHON","Competition highlights"],["TECH STACK","Tools and languages"],["CONTACT","Get in touch"]],de=document.createElement("div");de.id="section-banner";Object.assign(de.style,{position:"fixed",bottom:"24px",left:"50%",transform:"translateX(-50%)",textAlign:"center",pointerEvents:"none",zIndex:"50",opacity:"0",transition:"opacity 0.4s",background:"rgba(0,0,8,0.65)",padding:"10px 28px",borderTop:"1px solid currentColor"});document.body.appendChild(de);function ai(n){const[o,e]=si[n]??["",""],t=Ce[n]?"#"+Ce[n].getHexString():"#00f5ff";de.style.color=t,de.innerHTML=`
    <div style="font-family:monospace;font-size:8px;letter-spacing:4px;color:${t};margin-bottom:4px;text-transform:uppercase;opacity:0.7">
      DISTRICT_${String(n).padStart(2,"0")}
    </div>
    <div style="font-family:monospace;font-size:1.1rem;font-weight:900;color:#fff;
                text-shadow:0 0 20px ${t},0 0 40px ${t}88;letter-spacing:0.08em;line-height:1.1">
      ${o}
    </div>
    <div style="font-family:monospace;font-size:0.75rem;color:${t};
                letter-spacing:0.15em;margin-top:4px;opacity:0.85">
      ${e}
    </div>
  `,de.style.opacity="1"}const et=new Mo(te);et.onSectionChange=n=>{li(n),ci(n),ni(n),Fe.triggerGlitch(),Mt.onSection(n),ai(n)};const ri=document.getElementById("nav-dots");X.forEach((n,o)=>{const e=document.createElement("div");e.className="nav-dot"+(o===0?" active":""),e.title=n.label,e.addEventListener("click",()=>et.goTo(o)),ri.appendChild(e)});function li(n){document.querySelectorAll(".sect").forEach((o,e)=>{o.classList.toggle("active",e===n)}),document.querySelectorAll(".nav-dot").forEach((o,e)=>{o.classList.toggle("active",e===n)})}function ci(n){const o=document.getElementById("hud-section");o&&(o.textContent=`DISTRICT_${String(n).padStart(2,"0")} / ${X[n].label}`)}const lt=document.getElementById("skills-grid");lt&&Object.entries(To).forEach(([n,o])=>{const e=document.createElement("div");e.className="skill-cat",e.innerHTML=`<div class="skill-cat-name">// ${n}</div>`+o.map(t=>`<div class="skill-item">${t}</div>`).join(""),lt.appendChild(e)});const J=document.getElementById("contact-input"),Re=document.getElementById("contact-input-display");var mt;(mt=document.getElementById("sect-13"))==null||mt.addEventListener("click",()=>J==null?void 0:J.focus());J==null||J.addEventListener("input",()=>{Re&&(Re.textContent=(J.value||"")+"_"),J.value.trim().toLowerCase()==="sudo"&&(ui(),J.value="",Re&&(Re.textContent="_"))});function ui(){const n=document.querySelector("#sect-13 .terminal-body");if(!n)return;const o=document.createElement("p");o.className="output neon-green",o.textContent="> Permission granted. Downloading your future...",n.appendChild(o),setTimeout(()=>{const e=document.createElement("p");e.className="output",e.innerHTML='<span style="color:#ffe642">root@neon-district:~# ██████████ 100%  COMPLETE</span>',n.appendChild(e)},1500)}const ct=["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];let ye=0;window.addEventListener("keydown",n=>{n.key===ct[ye]?ye++:ye=0,ye===ct.length&&(ye=0,di())});let De=!1;function di(){De=!De,[ee.meshA,ee.meshB,ee.meshC].forEach(n=>{const o=n.material;o.wireframe=De})}const We=document.getElementById("boot-log"),ut=document.getElementById("boot-bar"),be=document.getElementById("loading-screen"),Be=["Initializing WebGPU context","Generating city geometry","Compiling 47 shader programs","Spawning rain particles","Calibrating post-processing chain","System ready"];async function hi(){for(let n=0;n<Be.length;n++){await new Promise(e=>setTimeout(e,260+Math.random()*200));const o=document.createElement("p");o.innerHTML=`<span style="color:rgba(0,245,255,.5)">[BOOT]</span> ${Be[n]}... <span class="ok">[OK]</span>`,We==null||We.appendChild(o),ut&&(ut.style.width=(n+1)/Be.length*100+"%")}await new Promise(n=>setTimeout(n,600)),be==null||be.classList.add("fade-out"),setTimeout(()=>{be&&(be.style.display="none")},850)}hi();const dt=new Dt,He=new le;window.addEventListener("click",n=>{if(n.target.closest("#env-detail-panel"))return;He.x=n.clientX/innerWidth*2-1,He.y=-(n.clientY/innerHeight)*2+1,dt.setFromCamera(He,te);const o=dt.intersectObjects(G.children,!0);for(const e of o){const t=e.object;if(t.userData.isLabel&&t.userData.onClick){n.stopPropagation(),t.userData.onClick();return}}xt()});window.addEventListener("resize",()=>{te.aspect=innerWidth/innerHeight,te.updateProjectionMatrix(),ve.setSize(innerWidth,innerHeight),Fe.resize(innerWidth,innerHeight)});const ht=new Wt;function Tt(){requestAnimationFrame(Tt);const n=ht.getElapsedTime(),o=ht.getDelta();ee.update(n),Je.update(n),Ct.update(n,te.position),St.update(n),Ze.update(n,te.position,Ie),et.update(o),Mt.update(n),Fe.render()}Tt();
