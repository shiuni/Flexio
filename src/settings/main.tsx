import React from 'react'
import ReactDOM from 'react-dom/client'
import { BlueprintsProvider } from '@/shared/context/BlueprintsContext'
import { LanguageProvider } from '@/shared/i18n/LanguageContext'
import { ConfirmProvider } from './components/ConfirmDialog'
import App from './App'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LanguageProvider>
      <BlueprintsProvider>
        <ConfirmProvider>
          <App />
        </ConfirmProvider>
      </BlueprintsProvider>
    </LanguageProvider>
  </React.StrictMode>,
)
