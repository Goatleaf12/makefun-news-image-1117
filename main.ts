// news-image-20261117 — "THE TUESDAY PAPER"
// A program that draws one front page summing up Tuesday 17 November 2026
// in a single 1024x1024 PNG. Node 22+ standard library only (node:fs,
// node:path, node:zlib). No network, no Date.now, no randomness: every run
// writes byte-identical output.
//
// The page is drawn by hand: a cream broadsheet, a big dated masthead, one
// lead story with a drawn bridge, six featured stories with flat vector
// icons, a pinned world map, a "BY THE NUMBERS" box, a two-column
// "ALSO ON TUESDAY" list (20 more stories), and a sources footer.
// Every story comes from reporting of 17 November 2026; disputed claims
// are attributed in the text itself ("Russia says ...", "Iran says ...").
//
// Run:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { deflateSync } from "node:zlib";

const W = 1024;
const H = 1024;

// ---------------------------------------------------------------- palette
const PAPER: RGB = [246, 239, 219];
const PAPER2: RGB = [238, 229, 203];
const INK: RGB = [25, 23, 19];
const RED: RGB = [163, 51, 39];
const BLUE: RGB = [31, 78, 121];
const TEAL: RGB = [15, 106, 96];
const GOLD: RGB = [176, 132, 38];
const SEA: RGB = [214, 228, 235];
const LAND: RGB = [196, 205, 168];
const SKY: RGB = [186, 210, 224];
const GREY: RGB = [90, 86, 78];
const WHITE: RGB = [255, 255, 255];

type RGB = [number, number, number];

// ------------------------------------------------------------- 5x7 font
// Each glyph: 7 rows, 5 bits each (bit 4 = leftmost column). Written from
// scratch for this page; capitals, lowercase, digits and punctuation.
const FONT: Record<string, number[]> = {
  A: [0x0e, 0x11, 0x11, 0x1f, 0x11, 0x11, 0x11],
  B: [0x1e, 0x11, 0x11, 0x1e, 0x11, 0x11, 0x1e],
  C: [0x0e, 0x11, 0x10, 0x10, 0x10, 0x11, 0x0e],
  D: [0x1e, 0x11, 0x11, 0x11, 0x11, 0x11, 0x1e],
  E: [0x1f, 0x10, 0x10, 0x1e, 0x10, 0x10, 0x1f],
  F: [0x1f, 0x10, 0x10, 0x1e, 0x10, 0x10, 0x10],
  G: [0x0e, 0x11, 0x10, 0x17, 0x11, 0x11, 0x0f],
  H: [0x11, 0x11, 0x11, 0x1f, 0x11, 0x11, 0x11],
  I: [0x0e, 0x04, 0x04, 0x04, 0x04, 0x04, 0x0e],
  J: [0x07, 0x02, 0x02, 0x02, 0x02, 0x12, 0x0c],
  K: [0x11, 0x12, 0x14, 0x18, 0x14, 0x12, 0x11],
  L: [0x10, 0x10, 0x10, 0x10, 0x10, 0x10, 0x1f],
  M: [0x11, 0x1b, 0x15, 0x15, 0x11, 0x11, 0x11],
  N: [0x11, 0x19, 0x15, 0x13, 0x11, 0x11, 0x11],
  O: [0x0e, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0e],
  P: [0x1e, 0x11, 0x11, 0x1e, 0x10, 0x10, 0x10],
  Q: [0x0e, 0x11, 0x11, 0x11, 0x15, 0x12, 0x0d],
  R: [0x1e, 0x11, 0x11, 0x1e, 0x14, 0x12, 0x11],
  S: [0x0f, 0x10, 0x10, 0x0e, 0x01, 0x01, 0x1e],
  T: [0x1f, 0x04, 0x04, 0x04, 0x04, 0x04, 0x04],
  U: [0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0e],
  V: [0x11, 0x11, 0x11, 0x11, 0x11, 0x0a, 0x04],
  W: [0x11, 0x11, 0x11, 0x15, 0x15, 0x1b, 0x11],
  X: [0x11, 0x11, 0x0a, 0x04, 0x0a, 0x11, 0x11],
  Y: [0x11, 0x11, 0x0a, 0x04, 0x04, 0x04, 0x04],
  Z: [0x1f, 0x01, 0x02, 0x04, 0x08, 0x10, 0x1f],
  a: [0x00, 0x00, 0x0e, 0x01, 0x0f, 0x11, 0x0f],
  b: [0x10, 0x10, 0x1e, 0x11, 0x11, 0x11, 0x1e],
  c: [0x00, 0x00, 0x0e, 0x10, 0x10, 0x11, 0x0e],
  d: [0x01, 0x01, 0x0f, 0x11, 0x11, 0x11, 0x0f],
  e: [0x00, 0x00, 0x0e, 0x11, 0x1f, 0x10, 0x0e],
  f: [0x06, 0x08, 0x08, 0x1e, 0x08, 0x08, 0x08],
  g: [0x00, 0x0f, 0x11, 0x11, 0x0f, 0x01, 0x0e],
  h: [0x10, 0x10, 0x1e, 0x11, 0x11, 0x11, 0x11],
  i: [0x04, 0x00, 0x0c, 0x04, 0x04, 0x04, 0x0e],
  j: [0x02, 0x00, 0x06, 0x02, 0x02, 0x12, 0x0c],
  k: [0x10, 0x10, 0x12, 0x14, 0x18, 0x14, 0x12],
  l: [0x0c, 0x04, 0x04, 0x04, 0x04, 0x04, 0x0e],
  m: [0x00, 0x00, 0x1a, 0x15, 0x15, 0x15, 0x15],
  n: [0x00, 0x00, 0x1e, 0x11, 0x11, 0x11, 0x11],
  o: [0x00, 0x00, 0x0e, 0x11, 0x11, 0x11, 0x0e],
  p: [0x00, 0x00, 0x1e, 0x11, 0x11, 0x1e, 0x10],
  q: [0x00, 0x00, 0x0f, 0x11, 0x11, 0x0f, 0x01],
  r: [0x00, 0x00, 0x16, 0x19, 0x10, 0x10, 0x10],
  s: [0x00, 0x00, 0x0f, 0x10, 0x0e, 0x01, 0x1e],
  t: [0x08, 0x08, 0x1e, 0x08, 0x08, 0x09, 0x06],
  u: [0x00, 0x00, 0x11, 0x11, 0x11, 0x13, 0x0d],
  v: [0x00, 0x00, 0x11, 0x11, 0x11, 0x0a, 0x04],
  w: [0x00, 0x00, 0x11, 0x11, 0x15, 0x15, 0x0a],
  x: [0x00, 0x00, 0x11, 0x0a, 0x04, 0x0a, 0x11],
  y: [0x00, 0x00, 0x11, 0x11, 0x0f, 0x01, 0x0e],
  z: [0x00, 0x00, 0x1f, 0x02, 0x04, 0x08, 0x1f],
  "0": [0x0e, 0x11, 0x13, 0x15, 0x19, 0x11, 0x0e],
  "1": [0x04, 0x0c, 0x04, 0x04, 0x04, 0x04, 0x0e],
  "2": [0x0e, 0x11, 0x01, 0x06, 0x08, 0x10, 0x1f],
  "3": [0x1f, 0x02, 0x04, 0x02, 0x01, 0x11, 0x0e],
  "4": [0x02, 0x06, 0x0a, 0x12, 0x1f, 0x02, 0x02],
  "5": [0x1f, 0x10, 0x1e, 0x01, 0x01, 0x11, 0x0e],
  "6": [0x06, 0x08, 0x10, 0x1e, 0x11, 0x11, 0x0e],
  "7": [0x1f, 0x01, 0x02, 0x04, 0x08, 0x08, 0x08],
  "8": [0x0e, 0x11, 0x11, 0x0e, 0x11, 0x11, 0x0e],
  "9": [0x0e, 0x11, 0x11, 0x0f, 0x01, 0x02, 0x0c],
  " ": [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
  ".": [0x00, 0x00, 0x00, 0x00, 0x00, 0x0c, 0x0c],
  ",": [0x00, 0x00, 0x00, 0x00, 0x0c, 0x04, 0x08],
  "!": [0x04, 0x04, 0x04, 0x04, 0x04, 0x00, 0x04],
  "?": [0x0e, 0x11, 0x01, 0x02, 0x04, 0x00, 0x04],
  "-": [0x00, 0x00, 0x00, 0x0e, 0x00, 0x00, 0x00],
  "'": [0x04, 0x04, 0x08, 0x00, 0x00, 0x00, 0x00],
  '"': [0x0a, 0x0a, 0x00, 0x00, 0x00, 0x00, 0x00],
  "(": [0x02, 0x04, 0x08, 0x08, 0x08, 0x04, 0x02],
  ")": [0x08, 0x04, 0x02, 0x02, 0x02, 0x04, 0x08],
  "/": [0x01, 0x01, 0x02, 0x04, 0x08, 0x10, 0x10],
  "&": [0x0c, 0x12, 0x14, 0x08, 0x15, 0x12, 0x0d],
  "%": [0x19, 0x19, 0x02, 0x04, 0x08, 0x13, 0x13],
  $: [0x04, 0x0f, 0x14, 0x0e, 0x05, 0x1e, 0x04],
  "+": [0x00, 0x04, 0x04, 0x0e, 0x04, 0x04, 0x00],
  "=": [0x00, 0x00, 0x1f, 0x00, 0x1f, 0x00, 0x00],
  ";": [0x00, 0x0c, 0x00, 0x0c, 0x04, 0x08, 0x00],
  ":": [0x00, 0x0c, 0x00, 0x00, 0x00, 0x0c, 0x00],
  "·": [0x00, 0x00, 0x00, 0x0c, 0x0c, 0x00, 0x00],
  "—": [0x00, 0x00, 0x00, 0x1f, 0x00, 0x00, 0x00],
  "#": [0x0a, 0x0a, 0x1f, 0x0a, 0x1f, 0x0a, 0x0a],
  "*": [0x00, 0x04, 0x15, 0x0e, 0x15, 0x04, 0x00],
};

// ---------------------------------------------------------------- canvas
class Canvas {
  buf: Uint8Array;
  constructor() {
    this.buf = new Uint8Array(W * H * 3);
    this.fill(PAPER);
  }
  fill(c: RGB): void {
    for (let i = 0; i < W * H; i++) {
      this.buf[i * 3] = c[0];
      this.buf[i * 3 + 1] = c[1];
      this.buf[i * 3 + 2] = c[2];
    }
  }
  px(x: number, y: number, c: RGB): void {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = (y * W + x) * 3;
    this.buf[i] = c[0];
    this.buf[i + 1] = c[1];
    this.buf[i + 2] = c[2];
  }
  rect(x: number, y: number, w: number, h: number, c: RGB): void {
    for (let yy = y; yy < y + h; yy++)
      for (let xx = x; xx < x + w; xx++) this.px(xx, yy, c);
  }
  // frame: 1px outline
  frame(x: number, y: number, w: number, h: number, c: RGB): void {
    this.rect(x, y, w, 1, c);
    this.rect(x, y + h - 1, w, 1, c);
    this.rect(x, y, 1, h, c);
    this.rect(x + w - 1, y, 1, h, c);
  }
  line(x0: number, y0: number, x1: number, y1: number, c: RGB): void {
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    let x = x0;
    let y = y0;
    for (;;) {
      this.px(x, y, c);
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y += sy;
      }
    }
  }
  // thick line: draw as a stack of parallel 1px lines
  thickLine(x0: number, y0: number, x1: number, y1: number, t: number, c: RGB): void {
    for (let k = 0; k < t; k++) this.line(x0, y0 + k, x1, y1 + k, c);
  }
  circle(cx: number, cy: number, r: number, c: RGB): void {
    for (let yy = -r; yy <= r; yy++)
      for (let xx = -r; xx <= r; xx++)
        if (xx * xx + yy * yy <= r * r) this.px(cx + xx, cy + yy, c);
  }
  ring(cx: number, cy: number, r: number, c: RGB): void {
    for (let a = 0; a < 360; a += 2) {
      const rad = (a * Math.PI) / 180;
      this.px(Math.round(cx + r * Math.cos(rad)), Math.round(cy + r * Math.sin(rad)), c);
    }
  }
  triangle(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, c: RGB): void {
    const minX = Math.min(x0, x1, x2);
    const maxX = Math.max(x0, x1, x2);
    const minY = Math.min(y0, y1, y2);
    const maxY = Math.max(y0, y1, y2);
    const d = (x1 - x0) * (y2 - y0) - (y1 - y0) * (x2 - x0);
    if (d === 0) return;
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const a = ((x1 - x) * (y2 - y) - (y1 - y) * (x2 - x)) / d;
        const b = ((x2 - x) * (y0 - y) - (y2 - y) * (x0 - x)) / d;
        const cc = 1 - a - b;
        if (a >= 0 && b >= 0 && cc >= 0) this.px(x, y, c);
      }
    }
  }
}

// -------------------------------------------------------------- PNG out
function crc32(buf: Buffer): number {
  let table = (crc32 as unknown as { t?: Int32Array }).t;
  if (!table) {
    table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
    (crc32 as unknown as { t: Int32Array }).t = table;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td), 0);
  return Buffer.concat([len, td, crc]);
}

function encodePNG(cv: Canvas): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0; // filter none
    Buffer.from(cv.buf.buffer, cv.buf.byteOffset + y * W * 3, W * 3).copy(
      raw,
      y * (1 + W * 3) + 1
    );
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ------------------------------------------------------------ text bits
const CHAR_ADV = 6; // glyph 5px + 1px gap, times scale

function textWidth(s: string, scale: number): number {
  return s.length * CHAR_ADV * scale - scale;
}

function drawChar(cv: Canvas, x: number, y: number, ch: string, scale: number, c: RGB): void {
  const g = FONT[ch] ?? FONT["?"];
  for (let r = 0; r < 7; r++) {
    const row = g[r];
    for (let col = 0; col < 5; col++) {
      if (row & (1 << (4 - col))) cv.rect(x + col * scale, y + r * scale, scale, scale, c);
    }
  }
}

function drawText(cv: Canvas, x: number, y: number, s: string, scale: number, c: RGB): number {
  let cx = x;
  for (const ch of s) {
    drawChar(cv, cx, y, ch, scale, c);
    cx += CHAR_ADV * scale;
  }
  return cx;
}

function drawTextCentered(cv: Canvas, cx: number, y: number, s: string, scale: number, c: RGB): void {
  drawText(cv, cx - Math.floor(textWidth(s, scale) / 2), y, s, scale, c);
}

// Greedy word wrap. Long words are split at the width limit.
function wrapText(s: string, maxWidth: number, scale: number): string[] {
  const maxChars = Math.max(1, Math.floor((maxWidth + scale) / (CHAR_ADV * scale)));
  const lines: string[] = [];
  for (const para of s.split("\n")) {
    const words = para.split(" ").filter((w) => w.length > 0);
    let cur = "";
    for (const w of words) {
      const word = w.length > maxChars ? w.slice(0, maxChars) : w;
      if (cur === "") cur = word;
      else if (cur.length + 1 + word.length <= maxChars) cur += " " + word;
      else {
        lines.push(cur);
        cur = word;
      }
    }
    if (cur !== "" || lines.length === 0) lines.push(cur);
  }
  return lines;
}

function drawPara(cv: Canvas, x: number, y: number, s: string, maxWidth: number, scale: number, c: RGB, leading: number): number {
  const lines = wrapText(s, maxWidth, scale);
  let yy = y;
  for (const ln of lines) {
    drawText(cv, x, yy, ln, scale, c);
    yy += leading;
  }
  return yy;
}

// ------------------------------------------------------------ flat icons
// Each icon is drawn in a small panel (x, y, w, h) with flat shapes.

function iconBridge(cv: Canvas, x: number, y: number, w: number, h: number): void {
  // sky + sea + a suspension bridge whose middle span has collapsed
  cv.rect(x, y, w, h, SKY);
  cv.rect(x, y + Math.floor(h * 0.62), w, h - Math.floor(h * 0.62), [58, 110, 138]);
  const deckY = y + Math.floor(h * 0.55);
  const towerH = Math.floor(h * 0.52);
  // towers
  cv.rect(x + Math.floor(w * 0.16), deckY - towerH, 7, towerH + 4, INK);
  cv.rect(x + Math.floor(w * 0.72), deckY - towerH, 7, towerH + 4, INK);
  // cables: left span intact, middle span sagging into the water
  cv.line(x + Math.floor(w * 0.16) + 3, deckY - towerH, x + Math.floor(w * 0.44), deckY - 4, INK);
  cv.line(x + Math.floor(w * 0.44), deckY - 4, x + Math.floor(w * 0.47), deckY + Math.floor(h * 0.16), RED);
  cv.line(x + Math.floor(w * 0.47), deckY + Math.floor(h * 0.16), x + Math.floor(w * 0.72) + 3, deckY - towerH, INK);
  // deck: left part, then a gap, then a tilted fallen piece
  cv.thickLine(x, deckY, x + Math.floor(w * 0.44), deckY, 4, INK);
  cv.thickLine(x + Math.floor(w * 0.72), deckY, x + w, deckY, 4, INK);
  cv.line(x + Math.floor(w * 0.44), deckY, x + Math.floor(w * 0.47), deckY + Math.floor(h * 0.16), RED);
  cv.line(x + Math.floor(w * 0.47), deckY + Math.floor(h * 0.16), x + Math.floor(w * 0.55), deckY + Math.floor(h * 0.2), RED);
  // smoke over the break
  cv.circle(x + Math.floor(w * 0.47), deckY - 14, 7, [120, 118, 110]);
  cv.circle(x + Math.floor(w * 0.5), deckY - 22, 9, [140, 138, 130]);
  cv.circle(x + Math.floor(w * 0.44), deckY - 24, 6, [120, 118, 110]);
  // waves
  for (let i = 0; i < 4; i++) {
    const wx = x + 8 + i * Math.floor(w / 4);
    cv.line(wx, y + h - 8, wx + 14, y + h - 8, WHITE);
  }
}

function iconTanker(cv: Canvas, x: number, y: number, w: number, h: number): void {
  cv.rect(x, y, w, h, SKY);
  cv.rect(x, y + Math.floor(h * 0.6), w, h - Math.floor(h * 0.6), [58, 110, 138]);
  const hy = y + Math.floor(h * 0.42);
  // hull
  cv.rect(x + 6, hy, w - 12, 16, RED);
  cv.triangle(x + w - 6, hy, x + w - 6, hy + 16, x + w + 2, hy + 8, RED);
  // deck + funnel with fire
  cv.rect(x + 12, hy - 12, w - 40, 12, INK);
  cv.rect(x + w - 30, hy - 26, 12, 14, INK);
  cv.triangle(x + w - 28, hy - 40, x + w - 22, hy - 26, x + w - 16, hy - 40, GOLD);
  cv.circle(x + w - 22, hy - 44, 5, GOLD);
  // mine + blast ring in the water
  cv.circle(x + 16, y + h - 12, 5, INK);
  cv.ring(x + 16, y + h - 12, 10, WHITE);
}

function iconHandshake(cv: Canvas, x: number, y: number, w: number, h: number): void {
  cv.rect(x, y, w, h, PAPER2);
  // two flags crossing + a small globe
  cv.line(x + 14, y + 10, x + 14, y + h - 12, INK);
  cv.line(x + w - 14, y + 10, x + w - 14, y + h - 12, INK);
  cv.rect(x + 14, y + 10, 26, 16, RED);
  cv.rect(x + 14, y + 10, 26, 5, WHITE);
  cv.rect(x + w - 40, y + 10, 26, 16, BLUE);
  cv.circle(x + w - 27, y + 18, 4, WHITE);
  cv.circle(x + Math.floor(w / 2), y + Math.floor(h * 0.62), 16, TEAL);
  cv.rect(x + Math.floor(w / 2) - 16, y + Math.floor(h * 0.62) - 2, 32, 3, WHITE);
  cv.rect(x + Math.floor(w / 2) - 2, y + Math.floor(h * 0.62) - 16, 3, 32, WHITE);
}

function iconBank(cv: Canvas, x: number, y: number, w: number, h: number): void {
  cv.rect(x, y, w, h, PAPER2);
  const bx = x + 12;
  const bw = w - 24;
  // pediment + columns + steps
  cv.triangle(bx, y + 18, bx + bw, y + 18, bx + Math.floor(bw / 2), y + 4, BLUE);
  cv.rect(bx, y + 20, bw, 4, BLUE);
  for (let i = 0; i < 4; i++) {
    const cx = bx + 6 + i * Math.floor((bw - 12) / 3);
    cv.rect(cx, y + 26, 6, Math.floor(h * 0.42), BLUE);
  }
  cv.rect(bx, y + 26 + Math.floor(h * 0.42), bw, 4, BLUE);
  cv.rect(bx - 4, y + h - 16, bw + 8, 4, BLUE);
  cv.rect(bx - 8, y + h - 10, bw + 16, 4, BLUE);
  // red outage bolt across the pediment
  cv.line(bx + Math.floor(bw / 2) + 12, y + 2, bx + Math.floor(bw / 2) - 2, y + 16, RED);
  cv.line(bx + Math.floor(bw / 2) - 2, y + 16, bx + Math.floor(bw / 2) + 6, y + 16, RED);
  cv.line(bx + Math.floor(bw / 2) + 6, y + 16, bx + Math.floor(bw / 2) - 8, y + 30, RED);
}

function iconChip(cv: Canvas, x: number, y: number, w: number, h: number): void {
  cv.rect(x, y, w, h, PAPER2);
  const cx = x + Math.floor(w / 2);
  const cy = y + Math.floor(h / 2);
  // chip body + pins + rising arrow
  cv.rect(cx - 20, cy - 14, 40, 28, INK);
  cv.rect(cx - 12, cy - 6, 24, 12, TEAL);
  for (let i = -1; i <= 1; i++) {
    cv.rect(cx + i * 14 - 2, cy - 22, 4, 8, INK);
    cv.rect(cx + i * 14 - 2, cy + 14, 4, 8, INK);
    cv.rect(cx - 28, cy + i * 10 - 2, 8, 4, INK);
    cv.rect(cx + 20, cy + i * 10 - 2, 8, 4, INK);
  }
  cv.line(cx - 26, cy + 26, cx - 8, cy + 8, RED);
  cv.line(cx - 8, cy + 8, cx + 12, cy - 12, RED);
  cv.line(cx + 12, cy - 12, cx + 26, cy - 26, RED);
  cv.triangle(cx + 26, cy - 26, cx + 14, cy - 26, cx + 26, cy - 14, RED);
}

function iconRocket(cv: Canvas, x: number, y: number, w: number, h: number): void {
  cv.rect(x, y, w, h, SKY);
  const cx = x + Math.floor(w / 2);
  const cy = y + Math.floor(h / 2);
  // rocket body, tilted, breaking apart
  cv.rect(cx - 7, cy - 26, 14, 40, WHITE);
  cv.frame(cx - 7, cy - 26, 14, 40, INK);
  cv.triangle(cx - 7, cy - 26, cx + 7, cy - 26, cx, cy - 38, RED);
  cv.rect(cx - 7, cy + 14, 14, 6, RED);
  cv.triangle(cx - 14, cy + 2, cx - 7, cy + 2, cx - 7, cy + 16, RED);
  cv.triangle(cx + 7, cy + 2, cx + 14, cy + 2, cx + 7, cy + 16, RED);
  // debris + smoke
  cv.circle(cx + 22, cy - 18, 4, INK);
  cv.circle(cx - 24, cy - 8, 3, INK);
  cv.circle(cx + 18, cy + 20, 3, GREY);
  cv.circle(cx, cy + 30, 6, GOLD);
  cv.circle(cx + 8, cy + 36, 8, [140, 138, 130]);
  // stars
  cv.px(x + 8, y + 8, WHITE);
  cv.px(x + w - 10, y + 12, WHITE);
  cv.px(x + 12, y + h - 10, WHITE);
}

function iconMapPin(cv: Canvas, x: number, y: number, w: number, h: number): void {
  cv.rect(x, y, w, h, PAPER2);
  const cx = x + Math.floor(w / 2);
  const cy = y + Math.floor(h / 2);
  // simplified Europe/Africa shapes + a return arrow
  cv.rect(cx - 22, cy - 24, 16, 12, LAND);
  cv.rect(cx - 18, cy - 12, 20, 8, LAND);
  cv.rect(cx - 14, cy + 2, 14, 18, LAND);
  cv.rect(cx + 4, cy - 20, 18, 10, LAND);
  cv.rect(cx + 8, cy - 10, 12, 8, LAND);
  cv.line(cx - 26, cy + 26, cx + 26, cy + 26, RED);
  cv.line(cx + 26, cy + 26, cx + 18, cy + 20, RED);
  cv.line(cx + 26, cy + 26, cx + 18, cy + 32, RED);
  cv.circle(cx + 20, cy - 26, 7, RED);
  cv.circle(cx + 20, cy - 26, 3, WHITE);
}

// ------------------------------------------------------------ world map
// A deliberately simple flat world map: sea panel, blocky continents,
// numbered pins for the featured stories.
type Pin = { n: number; x: number; y: number };

function drawMap(cv: Canvas, x: number, y: number, w: number, h: number, pins: Pin[]): void {
  cv.rect(x, y, w, h, SEA);
  cv.frame(x, y, w, h, INK);
  const L = LAND;
  // North America
  cv.rect(x + 28, y + 14, 120, 30, L);
  cv.rect(x + 48, y + 44, 84, 18, L);
  cv.rect(x + 28, y + 24, 30, 34, L);
  // South America
  cv.rect(x + 108, y + 78, 44, 26, L);
  cv.rect(x + 116, y + 104, 28, 14, L);
  // Europe
  cv.rect(x + 268, y + 12, 52, 22, L);
  cv.rect(x + 282, y + 34, 26, 10, L);
  // Africa
  cv.rect(x + 282, y + 48, 56, 40, L);
  cv.rect(x + 292, y + 88, 36, 14, L);
  // Asia
  cv.rect(x + 330, y + 10, 150, 34, L);
  cv.rect(x + 360, y + 44, 110, 20, L);
  cv.rect(x + 420, y + 64, 40, 18, L);
  // Australia
  cv.rect(x + 452, y + 96, 48, 18, L);
  // labels
  drawText(cv, x + 30, y + 2, "N. AMERICA", 1, GREY);
  drawText(cv, x + 104, y + 86, "S. AMERICA", 1, GREY);
  drawText(cv, x + 268, y + 2, "EUROPE", 1, GREY);
  drawText(cv, x + 284, y + 62, "AFRICA", 1, GREY);
  drawText(cv, x + 372, y + 20, "ASIA", 1, GREY);
  drawText(cv, x + 446, y + 84, "OCEANIA", 1, GREY);
  // pins
  for (const p of pins) {
    const px = x + p.x;
    const py = y + p.y;
    cv.circle(px, py, 9, RED);
    cv.circle(px, py, 9, RED);
    cv.triangle(px - 6, py + 5, px + 6, py + 5, px, py + 13, RED);
    drawTextCentered(cv, px, py - 7, String(p.n), 1, WHITE);
  }
  drawText(cv, x + 8, y + h - 14, "PIN NUMBERS MATCH THE STORIES ABOVE", 1, GREY);
}

// ------------------------------------------------------------- story data
// All stories happened or were first reported on Tuesday 17 November 2026.
// Disputed claims are attributed; intelligence claims are labelled as such.
type Story = { tag: string; color: RGB; head: string; body: string; icon: string; pin: Pin };

const LEAD = {
  tag: "EUROPE  ·  UKRAINE WAR",
  head: "KERCH BRIDGE SPAN COLLAPSES AFTER UKRAINIAN STRIKE",
  body: "A road span of the bridge to occupied Crimea fell into the strait on the second day of strikes. Zelenskyy called it an \"unprecedented operation\". Russia hit Kyiv's two Dnipro bridges in reply; the road crossing is shut.",
};

const FEATURED: Story[] = [
  {
    tag: "ASIA · DIPLOMACY", color: BLUE,
    head: "TRUMP LANDS IN MANILA AS CHINA CONFIRMS XI SUMMIT",
    body: "Trump in Manila; Xi-Trump-Putin meet set Thursday.",
    icon: "handshake", pin: { n: 2, x: 430, y: 44 },
  },
  {
    tag: "MIDDLE EAST · IRAN WAR", color: RED,
    head: "TWO TANKERS HIT BY MINES NEAR HORMUZ",
    body: "Tankers burn in Hormuz mines; third US carrier arrives.",
    icon: "tanker", pin: { n: 3, x: 350, y: 56 },
  },
  {
    tag: "USA · BANKING", color: BLUE,
    head: "JPMORGAN BLAMES SOFTWARE BUG FOR OUTAGE",
    body: "Banking, branches, Zelle down. Cause: a software bug.",
    icon: "bank", pin: { n: 4, x: 60, y: 28 },
  },
  {
    tag: "MARKETS · TECH", color: TEAL,
    head: "NVIDIA REPORTS AFTER THE BELL",
    body: "First since Huang resigned; $2.47 a share expected.",
    icon: "chip", pin: { n: 5, x: 120, y: 28 },
  },
  {
    tag: "SCIENCE · SPACE", color: TEAL,
    head: "VULCAN ROCKET FAILS, 40 SATELLITES LOST",
    body: "Fails minutes after launch; 40 satellites destroyed.",
    icon: "rocket", pin: { n: 6, x: 88, y: 52 },
  },
  {
    tag: "EUROPE · MIGRATION", color: GOLD,
    head: "FIVE EU NATIONS PLAN RWANDA RETURN HUB",
    body: "Five nations plan a Rwanda hub for asylum seekers.",
    icon: "mappin", pin: { n: 7, x: 282, y: 20 },
  },
];

// One line each; trimmed to fit a 470px column at scale 2.
const ALSO: string[] = [
  "HOUTHIS FALL BACK TO DEFEND ADEN, YEMEN",
  "WHO: ERITREA ELIMINATES TRACHOMA",
  "17 KILLED IN TWO SOUTH AFRICA SHOOTINGS",
  "RUSSIA SAYS 1,336 DRONES DOWNED IN A NIGHT",
  "JAPAN PROTESTS SUSPECTED RUSSIAN AIR INCURSION",
  "US HOUSE DEMOCRATS UNVEIL OPENING AGENDA",
  "PENTAGON FAILS AUDIT FOR 9TH YEAR RUNNING",
  "US CLOSES AI-CHIP LOOPHOLE FOR CHINA RENTALS",
  "UK SANCTIONS 8 ISRAELI SETTLEMENT FIRMS",
  "NETANYAHU CAMP ACCUSED OVER ELECTION ARRESTS",
  "INDIA BUS PLUNGES INTO RAVINE, 6 DEAD",
  "SRI LANKA BOWLED OUT FOR 98 IN RAWALPINDI",
  "BAHRAIN JAILS 64 SHIA FOR LIFE OVER IRAN LINKS",
  "POPE LEO XIV RETURNS TO PERU PORT CITY",
  "CARNEY MEETS XI IN CHINA, TARIFF CUTS AGREED",
  "US MEASLES CASES HIGHEST SINCE 1991",
  "128 STATES MEET ON KILLER-ROBOT TREATY",
  "MONGOLIA PRESIDENT TO RESIGN OVER GRAFT CLAIMS",
  "BRAZIL SECURES 1.5M HECTARES OF AMAZON LAND",
  "THAILAND TO BUY $2.6BN OF US FARM GOODS",
];

const NUMBERS: Array<[string, string]> = [
  ["1,336", "DRONES RUSSIA SAYS DOWNED"],
  ["40", "SATELLITES LOST IN VULCAN FAILURE"],
  ["17", "KILLED IN SOUTH AFRICA SHOOTINGS"],
  ["$109.1BN", "NVIDIA REVENUE EXPECTED"],
  ["9TH", "YEAR PENTAGON FAILS ITS AUDIT"],
  ["1.5M", "HECTARES OF AMAZON LAND SECURED"],
];

function drawIcon(cv: Canvas, name: string, x: number, y: number, w: number, h: number): void {
  if (name === "tanker") iconTanker(cv, x, y, w, h);
  else if (name === "handshake") iconHandshake(cv, x, y, w, h);
  else if (name === "bank") iconBank(cv, x, y, w, h);
  else if (name === "chip") iconChip(cv, x, y, w, h);
  else if (name === "rocket") iconRocket(cv, x, y, w, h);
  else iconMapPin(cv, x, y, w, h);
}

// ------------------------------------------------------------ page layout
const M = 28; // margin
const CW = W - 2 * M; // 968 content width

function drawPage(cv: Canvas): void {
  // frame + top rules
  cv.frame(10, 10, W - 20, H - 20, INK);
  cv.rect(M, 26, CW, 2, INK);
  drawTextCentered(cv, W / 2, 34, "THE WORLD IN ONE PAGE  ·  TUESDAY EDITION  ·  No. 321", 2, GREY);
  cv.rect(M, 54, CW, 1, INK);

  // masthead: the date, as big as the page allows
  drawTextCentered(cv, W / 2, 62, "TUESDAY 17 NOVEMBER 2026", 5, INK);
  cv.rect(M, 118, CW, 3, INK);
  cv.rect(M, 123, CW, 1, INK);
  drawTextCentered(
    cv, W / 2, 130,
    "27 STORIES  ·  6 CONTINENTS  ·  ONE DAY",
    2, RED
  );
  cv.rect(M, 152, CW, 1, INK);

  // ---- lead story (y 162..330): text left, bridge picture right
  const leadY = 162;
  const leadTextW = 560;
  const picX = M + leadTextW + 20;
  const picW = CW - leadTextW - 20;
  drawText(cv, M, leadY, LEAD.tag, 2, RED);
  const headY = drawPara(cv, M, leadY + 22, LEAD.head, leadTextW, 3, INK, 26);
  drawPara(cv, M, headY + 6, LEAD.body, leadTextW, 2, INK, 17);
  iconBridge(cv, picX, leadY, picW, 168);
  cv.frame(picX, leadY, picW, 168, INK);
  drawTextCentered(cv, picX + picW / 2, leadY + 172, "THE KERCH BRIDGE AFTER THE STRIKE", 1, GREY);
  cv.rect(M, 344, CW, 2, INK);

  // ---- six featured stories: 2 columns x 3 rows (y 352..634)
  const featY0 = 352;
  const featH = 96;
  const featW = Math.floor((CW - 16) / 2);
  for (let i = 0; i < FEATURED.length; i++) {
    const s = FEATURED[i];
    const col = i % 2;
    const row = Math.floor(i / 2);
    const fx = M + col * (featW + 16);
    const fy = featY0 + row * (featH + 4);    // number badge + tag
    cv.rect(fx, fy, 22, 22, s.color);
    drawTextCentered(cv, fx + 11, fy + 4, String(s.pin.n), 2, WHITE);
    drawText(cv, fx + 28, fy + 4, s.tag, 2, s.color);
    // icon left, headline + body right
    const ix = fx;
    const iy = fy + 28;
    const iw = 76;
    const ih = 58;
    drawIcon(cv, s.icon, ix, iy, iw, ih);
    cv.frame(ix, iy, iw, ih, INK);
    const tx = fx + iw + 10;
    const tw = featW - iw - 10;
    const hy = drawPara(cv, tx, iy - 2, s.head, tw, 2, INK, 16);
    drawPara(cv, tx, hy + 2, s.body, tw, 2, GREY, 15);
    if (col === 0) cv.rect(fx + featW + 8, fy, 1, featH, PAPER2);
  }
  cv.rect(M, 654, CW, 2, INK);

  // ---- map + by the numbers (y 666..792)
  const mapY = 666;
  const mapH = 126;
  const mapW = 600;
  const pins: Pin[] = [{ n: 1, x: 312, y: 24 }].concat(FEATURED.map((s) => s.pin));
  drawMap(cv, M, mapY, mapW, mapH, pins);
  // numbers box
  const numX = M + mapW + 16;
  const numW = CW - mapW - 16;
  cv.rect(numX, mapY, numW, mapH, PAPER2);
  cv.frame(numX, mapY, numW, mapH, INK);
  drawText(cv, numX + 12, mapY + 8, "BY THE NUMBERS", 2, RED);
  cv.rect(numX + 12, mapY + 28, numW - 24, 1, INK);
  for (let i = 0; i < NUMBERS.length; i++) {
    const ny = mapY + 34 + i * 15;
    const [num, label] = NUMBERS[i];
    drawText(cv, numX + 12, ny, num, 2, INK);
    drawText(cv, numX + 118, ny, label, 1, GREY);
  }

  // ---- ALSO ON TUESDAY: 20 more stories, 2 columns (y 798..962)
  const alsoY = 798;
  cv.rect(M, alsoY - 8, CW, 2, INK);
  drawText(cv, M, alsoY, "ALSO ON TUESDAY — 20 MORE STORIES", 2, INK);
  drawText(cv, M + CW - textWidth("ALL REPORTED 17 NOV 2026", 1), alsoY + 2, "ALL REPORTED 17 NOV 2026", 1, GREY);
  const colW = Math.floor((CW - 16) / 2);
  for (let i = 0; i < ALSO.length; i++) {
    const col = i < 10 ? 0 : 1;
    const row = i % 10;
    const ax = M + col * (colW + 16);
    const ay = alsoY + 24 + row * 15;
    drawText(cv, ax, ay, "·", 2, RED);
    drawText(cv, ax + 12, ay, ALSO[i], 1, INK);
  }

  // ---- footer (y 970..1010)
  cv.rect(M, 968, CW, 1, INK);
  drawTextCentered(
    cv, W / 2, 976,
    "EVERY STORY HAPPENED OR WAS FIRST REPORTED ON TUESDAY 17 NOVEMBER 2026.",
    1, GREY
  );
  drawTextCentered(
    cv, W / 2, 990,
    "DISPUTED CLAIMS ARE ATTRIBUTED. SOURCES: AP · REUTERS · AFP · BBC · AL JAZEERA · WHO · ULA",
    1, GREY
  );
}

// ------------------------------------------------------------------ main
function main(): void {
  const cv = new Canvas();
  drawPage(cv);
  const png = encodePNG(cv);
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "entry.png"), png);
}

main();
