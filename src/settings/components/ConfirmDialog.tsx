import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useT } from '@/shared/i18n/LanguageContext'
import styles from './ConfirmDialog.module.css'

/** Asks the user to confirm a destructive action; resolves true when confirmed */
type Confirm = (message: string, confirmLabel?: string) => Promise<boolean>

interface Request {
  message: string
  confirmLabel?: string
  resolve: (ok: boolean) => void
}

const ConfirmContext = createContext<Confirm>(() => Promise.resolve(false))

export function useConfirm(): Confirm {
  return useContext(ConfirmContext)
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const t = useT()
  const [request, setRequest] = useState<Request | null>(null)
  const confirmBtn = useRef<HTMLButtonElement>(null)

  const confirm = useCallback<Confirm>(
    (message, confirmLabel) =>
      new Promise<boolean>((resolve) => {
        setRequest((prev) => {
          prev?.resolve(false)
          return { message, confirmLabel, resolve }
        })
      }),
    [],
  )

  const close = useCallback((ok: boolean) => {
    setRequest((prev) => {
      prev?.resolve(ok)
      return null
    })
  }, [])

  useEffect(() => {
    if (!request) return
    confirmBtn.current?.focus()
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        close(false)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        close(true)
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [request, close])

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {request && (
        <div
          className={styles.overlay}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close(false)
          }}
        >
          <div className={styles.dialog} role="alertdialog" aria-modal="true">
            <p className={styles.message}>{request.message}</p>
            <div className={styles.footer}>
              <button className={styles.cancelBtn} onClick={() => close(false)}>
                {t.cancel}
              </button>
              <button ref={confirmBtn} className={styles.confirmBtn} onClick={() => close(true)}>
                {request.confirmLabel ?? t.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}
