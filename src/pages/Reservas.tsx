import { addDays, format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarCheck, Clock } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { Boton, Campo, Cargando, FilaEnlace, Hoja, Lista, MensajeError, Pagina, Seccion, Selector, Tarjeta, Vacio, useAviso } from '@/components/ui'
import { api } from '@/lib/api'
import { fFecha, fHoraTexto, hoyISO } from '@/lib/formato'
import { useDatos } from '@/lib/useDatos'

export default function Reservas() {
  const { socio } = useAuth()
  const aviso = useAviso()
  const inst = useDatos(() => api.listar('instalaciones', { eq: { activo: true }, orden: { campo: 'nombre' } }))
  const mias = useDatos(() => api.listar('reservas', { eq: { accion: socio!.accion!, estado: 'confirmada' }, gte: { fecha: hoyISO() }, orden: { campo: 'fecha' } }), [socio?.accion])
  const porTipo = new Map<string, NonNullable<typeof inst.datos>>()
  for (const i of inst.datos ?? []) porTipo.set(i.tipo, [...(porTipo.get(i.tipo) ?? []), i])
  const nombreInst = (id: string) => inst.datos?.find((i) => i.id === id)?.nombre ?? ''

  async function cancelar(id: string) {
    if (!confirm('¿Cancelar esta reserva?')) return
    try {
      await api.cancelarReserva(id)
      aviso('Reserva cancelada')
      mias.recargar()
    } catch (e) {
      aviso((e as Error).message, 'error')
    }
  }

  return (
    <Pagina titulo="Reservas" atras>
      {(mias.datos?.length ?? 0) > 0 && (
        <Seccion titulo="Mis próximas reservas" className="mt-0">
          <Lista>
            {mias.datos!.map((r) => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><CalendarCheck className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{nombreInst(r.instalacion_id)}</p>
                  <p className="text-sm text-slate-500">{fFecha(r.fecha, "EEE d 'de' MMM")} · {fHoraTexto(r.hora_inicio)}</p>
                </div>
                <button onClick={() => cancelar(r.id)} className="text-sm font-medium text-red-600">Cancelar</button>
              </div>
            ))}
          </Lista>
        </Seccion>
      )}
      {inst.cargando ? (
        <Cargando />
      ) : (
        [...porTipo.entries()].map(([tipo, lista]) => (
          <Seccion key={tipo} titulo={tipo}>
            <Lista>
              {lista.map((i) => (
                <FilaEnlace key={i.id} a={`/reservas/${i.id}`} icono={<CalendarCheck className="h-5 w-5" />} titulo={i.nombre} sub={`${fHoraTexto(i.hora_apertura)} – ${fHoraTexto(i.hora_cierre)}`} />
              ))}
            </Lista>
          </Seccion>
        ))
      )}
    </Pagina>
  )
}

function bloques(apertura: string, cierre: string, dur: number) {
  const aMin = (h: string) => Number(h.split(':')[0]) * 60 + Number(h.split(':')[1])
  const res: string[] = []
  for (let m = aMin(apertura); m + dur <= aMin(cierre); m += dur) res.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`)
  return res
}

export function Reservar() {
  const { id } = useParams()
  const { socio } = useAuth()
  const aviso = useAviso()
  const [fecha, setFecha] = useState(hoyISO())
  const [hora, setHora] = useState<string | null>(null)
  const [quien, setQuien] = useState(socio!.id)
  const [jugadores, setJugadores] = useState<string[]>([])
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const inst = useDatos(() => api.obtener('instalaciones', id!), [id])
  const ocupados = useDatos(() => api.horariosOcupados(id!, fecha), [id, fecha])
  const familia = useDatos(() => api.listar('socios', { eq: { accion: socio!.accion! } }), [socio?.accion])

  const i = inst.datos
  if (inst.cargando) return <Pagina titulo="Reservar" atras><Cargando /></Pagina>
  if (!i) return <Pagina titulo="Reservar" atras><Vacio titulo="Instalación no encontrada" /></Pagina>

  const dias = Array.from({ length: 14 }, (_, n) => addDays(new Date(), n))
  const ahoraHM = format(new Date(), 'HH:mm')
  const lista = bloques(i.hora_apertura, i.hora_cierre, i.duracion_min)
  const elegir = (h: string) => {
    setError('')
    if (i.jugadores_min && jugadores.length === 0) setJugadores([`${socio!.nombre} ${socio!.apellido}`, ...Array(i.jugadores_min - 1).fill('')])
    setHora(h)
  }
  const reglas = [
    i.max_reservas_activas && `Una reserva activa a la vez`,
    i.jugadores_min && `Mínimo ${i.jugadores_min} jugadores`,
    i.cancelar_hasta_horas && `Cancela hasta ${i.cancelar_hasta_horas} h antes`,
    i.sancion_horas && `Si no asistes sin cancelar: ${i.sancion_horas} h sin reservar`,
  ].filter(Boolean) as string[]

  async function confirmar() {
    setError('')
    setEnviando(true)
    try {
      await api.reservar(i!.id, fecha, hora!, quien, jugadores)
      aviso('¡Reserva confirmada!')
      setHora(null)
      ocupados.recargar()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Pagina titulo={i.nombre} atras>
      {reglas.length > 0 ? (
        <div className="mb-4 rounded-3xl bg-superficie p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Normas de reserva</p>
          <ul className="space-y-1 text-sm text-slate-700">{reglas.map((x) => <li key={x}>• {x}</li>)}</ul>
          <Link to="/normas" className="mt-2 inline-block text-sm font-semibold text-azul">Ver reglamento completo</Link>
        </div>
      ) : i.descripcion && <p className="mb-4 text-sm text-slate-600">{i.descripcion}</p>}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {dias.map((d) => {
          const k = format(d, 'yyyy-MM-dd')
          const sel = k === fecha
          return (
            <button key={k} onClick={() => setFecha(k)} className={`flex w-14 shrink-0 flex-col items-center rounded-2xl py-2 ${sel ? 'bg-azul text-white' : 'bg-superficie text-slate-700 shadow-card'}`}>
              <span className="text-xs uppercase">{format(d, 'EEE', { locale: es })}</span>
              <span className="text-lg font-semibold">{format(d, 'd')}</span>
            </button>
          )
        })}
      </div>

      <p className="mb-2 mt-5 flex items-center gap-1.5 text-sm text-slate-500"><Clock className="h-4 w-4" /> Bloques de {i.duracion_min >= 60 ? `${i.duracion_min / 60} h` : `${i.duracion_min} min`}</p>
      {ocupados.cargando ? (
        <Cargando />
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {lista.map((h) => {
            const ocupado = ocupados.datos?.includes(h)
            const pasado = fecha === hoyISO() && h <= ahoraHM
            const off = ocupado || pasado
            return (
              <button key={h} disabled={off} onClick={() => elegir(h)}
                className={`rounded-2xl py-3 text-sm font-medium ${off ? 'bg-slate-100 text-slate-400 line-through' : 'bg-superficie text-azul shadow-card active:bg-azul-50'}`}>
                {fHoraTexto(h)}
              </button>
            )
          })}
        </div>
      )}
      <p className="mt-3 text-xs text-slate-500">Máximo {i.max_reservas_dia} reserva(s) por acción por día. Puedes reservar hasta con 14 días de anticipación.</p>

      <Hoja abierta={!!hora} onCerrar={() => setHora(null)} titulo="Confirmar reserva">
        <Tarjeta className="bg-azul-50 p-4 shadow-none">
          <p className="font-semibold text-tinta">{i.nombre}</p>
          <p className="text-slate-600">{fFecha(fecha, "EEEE d 'de' MMMM")} · {hora && fHoraTexto(hora)}</p>
        </Tarjeta>
        <Selector etiqueta="¿Quién usará la instalación?" className="mt-4" value={quien} onChange={(e) => setQuien(e.target.value)}>
          {(familia.datos ?? []).map((f) => <option key={f.id} value={f.id}>{f.nombre} {f.apellido}</option>)}
        </Selector>
        {i.jugadores_min && (
          <div className="mt-4 space-y-2">
            <span className="block px-1 text-[13px] font-semibold text-slate-600">Jugadores (mínimo {i.jugadores_min})</span>
            {jugadores.map((j, n) => (
              <Campo key={n} placeholder={`Jugador ${n + 1}`} value={j} onChange={(e) => setJugadores((l) => l.map((x, k) => (k === n ? e.target.value : x)))} />
            ))}
            <button type="button" onClick={() => setJugadores((l) => [...l, ''])} className="text-sm font-semibold text-azul">+ Agregar jugador</button>
            <p className="text-xs text-slate-500">Deben jugar las personas indicadas en la reserva.</p>
          </div>
        )}
        {error && <div className="mt-3"><MensajeError texto={error} /></div>}
        <Boton bloque className="mt-4" cargando={enviando} onClick={confirmar}>Confirmar</Boton>
        <Link to="/reservas" className="mt-3 block text-center text-sm text-slate-500">Ver mis reservas</Link>
      </Hoja>
    </Pagina>
  )
}
