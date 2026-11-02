/**
 * Manages script and icon files under:
 *   <FlexioRoot>/Scripts/{App}/{buttonId}/code/
 *   <FlexioRoot>/Scripts/{App}/{buttonId}/icon/
 *
 * New buttons use button.id (UUID) as the directory key.
 * Existing buttons keep their stored paths — the dir is derived from the
 * stored relative path so name-based legacy dirs still work.
 */
import { nfs, npath, ensureDir, rmrf } from './nodeEnv'
import {
  getCodeDir,
  getIconDir,
  getScriptDir,
  getScriptDirFromRelPath,
  toRelativePath,
  baseName,
} from './paths'
import type { AppName } from '../types'

// ─── Save a new script file (buttonId as dir key) ────────────────────────────

export interface SavedScript {
  scriptPath: string // relative path
  scriptName: string // display name from file (for button default label)
}

export function saveScriptFile(app: AppName, srcPath: string, buttonId: string): SavedScript {
  const srcBase = npath.basename(srcPath)
  const scriptName = baseName(srcPath)
  const codeDir = getCodeDir(app, buttonId)
  ensureDir(codeDir)
  const destFile = npath.join(codeDir, srcBase)
  nfs.copyFileSync(srcPath, destFile)
  return {
    scriptPath: toRelativePath(destFile),
    scriptName,
  }
}

// ─── Save a new icon file (buttonId as dir key) ──────────────────────────────

export interface SavedIcon {
  iconPath: string
}

export function saveIconFile(app: AppName, buttonId: string, srcPath: string): SavedIcon {
  const iconDir = getIconDir(app, buttonId)
  ensureDir(iconDir)
  const destFile = npath.join(iconDir, npath.basename(srcPath))
  nfs.copyFileSync(srcPath, destFile)
  return { iconPath: toRelativePath(destFile) }
}

// ─── Update an existing script / icon (dir derived from stored path) ─────────

/**
 * Make a copy of `srcPath` the only file in `dir`. The copy is written under a
 * temp name before anything is removed, so a failed copy leaves the current
 * file in place — also when `srcPath` is that very file.
 */
function replaceFileInDir(dir: string, srcPath: string): string {
  ensureDir(dir)
  const destFile = npath.join(dir, npath.basename(srcPath))
  const tmp = npath.join(dir, `.incoming-${Date.now()}`)
  try {
    nfs.copyFileSync(srcPath, tmp)
  } catch (e) {
    try { nfs.unlinkSync(tmp) } catch { /* ok */ }
    throw e
  }
  for (const f of nfs.readdirSync(dir)) {
    const full = npath.join(dir, f)
    if (full === tmp) continue
    try { nfs.unlinkSync(full) } catch { /* ok */ }
  }
  nfs.renameSync(tmp, destFile)
  return destFile
}

export function updateScriptFile(existingScriptPath: string, newSrcPath: string): string {
  const scriptDir = getScriptDirFromRelPath(existingScriptPath)
  return toRelativePath(replaceFileInDir(npath.join(scriptDir, 'code'), newSrcPath))
}

export function updateIconFile(existingIconPath: string, newSrcPath: string): string {
  const scriptDir = getScriptDirFromRelPath(existingIconPath)
  return toRelativePath(replaceFileInDir(npath.join(scriptDir, 'icon'), newSrcPath))
}

// ─── Delete a script directory (dir derived from stored path) ────────────────

export function deleteScriptDir(existingScriptPath: string): void {
  const dir = getScriptDirFromRelPath(existingScriptPath)
  if (dir) rmrf(dir)
}

// ─── Duplicate a script directory (new dir uses newButtonId) ─────────────────

export interface DuplicatedPaths {
  scriptPath: string
  iconPath: string
}

export function duplicateScriptDir(
  originalScriptPath: string,
  originalIconPath: string,
  app: AppName,
  newButtonId: string,
): DuplicatedPaths {
  const srcDir  = getScriptDirFromRelPath(originalScriptPath)
  const dstDir  = getScriptDir(app, newButtonId)
  if (srcDir && nfs.existsSync(srcDir)) {
    copyDirRecursive(srcDir, dstDir)
  }

  // Re-derive new paths from newButtonId dir
  const srcRelCode = originalScriptPath.replace(/\\/g, '/').split('/')
  const srcRelIcon = originalIconPath.replace(/\\/g, '/').split('/')
  const codeFile   = srcRelCode[srcRelCode.length - 1]
  const iconFile   = srcRelIcon[srcRelIcon.length - 1]

  const newCodeDir = getCodeDir(app, newButtonId)
  const newIconDir = getIconDir(app, newButtonId)
  const newScript  = npath.join(newCodeDir, codeFile)
  const newIcon    = iconFile ? npath.join(newIconDir, iconFile) : ''

  return {
    scriptPath: toRelativePath(newScript),
    iconPath:   newIcon ? toRelativePath(newIcon) : '',
  }
}

function copyDirRecursive(src: string, dst: string): void {
  ensureDir(dst)
  const entries = nfs.readdirSync(src, { withFileTypes: true })
  for (const entry of entries) {
    const srcPath = npath.join(src, entry.name)
    const dstPath = npath.join(dst, entry.name)
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, dstPath)
    } else {
      nfs.copyFileSync(srcPath, dstPath)
    }
  }
}

// ─── Read script content for execution ───────────────────────────────────────

export function readScriptContent(relativePath: string): string {
  const { toAbsolutePath } = require('./paths') as typeof import('./paths')
  const absPath = toAbsolutePath(relativePath)
  return nfs.readFileSync(absPath, 'utf8')
}

// ─── Generate a safe folder name from a button name ──────────────────────────

export function safeFolderName(name: string): string {
  return name
    .trim()
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 64) || 'Script'
}

// ─── Build the autoIconText from a button name (max 6 chars) ─────────────────

export function buildAutoIconText(name: string): string {
  if (!name) return '?'
  const words = name.trim().split(/[\s_]+/)
  if (words.length >= 2 && words.every((w) => w.length > 0)) {
    const abbr = words.map((w) => w[0].toUpperCase()).join('').slice(0, 6)
    if (abbr.length >= 2) return abbr
  }
  return name.trim().slice(0, 6).toUpperCase()
}

/** Icon text to display: the custom icon label wins, the name is the fallback */
export function resolveIconText(name: string, iconLabel?: string): string {
  return iconLabel?.trim() ? iconLabel.trim() : buildAutoIconText(name)
}
