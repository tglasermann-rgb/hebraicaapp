import { CheckCircle2, Keyboard, XCircle } from 'lucide-react'
import QrScanner from 'qr-scanner'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Boton, Campo, MensajeError } from '@/components/ui'
import { api } from '@/lib/api'
import type { ResultadoValidacion } from '@/lib/types'

const TIPO = { socio: 'Socio', invitado: 'Invitado', entrada: 'Entrada a evento', desconocido: '' }

export default function Escaner() {
  const video = useRef<HTMLVideoElement>(null)
  const escaner = useRef<QrScanner | null>(null)
  const ocupado = useRef(false)
  const [resultado, setResultado] = useState<ResultadoValidacion | null>(null)
  const [error, setError] = useState('')
  const [manual, setManual] = useState('')

  const validar = useCallback(async (codigo: string) => {
    if (ocupado.current) return
    ocupado.current = true
    escaner.current?.pause()
    try {
      const r = await api.validarCodigo(codigo.trim())
      setResultado(r)
      navigator.vibrate?.(r.valido ? 80 : [80, 60, 80])
    } catch (e) {
      setResultado({ valido: false, tipo: 'desconocido', mensaje: (e as Error).message })
    }
  }, [])

  useEffect(() => {
    if (!video.current) return
    const s = new QrScanner(video.current, (r) => validar(r.data), { preferredCamera: 'environment', highlightScanRegion: true, maxScansPerSecond: 4 })
    escaner.current = s
    s.start().catch(() => setError('No se pudo abrir la cámara. Permite el acceso a la cámara o escribe el código manualmente.'))
    return () => s.destroy()
  }, [validar])

  function siguiente() {
    setResultado(null)
    ocupado.current = false
    escaner.current?.start()
  }

  return (
    <div>
      <div className="relative mx-auto aspect-square max-w-sm overflow-hidden rounded-3xl bg-black">
        <video ref={video} className="h-full w-full object-cover" muted playsInline />
        {resultado && (
          <button onClick={siguiente} className={`absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white ${resultado.valido ? 'bg-emerald-600' : 'bg-red-600'}`}>
            {resultado.valido ? <CheckCircle2 className="h-20 w-20" /> : <XCircle className="h-20 w-20" />}
            <p className="mt-3 text-2xl font-bold">{resultado.mensaje}</p>
            {resultado.foto_url && <img src={resultado.foto_url} alt="" className="mt-3 h-24 w-24 rounded-full border-4 border-white object-cover" />}
            {resultado.nombre && <p className="mt-3 text-xl font-semibold">{resultado.nombre}</p>}
            <p className="text-white/85">{TIPO[resultado.tipo]}{resultado.detalle && ` · ${resultado.detalle}`}</p>
            <p className="mt-6 rounded-full bg-white/20 px-5 py-2 text-sm">Toca para escanear el siguiente</p>
          </button>
        )}
      </div>
      {error && <div className="mt-3"><MensajeError texto={error} /></div>}
      <p className="mt-3 text-center text-sm text-slate-500">Apunta la cámara al código QR del carnet, pase de invitado o entrada.</p>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (manual) validar(manual.startsWith('HEB:') ? manual : `HEB:${manual}`)
          setManual('')
        }}
        className="mt-6 flex items-end gap-2"
      >
        <Campo className="flex-1" etiqueta="Código manual" placeholder="HEB:…" value={manual} onChange={(e) => setManual(e.target.value)} />
        <Boton type="submit" variante="secundario"><Keyboard className="h-4 w-4" /></Boton>
      </form>
    </div>
  )
}
