import { EyeOff, ShieldCheck } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/auth/AuthContext'
import { Avatar, CodigoQR, Pagina } from '@/components/ui'
import { api } from '@/lib/api'

const PARENTESCO = { titular: 'Titular', conyuge: 'Cónyuge', hijo: 'Hijo(a)', otro: 'Familiar' }

/**
 * Carnet personal: cada socio ve únicamente su propio código.
 * Contra capturas de pantalla:
 *  - el código es de un solo uso y vence a los 30 s (una foto o captura deja de servir enseguida);
 *  - un reloj con segundos y un punto "en vivo" permiten a Seguridad ver que no es una imagen fija;
 *  - el QR se oculta cuando el app pasa a segundo plano (no queda en el selector de apps).
 * En la versión de App Store / Google Play además se bloquean las capturas a nivel del sistema.
 */
export default function Carnet() {
  const { socio } = useAuth()
  const [token, setToken] = useState<{ token: string; expira: string } | null>(null)
  const [restante, setRestante] = useState(0)
  const [ahora, setAhora] = useState(new Date())
  const [oculto, setOculto] = useState(document.visibilityState !== 'visible')
  const [error, setError] = useState('')
  const renovando = useRef(false)

  const renovar = useCallback(async () => {
    if (!socio || renovando.current) return
    renovando.current = true
    try {
      const t = await api.emitirTokenCarnet(socio.id)
      setToken(t)
      setRestante(Math.round((Date.parse(t.expira) - Date.now()) / 1000))
      setError('')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      renovando.current = false
    }
  }, [socio])

  useEffect(() => {
    renovar()
  }, [renovar])

  useEffect(() => {
    const t = setInterval(() => {
      setAhora(new Date())
      if (!token) return
      const s = Math.max(0, Math.round((Date.parse(token.expira) - Date.now()) / 1000))
      setRestante(s)
      if (s <= 5) renovar()
    }, 1000)
    return () => clearInterval(t)
  }, [token, renovar])

  // Ocultar el código si el app deja de estar en primer plano; al volver se emite uno nuevo
  useEffect(() => {
    const ocultar = () => setOculto(true)
    const mostrar = () => {
      if (document.visibilityState !== 'visible') return ocultar()
      setOculto(false)
      renovar()
    }
    document.addEventListener('visibilitychange', mostrar)
    window.addEventListener('blur', ocultar)
    window.addEventListener('focus', mostrar)
    window.addEventListener('pagehide', ocultar)
    return () => {
      document.removeEventListener('visibilitychange', mostrar)
      window.removeEventListener('blur', ocultar)
      window.removeEventListener('focus', mostrar)
      window.removeEventListener('pagehide', ocultar)
    }
  }, [renovar])

  if (!socio) return null
  const reloj = ahora.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })

  return (
    <Pagina titulo="Mi carnet">
      <div className="malla relative overflow-hidden rounded-[32px] p-5 text-white select-none">
        <img src="./brand/isotipo-white.png" alt="" className="pointer-events-none absolute -right-12 -top-6 h-72 rotate-[-12deg] opacity-[.08]" />
        <div className="relative flex items-center justify-between">
          <img src="./brand/wordmark-white.png" alt="Hebraica" className="h-[22px]" />
          <span className="vidrio rounded-full px-3 py-1 text-[11px] font-bold tracking-[.14em]">SOCIO</span>
        </div>
        <div className="relative mt-6 flex items-center gap-4">
          <div className="rounded-full p-[3px] ring-2 ring-white/30">
            <Avatar nombre={`${socio.nombre} ${socio.apellido}`} foto={socio.foto_url} tam={62} />
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-[22px] font-extrabold leading-tight">{socio.nombre} {socio.apellido}</p>
            <p className="text-[13px] text-white/70">{PARENTESCO[socio.parentesco]}</p>
          </div>
        </div>
        <div className="relative mt-5 grid grid-cols-2 gap-3 text-[13px]">
          <div><p className="text-[11px] font-semibold uppercase tracking-wider text-white/60">Acción</p><p className="font-display text-lg font-bold">{socio.accion}</p></div>
          <div><p className="text-[11px] font-semibold uppercase tracking-wider text-white/60">Cédula</p><p className="font-display text-lg font-bold">{Number(socio.cedula).toLocaleString('es-VE')}</p></div>
        </div>

        <div className="relative mt-5 flex flex-col items-center rounded-[26px] bg-blanco p-5 text-[#0E1430]">
          {socio.estado !== 'activo' ? (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-700">Carnet suspendido. Comunícate con Atención al Público.</p>
          ) : oculto ? (
            <div className="flex h-[210px] w-[210px] flex-col items-center justify-center gap-2 rounded-2xl bg-slate-100 text-center text-sm text-slate-500">
              <EyeOff className="h-8 w-8" />
              Código oculto.<br />Toca aquí para verlo.
              <button className="absolute inset-0" aria-label="Mostrar código" onClick={() => { setOculto(false); renovar() }} />
            </div>
          ) : token ? (
            <>
              {/* Reloj en vivo: Seguridad comprueba que corre y coincide con la hora real */}
              <div className="mb-3 flex items-center gap-2 rounded-full bg-elevada px-3 py-1 text-white">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                <span className="font-mono text-sm font-semibold tabular-nums">{reloj}</span>
              </div>
              <CodigoQR valor={`HEB:S:${token.token}`} tam={210} />
              <div className="mt-4 w-full">
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-azul transition-all duration-1000 ease-linear" style={{ width: `${Math.min(100, (restante / 30) * 100)}%` }} />
                </div>
                <p className="mt-2 text-center text-xs font-medium text-slate-500">Código de un solo uso · cambia en {restante}s</p>
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
        Este carnet es personal. El código cambia cada 30 segundos y solo funciona una vez, así que una captura de pantalla o una foto no sirve para entrar.
      </div>
    </Pagina>
  )
}
