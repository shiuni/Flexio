import { nfs } from './nodeEnv'
import { ensureDir } from './nodeEnv'
import { getBlueprintsPath, getFlexioRoot } from './paths'
import type {
  AppPanelSettingsMap,
  BlueprintsData,
  PanelSettings,
  PanelSettingsMap,
  AllocationMap,
} from '../types'
import { APP_NAMES, PANEL_SLOTS } from '../types'

// ─── Defaults ────────────────────────────────────────────────────────────────

function defaultAllocation(): AllocationMap {
  return { panel1: '', panel2: '', panel3: '', panel4: '' }
}

export function defaultPanelSettings(): PanelSettings {
  return {
    scale: 64,
    spacing: 8,
    flipToReorder: false,
    uiMode: 'icon',
    iconShape: 'rounded',
    columns: 0,
  }
}

function defaultPanelSettingsMap(): PanelSettingsMap {
  return {
    panel1: defaultPanelSettings(),
    panel2: defaultPanelSettings(),
    panel3: defaultPanelSettings(),
    panel4: defaultPanelSettings(),
  }
}

function defaultAppPanelSettings(): AppPanelSettingsMap {
  const map = {} as AppPanelSettingsMap
  for (const app of APP_NAMES) map[app] = defaultPanelSettingsMap()
  return map
}

export function getDefaultBlueprints(): BlueprintsData {
  const apps = {} as BlueprintsData['apps']
  const allocation = {} as BlueprintsData['allocation']
  for (const app of APP_NAMES) {
    apps[app] = { toolsets: [] }
    allocation[app] = defaultAllocation()
  }
  return {
    version: '1.4.0',
    lastModified: new Date().toISOString(),
    allocation,
    panelSettings: defaultAppPanelSettings(),
    apps,
  }
}

// ─── panelSettings normalisation / migration ─────────────────────────────────

/** Fill in any field a stored (or imported) panel settings object is missing. */
export function normalizePanelSettings(s?: Partial<PanelSettings> | null): PanelSettings {
  const d = defaultPanelSettings()
  if (!s) return d
  // Field by field: a missing key must fall back to the default, and `false`
  // / `0` are legitimate stored values that must survive.
  return {
    scale:         s.scale         ?? d.scale,
    spacing:       s.spacing       ?? d.spacing,
    flipToReorder: s.flipToReorder ?? d.flipToReorder,
    uiMode:        s.uiMode        ?? d.uiMode,
    iconShape:     s.iconShape     ?? d.iconShape,
    columns:       s.columns       ?? d.columns,
  }
}

/**
 * Up to v1.2 `panelSettings` was keyed by slot only, so every host app shared
 * one set of visual settings. The current shape is keyed by app first.
 * Slot keys at the top level mean we are looking at the old shape.
 */
export function isSlotKeyedPanelSettings(
  ps: AppPanelSettingsMap | PanelSettingsMap,
): ps is PanelSettingsMap {
  return PANEL_SLOTS.some((slot) => slot in ps)
}

/** Expand any stored/imported shape into a full per-app, per-slot map. */
function toAppPanelSettings(
  ps: AppPanelSettingsMap | PanelSettingsMap | undefined,
  fallback: PanelSettings,
): AppPanelSettingsMap {
  const slotKeyed = ps && isSlotKeyedPanelSettings(ps) ? ps : null
  const appKeyed  = ps && !slotKeyed ? (ps as AppPanelSettingsMap) : null

  const result = {} as AppPanelSettingsMap
  for (const app of APP_NAMES) {
    const slots = {} as PanelSettingsMap
    for (const slot of PANEL_SLOTS) {
      // Slot-keyed data predates per-app settings: every app inherits a copy.
      const stored = slotKeyed ? slotKeyed[slot] : appKeyed?.[app]?.[slot]
      slots[slot] = stored ? normalizePanelSettings(stored) : { ...fallback }
    }
    result[app] = slots
  }
  return result
}

// ─── Load ────────────────────────────────────────────────────────────────────

/** The settings file exists but neither it nor its backup could be read. */
export class BlueprintsLoadError extends Error {}

function getBackupPath(): string {
  return getBlueprintsPath().replace(/\.json$/, '.bak.json')
}

function parseBlueprints(raw: string): BlueprintsData {
  const parsed = JSON.parse(raw) as Omit<BlueprintsData, 'panelSettings'> & {
    panelSettings?: AppPanelSettingsMap | PanelSettingsMap
    // Legacy fields that may be present
    settings?: { buttonScale?: number; buttonSpacing?: number; flipToReorder?: boolean }
    panelColumns?: Record<string, Record<string, number>>
  }
  if (!parsed || typeof parsed !== 'object') throw new Error('Not a settings object')

  // Ensure all apps exist
  parsed.apps = parsed.apps ?? ({} as BlueprintsData['apps'])
  parsed.allocation = parsed.allocation ?? ({} as BlueprintsData['allocation'])
  for (const app of APP_NAMES) {
    if (!parsed.apps[app]) parsed.apps[app] = { toolsets: [] }
    if (!parsed.allocation[app]) parsed.allocation[app] = defaultAllocation()
  }

  // ── Migrate every historical shape → per-app, per-slot panelSettings ─────
  // v1.0: one global `settings` object; v1.1–v1.2: keyed by slot only.
  const legacyBase = normalizePanelSettings({
    scale:         parsed.settings?.buttonScale,
    spacing:       parsed.settings?.buttonSpacing,
    flipToReorder: parsed.settings?.flipToReorder,
  })
  const panelSettings = toAppPanelSettings(parsed.panelSettings, legacyBase)

  // Drop legacy fields
  delete parsed.settings
  delete parsed.panelColumns

  return { ...parsed, panelSettings } as BlueprintsData
}

/**
 * Read the settings file. A missing file means a fresh install and yields the
 * defaults; an unreadable one falls back to the backup and otherwise throws,
 * so a broken file is never silently replaced by empty settings.
 */
export function loadBlueprints(): BlueprintsData {
  const path = getBlueprintsPath()
  if (!nfs.existsSync(path)) return getDefaultBlueprints()
  try {
    return parseBlueprints(nfs.readFileSync(path, 'utf8'))
  } catch (e) {
    const backup = getBackupPath()
    if (nfs.existsSync(backup)) {
      try {
        return parseBlueprints(nfs.readFileSync(backup, 'utf8'))
      } catch { /* fall through */ }
    }
    throw new BlueprintsLoadError(`Could not read ${path}: ${String(e)}`)
  }
}

// ─── Save ────────────────────────────────────────────────────────────────────

/**
 * Write through a temp file and rename it into place, so the other panels
 * polling the file never read a half-written one. The previous version is
 * kept as a backup as long as it still parses.
 */
export function saveBlueprints(data: BlueprintsData): void {
  data.lastModified = new Date().toISOString()
  const path = getBlueprintsPath()
  ensureDir(getFlexioRoot())

  const tmp = path + '.tmp'
  nfs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8')

  if (nfs.existsSync(path)) {
    try {
      const current = nfs.readFileSync(path, 'utf8')
      JSON.parse(current)
      nfs.writeFileSync(getBackupPath(), current, 'utf8')
    } catch { /* never let a broken file overwrite a good backup */ }
  }

  try {
    nfs.renameSync(tmp, path)
  } catch {
    // Rename can be refused while another process holds the file; copy instead
    nfs.copyFileSync(tmp, path)
    try { nfs.unlinkSync(tmp) } catch { /* ok */ }
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getBlueprintsTimestamp(): string {
  try {
    const path = getBlueprintsPath()
    if (!nfs.existsSync(path)) return ''
    const stat = nfs.statSync(path)
    return stat.mtimeMs.toString()
  } catch {
    return ''
  }
}
