import { motion } from 'framer-motion'
import { useT } from '@/shared/i18n/LanguageContext'
import styles from './SettingsGear.module.css'
import settingIcon from '@/shared/assets/svg/setting.svg'

interface Props {
  onClick: () => void
}

export function SettingsGear({ onClick }: Props) {
  const t = useT()
  return (
    <motion.button
      className={styles.gear}
      onClick={onClick}
      whileHover={{ rotate: 45, scale: 1.15 }}
      whileTap={{ scale: 0.9 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      title={t.flexioSettings}
    >
      <img src={settingIcon} alt="" width={14} height={14} />
    </motion.button>
  )
}
