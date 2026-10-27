import { BookOpen, ChevronDown, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Cargando, Pagina, Tarjeta, Vacio } from '@/components/ui'
import { api } from '@/lib/api'
import { DEPARTAMENTOS, depto } from '@/lib/brand'
import { useDatos } from '@/lib/useDatos'

/** Normas, reglamentos e información útil del club (Guía de Inscripciones y Normas de Pádel). */
export default function Normas() {
  const [params] = useSearchParams()
  const [q, setQ] = useState('')
  const [abierta, setAbierta] = useState<string | null>(null)
  const filtroDepto = params.get('d')
  const { datos, cargando } = useDatos(() => api.listar('normas', { orden: { campo: 'orden' } }))

  const grupos = useMemo(() => {
    const t = q.trim().toLowerCase()
    const lista = (datos ?? []).filter((n) => (!filtroDepto || n.departamento === filtroDepto) && (!t || `${n.titulo} ${n.contenido}`.toLowerCase().includes(t)))
    const orden = ['club', ...DEPARTAMENTOS.map((d) => d.id)]
    const g = new Map<string, typeof lista>()
    for (const n of lista) g.set(n.departamento, [...(g.get(n.departamento) ?? []), n])
    return [...g.entries()].sort((a, b) => orden.indexOf(a[0]) - orden.indexOf(b[0]))
  }, [datos, q, filtroDepto])

  return (
    <Pagina titulo="Normas del club" atras>
      <label className="relative mb-4 block">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar: pádel, descuentos, horario…" className="w-full rounded-2xl bg-superficie py-3.5 pl-10 pr-4 text-[16px] outline-none ring-azul/30 focus:ring-2" />
      </label>
      {cargando ? (
        <Cargando />
      ) : grupos.length === 0 ? (
        <Vacio icono={<BookOpen />} titulo="No encontramos normas con ese texto" />
      ) : (
        <div className="space-y-6">
          {grupos.map(([dep, normas]) => (
            <div key={dep}>
              <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider" style={{ color: dep === 'club' ? undefined : depto(dep).color }}>
                {dep === 'club' ? 'Hebraica' : depto(dep).nombre}
              </p>
              <Tarjeta className="divide-y divide-slate-100 overflow-hidden">
                {normas.map((n) => {
                  const ver = abierta === n.id || !!q.trim() || normas.length === 1
                  return (
                    <div key={n.id}>
                      <button onClick={() => setAbierta(abierta === n.id ? null : n.id)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
                        <span className="flex-1 font-semibold">{n.titulo}</span>
                        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition ${ver ? 'rotate-180' : ''}`} />
                      </button>
                      {ver && <p className="whitespace-pre-line px-4 pb-4 text-[14px] leading-relaxed text-slate-700">{n.contenido}</p>}
                    </div>
                  )
                })}
              </Tarjeta>
            </div>
          ))}
        </div>
      )}
      <p className="mt-6 text-center text-xs text-slate-500">Fuente: Guía de Inscripciones 2026-2027 y Normas de Pádel. Sujeto a cambios.</p>
    </Pagina>
  )
}
