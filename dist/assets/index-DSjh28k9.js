var De=Object.defineProperty;var Ge=(i,e,t)=>e in i?De(i,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):i[e]=t;var h=(i,e,t)=>Ge(i,typeof e!="symbol"?e+"":e,t);import{i as A,e as Ue,H as U,G as Q,f as N,I as ne,q as ie,a0 as l,Q as se,j as ze,s as z,v as ee,r as R,g as we,a as H,w as ye,$ as k,C as be,m as xe,X as He,x as We,a3 as Ve,T as $e,A as Ye,U as je,n as qe,P as Xe,c as _e,J as Ke,h as Je}from"./three-DK6CSVrk.js";import{E as Ze,R as Qe,a as et,B as _,C as tt,V as ot,N as nt,S as it,G as st,b as K}from"./postprocessing-BqWDh0gZ.js";(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))n(o);new MutationObserver(o=>{for(const a of o)if(a.type==="childList")for(const r of a.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&n(r)}).observe(document,{childList:!0,subtree:!0});function t(o){const a={};return o.integrity&&(a.integrity=o.integrity),o.referrerPolicy&&(a.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?a.credentials="include":o.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function n(o){if(o.ep)return;o.ep=!0;const a=t(o);fetch(o.href,a)}})();function at(i){return Math.abs(Math.sin(i*127.1+311.7)*43758.5453)%1}function F(i,e){return at(i*374.7+e*931.2)}function rt(i,e){const t=Math.floor(i),n=Math.floor(e),o=i-t,a=e-n,r=o*o*(3-2*o),s=a*a*(3-2*a),c=F(t,n),u=F(t+1,n),d=F(t,n+1),f=F(t+1,n+1);return c+(u-c)*r+(d-c)*s+(f-c+c-u-d+u*s)*r*s}function ae(i,e,t=4){let n=0,o=.5,a=1;for(let r=0;r<t;r++)n+=o*rt(i*a,e*a),o*=.5,a*=2;return n}function w(i,e){return i+Math.random()*(e-i)}function re(i,e){return Math.floor(w(i,e+1))}const lt=`
varying vec2 vUv;
varying vec3 vWorldPos;
varying vec3 vNormal;
varying float vHeight;
attribute float aHeight;
attribute vec3 aNeonColor;
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
`,ct=`
uniform float uTime;
uniform vec3 uFogColor;
uniform float uFogDensity;

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
  float flickerSpeed = hash(id + 0.5) * 4.0 + 0.5;
  float flicker = step(0.03, fract(sin(uTime * flickerSpeed + h * 100.0) * 0.5 + 0.5));
  float isOn = step(0.35, h) * flicker;
  vec2 grid = fract(uv * scale);
  float frame = step(0.08, grid.x) * step(0.08, grid.y) *
                step(grid.x, 0.88) * step(grid.y, 0.82);
  return frame * isOn;
}

void main() {
  vec3 baseColor = vec3(0.05, 0.05, 0.08);
  
  // Window density based on building height
  float density = mix(8.0, 20.0, clamp(vHeight / 200.0, 0.0, 1.0));
  vec2 winScale = vec2(density * 0.6, density);
  vec2 winId = floor(vUv * winScale);
  float win = windowGrid(vUv, winScale, winId);
  
  // Window color palette
  float h = hash(winId + floor(vWorldPos.xz * 0.01));
  vec3 winColor;
  if (h < 0.3) winColor = vec3(1.0, 0.9, 0.6);        // warm yellow
  else if (h < 0.5) winColor = vec3(0.4, 0.7, 1.0);   // cool blue
  else if (h < 0.65) winColor = vNeonColor * 2.0;       // neon (building color)
  else if (h < 0.75) winColor = vec3(0.8, 0.3, 1.0);   // purple
  else winColor = vec3(1.0, 1.0, 1.0);                  // white

  vec3 color = baseColor + win * winColor * 0.9;
  
  // Neon edge glow (Fresnel)
  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 3.0);
  color += vNeonColor * fresnel * 0.6;
  
  // Rooftop neon line
  float rooftop = step(0.97, vUv.y) * 0.8;
  color += vNeonColor * rooftop;

  // Exponential fog
  float dist = length(vWorldPos - cameraPosition);
  float fogFactor = 1.0 - exp(-uFogDensity * dist * dist * 0.00002);
  color = mix(color, uFogColor, clamp(fogFactor, 0.0, 1.0));

  gl_FragColor = vec4(color, 1.0);
}
`,dt=`
varying vec2 vUv;
varying vec3 vWorldPos;
void main() {
  vUv = uv;
  vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,ht=`
uniform float uTime;
uniform sampler2D uNoise;
varying vec2 vUv;
varying vec3 vWorldPos;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  vec3 asphalt = vec3(0.06, 0.06, 0.07);
  
  // Road grid lines
  vec2 roadUv = vUv * 40.0;
  vec2 gridFract = fract(roadUv);
  float line = step(0.97, gridFract.x) + step(0.97, gridFract.y);
  line = clamp(line, 0.0, 1.0);
  
  // Puddle reflections (simple screen-space approx)
  float puddle = smoothstep(0.6, 0.8, hash(floor(vUv * 12.0)));
  float puddleShimmer = puddle * (0.5 + 0.5 * sin(uTime * 0.5 + vUv.x * 10.0));
  
  vec3 color = asphalt;
  color += line * 0.08;  // road lines
  color += vec3(0.0, 0.08, 0.12) * puddleShimmer;  // cyan puddle tint
  
  // Neon reflections on wet ground
  float neonRef = sin(vWorldPos.x * 0.3 + uTime * 0.2) * 0.5 + 0.5;
  neonRef *= sin(vWorldPos.z * 0.2 + uTime * 0.15) * 0.5 + 0.5;
  color += vec3(0.0, 0.15, 0.3) * neonRef * puddle * 0.4;
  
  gl_FragColor = vec4(color, 1.0);
}
`,ut=`
attribute float aSpeed;
attribute float aOffset;
uniform float uTime;
uniform vec3 uCameraPos;
varying float vAlpha;

void main() {
  float t = mod(uTime * aSpeed + aOffset, 1.0);
  vec3 pos = position;
  pos.y -= t * 120.0;
  
  // Wrap vertically
  pos.y = mod(pos.y + 60.0, 120.0) - 60.0;
  
  vAlpha = 0.3 + 0.4 * aSpeed;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = 1.5;
}
`,pt=`
varying float vAlpha;
void main() {
  gl_FragColor = vec4(0.6, 0.8, 1.0, vAlpha * 0.4);
}
`,m=28,O=18,mt=4,P=O+mt,le=[new A(62975),new A(16711850),new A(16739098),new A(8073215),new A(65416),new A(16770626)];class ft{constructor(){h(this,"mesh");h(this,"count",0)}generate(e){const t=m*m,n=new Ue(1,1,1),o=new Float32Array(t),a=new Float32Array(t*3),r=new U({vertexShader:lt,fragmentShader:ct,uniforms:{uTime:{value:0},uFogColor:{value:new A(197400)},uFogDensity:{value:.8}},glslVersion:Q});n.setAttribute("aHeight",new N(o,1)),n.setAttribute("aNeonColor",new N(a,3)),this.mesh=new ne(n,r,t),this.mesh.castShadow=!1,this.mesh.receiveShadow=!1;const s=new ie,c=new l,u=new l,d=new se,f=m/2*P;for(let g=0;g<m;g++)for(let v=0;v<m;v++){const b=g*P-f,S=v*P-f,$=g%4===0||v%4===0,Y=g%2===0&&v%2===0&&!$;if($||Y&&Math.random()<.3)continue;const M=g/m*4-2,j=v/m*4-2,Ne=ae(M,j,5),Ie=Math.sqrt(M*M+j*j)/3,Le=Math.max(0,1-Ie*.7),q=(20+Ne*180)*Le+w(5,30),ke=w(O*.4,O*.95),Oe=w(O*.4,O*.95),Re=Math.floor(g/(m/3)),Fe=Math.floor(v/(m/3)),Be=(Re*3+Fe)%le.length,X=le[Be];o[this.count]=q,a[this.count*3]=X.r,a[this.count*3+1]=X.g,a[this.count*3+2]=X.b,c.set(b,q/2,S),u.set(ke,q,Oe),s.compose(c,d,u),this.mesh.setMatrixAt(this.count,s),this.count++}this.mesh.count=this.count,this.mesh.instanceMatrix.needsUpdate=!0;const y=n.getAttribute("aHeight"),E=n.getAttribute("aNeonColor");return y.needsUpdate=!0,E.needsUpdate=!0,e.add(this.mesh),this.mesh}addAntennas(e){const t=new ze(.15,.15,1,4),n=new z({color:16724787}),o=new ne(t,n,300),a=new ie,r=new l,s=new l,c=new se,u=m/2*P;let d=0;for(let f=0;f<300&&d<300;f++){const y=re(0,m-1),E=re(0,m-1),g=y*P-u,v=E*P-u,b=y/m*4-2,S=E/m*4-2,Y=(20+ae(b,S,5)*180)*Math.max(0,1-Math.sqrt(b*b+S*S)/3*.7)+20,M=w(8,25);r.set(g+w(-4,4),Y+M/2,v+w(-4,4)),s.set(1,M,1),a.compose(r,c,s),o.setMatrixAt(d,a),d++}o.count=d,o.instanceMatrix.needsUpdate=!0,e.add(o)}update(e){const t=this.mesh.material;t.uniforms.uTime.value=e}}class gt{constructor(){h(this,"mesh")}create(e){const t=new ee(1200,1200,1,1),n=new U({vertexShader:dt,fragmentShader:ht,uniforms:{uTime:{value:0}},glslVersion:Q});return this.mesh=new R(t,n),this.mesh.rotation.x=-Math.PI/2,this.mesh.position.y=0,e.add(this.mesh),this.mesh}update(e){const t=this.mesh.material;t.uniforms.uTime.value=e}}class vt{constructor(){h(this,"points");h(this,"count",8e3)}create(e){const t=new Float32Array(this.count*3),n=new Float32Array(this.count),o=new Float32Array(this.count);for(let s=0;s<this.count;s++)t[s*3]=w(-300,300),t[s*3+1]=w(-60,60),t[s*3+2]=w(-300,300),n[s]=w(.3,1),o[s]=Math.random();const a=new we;a.setAttribute("position",new N(t,3)),a.setAttribute("aSpeed",new N(n,1)),a.setAttribute("aOffset",new N(o,1));const r=new U({vertexShader:ut,fragmentShader:pt,uniforms:{uTime:{value:0},uCameraPos:{value:new l}},transparent:!0,blending:H,depthWrite:!1,glslVersion:Q});this.points=new ye(a,r),e.add(this.points)}update(e,t){const n=this.points.material;n.uniforms.uTime.value=e,n.uniforms.uCameraPos.value.copy(t),this.points.position.x=t.x,this.points.position.z=t.z}}const Ce=[{name:"hero",label:"JACK IN"},{name:"about",label:"IDENTITY"},{name:"projects",label:"WORK"},{name:"skills",label:"ARSENAL"},{name:"contact",label:"REACH OUT"}],x=[{pos:new l(0,220,80),target:new l(0,0,0)},{pos:new l(20,30,60),target:new l(20,20,0)},{pos:new l(-60,90,20),target:new l(-20,60,-60)},{pos:new l(40,15,-80),target:new l(40,20,-140)},{pos:new l(-10,8,-20),target:new l(-10,10,-60)}];class wt{constructor(e){h(this,"camera");h(this,"currentSection",0);h(this,"totalScroll",0);h(this,"mouseX",0);h(this,"mouseY",0);h(this,"lerpPos",new l);h(this,"lerpTarget",new l);this.camera=e,this.lerpPos.copy(x[0].pos),this.lerpTarget.copy(x[0].target),this.camera.position.copy(x[0].pos),this.camera.lookAt(x[0].target)}setupScrollListener(e){const t=Ce.length,n=s=>{s.preventDefault();const c=s.deltaY*.0012;this.totalScroll=Math.max(0,Math.min(t-1,this.totalScroll+c));const u=Math.floor(this.totalScroll);u!==this.currentSection&&(this.currentSection=u,e(u))};let o=0;const a=s=>{o=s.touches[0].clientY},r=s=>{const c=(o-s.touches[0].clientY)*.003;o=s.touches[0].clientY,this.totalScroll=Math.max(0,Math.min(t-1,this.totalScroll+c));const u=Math.floor(this.totalScroll);u!==this.currentSection&&(this.currentSection=u,e(u))};window.addEventListener("wheel",n,{passive:!1}),window.addEventListener("touchstart",a,{passive:!0}),window.addEventListener("touchmove",r,{passive:!0}),window.addEventListener("mousemove",s=>{this.mouseX=(s.clientX/window.innerWidth-.5)*2,this.mouseY=(s.clientY/window.innerHeight-.5)*2}),document.querySelectorAll(".nav-dot").forEach((s,c)=>{s.addEventListener("click",()=>{this.totalScroll=c,this.currentSection=c,e(c)})})}update(e){const t=this.totalScroll,n=Math.floor(t),o=Math.min(n+1,x.length-1),a=t-n,r=a*a*(3-2*a),s=new l().lerpVectors(x[n].pos,x[o].pos,r),c=new l().lerpVectors(x[n].target,x[o].target,r);s.x+=this.mouseX*8,s.y-=this.mouseY*5,this.lerpPos.lerp(s,Math.min(e*2.5,1)),this.lerpTarget.lerp(c,Math.min(e*3,1)),this.camera.position.copy(this.lerpPos),this.camera.lookAt(this.lerpTarget)}getSection(){return this.currentSection}getScrollT(){return this.totalScroll}}class yt{constructor(){h(this,"composer");h(this,"glitch");h(this,"glitchTimeout",0)}setup(e,t,n){this.composer=new Ze(e);const o=new Qe(t,n),a=new et({blendFunction:_.ADD,luminanceThreshold:.25,luminanceSmoothing:.4,intensity:2.2,radius:.6}),r=new tt({offset:new k(.0018,.0012),radialModulation:!0,modulationOffset:.5}),s=new ot({eskil:!1,offset:.35,darkness:.7}),c=new nt({blendFunction:_.OVERLAY,premultiply:!0});c.blendMode.opacity.value=.04;const u=new it({blendFunction:_.OVERLAY,density:1.4});return u.blendMode.opacity.value=.08,this.glitch=new st({delay:new k(99999,99999),duration:new k(.15,.35),strength:new k(.15,.4),columns:.04,ratio:.85}),this.composer.addPass(o),this.composer.addPass(new K(n,a)),this.composer.addPass(new K(n,r,u,s,c)),this.composer.addPass(new K(n,this.glitch)),this.composer}triggerGlitch(){this.glitch.delay.set(0,.05),clearTimeout(this.glitchTimeout),this.glitchTimeout=window.setTimeout(()=>{this.glitch.delay.set(99999,99999)},600)}resize(e,t){this.composer.setSize(e,t)}render(){this.composer.render()}}const I=[{label:"[BOOT] Initializing GPU context",delay:200},{label:"[BOOT] Loading city geometry",delay:350},{label:"[BOOT] Compiling GLSL shaders",delay:280},{label:"[BOOT] Spawning rain system",delay:200},{label:"[BOOT] Calibrating neon grid",delay:250},{label:"[BOOT] Loading neural pathways",delay:300},{label:"[BOOT] System ready",delay:150}];class bt{constructor(){h(this,"el");h(this,"lines");h(this,"bar");h(this,"pct");h(this,"step",0);this.el=document.getElementById("loading-screen"),this.lines=document.getElementById("boot-lines"),this.bar=document.getElementById("boot-bar"),this.pct=document.getElementById("boot-pct")}async run(){for(let e=0;e<I.length;e++)await this.delay(I[e].delay),this.addLine(I[e].label,(e===I.length-1,"ok")),this.setProgress(Math.round((e+1)/I.length*100));await this.delay(400)}hide(){this.el.classList.add("fade-out"),setTimeout(()=>{this.el.style.display="none"},900)}addLine(e,t="ok"){const n=document.createElement("div");n.className="boot-line",n.innerHTML=`<span class="label">${e}...</span><span class="${t}">[${t.toUpperCase()}]</span>`,this.lines.appendChild(n),this.lines.scrollTop=this.lines.scrollHeight}setProgress(e){this.bar.style.setProperty("--pct",`${e}%`),this.pct.textContent=`${e}%`}delay(e){return new Promise(t=>setTimeout(t,e))}}const Se=[{id:"ps3-cell",title:"PS3 Cell GPU Emulator",badge:"CUDA",desc:"GPU-native Cell Broadband Engine emulator — PPE + 6 SPU cores mapped as CUDA cooperative kernels. 200 GIPS throughput. Frames never touch the host CPU.",tags:["CUDA","C++","CBE ISA","GPU Architecture"],url:"https://github.com/Aerosane/ps3-cell-gpu-emulator",neonColor:"#00f5ff",district:"gpu"},{id:"cpuongpu",title:"CPUonGPU",badge:"CUDA / C",desc:"x86-64 CPU emulator running entirely on an NVIDIA GPU. JIT compiler, MMU, UART, ACPI. Boots Alpine Linux from inside a CUDA kernel.",tags:["CUDA","C","x86-64","JIT","OS Boot"],url:"https://github.com/Aerosane/cpuongpu",neonColor:"#00f5ff",district:"gpu"},{id:"gpu-streaming",title:"GPU Streaming — NvFBC + NVENC",badge:"GStreamer / C",desc:"Zero-copy NvFBC + NVENC GStreamer plugins. Sub-frame latency HEVC/H264 capture → WebRTC pipeline. Frames never leave GPU VRAM until the encoder.",tags:["GStreamer","C","NVENC","WebRTC","Zero-copy"],url:"https://github.com/Aerosane/gpu-streaming-nvfbc",neonColor:"#00f5ff",district:"gpu"},{id:"selkies-rust",title:"Selkies-Rust",badge:"Rust",desc:"Python → Rust rewrite of a WebRTC remote desktop pipeline. 6-crate workspace: core, gstreamer, signaling, input, stats, binary.",tags:["Rust","WebRTC","GStreamer","async","IPC"],url:"https://github.com/Aerosane/selkies-rust",neonColor:"#ff6b1a",district:"gpu"},{id:"oris",title:"Oris — Autonomous AI SRE",badge:"Runner-up · TechSynapse 2026",desc:"Watches log streams, detects anomalies, diagnoses root cause, generates a code fix, and opens a GitHub PR — end to end. PII masking runs locally before any data leaves. National 24hr hackathon runner-up.",tags:["Next.js 16","FastAPI","Elasticsearch","GPT-4.1","SSE"],url:"https://github.com/Aerosane/oris",neonColor:"#ff00aa",district:"ai"},{id:"vajragrid",title:"VajraGrid",badge:"India Innovates 2026 · Bharat Mandapam",desc:"AI cyber defense for smart power grids. 4-layer anomaly detection (Rule + Physics + Statistical + ONNX ML). Detection <3s, autonomous grid recovery in 16s. Exhibited at Delhi from 1 crore+ applicants.",tags:["Next.js 16","ONNX Runtime","React Flow","TypeScript","ML"],url:"https://github.com/Aerosane/vajragridr",neonColor:"#ffe642",district:"ai"},{id:"iiser",title:"IISER Exam Prep",badge:"EdTech",desc:"Exam platform with AI tutor (streaming LLM), configurable mock tests, step-by-step solution generator. LaTeX math + chemical SMILES rendering via KaTeX.",tags:["Next.js 15","TypeScript","Tailwind","KaTeX","GitHub Models API"],url:"https://github.com/Aerosane/iiser-exam-prep",neonColor:"#00ff88",district:"ai"},{id:"vidyamitra",title:"VidyaMitra",badge:"EdTech",desc:"AI career guidance — resume scoring, mock interviews, skill quizzes, job recommendations. Swappable LLM backend (GitHub Models, OpenRouter, Ollama) — zero business logic changes.",tags:["Next.js","FastAPI","Python","LLM","PDF parsing"],url:"https://github.com/Aerosane/vidyamitra",neonColor:"#00ff88",district:"ai"},{id:"netflip",title:"Netflip VOD",badge:"Azure · Fastly CDN",desc:"Self-hosted Netflix-style streaming. Azure Functions serverless backend, Cosmos DB metadata, Fastly CDN edge-cached HLS adaptive bitrate delivery with custom VCL.",tags:["Next.js 16","Azure Functions","Cosmos DB","HLS","Fastly VCL"],url:"https://github.com/Aerosane/netflip-vod",neonColor:"#7b2fff",district:"web"},{id:"coding-arena",title:"Coding Arena",badge:"GCET Open Source",desc:"Self-hosted competitive programming judge — React SPA, Go API, sandboxed DMOJ judge in a 3-container Docker stack. Real-time verdict streaming over TCP bridge.",tags:["React","Go","Docker","DMOJ","Gin"],url:"https://github.com/Aerosane/coding_arena",neonColor:"#7b2fff",district:"web"}];class xt{constructor(){h(this,"el");h(this,"content");h(this,"closeBtn");h(this,"active",!1);this.el=document.getElementById("overlay"),this.content=document.getElementById("overlay-content"),this.closeBtn=document.getElementById("overlay-close"),this.closeBtn.addEventListener("click",()=>this.close()),this.el.addEventListener("click",e=>{e.target===this.el&&this.close()}),window.addEventListener("keydown",e=>{e.key==="Escape"&&this.close()})}open(e){const t=Se.find(n=>n.id===e);t&&(this.content.innerHTML=this.renderProject(t),this.el.classList.remove("hidden"),this.active=!0,this.closeBtn.focus())}close(){this.el.classList.add("hidden"),this.active=!1}isActive(){return this.active}renderProject(e){const t=e.tags.map(o=>`<span class="proj-overlay-tag">${o}</span>`).join(""),n=e.badge?`<div class="proj-overlay-badge">${e.badge}</div>`:"";return`
      <div class="proj-overlay-title" style="text-shadow: 0 0 20px ${e.neonColor}">${e.title}</div>
      ${n}
      <p class="proj-overlay-desc">${e.desc}</p>
      <div class="proj-overlay-tags">${t}</div>
      <a class="proj-overlay-link" href="${e.url}" target="_blank" rel="noopener noreferrer"
         style="border-color:${e.neonColor};color:${e.neonColor}">
        [ VIEW ON GITHUB → ]
      </a>
    `}}class Ct{constructor(){h(this,"el");h(this,"input");h(this,"output");h(this,"history",[]);h(this,"visible",!1);h(this,"COMMANDS",{help:()=>`Available commands:
  github      — open GitHub profile
  linkedin    — open LinkedIn
  email       — copy email address
  whoami      — about Shantan
  skills      — tech stack
  clear       — clear terminal
  sudo        — try it ;)`,github:()=>(window.open("https://github.com/Aerosane","_blank"),"Opening github.com/Aerosane..."),linkedin:()=>(window.open("https://linkedin.com/in/shantan-dheer-932082383","_blank"),"Opening LinkedIn..."),email:()=>{var e;return(e=navigator.clipboard)==null||e.writeText("shantandheerd@gmail.com").catch(()=>{}),"Email copied: shantandheerd@gmail.com"},whoami:()=>`D Shantan Dheer
1st-year EEE @ GCET, Hyderabad
GPU kernels · CUDA emulators · AI systems
Runner-up TechSynapse 2026
Exhibited India Innovates 2026, Bharat Mandapam`,skills:()=>`SYSTEMS  CUDA · C · C++ · Rust · x86-64 ASM
WEB      TypeScript · Python · Go · Next.js · FastAPI
INFRA    Docker · Azure · Fastly CDN · GitHub Actions
AI       ONNX Runtime · scikit-learn · LLM APIs`,clear:()=>(this.output.innerHTML="",""),sudo:()=>`[sudo] password for shantan: 

Access granted.
Downloading your future...

> Connecting to opportunity.net...
> Found: 3 open internship slots
> Initiating contact sequence...`})}create(){return this.el=document.createElement("div"),this.el.id="terminal",this.el.style.cssText=`
      position: fixed;
      bottom: 0; left: 0; right: 0;
      height: 320px;
      background: rgba(0, 8, 16, 0.97);
      border-top: 1px solid rgba(0,245,255,0.3);
      font-family: 'Share Tech Mono', monospace;
      font-size: 0.82rem;
      color: #ccc;
      display: flex;
      flex-direction: column;
      z-index: 60;
      transform: translateY(100%);
      transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      pointer-events: auto;
    `,this.el.innerHTML=`
      <div style="display:flex;align-items:center;gap:12px;padding:10px 20px;border-bottom:1px solid rgba(0,245,255,0.15);background:rgba(0,245,255,0.04)">
        <span style="color:#00f5ff;font-size:0.75rem;letter-spacing:0.1em">NEON DISTRICT TERMINAL v1.0</span>
        <span style="flex:1"></span>
        <button id="term-close" style="background:none;border:1px solid rgba(0,245,255,0.3);color:#00f5ff;padding:2px 10px;cursor:pointer;font-family:inherit;font-size:0.75rem">✕ CLOSE</button>
      </div>
      <div id="term-output" style="flex:1;overflow-y:auto;padding:12px 20px;scrollbar-width:thin;scrollbar-color:#00f5ff22 transparent"></div>
      <div style="display:flex;align-items:center;padding:8px 20px;border-top:1px solid rgba(0,245,255,0.1)">
        <span style="color:#00f5ff;margin-right:8px">~/neon $</span>
        <input id="term-input" type="text" autocomplete="off" spellcheck="false"
          style="flex:1;background:none;border:none;outline:none;color:#e0e0e0;font-family:inherit;font-size:0.82rem;caret-color:#00f5ff" 
          placeholder="type 'help' for commands" />
      </div>
    `,document.body.appendChild(this.el),this.output=document.getElementById("term-output"),this.input=document.getElementById("term-input"),document.getElementById("term-close").addEventListener("click",()=>this.hide()),this.input.addEventListener("keydown",e=>{if(e.key==="Enter"){const t=this.input.value.trim().toLowerCase();if(this.input.value="",!t)return;this.history.push(t),this.print(`<span style="color:#00f5ff">~/neon $</span> ${t}`);const n=this.COMMANDS[t]?this.COMMANDS[t]():`Command not found: ${t}. Type 'help'.`;n&&this.print(n)}e.key==="ArrowUp"&&this.history.length&&(this.input.value=this.history[this.history.length-1])}),this.print(`<span style="color:#00f5ff">NEON DISTRICT TERMINAL</span>
<span style="color:#888">Type 'help' for available commands.</span>`),this.el}print(e){const t=document.createElement("div");t.style.cssText="margin-bottom:6px;line-height:1.6;white-space:pre-wrap",t.innerHTML=e,this.output.appendChild(t),this.output.scrollTop=this.output.scrollHeight}show(){this.visible=!0,this.el.style.transform="translateY(0)",setTimeout(()=>this.input.focus(),400)}hide(){this.visible=!1,this.el.style.transform="translateY(100%)"}toggle(){this.visible?this.hide():this.show()}isVisible(){return this.visible}}function B(i,e){const{text:t,size:n=1,color:o="#00f5ff",position:a,subtitle:r}=e,s=1024,c=r?320:200,u=document.createElement("canvas");u.width=s,u.height=c;const d=u.getContext("2d");d.clearRect(0,0,s,c),d.shadowColor=o,d.shadowBlur=30;const f=Math.floor(c*.42);d.font=`700 ${f}px "Rajdhani", sans-serif`,d.fillStyle="#ffffff",d.textAlign="center",d.textBaseline="middle";for(let S=0;S<3;S++)d.fillStyle=o,d.globalAlpha=.15,d.fillText(t,s/2,c*.42);d.globalAlpha=1,d.fillStyle="#ffffff",d.fillText(t,s/2,c*.42),r&&(d.shadowBlur=10,d.font=`300 ${Math.floor(f*.3)}px "Share Tech Mono", monospace`,d.fillStyle=o,d.globalAlpha=.9,d.fillText(r,s/2,c*.78));const y=new be(u),E=s/c,g=new ee(60*n*E,60*n),v=new z({map:y,transparent:!0,depthWrite:!1,side:xe,blending:H}),b=new R(g,v);return b.position.copy(a),i.add(b),b}function ce(i,e,t){const n=new He(12,.3,8,64),o=new z({color:t,transparent:!0,opacity:.6,blending:H,depthWrite:!1}),a=new R(n,o);return a.position.copy(e),i.add(a),a}function de(i,e){const n=new Float32Array(600);for(let s=0;s<200;s++)n[s*3]=(Math.random()-.5)*40,n[s*3+1]=(Math.random()-.5)*60,n[s*3+2]=(Math.random()-.5)*5;const o=new we;o.setAttribute("position",new N(n,3));const a=new We({color:65416,size:.8,transparent:!0,opacity:.5,blending:H,depthWrite:!1}),r=new ye(o,a);return r.position.copy(e),i.add(r),r}const Ae=document.getElementById("canvas"),T=new Ve({canvas:Ae,antialias:!0,powerPreference:"high-performance"});T.setPixelRatio(Math.min(window.devicePixelRatio,2));T.setSize(window.innerWidth,window.innerHeight);T.outputColorSpace=$e;T.toneMapping=Ye;T.toneMappingExposure=1.2;const p=new je;p.background=new A(131594);p.fog=new qe(197400,.0018);const C=new Xe(60,window.innerWidth/window.innerHeight,.5,1200),Te=new wt(C),St=new _e(657946,.5);p.add(St);const Z=new ft,Ee=new gt,Me=new vt,he=new bt,ue=new xt,pe=new Ct,D=new yt,W=document.createElement("div");W.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:40;font-family:"Share Tech Mono",monospace';document.body.appendChild(W);const te=document.createElement("div");te.style.cssText=`
  position:absolute;top:32px;left:40px;
  font-size:0.7rem;letter-spacing:0.2em;
  color:rgba(0,245,255,0.7);
  transition:opacity 0.4s;
`;W.appendChild(te);const oe=document.createElement("div");oe.style.cssText=`
  position:absolute;bottom:60px;left:40px;
  font-size:0.65rem;color:rgba(0,245,255,0.3);
  letter-spacing:0.08em;
`;W.appendChild(oe);const V=document.createElement("div");V.id="scroll-hint";V.textContent="▼  SCROLL TO NAVIGATE  ▼";document.body.appendChild(V);const me=new Ke,J=new k,G=[];function At(i,e){const t=new ee(20,12),n=document.createElement("canvas");n.width=512,n.height=320;const o=n.getContext("2d");o.fillStyle="#010810",o.fillRect(0,0,512,320),o.strokeStyle=i.neonColor,o.lineWidth=3,o.strokeRect(4,4,504,312),o.fillStyle="#ffffff",o.font='bold 28px "Share Tech Mono", monospace',o.fillText(i.title.toUpperCase().slice(0,22),20,60),i.badge&&(o.fillStyle=i.neonColor,o.font='14px "Share Tech Mono", monospace',o.fillText(`[ ${i.badge.toUpperCase()} ]`,20,90)),o.fillStyle="#888",o.font='13px "Share Tech Mono", monospace';const a=i.desc.split(" ");let r="",s=130;for(const f of a){const y=r+f+" ";if(o.measureText(y).width>470){if(o.fillText(r,20,s),r=f+" ",s+=20,s>230)break}else r=y}o.fillText(r,20,s),o.fillStyle=i.neonColor+"88",o.font='11px "Share Tech Mono", monospace',o.fillText(i.tags.slice(0,4).join("  ·  "),20,280),o.fillStyle=i.neonColor,o.font='13px "Share Tech Mono", monospace',o.fillText("[ CLICK TO EXPAND → ]",20,305);const c=new be(n),u=new z({map:c,transparent:!0,side:xe}),d=new R(t,u);d.position.copy(e),d.lookAt(C.position),p.add(d),G.push({mesh:d,projectId:i.id})}function Tt(){const i=[new l(-80,60,-40),new l(-60,50,-80),new l(-40,70,-100),new l(20,55,-90),new l(60,65,-70),new l(80,50,-40),new l(70,45,10),new l(-70,40,10),new l(-90,55,-20),new l(30,60,-110)];Se.forEach((e,t)=>{t<i.length&&At(e,i[t])})}Ae.addEventListener("click",i=>{if(ue.isActive())return;J.x=i.clientX/window.innerWidth*2-1,J.y=-(i.clientY/window.innerHeight)*2+1,me.setFromCamera(J,C);const e=me.intersectObjects(G.map(t=>t.mesh));if(e.length>0){const t=G.find(n=>n.mesh===e[0].object);t&&ue.open(t.projectId)}});function fe(i){document.querySelectorAll(".nav-dot").forEach((e,t)=>{e.classList.toggle("active",t===i)}),te.textContent=`// ${Ce[i].label}`,i>0&&(V.style.opacity="0")}async function Et(){await he.run(),Z.generate(p),Z.addAntennas(p),Ee.create(p),Me.create(p),D.setup(T,p,C),B(p,{text:"D SHANTAN DHEER",subtitle:"SYSTEMS · GPU · AI · CREATIVE DEV",size:1.2,position:new l(0,80,-30)}),B(p,{text:"1ST YEAR EEE · GCET",color:"#ff00aa",size:.5,position:new l(0,50,-30)}),ce(p,new l(0,80,-30),62975),ce(p,new l(0,55,-30),16711850),de(p,new l(40,15,-100)),de(p,new l(60,15,-120)),B(p,{text:"🏆 RUNNER-UP",subtitle:"TECHSYNAPSE 2026 · NATIONAL 24HR HACKATHON",color:"#ffe642",size:.55,position:new l(80,100,20)}),B(p,{text:"🇮🇳 INDIA INNOVATES 2026",subtitle:"BHARAT MANDAPAM · 5K OF 1CR APPLICANTS",color:"#ffe642",size:.55,position:new l(80,75,20)}),Tt(),pe.create();const i=document.createElement("button");i.textContent="> TERMINAL",i.style.cssText=`
    position:fixed;bottom:24px;right:24px;z-index:70;
    background:rgba(0,8,16,0.9);border:1px solid rgba(0,245,255,0.4);
    color:#00f5ff;font-family:'Share Tech Mono',monospace;font-size:0.78rem;
    padding:8px 16px;cursor:pointer;letter-spacing:0.08em;
    transition:all 0.2s;
  `,i.onmouseenter=()=>i.style.background="rgba(0,245,255,0.12)",i.onmouseleave=()=>i.style.background="rgba(0,8,16,0.9)",i.onclick=()=>pe.toggle(),document.body.appendChild(i),Te.setupScrollListener(e=>{fe(e),D.triggerGlitch()}),fe(0),he.hide(),Pe()}const ge=new Je;function Pe(){requestAnimationFrame(Pe);const i=ge.getDelta(),e=ge.getElapsedTime();Te.update(i),Z.update(e),Ee.update(e),Me.update(e,C.position),G.forEach(n=>n.mesh.lookAt(C.position));const t=C.position;oe.textContent=`X:${t.x.toFixed(1)}  Y:${t.y.toFixed(1)}  Z:${t.z.toFixed(1)}`,D.render()}window.addEventListener("resize",()=>{C.aspect=window.innerWidth/window.innerHeight,C.updateProjectionMatrix(),T.setSize(window.innerWidth,window.innerHeight),D.resize(window.innerWidth,window.innerHeight)});const ve=[38,38,40,40,37,39,37,39,66,65];let L=0;window.addEventListener("keydown",i=>{i.keyCode===ve[L]?(L++,L===ve.length&&(L=0,p.traverse(e=>{e instanceof R&&e.material instanceof U&&(e.material.wireframe=!e.material.wireframe)}))):L=0});Et();
