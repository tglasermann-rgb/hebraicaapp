import { MessageSquareText, Plus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useAuth } from '@/auth/AuthContext'
import { AreaTexto, Boton, Campo, Cargando, Hoja, Insignia, MensajeError, Pagina, Selector, Tarjeta, Vacio, useAviso } from '@/components/ui'
import { api } from '@/lib/api'
import { fHace } from '@/lib/formato'
import { useDatos } from '@/lib/useDatos'
import { NOMBRE_CATEGORIA, type CategoriaSolicitud } from '@/lib/types'

export const ESTADO_SOLICITUD = {
  abierta: ['azul', 'Recibida'],
  en_proceso: ['ambar', 'En proceso'],
  resuelta: ['verde', 'Resuelta'],
  cerrada: ['gris', 'Cerrada'],
} as const

export default function Solicitudes() {
  const { socio } = useAuth()
  const aviso = useAviso()
  const lista = useDatos(() => api.listar('solicitudes', { eq: { accion: socio!.accion! }, orden: { campo: 'created_at', asc: false } }), [socio?.accion])
  const [nueva, setNueva] = useState(false)
  const [categoria, setCategoria] = useState<CategoriaSolicitud>('sugerencia')
  const [asunto, setAsunto] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setEnviando(true)
    setError('')
    try {
      await api.crear('solicitudes', { socio_id: socio!.id, accion: socio!.accion!, categoria, asunto: asunto.trim(), descripcion: descripcion.trim(), estado: 'abierta', respuesta: null })
      aviso('Solicitud enviada. Te responderemos pronto.')
      setNueva(false)
      setAsunto('')
      setDescripcion('')
      lista.recargar()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Pagina titulo="Solicitudes y sugerencias" atras>
      <Boton bloque onClick={() => setNueva(true)}><Plus className="h-5 w-5" /> Nueva solicitud</Boton>
      <div className="mt-5 space-y-3">
        {lista.cargando ? <Cargando /> : !lista.datos?.length ? <Vacio icono={<MessageSquareText />} titulo="No has enviado solicitudes" texto="Reporta daños, envía sugerencias o solicita trámites." /> : lista.datos.map((s) => (
          <Tarjeta key={s.id} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs text-slate-500">{NOMBRE_CATEGORIA[s.categoria]} · {fHace(s.created_at)}</p>
                <p className="font-medium text-slate-900">{s.asunto}</p>
              </div>
              <Insignia color={ESTADO_SOLICITUD[s.estado][0]}>{ESTADO_SOLICITUD[s.estado][1]}</Insignia>
            </div>
            <p className="mt-1 text-sm text-slate-600">{s.descripcion}</p>
            {s.respuesta && <div className="mt-3 rounded-2xl bg-azul-50 p-3 text-sm text-tinta"><b>Respuesta del club:</b> {s.respuesta}</div>}
          </Tarjeta>
        ))}
      </div>

      <Hoja abierta={nueva} onCerrar={() => setNueva(false)} titulo="Nueva solicitud">
        <form onSubmit={enviar} className="space-y-4">
          <Selector etiqueta="Tipo" value={categoria} onChange={(e) => setCategoria(e.target.value as CategoriaSolicitud)}>
            {Object.entries(NOMBRE_CATEGORIA).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Selector>
          <Campo etiqueta="Asunto" required maxLength={120} value={asunto} onChange={(e) => setAsunto(e.target.value)} />
          <AreaTexto etiqueta="Descripción" required value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
          {error && <MensajeError texto={error} />}
          <Boton type="submit" bloque cargando={enviando}>Enviar</Boton>
        </form>
      </Hoja>
    </Pagina>
  )
}
