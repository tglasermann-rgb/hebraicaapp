import { useEffect, useState } from 'react'
import { api } from './api'
import type { Notificacion, Socio } from './types'

const CLAVE = 'mi-hebraica-leidas'

function leidas(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(CLAVE) ?? '[]'))
  } catch {
    return new Set()
  }
}

export function marcarLeidas(ids: string[]) {
  const s = leidas()
  ids.forEach((i) => s.add(i))
  try {
    localStorage.setItem(CLAVE, JSON.stringify([...s].slice(-300)))
  } catch {
    /* ignorar */
  }
  window.dispatchEvent(new Event('notificaciones-leidas'))
}

export const esLeida = (id: string) => leidas().has(id)

/** Notificaciones dirigidas a este socio (todos, su acción o él mismo). */
export async function misNotificaciones(socio: Socio): Promise<Notificacion[]> {
  const todas = await api.listar('notificaciones', { orden: { campo: 'created_at', asc: false }, limite: 100 })
  return todas.filter((n) => n.destino === 'todos' || (n.destino === 'accion' && n.accion === socio.accion) || (n.destino === 'socio' && n.socio_id === socio.id))
}

export function useNoLeidas(socio: Socio | null) {
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!socio) return
    let vivo = true
    const contar = () => misNotificaciones(socio).then((l) => vivo && setN(l.filter((x) => !esLeida(x.id)).length)).catch(() => {})
    contar()
    const t = setInterval(contar, 60_000)
    window.addEventListener('notificaciones-leidas', contar)
    return () => {
      vivo = false
      clearInterval(t)
      window.removeEventListener('notificaciones-leidas', contar)
    }
  }, [socio])
  return n
}
