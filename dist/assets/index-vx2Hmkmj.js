var ut=Object.defineProperty;var ht=(n,e,o)=>e in n?ut(n,e,{enumerable:!0,configurable:!0,writable:!0,value:o}):n[e]=o;var v=(n,e,o)=>ht(n,typeof e!="symbol"?e+"":e,o);import{i as T,d as We,I as oe,q as te,s as ue,a2 as d,j as Ae,u as Y,a as Z,Q as he,C as Fe,m as Ce,x as pe,t as ve,X as ge,f as nt,e as Pe,y as st,Y as ft,B as pt,E as mt,a1 as fe,_ as vt,g as qe,G as Oe,p as gt,z as wt,a5 as bt,A as yt,W as St,o as Ct,P as Pt,H as Tt,S as xt,h as At}from"./three-uBnUpQ-C.js";import{b as Mt,R as Et,a as kt,B as Me,C as It,V as Lt,N as Rt,S as Nt,G as Dt,c as Ee,E as Wt}from"./postprocessing-DQ1XEIde.js";import{g as ie}from"./gsap-SFc2wnMY.js";(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const t of document.querySelectorAll('link[rel="modulepreload"]'))i(t);new MutationObserver(t=>{for(const a of t)if(a.type==="childList")for(const c of a.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&i(c)}).observe(document,{childList:!0,subtree:!0});function o(t){const a={};return t.integrity&&(a.integrity=t.integrity),t.referrerPolicy&&(a.referrerPolicy=t.referrerPolicy),t.crossOrigin==="use-credentials"?a.credentials="include":t.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function i(t){if(t.ep)return;t.ep=!0;const a=o(t);fetch(t.href,a)}})();function Xe(n){return n*n*n*(n*(n*6-15)+10)}function ke(n,e,o){return n+o*(e-n)}function be(n,e,o){const i=n&3,t=i<2?e:o,a=i<2?o:e;return(n&1?-t:t)+(n&2?-a:a)}const B=Array.from({length:512},(n,e)=>e).sort(()=>Math.random()-.5);for(let n=0;n<256;n++)B[n+256]=B[n];function Ft(n,e){const o=Math.floor(n)&255,i=Math.floor(e)&255,t=n-Math.floor(n),a=e-Math.floor(e),c=Xe(t),r=Xe(a),S=B[B[o]+i],M=B[B[o]+i+1],b=B[B[o+1]+i],m=B[B[o+1]+i+1];return ke(ke(be(S,t,a),be(b,t-1,a),c),ke(be(M,t,a-1),be(m,t-1,a-1),c),r)}function ye(n,e,o=4,i=2,t=.5){let a=0,c=.5,r=1;for(let S=0;S<o;S++)a+=Ft(n*r,e*r)*c,r*=i,c*=t;return a}function A(n,e){return n+Math.random()*(e-n)}function se(n,e){return Math.floor(A(n,e+1))}const Gt=`
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
`,Ut=`
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
  return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453);
}

void main() {
  // ── WALL BASE ──────────────────────────────────────────────
  vec3 color = vec3(0.006, 0.006, 0.010);

  // ── WINDOW GRID ────────────────────────────────────────────
  float density = mix(10.0, 32.0, clamp(vHeight/250.0,0.0,1.0));
  vec2 wScale = vec2(density*0.52, density);
  vec2 wCell  = floor(vUv * wScale);
  vec2 wFrac  = fract(vUv * wScale);

  // Window frame (inset from cell edges)
  float frame = step(0.12,wFrac.x)*step(0.10,wFrac.y)*
                step(wFrac.x,0.88)*step(wFrac.y,0.86);

  // Per-window random: on/off + color
  float wh = hash(wCell + floor(vWorldPos.xz * 0.008));
  float flicker = step(0.03, fract(sin(uTime*(hash(wCell+vec2(0.7,0.3))*4.0+0.5)+wh*100.0)*0.5+0.5));
  float isOn = step(0.28, wh) * flicker;

  vec3 wColor;
  if      (wh < 0.28) wColor = vec3(0.0);
  else if (wh < 0.52) wColor = vec3(1.0, 0.82, 0.40) * 2.2;   // warm amber
  else if (wh < 0.70) wColor = vec3(0.38, 0.62, 1.0) * 2.0;   // cool blue
  else if (wh < 0.84) wColor = vNeonColor * 3.0;               // district neon
  else                wColor = vec3(0.9, 0.28, 1.0) * 2.5;     // purple

  color += frame * isOn * wColor;

  // ── FLOOR LEDGES (thin dark horizontal lines) ───────────────
  float floorLines = 1.0 - smoothstep(0.0, 0.018, fract(vUv.y * density));
  color -= floorLines * 0.004;

  // ── NEON GLOWING BANDS ─────────────────────────────────────
  vec2 bSeed = floor(vWorldPos.xz * 0.012);
  float b1pos = hash(bSeed + vec2(3.1, 7.4));
  float b2pos = hash(bSeed + vec2(8.3, 2.1));
  float bWidth = 0.006;
  float band1 = smoothstep(bWidth,0.0,abs(vUv.y - b1pos)) * 3.5;
  float band2 = smoothstep(bWidth,0.0,abs(vUv.y - b2pos)) * 3.5;
  vec3 bColor1 = vNeonColor;
  vec3 bColor2 = hash(bSeed + vec2(5.5, 1.2)) > 0.5
    ? vec3(1.0, 0.08, 0.52)   // magenta
    : vec3(0.05, 0.85, 1.0);  // cyan
  float bPulse1 = 0.65 + 0.35*sin(uTime*0.9 + hash(bSeed)*12.0);
  float bPulse2 = 0.65 + 0.35*sin(uTime*1.1 + hash(bSeed+vec2(1.0))*12.0);
  color += band1 * bColor1 * bPulse1;
  color += band2 * bColor2 * bPulse2;

  // ── VERTICAL EDGE STRIPS ────────────────────────────────────
  float edgeGlow = (1.0 - smoothstep(0.0, 0.018, vUv.x)) +
                   (1.0 - smoothstep(0.0, 0.018, 1.0-vUv.x));
  float ePulse = 0.5 + 0.5*sin(uTime*0.6 + hash(floor(vWorldPos.xz*0.01))*20.0);
  color += edgeGlow * vNeonColor * ePulse * 1.8;

  // ── ROOFTOP CAP ─────────────────────────────────────────────
  float roofLine = smoothstep(0.97, 1.0, vUv.y);
  color += roofLine * vNeonColor * 4.0;
  float equip = step(0.985, vUv.y) * step(0.3, hash(floor(vUv*vec2(8.0,1.0)+floor(vWorldPos.xz*0.01))));
  color += equip * vNeonColor * 2.0;

  // ── FRESNEL / EDGE GLOW ─────────────────────────────────────
  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  float fresnel = pow(1.0 - max(dot(vNormal,viewDir),0.0), 3.5);
  color += vNeonColor * fresnel * 1.2;

  // ── CLOSE-UP CONCRETE DETAIL ────────────────────────────────
  float camDist = length(vWorldPos - cameraPosition);
  float closeBlend = 1.0 - smoothstep(8.0, 35.0, camDist);
  vec2 grainUV = floor(vUv * vec2(80.0, 160.0));
  float grain = hash(grainUV + floor(vWorldPos.xz * 0.02));
  color += (grain - 0.5) * closeBlend * 0.025;

  // ── FOG ─────────────────────────────────────────────────────
  float dist = length(vWorldPos - cameraPosition);
  float fog = clamp((dist - uFogNear)/(uFogFar - uFogNear), 0.0, 1.0);
  color = mix(color, uFogColor, fog * 0.78);

  gl_FragColor = vec4(color, 1.0);
}
`,Ot=`
varying vec2 vUv;
varying vec3 vWorldPos;
varying vec3 vNormal;
void main() {
  vUv = uv;
  vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,zt=`
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
`,Ht=`
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
`,_t=`
varying float vAlpha;
void main() {
  gl_FragColor = vec4(0.55, 0.75, 1.0, vAlpha * 0.35);
}
`,Bt=`
varying vec3 vLocalPos;
void main() {
  vLocalPos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,Vt=`
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
`,qt=`
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
`,Xt=`
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
`,L=32,q=16,jt=6,X=q+jt,K=L/2*X,Ie={color:new T(197400),near:100,far:500},me=[new T(62975),new T(62975),new T(16711850),new T(16711850),new T(16739098),new T(8073215),new T(8073215),new T(65416),new T(65416),new T(16770626)];function Yt(){return new ge({vertexShader:Gt,fragmentShader:Ut,uniforms:{uTime:{value:0},uFogColor:{value:Ie.color},uFogNear:{value:Ie.near},uFogFar:{value:Ie.far}}})}function $t(n,e){const o=n/L,i=e/L;return o<.35&&i<.35?0:o<.65&&i<.35?1:o>=.65&&i<.35?2:o<.35&&i<.65?3:o>=.65&&i<.65?4:o<.35&&i>=.65?5:o<.65&&i>=.65?6:o>=.65&&i>=.65?7:i>.45&&i<.55?8:9}class Kt{constructor(){v(this,"sectionLow");v(this,"sectionMid");v(this,"sectionTop");v(this,"meshD");v(this,"mats",[])}generate(e){const o=L*L,i=Yt();this.mats.push(i);const t=()=>{const l=new We(1,1,1),f=new Float32Array(o),g=new Float32Array(o*3);l.setAttribute("aHeight",new oe(f,1)),l.setAttribute("aNeonColor",new oe(g,3));const h=new te(l,i.clone(),o);return h.frustumCulled=!1,{geo:l,heights:f,colors:g,mesh:h}},a=t(),c=t(),r=t();this.sectionLow=a.mesh,this.sectionMid=c.mesh,this.sectionTop=r.mesh;for(const l of[a.mesh,c.mesh,r.mesh])this.mats.push(l.material);const S=new We(1,1,1),M=new Float32Array(o),b=new Float32Array(o*3);S.setAttribute("aHeight",new oe(M,1)),S.setAttribute("aNeonColor",new oe(b,3)),this.meshD=new te(S,i.clone(),o),this.meshD.frustumCulled=!1,this.mats.push(this.meshD.material);const m=new ue,p=new d,y=new d,C=new he;let E=0,x=0,I=0,k=0;const R=new Ae(1,1,.3,16),W=[],s=[62975,16711850,16739098,8073215,65416,16770626];for(const l of s){const f=new Y({color:l,transparent:!0,opacity:.7,blending:Z,depthWrite:!1}),g=new te(R,f,34);g.frustumCulled=!1,g.count=0,W.push(g)}const u=new Int32Array(s.length);for(let l=0;l<L;l++)for(let f=0;f<L;f++){const g=l*X-K,h=f*X-K;if(l%5===0||f%5===0||l%2===0&&f%2===0&&Math.random()<.25)continue;const w=l/L*4-2,P=f/L*4-2,N=ye(w,P,5),$=Math.sqrt(w*w+P*P)/3,_=Math.max(.18,1-$*.6),F=Math.max(8,(22+N*170)*_)+A(4,28),ee=A(q*.42,q*.9),le=A(q*.42,q*.9),we=$t(l,f),O=me[we],ne=F*.62;if(a.heights[E]=F,a.colors[E*3]=O.r,a.colors[E*3+1]=O.g,a.colors[E*3+2]=O.b,p.set(g,ne/2,h),y.set(ee,ne,le),m.compose(p,C,y),this.sectionLow.setMatrixAt(E,m),E++,F>40){const G=F*.23,H=ee*.68,D=le*.68;c.heights[x]=F,c.colors[x*3]=O.r,c.colors[x*3+1]=O.g,c.colors[x*3+2]=O.b,p.set(g,F*.62+G/2,h),y.set(H,G,D),m.compose(p,C,y),this.sectionMid.setMatrixAt(x,m),x++}if(F>100){const G=F*.15,H=ee*.38,D=le*.38;r.heights[I]=F,r.colors[I*3]=O.r,r.colors[I*3+1]=O.g,r.colors[I*3+2]=O.b,p.set(g,F*.85+G/2,h),y.set(H,G,D),m.compose(p,C,y),this.sectionTop.setMatrixAt(I,m),I++}if(Math.random()>=.95){const G=A(1.5,4),H=A(1.5,4),D=F*1.8;M[k]=D,b[k*3]=O.r,b[k*3+1]=O.g,b[k*3+2]=O.b,p.set(g+A(-2,2),D/2,h+A(-2,2)),y.set(G,D,H),m.compose(p,C,y),this.meshD.setMatrixAt(k,m),k++}if(Math.random()<.15){const G=we%s.length,H=W[G],D=u[G];if(D<34){const Ve=ee*.6;p.set(g,F,h),y.set(Ve,1,Ve),m.compose(p,C,y),H.setMatrixAt(D,m),u[G]++}}}this.sectionLow.count=E,this.sectionMid.count=x,this.sectionTop.count=I,this.meshD.count=k;for(const l of[this.sectionLow,this.sectionMid,this.sectionTop,this.meshD]){l.instanceMatrix.needsUpdate=!0;const f=l.geometry;f.getAttribute("aHeight").needsUpdate=!0,f.getAttribute("aNeonColor").needsUpdate=!0,e.add(l)}for(let l=0;l<W.length;l++)W[l].count=u[l],W[l].instanceMatrix.needsUpdate=!0,e.add(W[l])}addFacadeSigns(e){const c=document.createElement("canvas");c.width=512,c.height=384;const r=c.getContext("2d");r.fillStyle="#000",r.fillRect(0,0,512,384);const S=(s,u,l)=>{const f=s*256,g=u*128;r.save(),r.beginPath(),r.rect(f,g,256,128),r.clip(),l(r,f,g,256,128),r.restore()};S(0,0,(s,u,l,f,g)=>{s.strokeStyle="#00f5ff",s.lineWidth=1.5;for(let h=0;h<6;h++){const w=l+18+h*16;s.beginPath(),s.moveTo(u+10,w),s.lineTo(u+f-10,w),s.stroke()}s.fillStyle="#00f5ff";for(let h=0;h<8;h++)for(let w=0;w<3;w++){const P=u+20+h*28,N=l+26+w*34;s.beginPath(),s.arc(P,N,3,0,Math.PI*2),s.fill(),s.beginPath(),s.arc(P,N,7,0,Math.PI*2),s.stroke()}}),S(1,0,(s,u,l,f,g)=>{s.fillStyle="#ff00aa22",s.fillRect(u,l,f,g),s.fillStyle="#ff00aa44";for(let h=-4;h<14;h+=2){const w=u+h*24;s.beginPath(),s.moveTo(w,l),s.lineTo(w+20,l),s.lineTo(w+20+g,l+g),s.lineTo(w+g,l+g),s.closePath(),s.fill()}s.fillStyle="#ff00aa",s.font="bold 26px monospace",s.textAlign="center",s.fillText("WARNING",u+f/2,l+g/2+9),s.strokeStyle="#ff00aa",s.lineWidth=2,s.strokeRect(u+4,l+4,f-8,g-8)}),S(0,1,(s,u,l,f,g)=>{s.fillStyle="#ff6b1a",s.font="bold 40px serif",s.textAlign="center",["火","電","夜","光"].forEach((w,P)=>s.fillText(w,u+28+P*52,l+82)),s.strokeStyle="#ff6b1a88",s.lineWidth=1.5,s.strokeRect(u+4,l+4,f-8,g-8)}),S(1,1,(s,u,l,f,g)=>{s.strokeStyle="#00ff8844",s.lineWidth=1;for(let h=0;h<=16;h++){const w=u+h*(f/16);s.beginPath(),s.moveTo(w,l),s.lineTo(w,l+g),s.stroke()}for(let h=0;h<=8;h++){const w=l+h*(g/8);s.beginPath(),s.moveTo(u,w),s.lineTo(u+f,w),s.stroke()}s.fillStyle="#00ff88",s.font="10px monospace";for(let h=0;h<8;h++)for(let w=0;w<10;w++)Math.random()>.55&&s.fillText(Math.random()>.5?"1":"0",u+5+w*24,l+14+h*14)}),S(0,2,(s,u,l,f,g)=>{const h=[[.15,.2],[.5,.2],[.85,.2],[.32,.72],[.68,.72]];s.lineWidth=2.5,h.forEach(([w,P])=>{const N=u+w*f,$=l+P*g,_=22;s.fillStyle="#ff224422",s.strokeStyle="#ff2244",s.beginPath(),s.moveTo(N,$-_),s.lineTo(N+_,$+_*.6),s.lineTo(N-_,$+_*.6),s.closePath(),s.fill(),s.stroke(),s.fillStyle="#ff2244",s.font="bold 14px monospace",s.textAlign="center",s.fillText("!",N,$+_*.35)})}),S(1,2,(s,u,l,f,g)=>{const h=u+f/2,w=l+g/2;s.strokeStyle="#9b30ff",s.lineWidth=2;for(let P=10;P<58;P+=14)s.beginPath(),s.arc(h,w,P,0,Math.PI*2),s.stroke();for(let P=0;P<6;P++){const N=P*Math.PI/3;s.beginPath(),s.moveTo(h,w),s.lineTo(h+Math.cos(N)*56,w+Math.sin(N)*56),s.stroke()}s.strokeStyle="#cc44ff",s.lineWidth=1.5,s.strokeRect(u+8,l+8,f-16,g-16)});const M=new Fe(c),b=(s,u)=>{const l=new pe(1,1),f=s*.5,g=(s+1)*.5,h=1-(u+1)/3,w=1-u/3,P=l.getAttribute("uv");return P.setXY(0,f,w),P.setXY(1,g,w),P.setXY(2,f,h),P.setXY(3,g,h),P.needsUpdate=!0,l},m=new Y({map:M,transparent:!0,side:Ce,blending:Z,depthWrite:!1}),p=100,C=[b(0,0),b(1,0),b(0,1)].map(s=>{const u=new te(s,m.clone(),p);return u.frustumCulled=!1,u.count=0,u}),E=[0,0,0],x=new ue,I=new d,k=new he,R=new d,W=new d(0,1,0);for(let s=0;s<p*3;s++){const u=s%3,l=E[u];if(l>=p)continue;const f=se(1,L-2),g=se(1,L-2),h=f*X-K,w=g*X-K,P=f/L*4-2,N=g/L*4-2,$=Math.max(.18,1-Math.sqrt(P*P+N*N)/3*.6),_=Math.max(8,(22+ye(P,N,5)*170)*$)+A(4,28),F=A(q*.42,q*.9),ee=A(q*.42,q*.9),le=A(8,20),we=A(4,10),O=A(4,_*.7),ne=Math.floor(Math.random()*4);let G=h,H=w,D=0;ne===0?(H=w+ee/2+.5,D=0):ne===1?(H=w-ee/2-.5,D=Math.PI):ne===2?(G=h+F/2+.5,D=Math.PI/2):(G=h-F/2-.5,D=-Math.PI/2),I.set(G,O,H),k.setFromAxisAngle(W,D),R.set(le,we,1),x.compose(I,k,R),C[u].setMatrixAt(l,x),E[u]++}for(let s=0;s<3;s++)C[s].count=E[s],C[s].instanceMatrix.needsUpdate=!0,e.add(C[s])}addSearchlights(e){const o=new Ae(.3,2.5,1,6,1,!0),i=[{color:16777215,opacity:.08,count:34},{color:4521983,opacity:.07,count:26},{color:16729258,opacity:.07,count:20}],t=new ue,a=new d,c=new d,r=new he;for(const S of i){const M=new Y({color:S.color,transparent:!0,opacity:S.opacity,side:Ce,blending:Z,depthWrite:!1}),b=new te(o,M,S.count);b.frustumCulled=!1;for(let m=0;m<S.count;m++){const p=se(0,L-1),y=se(0,L-1),C=p*X-K,E=y*X-K,x=p/L*4-2,I=y/L*4-2,k=Math.max(.18,1-Math.sqrt(x*x+I*I)/3*.6),R=Math.max(8,(22+ye(x,I,5)*170)*k)+A(4,28);a.set(C+A(-2,2),R+150,E+A(-2,2)),c.set(1,300,1),t.compose(a,r,c),b.setMatrixAt(m,t)}b.instanceMatrix.needsUpdate=!0,e.add(b)}}addAntennas(e){const o=new Ae(.1,.1,1,4),i=new Y({color:16716083}),t=new te(o,i,400);t.frustumCulled=!1;const a=new ue,c=new d,r=new d,S=new he;let M=0;for(let b=0;b<400;b++){const m=se(0,L-1),p=se(0,L-1),y=m*X-K,C=p*X-K,E=m/L*4-2,x=p/L*4-2,I=Math.max(.18,1-Math.sqrt(E*E+x*x)/3*.6),k=Math.max(8,(22+ye(E,x,5)*170)*I)+20,R=A(8,30);c.set(y+A(-3,3),k+R/2,C+A(-3,3)),r.set(1,R,1),a.compose(c,S,r),t.setMatrixAt(M++,a)}t.count=M,t.instanceMatrix.needsUpdate=!0,e.add(t)}addNeonSigns(e,o){o.forEach(({text:i,pos:t,color:a})=>{const c=document.createElement("canvas");c.width=256,c.height=64;const r=c.getContext("2d");r.clearRect(0,0,256,64),r.fillStyle=a+"22",r.fillRect(0,0,256,64),r.strokeStyle=a,r.lineWidth=2,r.strokeRect(2,2,252,60),r.fillStyle=a,r.font="bold 22px monospace",r.textAlign="center",r.fillText(i,128,40);const S=new Fe(c),M=new pe(18,4.5),b=new Y({map:S,transparent:!0,side:Ce,depthWrite:!1}),m=new ve(M,b);m.position.copy(t),e.add(m)})}update(e){for(const o of this.mats)o.uniforms.uTime.value=e}}class Jt{constructor(){v(this,"mesh");v(this,"mat")}create(e){const o=new pe(1200,1200,1,1);return this.mat=new ge({vertexShader:Ot,fragmentShader:zt,uniforms:{uTime:{value:0},uDistrictNeon:{value:new T(62975)},uRainIntensity:{value:1}}}),this.mesh=new ve(o,this.mat),this.mesh.rotation.x=-Math.PI/2,this.mesh.position.y=0,e.add(this.mesh),this.mesh}update(e){this.mat.uniforms.uTime.value=e}setDistrictNeon(e){this.mat.uniforms.uDistrictNeon.value.copy(e)}setRainIntensity(e){this.mat.uniforms.uRainIntensity.value=e}}class Zt{constructor(){v(this,"points");v(this,"count",8e3)}create(e){const o=new Float32Array(this.count*3),i=new Float32Array(this.count),t=new Float32Array(this.count);for(let r=0;r<this.count;r++)o[r*3]=A(-300,300),o[r*3+1]=A(-60,60),o[r*3+2]=A(-300,300),i[r]=A(.3,1),t[r]=Math.random();const a=new nt;a.setAttribute("position",new Pe(o,3)),a.setAttribute("aSpeed",new Pe(i,1)),a.setAttribute("aOffset",new Pe(t,1));const c=new ge({vertexShader:Ht,fragmentShader:_t,uniforms:{uTime:{value:0}},transparent:!0,blending:Z,depthWrite:!1});this.points=new st(a,c),e.add(this.points)}update(e,o){const i=this.points.material;i.uniforms.uTime.value=e,o&&(this.points.position.x=o.x,this.points.position.z=o.z)}}class Qt{constructor(){v(this,"mesh");v(this,"mat")}create(e){const o=new ft(2e3,32,16);this.mat=new ge({vertexShader:Bt,fragmentShader:Vt,uniforms:{uTime:{value:0},uZenithColor:{value:new T(132104)},uHorizonColor:{value:new T(1706e3)},uDistrictNeon:{value:new T(62975)}},side:pt,depthWrite:!1}),this.mesh=new ve(o,this.mat),this.mesh.renderOrder=-1,e.add(this.mesh)}update(e,o,i){this.mesh.position.copy(o),this.mat.uniforms.uTime.value=e,i&&this.mat.uniforms.uDistrictNeon.value.copy(i)}setDistrictColors(e,o){this.mat.uniforms.uHorizonColor.value.copy(e),this.mat.uniforms.uDistrictNeon.value.copy(o)}}function eo(n){let e=n;return()=>{e|=0,e=e+1831565813|0;let o=Math.imul(e^e>>>15,1|e);return o=o+Math.imul(o^o>>>7,61|o)^o,((o^o>>>14)>>>0)/4294967296}}const je=[new T(16720384),new T(61183),new T(22015),new T(16711884),new T(65382),new T(16737792),new T(11141375),new T(16770626)],Ge=32,it=16,to=6,Ue=it+to,Ye=Ge/2*Ue;class oo{constructor(){v(this,"mesh");v(this,"mat")}create(e){const i=new pe(5,1.4),t=new Float32Array(150*3),a=new Float32Array(150),c=new Float32Array(150);i.setAttribute("aColor",new oe(t,3)),i.setAttribute("aFlickerSeed",new oe(a,1)),i.setAttribute("aPulseMode",new oe(c,1)),this.mat=new ge({vertexShader:qt,fragmentShader:Xt,uniforms:{uTime:{value:0}},transparent:!0,depthWrite:!1,side:Ce,blending:Z}),this.mesh=new te(i,this.mat,150),this.mesh.frustumCulled=!1;const r=eo(42),S=new ue,M=new d,b=new he,m=new d(1,1,1);let p=0;for(let y=0;y<Ge&&p<150;y++)for(let C=0;C<Ge&&p<150;C++){if(y%5===0||C%5===0||r()>.1)continue;const E=y*Ue-Ye,x=C*Ue-Ye,I=6+r()*12,k=Math.floor(r()*4),R=it*.5+.3;let W=E,s=x,u=0;k===0?(s=x+R,u=0):k===1?(s=x-R,u=Math.PI):k===2?(W=E+R,u=Math.PI*.5):(W=E-R,u=-Math.PI*.5),M.set(W,I,s),b.setFromEuler(new mt(0,u,0)),S.compose(M,b,m),this.mesh.setMatrixAt(p,S);const l=je[Math.floor(r()*je.length)];t[p*3]=l.r,t[p*3+1]=l.g,t[p*3+2]=l.b,a[p]=r();const f=r();c[p]=f<.6?0:f<.85?1:f<.95?2:3,p++}this.mesh.count=p,this.mesh.instanceMatrix.needsUpdate=!0,i.getAttribute("aColor").needsUpdate=!0,i.getAttribute("aFlickerSeed").needsUpdate=!0,i.getAttribute("aPulseMode").needsUpdate=!0,e.add(this.mesh)}update(e){this.mat.uniforms.uTime.value=e}}const no=`
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
`;class so extends Wt{constructor(e=.45){super("LensStreakEffect",no,{uniforms:new Map([["uIntensity",new vt(e)]])})}}class io{constructor(){v(this,"composer");v(this,"glitch");v(this,"glitchTimeout",0)}setup(e,o,i){this.composer=new Mt(e);const t=new Et(o,i),a=new kt({blendFunction:Me.ADD,luminanceThreshold:.25,luminanceSmoothing:.4,intensity:2.4,radius:.6}),c=new so(.45),r=new It({offset:new fe(.0018,.0012),radialModulation:!0,modulationOffset:.5}),S=new Lt({eskil:!1,offset:.35,darkness:.75}),M=new Rt({blendFunction:Me.OVERLAY,premultiply:!0});M.blendMode.opacity.value=.04;const b=new Nt({blendFunction:Me.OVERLAY,density:1.4});return b.blendMode.opacity.value=.07,this.glitch=new Dt({delay:new fe(99999,99999),duration:new fe(.15,.35),strength:new fe(.15,.4),columns:.04,ratio:.85}),this.composer.addPass(t),this.composer.addPass(new Ee(i,a,c)),this.composer.addPass(new Ee(i,r,b,S,M)),this.composer.addPass(new Ee(i,this.glitch)),this.composer}triggerGlitch(){this.glitch.delay.set(0,.05),clearTimeout(this.glitchTimeout),this.glitchTimeout=window.setTimeout(()=>{this.glitch.delay.set(99999,99999)},600)}resize(e,o){this.composer.setSize(e,o)}render(){this.composer.render()}}const z=[{pos:new d(0,180,220),look:new d(0,0,0),label:"HERO",t:0},{pos:new d(-40,12,110),look:new d(-20,20,60),label:"ABOUT",t:0},{pos:new d(-80,200,65),look:new d(-80,200,20),label:"PS3 GPU",t:0},{pos:new d(-75,200,25),look:new d(-75,200,-25),label:"CPUonGPU",t:0},{pos:new d(-13,200,-55),look:new d(0,200,-90),label:"GPU Stream",t:0},{pos:new d(19,200,-80),look:new d(40,200,-110),label:"Selkies",t:0},{pos:new d(90,200,-65),look:new d(100,200,-100),label:"Oris AI",t:0},{pos:new d(101,200,8),look:new d(90,200,-20),label:"VajraGrid",t:0},{pos:new d(84,200,76),look:new d(70,200,50),label:"VidyaMitra",t:0},{pos:new d(34,200,106),look:new d(20,200,80),label:"Netflip",t:0},{pos:new d(-5,200,96),look:new d(-20,200,70),label:"Arena",t:0},{pos:new d(-20,200,67),look:new d(-10,200,40),label:"Hackathon",t:0},{pos:new d(-60,8,30),look:new d(-40,8,0),label:"SKILLS",t:0},{pos:new d(0,120,160),look:new d(0,0,0),label:"CONTACT",t:0}],ao=1600;class ro{constructor(e){v(this,"camera");v(this,"posSpline");v(this,"lookSpline");v(this,"t",0);v(this,"currentSection",0);v(this,"mouseX",0);v(this,"mouseY",0);v(this,"_pos",new d);v(this,"_look",new d);v(this,"_ahead",new d);v(this,"onSectionChange");v(this,"_lastFiredSection",0);this.camera=e,this.buildSpline(),this.init()}buildSpline(){const e=z.map(t=>t.pos.clone()),o=z.map(t=>t.look.clone());this.posSpline=new qe(e,!1,"catmullrom",.5),this.lookSpline=new qe(o,!1,"catmullrom",.5);const i=z.length;z.forEach((t,a)=>{t.t=a/(i-1)}),this.t=0,this.posSpline.getPoint(0,this._pos),this.lookSpline.getPoint(0,this._look),this.camera.position.copy(this._pos),this.camera.lookAt(this._look)}init(){window.addEventListener("mousemove",i=>{this.mouseX=(i.clientX/window.innerWidth-.5)*2,this.mouseY=(i.clientY/window.innerHeight-.5)*2});let e=!1;window.addEventListener("wheel",i=>{if(e)return;e=!0;const t=i.deltaY>0?1:-1;this.goTo(this.currentSection+t),setTimeout(()=>{e=!1},ao)},{passive:!0});let o=0;window.addEventListener("touchstart",i=>{o=i.touches[0].clientY}),window.addEventListener("touchend",i=>{const t=o-i.changedTouches[0].clientY;Math.abs(t)>40&&this.goTo(this.currentSection+(t>0?1:-1))}),window.addEventListener("keydown",i=>{(i.key==="ArrowDown"||i.key==="ArrowRight")&&this.goTo(this.currentSection+1),(i.key==="ArrowUp"||i.key==="ArrowLeft")&&this.goTo(this.currentSection-1)})}goTo(e){if(e=Math.max(0,Math.min(z.length-1,e)),e===this.currentSection)return;const o=this.currentSection;this.currentSection=e;const i=z[e].t,a=.6+Math.abs(i-this.t)*5;ie.killTweensOf(this),ie.to(this,{t:i,duration:a,ease:"power2.inOut",onUpdate:()=>this._fireCrossings(o,e),onComplete:()=>{var c;this._lastFiredSection=e,(c=this.onSectionChange)==null||c.call(this,e),this._updateUI(e)}}),this._updateUI(e)}_fireCrossings(e,o){const i=o>e?1:-1;z.forEach((t,a)=>{var r;(i>0?this.t>=t.t&&a>this._lastFiredSection&&a<=o:this.t<=t.t&&a<this._lastFiredSection&&a>=o)&&(this._lastFiredSection=a,(r=this.onSectionChange)==null||r.call(this,a),this._updateUI(a))})}update(e){this.posSpline.getPoint(this.t,this._pos),this.camera.position.copy(this._pos);const o=Math.min(1,this.t+.015);this.posSpline.getPoint(o,this._ahead),this.lookSpline.getPoint(this.t,this._look);const i=this._look.x*.8+this._ahead.x*.2+this.mouseX*5,t=this._look.y*.8+this._ahead.y*.2-this.mouseY*3,a=this._look.z*.8+this._ahead.z*.2;this.camera.lookAt(i,t,a)}_updateUI(e){document.querySelectorAll(".nav-dot").forEach((i,t)=>i.classList.toggle("active",t===e));const o=document.getElementById("progress-bar");o&&(o.style.height=e/(z.length-1)*100+"%")}getCurrentSection(){return this.currentSection}}const at=[{id:"ps3-gpu",title:"PS3 Cell GPU Emulator",subtitle:"Systems / Emulation",desc:"Full emulation of the Cell Broadband Engine's SPU pipeline in WebGL. 6 SPU cores, PPE scheduler, DMA bus — running real PS3 shaders in the browser at 200 GIPS.",tags:["C++","WebGL","GLSL","Cell BE","Emulation"],url:"https://github.com/Aerosane/ps3-cell-gpu-emulator",neonColor:"#00f5ff",district:"GPU DISTRICT",icon:"⬡"},{id:"cpuongpu",title:"CPUonGPU",subtitle:"Architecture Research",desc:"Runs a full x86 CPU simulation entirely on GPU compute shaders. Register file, ALU, cache hierarchy — all in GLSL. JIT-compiled x86 → SPIR-V at runtime.",tags:["GLSL","Compute Shaders","x86","JIT","SPIR-V"],url:"https://github.com/Aerosane/cpuongpu",neonColor:"#00f5ff",district:"GPU DISTRICT",icon:"⬢"},{id:"gpu-streaming",title:"GPU Streaming Pipeline",subtitle:"NvFBC + NVENC",desc:"Sub-frame-latency game streaming via NvFBC capture → NVENC H265/AV1 encode → WebRTC TURN relay. <1 frame E2E latency. Deployed on GitHub Codespace GPU.",tags:["NVENC","NvFBC","WebRTC","Rust","H265"],url:"https://github.com/Aerosane/gpu-streaming-nvfbc",neonColor:"#00f5ff",district:"GPU DISTRICT",icon:"▶"},{id:"selkies-rust",title:"Selkies-Rust",subtitle:"Python→Rust Port",desc:"Complete rewrite of the Selkies WebRTC game streaming stack from Python into Rust. 6 crates: pipeline, signaling, input, encoding, metrics, CLI.",tags:["Rust","WebRTC","GStreamer","Tokio","GSAP"],url:"https://github.com/Aerosane/selkies-rust",neonColor:"#ff6b1a",district:"SYSTEMS CORRIDOR",icon:"⚙"},{id:"oris-ai",title:"Oris — AI SRE",subtitle:"🏆 Runner-up · TechSynapse 2026",desc:"Autonomous Site Reliability Engineer: ingests production logs, PII-masks with Presidio, infers root cause via Gemini 2.0, opens GitHub PRs with fixes. Zero human touch.",tags:["Python","Gemini 2.0","Presidio","LangChain","FastAPI"],url:"https://github.com/Aerosane/oris",neonColor:"#ff00aa",district:"AI DISTRICT",icon:"◈"},{id:"vajragrid",title:"VajraGrid",subtitle:"🇮🇳 India Innovates 2026 · Bharat Mandapam",desc:"AI-hardened power grid security: detects SCADA cyberattacks in 16s, 4-layer ML defense stack, adversarial training. Exhibited nationally at Bharat Mandapam.",tags:["Python","PyTorch","SCADA","Adversarial ML","GridSec"],url:"https://github.com/Aerosane/vajragridr",neonColor:"#ff00aa",district:"AI DISTRICT",icon:"⚡"},{id:"vidyamitra",title:"VidyaMitra",subtitle:"IISER JEE Prep",desc:"AI tutor for JEE aspirants: adaptive quiz engine, LaTeX equation rendering, spaced repetition. Covers Physics, Chemistry, Math with difficulty auto-calibration.",tags:["TypeScript","React","LaTeX","OpenAI","Supabase"],url:"https://github.com/Aerosane/vidyamitra",neonColor:"#00ff88",district:"EDTECH ZONE",icon:"⬟"},{id:"netflip",title:"Netflip VOD",subtitle:"Full-Stack Streaming",desc:"Netflix-clone with HLS adaptive streaming, Azure Blob CDN, Fastly edge cache, WebSocket live chat, OAuth2, recommendation engine. 1080p adaptive bitrate.",tags:["Next.js","HLS","Azure","Fastly","PostgreSQL"],url:"https://github.com/Aerosane/netflip-vod",neonColor:"#7b2fff",district:"WEB DISTRICT",icon:"▨"},{id:"coding-arena",title:"Coding Arena",subtitle:"Competitive Judging Platform",desc:"Online judge with isolated Docker execution, multi-language support, real-time leaderboard, plagiarism detection via AST similarity. 200ms median judge latency.",tags:["Go","Docker","Redis","React","WebSocket"],url:"https://github.com/Aerosane/coding_arena",neonColor:"#7b2fff",district:"WEB DISTRICT",icon:"{ }"},{id:"hackathon",title:"Hackathon Wins",subtitle:"Hall of Fame",desc:"🏆 Runner-up at TechSynapse 2026 (Oris AI SRE). 🇮🇳 National exhibition at India Innovates 2026, Bharat Mandapam, New Delhi (VajraGrid). 1st year, two nationals.",tags:["Oris AI","VajraGrid","TechSynapse","India Innovates"],url:"https://github.com/Aerosane",neonColor:"#ffe642",district:"HALL OF FAME",icon:"🏆"}],lo={Languages:["C++","Rust","Python","TypeScript","Go","GLSL/HLSL"],Systems:["WebRTC","WebGL/WebGPU","NVENC/NvFBC","Docker","Linux"],"AI/ML":["PyTorch","Gemini API","LangChain","Presidio","HuggingFace"],Web:["React","Next.js","Vite","Node.js","PostgreSQL","Redis"],Tools:["Git","GitHub Actions","Azure","GStreamer","Tokio"]};class co{constructor(){v(this,"group",new Oe);v(this,"hoverTargets",[]);v(this,"visible",!1);v(this,"visibleValue",0)}enter(){this.group.visible=!0,this.visible=!0,ie.killTweensOf(this),ie.to(this,{visibleValue:1,duration:1.4,ease:"power2.out",onUpdate:()=>this.setVisible(this.visibleValue)})}exit(){this.visible=!1,ie.killTweensOf(this),ie.to(this,{visibleValue:0,duration:.8,ease:"power2.in",onUpdate:()=>this.setVisible(this.visibleValue),onComplete:()=>{this.group.visible=!1}})}setVisible(e){}dispose(){this.group.traverse(e=>{e.geometry&&e.geometry.dispose()})}}function uo(n){const i=document.createElement("canvas");i.width=900,i.height=440;const t=i.getContext("2d"),a=n.neonColor;t.fillStyle="#03040f",t.fillRect(0,0,900,440);for(let y=0;y<440;y+=4)t.fillStyle="rgba(0,0,0,0.18)",t.fillRect(0,y,900,2);const c=t.createLinearGradient(0,0,14,0);c.addColorStop(0,a),c.addColorStop(1,"transparent"),t.fillStyle=c,t.shadowColor=a,t.shadowBlur=28,t.fillRect(0,0,7,440),t.shadowBlur=0,t.font="bold 11px monospace",t.fillStyle=a+"aa",t.textAlign="left",t.fillText("◈ "+n.district.toUpperCase(),24,28);const r=n.title.length>18?48:n.title.length>13?58:70;t.font=`bold ${r}px monospace`,t.shadowColor=a,t.shadowBlur=50,t.fillStyle="#ffffff",t.fillText(n.title,24,62+(70-r)),t.shadowBlur=26,t.fillStyle=a+"bb",t.fillText(n.title,24,62+(70-r)),t.shadowBlur=0,t.font="18px monospace",t.fillStyle="rgba(255,255,255,0.65)",t.fillText(n.subtitle,24,138),t.font="14px monospace",t.fillStyle="rgba(200,220,255,0.45)";const S=852,M=n.desc.split(" "),b=[];let m="";for(const y of M){const C=m?m+" "+y:y;if(t.measureText(C).width>S){if(b.length===1){b.push(m+"…"),m="";break}b.push(m),m=y}else m=C}m&&b.length<2&&b.push(m),b.forEach((y,C)=>t.fillText(y,24,164+C*20)),t.strokeStyle=a+"30",t.lineWidth=1,t.beginPath(),t.moveTo(24,212),t.lineTo(876,212),t.stroke(),t.font="bold 13px monospace";let p=24;for(const y of n.tags.slice(0,5)){const C=t.measureText(y).width+20;if(p+C>876)break;t.fillStyle=a+"18",t.fillRect(p,224,C,26),t.strokeStyle=a+"66",t.lineWidth=1,t.strokeRect(p,224,C,26),t.fillStyle=a+"ee",t.fillText(y,p+10,241),p+=C+8}return t.font="12px monospace",t.fillStyle="rgba(255,255,255,0.22)",t.fillText(n.url.replace("https://",""),24,278),t.font="bold 13px monospace",t.shadowColor=a,t.shadowBlur=14,t.fillStyle=a+"99",t.fillText("▶  CLICK TO VIEW PROJECT",24,422),t.shadowBlur=0,new Fe(i)}function J(n,e,o,i,t){const a=new ve(new We(n,e,o),t);return a.position.copy(i),a.frustumCulled=!1,a}class ho extends co{constructor(o,i,t){super();v(this,"projIdx");v(this,"panelPos");v(this,"camPos");v(this,"fadeMats",[]);v(this,"particleMat");this.projIdx=o,this.panelPos=i,this.camPos=t}create(o){o.add(this.group);const i=at[this.projIdx],t=new T(i.neonColor),a=new Oe;a.position.copy(this.panelPos);const c=this.camPos.x-this.panelPos.x,r=this.camPos.z-this.panelPos.z;a.rotation.y=Math.atan2(c,r),this.group.add(a);const S=(s,u)=>(s.opacity=0,this.fadeMats.push([s,u]),s),M=S(new Y({map:uo(i),transparent:!0,depthWrite:!1,side:gt,alphaTest:.01}),1),b=new ve(new pe(40,19.5),M);b.frustumCulled=!1,b.userData.isLabel=!0,b.userData.onClick=()=>window.open(i.url,"_blank"),a.add(b);const m=S(new Y({color:t,transparent:!0,blending:Z,depthWrite:!1}),.85);a.add(J(41,.5,.4,new d(0,9.75,.1),m)),a.add(J(41,.5,.4,new d(0,-9.75,.1),m)),a.add(J(.5,20.5,.4,new d(-20.25,0,.1),m)),a.add(J(.5,20.5,.4,new d(20.25,0,.1),m));const p=190,y=S(new Y({color:2763326,transparent:!0}),1),C=new d(-13,-9.75-p/2,0),E=new d(13,-9.75-p/2,0);a.add(J(.9,p,.9,C,y)),a.add(J(.9,p,.9,E,y)),a.add(J(27,.7,.9,new d(0,-9.75-p+.4,0),y));const x=S(new Y({color:t,transparent:!0,blending:Z,depthWrite:!1}),.5);a.add(J(41,.3,.1,new d(0,9.75,.2),x));const I=60,k=new Float32Array(I*3);for(let s=0;s<I;s++)k[s*3]=this.panelPos.x+(Math.random()-.5)*60,k[s*3+1]=this.panelPos.y+(Math.random()-.5)*35,k[s*3+2]=this.panelPos.z+(Math.random()-.5)*60;const R=new nt;R.setAttribute("position",new Pe(k,3)),this.particleMat=new wt({size:.4,color:t,transparent:!0,opacity:0,blending:Z,sizeAttenuation:!0});const W=new st(R,this.particleMat);W.frustumCulled=!1,this.group.add(W)}update(o){}setVisible(o){for(const[i,t]of this.fadeMats)i.opacity=o*t;this.particleMat&&(this.particleMat.opacity=o*.45)}onHover(){}}const fo=[[2,0],[3,1],[4,2],[5,3],[6,4],[7,5],[8,6],[9,7],[10,8],[11,9]];class po{constructor(e,o){v(this,"envs",new Map);v(this,"activeEnv",null);v(this,"activeIdx",-1);for(const[i,t]of fo){const a=z[i],c=new ho(t,a.look.clone(),a.pos.clone());c.create(e),c.group.visible=!1,this.envs.set(i,c)}}onSection(e){if(e===this.activeIdx)return;this.activeIdx=e,this.activeEnv&&(this.activeEnv.exit(),this.activeEnv=null);const o=this.envs.get(e);o&&(this.activeEnv=o,o.enter())}update(e){this.activeEnv&&this.activeEnv.update(e)}}const mo=document.getElementById("scene-canvas"),re=new bt({canvas:mo,antialias:!0,alpha:!1,powerPreference:"high-performance"});re.setPixelRatio(Math.min(devicePixelRatio,2));re.setSize(innerWidth,innerHeight);re.toneMapping=yt;re.toneMappingExposure=.95;const U=new St;U.background=new T(131602);U.fog=new Ct(197400,.003);const Q=new Pt(60,innerWidth/innerHeight,.5,1200),xe=new io;xe.setup(re,U,Q);const ze=new Qt;ze.create(U);const V=new Kt;V.generate(U);V.addFacadeSigns(U);V.addSearchlights(U);const vo=at.map((n,e)=>{const o=z[e+2];return{text:n.district,pos:new d(o.pos.x+12,80,o.pos.z-18),color:n.neonColor}});V.addNeonSigns(U,vo);const rt=new oo;rt.create(U);const He=new Jt;He.create(U);const lt=new Zt;lt.create(U);const go=new Tt(128,0,.4);U.add(go);const _e=new Oe;U.add(_e);var et,tt;(tt=(et=V.cityGroup)==null?void 0:et.children)==null||tt.forEach(n=>_e.add(n));const ct=new po(U,_e),Te=new T(62975);function wo(n){const e=Math.min(n,me.length-1);Te.copy(me[e]),He.setDistrictNeon(Te),ze.update(0,Q.position,Te)}const bo=[["NEON DISTRICT","A cyberpunk portfolio"],["ABOUT","Who is behind this"],["PS3 CELL GPU","PS3 SPU emulator in WebGL"],["CPUonGPU","x86 CPU running on GPU"],["GPU STREAMING","Sub-frame game streaming"],["SELKIES RUST","WebRTC stack rebuilt in Rust"],["ORIS AI","Autonomous SRE agent"],["VAJRAGRID","AI power grid security"],["VIDYAMITRA","Adaptive JEE AI tutor"],["NETFLIP","HLS streaming platform"],["ARENA OJ","Online judge platform"],["HACKATHON","Competition highlights"],["TECH STACK","Tools and languages"],["CONTACT","Get in touch"]],ae=document.createElement("div");ae.id="section-banner";Object.assign(ae.style,{position:"fixed",bottom:"24px",left:"50%",transform:"translateX(-50%)",textAlign:"center",pointerEvents:"none",zIndex:"50",opacity:"0",transition:"opacity 0.4s",background:"rgba(0,0,8,0.65)",padding:"10px 28px",borderTop:"1px solid currentColor"});document.body.appendChild(ae);function yo(n){const[e,o]=bo[n]??["",""],i=me[n]?"#"+me[n].getHexString():"#00f5ff";ae.style.color=i,ae.innerHTML=`
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
  `,ae.style.opacity="1"}const Be=new ro(Q);Be.onSectionChange=n=>{Co(n),Po(n),wo(n),xe.triggerGlitch(),ct.onSection(n),yo(n)};const So=document.getElementById("nav-dots");z.forEach((n,e)=>{const o=document.createElement("div");o.className="nav-dot"+(e===0?" active":""),o.title=n.label,o.addEventListener("click",()=>Be.goTo(e)),So.appendChild(o)});function Co(n){document.querySelectorAll(".sect").forEach((e,o)=>{e.classList.toggle("active",o===n)}),document.querySelectorAll(".nav-dot").forEach((e,o)=>{e.classList.toggle("active",o===n)})}function Po(n){const e=document.getElementById("hud-section");e&&(e.textContent=`DISTRICT_${String(n).padStart(2,"0")} / ${z[n].label}`)}const $e=document.getElementById("skills-grid");$e&&Object.entries(lo).forEach(([n,e])=>{const o=document.createElement("div");o.className="skill-cat",o.innerHTML=`<div class="skill-cat-name">// ${n}</div>`+e.map(i=>`<div class="skill-item">${i}</div>`).join(""),$e.appendChild(o)});const j=document.getElementById("contact-input"),Se=document.getElementById("contact-input-display");var ot;(ot=document.getElementById("sect-13"))==null||ot.addEventListener("click",()=>j==null?void 0:j.focus());j==null||j.addEventListener("input",()=>{Se&&(Se.textContent=(j.value||"")+"_"),j.value.trim().toLowerCase()==="sudo"&&(To(),j.value="",Se&&(Se.textContent="_"))});function To(){const n=document.querySelector("#sect-13 .terminal-body");if(!n)return;const e=document.createElement("p");e.className="output neon-green",e.textContent="> Permission granted. Downloading your future...",n.appendChild(e),setTimeout(()=>{const o=document.createElement("p");o.className="output",o.innerHTML='<span style="color:#ffe642">root@neon-district:~# ██████████ 100%  COMPLETE</span>',n.appendChild(o)},1500)}const Ke=["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];let ce=0;window.addEventListener("keydown",n=>{n.key===Ke[ce]?ce++:ce=0,ce===Ke.length&&(ce=0,xo())});let Le=!1;function xo(){Le=!Le,[V.sectionLow,V.sectionMid,V.sectionTop,V.meshD].forEach(n=>{const e=n.material;e.wireframe=Le})}const Re=document.getElementById("boot-log"),Je=document.getElementById("boot-bar"),de=document.getElementById("loading-screen"),Ne=["Initializing WebGPU context","Generating city geometry","Compiling 47 shader programs","Spawning rain particles","Calibrating post-processing chain","System ready"];async function Ao(){for(let n=0;n<Ne.length;n++){await new Promise(o=>setTimeout(o,260+Math.random()*200));const e=document.createElement("p");e.innerHTML=`<span style="color:rgba(0,245,255,.5)">[BOOT]</span> ${Ne[n]}... <span class="ok">[OK]</span>`,Re==null||Re.appendChild(e),Je&&(Je.style.width=(n+1)/Ne.length*100+"%")}await new Promise(n=>setTimeout(n,600)),de==null||de.classList.add("fade-out"),setTimeout(()=>{de&&(de.style.display="none")},850)}Ao();const Ze=new xt,De=new fe;window.addEventListener("click",n=>{if(n.target.closest("#env-detail-panel"))return;De.x=n.clientX/innerWidth*2-1,De.y=-(n.clientY/innerHeight)*2+1,Ze.setFromCamera(De,Q);const e=Ze.intersectObjects(U.children,!0);for(const o of e){const i=o.object;if(i.userData.isLabel&&i.userData.onClick){n.stopPropagation(),i.userData.onClick();return}}});window.addEventListener("resize",()=>{Q.aspect=innerWidth/innerHeight,Q.updateProjectionMatrix(),re.setSize(innerWidth,innerHeight),xe.resize(innerWidth,innerHeight)});const Qe=new At;function dt(){requestAnimationFrame(dt);const n=Qe.getElapsedTime(),e=Qe.getDelta();V.update(n),He.update(n),lt.update(n,Q.position),rt.update(n),ze.update(n,Q.position,Te),Be.update(e),ct.update(n),xe.render()}dt();
