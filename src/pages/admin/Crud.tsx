import { format, parseISO } from 'date-fns'
import { ImagePlus, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { AreaTexto, Boton, Campo, Cargando, Hoja, MensajeError, Selector, Tarjeta, Vacio, useAviso } from '@/components/ui'
import { api } from '@/lib/api'
import type { Filtro } from '@/lib/backend'
import { DEPARTAMENTOS } from '@/lib/brand'
import { useDatos } from '@/lib/useDatos'
import type { Tabla, Tablas } from '@/lib/types'

export type TipoCampo = 'texto' | 'textoLargo' | 'numero' | 'fecha' | 'fechaHora' | 'hora' | 'bool' | 'select' | 'imagen' | 'departamento'

export interface CampoDef {
  k: string
  etiqueta: string
  tipo?: TipoCampo
  opciones?: { v: string; t: string }[]
  req?: boolean
  ayuda?: string
}

export interface FilaVista {
  titulo: ReactNode
  sub?: ReactNode
  extra?: ReactNode
}

interface Props<T extends Tabla> {
  tabla: T
  campos: CampoDef[]
  vista: (fila: Tablas[T]) => FilaVista
  filtro?: Filtro<Tablas[T]>
  inicial?: Partial<Tablas[T]>
  buscar?: (fila: Tablas[T], q: string) => boolean
  nombre?: string
  soloLectura?: boolean
  sinEliminar?: boolean
  acciones?: (fila: Tablas[T], recargar: () => void) => ReactNode
  cabecera?: (recargar: () => void) => ReactNode
}

const aInputFechaHora = (v: string | null) => (v ? format(parseISO(v), "yyyy-MM-dd'T'HH:mm") : '')
const deInputFechaHora = (v: string) => (v ? new Date(v).toISOString() : null)

/** Lista + formulario genérico para administrar una tabla. */
export function Crud<T extends Tabla>({ tabla, campos, vista, filtro, inicial, buscar, nombre = 'registro', soloLectura, sinEliminar, acciones, cabecera }: Props<T>) {
  const aviso = useAviso()
  const { datos, cargando, recargar } = useDatos(() => api.listar(tabla, filtro), [tabla, JSON.stringify(filtro)])
  const [q, setQ] = useState('')
  const [editando, setEditando] = useState<Record<string, any> | null>(null)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [subiendo, setSubiendo] = useState<string | null>(null)

  const filas = useMemo(() => (datos ?? []).filter((f) => !q || !buscar || buscar(f, q.toLowerCase())), [datos, q, buscar])

  function abrir(fila?: Tablas[T]) {
    setError('')
    const base: Record<string, any> = fila ? { ...fila } : { ...inicial }
    for (const c of campos) if (c.tipo === 'fechaHora') base[c.k] = aInputFechaHora(base[c.k] ?? null)
    setEditando(base)
  }

  async function guardar(e: FormEvent) {
    e.preventDefault()
    if (!editando) return
    setError('')
    setGuardando(true)
    try {
      const datos: Record<string, any> = {}
      for (const c of campos) {
        let v = editando[c.k]
        if (c.tipo === 'numero') v = v === '' || v == null ? null : Number(v)
        else if (c.tipo === 'fechaHora') v = deInputFechaHora(v)
        else if (c.tipo === 'bool') v = !!v
        else if (typeof v === 'string') v = v.trim() === '' ? null : v.trim()
        datos[c.k] = v ?? null
      }
      if (editando.id) await api.actualizar(tabla, editando.id, datos as any)
      else await api.crear(tabla, { ...inicial, ...datos } as any)
      aviso('Guardado')
      setEditando(null)
      recargar()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setGuardando(false)
    }
  }

  async function eliminar() {
    if (!editando?.id || !confirm(`¿Eliminar este ${nombre}? No se puede deshacer.`)) return
    try {
      await api.eliminar(tabla, editando.id)
      setEditando(null)
      recargar()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function subir(k: string, archivo: File) {
    setSubiendo(k)
    try {
      const url = await api.subirArchivo('publico', archivo)
      setEditando((e) => ({ ...e, [k]: url }))
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSubiendo(null)
    }
  }

  const fijar = (k: string, v: unknown) => setEditando((e) => ({ ...e, [k]: v }))

  return (
    <div>
      <div className="mb-3 flex gap-2">
        {buscar && (
          <label className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar…" className="w-full rounded-2xl border border-slate-200 bg-superficie py-2.5 pl-9 pr-3 text-[16px] outline-none focus:border-azul" />
          </label>
        )}
        {!soloLectura && (
          <Boton onClick={() => abrir()} className={buscar ? '' : 'w-full'}>
            <Plus className="h-5 w-5" /> Nuevo
          </Boton>
        )}
      </div>
      {cabecera?.(recargar)}
      {cargando ? (
        <Cargando />
      ) : filas.length === 0 ? (
        <Vacio titulo="No hay registros" />
      ) : (
        <Tarjeta className="divide-y divide-slate-100 overflow-hidden">
          {filas.map((f) => {
            const v = vista(f)
            return (
              <div key={(f as any).id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-slate-900">{v.titulo}</div>
                  {v.sub && <div className="truncate text-sm text-slate-500">{v.sub}</div>}
                </div>
                {v.extra}
                {acciones?.(f, recargar)}
                {!soloLectura && (
                  <button aria-label="Editar" onClick={() => abrir(f)} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-500 active:bg-slate-100">
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
              </div>
            )
          })}
        </Tarjeta>
      )}
      <p className="mt-2 text-right text-xs text-slate-400">{filas.length} registro(s)</p>

      <Hoja abierta={!!editando} onCerrar={() => setEditando(null)} titulo={editando?.id ? `Editar ${nombre}` : `Nuevo ${nombre}`}>
        {editando && (
          <form onSubmit={guardar} className="space-y-4 pb-2">
            {campos.map((c) => {
              const v = editando[c.k] ?? ''
              switch (c.tipo) {
                case 'textoLargo':
                  return <AreaTexto key={c.k} etiqueta={c.etiqueta} required={c.req} value={v} onChange={(e) => fijar(c.k, e.target.value)} />
                case 'bool':
                  return (
                    <label key={c.k} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                      <span className="text-sm font-medium text-slate-700">{c.etiqueta}</span>
                      <input type="checkbox" className="h-5 w-5 accent-azul" checked={!!editando[c.k]} onChange={(e) => fijar(c.k, e.target.checked)} />
                    </label>
                  )
                case 'select':
                case 'departamento': {
                  const ops = c.tipo === 'departamento' ? DEPARTAMENTOS.map((d) => ({ v: d.id, t: d.nombre })) : c.opciones!
                  return (
                    <Selector key={c.k} etiqueta={c.etiqueta} required={c.req} value={v} onChange={(e) => fijar(c.k, e.target.value)}>
                      {!c.req && <option value="">—</option>}
                      {ops.map((o) => <option key={o.v} value={o.v}>{o.t}</option>)}
                    </Selector>
                  )
                }
                case 'imagen':
                  return (
                    <div key={c.k}>
                      <span className="mb-1.5 block text-sm font-medium text-slate-700">{c.etiqueta}</span>
                      <label className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 p-3">
                        {v ? <img src={v} alt="" className="h-16 w-16 rounded-lg object-cover" /> : <ImagePlus className="h-6 w-6 text-azul" />}
                        <span className="flex-1 text-sm text-slate-600">{subiendo === c.k ? 'Subiendo…' : v ? 'Cambiar imagen' : 'Subir imagen'}</span>
                        {v && <button type="button" onClick={(e) => { e.preventDefault(); fijar(c.k, null) }} className="text-sm text-red-600">Quitar</button>}
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && subir(c.k, e.target.files[0])} />
                      </label>
                    </div>
                  )
                default: {
                  const tipo = { numero: 'number', fecha: 'date', fechaHora: 'datetime-local', hora: 'time' }[c.tipo as string] ?? 'text'
                  return <Campo key={c.k} etiqueta={c.etiqueta} ayuda={c.ayuda} type={tipo} step={c.tipo === 'numero' ? 'any' : undefined} required={c.req} value={v} onChange={(e) => fijar(c.k, e.target.value)} />
                }
              }
            })}
            {error && <MensajeError texto={error} />}
            <Boton type="submit" bloque cargando={guardando}>Guardar</Boton>
            {editando.id && !sinEliminar && (
              <Boton type="button" variante="peligro" bloque onClick={eliminar}><Trash2 className="h-4 w-4" /> Eliminar</Boton>
            )}
          </form>
        )}
      </Hoja>
    </div>
  )
}
