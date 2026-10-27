import { Clock, Clock3, Flame, MapPin, Trophy, User, Users } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { Boton, Cargando, Insignia, MensajeError, Pagina, Portada, Selector, Tarjeta, Vacio, useAviso } from '@/components/ui'
import { api } from '@/lib/api'
import { DEPARTAMENTOS, depto } from '@/lib/brand'
import { edad, fUSD } from '@/lib/formato'
import { useDatos } from '@/lib/useDatos'
import type { Actividad } from '@/lib/types'

/** Precio a mostrar: monto fijo, o el texto de la guía ("Sin costo", "Costo en Atención al Público") */
export const precio = (a: Actividad) => (a.precio_usd > 0 ? fUSD(a.precio_usd) : a.nota_precio ?? 'Incluida')

const rangoEdad = (a: Actividad) =>
  a.edad_min != null && a.edad_max != null ? `${a.edad_min} a ${a.edad_max} años` : a.edad_min != null ? `Desde ${a.edad_min} años` : a.edad_max != null ? `Hasta ${a.edad_max} años` : 'Todas las edades'

function TarjetaActividad({ a }: { a: Actividad }) {
  const d = depto(a.departamento)
  return (
    <Link to={`/actividades/${a.id}`} className="block">
      <Tarjeta className="flex overflow-hidden">
        <Portada imagen={a.imagen_url} departamento={a.departamento} className="w-24 shrink-0" />
        <div className="min-w-0 flex-1 p-3">
          <p className="text-xs font-medium" style={{ color: d.color }}>{d.nombre}</p>
          <p className="truncate font-medium text-slate-900">{a.nombre}</p>
          {a.horario && <p className="truncate text-sm text-slate-500">{a.horario}</p>}
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <Insignia color="gris">{rangoEdad(a)}</Insignia>
            <Insignia color={a.precio_usd > 0 ? 'azul' : a.nota_precio === 'Sin costo' ? 'verde' : 'gris'}>{a.precio_usd > 0 || a.nota_precio === 'Sin costo' ? precio(a) : 'Consultar costo'}</Insignia>
          </div>
        </div>
      </Tarjeta>
    </Link>
  )
}

export default function Actividades() {
  const [filtro, setFiltro] = useState<string | null>(null)
  const { datos, cargando } = useDatos(() => api.listar('actividades', { orden: { campo: 'nombre' } }))
  const lista = (datos ?? []).filter((a) => !a.programa && (!filtro || a.departamento === filtro))
  const deptos = DEPARTAMENTOS.filter((d) => datos?.some((a) => !a.programa && a.departamento === d.id))
  return (
    <Pagina titulo="Actividades y academias" atras>
      <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <button onClick={() => setFiltro(null)} className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium ${!filtro ? 'bg-azul text-white' : 'bg-superficie text-slate-600 shadow-card'}`}>Todas</button>
        {deptos.map((d) => (
          <button key={d.id} onClick={() => setFiltro(d.id)} className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium ${filtro === d.id ? 'text-white' : 'bg-superficie text-slate-600 shadow-card'}`} style={filtro === d.id ? { background: d.color } : undefined}>{d.nombre}</button>
        ))}
      </div>
      {cargando ? <Cargando /> : lista.length === 0 ? <Vacio icono={<Trophy />} titulo="No hay actividades publicadas" /> : <div className="space-y-3">{lista.map((a) => <TarjetaActividad key={a.id} a={a} />)}</div>}
    </Pagina>
  )
}

export function Macabilandia() {
  const { datos, cargando } = useDatos(() => api.listar('actividades', { eq: { programa: 'macabilandia' }, orden: { campo: 'nombre' } }))
  return (
    <Pagina titulo="Macabilandia" atras sinPadding>
      <div className="relative overflow-hidden bg-[#F39019] px-5 pb-8 pt-6 text-white">
        <img src="./brand/isotipo-white.png" alt="" className="absolute -right-6 -top-4 h-48 opacity-15" />
        <Flame className="h-10 w-10" />
        <h2 className="mt-2 font-display text-3xl font-bold">Macabilandia</h2>
        <p className="mt-1 max-w-xs text-white/90">El plan vacacional de Hebraica: deportes, piscina, juegos, arte y valores judíos.</p>
      </div>
      <div className="px-4 pt-4">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Inscripciones</p>
        {cargando ? <Cargando /> : !datos?.length ? <Vacio titulo="Pronto abriremos las inscripciones" texto="Te avisaremos con una notificación." /> : <div className="space-y-3">{datos.map((a) => <TarjetaActividad key={a.id} a={a} />)}</div>}
        <Link to="/normas?d=macabilandia" className="mt-4 block rounded-3xl bg-superficie p-4 text-sm font-semibold text-azul">Ver las normas de Macabilandia →</Link>
      </div>
    </Pagina>
  )
}

export function DetalleActividad() {
  const { id } = useParams()
  const { socio } = useAuth()
  const aviso = useAviso()
  const act = useDatos(() => api.obtener('actividades', id!), [id])
  const familia = useDatos(() => api.listar('socios', { eq: { accion: socio!.accion! } }), [socio?.accion])
  const navigate = useNavigate()
  const insc = useDatos(() => api.listar('inscripciones', { eq: { actividad_id: id!, accion: socio!.accion! }, in: { estado: ['activa', 'pendiente_pago'] } }), [id])
  const enRevision = useDatos(() => api.listar('pagos', { eq: { accion: socio!.accion!, estado: 'pendiente' } }), [socio?.accion])
  const [quien, setQuien] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (act.cargando) return <Pagina titulo="Actividad" atras><Cargando /></Pagina>
  const a = act.datos
  if (!a) return <Pagina titulo="Actividad" atras><Vacio titulo="No encontrada" /></Pagina>
  const d = depto(a.departamento)
  const inscritos = new Set((insc.datos ?? []).filter((i) => i.estado === 'activa').map((i) => i.socio_id))
  const porPagar = (insc.datos ?? []).filter((i) => i.estado === 'pendiente_pago')
  const ocupados = new Set((insc.datos ?? []).map((i) => i.socio_id))
  const nombre = (sid: string) => (familia.datos ?? []).find((f) => f.id === sid)?.nombre ?? ''
  const pagar = (cargo: string | null) => navigate(`/cuenta/reportar?cargos=${cargo}`)
  const elegibles = (familia.datos ?? []).filter((f) => {
    const e = edad(f.fecha_nacimiento)
    return !ocupados.has(f.id) && (e == null || ((a.edad_min == null || e >= a.edad_min) && (a.edad_max == null || e <= a.edad_max)))
  })
  const seleccionado = quien || elegibles[0]?.id || ''

  async function inscribir() {
    setError('')
    setEnviando(true)
    try {
      const cargo = await api.inscribir(a!.id, seleccionado)
      // Con costo: se paga de una vez; la inscripción se confirma al aprobarse el pago
      if (cargo) return pagar(cargo)
      aviso('¡Inscripción realizada!')
      insc.recargar()
      setQuien('')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Pagina titulo={a.nombre} atras sinPadding>
      <Portada imagen={a.imagen_url} departamento={a.departamento} className="h-44" />
      <div className="px-4">
        <Tarjeta className="-mt-8 p-4">
          <p className="text-sm font-medium" style={{ color: d.color }}>{d.nombre}</p>
          <h2 className="font-display text-[26px] font-extrabold text-tinta">{a.nombre}</h2>
          <div className="mt-2 space-y-1 text-sm text-slate-600">
            {a.horario && <p className="flex items-center gap-2"><Clock className="h-4 w-4" />{a.horario}</p>}
            {a.instructor && <p className="flex items-center gap-2"><User className="h-4 w-4" />{a.instructor}</p>}
            {a.lugar && <p className="flex items-center gap-2"><MapPin className="h-4 w-4" />{a.lugar}</p>}
            <p className="flex items-center gap-2"><Users className="h-4 w-4" />{rangoEdad(a)}{a.cupo && ` · ${a.cupo} cupos`}</p>
          </div>
          <p className="mt-3 text-lg font-semibold text-llama">{precio(a)}</p>
        </Tarjeta>
        {a.requisitos && <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700"><b>Requisito:</b> {a.requisitos}</p>}
        {a.descripcion && <p className="mt-4 whitespace-pre-line text-slate-700">{a.descripcion}</p>}

        {inscritos.size > 0 && (
          <Tarjeta className="mt-4 bg-emerald-50 p-4 text-sm text-emerald-800 shadow-none">
            Inscritos: {(familia.datos ?? []).filter((f) => inscritos.has(f.id)).map((f) => f.nombre).join(', ')}
          </Tarjeta>
        )}

        {porPagar.map((i) => {
          const revisando = (enRevision.datos ?? []).some((p) => p.cargo_ids?.includes(i.cargo_id!))
          return (
            <Tarjeta key={i.id} className="mt-4 bg-amber-50 p-4 shadow-none">
              <p className="flex items-center gap-2 font-semibold text-amber-800"><Clock3 className="h-4 w-4" />{nombre(i.socio_id)}: {revisando ? 'pago en revisión' : 'falta pagar'}</p>
              <p className="mt-1 text-sm text-amber-700">
                {revisando ? 'Quedará inscrito apenas Administración apruebe el pago.' : 'Su cupo está apartado por 48 horas. Si no pagas, se libera.'}
              </p>
              {!revisando && (
                <div className="mt-3 flex items-center gap-3">
                  <Boton className="flex-1" onClick={() => pagar(i.cargo_id)}>Pagar {fUSD(a.precio_usd)}</Boton>
                  <button
                    className="px-2 text-sm font-medium text-slate-500"
                    onClick={async () => {
                      try {
                        await api.cancelarInscripcion(i.id)
                        aviso('Inscripción cancelada')
                        insc.recargar()
                      } catch (e) {
                        setError((e as Error).message)
                      }
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </Tarjeta>
          )
        })}

        {a.inscripciones_abiertas ? (
          <Tarjeta className="mt-4 p-4">
            <h3 className="font-display text-lg font-extrabold text-tinta">Inscribir</h3>
            {elegibles.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">No hay miembros de tu familia disponibles para esta actividad (por edad o porque ya están inscritos).</p>
            ) : (
              <>
                <Selector className="mt-3" value={seleccionado} onChange={(e) => setQuien(e.target.value)}>
                  {elegibles.map((f) => <option key={f.id} value={f.id}>{f.nombre} {f.apellido}{edad(f.fecha_nacimiento) != null && ` (${edad(f.fecha_nacimiento)} años)`}</option>)}
                </Selector>
                {error && <div className="mt-3"><MensajeError texto={error} /></div>}
                <Boton bloque className="mt-3" cargando={enviando} onClick={inscribir}>{a.precio_usd > 0 ? `Inscribir y pagar · ${fUSD(a.precio_usd)}` : 'Inscribir'}</Boton>
                <p className="mt-2 text-center text-xs text-slate-500">{a.precio_usd > 0 ? 'Quedas inscrito cuando se apruebe tu pago.' : a.nota_precio === 'Sin costo' ? 'Actividad sin costo.' : 'Atención al Público confirmará tu inscripción y el costo, que se cargará a tu cuenta.'}</p>
              </>
            )}
          </Tarjeta>
        ) : (
          <p className="mt-4 rounded-2xl bg-slate-100 p-4 text-center text-sm text-slate-600">Las inscripciones están cerradas.</p>
        )}
      </div>
    </Pagina>
  )
}
