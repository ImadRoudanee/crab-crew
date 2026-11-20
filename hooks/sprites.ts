// Pixel sprites for the crab crew: a Claude-orange crab, 16x12 pixels, plus
// one accessory set per persona. Layers are drawn in local crab coordinates
// and placed on a 20x18 canvas (2px walking room each side, 5px above for hats).

export const W = 20
export const H = 18
const X0 = 2
const Y0 = 5

export const PAL: Record<string, string> = {
  O: '#D97757', // Claude orange
  D: '#A9512F', // shade / legs
  C: '#E58A6B', // claws
  E: '#1E1B19', // eyes
  K: '#1E1B19', // black (hat, shades, brows)
  W: '#FFFFFF',
  R: '#C0392B',
  G: '#E6B422',
  Y: '#F7D046',
  P: '#B05CE0',
  F: '#FF7EB6', // pink bow
  Q: '#D9468F',
  B: '#3B7DDD',
  S: '#5FB4FF', // sweat
  Z: '#8C9BC4',
  V: '#2FB36B', // done check
  X: '#8A8A8A', // failed body
}

export type Layer = { y: number; rows: string[] }

const L = (y: number, ...rows: string[]): Layer => ({ y, rows })

export const BODY = L(4,
  '..OOOOOOOOOOOO..',
  '.OOOOOOOOOOOOOO.',
  '.OOOOOOOOOOOOOO.',
  '.OOOOOOOOOOOOOO.',
  '.OOOOOOOOOOOOOO.',
  '..DDDDDDDDDDDD..')
export const CLAWS_OPEN = L(0,
  'C.C..........C.C',
  'C.C..........C.C',
  'CCC..........CCC',
  '.C............C.',
  '.C............C.')
export const CLAWS_SNAP = L(0,
  '................',
  '.C............C.',
  'CCC..........CCC',
  '.C............C.',
  '.C............C.')
export const LEGS_A = L(10, '..D.D.D..D.D.D..', '.D.D.D....D.D.D.')
export const LEGS_B = L(10, '..D.D.D..D.D.D..', '..D.D.D..D.D.D..')

export const EYES = L(5, '....E......E....', '....E......E....')
export const EYES_SHUT = L(6, '...EE......EE...')
export const EYES_HAPPY = L(5, '....E......E....', '...E.E....E.E...')
export const EYES_X = L(5, '...E.E....E.E...', '....E......E....', '...E.E....E.E...')
export const EYES_SLEEPY = L(6, '...EE......EE...')
export const EYES_WIDE = L(5, '...WW......WW...', '...WE......EW...')

export const CHECK = L(-4,
  '...............V',
  '..............V.',
  '...........V.V..',
  '............V...')

// A "!" speech bubble, drawn above the crab while it waits for a permission answer.
export const ASK = L(-5,
  '..........WWWWW.',
  '..........WWRWW.',
  '..........WWRWW.',
  '..........WWWWW.',
  '..........WWRWW.')

export type Quirk = 'none' | 'sparkle' | 'zzz' | 'glint' | 'sweat'

export type Look = {
  hat: Layer[]       // static accessories drawn over the body
  eyes: Layer        // eyes while working
  quirk: Quirk
  quirkLayer?: Layer // the animated extra
  walkSec: number    // one walk cycle
  clawSec: number    // one claw snap
  hop: boolean
}

export const LOOKS: Look[] = [
  // Pinchy: the classic
  { hat: [], eyes: EYES, quirk: 'none', walkSec: 1.6, clawSec: 0.5, hop: false },
  // Sir Clawsworth: top hat + monocle
  { hat: [
      L(-1, '......KKKK......', '......KKKK......', '......KKKK......', '......RRRR......', '....KKKKKKKK....'),
      L(4, '..........GGG...', '..........G.G...', '..........G.G...', '..........GGG...', '............G...'),
    ], eyes: EYES, quirk: 'none', walkSec: 2.2, clawSec: 0.9, hop: false },
  // Grumpy Gus: angry brows
  { hat: [L(4, '...KK......KK...', '.....K....K.....')],
    eyes: EYES, quirk: 'none', walkSec: 2.0, clawSec: 0.35, hop: false },
  // Disco Dee: party hat + sparkles, hops
  { hat: [L(-2, '.......YY.......', '.......PP.......', '......PYYP......', '......PPPP......', '.....YYYYYY.....', '.....PPPPPP.....')],
    eyes: EYES, quirk: 'sparkle',
    quirkLayer: L(-4, '.Y............Y.', 'YYY..........YYY', '.Y............Y.'),
    walkSec: 0.9, clawSec: 0.3, hop: true },
  // Sleepy Sam: nightcap, drowsy eyes, floating Zs
  { hat: [L(-2, '..........W.....', '........BB......', '.......BBB......', '......BBBB......', '.....BBBBBB.....', '....WWWWWWWW....')],
    eyes: EYES_SLEEPY, quirk: 'zzz',
    quirkLayer: L(-5, '............ZZZ.', '.............Z..', '............ZZZ.'),
    walkSec: 3.4, clawSec: 1.4, hop: false },
  // Cool Carl: shades with a glint
  { hat: [L(5, '...KKKKKKKKKK...', '...KKK....KKK...')],
    eyes: L(5, '................'), quirk: 'glint',
    quirkLayer: L(5, '....W.......W...'),
    walkSec: 1.8, clawSec: 0.7, hop: false },
  // Nervous Ned: wide eyes, sweat drop, jittery
  { hat: [], eyes: EYES_WIDE, quirk: 'sweat',
    quirkLayer: L(4, '...............S', '...............S'),
    walkSec: 0.7, clawSec: 0.25, hop: false },
  // Baby Bo: pink bow
  { hat: [L(2, '.....FF..FF.....', '.....FFQQFF.....')],
    eyes: EYES, quirk: 'none', walkSec: 1.2, clawSec: 0.45, hop: true },
]

// ---------- SVG (desktop, vscode, mobile): animated with CSS ----------

function rects(layer: Layer, recolor?: (c: string) => string): string {
  let out = ''
  layer.rows.forEach((row, ry) => {
    let x = 0
    while (x < row.length) {
      const ch = row[x]
      if (ch === '.') { x++; continue }
      let end = x
      while (end < row.length && row[end] === ch) end++
      const fill = recolor ? recolor(ch) : PAL[ch]
      out += `<rect x="${X0 + x}" y="${Y0 + layer.y + ry}" width="${end - x}" height="1" fill="${fill}"/>`
      x = end
    }
  })
  return out
}

const CSS = `
.walk{animation:walk var(--w) steps(1,end) infinite}
@keyframes walk{0%{transform:translate(0,0)}12.5%{transform:translate(1px,0)}25%{transform:translate(2px,0)}37.5%{transform:translate(1px,0)}50%{transform:translate(0,0)}62.5%{transform:translate(-1px,0)}75%{transform:translate(-2px,0)}87.5%{transform:translate(-1px,0)}}
.hop{animation:hop calc(var(--w) / 4) steps(1,end) infinite}
@keyframes hop{0%{transform:translate(0,0)}50%{transform:translate(0,-1px)}}
.a{animation:on var(--c) steps(1,end) infinite}
.b{animation:off var(--c) steps(1,end) infinite}
.la{animation:on calc(var(--w) / 8) steps(1,end) infinite}
.lb{animation:off calc(var(--w) / 8) steps(1,end) infinite}
@keyframes on{0%{opacity:1}50%{opacity:0}}
@keyframes off{0%{opacity:0}50%{opacity:1}}
.eo{animation:eo 3.3s steps(1,end) infinite}
.ec{animation:ec 3.3s steps(1,end) infinite}
@keyframes eo{0%{opacity:1}93%{opacity:0}}
@keyframes ec{0%{opacity:0}93%{opacity:1}}
.sparkle{animation:on .7s steps(1,end) infinite}
.zzz{animation:zzz 2.4s linear infinite}
@keyframes zzz{0%{transform:translate(0,2px);opacity:0}20%{opacity:1}100%{transform:translate(2px,-2px);opacity:0}}
.glint{animation:glint 2.6s steps(1,end) infinite}
@keyframes glint{0%{opacity:0}85%{opacity:1}92%{opacity:0}}
.sweat{animation:sweat 1.1s steps(3,end) infinite}
@keyframes sweat{0%{transform:translate(0,0);opacity:1}100%{transform:translate(0,3px);opacity:0}}
`

export type Mood = 'working' | 'asking' | 'done' | 'failed' | 'waiting'

export function crabSvg(seat: number, mood: Mood, px = 4): string {
  const look = LOOKS[seat % LOOKS.length]
  const delay = `-${((seat * 0.37) % 1.7).toFixed(2)}s`
  const grey = mood === 'failed' ? (c: string) => (c === 'O' || c === 'C' ? PAL.X : PAL[c]) : undefined
  const hats = look.hat.map(h => rects(h, grey)).join('')
  let inner: string

  if (mood === 'working') {
    inner =
      `<g class="${look.hop ? 'hop' : ''}" style="animation-delay:${delay}">` +
      `<g class="walk" style="animation-delay:${delay}">` +
      rects(BODY) +
      `<g class="la">${rects(LEGS_A)}</g><g class="lb">${rects(LEGS_B)}</g>` +
      `<g class="a">${rects(CLAWS_OPEN)}</g><g class="b">${rects(CLAWS_SNAP)}</g>` +
      `<g class="eo">${rects(look.eyes)}</g><g class="ec">${rects(EYES_SHUT)}</g>` +
      hats +
      (look.quirkLayer ? `<g class="${look.quirk}">${rects(look.quirkLayer)}</g>` : '') +
      `</g></g>`
  } else if (mood === 'asking') {
    // Hopping in place, claws waving, wide eyes, a blinking "!" bubble.
    inner =
      `<g class="hop" style="animation-delay:${delay}">` +
      rects(BODY) + rects(LEGS_B) +
      `<g class="la">${rects(CLAWS_OPEN)}</g><g class="lb">${rects(CLAWS_SNAP)}</g>` +
      rects(EYES_WIDE) + hats +
      `<g class="sparkle">${rects(ASK)}</g>` +
      `</g>`
  } else {
    const eyes = mood === 'done' ? EYES_HAPPY : mood === 'failed' ? EYES_X : EYES_SHUT
    inner =
      rects(BODY, grey) + rects(LEGS_B, grey) + rects(CLAWS_OPEN, grey) +
      rects(eyes) + hats + (mood === 'done' ? rects(CHECK) : '')
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W * px}" height="${H * px}" ` +
    `shape-rendering="crispEdges" style="--w:${look.walkSec}s;--c:${look.clawSec}s">` +
    `<style>${CSS}</style>${inner}</svg>`
  )
}

// ---------- Raster (terminal): half-block cells, animated by frame ----------

const DEFAULT = 0x01000000
const hex = (c: string) => parseInt(c.slice(1), 16)

function paint(grid: (string | null)[][], layer: Layer, dx: number, dy: number, recolor?: (c: string) => string) {
  layer.rows.forEach((row, ry) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x]
      if (ch === '.') continue
      const gx = X0 + x + dx
      const gy = Y0 + layer.y + ry + dy
      if (gx < 0 || gx >= W || gy < 0 || gy >= H) continue
      grid[gy][gx] = recolor ? recolor(ch) : PAL[ch]
    }
  })
}

const STEP = [0, 1, 2, 1, 0, -1, -2, -1]

export function crabGrid(seat: number, mood: Mood, frame: number): (string | null)[][] {
  const look = LOOKS[seat % LOOKS.length]
  const grid: (string | null)[][] = Array.from({ length: H }, () => Array(W).fill(null))
  const grey = mood === 'failed' ? (c: string) => (c === 'O' || c === 'C' ? PAL.X : PAL[c]) : undefined
  const t = frame + seat * 3
  const asking = mood === 'asking'
  const working = mood === 'working'
  const dx = working ? STEP[t % 8] : 0
  const dy = (asking || (working && look.hop)) && t % 2 ? -1 : 0
  const alt = (working || asking) && t % 2 === 1

  paint(grid, BODY, dx, dy, grey)
  paint(grid, alt ? LEGS_A : LEGS_B, dx, dy, grey)
  paint(grid, alt ? CLAWS_SNAP : CLAWS_OPEN, dx, dy, grey)
  const eyes = mood === 'done' ? EYES_HAPPY : mood === 'failed' ? EYES_X : asking ? EYES_WIDE
    : mood === 'waiting' || t % 9 === 0 ? EYES_SHUT : look.eyes
  paint(grid, eyes, dx, dy)
  if (asking && t % 2 === 0) paint(grid, ASK, 0, 0)
  for (const h of look.hat) paint(grid, h, dx, dy, grey)
  if (working && look.quirkLayer && t % 2 === 0) paint(grid, look.quirkLayer, dx, dy)
  if (mood === 'done') paint(grid, CHECK, 0, 0)

  return grid
}

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

function toBase64(bytes: Uint8Array): string {
  let out = ''
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i], b = bytes[i + 1], c = bytes[i + 2]
    const n = (a << 16) | ((b ?? 0) << 8) | (c ?? 0)
    out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63]
    out += i + 1 < bytes.length ? B64[(n >> 6) & 63] : '='
    out += i + 2 < bytes.length ? B64[n & 63] : '='
  }
  return out
}

// One cell = two stacked pixels: '▀' painted top in fg, bottom in bg.
export function crabCells(grid: (string | null)[][]): { columns: number; rows: number; cells: string } {
  const rows = H / 2
  const words = new Uint32Array(W * rows * 3)
  let i = 0
  for (let r = 0; r < rows; r++) {
    for (let x = 0; x < W; x++) {
      const top = grid[r * 2][x]
      const bot = grid[r * 2 + 1][x]
      if (!top && !bot) {
        words[i++] = 0x20; words[i++] = DEFAULT; words[i++] = DEFAULT
      } else if (top) {
        words[i++] = 0x2580; words[i++] = hex(top); words[i++] = bot ? hex(bot) : DEFAULT
      } else {
        words[i++] = 0x2584; words[i++] = hex(bot as string); words[i++] = DEFAULT
      }
    }
  }
  return { columns: W, rows, cells: toBase64(new Uint8Array(words.buffer)) }
}
