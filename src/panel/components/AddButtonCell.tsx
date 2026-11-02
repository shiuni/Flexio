import { motion } from 'framer-motion'
import { getPanelSlot, openSettingsWindow } from '@/shared/lib/cepInterface'
import { useT } from '@/shared/i18n/LanguageContext'
import type { AppName, IconShape } from '@/shared/types'
import styles from './AddButtonCell.module.css'

interface Props {
  size: number
  app: AppName
  iconShape?: IconShape
  listMode?: boolean
}

export function AddButtonCell({ size, app, iconShape, listMode }: Props) {
  const slot = getPanelSlot()
  const t = useT()

  if (listMode) {
    return (
      <motion.button
        className={styles.listBtn}
        onClick={() => openSettingsWindow(app, slot)}
        whileHover={{ backgroundColor: 'var(--surface-hover)' }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.12 }}
        title={t.addScriptButton}
      >
        <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
          <path d="M10 4v12M4 10h12" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span className={styles.listLabel}>{t.addButton}</span>
      </motion.button>
    )
  }

  return (
    <motion.button
      className={styles.btn}
      style={{ width: size, height: size }}
      onClick={() => openSettingsWindow(app, slot)}
      whileHover={{ scale: 1.06, borderColor: 'var(--accent)' }}
      whileTap={{ scale: 0.94 }}
      transition={{ duration: 0.12 }}
      title={t.addScriptButton}
    >
      <div className={`${styles.iconArea} ${iconShape === 'crisp' ? styles.crisp : ''}`}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 4v12M4 10h12" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    </motion.button>
  )
}
