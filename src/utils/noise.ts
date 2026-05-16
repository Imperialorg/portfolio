// Simplex-like noise utilities (no external dep)

function hash(n: number): number {
  return Math.abs(Math.sin(n * 127.1 + 311.7) * 43758.5453) % 1
}

function hash2(x: number, y: number): number {
  return hash(x * 374.7 + y * 931.2)
}

export function noise2(x: number, y: number): number {
  const ix = Math.floor(x), iy = Math.floor(y)
  const fx = x - ix, fy = y - iy
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy)
  const a = hash2(ix, iy), b = hash2(ix + 1, iy)
  const c = hash2(ix, iy + 1), d = hash2(ix + 1, iy + 1)
  return a + (b - a) * ux + (c - a) * uy + (d - a + a - b - c + b * uy) * ux * uy
}

export function fbm(x: number, y: number, octaves = 4): number {
  let v = 0, amp = 0.5, freq = 1
  for (let i = 0; i < octaves; i++) {
    v += amp * noise2(x * freq, y * freq)
    amp *= 0.5; freq *= 2
  }
  return v
}

export function rand(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

export function randInt(min: number, max: number): number {
  return Math.floor(rand(min, max + 1))
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}
