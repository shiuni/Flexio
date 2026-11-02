import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { incomingToolsets, resolveIncomingNames } from '@/shared/lib/flexFile'
import type { FlexPreset } from '@/shared/lib/flexFile'
import { useT } from '@/shared/i18n/LanguageContext'
import type { TextKey } from '@/shared/i18n/strings'
import { APP_DISPLAY_NAMES, APP_NAMES, PANEL_SLOTS } from '@/shared/types'
import type {
  AppName,
  BlueprintsData,
  ImportAction,
  ImportPlan,
  PanelSlot,
} from '@/shared/types'
import styles from './ImportDialog.module.css'

interface Props {
  preset: FlexPreset
  fileName: string
  current: BlueprintsData
  onImport: (plan: ImportPlan) => void
  onCancel: () => void
}

const PANEL_LABELS: Record<PanelSlot, string> = {
  panel1: 'Flexio 1',
  panel2: 'Flexio 2',
  panel3: 'Flexio 3',
  panel4: 'Flexio 4',
}

const CONFLICT_ACTIONS: { action: ImportAction; label: TextKey }[] = [
  { action: 'import',  label: 'keepBoth' },
  { action: 'replace', label: 'replace' },
  { action: 'skip',    label: 'skip' },
]

const NEW_ACTIONS: { action: ImportAction; label: TextKey }[] = [
  { action: 'import', label: 'import' },
  { action: 'skip',   label: 'skip' },
]

function initialPlan(preset: FlexPreset): ImportPlan {
  const plan = { toolsets: {}, allocation: {} } as ImportPlan
  for (const app of APP_NAMES) {
    plan.toolsets[app] = {}
    for (const ts of incomingToolsets(preset, app)) plan.toolsets[app][ts.id] = 'import'
    plan.allocation[app] = { panel1: '', panel2: '', panel3: '', panel4: '' }
  }
  return plan
}

export function ImportDialog({ preset, fileName, current, onImport, onCancel }: Props) {
  const t = useT()
  const [plan, setPlan] = useState(() => initialPlan(preset))

  const apps = useMemo(
    () => APP_NAMES.filter((app) => incomingToolsets(preset, app).length > 0),
    [preset],
  )

  function setAction(app: AppName, toolsetId: string, action: ImportAction) {
    setPlan((prev) => {
      const allocation = { ...prev.allocation[app] }
      // A skipped toolset can no longer be put on a panel
      if (action === 'skip') {
        for (const slot of PANEL_SLOTS) {
          if (allocation[slot] === `incoming:${toolsetId}`) allocation[slot] = ''
        }
      }
      return {
        toolsets: { ...prev.toolsets, [app]: { ...prev.toolsets[app], [toolsetId]: action } },
        allocation: { ...prev.allocation, [app]: allocation },
      }
    })
  }

  function setSlot(app: AppName, slot: PanelSlot, choice: string) {
    setPlan((prev) => ({
      ...prev,
      allocation: { ...prev.allocation, [app]: { ...prev.allocation[app], [slot]: choice } },
    }))
  }

  /** Put each panel back on what it showed in the preset */
  function usePresetPanels(app: AppName) {
    setPlan((prev) => {
      const allocation = { ...prev.allocation[app] }
      for (const slot of PANEL_SLOTS) {
        const id = preset.blueprints?.allocation?.[app]?.[slot]
        const imported = id && (prev.toolsets[app][id] ?? 'skip') !== 'skip'
        allocation[slot] = imported ? `incoming:${id}` : ''
      }
      return { ...prev, allocation: { ...prev.allocation, [app]: allocation } }
    })
  }

  return (
    <motion.div
      className={styles.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className={styles.dialog}
        initial={{ scale: 0.95, y: 8 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
      >
        <div className={styles.head}>
          <h3 className={styles.title}>{t.importPreset}</h3>
          <p className={styles.subtitle}>{fileName}</p>
        </div>

        <div className={styles.body}>
          {apps.map((app) => {
            const incoming = incomingToolsets(preset, app)
            const existing = current.apps[app].toolsets
            const actions  = plan.toolsets[app]
            const names    = resolveIncomingNames(existing, incoming, actions)
            const replacedNames = new Set(
              incoming.filter((ts) => actions[ts.id] === 'replace').map((ts) => ts.name),
            )
            const kept = existing.filter((ts) => !replacedNames.has(ts.name))
            const importable = incoming.filter((ts) => actions[ts.id] !== 'skip')
            const hasPresetPanels = PANEL_SLOTS.some((s) => preset.blueprints?.allocation?.[app]?.[s])

            return (
              <section key={app} className={styles.section}>
                <div className={styles.appName}>{APP_DISPLAY_NAMES[app]}</div>

                <div className={styles.groupLabel}>{t.toolsets}</div>
                <div className={styles.rows}>
                  {incoming.map((ts) => {
                    const action   = actions[ts.id] ?? 'skip'
                    const conflict = existing.some((e) => e.name === ts.name)
                    const options  = conflict ? CONFLICT_ACTIONS : NEW_ACTIONS
                    const note =
                      action === 'skip'    ? t.notImported
                      : action === 'replace' ? t.replacesCurrent
                      : conflict           ? t.addedAs(names[ts.id])
                      : t.buttonCount(ts.buttons?.length ?? 0)
                    return (
                      <div key={ts.id} className={styles.row}>
                        <div className={styles.rowText}>
                          <span className={`${styles.rowName} ${action === 'skip' ? styles.muted : ''}`}>
                            {ts.name}
                          </span>
                          <span className={styles.rowNote}>{note}</span>
                        </div>
                        <div className={styles.segment}>
                          {options.map((o) => (
                            <button
                              key={o.action}
                              className={`${styles.segBtn} ${action === o.action ? styles.segActive : ''}`}
                              onClick={() => setAction(app, ts.id, o.action)}
                            >
                              {t[o.label]}
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className={styles.groupHeader}>
                  <span className={styles.groupLabel}>{t.panels}</span>
                  {hasPresetPanels && (
                    <button className={styles.linkBtn} onClick={() => usePresetPanels(app)}>
                      {t.usePresetPanels}
                    </button>
                  )}
                </div>
                <div className={styles.rows}>
                  {PANEL_SLOTS.map((slot) => {
                    const currentId   = current.allocation[app][slot]
                    const currentName = existing.find((ts) => ts.id === currentId)?.name
                    return (
                      <div key={slot} className={styles.slotRow}>
                        <span className={styles.slotLabel}>{PANEL_LABELS[slot]}</span>
                        <select
                          className={styles.slotSelect}
                          value={plan.allocation[app][slot]}
                          onChange={(e) => setSlot(app, slot, e.target.value)}
                        >
                          <option value="">{t.keepCurrent(currentName ?? t.unassigned)}</option>
                          <option value="existing:">{t.unassignedOption}</option>
                          {importable.length > 0 && (
                            <optgroup label={t.fromPreset}>
                              {importable.map((ts) => (
                                <option key={ts.id} value={`incoming:${ts.id}`}>{names[ts.id]}</option>
                              ))}
                            </optgroup>
                          )}
                          {kept.length > 0 && (
                            <optgroup label={t.current}>
                              {kept.map((ts) => (
                                <option key={ts.id} value={`existing:${ts.id}`}>{ts.name}</option>
                              ))}
                            </optgroup>
                          )}
                        </select>
                      </div>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onCancel}>{t.cancel}</button>
          <button className={styles.importBtn} onClick={() => onImport(plan)}>{t.import}</button>
        </div>
      </motion.div>
    </motion.div>
  )
}
