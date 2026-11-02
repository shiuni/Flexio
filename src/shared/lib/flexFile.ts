/**
 * Flexio preset format (.json):
 *   Plain JSON containing blueprints config + script/icon files as Base64.
 *
 * Export: read blueprints + the files its buttons use → encode Base64 → write JSON
 * Import: read the preset, let the user decide per toolset and per panel
 *         (ImportPlan), then copy the chosen buttons in under fresh IDs.
 */
import { v4 as uuidv4 } from 'uuid'
import { nfs, npath, ensureDir, rmrf } from './nodeEnv'
import {
  getFlexioRoot,
  getCodeDir,
  getIconDir,
  getScriptDir,
  getScriptDirFromRelPath,
  toAbsolutePath,
  toRelativePath,
} from './paths'
import {
  saveBlueprints,
  loadBlueprints,
  isSlotKeyedPanelSettings,
  normalizePanelSettings,
} from './blueprints'
import type {
  AppName,
  AppPanelSettingsMap,
  BlueprintsData,
  ButtonDef,
  ImportAction,
  ImportPlan,
  PanelSettings,
  PanelSettingsMap,
  ToolsetDef,
} from '../types'
import { APP_NAMES, PANEL_SLOTS } from '../types'

export interface FlexPreset {
  flexioPreset: true
  version: string
  exportedAt: string
  blueprints: BlueprintsData
  /** Relative path (from Flexio root) → Base64-encoded file content */
  scripts: Record<string, string>
}

// ─── Export ──────────────────────────────────────────────────────────────────

export async function exportFlex(destPath: string): Promise<void> {
  // Read through loadBlueprints so the preset always carries the current
  // shape (per-app panel settings), never a legacy one straight off disk.
  const blueprints: BlueprintsData = loadBlueprints()

  // Only the files a button points at: leftovers in the Scripts folder are
  // not part of the setup and must not travel with it.
  const scripts: Record<string, string> = {}
  for (const app of APP_NAMES) {
    for (const ts of blueprints.apps[app].toolsets) {
      for (const btn of ts.buttons) {
        for (const rel of [btn.scriptPath, btn.iconPath]) {
          if (!rel || rel in scripts) continue
          const abs = toAbsolutePath(rel)
          if (!nfs.existsSync(abs)) continue
          scripts[rel] = (nfs.readFileSync(abs) as Buffer).toString('base64')
        }
      }
    }
  }

  const preset: FlexPreset = {
    flexioPreset: true,
    version: '2.0',
    exportedAt: new Date().toISOString(),
    blueprints,
    scripts,
  }

  ensureDir(npath.dirname(destPath))
  nfs.writeFileSync(destPath, JSON.stringify(preset, null, 2), 'utf8')
}

// ─── Read ────────────────────────────────────────────────────────────────────

export function readPreset(jsonPath: string): FlexPreset {
  const raw = nfs.readFileSync(jsonPath, 'utf8')
  const parsed = JSON.parse(raw) as FlexPreset
  if (!parsed || !parsed.flexioPreset) {
    throw new Error('Not a valid Flexio preset file.')
  }
  parsed.scripts = parsed.scripts ?? {}
  return parsed
}

export function incomingToolsets(preset: FlexPreset, app: AppName): ToolsetDef[] {
  return preset.blueprints?.apps?.[app]?.toolsets ?? []
}

/**
 * Name each incoming toolset will have once imported. Kept toolsets whose
 * name is already taken get a number: "Tools" → "Tools (2)".
 */
export function resolveIncomingNames(
  existing: ToolsetDef[],
  incoming: ToolsetDef[],
  actions: Record<string, ImportAction>,
): Record<string, string> {
  const taken = new Set(existing.map((t) => t.name))
  const names: Record<string, string> = {}
  for (const inTs of incoming) {
    const action = actions[inTs.id] ?? 'skip'
    if (action === 'skip') continue
    if (action === 'replace' && existing.some((t) => t.name === inTs.name)) {
      names[inTs.id] = inTs.name
      continue
    }
    let name = inTs.name
    for (let n = 2; taken.has(name); n++) name = `${inTs.name} (${n})`
    taken.add(name)
    names[inTs.id] = name
  }
  return names
}

/** Visual settings the preset used for the panel that showed this toolset. */
function presetLookFor(preset: FlexPreset, app: AppName, toolsetId: string): PanelSettings | null {
  const slot = PANEL_SLOTS.find((s) => preset.blueprints?.allocation?.[app]?.[s] === toolsetId)
  const ps = preset.blueprints?.panelSettings as AppPanelSettingsMap | PanelSettingsMap | undefined
  if (!slot || !ps) return null
  // Presets from before per-app settings carry one slot-keyed map for all apps
  const stored = isSlotKeyedPanelSettings(ps) ? ps[slot] : ps[app]?.[slot]
  return stored ? normalizePanelSettings(stored) : null
}

// ─── Import ──────────────────────────────────────────────────────────────────

export interface ImportResult {
  toolsets: number
  /** Script/icon files the preset referenced but did not contain */
  missingFiles: number
}

/** Windows-safe file name from a preset path — never a directory part. */
function safeFileName(relPath: string): string {
  const name = relPath.replace(/\\/g, '/').split('/').pop() ?? ''
  if (name === '.' || name === '..') return ''
  return name.replace(/[<>:"|?*\x00-\x1f]/g, '_')
}

export function importFlex(preset: FlexPreset, plan: ImportPlan): ImportResult {
  const current = loadBlueprints()
  const next: BlueprintsData = {
    ...current,
    apps: { ...current.apps },
    allocation: { ...current.allocation },
    panelSettings: { ...current.panelSettings },
  }
  const createdDirs: string[] = []
  const replaced: ButtonDef[] = []
  let count = 0
  let missingFiles = 0

  /**
   * Write one preset file into this button's folder and return its relative
   * path. The destination is always built here, so a path in the preset can
   * never point outside the button's own folder.
   */
  const place = (app: AppName, buttonId: string, rel: string, kind: 'code' | 'icon'): string => {
    const name = rel ? safeFileName(rel) : ''
    const data = rel ? preset.scripts[rel.replace(/\\/g, '/')] : undefined
    if (!name || data === undefined) {
      if (rel) missingFiles++
      return ''
    }
    const dir = kind === 'code' ? getCodeDir(app, buttonId) : getIconDir(app, buttonId)
    ensureDir(dir)
    const dest = npath.join(dir, name)
    nfs.writeFileSync(dest, Buffer.from(data, 'base64'))
    return toRelativePath(dest)
  }

  try {
    for (const app of APP_NAMES) {
      const incoming = incomingToolsets(preset, app)
      const actions = plan.toolsets[app] ?? {}
      const names = resolveIncomingNames(current.apps[app].toolsets, incoming, actions)
      const toolsets = [...current.apps[app].toolsets]
      /** incoming toolset id → the id it has here after the import */
      const idMap = new Map<string, string>()

      for (const inTs of incoming) {
        const action = actions[inTs.id] ?? 'skip'
        if (action === 'skip') continue

        // Fresh IDs and folders for every button: nothing already here gets
        // overwritten and no two buttons ever share a folder.
        const sorted = [...(inTs.buttons ?? [])].sort((a, b) => a.order - b.order)
        const buttons = sorted.map((b, i): ButtonDef => {
          const id = uuidv4()
          createdDirs.push(getScriptDir(app, id))
          const iconPath = b.iconType === 'image' ? place(app, id, b.iconPath, 'icon') : ''
          return {
            ...b,
            id,
            scriptPath: place(app, id, b.scriptPath, 'code'),
            iconPath,
            iconType: iconPath ? 'image' : 'text',
            order: i,
          }
        })

        const target = action === 'replace'
          ? toolsets.findIndex((t) => t.name === inTs.name)
          : -1
        if (target !== -1) {
          // Keep the toolset's ID so the panels showing it stay assigned
          replaced.push(...toolsets[target].buttons)
          toolsets[target] = { ...toolsets[target], buttons }
          idMap.set(inTs.id, toolsets[target].id)
        } else {
          const id = uuidv4()
          toolsets.push({ id, name: names[inTs.id] ?? inTs.name, buttons })
          idMap.set(inTs.id, id)
        }
        count++
      }
      next.apps[app] = { toolsets }

      const alloc = { ...current.allocation[app] }
      const looks = { ...current.panelSettings[app] }
      for (const slot of PANEL_SLOTS) {
        const choice = plan.allocation[app]?.[slot] ?? ''
        if (choice.startsWith('existing:')) {
          alloc[slot] = choice.slice('existing:'.length)
        } else if (choice.startsWith('incoming:')) {
          const inId = choice.slice('incoming:'.length)
          const id = idMap.get(inId)
          if (!id) continue
          alloc[slot] = id
          // A panel that takes a toolset from the preset also takes its look
          const look = presetLookFor(preset, app, inId)
          if (look) looks[slot] = look
        }
      }
      next.allocation[app] = alloc
      next.panelSettings[app] = looks
    }

    saveBlueprints(next)
  } catch (e) {
    for (const dir of createdDirs) {
      try { rmrf(dir) } catch { /* ok */ }
    }
    throw e
  }

  // Replaced buttons' files go only once the new settings are saved, and only
  // folders that no remaining button uses.
  const inUse = new Set<string>()
  for (const app of APP_NAMES) {
    for (const ts of next.apps[app].toolsets) {
      for (const b of ts.buttons) {
        if (b.scriptPath) inUse.add(getScriptDirFromRelPath(b.scriptPath))
      }
    }
  }
  for (const b of replaced) {
    const dir = b.scriptPath ? getScriptDirFromRelPath(b.scriptPath) : ''
    if (dir && !inUse.has(dir)) {
      try { rmrf(dir) } catch { /* ok */ }
    }
  }

  return { toolsets: count, missingFiles }
}

// ─── Default preset path ──────────────────────────────────────────────────────

export function getDefaultPresetDir(): string {
  return npath.join(getFlexioRoot(), 'UserPresets')
}

export function getDefaultPresetPath(): string {
  return npath.join(getDefaultPresetDir(), 'Flexio_Presets.json')
}

// ─── OS file dialogs ──────────────────────────────────────────────────────────

export function showSaveDialog(defaultName: string): string | undefined {
  try {
    const defaultDir = getDefaultPresetDir()
    ensureDir(defaultDir)
    const cp = (new Function('m', 'return require(m)'))('child_process') as typeof import('child_process')
    const result = cp.execSync(
      `powershell -Command "Add-Type -AssemblyName System.Windows.Forms; ` +
      `$f = New-Object System.Windows.Forms.SaveFileDialog; ` +
      `$f.Filter = 'Flexio Preset (*.json)|*.json'; ` +
      `$f.DefaultExt = 'json'; ` +
      `$f.FileName = '${defaultName}'; ` +
      `$f.InitialDirectory = [System.IO.Path]::GetFullPath('${defaultDir.replace(/\\/g, '\\\\')}'); ` +
      `$f.ShowDialog() | Out-Null; $f.FileName"`,
      { encoding: 'utf8' },
    ).trim()
    if (!result) return undefined
    return result.endsWith('.json') ? result : result + '.json'
  } catch {
    return undefined
  }
}

export function showOpenDialog(): string | undefined {
  try {
    const defaultDir = getDefaultPresetDir()
    const cp = (new Function('m', 'return require(m)'))('child_process') as typeof import('child_process')
    const result = cp.execSync(
      `powershell -Command "Add-Type -AssemblyName System.Windows.Forms; ` +
      `$f = New-Object System.Windows.Forms.OpenFileDialog; ` +
      `$f.Filter = 'Flexio Preset (*.json)|*.json'; ` +
      `$f.InitialDirectory = [System.IO.Path]::GetFullPath('${defaultDir.replace(/\\/g, '\\\\')}'); ` +
      `$f.ShowDialog() | Out-Null; $f.FileName"`,
      { encoding: 'utf8' },
    ).trim()
    return result || undefined
  } catch {
    return undefined
  }
}

export function openInExplorer(folderPath: string): void {
  try {
    const cp = (new Function('m', 'return require(m)'))('child_process') as typeof import('child_process')
    cp.exec(`explorer.exe "${folderPath}"`)
  } catch {
    // silently ignore
  }
}
