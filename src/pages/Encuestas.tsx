import clsx from 'clsx'
import { BarChart3, Star } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/auth/AuthContext'
import { AreaTexto, Boton, Cargando, Insignia, MensajeError, Pagina, Tarjeta, Vacio, useAviso } from '@/components/ui'
import { api } from '@/lib/api'
import { useDatos } from '@/lib/useDatos'
import type { Encuesta } from '@/lib/types'

export default function Encuestas() {
  const { socio } = useAuth()
  const { datos, cargando, recargar } = useDatos(async () => {
    const [encuestas, votos] = await Promise.all([
      api.listar('encuestas', { orden: { campo: 'created_at', asc: false } }),
      api.listar('votos', { eq: { socio_id: socio!.id } }),
    ])
    return encuestas.map((e) => ({ ...e, miVoto: votos.find((v) => v.encuesta_id === e.id) ?? null }))
  }, [socio?.id])

  return (
    <Pagina titulo="Encuestas" atras>
      <p className="mb-4 text-sm text-slate-500">Tu opinión ayuda a decidir las actividades y a mejorar los eventos del club.</p>
      {cargando ? (
        <Cargando />
      ) : !datos?.length ? (
        <Vacio icono={<BarChart3 />} titulo="No hay encuestas por ahora" />
      ) : (
        <div className="space-y-4">
          {datos.map((e) => <TarjetaEncuesta key={e.id} e={e} votado={e.miVoto?.opcion ?? null} alVotar={recargar} />)}
        </div>
      )}
    </Pagina>
  )
}

export function Estrellas({ valor, onChange, tam = 36 }: { valor: number; onChange?: (n: number) => void; tam?: number }) {
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" disabled={!onChange} onClick={() => onChange?.(n)} aria-label={`${n} estrellas`}>
          <Star style={{ width: tam, height: tam }} className={n <= valor ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} />
        </button>
      ))}
    </div>
  )
}

function TarjetaEncuesta({ e, votado, alVotar }: { e: Encuesta; votado: number | null; alVotar: () => void }) {
  const aviso = useAviso()
  const [opcion, setOpcion] = useState<number | null>(null)
  const [comentario, setComentario] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const cerrada = !e.abierta || (!!e.cierra && new Date(e.cierra) < new Date())
  const verResultados = votado != null || cerrada
  const resultados = useDatos(() => (verResultados ? api.resultadosEncuesta(e.id) : Promise.resolve([])), [verResultados, votado])

  async function votar() {
    if (opcion == null) return
    setError('')
    setEnviando(true)
    try {
      await api.votar(e.id, opcion, comentario)
      aviso('¡Gracias por tu opinión!')
      alVotar()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setEnviando(false)
    }
  }

  const total = (resultados.datos ?? []).reduce((t, r) => t + r.votos, 0)
  const promedio = total ? (resultados.datos ?? []).reduce((t, r) => t + r.opcion * r.votos, 0) / total : 0

  return (
    <Tarjeta className="p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-lg font-extrabold leading-snug">{e.titulo}</h3>
        {cerrada ? <Insignia color="gris">Cerrada</Insignia> : votado != null ? <Insignia color="verde">Votaste</Insignia> : null}
      </div>
      {e.descripcion && <p className="mt-1 text-sm text-slate-500">{e.descripcion}</p>}

      {!verResultados && (
        <div className="mt-4">
          {e.tipo === 'calificacion' ? (
            <Estrellas valor={opcion ?? 0} onChange={setOpcion} />
          ) : (
            <div className="space-y-2">
              {e.opciones.map((o, i) => (
                <button key={i} onClick={() => setOpcion(i)} className={clsx('w-full rounded-2xl border px-4 py-3 text-left font-medium transition', opcion === i ? 'border-azul bg-azul-50 text-tinta' : 'border-slate-200 bg-elevada')}>
                  {o}
                </button>
              ))}
            </div>
          )}
          {opcion != null && <AreaTexto className="mt-3" rows={2} placeholder="Comentario (opcional)" value={comentario} onChange={(ev) => setComentario(ev.target.value)} />}
          {error && <div className="mt-3"><MensajeError texto={error} /></div>}
          <Boton bloque className="mt-4" disabled={opcion == null} cargando={enviando} onClick={votar}>Enviar</Boton>
        </div>
      )}

      {verResultados && (
        <div className="mt-4">
          {resultados.cargando ? (
            <Cargando />
          ) : e.tipo === 'calificacion' ? (
            <div className="flex items-center gap-3">
              <Estrellas valor={Math.round(promedio)} tam={26} />
              <span className="font-display text-xl font-extrabold">{promedio.toFixed(1)}</span>
              <span className="text-sm text-slate-500">({total} {total === 1 ? 'voto' : 'votos'})</span>
            </div>
          ) : (
            <div className="space-y-3">
              {e.opciones.map((o, i) => {
                const v = resultados.datos?.find((r) => r.opcion === i)?.votos ?? 0
                const pct = total ? Math.round((v / total) * 100) : 0
                return (
                  <div key={i}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className={clsx('font-medium', votado === i && 'text-azul')}>{o}{votado === i && ' · tu voto'}</span>
                      <span className="tabular-nums text-slate-500">{pct}%</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-elevada">
                      <div className={clsx('h-full rounded-full', votado === i ? 'bg-azul' : 'bg-slate-400')} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
              <p className="text-xs text-slate-500">{total} {total === 1 ? 'voto' : 'votos'}</p>
            </div>
          )}
        </div>
      )}
    </Tarjeta>
  )
}
