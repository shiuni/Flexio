import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useBlueprints } from '@/shared/context/BlueprintsContext'
import {
  exportFlex,
  importFlex,
  readPreset,
  incomingToolsets,
  showSaveDialog,
  showOpenDialog,
  openInExplorer,
  getDefaultPresetPath,
  getDefaultPresetDir,
} from '@/shared/lib/flexFile'
import type { FlexPreset } from '@/shared/lib/flexFile'
import { getDefaultBlueprints, saveBlueprints } from '@/shared/lib/blueprints'
import { getScriptsRoot } from '@/shared/lib/paths'
import { rmrf } from '@/shared/lib/nodeEnv'
import { ImportDialog } from '../components/ImportDialog'
import { useConfirm } from '../components/ConfirmDialog'
import { useLanguage } from '@/shared/i18n/LanguageContext'
import { LANGS, LANG_NAMES } from '@/shared/i18n/strings'
import type { Lang } from '@/shared/i18n/strings'
import { APP_NAMES } from '@/shared/types'
import type { ImportPlan } from '@/shared/types'
import styles from './SettingsTab.module.css'
import importIcon from '@/shared/assets/svg/import.svg'
import exportIcon from '@/shared/assets/svg/export.svg'
import folderIcon from '@/shared/assets/svg/folder.svg'

export function SettingsTab() {
  const confirm = useConfirm()
  const { blueprints, loadError, reload } = useBlueprints()
  const { lang, setLang, t } = useLanguage()
  const [status,  setStatus]  = useState<{ text: string; error?: boolean } | null>(null)
  const [pending, setPending] = useState<{ preset: FlexPreset; fileName: string } | null>(null)

  async function handleExport() {
    const path = showSaveDialog('Flexio_Presets')
    if (!path) return
    try {
      setStatus({ text: t.exporting })
      await exportFlex(path)
      setStatus({ text: t.exported })
      openInExplorer(path.substring(0, path.lastIndexOf('\\')))
    } catch (e) {
      setStatus({ text: t.exportFailed(String(e)), error: true })
    }
  }

  function handleImport() {
    if (loadError) {
      setStatus({ text: t.importBlocked, error: true })
      return
    }
    const path = showOpenDialog()
    if (!path) return
    try {
      const preset = readPreset(path)
      if (!APP_NAMES.some((app) => incomingToolsets(preset, app).length > 0)) {
        setStatus({ text: t.presetEmpty })
        return
      }
      setStatus(null)
      setPending({ preset, fileName: path.split(/[\\/]/).pop() ?? path })
    } catch (e) {
      setStatus({ text: t.importFailed(String(e)), error: true })
    }
  }

  function handleImportConfirm(plan: ImportPlan) {
    if (!pending) return
    const { preset } = pending
    setPending(null)
    try {
      const result = importFlex(preset, plan)
      reload()
      setStatus({ text: t.imported(result.toolsets, result.missingFiles) })
    } catch (e) {
      setStatus({ text: t.importFailed(String(e)), error: true })
    }
  }

  async function handleDeleteAll() {
    if (!(await confirm(t.confirmDeleteAll, t.deleteAll))) return
    try {
      // Flexio's own copies only — the files the scripts were picked from stay
      rmrf(getScriptsRoot())
      saveBlueprints(getDefaultBlueprints())
      reload()
      setStatus({ text: t.allDeleted })
    } catch (e) {
      setStatus({ text: t.deleteFailed(String(e)), error: true })
    }
  }

  return (
    <div className={styles.root}>
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>{t.language}</span>
        </div>
        <select
          className={styles.langSelect}
          value={lang}
          onChange={(e) => setLang(e.target.value as Lang)}
        >
          {LANGS.map((l) => (
            <option key={l} value={l}>{LANG_NAMES[l]}</option>
          ))}
        </select>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>{t.presets}</span>
        </div>
        <div className={styles.presetBtns}>
          <button className={styles.presetBtn} onClick={handleImport}>
            <img src={importIcon} alt="" width={12} height={12} />
            {t.importJson}
          </button>
          <button className={styles.presetBtn} onClick={handleExport}>
            <img src={exportIcon} alt="" width={12} height={12} />
            {t.exportJson}
          </button>
          <button className={`${styles.presetBtn} ${styles.danger}`} onClick={handleDeleteAll}>
            {t.deleteAll}
          </button>
        </div>

        <div className={styles.fileLoc}>
          <span className={styles.fileLocLabel}>{t.defaultPresetLocation}</span>
          <div className={styles.fileLocRow}>
            <span className={styles.fileLocPath}>{getDefaultPresetPath()}</span>
            <button
              className={styles.browseBtn}
              onClick={() => openInExplorer(getDefaultPresetDir())}
              title={t.openFolder}
            >
              <img src={folderIcon} alt="" width={12} height={12} />
            </button>
          </div>
        </div>

        {status && (
          <div className={`${styles.status} ${status.error ? styles.statusErr : ''}`}>
            {status.text}
          </div>
        )}
      </section>

      <AnimatePresence>
        {pending && (
          <ImportDialog
            preset={pending.preset}
            fileName={pending.fileName}
            current={blueprints}
            onImport={handleImportConfirm}
            onCancel={() => setPending(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
