/** Apariencia del app: oscuro (por defecto), claro, o la del teléfono. Se guarda en este dispositivo. */
export type Tema = 'oscuro' | 'claro' | 'auto'

const CLAVE = 'mi-hebraica-tema'
const sistema = window.matchMedia('(prefers-color-scheme: light)')

export function temaGuardado(): Tema {
  try {
    const t = localStorage.getItem(CLAVE)
    if (t === 'claro' || t === 'auto') return t
  } catch {
    /* almacenamiento no disponible */
  }
  return 'oscuro'
}

function pintar(t: Tema) {
  const claro = t === 'claro' || (t === 'auto' && sistema.matches)
  if (claro) document.documentElement.dataset.tema = 'claro'
  else delete document.documentElement.dataset.tema
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', claro ? '#F4F5F8' : '#0B0C10')
}

export function fijarTema(t: Tema) {
  try {
    localStorage.setItem(CLAVE, t)
  } catch {
    /* se aplica igual, sin recordarlo */
  }
  pintar(t)
}

/** Se llama al arrancar, antes de dibujar, para que no parpadee. */
export function iniciarTema() {
  pintar(temaGuardado())
  sistema.addEventListener('change', () => temaGuardado() === 'auto' && pintar('auto'))
}
