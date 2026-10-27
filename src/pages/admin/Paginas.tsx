import { DollarSign, Download, FileUp, Users } from 'lucide-react'
import { useState } from 'react'
import { AreaTexto, Boton, Campo, Hoja, Insignia, MensajeError, Selector, Tarjeta, useAviso } from '@/components/ui'
import { api } from '@/lib/api'
import { obtenerTasaOficial } from '@/lib/bcv'
import { depto } from '@/lib/brand'
import { fDiaHora, fFechaCorta, fHace, fHoraTexto, fUSD, hoyISO } from '@/lib/formato'
import { useDatos } from '@/lib/useDatos'
import { NOMBRE_CATEGORIA, NOMBRE_METODO, NOMBRE_ROL, type DatosBancarios, type Socio } from '@/lib/types'
import { ESTADO_SOLICITUD } from '../Solicitudes'
import { Crud } from './Crud'

const PARENTESCOS = [
  { v: 'titular', t: 'Titular' },
  { v: 'conyuge', t: 'Cónyuge' },
  { v: 'hijo', t: 'Hijo(a)' },
  { v: 'otro', t: 'Otro' },
]

// ---------------------------------------------------------------------------
// Socios (+ importación CSV)
// ---------------------------------------------------------------------------

function parseCSV(texto: string): Record<string, string>[] {
  const sep = texto.split('\n')[0].includes(';') ? ';' : ','
  const lineas = texto.replace(/\r/g, '').split('\n').filter((l) => l.trim())
  const cab = lineas[0].split(sep).map((c) => c.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''))
  return lineas.slice(1).map((l) => {
    const cols = l.split(sep)
    return Object.fromEntries(cab.map((c, i) => [c, (cols[i] ?? '').trim().replace(/^"|"$/g, '')]))
  })
}

function ImportarSocios({ alTerminar }: { alTerminar: () => void }) {
  const aviso = useAviso()
  const [abierto, setAbierto] = useState(false)
  const [filas, setFilas] = useState<Partial<Socio>[]>([])
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function leer(f: File) {
    setError('')
    const datos = parseCSV(await f.text())
    const res = datos
      .map((r) => ({
        accion: r.accion || null,
        cedula: (r.cedula ?? '').replace(/\D/g, ''),
        nombre: r.nombre,
        apellido: r.apellido,
        email: r.email || r.correo || null,
        telefono: r.telefono || null,
        parentesco: (['titular', 'conyuge', 'hijo', 'otro'].includes(r.parentesco) ? r.parentesco : 'titular') as Socio['parentesco'],
        fecha_nacimiento: r.fecha_nacimiento || null,
        estado: 'activo' as const,
        rol: 'socio' as const,
      }))
      .filter((r) => r.cedula && r.nombre)
    if (!res.length) setError('No se encontraron filas válidas. Revisa los encabezados del archivo.')
    setFilas(res)
  }

  async function importar() {
    setEnviando(true)
    try {
      const n = await api.crearVarios('socios', filas)
      aviso(`${n} socios importados`)
      setAbierto(false)
      setFilas([])
      alTerminar()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setEnviando(false)
    }
  }

  function plantilla() {
    const csv = 'accion,cedula,nombre,apellido,email,telefono,parentesco,fecha_nacimiento\n1234,12345678,David,Cohen,david@correo.com,0414-1234567,titular,1982-05-10\n'
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = 'plantilla_socios.csv'
    a.click()
  }

  return (
    <>
      <Boton variante="secundario" bloque className="mb-3" onClick={() => setAbierto(true)}><FileUp className="h-4 w-4" /> Importar socios desde Excel (CSV)</Boton>
      <Hoja abierta={abierto} onCerrar={() => setAbierto(false)} titulo="Importar socios">
        <p className="text-sm text-slate-600">Exporta el listado del sistema administrativo a CSV con estas columnas: <code className="text-xs">accion, cedula, nombre, apellido, email, telefono, parentesco (titular/conyuge/hijo/otro), fecha_nacimiento (AAAA-MM-DD)</code>.</p>
        <Boton variante="fantasma" className="mt-2 px-0" onClick={plantilla}><Download className="h-4 w-4" /> Descargar plantilla</Boton>
        <input type="file" accept=".csv,text/csv" className="mt-3 block w-full text-sm" onChange={(e) => e.target.files?.[0] && leer(e.target.files[0])} />
        {filas.length > 0 && <p className="mt-3 rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-800">{filas.length} socios listos para importar. Luego cada uno se registra en el app con su cédula y tú apruebas su acceso en Solicitudes de acceso.</p>}
        {error && <div className="mt-3"><MensajeError texto={error} /></div>}
        <Boton bloque className="mt-4" disabled={!filas.length} cargando={enviando} onClick={importar}>Importar</Boton>
      </Hoja>
    </>
  )
}

export function AdminSocios() {
  return (
    <Crud
      tabla="socios"
      nombre="socio"
      filtro={{ orden: { campo: 'accion' } }}
      inicial={{ estado: 'activo', rol: 'socio', parentesco: 'titular' }}
      buscar={(s, q) => `${s.nombre} ${s.apellido} ${s.accion} ${s.cedula} ${s.email}`.toLowerCase().includes(q)}
      cabecera={(recargar) => <ImportarSocios alTerminar={recargar} />}
      vista={(s) => ({
        titulo: `${s.nombre} ${s.apellido}`,
        sub: `Acción ${s.accion ?? '—'} · C.I. ${s.cedula} · ${PARENTESCOS.find((p) => p.v === s.parentesco)?.t}${s.usuario ? ` · @${s.usuario}` : ''}`,
        extra: (
          <div className="flex flex-col items-end gap-1">
            {s.rol !== 'socio' && <Insignia color="azul">{NOMBRE_ROL[s.rol]}</Insignia>}
            {s.estado === 'suspendido' ? <Insignia color="rojo">Suspendido</Insignia> : s.user_id ? <Insignia color="verde">Con app</Insignia> : null}
          </div>
        ),
      })}
      campos={[
        { k: 'accion', etiqueta: 'Número de acción', req: true, ayuda: 'Para personal sin acción usa un código, p. ej. E-001' },
        { k: 'cedula', etiqueta: 'Cédula', req: true },
        { k: 'nombre', etiqueta: 'Nombre', req: true },
        { k: 'apellido', etiqueta: 'Apellido', req: true },
        { k: 'email', etiqueta: 'Correo' },
        { k: 'telefono', etiqueta: 'Teléfono' },
        { k: 'parentesco', etiqueta: 'Parentesco', tipo: 'select', opciones: PARENTESCOS, req: true },
        { k: 'fecha_nacimiento', etiqueta: 'Fecha de nacimiento', tipo: 'fecha' },
        { k: 'foto_url', etiqueta: 'Foto (aparece en el carnet)', tipo: 'imagen' },
        { k: 'estado', etiqueta: 'Estado', tipo: 'select', req: true, opciones: [{ v: 'activo', t: 'Activo' }, { v: 'suspendido', t: 'Suspendido (no puede entrar)' }] },
        { k: 'rol', etiqueta: 'Rol en el app', tipo: 'select', req: true, opciones: Object.entries(NOMBRE_ROL).map(([v, t]) => ({ v, t })) },
      ]}
    />
  )
}

// ---------------------------------------------------------------------------
// Pagos
// ---------------------------------------------------------------------------

export function AdminPagos() {
  const aviso = useAviso()
  const [estado, setEstado] = useState<'pendiente' | 'aprobado' | 'rechazado'>('pendiente')
  const { datos, recargar } = useDatos(() => api.listar('pagos', { eq: { estado }, orden: { campo: 'created_at', asc: false }, limite: 200 }), [estado])
  const cargos = useDatos(async () => {
    const ids = [...new Set((datos ?? []).flatMap((p) => p.cargo_ids ?? []))]
    return ids.length ? api.listar('cargos', { in: { id: ids } }) : []
  }, [datos])
  const [nota, setNota] = useState<Record<string, string>>({})
  const [procesando, setProcesando] = useState<string | null>(null)

  async function revisar(id: string, ok: boolean) {
    if (!ok && !nota[id]) return aviso('Indica el motivo del rechazo', 'error')
    setProcesando(id)
    try {
      await api.revisarPago(id, ok, nota[id] ?? '')
      aviso(ok ? 'Pago aprobado' : 'Pago rechazado')
      recargar()
    } catch (e) {
      aviso((e as Error).message, 'error')
    } finally {
      setProcesando(null)
    }
  }

  async function verComprobante(ruta: string) {
    window.open(await api.urlArchivo('comprobantes', ruta), '_blank')
  }

  return (
    <div>
      <Selector value={estado} onChange={(e) => setEstado(e.target.value as typeof estado)} className="mb-3">
        <option value="pendiente">Por aprobar</option>
        <option value="aprobado">Aprobados</option>
        <option value="rechazado">Rechazados</option>
      </Selector>
      <div className="space-y-3">
        {(datos ?? []).map((p) => (
          <Tarjeta key={p.id} className="p-4">
            <div className="flex justify-between gap-3">
              <div>
                <p className="font-semibold text-tinta">Acción {p.accion}</p>
                <p className="text-sm text-slate-600">{NOMBRE_METODO[p.metodo]} · Ref. <b>{p.referencia}</b> · {fFechaCorta(p.fecha_pago)}</p>
                <p className="text-xs text-slate-400">Reportado {fHace(p.created_at)}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-slate-900">{p.moneda === 'VES' ? `Bs. ${Number(p.monto).toLocaleString('es-VE')}` : fUSD(Number(p.monto))}</p>
                {p.moneda === 'VES' && <p className="text-sm text-slate-500">{fUSD(Number(p.monto_usd))} · tasa {p.tasa}</p>}
              </div>
            </div>
            {p.comprobante_url && <button onClick={() => verComprobante(p.comprobante_url!)} className="mt-2 text-sm font-medium text-azul">Ver comprobante</button>}
            {(p.cargo_ids?.length ?? 0) > 0 && (
              <div className="mt-2 rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Conceptos que paga</p>
                {(cargos.datos ?? []).filter((c) => p.cargo_ids.includes(c.id)).map((c) => (
                  <p key={c.id} className="flex justify-between"><span>{c.concepto}</span><span className="tabular-nums">{fUSD(Number(c.monto_usd))}</span></p>
                ))}
              </div>
            )}
            {p.nota_admin && <p className="mt-2 text-sm text-slate-600">Nota: {p.nota_admin}</p>}
            {p.estado === 'pendiente' && (
              <div className="mt-3 space-y-2">
                <Campo placeholder="Nota (obligatoria si se rechaza)" value={nota[p.id] ?? ''} onChange={(e) => setNota({ ...nota, [p.id]: e.target.value })} />
                <div className="grid grid-cols-2 gap-2">
                  <Boton variante="peligro" disabled={procesando === p.id} onClick={() => revisar(p.id, false)}>Rechazar</Boton>
                  <Boton cargando={procesando === p.id} onClick={() => revisar(p.id, true)}>Aprobar</Boton>
                </div>
              </div>
            )}
          </Tarjeta>
        ))}
        {datos?.length === 0 && <p className="py-8 text-center text-slate-500">No hay pagos en esta lista.</p>}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Cargos (+ cuota mensual masiva) y tasa BCV
// ---------------------------------------------------------------------------

function CuotaMasiva({ alTerminar }: { alTerminar: () => void }) {
  const aviso = useAviso()
  const [abierto, setAbierto] = useState(false)
  const [concepto, setConcepto] = useState('Cuota de mantenimiento')
  const [monto, setMonto] = useState('')
  const [vence, setVence] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function generar() {
    setEnviando(true)
    try {
      const socios = await api.listar('socios', { eq: { parentesco: 'titular', rol: 'socio' } })
      const acciones = [...new Set(socios.map((s) => s.accion).filter(Boolean))] as string[]
      if (!confirm(`Se creará un cargo de ${fUSD(Number(monto))} a ${acciones.length} acciones. ¿Continuar?`)) return
      await api.crearVarios('cargos', acciones.map((accion) => ({ accion, concepto, monto_usd: Number(monto), fecha: hoyISO(), vence: vence || null, tipo: 'cuota' as const, estado: 'pendiente' as const })))
      await api.crear('notificaciones', { titulo: 'Nueva cuota disponible', cuerpo: `${concepto}: ${fUSD(Number(monto))}. Puedes pagarla desde el app.`, destino: 'todos', enlace: '/cuenta' })
      aviso(`Cuota cargada a ${acciones.length} acciones`)
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
      <Boton variante="secundario" bloque className="mb-3" onClick={() => setAbierto(true)}><Users className="h-4 w-4" /> Generar cuota a todas las acciones</Boton>
      <Hoja abierta={abierto} onCerrar={() => setAbierto(false)} titulo="Cuota mensual">
        <div className="space-y-4">
          <Campo etiqueta="Concepto" value={concepto} onChange={(e) => setConcepto(e.target.value)} />
          <Campo etiqueta="Monto (USD)" type="number" step="any" value={monto} onChange={(e) => setMonto(e.target.value)} />
          <Campo etiqueta="Vence" type="date" value={vence} onChange={(e) => setVence(e.target.value)} />
          <Boton bloque disabled={!monto || !concepto} cargando={enviando} onClick={generar}>Generar y notificar</Boton>
        </div>
      </Hoja>
    </>
  )
}

export function AdminCargos() {
  return (
    <Crud
      tabla="cargos"
      nombre="cargo"
      filtro={{ orden: { campo: 'fecha', asc: false }, limite: 500 }}
      inicial={{ tipo: 'otro', estado: 'pendiente', fecha: hoyISO() }}
      buscar={(c, q) => `${c.accion} ${c.concepto}`.toLowerCase().includes(q)}
      cabecera={(r) => <CuotaMasiva alTerminar={r} />}
      vista={(c) => ({
        titulo: c.concepto,
        sub: `Acción ${c.accion} · ${fFechaCorta(c.fecha)}`,
        extra: (
          <div className="flex flex-col items-end gap-1">
            <span className="font-medium tabular-nums">{fUSD(Number(c.monto_usd))}</span>
            <Insignia color={c.estado === 'pagado' ? 'verde' : 'ambar'}>{c.estado === 'pagado' ? 'Pagado' : 'Pendiente'}</Insignia>
          </div>
        ),
      })}
      campos={[
        { k: 'accion', etiqueta: 'Acción', req: true },
        { k: 'concepto', etiqueta: 'Concepto', req: true },
        { k: 'monto_usd', etiqueta: 'Monto (USD)', tipo: 'numero', req: true, ayuda: 'Para anular un cargo márcalo como Pagado o elimínalo' },
        { k: 'fecha', etiqueta: 'Fecha', tipo: 'fecha', req: true },
        { k: 'vence', etiqueta: 'Vence', tipo: 'fecha' },
        { k: 'tipo', etiqueta: 'Tipo', tipo: 'select', req: true, opciones: [{ v: 'cuota', t: 'Cuota' }, { v: 'actividad', t: 'Actividad' }, { v: 'evento', t: 'Evento' }, { v: 'otro', t: 'Otro' }] },
        { k: 'estado', etiqueta: 'Estado', tipo: 'select', req: true, opciones: [{ v: 'pendiente', t: 'Pendiente' }, { v: 'pagado', t: 'Pagado' }] },
      ]}
    />
  )
}

function ObtenerTasa({ alTerminar }: { alTerminar: () => void }) {
  const aviso = useAviso()
  const [cargando, setCargando] = useState(false)
  async function obtener() {
    setCargando(true)
    try {
      const t = await obtenerTasaOficial()
      const existe = (await api.listar('tasas', { eq: { fecha: t.fecha } }))[0]
      if (existe) await api.actualizar('tasas', existe.id, { bs_por_usd: t.valor })
      else await api.crear('tasas', { fecha: t.fecha, bs_por_usd: t.valor })
      aviso(`Tasa BCV ${t.fecha}: Bs. ${t.valor}`)
      alTerminar()
    } catch (e) {
      aviso((e as Error).message, 'error')
    } finally {
      setCargando(false)
    }
  }
  return (
    <Boton bloque className="mb-3" cargando={cargando} onClick={obtener}>
      <DollarSign className="h-4 w-4" /> Obtener tasa oficial del BCV ahora
    </Boton>
  )
}

export function AdminTasas() {
  return (
    <>
      <p className="mb-3 text-sm text-slate-600">
        La tasa oficial del BCV se registra automáticamente cada día hábil (fuente: BCV vía DolarApi). También puedes consultarla ahora o cargarla a mano. El app usa siempre la más reciente.
      </p>
      <Crud
        tabla="tasas"
        nombre="tasa"
        filtro={{ orden: { campo: 'fecha', asc: false }, limite: 60 }}
        inicial={{ fecha: hoyISO() }}
        cabecera={(r) => <ObtenerTasa alTerminar={r} />}
        vista={(t) => ({ titulo: `Bs. ${t.bs_por_usd} por USD`, sub: fFechaCorta(t.fecha) })}
        campos={[
          { k: 'fecha', etiqueta: 'Fecha', tipo: 'fecha', req: true },
          { k: 'bs_por_usd', etiqueta: 'Bs. por USD', tipo: 'numero', req: true },
        ]}
      />
    </>
  )
}

// ---------------------------------------------------------------------------
// Deportes: instalaciones, reservas, actividades
// ---------------------------------------------------------------------------

export function AdminInstalaciones() {
  return (
    <Crud
      tabla="instalaciones"
      nombre="instalación"
      filtro={{ orden: { campo: 'nombre' } }}
      inicial={{ activo: true, hora_apertura: '07:00', hora_cierre: '21:00', duracion_min: 60, max_reservas_dia: 1 }}
      vista={(i) => ({ titulo: i.nombre, sub: `${i.tipo} · ${fHoraTexto(i.hora_apertura)}–${fHoraTexto(i.hora_cierre)} · bloques de ${i.duracion_min} min`, extra: !i.activo && <Insignia color="gris">Inactiva</Insignia> })}
      campos={[
        { k: 'nombre', etiqueta: 'Nombre', req: true },
        { k: 'tipo', etiqueta: 'Tipo (agrupa en el app)', req: true, ayuda: 'Ej.: Tenis, Pádel, Fútbol, Parrillera, Salón' },
        { k: 'descripcion', etiqueta: 'Descripción / normas', tipo: 'textoLargo' },
        { k: 'hora_apertura', etiqueta: 'Abre', tipo: 'hora', req: true },
        { k: 'hora_cierre', etiqueta: 'Cierra', tipo: 'hora', req: true },
        { k: 'duracion_min', etiqueta: 'Duración de cada bloque (minutos)', tipo: 'numero', req: true },
        { k: 'max_reservas_dia', etiqueta: 'Máx. reservas por acción por día', tipo: 'numero', req: true },
        { k: 'imagen_url', etiqueta: 'Imagen', tipo: 'imagen' },
        { k: 'activo', etiqueta: 'Disponible para reservar', tipo: 'bool' },
      ]}
    />
  )
}

export function AdminReservas() {
  const [fecha, setFecha] = useState(hoyISO())
  const inst = useDatos(() => api.listar('instalaciones'))
  const socios = useDatos(() => api.listar('socios'))
  const nombre = (id: string, l?: { id: string; nombre: string; apellido?: string }[] | null) => {
    const x = l?.find((i) => i.id === id)
    return x ? `${x.nombre} ${x.apellido ?? ''}` : ''
  }
  return (
    <>
      <Campo type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="mb-3" />
      <Crud
        tabla="reservas"
        nombre="reserva"
        soloLectura
        filtro={{ eq: { fecha }, orden: { campo: 'hora_inicio' } }}
        vista={(r) => ({
          titulo: `${fHoraTexto(r.hora_inicio)} · ${nombre(r.instalacion_id, inst.datos)}`,
          sub: `${nombre(r.socio_id, socios.datos)} · Acción ${r.accion}`,
          extra: <Insignia color={r.estado === 'confirmada' ? 'verde' : 'gris'}>{r.estado}</Insignia>,
        })}
        campos={[]}
      />
    </>
  )
}

function Inscritos({ actividadId }: { actividadId: string }) {
  const [abierto, setAbierto] = useState(false)
  const { datos } = useDatos(async () => {
    if (!abierto) return []
    const ins = await api.listar('inscripciones', { eq: { actividad_id: actividadId, estado: 'activa' } })
    const soc = ins.length ? await api.listar('socios', { in: { id: ins.map((i) => i.socio_id) } }) : []
    return ins.map((i) => ({ ...i, socio: soc.find((s) => s.id === i.socio_id) }))
  }, [abierto, actividadId])
  return (
    <>
      <button onClick={() => setAbierto(true)} className="text-sm font-medium text-azul">Inscritos</button>
      <Hoja abierta={abierto} onCerrar={() => setAbierto(false)} titulo="Inscritos">
        {(datos ?? []).map((i) => (
          <p key={i.id} className="border-b border-slate-100 py-2 text-sm">{i.socio?.nombre} {i.socio?.apellido} · Acción {i.accion}</p>
        ))}
        {datos?.length === 0 && <p className="py-6 text-center text-slate-500">Sin inscritos</p>}
      </Hoja>
    </>
  )
}

export function AdminActividades() {
  return (
    <Crud
      tabla="actividades"
      nombre="actividad"
      filtro={{ orden: { campo: 'nombre' } }}
      inicial={{ inscripciones_abiertas: true, precio_usd: 0, departamento: 'deportes' }}
      buscar={(a, q) => a.nombre.toLowerCase().includes(q)}
      acciones={(a) => <Inscritos actividadId={a.id} />}
      vista={(a) => ({ titulo: a.nombre, sub: `${depto(a.departamento).nombre}${a.programa ? ' · Macabilandia' : ''} · ${a.precio_usd > 0 ? fUSD(a.precio_usd) : 'sin costo'}` })}
      campos={[
        { k: 'nombre', etiqueta: 'Nombre', req: true },
        { k: 'departamento', etiqueta: 'Departamento', tipo: 'departamento', req: true },
        { k: 'programa', etiqueta: 'Programa especial', tipo: 'select', opciones: [{ v: 'macabilandia', t: 'Macabilandia' }] },
        { k: 'descripcion', etiqueta: 'Descripción', tipo: 'textoLargo' },
        { k: 'horario', etiqueta: 'Horario', ayuda: 'Ej.: Mar y Jue 4:00 – 5:30 pm' },
        { k: 'instructor', etiqueta: 'Instructor' },
        { k: 'edad_min', etiqueta: 'Edad mínima', tipo: 'numero' },
        { k: 'edad_max', etiqueta: 'Edad máxima', tipo: 'numero' },
        { k: 'cupo', etiqueta: 'Cupo', tipo: 'numero' },
        { k: 'precio_usd', etiqueta: 'Precio (USD) — se carga a la cuenta al inscribir', tipo: 'numero', req: true },
        { k: 'imagen_url', etiqueta: 'Imagen', tipo: 'imagen' },
        { k: 'inscripciones_abiertas', etiqueta: 'Inscripciones abiertas', tipo: 'bool' },
      ]}
    />
  )
}

// ---------------------------------------------------------------------------
// Eventos, noticias, galería
// ---------------------------------------------------------------------------

function EntradasVendidas({ eventoId }: { eventoId: string }) {
  const [abierto, setAbierto] = useState(false)
  const { datos } = useDatos(() => (abierto ? api.listar('entradas', { eq: { evento_id: eventoId } }) : Promise.resolve([])), [abierto, eventoId])
  const activas = (datos ?? []).filter((e) => e.estado !== 'anulada')
  return (
    <>
      <button onClick={() => setAbierto(true)} className="text-sm font-medium text-azul">Entradas</button>
      <Hoja abierta={abierto} onCerrar={() => setAbierto(false)} titulo="Entradas">
        <p className="mb-2 text-sm text-slate-600">{activas.length} vendidas · {activas.filter((e) => e.estado === 'usada').length} usadas</p>
        {(datos ?? []).map((e) => (
          <div key={e.id} className="flex justify-between border-b border-slate-100 py-2 text-sm">
            <span>{e.nombre_asistente} · Acción {e.accion}</span>
            <Insignia color={e.estado === 'activa' ? 'verde' : 'gris'}>{e.estado}</Insignia>
          </div>
        ))}
      </Hoja>
    </>
  )
}

export function AdminEventos() {
  return (
    <Crud
      tabla="eventos"
      nombre="evento"
      filtro={{ orden: { campo: 'fecha_inicio', asc: false } }}
      inicial={{ destacado: false, venta_entradas: false, precio_usd: 0, departamento: 'cultura' }}
      buscar={(e, q) => e.titulo.toLowerCase().includes(q)}
      acciones={(e) => e.venta_entradas && <EntradasVendidas eventoId={e.id} />}
      vista={(e) => ({ titulo: e.titulo, sub: `${fDiaHora(e.fecha_inicio)} · ${e.lugar ?? ''}`, extra: e.venta_entradas && <Insignia color="azul">{e.precio_usd > 0 ? fUSD(e.precio_usd) : 'Gratis'}</Insignia> })}
      campos={[
        { k: 'titulo', etiqueta: 'Título', req: true },
        { k: 'departamento', etiqueta: 'Departamento', tipo: 'departamento' },
        { k: 'fecha_inicio', etiqueta: 'Inicio', tipo: 'fechaHora', req: true },
        { k: 'fecha_fin', etiqueta: 'Fin', tipo: 'fechaHora' },
        { k: 'lugar', etiqueta: 'Lugar' },
        { k: 'descripcion', etiqueta: 'Descripción', tipo: 'textoLargo' },
        { k: 'imagen_url', etiqueta: 'Imagen / afiche', tipo: 'imagen' },
        { k: 'destacado', etiqueta: 'Destacado', tipo: 'bool' },
        { k: 'venta_entradas', etiqueta: 'Vender / reservar entradas en el app', tipo: 'bool' },
        { k: 'precio_usd', etiqueta: 'Precio por entrada (USD)', tipo: 'numero' },
        { k: 'aforo', etiqueta: 'Aforo total', tipo: 'numero' },
        { k: 'max_por_accion', etiqueta: 'Máx. entradas por acción', tipo: 'numero' },
      ]}
    />
  )
}

export function AdminNoticias() {
  return (
    <Crud
      tabla="noticias"
      nombre="noticia"
      filtro={{ orden: { campo: 'publicado_en', asc: false } }}
      inicial={{ destacado: false, departamento: 'comunicaciones', publicado_en: new Date().toISOString() }}
      buscar={(n, q) => n.titulo.toLowerCase().includes(q)}
      vista={(n) => ({ titulo: n.titulo, sub: `${depto(n.departamento).nombre} · ${fDiaHora(n.publicado_en)}` })}
      campos={[
        { k: 'titulo', etiqueta: 'Título', req: true },
        { k: 'departamento', etiqueta: 'Departamento', tipo: 'departamento' },
        { k: 'resumen', etiqueta: 'Resumen', tipo: 'textoLargo' },
        { k: 'contenido', etiqueta: 'Contenido', tipo: 'textoLargo' },
        { k: 'imagen_url', etiqueta: 'Imagen', tipo: 'imagen' },
        { k: 'publicado_en', etiqueta: 'Publicar el', tipo: 'fechaHora', req: true },
        { k: 'destacado', etiqueta: 'Destacada', tipo: 'bool' },
      ]}
    />
  )
}

function SubirFotos({ albumId }: { albumId: string }) {
  const aviso = useAviso()
  const [subiendo, setSubiendo] = useState(0)
  async function subir(files: FileList) {
    setSubiendo(files.length)
    try {
      const urls: string[] = []
      for (const f of Array.from(files)) {
        urls.push(await api.subirArchivo('publico', f))
        setSubiendo((n) => n - 1)
      }
      await api.crearVarios('fotos', urls.map((url) => ({ album_id: albumId, url })))
      const album = await api.obtener('albumes', albumId)
      if (album && !album.portada_url) await api.actualizar('albumes', albumId, { portada_url: urls[0] })
      aviso(`${urls.length} fotos subidas`)
    } catch (e) {
      aviso((e as Error).message, 'error')
    } finally {
      setSubiendo(0)
    }
  }
  return (
    <label className="cursor-pointer text-sm font-medium text-azul">
      {subiendo ? `Subiendo ${subiendo}…` : 'Subir fotos'}
      <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files?.length && subir(e.target.files)} />
    </label>
  )
}

export function AdminGaleria() {
  return (
    <Crud
      tabla="albumes"
      nombre="álbum"
      filtro={{ orden: { campo: 'fecha', asc: false } }}
      inicial={{ fecha: hoyISO() }}
      acciones={(a) => <SubirFotos albumId={a.id} />}
      vista={(a) => ({ titulo: a.titulo, sub: fFechaCorta(a.fecha) })}
      campos={[
        { k: 'titulo', etiqueta: 'Título', req: true },
        { k: 'fecha', etiqueta: 'Fecha', tipo: 'fecha', req: true },
        { k: 'portada_url', etiqueta: 'Portada', tipo: 'imagen' },
      ]}
    />
  )
}

// ---------------------------------------------------------------------------
// Notificaciones y solicitudes
// ---------------------------------------------------------------------------

export function AdminNotificaciones() {
  const aviso = useAviso()
  const [titulo, setTitulo] = useState('')
  const [cuerpo, setCuerpo] = useState('')
  const [destino, setDestino] = useState<'todos' | 'accion'>('todos')
  const [accion, setAccion] = useState('')
  const [enlace, setEnlace] = useState('')
  const [enviando, setEnviando] = useState(false)
  const historial = useDatos(() => api.listar('notificaciones', { orden: { campo: 'created_at', asc: false }, limite: 30 }))

  async function enviar() {
    setEnviando(true)
    try {
      await api.crear('notificaciones', { titulo, cuerpo, destino, accion: destino === 'accion' ? accion : null, enlace: enlace || null })
      aviso('Notificación enviada')
      setTitulo('')
      setCuerpo('')
      historial.recargar()
    } catch (e) {
      aviso((e as Error).message, 'error')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div>
      <Tarjeta className="space-y-4 p-4">
        <Campo etiqueta="Título" maxLength={60} value={titulo} onChange={(e) => setTitulo(e.target.value)} />
        <AreaTexto etiqueta="Mensaje" maxLength={300} value={cuerpo} onChange={(e) => setCuerpo(e.target.value)} />
        <Selector etiqueta="Destinatarios" value={destino} onChange={(e) => setDestino(e.target.value as typeof destino)}>
          <option value="todos">Todos los socios</option>
          <option value="accion">Una acción específica</option>
        </Selector>
        {destino === 'accion' && <Campo etiqueta="Número de acción" value={accion} onChange={(e) => setAccion(e.target.value)} />}
        <Selector etiqueta="Al tocarla, abrir…" value={enlace} onChange={(e) => setEnlace(e.target.value)}>
          <option value="">Nada</option>
          <option value="/agenda">Agenda</option>
          <option value="/cuenta">Mi cuenta</option>
          <option value="/noticias">Noticias</option>
          <option value="/actividades">Actividades</option>
          <option value="/macabilandia">Macabilandia</option>
          <option value="/reservas">Reservas</option>
        </Selector>
        <Boton bloque disabled={!titulo || !cuerpo || (destino === 'accion' && !accion)} cargando={enviando} onClick={enviar}>Enviar</Boton>
      </Tarjeta>
      <p className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wide text-slate-400">Enviadas</p>
      <Tarjeta className="divide-y divide-slate-100">
        {(historial.datos ?? []).map((n) => (
          <div key={n.id} className="px-4 py-3">
            <p className="font-medium">{n.titulo} <span className="text-xs font-normal text-slate-400">· {n.destino === 'todos' ? 'todos' : `acción ${n.accion ?? ''}`} · {fHace(n.created_at)}</span></p>
            <p className="text-sm text-slate-600">{n.cuerpo}</p>
          </div>
        ))}
      </Tarjeta>
    </div>
  )
}

export function AdminSolicitudes() {
  return (
    <Crud
      tabla="solicitudes"
      nombre="solicitud"
      sinEliminar
      filtro={{ orden: { campo: 'created_at', asc: false }, limite: 300 }}
      buscar={(s, q) => `${s.accion} ${s.asunto} ${s.descripcion}`.toLowerCase().includes(q)}
      vista={(s) => ({
        titulo: s.asunto,
        sub: `Acción ${s.accion} · ${NOMBRE_CATEGORIA[s.categoria]} · ${fHace(s.created_at)} · ${s.descripcion}`,
        extra: <Insignia color={ESTADO_SOLICITUD[s.estado][0]}>{ESTADO_SOLICITUD[s.estado][1]}</Insignia>,
      })}
      campos={[
        { k: 'estado', etiqueta: 'Estado', tipo: 'select', req: true, opciones: Object.entries(ESTADO_SOLICITUD).map(([v, [, t]]) => ({ v, t })) },
        { k: 'respuesta', etiqueta: 'Respuesta al socio', tipo: 'textoLargo' },
      ]}
    />
  )
}

// ---------------------------------------------------------------------------
// Configuración
// ---------------------------------------------------------------------------

export function AdminDirectorio() {
  return (
    <Crud
      tabla="directorio"
      nombre="contacto"
      filtro={{ orden: { campo: 'orden' } }}
      inicial={{ orden: 0 }}
      vista={(c) => ({ titulo: c.departamento, sub: [c.telefono, c.email].filter(Boolean).join(' · ') })}
      campos={[
        { k: 'departamento', etiqueta: 'Departamento', req: true },
        { k: 'responsable', etiqueta: 'Responsable' },
        { k: 'telefono', etiqueta: 'Teléfono' },
        { k: 'whatsapp', etiqueta: 'WhatsApp', ayuda: 'Con código de país, p. ej. 584141234567' },
        { k: 'email', etiqueta: 'Correo' },
        { k: 'ubicacion', etiqueta: 'Ubicación' },
        { k: 'horario', etiqueta: 'Horario' },
        { k: 'orden', etiqueta: 'Orden', tipo: 'numero' },
      ]}
    />
  )
}

export function AdminRestaurantes() {
  return (
    <Crud
      tabla="restaurantes"
      nombre="restaurante"
      filtro={{ orden: { campo: 'orden' } }}
      inicial={{ orden: 0 }}
      vista={(r) => ({ titulo: r.nombre, sub: r.horario })}
      campos={[
        { k: 'nombre', etiqueta: 'Nombre', req: true },
        { k: 'descripcion', etiqueta: 'Descripción', tipo: 'textoLargo' },
        { k: 'horario', etiqueta: 'Horario', tipo: 'textoLargo', ayuda: 'Una línea por día o rango de días' },
        { k: 'ubicacion', etiqueta: 'Ubicación' },
        { k: 'telefono', etiqueta: 'Teléfono' },
        { k: 'imagen_url', etiqueta: 'Imagen', tipo: 'imagen' },
        { k: 'orden', etiqueta: 'Orden', tipo: 'numero' },
      ]}
    />
  )
}

const BANCOS_VACIO: DatosBancarios = {
  pago_movil: { banco: '', telefono: '', rif: '' },
  transferencia_bs: { banco: '', cuenta: '', titular: '', rif: '' },
  zelle: { email: '', titular: '' },
  transferencia_usd: { banco: '', cuenta: '', titular: '' },
  nota: '',
}

export function AdminConfiguracion() {
  const aviso = useAviso()
  const { datos, setDatos } = useDatos(async () => ((await api.obtener('configuracion', 'datos_bancarios'))?.valor as DatosBancarios) ?? BANCOS_VACIO)
  const [guardando, setGuardando] = useState(false)
  if (!datos) return null
  const f = (grupo: keyof DatosBancarios, k: string, etiqueta: string) => (
    <Campo etiqueta={etiqueta} value={(datos[grupo] as any)[k]} onChange={(e) => setDatos({ ...datos, [grupo]: { ...(datos[grupo] as any), [k]: e.target.value } })} />
  )

  async function guardar() {
    setGuardando(true)
    try {
      const existe = await api.obtener('configuracion', 'datos_bancarios')
      if (existe) await api.actualizar('configuracion', 'datos_bancarios', { valor: datos })
      else await api.crear('configuracion', { id: 'datos_bancarios', valor: datos })
      aviso('Datos bancarios guardados')
    } catch (e) {
      aviso((e as Error).message, 'error')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="space-y-4">
      <Tarjeta className="space-y-3 p-4"><p className="font-semibold text-tinta">Pago Móvil</p>{f('pago_movil', 'banco', 'Banco')}{f('pago_movil', 'telefono', 'Teléfono')}{f('pago_movil', 'rif', 'RIF')}</Tarjeta>
      <Tarjeta className="space-y-3 p-4"><p className="font-semibold text-tinta">Transferencia en bolívares</p>{f('transferencia_bs', 'banco', 'Banco')}{f('transferencia_bs', 'cuenta', 'Número de cuenta')}{f('transferencia_bs', 'titular', 'Titular')}{f('transferencia_bs', 'rif', 'RIF')}</Tarjeta>
      <Tarjeta className="space-y-3 p-4"><p className="font-semibold text-tinta">Zelle</p>{f('zelle', 'email', 'Correo')}{f('zelle', 'titular', 'Titular')}</Tarjeta>
      <Tarjeta className="space-y-3 p-4"><p className="font-semibold text-tinta">Transferencia en dólares</p>{f('transferencia_usd', 'banco', 'Banco')}{f('transferencia_usd', 'cuenta', 'Cuenta')}{f('transferencia_usd', 'titular', 'Titular')}</Tarjeta>
      <AreaTexto etiqueta="Nota para el socio" value={datos.nota} onChange={(e) => setDatos({ ...datos, nota: e.target.value })} />
      <Boton bloque cargando={guardando} onClick={guardar}>Guardar</Boton>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Seguridad: registro de accesos
// ---------------------------------------------------------------------------

export function AdminAccesos() {
  return (
    <Crud
      tabla="accesos"
      nombre="acceso"
      soloLectura
      filtro={{ orden: { campo: 'created_at', asc: false }, limite: 200 }}
      buscar={(a, q) => `${a.nombre}`.toLowerCase().includes(q)}
      vista={(a) => ({
        titulo: a.nombre ?? '—',
        sub: `${a.tipo} · ${fDiaHora(a.created_at)} · ${a.motivo ?? ''}`,
        extra: <Insignia color={a.resultado === 'permitido' ? 'verde' : 'rojo'}>{a.resultado}</Insignia>,
      })}
      campos={[]}
    />
  )
}
