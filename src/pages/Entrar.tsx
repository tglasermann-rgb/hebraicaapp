import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Boton, Campo, MensajeError } from '@/components/ui'
import { api } from '@/lib/api'
import { CLUB } from '@/lib/brand'

export function MarcoAcceso({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto flex min-h-[100dvh] max-w-lg flex-col overflow-hidden bg-fondo">
      {/* Foto real del club con capa oscura */}
      <div className="foto-oscura flex flex-col items-center bg-cover bg-center px-6 pb-16 pt-[calc(env(safe-area-inset-top)+3rem)]" style={{ backgroundImage: 'url(./brand/club-piscina.jpg)' }}>
        <img src="./brand/logo-white.png" alt="Hebraica" className="relative h-28" />
        <p className="relative mt-4 text-center text-[13px] font-medium tracking-wide text-white/85">{CLUB.lema}</p>
      </div>
      <div className="animar-entrada relative -mt-8 flex-1 rounded-t-[36px] border-t border-white/10 bg-fondo px-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-8">{children}</div>
    </div>
  )
}

export default function Entrar() {
  const [usuario, setUsuario] = useState('')
  const [clave, setClave] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  async function entrar(u: string, c: string) {
    setError('')
    setCargando(true)
    try {
      await api.entrar(u, c)
    } catch (err) {
      setError((err as Error).message)
      setCargando(false)
    }
  }

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    entrar(usuario, clave)
  }

  return (
    <MarcoAcceso>
      <h1 className="font-display text-[28px] font-extrabold text-tinta">Hola de nuevo 👋</h1>
      <p className="mt-1 text-sm text-slate-500">Ingresa con tu usuario y contraseña.</p>
      <form onSubmit={enviar} className="mt-6 space-y-4">
        <Campo etiqueta="Usuario" autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} required value={usuario} onChange={(e) => setUsuario(e.target.value)} />
        <Campo etiqueta="Contraseña" type="password" autoComplete="current-password" required value={clave} onChange={(e) => setClave(e.target.value)} />
        {error && <MensajeError texto={error} />}
        <Boton type="submit" bloque cargando={cargando}>Entrar</Boton>
      </form>

      <Link to="/registro" className="mt-4 flex items-center justify-between rounded-[22px] bg-superficie p-4 shadow-card active:scale-[.99]">
        <span>
          <span className="block font-semibold text-tinta">¿Es tu primera vez?</span>
          <span className="block text-[13px] text-slate-500">Crea tu usuario y valida tu cuenta</span>
        </span>
        <span className="rounded-full bg-azul-50 px-4 py-2 text-sm font-semibold text-azul">Registrarme</span>
      </Link>
      <p className="mt-4 text-center text-[13px] text-slate-500">¿Olvidaste tu contraseña? Comunícate con Atención al Público.</p>

      {api.modo === 'demo' && (
        <div className="mt-8 rounded-3xl bg-superficie p-4">
          <p className="text-center text-xs font-medium uppercase tracking-wide text-slate-500">Modo demostración</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Boton variante="secundario" className="text-sm" onClick={() => entrar('david', 'demo1234')}>Socio</Boton>
            <Boton variante="secundario" className="text-sm" onClick={() => entrar('admin', 'admin1234')}>Admin</Boton>
            <Boton variante="secundario" className="text-sm" onClick={() => entrar('seguridad', 'seguridad1234')}>Seguridad</Boton>
          </div>
        </div>
      )}
      <p className="mt-8 text-center text-xs text-slate-400">
        <Link to="/privacidad">Privacidad</Link> · <Link to="/terminos">Términos</Link> · {CLUB.email}
      </p>
    </MarcoAcceso>
  )
}
