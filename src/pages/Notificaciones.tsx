import { Bell } from 'lucide-react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { Cargando, Pagina, Tarjeta, Vacio } from '@/components/ui'
import { fHace } from '@/lib/formato'
import { esLeida, marcarLeidas, misNotificaciones } from '@/lib/notificaciones'
import { useDatos } from '@/lib/useDatos'

export default function Notificaciones() {
  const { socio } = useAuth()
  const nav = useNavigate()
  const { datos, cargando } = useDatos(() => misNotificaciones(socio!), [socio?.id])
  const noLeidas = new Set((datos ?? []).filter((n) => !esLeida(n.id)).map((n) => n.id))

  useEffect(() => {
    if (datos?.length) marcarLeidas(datos.map((n) => n.id))
  }, [datos])

  return (
    <Pagina titulo="Notificaciones" atras>
      {cargando ? <Cargando /> : !datos?.length ? <Vacio icono={<Bell />} titulo="No tienes notificaciones" /> : (
        <div className="space-y-2.5">
          {datos.map((n) => (
            <Tarjeta key={n.id} onClick={n.enlace ? () => nav(n.enlace!) : undefined} className="flex gap-3 p-4">
              <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${noLeidas.has(n.id) ? 'bg-llama' : 'bg-transparent'}`} />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900">{n.titulo}</p>
                <p className="text-sm text-slate-600">{n.cuerpo}</p>
                <p className="mt-1 text-xs text-slate-400">{fHace(n.created_at)}</p>
              </div>
            </Tarjeta>
          ))}
        </div>
      )}
    </Pagina>
  )
}
