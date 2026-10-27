import '@fontsource-variable/inter'
import '@fontsource-variable/plus-jakarta-sans'
import './index.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App'

// Actualizaciones: al publicar una versión nueva el app la descarga y se recarga sola.
// Se revisa al abrirla, al volver a ella y cada 15 minutos.
registerSW({
  immediate: true,
  onRegisteredSW(_url, reg) {
    if (!reg) return
    const revisar = () => reg.update().catch(() => {})
    setInterval(revisar, 15 * 60 * 1000)
    document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && revisar())
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
