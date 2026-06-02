import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { defineCustomElements } from 'ionicons/loader'
import './index.css'
import App from './App.tsx'
import { setupIcons } from './icons'

// Register the <ion-icon> custom element and the bundled icon set.
defineCustomElements(window)
setupIcons()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
