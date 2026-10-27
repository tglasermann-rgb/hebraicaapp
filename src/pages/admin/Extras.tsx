import { addDays, format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarPlus, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { Boton, Campo, Cargando, Hoja, Insignia, Selector, Tarjeta, useAviso } from '@/components/ui'
import { api } from '@/lib/api'
import { DEPARTAMENTOS, depto } from '@/lib/brand'
import { fDiaHora, fHace, fUSD } from '@/lib/formato'
import { useDatos } from '@/lib/useDatos'
import { NOMBRE_METODO, type Auditoria, type Clase } from '@/lib/types'
import { Crud } from './Crud'

// ---------------------------------------------------------------------------
// Clases por sesión
// ---------------------------------------------------------------------------

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

function HorarioSemanal({ alTerminar }: { alTerminar: () => void }) {
  const aviso = useAviso()
  const [abierto, setAbierto] = useState(false)
  const [d, setD] = useState({ nombre: '', departamento: 'deportes', instructor: '', lugar: '', hora: '18:00', duracion: '60', cupo: '15', semanas: '4' })
  const [dias, setDias] = useState<number[]>([])
  const [enviando, setEnviando] = useState(false)
  const fijar = (k: keyof typeof d) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setD({ ...d, [k]: e.target.value })

  async function crear() {
    const [hh, mm] = d.hora.split(':').map(Number)
    const filas = []
    for (let n = 0; n < Number(d.semanas) * 7; n++) {
      const f = addDays(new Date(), n)
      if (!dias.includes((f.getDay() + 6) % 7)) continue
      f.setHours(hh, mm, 0, 0)
      if (f < new Date()) continue
      filas.push({ nombre: d.nombre.trim(), departamento: d.departamento, instructor: d.instructor || null, lugar: d.lugar || null, inicio: f.toISOString(), duracion_min: Number(d.duracion), cupo: Number(d.cupo), cancelada: false })
    }
    if (!filas.length) return aviso('Elige al menos un día', 'error')
    setEnviando(true)
    try {
      await api.crearVarios('clases', filas)
      aviso(`${filas.length} clases creadas`)
      setAbierto(false)
      alTerminar()
    } catch (e) {
      aviso((e as Error).message, 'error')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <>
      <Boton variante="secundario" bloque className="mb-3" onClick={() => setAbierto(true)}><CalendarPlus className="h-4 w-4" /> Crear horario semanal</Boton>
      <Hoja abierta={abierto} onCerrar={() => setAbierto(false)} titulo="Horario semanal">
        <div className="space-y-4 pb-2">
          <Campo etiqueta="Clase" placeholder="Ej. Spinning" value={d.nombre} onChange={fijar('nombre')} />
          <Selector etiqueta="Departamento" value={d.departamento} onChange={fijar('departamento')}>
            {DEPARTAMENTOS.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
          </Selector>
          <div>
            <span className="mb-1.5 block px-1 text-[13px] font-semibold text-slate-600">Días</span>
            <div className="grid grid-cols-7 gap-1.5">
              {DIAS.map((x, i) => (
                <button key={x} type="button" onClick={() => setDias((v) => (v.includes(i) ? v.filter((y) => y !== i) : [...v, i]))}
                  className={`rounded-xl py-2.5 text-sm font-semibold ${dias.includes(i) ? 'bg-azul text-white' : 'bg-elevada text-slate-600'}`}>{x}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Campo etiqueta="Hora" type="time" value={d.hora} onChange={fijar('hora')} />
            <Campo etiqueta="Duración (min)" type="number" value={d.duracion} onChange={fijar('duracion')} />
            <Campo etiqueta="Cupo" type="number" value={d.cupo} onChange={fijar('cupo')} />
            <Campo etiqueta="Semanas a crear" type="number" value={d.semanas} onChange={fijar('semanas')} />
          </div>
          <Campo etiqueta="Instructor" value={d.instructor} onChange={fijar('instructor')} />
          <Campo etiqueta="Lugar" value={d.lugar} onChange={fijar('lugar')} />
          <Boton bloque disabled={!d.nombre.trim() || !dias.length} cargando={enviando} onClick={crear}>Crear clases</Boton>
        </div>
      </Hoja>
    </>
  )
}

function Asistentes({ clase, alCambiar }: { clase: Clase; alCambiar: () => void }) {
  const aviso = useAviso()
  const [abierto, setAbierto] = useState(false)
  const { datos, recargar } = useDatos(async () => {
    if (!abierto) return []
    const rs = await api.listar('reservas_clase', { eq: { clase_id: clase.id }, orden: { campo: 'created_at' } })
    const so = rs.length ? await api.listar('socios', { in: { id: rs.map((r) => r.socio_id) } }) : []
    return rs.filter((r) => r.estado !== 'cancelada').map((r) => ({ ...r, socio: so.find((s) => s.id === r.socio_id) }))
  }, [abierto, clase.id])

  async function cancelarClase() {
    if (!confirm(`¿Cancelar ${clase.nombre} del ${fDiaHora(clase.inicio)}? Se avisará a los inscritos.`)) return
    try {
      await api.actualizar('clases', clase.id, { cancelada: true })
      const avisados = new Set<string>()
      for (const r of datos ?? []) {
        if (avisados.has(r.socio_id)) continue
        avisados.add(r.socio_id)
        await api.crear('notificaciones', { titulo: 'Clase cancelada', cuerpo: `${clase.nombre} del ${fDiaHora(clase.inicio)} fue cancelada.`, destino: 'socio', socio_id: r.socio_id, enlace: '/clases' })
      }
      aviso('Clase cancelada y socios avisados')
      setAbierto(false)
      alCambiar()
    } catch (e) {
      aviso((e as Error).message, 'error')
    }
  }

  return (
    <>
      <button onClick={() => setAbierto(true)} className="text-sm font-semibold text-azul">Inscritos</button>
      <Hoja abierta={abierto} onCerrar={() => setAbierto(false)} titulo={`${clase.nombre} · ${fDiaHora(clase.inicio)}`}>
        <p className="mb-2 text-sm text-slate-500">{(datos ?? []).filter((r) => r.estado === 'confirmada').length} de {clase.cupo} confirmados</p>
        {(datos ?? []).map((r) => (
          <div key={r.id} className="flex items-center justify-between border-b border-slate-100 py-2.5 text-sm">
            <span>{r.socio?.nombre} {r.socio?.apellido} · Acción {r.accion}</span>
            <span className="flex items-center gap-2">
              <Insignia color={r.estado === 'confirmada' ? 'verde' : 'ambar'}>{r.estado === 'confirmada' ? 'Confirmado' : 'En espera'}</Insignia>
              <button className="text-xs text-red-600" onClick={async () => { await api.cancelarReservaClase(r.id); recargar(); alCambiar() }}>Quitar</button>
            </span>
          </div>
        ))}
        {datos?.length === 0 && <p className="py-6 text-center text-slate-500">Nadie se ha inscrito todavía</p>}
        {!clase.cancelada && <Boton variante="peligro" bloque className="mt-4" onClick={cancelarClase}>Cancelar esta clase</Boton>}
      </Hoja>
    </>
  )
}

export function AdminClases() {
  const desde = new Date(Date.now() - 864e5).toISOString()
  return (
    <Crud
      tabla="clases"
      nombre="clase"
      filtro={{ gte: { inicio: desde }, orden: { campo: 'inicio' }, limite: 300 }}
      inicial={{ departamento: 'deportes', duracion_min: 60, cupo: 15, cancelada: false }}
      buscar={(c, q) => `${c.nombre} ${c.instructor ?? ''}`.toLowerCase().includes(q)}
      cabecera={(r) => <HorarioSemanal alTerminar={r} />}
      acciones={(c, r) => <Asistentes clase={c} alCambiar={r} />}
      vista={(c) => ({
        titulo: c.nombre,
        sub: `${fDiaHora(c.inicio)} · ${depto(c.departamento).nombre} · cupo ${c.cupo}${c.instructor ? ` · ${c.instructor}` : ''}`,
        extra: c.cancelada && <Insignia color="rojo">Cancelada</Insignia>,
      })}
      campos={[
        { k: 'nombre', etiqueta: 'Clase', req: true },
        { k: 'departamento', etiqueta: 'Departamento', tipo: 'departamento', req: true },
        { k: 'inicio', etiqueta: 'Fecha y hora', tipo: 'fechaHora', req: true },
        { k: 'duracion_min', etiqueta: 'Duración (min)', tipo: 'numero', req: true },
        { k: 'cupo', etiqueta: 'Cupo', tipo: 'numero', req: true },
        { k: 'instructor', etiqueta: 'Instructor' },
        { k: 'lugar', etiqueta: 'Lugar' },
        { k: 'cancelada', etiqueta: 'Cancelada', tipo: 'bool' },
      ]}
    />
  )
}

// ---------------------------------------------------------------------------
// Encuestas
// ---------------------------------------------------------------------------

function Resultados({ encuestaId, tipo, opciones }: { encuestaId: string; tipo: string; opciones: string[] }) {
  const [abierto, setAbierto] = useState(false)
  const { datos } = useDatos(async () => {
    if (!abierto) return null
    const [res, votos] = await Promise.all([api.resultadosEncuesta(encuestaId), api.listar('votos', { eq: { encuesta_id: encuestaId } })])
    return { res, comentarios: votos.filter((v) => v.comentario).map((v) => v.comentario!) }
  }, [abierto, encuestaId])
  const total = (datos?.res ?? []).reduce((t, r) => t + r.votos, 0)
  const etiquetas = tipo === 'calificacion' ? ['', '1 ★', '2 ★', '3 ★', '4 ★', '5 ★'] : opciones
  const indices = tipo === 'calificacion' ? [5, 4, 3, 2, 1] : opciones.map((_, i) => i)
  return (
    <>
      <button onClick={() => setAbierto(true)} className="text-sm font-semibold text-azul">Resultados</button>
      <Hoja abierta={abierto} onCerrar={() => setAbierto(false)} titulo="Resultados">
        {!datos ? <Cargando /> : (
          <>
            <BarrasH filas={indices.map((i) => ({ etiqueta: etiquetas[i], valor: datos.res.find((r) => r.opcion === i)?.votos ?? 0 }))} formato={(v) => `${v} (${total ? Math.round((v / total) * 100) : 0}%)`} />
            <p className="mt-2 text-xs text-slate-500">{total} votos</p>
            {datos.comentarios.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-semibold">Comentarios</p>
                {datos.comentarios.map((c, i) => <p key={i} className="rounded-2xl bg-elevada px-3 py-2 text-sm text-slate-700">“{c}”</p>)}
              </div>
            )}
          </>
        )}
      </Hoja>
    </>
  )
}

export function AdminEncuestas() {
  const eventos = useDatos(() => api.listar('eventos', { orden: { campo: 'fecha_inicio', asc: false }, limite: 50 }))
  return (
    <Crud
      tabla="encuestas"
      nombre="encuesta"
      filtro={{ orden: { campo: 'created_at', asc: false } }}
      inicial={{ tipo: 'opciones', abierta: true, opciones: [] }}
      acciones={(e) => <Resultados encuestaId={e.id} tipo={e.tipo} opciones={e.opciones} />}
      vista={(e) => ({ titulo: e.titulo, sub: e.tipo === 'calificacion' ? 'Calificación de 1 a 5 estrellas' : `${e.opciones.length} opciones`, extra: !e.abierta && <Insignia color="gris">Cerrada</Insignia> })}
      campos={[
        { k: 'titulo', etiqueta: 'Pregunta', req: true },
        { k: 'descripcion', etiqueta: 'Descripción', tipo: 'textoLargo' },
        { k: 'tipo', etiqueta: 'Tipo', tipo: 'select', req: true, opciones: [{ v: 'opciones', t: 'Elegir entre opciones' }, { v: 'calificacion', t: 'Calificación (estrellas)' }] },
        { k: 'opciones', etiqueta: 'Opciones (una por línea; solo para "Elegir entre opciones")', tipo: 'lineas' },
        { k: 'evento_id', etiqueta: 'Evento a calificar (opcional)', tipo: 'select', opciones: (eventos.datos ?? []).map((ev) => ({ v: ev.id, t: ev.titulo })) },
        { k: 'cierra', etiqueta: 'Cierra el', tipo: 'fechaHora' },
        { k: 'abierta', etiqueta: 'Abierta', tipo: 'bool' },
      ]}
    />
  )
}

// ---------------------------------------------------------------------------
// Estadísticas
// ---------------------------------------------------------------------------

/** Barras horizontales: una sola serie, valor escrito al final de cada barra. */
function BarrasH({ filas, formato = String }: { filas: { etiqueta: string; valor: number }[]; formato?: (v: number) => string }) {
  const max = Math.max(1, ...filas.map((f) => f.valor))
  return (
    <div className="space-y-2.5">
      {filas.map((f) => (
        <div key={f.etiqueta} title={`${f.etiqueta}: ${formato(f.valor)}`}>
          <div className="mb-1 flex justify-between text-[13px]">
            <span className="text-slate-700">{f.etiqueta}</span>
            <span className="tabular-nums text-slate-500">{formato(f.valor)}</span>
          </div>
          <div className="h-2 rounded-full bg-elevada">
            <div className="h-full rounded-full bg-azul" style={{ width: `${(f.valor / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Columnas verticales con tooltip al pasar el dedo o el mouse; se marca solo el pico. */
function Columnas({ datos, etiqueta, cadaCuanto = 1 }: { datos: { x: number; total: number }[]; etiqueta: (x: number) => string; cadaCuanto?: number }) {
  const [activo, setActivo] = useState<number | null>(null)
  const max = Math.max(1, ...datos.map((d) => d.total))
  const pico = datos.reduce((a, b) => (b.total > a.total ? b : a), datos[0] ?? { x: 0, total: 0 })
  const sel = datos.find((d) => d.x === activo)
  return (
    <div>
      <div className="mb-1 h-5 text-[13px] text-slate-600">
        {sel ? <><b className="text-tinta">{etiqueta(sel.x)}</b> · {sel.total} entradas</> : pico.total > 0 && <>Pico: <b className="text-tinta">{etiqueta(pico.x)}</b> · {pico.total} entradas</>}
      </div>
      <div className="relative flex h-36 items-end gap-[2px] border-b border-slate-200" onMouseLeave={() => setActivo(null)}>
        {/* línea guía discreta a la mitad */}
        <div className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-slate-200" />
        {datos.map((d) => (
          <button
            key={d.x}
            aria-label={`${etiqueta(d.x)}: ${d.total}`}
            onMouseEnter={() => setActivo(d.x)}
            onFocus={() => setActivo(d.x)}
            onClick={() => setActivo(d.x)}
            className="flex h-full flex-1 items-end"
          >
            <span className={`w-full rounded-t-[4px] transition ${activo === d.x ? 'bg-tinta' : 'bg-azul'}`} style={{ height: `${(d.total / max) * 100}%`, minHeight: d.total ? 2 : 0 }} />
          </button>
        ))}
      </div>
      <div className="mt-1 flex gap-[2px] text-[10px] text-slate-500">
        {datos.map((d, i) => <span key={d.x} className="flex-1 text-center">{i % cadaCuanto === 0 ? etiqueta(d.x) : ''}</span>)}
      </div>
    </div>
  )
}

function VerDatos({ filas }: { filas: [string, string | number][] }) {
  return (
    <details className="mt-3 text-sm">
      <summary className="flex cursor-pointer list-none items-center gap-1 text-xs font-semibold text-slate-500"><ChevronDown className="h-3.5 w-3.5" /> Ver tabla</summary>
      <table className="mt-2 w-full text-left">
        <tbody>
          {filas.map(([a, b]) => (
            <tr key={a} className="border-b border-slate-100"><td className="py-1.5 text-slate-600">{a}</td><td className="py-1.5 text-right tabular-nums">{b}</td></tr>
          ))}
        </tbody>
      </table>
    </details>
  )
}

function Cifra({ valor, texto, detalle }: { valor: string; texto: string; detalle?: string }) {
  return (
    <Tarjeta className="p-4">
      <p className="font-display text-[28px] font-extrabold leading-none text-tinta">{valor}</p>
      <p className="mt-1.5 text-[13px] text-slate-500">{texto}</p>
      {detalle && <p className="text-xs text-slate-500">{detalle}</p>}
    </Tarjeta>
  )
}

const DIA_SEMANA = ['', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const hora12 = (h: number) => `${((h + 11) % 12) + 1}${h < 12 ? 'a' : 'p'}`

export function Estadisticas() {
  const { datos: e, cargando } = useDatos(() => api.estadisticas())
  if (cargando || !e) return <Cargando />
  const pctApp = e.socios ? Math.round((e.socios_con_app / e.socios) * 100) : 0
  const pctMora = e.acciones ? Math.round((e.acciones_morosas / e.acciones) * 100) : 0
  const horas = Array.from({ length: 18 }, (_, i) => i + 5).map((h) => ({ x: h, total: e.accesos_por_hora.find((a) => a.hora === h)?.total ?? 0 }))
  const dias = [1, 2, 3, 4, 5, 6, 7].map((d) => ({ x: d, total: e.accesos_por_dia.find((a) => a.dia === d)?.total ?? 0 }))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Cifra valor={`${pctApp}%`} texto="Socios usando el app" detalle={`${e.socios_con_app} de ${e.socios}`} />
        <Cifra valor={`${pctMora}%`} texto="Acciones con pagos vencidos" detalle={`${e.acciones_morosas} de ${e.acciones}`} />
        <Cifra valor={fUSD(e.monto_moroso)} texto="Monto vencido" />
        <Cifra valor={fUSD(e.monto_pendiente)} texto="Total por cobrar" />
      </div>

      <Tarjeta className="p-5">
        <p className="font-display font-extrabold">Entradas al club por hora</p>
        <p className="mb-3 text-xs text-slate-500">Últimos 30 días · carnets escaneados</p>
        <Columnas datos={horas} etiqueta={hora12} cadaCuanto={3} />
        <VerDatos filas={horas.map((h) => [hora12(h.x), h.total])} />
      </Tarjeta>

      <div className="grid gap-4 md:grid-cols-2">
        <Tarjeta className="p-5">
          <p className="font-display font-extrabold">Entradas por día de la semana</p>
          <p className="mb-3 text-xs text-slate-500">Últimos 30 días</p>
          <Columnas datos={dias} etiqueta={(d) => DIA_SEMANA[d]} />
          <VerDatos filas={dias.map((d) => [DIA_SEMANA[d.x], d.total])} />
        </Tarjeta>
        <Tarjeta className="p-5">
          <p className="font-display font-extrabold">Reservas por instalación</p>
          <p className="mb-3 text-xs text-slate-500">Últimos 30 días</p>
          {e.reservas_por_instalacion.length ? <BarrasH filas={e.reservas_por_instalacion.map((r) => ({ etiqueta: r.nombre, valor: r.total }))} /> : <p className="text-sm text-slate-500">Sin reservas todavía</p>}
        </Tarjeta>
      </div>

      <Tarjeta className="p-5">
        <p className="font-display font-extrabold">Cobrado por método de pago</p>
        <p className="mb-3 text-xs text-slate-500">Pagos aprobados · últimos 90 días</p>
        {e.pagos_por_metodo.length ? (
          <BarrasH filas={[...e.pagos_por_metodo].sort((a, b) => b.monto - a.monto).map((p) => ({ etiqueta: `${NOMBRE_METODO[p.metodo] ?? p.metodo} (${p.total})`, valor: Number(p.monto) }))} formato={fUSD} />
        ) : <p className="text-sm text-slate-500">Sin pagos aprobados todavía</p>}
      </Tarjeta>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Historial de cambios
// ---------------------------------------------------------------------------

const NOMBRE_TABLA: Record<string, string> = {
  socios: 'Socios', registros: 'Solicitudes de acceso', cargos: 'Cargos', pagos: 'Pagos', tasas: 'Tasa BCV', instalaciones: 'Instalaciones',
  actividades: 'Actividades', eventos: 'Eventos', noticias: 'Noticias', clases: 'Clases', encuestas: 'Encuestas', configuracion: 'Datos bancarios',
  solicitudes: 'Solicitudes', directorio: 'Directorio', restaurantes: 'Restaurantes', albumes: 'Galería',
}
const VERBO = { INSERT: 'creó', UPDATE: 'modificó', DELETE: 'eliminó' }
const IGNORAR = new Set(['created_at', 'updated_at', 'id'])

function describir(a: Auditoria) {
  const d = (a.despues ?? a.antes ?? {}) as Record<string, unknown>
  const nombre = [d.nombre, d.apellido].filter(Boolean).join(' ')
  return String(d.titulo ?? (nombre || d.concepto || d.referencia || d.usuario || d.fecha || ''))
}

function Cambio({ a }: { a: Auditoria }) {
  const [abierto, setAbierto] = useState(false)
  const antes = (a.antes ?? {}) as Record<string, unknown>
  const despues = (a.despues ?? {}) as Record<string, unknown>
  const campos = a.operacion === 'UPDATE'
    ? Object.keys(despues).filter((k) => !IGNORAR.has(k) && JSON.stringify(antes[k]) !== JSON.stringify(despues[k]))
    : Object.keys(a.operacion === 'INSERT' ? despues : antes).filter((k) => !IGNORAR.has(k))
  const v = (x: unknown) => (x == null || x === '' ? '—' : typeof x === 'object' ? JSON.stringify(x) : String(x))
  return (
    <div className="px-4 py-3">
      <button className="flex w-full items-start gap-3 text-left" onClick={() => setAbierto(!abierto)}>
        <div className="min-w-0 flex-1">
          <p className="text-sm"><b>{a.usuario ?? 'Sistema'}</b> {VERBO[a.operacion]} en <b>{NOMBRE_TABLA[a.tabla] ?? a.tabla}</b>{describir(a) && <span className="text-slate-500"> · {describir(a)}</span>}</p>
          <p className="text-xs text-slate-500">{fHace(a.created_at)} · {format(new Date(a.created_at), "d MMM yyyy, h:mm a", { locale: es })}{a.operacion === 'UPDATE' && ` · ${campos.length} campo(s)`}</p>
        </div>
        <ChevronDown className={`mt-1 h-4 w-4 shrink-0 text-slate-400 transition ${abierto ? 'rotate-180' : ''}`} />
      </button>
      {abierto && (
        <table className="mt-2 w-full text-left text-xs">
          <tbody>
            {campos.map((k) => (
              <tr key={k} className="border-t border-slate-100 align-top">
                <td className="py-1.5 pr-2 font-semibold text-slate-600">{k}</td>
                {a.operacion === 'UPDATE' ? (
                  <td className="break-all py-1.5"><span className="text-red-600 line-through">{v(antes[k])}</span> → <span className="text-emerald-700">{v(despues[k])}</span></td>
                ) : (
                  <td className="break-all py-1.5">{v((a.operacion === 'INSERT' ? despues : antes)[k])}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export function Historial() {
  const [tabla, setTabla] = useState('')
  const { datos, cargando } = useDatos(() => api.listar('auditoria', { ...(tabla ? { eq: { tabla } } : {}), orden: { campo: 'created_at', asc: false }, limite: 200 }), [tabla])
  return (
    <div>
      <Selector className="mb-3" value={tabla} onChange={(e) => setTabla(e.target.value)}>
        <option value="">Todas las secciones</option>
        {Object.entries(NOMBRE_TABLA).map(([k, t]) => <option key={k} value={k}>{t}</option>)}
      </Selector>
      {cargando ? <Cargando /> : !datos?.length ? <p className="py-10 text-center text-slate-500">No hay cambios registrados</p> : (
        <Tarjeta className="divide-y divide-slate-100 overflow-hidden">
          {datos.map((a) => <Cambio key={a.id} a={a} />)}
        </Tarjeta>
      )}
      <p className="mt-2 text-xs text-slate-500">Se muestran los últimos 200 cambios.</p>
    </div>
  )
}
