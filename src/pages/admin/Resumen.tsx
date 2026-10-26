import { Link } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { Tarjeta } from '@/components/ui'
import { api } from '@/lib/api'
import { hoyISO } from '@/lib/formato'
import { useDatos } from '@/lib/useDatos'
import { NOMBRE_ROL } from '@/lib/types'
import { useSecciones } from './AdminLayout'

export default function Resumen() {
  const { socio, tieneRol } = useAuth()
  const secciones = useSecciones().filter((s) => s.a !== '/admin')
  const { datos } = useDatos(async () => {
    const r: { k: string; v: number; a: string }[] = []
    if (tieneRol('administracion')) {
      r.push({ k: 'Pagos por aprobar', v: (await api.listar('pagos', { eq: { estado: 'pendiente' } })).length, a: '/admin/pagos' })
      r.push({ k: 'Socios registrados', v: (await api.listar('socios')).length, a: '/admin/socios' })
    }
    if (tieneRol('deportes', 'seguridad')) r.push({ k: 'Reservas hoy', v: (await api.listar('reservas', { eq: { fecha: hoyISO(), estado: 'confirmada' } })).length, a: '/admin/reservas' })
    r.push({ k: 'Solicitudes abiertas', v: (await api.listar('solicitudes', { in: { estado: ['abierta', 'en_proceso'] } })).length, a: '/admin/solicitudes' })
    return r
  })

  return (
    <div>
      <p className="text-slate-600">Hola {socio?.nombre}, rol: <b>{NOMBRE_ROL[socio!.rol]}</b></p>
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {(datos ?? []).map((x) => (
          <Link key={x.k} to={x.a}>
            <Tarjeta className="p-4">
              <p className="font-display text-3xl font-bold text-azul">{x.v}</p>
              <p className="text-sm text-slate-500">{x.k}</p>
            </Tarjeta>
          </Link>
        ))}
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:hidden">
        {secciones.map(({ a, texto, icono: I }) => (
          <Link key={a} to={a}>
            <Tarjeta className="flex flex-col items-start gap-2 p-4">
              <I className="h-6 w-6 text-azul" />
              <span className="text-sm font-medium text-slate-800">{texto}</span>
            </Tarjeta>
          </Link>
        ))}
      </div>
    </div>
  )
}
