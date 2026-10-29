/**
 * Generates a deterministic text-based icon for buttons that have no image.
 * Text is laid out in up to 3 rows of 5 chars (15 total) and the font size
 * is fitted to the icon box.
 */

import { nfs } from './nodeEnv'
import { toAbsolutePath } from './paths'

export const ICON_TEXT_MAX_CHARS = 15
export const ICON_TEXT_MAX_ROWS = 3
const ICON_TEXT_ROW_CHARS = 5

/**
 * Split icon text into display rows.
 * Explicit line breaks are kept as typed; otherwise the text is spread evenly
 * over as few rows of up to 5 chars as possible.
 */
export function getIconRows(text: string): string[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  if (lines.length > 1) return lines.slice(0, ICON_TEXT_MAX_ROWS)

  // Array.from counts surrogate pairs (emoji etc.) as one char
  const chars = Array.from(lines[0] ?? '').slice(0, ICON_TEXT_MAX_CHARS)
  if (chars.length === 0) return ['?']
  const rowCount = Math.ceil(chars.length / ICON_TEXT_ROW_CHARS)
  const perRow = Math.ceil(chars.length / rowCount)
  const rows: string[] = []
  for (let i = 0; i < chars.length; i += perRow) rows.push(chars.slice(i, i + perRow).join(''))
  return rows
}

/** Keep typed icon text within 3 lines / 15 chars */
export function clampIconText(text: string): string {
  const lines = text.split(/\r?\n/).slice(0, ICON_TEXT_MAX_ROWS)
  let left = ICON_TEXT_MAX_CHARS
  return lines
    .map((line) => {
      const chars = Array.from(line).slice(0, Math.max(0, left))
      left -= chars.length
      return chars.join('')
    })
    .join('\n')
}

// ─── Font fitting ────────────────────────────────────────────────────────────

/** Must match the font of the TextIcon component */
export const ICON_FONT_FAMILY = "'Adobe Clean', ui-sans-serif, system-ui, sans-serif"
const ICON_LINE_HEIGHT = 1.15
const ICON_LETTER_SPACING = 0.02 // em
const ICON_FILL = 0.82 // usable fraction of the box
const ICON_MAX_FONT = 0.3 // largest font size relative to the box

let measureCtx: CanvasRenderingContext2D | null = null
const widthCache = new Map<string, number>()

/** Width of a row in em (bold, letter spacing included) */
function rowWidthEm(row: string): number {
  const cached = widthCache.get(row)
  if (cached !== undefined) return cached
  if (!measureCtx) {
    measureCtx = document.createElement('canvas').getContext('2d')
    if (measureCtx) measureCtx.font = `700 100px ${ICON_FONT_FAMILY}`
  }
  const chars = Array.from(row).length
  // Fallback: half-width ≈ 0.62em, full-width ≈ 1em
  const width = measureCtx
    ? measureCtx.measureText(row).width / 100
    : Array.from(row).reduce((w, c) => w + (c.charCodeAt(0) > 0xff ? 1 : 0.62), 0)
  const em = width + chars * ICON_LETTER_SPACING
  widthCache.set(row, em)
  return em
}

/** Largest font size (px) at which the rows fit inside a square icon of `box` px */
export function fitIconFontSize(rows: string[], box: number): number {
  const usable = box * ICON_FILL
  const widest = Math.max(...rows.map(rowWidthEm), 0.01)
  const byWidth = usable / widest
  const byHeight = usable / (rows.length * ICON_LINE_HEIGHT)
  return Math.max(5, Math.floor(Math.min(byWidth, byHeight, box * ICON_MAX_FONT)))
}

/**
 * Deterministic HSL color from a string.
 * Returns a dark, muted background suitable for the dark theme.
 */
export function nameToHsl(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
    hash |= 0
  }
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 38%, 22%)`
}

/**
 * file:// URL for an absolute path, with the file's modification stamp as a
 * query string. Replacing an icon keeps its file name, so without the stamp
 * CEF serves the old image from its cache.
 */
export function fileToUrl(absPath: string): string {
  if (!absPath) return ''
  let stamp = ''
  try {
    const st = nfs.statSync(absPath)
    stamp = `?v=${Math.round(st.mtimeMs)}-${Math.round(st.ctimeMs)}-${st.size}`
  } catch { /* missing file — plain URL */ }
  return 'file:///' + absPath.replace(/\\/g, '/') + stamp
}

/**
 * Given an icon path (relative), return a URL that can be used in <img src="...">.
 * The path is converted to an absolute file:// URL.
 */
export function iconPathToUrl(relativePath: string): string {
  if (!relativePath) return ''
  try {
    return fileToUrl(toAbsolutePath(relativePath))
  } catch {
    return ''
  }
}
