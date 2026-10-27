import { CalendarDays, MapPin, Minus, Plus, Star, Ticket } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { Boton, Campo, Cargando, MensajeError, Pagina, Portada, Tarjeta, useAviso } from '@/components/ui'
import { api } from '@/lib/api'
import { depto } from '@/lib/brand'
import { capitalizar, fEvento, fFecha, fHora, fUSD } from '@/lib/formato'
import { useDatos } from '@/lib/useDatos'

export default function Evento() {
  const { id } = useParams()
  const { socio } = useAuth()
  const aviso = useAviso()
  const ev = useDatos(() => api.obtener('eventos', id!), [id])
  const mias = useDatos(() => api.listar('entradas', { eq: { evento_id: id!, accion: socio!.accion! } }), [id])
  const encuesta = useDatos(() => api.listar('encuestas', { eq: { evento_id: id! } }), [id])
  const familia = useDatos(() => api.listar('socios', { eq: { accion: socio!.accion! } }), [socio?.accion])
  const [nombres, setNombres] = useState<string[]>([])
  const [error, setError] = useState('')
  const [comprando, setComprando] = useState(false)

  useEffect(() => {
    if (socio && nombres.length === 0) setNombres([`${socio.nombre} ${socio.apellido}`])
  }, [socio, nombres.length])

  if (ev.cargando) return <Pagina titulo="Evento" atras><Cargando /></Pagina>
  const e = ev.datos
  if (!e) return <Pagina titulo="Evento" atras><p>No encontrado</p></Pagina>
  const d = depto(e.departamento)
  const activas = (mias.datos ?? []).filter((x) => x.estado !== 'anulada')
  const pasado = new Date(e.fecha_inicio) < new Date()

  async function comprar() {
    setError('')
    const lista = nombres.map((n) => n.trim()).filter(Boolean)
    if (lista.length === 0) return setError('Indica el nombre de cada asistente')
    setComprando(true)
    try {
      await api.comprarEntradas(e!.id, lista)
      aviso(e!.precio_usd > 0 ? `¡Listo! ${fUSD(e!.precio_usd * lista.length)} cargados a tu cuenta.` : '¡Entradas reservadas!')
      mias.recargar()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setComprando(false)
    }
  }

  return (
    <Pagina titulo={e.titulo} atras sinPadding>
      <Portada imagen={e.imagen_url} departamento={e.departamento} className="h-52" />
      <div className="px-4">
        <Tarjeta className="-mt-8 p-4">
          <p className="text-sm font-medium" style={{ color: d.color }}>{d.nombre}</p>
          <h2 className="font-display text-[26px] font-extrabold text-tinta">{e.titulo}</h2>
          <p className="mt-2 flex items-center gap-2 text-slate-600"><CalendarDays className="h-4 w-4" />{e.todo_el_dia ? capitalizar(fEvento(e)) : <>{capitalizar(fFecha(e.fecha_inicio, "EEEE d 'de' MMMM"))} · {fHora(e.fecha_inicio)}{e.fecha_fin && ` – ${fHora(e.fecha_fin)}`}</>}</p>
          {e.lugar && <p className="mt-1 flex items-center gap-2 text-slate-600"><MapPin className="h-4 w-4" />{e.lugar}</p>}
        </Tarjeta>
        {e.descripcion && <p className="mt-4 whitespace-pre-line leading-relaxed text-slate-700">{e.descripcion}</p>}

        {activas.length > 0 && (
          <Link to="/entradas">
            <Tarjeta className="mt-5 flex items-center gap-3 bg-emerald-50 p-4">
              <Ticket className="h-6 w-6 text-emerald-700" />
              <p className="flex-1 text-sm text-emerald-800">Tienes <b>{activas.length}</b> entrada(s) para este evento. Toca para ver los códigos QR.</p>
            </Tarjeta>
          </Link>
        )}

        {(encuesta.datos?.length ?? 0) > 0 && (
          <Link to="/encuestas">
            <Tarjeta className="mt-5 flex items-center gap-3 p-4">
              <Star className="h-6 w-6 fill-amber-400 text-amber-400" />
              <p className="flex-1 text-sm font-semibold">{pasado ? '¿Cómo estuvo? Califica este evento' : 'Este evento tiene encuesta'}</p>
            </Tarjeta>
          </Link>
        )}

        {e.venta_entradas && !pasado && (
          <Tarjeta className="mt-5 p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-extrabold text-tinta">Entradas</h3>
              <span className="font-semibold text-llama">{e.precio_usd > 0 ? `${fUSD(e.precio_usd)} c/u` : 'Gratis'}</span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm text-slate-600">Cantidad</span>
              <div className="flex items-center gap-3">
                <button aria-label="Menos" onClick={() => setNombres((n) => n.slice(0, Math.max(1, n.length - 1)))} className="grid h-9 w-9 place-items-center rounded-full bg-slate-100"><Minus className="h-4 w-4" /></button>
                <span className="w-6 text-center text-lg font-semibold">{nombres.length}</span>
                <button aria-label="Más" onClick={() => setNombres((n) => (e.max_por_accion && n.length + activas.length >= e.max_por_accion ? n : [...n, '']))} className="grid h-9 w-9 place-items-center rounded-full bg-slate-100"><Plus className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="mt-3 space-y-2">
              {nombres.map((n, i) => (
                <Campo key={i} list="familia" placeholder={`Asistente ${i + 1}`} value={n} onChange={(ev) => setNombres((l) => l.map((x, j) => (j === i ? ev.target.value : x)))} />
              ))}
              <datalist id="familia">
                {(familia.datos ?? []).map((f) => <option key={f.id} value={`${f.nombre} ${f.apellido}`} />)}
              </datalist>
            </div>
            {e.max_por_accion && <p className="mt-2 text-xs text-slate-500">Máximo {e.max_por_accion} entradas por acción.</p>}
            {error && <div className="mt-3"><MensajeError texto={error} /></div>}
            <Boton variante="acento" bloque className="mt-4" cargando={comprando} onClick={comprar}>
              {e.precio_usd > 0 ? `Comprar · ${fUSD(e.precio_usd * nombres.length)}` : 'Reservar entradas'}
            </Boton>
            {e.precio_usd > 0 && <p className="mt-2 text-center text-xs text-slate-500">El monto se carga al estado de cuenta de tu acción.</p>}
          </Tarjeta>
        )}
      </div>
    </Pagina>
  )
}
