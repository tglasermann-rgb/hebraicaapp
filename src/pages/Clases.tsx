import { addDays, endOfDay, format, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { Clock, Dumbbell, MapPin, User } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/auth/AuthContext'
import { Boton, Cargando, Hoja, Insignia, Lista, MensajeError, Pagina, Seccion, Selector, Tarjeta, Vacio, useAviso } from '@/components/ui'
import { api } from '@/lib/api'
import { depto } from '@/lib/brand'
import { fDiaHora, fHora } from '@/lib/formato'
import { useDatos } from '@/lib/useDatos'
import type { Clase } from '@/lib/types'

/** Clases por sesión (spinning, yoga…) con cupo y lista de espera. */
export default function Clases() {
  const { socio } = useAuth()
  const aviso = useAviso()
  const [dia, setDia] = useState(startOfDay(new Date()))
  const [elegida, setElegida] = useState<Clase | null>(null)
  const [quien, setQuien] = useState(socio!.id)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const datos = useDatos(async () => {
    const desde = startOfDay(dia).toISOString()
    const hasta = endOfDay(dia).toISOString()
    const [clases, ocupacion] = await Promise.all([
      api.listar('clases', { gte: { inicio: desde }, lte: { inicio: hasta }, orden: { campo: 'inicio' } }),
      api.ocupacionClases(desde, hasta),
    ])
    return clases.filter((c) => !c.cancelada).map((c) => ({ ...c, ...(ocupacion.find((o) => o.clase_id === c.id) ?? { confirmados: 0, en_espera: 0 }) }))
  }, [dia])

  const mias = useDatos(async () => {
    const rs = await api.listar('reservas_clase', { eq: { accion: socio!.accion! }, in: { estado: ['confirmada', 'espera'] } })
    const ids = [...new Set(rs.map((r) => r.clase_id))]
    const clases = ids.length ? await api.listar('clases', { in: { id: ids } }) : []
    return rs
      .map((r) => ({ ...r, clase: clases.find((c) => c.id === r.clase_id)! }))
      .filter((r) => r.clase && new Date(r.clase.inicio) > new Date(Date.now() - 36e5))
      .sort((a, b) => a.clase.inicio.localeCompare(b.clase.inicio))
  }, [socio?.accion])

  const familia = useDatos(() => api.listar('socios', { eq: { accion: socio!.accion! } }), [socio?.accion])
  const nombre = (id: string) => familia.datos?.find((f) => f.id === id)?.nombre ?? ''

  async function reservar() {
    setError('')
    setEnviando(true)
    try {
      const estado = await api.reservarClase(elegida!.id, quien)
      aviso(estado === 'confirmada' ? '¡Puesto confirmado!' : 'Clase llena: quedaste en lista de espera')
      setElegida(null)
      datos.recargar()
      mias.recargar()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setEnviando(false)
    }
  }

  async function cancelar(id: string, espera: boolean) {
    if (!confirm(espera ? '¿Salir de la lista de espera?' : '¿Cancelar tu puesto? Se le dará al primero de la lista de espera.')) return
    try {
      await api.cancelarReservaClase(id)
      aviso('Cancelado')
      datos.recargar()
      mias.recargar()
    } catch (e) {
      aviso((e as Error).message, 'error')
    }
  }

  const dias = Array.from({ length: 7 }, (_, n) => startOfDay(addDays(new Date(), n)))

  return (
    <Pagina titulo="Clases" atras>
      {(mias.datos?.length ?? 0) > 0 && (
        <Seccion titulo="Mis clases" className="mt-0">
          <Lista>
            {mias.datos!.map((r) => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{r.clase.nombre} <span className="font-normal text-slate-500">· {nombre(r.socio_id)}</span></p>
                  <p className="text-sm text-slate-500">{fDiaHora(r.clase.inicio)}</p>
                </div>
                <Insignia color={r.estado === 'confirmada' ? 'verde' : 'ambar'}>{r.estado === 'confirmada' ? 'Confirmada' : 'En espera'}</Insignia>
                <button onClick={() => cancelar(r.id, r.estado === 'espera')} className="text-sm font-semibold text-red-600">Cancelar</button>
              </div>
            ))}
          </Lista>
        </Seccion>
      )}

      <div className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1">
        {dias.map((d) => {
          const sel = d.getTime() === dia.getTime()
          return (
            <button key={d.toISOString()} onClick={() => setDia(d)} className={`flex w-14 shrink-0 flex-col items-center rounded-2xl py-2 ${sel ? 'bg-azul text-white' : 'bg-superficie text-slate-700'}`}>
              <span className="text-xs uppercase">{format(d, 'EEE', { locale: es })}</span>
              <span className="text-lg font-semibold">{format(d, 'd')}</span>
            </button>
          )
        })}
      </div>

      <div className="mt-4 space-y-3">
        {datos.cargando ? (
          <Cargando />
        ) : !datos.datos?.length ? (
          <Vacio icono={<Dumbbell />} titulo="No hay clases este día" />
        ) : (
          datos.datos.map((c) => {
            const libres = Math.max(c.cupo - c.confirmados, 0)
            const pasada = new Date(c.inicio) < new Date()
            const d = depto(c.departamento)
            return (
              <Tarjeta key={c.id} className="flex items-center gap-4 p-4">
                <p className="w-16 shrink-0 text-center font-display text-[15px] font-extrabold leading-tight">{fHora(c.inicio)}</p>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold" style={{ color: d.color }}>{d.nombre}</p>
                  <p className="truncate font-semibold">{c.nombre}</p>
                  <p className="flex flex-wrap items-center gap-x-2 text-[13px] text-slate-500">
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{c.duracion_min} min</span>
                    {c.lugar && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{c.lugar}</span>}
                    {c.instructor && <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{c.instructor}</span>}
                  </p>
                  <p className={`mt-1 text-[13px] font-semibold ${libres > 0 ? 'text-emerald-400' : 'text-amber-700'}`}>
                    {libres > 0 ? `${libres} de ${c.cupo} puestos libres` : `Llena${c.en_espera ? ` · ${c.en_espera} en espera` : ''}`}
                  </p>
                </div>
                {!pasada && (
                  <Boton variante={libres > 0 ? 'primario' : 'secundario'} className="shrink-0 px-4 text-sm" onClick={() => { setError(''); setElegida(c) }}>
                    {libres > 0 ? 'Reservar' : 'Lista de espera'}
                  </Boton>
                )}
              </Tarjeta>
            )
          })
        )}
      </div>

      <Hoja abierta={!!elegida} onCerrar={() => setElegida(null)} titulo={elegida?.nombre ?? ''}>
        {elegida && (
          <>
            <p className="text-slate-500">{fDiaHora(elegida.inicio)}{elegida.lugar && ` · ${elegida.lugar}`}</p>
            <Selector etiqueta="¿Quién va a la clase?" className="mt-4" value={quien} onChange={(e) => setQuien(e.target.value)}>
              {(familia.datos ?? []).map((f) => <option key={f.id} value={f.id}>{f.nombre} {f.apellido}</option>)}
            </Selector>
            {error && <div className="mt-3"><MensajeError texto={error} /></div>}
            <Boton bloque className="mt-4" cargando={enviando} onClick={reservar}>Confirmar</Boton>
            <p className="mt-2 text-center text-xs text-slate-500">Si la clase está llena quedas en lista de espera y te avisamos si se libera un puesto.</p>
          </>
        )}
      </Hoja>
    </Pagina>
  )
}
