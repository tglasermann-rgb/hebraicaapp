import { addMonths } from 'date-fns'
import { CalendarDays, MapPin } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Cargando, Pagina, Pestanas, Portada, Tarjeta, Vacio } from '@/components/ui'
import { api } from '@/lib/api'
import { DEPARTAMENTOS, depto } from '@/lib/brand'
import { festividades, fechaHebrea, proximoShabat } from '@/lib/calendarioJudio'
import { capitalizar, fDiaHora, fFecha, fHora, hoyISO } from '@/lib/formato'
import { useDatos } from '@/lib/useDatos'

export default function Agenda() {
  const [params, setParams] = useSearchParams()
  const vista = (params.get('vista') as 'eventos' | 'judio') ?? 'eventos'
  return (
    <Pagina titulo="Agenda">
      <Pestanas
        opciones={[{ id: 'eventos', texto: 'Eventos del club' }, { id: 'judio', texto: 'Calendario judío' }]}
        valor={vista}
        onChange={(v) => setParams({ vista: v }, { replace: true })}
      />
      <div className="mt-4">{vista === 'eventos' ? <Eventos /> : <CalendarioJudio />}</div>
    </Pagina>
  )
}

function Eventos() {
  const [filtro, setFiltro] = useState<string | null>(null)
  const { datos, cargando } = useDatos(() => api.listar('eventos', { gte: { fecha_inicio: hoyISO() }, orden: { campo: 'fecha_inicio' } }))
  const lista = (datos ?? []).filter((e) => !filtro || e.departamento === filtro)
  const deptos = DEPARTAMENTOS.filter((d) => datos?.some((e) => e.departamento === d.id))

  const porMes = useMemo(() => {
    const g = new Map<string, typeof lista>()
    for (const e of lista) {
      const k = capitalizar(fFecha(e.fecha_inicio, 'MMMM yyyy'))
      g.set(k, [...(g.get(k) ?? []), e])
    }
    return [...g.entries()]
  }, [lista])

  if (cargando) return <Cargando />
  return (
    <>
      {deptos.length > 1 && (
        <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1">
          <Chip activo={!filtro} onClick={() => setFiltro(null)}>Todos</Chip>
          {deptos.map((d) => (
            <Chip key={d.id} activo={filtro === d.id} color={d.color} onClick={() => setFiltro(d.id)}>{d.nombre}</Chip>
          ))}
        </div>
      )}
      {porMes.length === 0 && <Vacio icono={<CalendarDays />} titulo="No hay eventos próximos" />}
      {porMes.map(([mes, evs]) => (
        <div key={mes} className="mb-5">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">{mes}</p>
          <div className="space-y-3">
            {evs.map((e) => (
              <Link key={e.id} to={`/eventos/${e.id}`} className="block">
                <Tarjeta className="flex overflow-hidden">
                  <Portada imagen={e.imagen_url} departamento={e.departamento} className="flex w-20 shrink-0 flex-col items-center justify-center text-white">
                    <span className="relative text-2xl font-bold">{fFecha(e.fecha_inicio, 'd')}</span>
                    <span className="relative text-xs uppercase">{fFecha(e.fecha_inicio, 'EEE')}</span>
                  </Portada>
                  <div className="min-w-0 flex-1 p-3">
                    <p className="text-xs font-medium" style={{ color: depto(e.departamento).color }}>{depto(e.departamento).nombre}</p>
                    <p className="truncate font-medium text-slate-900">{e.titulo}</p>
                    <p className="flex items-center gap-1 text-sm text-slate-500">
                      {fHora(e.fecha_inicio)}
                      {e.lugar && (<><span>·</span><MapPin className="h-3.5 w-3.5" />{e.lugar}</>)}
                    </p>
                    {e.venta_entradas && <p className="mt-1 text-xs font-medium text-llama">Entradas disponibles en el app</p>}
                  </div>
                </Tarjeta>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </>
  )
}

function Chip({ activo, color, onClick, children }: { activo: boolean; color?: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium ${activo ? 'text-white' : 'bg-white text-slate-600 shadow-card'}`} style={activo ? { background: color ?? '#293E9B' } : undefined}>
      {children}
    </button>
  )
}

const COLOR_TIPO = { festividad: 'bg-azul', ayuno: 'bg-slate-500', rosh_jodesh: 'bg-amarillo', moderna: 'bg-llama' }

function CalendarioJudio() {
  const shabat = proximoShabat()
  const dias = useMemo(() => festividades(new Date(), addMonths(new Date(), 12)), [])
  return (
    <>
      <Tarjeta className="bg-gradient-to-br from-[#141C45] to-[#2A2370] p-5 text-white">
        <p className="text-xs uppercase tracking-wide text-white/60">{fechaHebrea()} · Caracas</p>
        <p className="mt-1 font-display text-xl font-extrabold">{shabat.parasha ?? 'Shabat'}</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/10 p-3">
            <p className="text-xs text-white/70">Encendido de velas</p>
            <p className="text-lg font-semibold">{shabat.velas ? fHora(shabat.velas.toISOString()) : '—'}</p>
            <p className="text-xs text-white/70">{shabat.velas && capitalizar(fFecha(shabat.velas.toISOString(), "EEEE d 'de' MMM"))}</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-3">
            <p className="text-xs text-white/70">Havdalá</p>
            <p className="text-lg font-semibold">{shabat.havdala ? fHora(shabat.havdala.toISOString()) : '—'}</p>
            <p className="text-xs text-white/70">{shabat.havdala && capitalizar(fFecha(shabat.havdala.toISOString(), "EEEE d 'de' MMM"))}</p>
          </div>
        </div>
      </Tarjeta>
      <p className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wide text-slate-400">Próximas festividades</p>
      <Tarjeta className="divide-y divide-slate-100">
        {dias.map((d, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${COLOR_TIPO[d.tipo]}`} />
            <span className="flex-1 font-medium text-slate-800">{d.titulo}</span>
            <span className="text-sm text-slate-500">{fDiaHora(d.fecha.toISOString()).split(' · ')[0]}</span>
          </div>
        ))}
      </Tarjeta>
      <p className="mt-3 text-center text-xs text-slate-400">Horarios calculados para Caracas (18 min antes de la puesta del sol).</p>
    </>
  )
}
