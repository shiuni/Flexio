/**
 * UI strings for every supported language.
 * `en` defines the keys; each other language must provide all of them.
 */

export type Lang = 'en' | 'ja'

export const LANGS: Lang[] = ['en', 'ja']

/** Each language's own name, shown as-is whatever the current language is */
export const LANG_NAMES: Record<Lang, string> = {
  en: 'English',
  ja: '日本語',
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

const en = {
  // Shared
  loading: 'Loading…',
  cancel: 'Cancel',
  edit: 'Edit',
  duplicate: 'Duplicate',
  delete: 'Delete',
  browse: 'Browse',
  unassigned: 'Unassigned',
  unassignedOption: '— Unassigned —',

  // Panel
  noToolsetAssigned: 'No toolset assigned.',
  openSettingsToConfigure: 'Open settings to configure.',
  panelLoadError: 'Flexio settings could not be read.',
  openSettingsForDetails: 'Open settings for details.',
  addScriptButton: 'Add script button',
  addButton: 'Add Button',
  flexioSettings: 'Flexio Settings',

  // Settings window
  tabButtons: 'Buttons',
  tabAllocation: 'Allocation',
  tabSettings: 'Settings',
  settingsLoadError:
    'Flexio could not read its settings file, so changes are not saved. ' +
    'Fix or remove the file, or use Delete All in Settings to start over.',

  // Buttons tab
  addToolset: 'Add Toolset',
  noToolsets: 'No toolsets yet.',
  defaultToolsetName: (n: number) => `Toolset ${n}`,
  renameToolset: 'Rename toolset',
  deleteToolset: 'Delete toolset',
  confirmDeleteToolset: (name: string) => `Delete toolset "${name}" and all its scripts?`,
  noButtonsIn: (name: string) => `No buttons added to ${name}.`,
  addButtonIn: (name: string) => `Add Button in ${name}`,
  confirmDeleteButton: (name: string) => `Delete "${name}"?`,
  hiddenClickToShow: 'Hidden from the panel — click to show',
  shownClickToHide: 'Shown in the panel — click to hide',

  // Button form
  selectScriptFile: 'Please select a script file.',
  enterButtonName: 'Please enter a button name.',
  copyFailed: (msg: string) => `Could not copy the file: ${msg}`,
  scriptFile: 'Script File',
  noFileSelected: 'No file selected',
  iconFile: 'Icon (PNG / JPG / SVG)',
  iconCleared: 'Cleared (text icon)',
  autoTextIcon: 'Use auto text icon',
  clearIcon: 'Clear icon',
  name: 'Name',
  buttonNamePlaceholder: 'Button name',
  iconName: 'Icon Name',
  iconNameHint: (rows: number, chars: number) => `Up to ${rows} lines / ${chars} chars. Empty uses the Name.`,
  imageIconInUse: 'Image icon in use',
  preview: 'Preview',
  description: 'Description',
  descriptionPlaceholder: 'Brief description shown on hover',
  update: 'Update',

  // Allocation tab
  columnsAuto: 'AUTO',
  modeIcon: 'Icon',
  modeIconName: 'Icon + Name',
  modeName: 'Name',
  shapeCrisp: 'Crisp',
  shapeRounded: 'Rounded',
  toolset: 'Toolset',
  columnsIconOnly: 'Column count only applies in Icon mode',
  scale: 'Scale',
  spacing: 'Spacing',
  flipToReorder: 'Flip to Reorder',

  // Settings tab
  language: 'Language',
  presets: 'Presets',
  importJson: 'Import .json',
  exportJson: 'Export .json',
  deleteAll: 'Delete All',
  defaultPresetLocation: 'Default Preset Location',
  openFolder: 'Open folder',
  exporting: 'Exporting…',
  exported: 'Exported successfully.',
  exportFailed: (msg: string) => `Export failed: ${msg}`,
  importFailed: (msg: string) => `Import failed: ${msg}`,
  importBlocked: 'Import failed: the current settings could not be read.',
  presetEmpty: 'This preset contains no toolsets.',
  imported: (toolsets: number, missing: number) =>
    `Imported ${plural(toolsets, 'toolset', 'toolsets')}.` +
    (missing ? ` ${missing} file${missing === 1 ? ' was' : 's were'} missing from the preset.` : ''),
  confirmDeleteAll: 'Delete ALL scripts and reset Flexio? This cannot be undone.',
  allDeleted: 'All data deleted.',
  deleteFailed: (msg: string) => `Delete failed: ${msg}`,

  // Import dialog
  importPreset: 'Import Preset',
  keepBoth: 'Keep Both',
  replace: 'Replace',
  skip: 'Skip',
  import: 'Import',
  toolsets: 'Toolsets',
  panels: 'Panels',
  notImported: 'Not imported',
  replacesCurrent: 'Replaces the buttons of the current one',
  addedAs: (name: string) => `Added as “${name}”`,
  buttonCount: (n: number) => plural(n, 'button', 'buttons'),
  usePresetPanels: 'Use preset’s panels',
  keepCurrent: (name: string) => `Keep current (${name})`,
  fromPreset: 'From preset',
  current: 'Current',
}

export type Strings = typeof en

/** Keys of the plain (non-template) strings */
export type TextKey = { [K in keyof Strings]: Strings[K] extends string ? K : never }[keyof Strings]

const ja: Strings = {
  // Shared
  loading: '読み込み中…',
  cancel: 'キャンセル',
  edit: '編集',
  duplicate: '複製',
  delete: '削除',
  browse: '参照',
  unassigned: '未割り当て',
  unassignedOption: '— 未割り当て —',

  // Panel
  noToolsetAssigned: 'ツールセット未割り当て',
  openSettingsToConfigure: '設定から割り当て',
  panelLoadError: '設定を読み込めません',
  openSettingsForDetails: '詳細は設定を開いて確認',
  addScriptButton: 'ボタンを追加',
  addButton: 'ボタンを追加',
  flexioSettings: 'Flexio 設定',

  // Settings window
  tabButtons: 'ボタン',
  tabAllocation: '割り当て',
  tabSettings: '設定',
  settingsLoadError:
    '設定ファイルを読み込めないため、変更は保存されません。' +
    'ファイルを修正・削除するか、設定の「すべて削除」で初期化してください。',

  // Buttons tab
  addToolset: 'ツールセットを追加',
  noToolsets: 'ツールセットなし',
  defaultToolsetName: (n) => `ツールセット ${n}`,
  renameToolset: '名前を変更',
  deleteToolset: 'ツールセットを削除',
  confirmDeleteToolset: (name) => `ツールセット「${name}」とすべてのスクリプトを削除しますか？`,
  noButtonsIn: (name) => `${name}にボタンなし`,
  addButtonIn: (name) => `${name}にボタンを追加`,
  confirmDeleteButton: (name) => `「${name}」を削除しますか？`,
  hiddenClickToShow: '非表示（クリックで表示）',
  shownClickToHide: '表示中（クリックで非表示）',

  // Button form
  selectScriptFile: 'スクリプトファイルを選択してください。',
  enterButtonName: 'ボタン名を入力してください。',
  copyFailed: (msg) => `ファイルをコピーできません: ${msg}`,
  scriptFile: 'スクリプトファイル',
  noFileSelected: '未選択',
  iconFile: 'アイコン（PNG / JPG / SVG）',
  iconCleared: 'クリア済み（テキストアイコン）',
  autoTextIcon: '自動テキストアイコン',
  clearIcon: 'アイコンをクリア',
  name: '名前',
  buttonNamePlaceholder: 'ボタン名',
  iconName: 'アイコン名',
  iconNameHint: (rows, chars) => `最大 ${rows} 行・${chars} 文字。空欄で名前を使用`,
  imageIconInUse: '画像アイコン使用中',
  preview: 'プレビュー',
  description: '説明',
  descriptionPlaceholder: 'ホバー時に表示',
  update: '更新',

  // Allocation tab
  columnsAuto: '自動',
  modeIcon: 'アイコン',
  modeIconName: 'アイコン + 名前',
  modeName: '名前',
  shapeCrisp: '角',
  shapeRounded: '角丸',
  toolset: 'ツールセット',
  columnsIconOnly: '列数はアイコン表示でのみ有効',
  scale: 'スケール',
  spacing: '間隔',
  flipToReorder: 'ドラッグで並べ替え',

  // Settings tab
  language: '言語',
  presets: 'プリセット',
  importJson: '.json を読み込み',
  exportJson: '.json を書き出し',
  deleteAll: 'すべて削除',
  defaultPresetLocation: '既定のプリセット保存先',
  openFolder: 'フォルダーを開く',
  exporting: '書き出し中…',
  exported: '書き出しました。',
  exportFailed: (msg) => `書き出しに失敗しました: ${msg}`,
  importFailed: (msg) => `読み込みに失敗しました: ${msg}`,
  importBlocked: '読み込みに失敗しました: 現在の設定を読み込めません。',
  presetEmpty: 'このプリセットにはツールセットがありません。',
  imported: (toolsets, missing) =>
    `ツールセットを ${toolsets} 件読み込みました。` +
    (missing ? `プリセットに無いファイルが ${missing} 件ありました。` : ''),
  confirmDeleteAll: 'すべてのスクリプトを削除して Flexio を初期化しますか？元に戻せません。',
  allDeleted: 'すべてのデータを削除しました。',
  deleteFailed: (msg) => `削除に失敗しました: ${msg}`,

  // Import dialog
  importPreset: 'プリセットを読み込み',
  keepBoth: '両方残す',
  replace: '置き換え',
  skip: 'スキップ',
  import: '読み込む',
  toolsets: 'ツールセット',
  panels: 'パネル',
  notImported: '読み込まない',
  replacesCurrent: '既存のボタンを置き換え',
  addedAs: (name) => `「${name}」として追加`,
  buttonCount: (n) => `ボタン ${n} 個`,
  usePresetPanels: 'プリセットの割り当てを使用',
  keepCurrent: (name) => `現在のまま（${name}）`,
  fromPreset: 'プリセットから',
  current: '現在',
}

export const STRINGS: Record<Lang, Strings> = { en, ja }
