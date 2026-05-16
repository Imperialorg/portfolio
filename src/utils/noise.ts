// Fractional Brownian Motion + helpers
export function fade(t: number) { return t*t*t*(t*(t*6-15)+10) }
export function lerp(a: number, b: number, t: number) { return a + t*(b-a) }
export function grad(h: number, x: number, y: number) {
  const v = h & 3
  const u = v < 2 ? x : y, w = v < 2 ? y : x
  return ((h & 1) ? -u : u) + ((h & 2) ? -w : w)
}
const P = Array.from({length:512}, (_,i)=>i).sort(()=>Math.random()-0.5)
for(let i=0;i<256;i++) P[i+256]=P[i]

export function perlin(x: number, y: number) {
  const xi=Math.floor(x)&255, yi=Math.floor(y)&255
  const xf=x-Math.floor(x), yf=y-Math.floor(y)
  const u=fade(xf), v=fade(yf)
  const aa=P[P[xi]+yi], ab=P[P[xi]+yi+1]
  const ba=P[P[xi+1]+yi], bb=P[P[xi+1]+yi+1]
  return lerp(
    lerp(grad(aa,xf,yf),     grad(ba,xf-1,yf),   u),
    lerp(grad(ab,xf,yf-1),   grad(bb,xf-1,yf-1), u),
    v
  )
}

export function fbm(x: number, y: number, octaves = 4, lacunarity = 2.0, gain = 0.5) {
  let val = 0, amp = 0.5, freq = 1
  for (let i = 0; i < octaves; i++) {
    val += perlin(x*freq, y*freq) * amp
    freq *= lacunarity; amp *= gain
  }
  return val
}

export function rand(min: number, max: number) {
  return min + Math.random() * (max - min)
}
export function randInt(min: number, max: number) {
  return Math.floor(rand(min, max + 1))
}
