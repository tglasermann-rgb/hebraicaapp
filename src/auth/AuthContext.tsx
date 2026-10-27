import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { api } from '@/lib/api'
import type { Sesion } from '@/lib/backend'
import { ROLES_STAFF, type Registro, type Rol, type Socio } from '@/lib/types'

interface Ctx {
  cargando: boolean
  sesion: Sesion | null
  socio: Socio | null
  /** Solicitud de acceso cuando el usuario aún no está aprobado */
  registro: Registro | null
  esStaff: boolean
  tieneRol: (...roles: Rol[]) => boolean
  recargar: () => Promise<void>
  salir: () => Promise<void>
}

const AuthCtx = createContext<Ctx>(null!)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [cargando, setCargando] = useState(true)
  const [sesion, setSesion] = useState<Sesion | null>(null)
  const [socio, setSocio] = useState<Socio | null>(null)
  const [registro, setRegistro] = useState<Registro | null>(null)

  const usuarioActual = useRef<string | null | undefined>(undefined)
  const cargarSocio = useCallback(async (s: Sesion | null) => {
    // Se carga todo antes de publicar la sesión, para que nadie decida adónde ir con datos a medias.
    // Solo se muestra "cargando" si cambió el usuario (no en cada renovación automática del token).
    if ((s?.userId ?? null) !== usuarioActual.current) setCargando(true)
    usuarioActual.current = s?.userId ?? null
    const so = s ? await api.miSocio().catch(() => null) : null
    const reg = s && !so ? await api.miRegistro().catch(() => null) : null
    setSesion(s)
    setSocio(so)
    setRegistro(reg)
    setCargando(false)
  }, [])

  useEffect(() => {
    api.sesionActual().then(cargarSocio)
    return api.alCambiarSesion((s) => {
      cargarSocio(s)
    })
  }, [cargarSocio])

  const tieneRol = (...roles: Rol[]) => !!socio && socio.estado === 'activo' && (socio.rol === 'admin' || roles.includes(socio.rol))

  return (
    <AuthCtx.Provider
      value={{
        cargando,
        sesion,
        socio,
        registro,
        esStaff: !!socio && ROLES_STAFF.includes(socio.rol),
        tieneRol,
        recargar: () => cargarSocio(sesion),
        salir: () => api.salir(),
      }}
    >
      {children}
    </AuthCtx.Provider>
  )
}

export const useAuth = () => useContext(AuthCtx)
