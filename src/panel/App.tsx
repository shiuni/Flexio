import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useBlueprints } from '@/shared/context/BlueprintsContext'
import { useT } from '@/shared/i18n/LanguageContext'
import { getHostApp, getPanelSlot, openSettingsWindow } from '@/shared/lib/cepInterface'
import { useVisibleWidth } from '@/shared/lib/panelVisibleWidth'
import { ButtonGrid } from './components/ButtonGrid'
import { SettingsGear } from './components/SettingsGear'
import styles from './App.module.css'

export default function App() {
  const { blueprints, isLoaded, loadError } = useBlueprints()
  const t = useT()
  const app = getHostApp()
  const slot = getPanelSlot()

  const toolsetId = blueprints.allocation[app][slot]
  const toolset = useMemo(
    () => blueprints.apps[app].toolsets.find((ts) => ts.id === toolsetId) ?? null,
    [blueprints, app, toolsetId],
  )

  const { scale, spacing, flipToReorder, uiMode, iconShape, columns } = blueprints.panelSettings[app][slot]

  // A frame narrower than the host's minimum view width clips the page instead
  // of resizing it — lay out to the part that shows so AUTO can reach one column
  const visibleWidth = useVisibleWidth()

  if (!isLoaded) return null

  return (
    <div className={styles.root} style={visibleWidth !== null ? { width: visibleWidth } : undefined}>
      <motion.div
        className={styles.content}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
      >
        {toolset ? (
          <ButtonGrid
            buttons={toolset.buttons}
            app={app}
            toolsetId={toolsetId}
            scale={scale}
            spacing={spacing}
            flipToReorder={flipToReorder}
            uiMode={uiMode}
            iconShape={iconShape}
            columns={columns}
          />
        ) : loadError ? (
          <div className={styles.empty}>
            <span className={styles.emptyText}>
              {t.panelLoadError}
              <br />
              {t.openSettingsForDetails}
            </span>
          </div>
        ) : null /* no toolset assigned: stay blank, the gear is the way in */}
      </motion.div>

      <SettingsGear onClick={() => openSettingsWindow(app, slot)} />
    </div>
  )
}
