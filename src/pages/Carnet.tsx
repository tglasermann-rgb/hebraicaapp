import { RefreshCw, ShieldCheck } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/auth/AuthContext'
import { Avatar, CodigoQR, Pagina } from '@/components/ui'
import { api } from '@/lib/api'
import { useDatos } from '@/lib/useDatos'
import type { Socio } from '@/lib/types'

const PARENTESCO = { titular: 'Titular', conyuge: 'Cónyuge', hijo: 'Hijo(a)', otro: 'Familiar' }

export default function Carnet() {
  const { socio } = useAuth()
  const familia = useDatos(() => (socio?.accion ? api.listar('socios', { eq: { accion: socio.accion }, orden: { campo: 'created_at' } }) : Promise.resolve([])), [socio?.accion])
  const [elegido, setElegido] = useState<Socio | null>(null)
  const persona = elegido ?? socio
  const [token, setToken] = useState<{ token: string; expira: string } | null>(null)
  const [restante, setRestante] = useState(0)
  const [error, setError] = useState('')
  const renovando = useRef(false)

  const renovar = useCallback(async () => {
    if (!persona || renovando.current) return
    renovando.current = true
    try {
      const t = await api.emitirTokenCarnet(persona.id)
      setToken(t)
      setRestante(Math.round((Date.parse(t.expira) - Date.now()) / 1000))
      setError('')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      renovando.current = false
    }
  }, [persona])

  useEffect(() => {
    renovar()
  }, [renovar])

  useEffect(() => {
    const t = setInterval(() => {
      if (!token) return
      const s = Math.max(0, Math.round((Date.parse(token.expira) - Date.now()) / 1000))
      setRestante(s)
      if (s <= 5) renovar()
    }, 1000)
    return () => clearInterval(t)
  }, [token, renovar])

  if (!persona) return null
  const otros = (familia.datos ?? []).filter((f) => f.id !== socio?.id)

  return (
    <Pagina titulo="Carnet">
      {otros.length > 0 && (
        <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4">
          {[socio!, ...otros].map((f) => (
            <button
              key={f.id}
              onClick={() => setElegido(f.id === socio?.id ? null : f)}
              className={`flex shrink-0 items-center gap-2 rounded-full py-1.5 pl-1.5 pr-4 text-sm font-semibold transition ${persona.id === f.id ? 'bg-tinta text-white' : 'bg-white text-slate-600 shadow-card'}`}
            >
              <Avatar nombre={`${f.nombre} ${f.apellido}`} foto={f.foto_url} tam={28} />
              {f.id === socio?.id ? 'Yo' : f.nombre}
            </button>
          ))}
        </div>
      )}

      {/* Pase estilo Wallet */}
      <div className="malla ruido relative overflow-hidden rounded-[32px] p-5 text-white shadow-flota">
        <img src="./brand/isotipo-white.png" alt="" className="pointer-events-none absolute -right-12 -top-6 h-72 rotate-[-12deg] opacity-[.08]" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent" />
        <div className="relative flex items-center justify-between">
          <img src="./brand/wordmark-white.png" alt="Hebraica" className="h-[22px]" />
          <span className="vidrio rounded-full px-3 py-1 text-[11px] font-bold tracking-[.14em]">SOCIO</span>
        </div>
        <div className="relative mt-6 flex items-center gap-4">
          <div className="rounded-full p-[3px] ring-2 ring-white/30">
            <Avatar nombre={`${persona.nombre} ${persona.apellido}`} foto={persona.foto_url} tam={62} />
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-[22px] font-extrabold leading-tight">{persona.nombre} {persona.apellido}</p>
            <p className="text-[13px] text-white/65">{PARENTESCO[persona.parentesco]}</p>
          </div>
        </div>
        <div className="relative mt-5 grid grid-cols-2 gap-3 text-[13px]">
          <div><p className="text-[11px] font-semibold uppercase tracking-wider text-white/50">Acción</p><p className="font-display text-lg font-extrabold">{persona.accion}</p></div>
          <div><p className="text-[11px] font-semibold uppercase tracking-wider text-white/50">Cédula</p><p className="font-display text-lg font-extrabold">{Number(persona.cedula).toLocaleString('es-VE')}</p></div>
        </div>

        <div className="relative mt-5 flex flex-col items-center rounded-[26px] bg-white p-5 text-tinta">
          {persona.estado !== 'activo' ? (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-700">Carnet suspendido. Comunícate con Atención al Público.</p>
          ) : token ? (
            <>
              <CodigoQR valor={`HEB:S:${token.token}`} tam={210} />
              <div className="mt-4 w-full">
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-gradient-to-r from-azul to-llama transition-all duration-1000 ease-linear" style={{ width: `${Math.min(100, (restante / 60) * 100)}%` }} />
                </div>
                <p className="mt-2 flex items-center justify-center gap-1.5 text-xs font-medium text-slate-500"><RefreshCw className="h-3.5 w-3.5" /> Código dinámico · se renueva en {restante}s</p>
              </div>
            </>
          ) : (
            <div className="h-[210px] w-[210px] animate-pulse rounded-2xl bg-slate-100" />
          )}
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-3xl bg-emerald-50 p-4 text-[13px] text-emerald-900">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
        Muestra este código en la entrada. Cambia cada minuto, por lo que una captura de pantalla no sirve para entrar.
      </div>
    </Pagina>
  )
}
