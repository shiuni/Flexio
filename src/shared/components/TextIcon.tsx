import React from 'react'
import { fitIconFontSize, getIconRows } from '../lib/iconGenerator'
import styles from './TextIcon.module.css'

interface TextIconProps {
  text: string
  /** Edge length of the square icon box in px — the font is fitted to it */
  box: number
}

/** Up to 3 rows of icon text, sized to fill the icon box */
export function TextIcon({ text, box }: TextIconProps) {
  const rows = getIconRows(text)
  return (
    <div className={styles.textIcon} style={{ fontSize: fitIconFontSize(rows, box) }}>
      {rows.map((row, i) => <span key={i}>{row}</span>)}
    </div>
  )
}
