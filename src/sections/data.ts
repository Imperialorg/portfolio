export interface ProjectData {
  id: string
  title: string
  badge?: string
  desc: string
  tags: string[]
  url: string
  neonColor: string
  district: 'gpu' | 'ai' | 'web'
}

export const PROJECTS: ProjectData[] = [
  {
    id: 'ps3-cell',
    title: 'PS3 Cell GPU Emulator',
    badge: 'CUDA',
    desc: 'GPU-native Cell Broadband Engine emulator — PPE + 6 SPU cores mapped as CUDA cooperative kernels. 200 GIPS throughput. Frames never touch the host CPU.',
    tags: ['CUDA', 'C++', 'CBE ISA', 'GPU Architecture'],
    url: 'https://github.com/Aerosane/ps3-cell-gpu-emulator',
    neonColor: '#00f5ff',
    district: 'gpu',
  },
  {
    id: 'cpuongpu',
    title: 'CPUonGPU',
    badge: 'CUDA / C',
    desc: 'x86-64 CPU emulator running entirely on an NVIDIA GPU. JIT compiler, MMU, UART, ACPI. Boots Alpine Linux from inside a CUDA kernel.',
    tags: ['CUDA', 'C', 'x86-64', 'JIT', 'OS Boot'],
    url: 'https://github.com/Aerosane/cpuongpu',
    neonColor: '#00f5ff',
    district: 'gpu',
  },
  {
    id: 'gpu-streaming',
    title: 'GPU Streaming — NvFBC + NVENC',
    badge: 'GStreamer / C',
    desc: 'Zero-copy NvFBC + NVENC GStreamer plugins. Sub-frame latency HEVC/H264 capture → WebRTC pipeline. Frames never leave GPU VRAM until the encoder.',
    tags: ['GStreamer', 'C', 'NVENC', 'WebRTC', 'Zero-copy'],
    url: 'https://github.com/Aerosane/gpu-streaming-nvfbc',
    neonColor: '#00f5ff',
    district: 'gpu',
  },
  {
    id: 'selkies-rust',
    title: 'Selkies-Rust',
    badge: 'Rust',
    desc: 'Python → Rust rewrite of a WebRTC remote desktop pipeline. 6-crate workspace: core, gstreamer, signaling, input, stats, binary.',
    tags: ['Rust', 'WebRTC', 'GStreamer', 'async', 'IPC'],
    url: 'https://github.com/Aerosane/selkies-rust',
    neonColor: '#ff6b1a',
    district: 'gpu',
  },
  {
    id: 'oris',
    title: 'Oris — Autonomous AI SRE',
    badge: 'Runner-up · TechSynapse 2026',
    desc: 'Watches log streams, detects anomalies, diagnoses root cause, generates a code fix, and opens a GitHub PR — end to end. PII masking runs locally before any data leaves. National 24hr hackathon runner-up.',
    tags: ['Next.js 16', 'FastAPI', 'Elasticsearch', 'GPT-4.1', 'SSE'],
    url: 'https://github.com/Aerosane/oris',
    neonColor: '#ff00aa',
    district: 'ai',
  },
  {
    id: 'vajragrid',
    title: 'VajraGrid',
    badge: 'India Innovates 2026 · Bharat Mandapam',
    desc: 'AI cyber defense for smart power grids. 4-layer anomaly detection (Rule + Physics + Statistical + ONNX ML). Detection <3s, autonomous grid recovery in 16s. Exhibited at Delhi from 1 crore+ applicants.',
    tags: ['Next.js 16', 'ONNX Runtime', 'React Flow', 'TypeScript', 'ML'],
    url: 'https://github.com/Aerosane/vajragridr',
    neonColor: '#ffe642',
    district: 'ai',
  },
  {
    id: 'iiser',
    title: 'IISER Exam Prep',
    badge: 'EdTech',
    desc: 'Exam platform with AI tutor (streaming LLM), configurable mock tests, step-by-step solution generator. LaTeX math + chemical SMILES rendering via KaTeX.',
    tags: ['Next.js 15', 'TypeScript', 'Tailwind', 'KaTeX', 'GitHub Models API'],
    url: 'https://github.com/Aerosane/iiser-exam-prep',
    neonColor: '#00ff88',
    district: 'ai',
  },
  {
    id: 'vidyamitra',
    title: 'VidyaMitra',
    badge: 'EdTech',
    desc: 'AI career guidance — resume scoring, mock interviews, skill quizzes, job recommendations. Swappable LLM backend (GitHub Models, OpenRouter, Ollama) — zero business logic changes.',
    tags: ['Next.js', 'FastAPI', 'Python', 'LLM', 'PDF parsing'],
    url: 'https://github.com/Aerosane/vidyamitra',
    neonColor: '#00ff88',
    district: 'ai',
  },
  {
    id: 'netflip',
    title: 'Netflip VOD',
    badge: 'Azure · Fastly CDN',
    desc: 'Self-hosted Netflix-style streaming. Azure Functions serverless backend, Cosmos DB metadata, Fastly CDN edge-cached HLS adaptive bitrate delivery with custom VCL.',
    tags: ['Next.js 16', 'Azure Functions', 'Cosmos DB', 'HLS', 'Fastly VCL'],
    url: 'https://github.com/Aerosane/netflip-vod',
    neonColor: '#7b2fff',
    district: 'web',
  },
  {
    id: 'coding-arena',
    title: 'Coding Arena',
    badge: 'GCET Open Source',
    desc: 'Self-hosted competitive programming judge — React SPA, Go API, sandboxed DMOJ judge in a 3-container Docker stack. Real-time verdict streaming over TCP bridge.',
    tags: ['React', 'Go', 'Docker', 'DMOJ', 'Gin'],
    url: 'https://github.com/Aerosane/coding_arena',
    neonColor: '#7b2fff',
    district: 'web',
  },
]

export const SKILLS = {
  systems: ['CUDA', 'C', 'C++', 'Rust', 'x86-64 ASM', 'GStreamer'],
  web: ['TypeScript', 'Python', 'Go', 'Next.js 15/16', 'React 19', 'FastAPI'],
  infra: ['Docker', 'Azure', 'Fastly CDN', 'GitHub Actions', 'ONNX Runtime'],
  ai: ['scikit-learn', 'NumPy', 'Pandas', 'ONNX Runtime', 'LLM Prompting'],
}
