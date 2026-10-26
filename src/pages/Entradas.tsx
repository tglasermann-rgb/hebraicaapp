import { Ticket } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { Boton, Cargando, CodigoQR, Hoja, Insignia, Pagina, Tarjeta, Vacio } from '@/components/ui'
import { api } from '@/lib/api'
import { fDiaHora } from '@/lib/formato'
import { useDatos } from '@/lib/useDatos'
import type { Entrada, Evento } from '@/lib/types'

export default function Entradas() {
  const { socio } = useAuth()
  const { datos, cargando } = useDatos(async () => {
    const entradas = await api.listar('entradas', { eq: { accion: socio!.accion! }, orden: { campo: 'created_at', asc: false } })
    const ids = [...new Set(entradas.map((e) => e.evento_id))]
    const eventos = ids.length ? await api.listar('eventos', { in: { id: ids } }) : []
    return { entradas, eventos: new Map(eventos.map((e) => [e.id, e])) }
  }, [socio?.accion])
  const [ver, setVer] = useState<{ e: Entrada; ev?: Evento } | null>(null)

  return (
    <Pagina titulo="Mis entradas" atras>
      {cargando ? (
        <Cargando />
      ) : !datos?.entradas.length ? (
        <Vacio icono={<Ticket />} titulo="No tienes entradas" texto="Compra entradas para conciertos y eventos desde la agenda.">
          <Link to="/agenda"><Boton variante="secundario">Ver agenda</Boton></Link>
        </Vacio>
      ) : (
        <div className="space-y-3">
          {datos.entradas.map((e) => {
            const ev = datos.eventos.get(e.evento_id)
            return (
              <Tarjeta key={e.id} onClick={() => e.estado === 'activa' && setVer({ e, ev })} className="flex items-center gap-3 p-4">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-llama-50 text-llama"><Ticket className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900">{ev?.titulo}</p>
                  <p className="truncate text-sm text-slate-500">{e.nombre_asistente}{ev && ` · ${fDiaHora(ev.fecha_inicio)}`}</p>
                </div>
                <Insignia color={e.estado === 'activa' ? 'verde' : 'gris'}>{e.estado === 'activa' ? 'Ver QR' : e.estado}</Insignia>
              </Tarjeta>
            )
          })}
        </div>
      )}
      <Hoja abierta={!!ver} onCerrar={() => setVer(null)} titulo="Entrada">
        {ver && (
          <div className="flex flex-col items-center pb-4 text-center">
            <p className="font-display text-xl font-extrabold text-tinta">{ver.ev?.titulo}</p>
            <p className="text-slate-600">{ver.e.nombre_asistente}</p>
            {ver.ev && <p className="text-sm text-slate-500">{fDiaHora(ver.ev.fecha_inicio)} · {ver.ev.lugar}</p>}
            <div className="mt-4"><CodigoQR valor={`HEB:E:${ver.e.codigo}`} tam={240} /></div>
            <p className="mt-3 text-xs text-slate-500">Presenta este código en la entrada del evento.</p>
          </div>
        )}
      </Hoja>
    </Pagina>
  )
}
