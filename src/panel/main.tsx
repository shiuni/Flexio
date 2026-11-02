import React from 'react'
import ReactDOM from 'react-dom/client'
import { BlueprintsProvider } from '@/shared/context/BlueprintsContext'
import { LanguageProvider } from '@/shared/i18n/LanguageContext'
import App from './App'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LanguageProvider>
      <BlueprintsProvider>
        <App />
      </BlueprintsProvider>
    </LanguageProvider>
  </React.StrictMode>,
)
