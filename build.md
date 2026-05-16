# Neon District — City Visual Rewrite Spec

> Reference images analyzed: `kitbash-bundle.jpg`, `vol-3.jpg`, `futuristic-city.jpg`
> Target look: **vol-3** (charcoal setback towers, rooftop clutter, sparse windows, large vertical signs)

---

## What's Wrong Right Now

| Problem | Root Cause |
|---|---|
| Buildings look like LED screens | Window density too high, wall base color not dark enough, bands glow on entire surface |
| No sense of 3D depth on facades | No ledge geometry — all detail is shader-only |
| Signs are tiny/unnoticeable | 8–20 unit `PlaneGeometry` tiles with low-res canvas art |
| Rooftops are flat | No mechanical clutter geometry |
| Neon everywhere = neon nowhere | Bands + edge strips + Fresnel all active → everything glows equally |

---

## Target Aesthetic (from refs)

- Walls: **near-black** (`#050508` range) paneled concrete/metal — NOT glowing
- Windows: sparse, small, individually lit — ~20–40% occupancy, **not a grid**
- Setback silhouette: clearly stepped (already have sectionLow/Mid/Top — keep this)
- Ledges: **visible horizontal floor plates** every N floors — real geometry, not shader lines
- Signs: **large** (20–60 unit wide) illuminated billboard screens mounted flush on faces
- Rooftops: boxes, cylinders, dish shapes on top — only on taller buildings
- Neon: only on **sign panels** and **corner edge strips** — walls stay dark

---

## File-by-File Changes

### 1. `src/shaders/index.ts` — `buildingFrag`

#### Wall base
```glsl
vec3 color = vec3(0.018, 0.018, 0.026); // charcoal, nearly black
```

#### Window grid — SPARSE
- Density: fixed `16.0` columns × `24.0` rows (not height-scaled — avoids LED look)
- `frame` mask: thicker borders (`step(0.22, wFrac.x) * step(0.18, wFrac.y) ...`) → small windows
- Only 30% of windows lit (`step(0.70, wh)` not 0.28)
- No flicker — static on/off per window seed
- Colors: warm amber `(1.0, 0.75, 0.35) * 1.4` or cool blue `(0.4, 0.6, 1.0) * 1.2` — subtle, NOT × 3.0
- No purple/neon windows — building interior light only

#### Neon bands — REMOVED from wall shader
- Delete `band1`, `band2` from `buildingFrag`
- Neon bands exist only on **sign geometry** (separate meshes)

#### Edge strips — REDUCED
```glsl
float edgeGlow = (1.0 - smoothstep(0.0, 0.008, vUv.x)) +
                 (1.0 - smoothstep(0.0, 0.008, 1.0 - vUv.x));
color += edgeGlow * vNeonColor * 0.6; // was 1.8
```
No pulse animation on edges — static glow only.

#### Fresnel — REMOVED or minimal
```glsl
// Remove entirely — Fresnel was making every surface glow
```

#### Rooftop cap — keep but reduce
```glsl
float roofLine = smoothstep(0.985, 1.0, vUv.y);
color += roofLine * vNeonColor * 2.0; // was 4.0
```

#### Panel lines (new — replaces grain)
```glsl
// Vertical panel seams every ~12% of UV width
float panelSeam = 1.0 - smoothstep(0.0, 0.006, fract(vUv.x * 8.0));
color -= panelSeam * 0.008;
// Horizontal panel seams every 4 floors
float hSeam = 1.0 - smoothstep(0.0, 0.004, fract(vUv.y * (density / 4.0)));
color -= hSeam * 0.006;
```

---

### 2. `src/city/CityGenerator.ts` — Geometry additions

#### A. Ledge rings (floor plates)
For each building where `h > 30`, add thin `BoxGeometry(1, 0.6, 1)` ledge instances:
- Every `ledgeStep` floors (e.g., every 4th floor = every `h/density * 4` units in world space)
- Scale X and Z to `fw + 0.8` and `fd + 0.8` (slightly wider than building = overhang)
- Scale Y to `0.6` (thin slab)
- Same neon color but `MeshBasicMaterial` with `color: 0x111118` (dark, no emission)
- Add 2–4 ledges per sectionLow, 1 per sectionMid
- Use a **single InstancedMesh** `meshLedge` with max count `GRID*GRID*6`

```typescript
meshLedge: THREE.InstancedMesh  // dark BoxGeometry(1,0.6,1), dark material
```

#### B. Large billboard screens on building faces
Replace `addFacadeSigns()` entirely.

New method `addBillboardScreens(scene)`:
- Canvas texture: **512×256** each, drawn as:
  - Full black background
  - Large neon text (project code / kanji / warning text / hazard pattern)
  - Inner glow effect (shadow blur in canvas)
  - Thick neon border
- Screen sizes: `rand(18, 50)` wide × `rand(10, 28)` tall (big, not tiny)
- Placement: on sectionLow face only, at `rand(h*0.3, h*0.55)` height
- Offset from face: `0.3` units (flush-mounted look)
- Material: `MeshBasicMaterial({ map, transparent: false, side: FrontSide })`
  - **No additive blending** — solid panels look more physical
- Count: ~150 screens total (quality over quantity)
- 8 distinct canvas designs, one `CanvasTexture` each:
  1. Cyan circuit schematic
  2. Magenta `DANGER / 危険` bilingual
  3. Amber price/stock ticker numbers
  4. White/blue tech corp logo (concentric hexagons)
  5. Orange construction hazard diagonal
  6. Green matrix cascade
  7. Purple `RESTRICTED ACCESS` 
  8. Red emergency alert pattern

#### C. Rooftop equipment
New method `addRooftopEquipment(scene)`:
- 3 geometry types:
  - `BoxGeometry(1,1,1)` — mechanical rooms / HVAC boxes
  - `CylinderGeometry(0.5, 0.5, 1, 8)` — water towers / tanks
  - `CylinderGeometry(0.05, 2, 0.8, 12)` — satellite dish (cone approximation)
- All use `MeshBasicMaterial({ color: 0x0a0a12 })` — dark, no glow
- Placed on top of buildings where `h > 60` (15% chance)
- Scale varies: box `rand(2,6) × rand(3,8) × rand(2,6)`, cylinder `rand(2,5)` radius
- Y position: exactly at `h + halfHeight`
- One InstancedMesh per type, max 200 instances each

#### D. Remove / reduce
- `discMeshes` (rooftop glow discs) — remove entirely, replaced by equipment
- `addFacadeSigns()` — replaced by `addBillboardScreens()`

---

### 3. `src/main.ts`
Replace calls:
```typescript
// REMOVE:
city.addFacadeSigns(scene)

// ADD:
city.addBillboardScreens(scene)
city.addRooftopEquipment(scene)
city.addSearchlights(scene)
```

---

### 4. `src/effects/PostProcessing.ts` — Bloom tuning
Current bloom `luminanceThreshold: 0.25` picks up every window → hazy glow everywhere.

```typescript
const bloom = new BloomEffect({
  blendFunction: BlendFunction.ADD,
  luminanceThreshold: 0.55,   // was 0.25 — only very bright signs bloom
  luminanceSmoothing: 0.3,    // was 0.4
  intensity: 3.2,             // was 2.4 — stronger but targeted
  radius: 0.5,                // was 0.6
})
```

---

## Instance Budget

| Mesh | Max Count | Notes |
|---|---|---|
| sectionLow | 1024 | unchanged |
| sectionMid | 1024 | unchanged |
| sectionTop | 1024 | unchanged |
| meshD (needles) | 1024 | unchanged |
| meshLedge | 6144 | new — dark floor plates |
| billboard screens | 150 | 8 separate meshes × ~20 each |
| rooftopBox | 200 | new HVAC/mech |
| rooftopCylinder | 200 | new tanks |
| rooftopDish | 200 | new dishes |
| searchlights | 80 | unchanged |

Total draw calls added: ~15 (all InstancedMesh — fine)

---

## Visual Priority Order (implement top-down)

1. **Shader fix first** — darkening walls + sparse windows transforms look immediately
2. **Ledge rings** — instant 3D depth, most impactful geometry addition
3. **Billboard screens** — replace tiny signs with imposing panels
4. **Bloom retune** — prevent everything-is-bloomed look
5. **Rooftop equipment** — polish pass

---

## Do NOT change
- `buildingVert` — vertex shader is correct, attributes are fixed
- `CameraPath.ts` — billboard camera positions working
- `PanelEnv.ts` / `EnvironmentManager.ts` — project billboards working
- `groundFrag` — wet street reflections are good
- `sectionLow/Mid/Top` setback system — geometry is correct
