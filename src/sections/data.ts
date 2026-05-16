export interface Project {
  id: string
  title: string
  subtitle: string
  desc: string
  tags: string[]
  url: string
  neonColor: string
  district: string
  icon: string
}

export const PROJECTS: Project[] = [
  {
    id: 'ps3-gpu',
    title: 'PS3 Cell GPU Emulator',
    subtitle: 'Systems / Emulation',
    desc: 'Full emulation of the Cell Broadband Engine\'s SPU pipeline in WebGL. 6 SPU cores, PPE scheduler, DMA bus — running real PS3 shaders in the browser at 200 GIPS.',
    tags: ['C++','WebGL','GLSL','Cell BE','Emulation'],
    url: 'https://github.com/Aerosane/ps3-cell-gpu-emulator',
    neonColor: '#00f5ff',
    district: 'GPU DISTRICT',
    icon: '⬡',
  },
  {
    id: 'cpuongpu',
    title: 'CPUonGPU',
    subtitle: 'Architecture Research',
    desc: 'Runs a full x86 CPU simulation entirely on GPU compute shaders. Register file, ALU, cache hierarchy — all in GLSL. JIT-compiled x86 → SPIR-V at runtime.',
    tags: ['GLSL','Compute Shaders','x86','JIT','SPIR-V'],
    url: 'https://github.com/Aerosane/cpuongpu',
    neonColor: '#00f5ff',
    district: 'GPU DISTRICT',
    icon: '⬢',
  },
  {
    id: 'gpu-streaming',
    title: 'GPU Streaming Pipeline',
    subtitle: 'NvFBC + NVENC',
    desc: 'Sub-frame-latency game streaming via NvFBC capture → NVENC H265/AV1 encode → WebRTC TURN relay. <1 frame E2E latency. Deployed on GitHub Codespace GPU.',
    tags: ['NVENC','NvFBC','WebRTC','Rust','H265'],
    url: 'https://github.com/Aerosane/gpu-streaming-nvfbc',
    neonColor: '#00f5ff',
    district: 'GPU DISTRICT',
    icon: '▶',
  },
  {
    id: 'selkies-rust',
    title: 'Selkies-Rust',
    subtitle: 'Python→Rust Port',
    desc: 'Complete rewrite of the Selkies WebRTC game streaming stack from Python into Rust. 6 crates: pipeline, signaling, input, encoding, metrics, CLI.',
    tags: ['Rust','WebRTC','GStreamer','Tokio','GSAP'],
    url: 'https://github.com/Aerosane/selkies-rust',
    neonColor: '#ff6b1a',
    district: 'SYSTEMS CORRIDOR',
    icon: '⚙',
  },
  {
    id: 'oris-ai',
    title: 'Oris — AI SRE',
    subtitle: '🏆 Runner-up · TechSynapse 2026',
    desc: 'Autonomous Site Reliability Engineer: ingests production logs, PII-masks with Presidio, infers root cause via Gemini 2.0, opens GitHub PRs with fixes. Zero human touch.',
    tags: ['Python','Gemini 2.0','Presidio','LangChain','FastAPI'],
    url: 'https://github.com/Aerosane/oris',
    neonColor: '#ff00aa',
    district: 'AI DISTRICT',
    icon: '◈',
  },
  {
    id: 'vajragrid',
    title: 'VajraGrid',
    subtitle: '🇮🇳 India Innovates 2026 · Bharat Mandapam',
    desc: 'AI-hardened power grid security: detects SCADA cyberattacks in 16s, 4-layer ML defense stack, adversarial training. Exhibited nationally at Bharat Mandapam.',
    tags: ['Python','PyTorch','SCADA','Adversarial ML','GridSec'],
    url: 'https://github.com/Aerosane/vajragridr',
    neonColor: '#ff00aa',
    district: 'AI DISTRICT',
    icon: '⚡',
  },
  {
    id: 'vidyamitra',
    title: 'VidyaMitra',
    subtitle: 'IISER JEE Prep',
    desc: 'AI tutor for JEE aspirants: adaptive quiz engine, LaTeX equation rendering, spaced repetition. Covers Physics, Chemistry, Math with difficulty auto-calibration.',
    tags: ['TypeScript','React','LaTeX','OpenAI','Supabase'],
    url: 'https://github.com/Aerosane/vidyamitra',
    neonColor: '#00ff88',
    district: 'EDTECH ZONE',
    icon: '⬟',
  },
  {
    id: 'netflip',
    title: 'Netflip VOD',
    subtitle: 'Full-Stack Streaming',
    desc: 'Netflix-clone with HLS adaptive streaming, Azure Blob CDN, Fastly edge cache, WebSocket live chat, OAuth2, recommendation engine. 1080p adaptive bitrate.',
    tags: ['Next.js','HLS','Azure','Fastly','PostgreSQL'],
    url: 'https://github.com/Aerosane/netflip-vod',
    neonColor: '#7b2fff',
    district: 'WEB DISTRICT',
    icon: '▨',
  },
  {
    id: 'coding-arena',
    title: 'Coding Arena',
    subtitle: 'Competitive Judging Platform',
    desc: 'Online judge with isolated Docker execution, multi-language support, real-time leaderboard, plagiarism detection via AST similarity. 200ms median judge latency.',
    tags: ['Go','Docker','Redis','React','WebSocket'],
    url: 'https://github.com/Aerosane/coding_arena',
    neonColor: '#7b2fff',
    district: 'WEB DISTRICT',
    icon: '{ }',
  },
  {
    id: 'hackathon',
    title: 'Hackathon Wins',
    subtitle: 'Hall of Fame',
    desc: '🏆 Runner-up at TechSynapse 2026 (Oris AI SRE). 🇮🇳 National exhibition at India Innovates 2026, Bharat Mandapam, New Delhi (VajraGrid). 1st year, two nationals.',
    tags: ['Oris AI','VajraGrid','TechSynapse','India Innovates'],
    url: 'https://github.com/Aerosane',
    neonColor: '#ffe642',
    district: 'HALL OF FAME',
    icon: '🏆',
  },
]

export const SKILLS = {
  'Languages':   ['C++','Rust','Python','TypeScript','Go','GLSL/HLSL'],
  'Systems':     ['WebRTC','WebGL/WebGPU','NVENC/NvFBC','Docker','Linux'],
  'AI/ML':       ['PyTorch','Gemini API','LangChain','Presidio','HuggingFace'],
  'Web':         ['React','Next.js','Vite','Node.js','PostgreSQL','Redis'],
  'Tools':       ['Git','GitHub Actions','Azure','GStreamer','Tokio'],
}
