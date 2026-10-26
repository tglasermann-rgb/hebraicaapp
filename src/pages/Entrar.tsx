import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Boton, Campo, MensajeError } from '@/components/ui'
import { api } from '@/lib/api'
import { CLUB } from '@/lib/brand'

export function MarcoAcceso({ children }: { children: React.ReactNode }) {
  return (
    <div className="malla relative mx-auto flex min-h-[100dvh] max-w-lg flex-col overflow-hidden">
      <img src="./brand/isotipo-white.png" alt="" className="pointer-events-none absolute -left-16 top-24 h-80 rotate-[12deg] opacity-[.05]" />
      <div className="relative flex flex-col items-center px-6 pb-9 pt-[calc(env(safe-area-inset-top)+3.5rem)]">
        <img src="./brand/logo-white.png" alt="Hebraica" className="h-32 drop-shadow-[0_10px_30px_rgba(0,0,0,.25)]" />
        <p className="mt-4 text-center text-[13px] font-medium tracking-wide text-white/60">{CLUB.lema}</p>
      </div>
      <div className="animar-entrada relative flex-1 rounded-t-[36px] bg-white px-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-8 shadow-flota">{children}</div>
    </div>
  )
}

export default function Entrar() {
  const [accion, setAccion] = useState('')
  const [cedula, setCedula] = useState('')
  const [clave, setClave] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setError('')
    setCargando(true)
    try {
      await api.entrar(accion, cedula, clave)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setCargando(false)
    }
  }

  async function demo(a: string, c: string, k: string) {
    setCargando(true)
    try {
      await api.entrar(a, c, k)
    } catch (err) {
      setError((err as Error).message)
      setCargando(false)
    }
  }

  return (
    <MarcoAcceso>
      <h1 className="font-display text-[28px] font-extrabold text-tinta">Hola de nuevo 👋</h1>
      <p className="mt-1 text-sm text-slate-500">Ingresa con tu número de acción y cédula.</p>
      <form onSubmit={enviar} className="mt-6 space-y-4">
        <Campo etiqueta="Número de acción" inputMode="text" autoComplete="username" required value={accion} onChange={(e) => setAccion(e.target.value)} placeholder="Ej. 1234" />
        <Campo etiqueta="Cédula de identidad" inputMode="numeric" required value={cedula} onChange={(e) => setCedula(e.target.value)} placeholder="Ej. 12345678" />
        <Campo etiqueta="Contraseña" type="password" autoComplete="current-password" required value={clave} onChange={(e) => setClave(e.target.value)} />
        {error && <MensajeError texto={error} />}
        <Boton type="submit" bloque cargando={cargando}>
          Entrar
        </Boton>
      </form>
      <div className="mt-5 flex flex-col items-center gap-3 text-sm">
        <Link to="/activar" className="font-medium text-azul">
          ¿Primera vez? Activa tu cuenta
        </Link>
        <Link to="/activar?recuperar=1" className="text-slate-500">
          Olvidé mi contraseña
        </Link>
      </div>

      {api.modo === 'demo' && (
        <div className="mt-8 rounded-3xl bg-fondo p-4">
          <p className="text-center text-xs font-medium uppercase tracking-wide text-slate-500">Modo demostración</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Boton variante="secundario" className="text-sm" onClick={() => demo('1234', '12345678', 'demo1234')}>Socio</Boton>
            <Boton variante="secundario" className="text-sm" onClick={() => demo('0001', '11111111', 'admin1234')}>Admin</Boton>
            <Boton variante="secundario" className="text-sm" onClick={() => demo('E-001', '22222222', 'seguridad1234')}>Seguridad</Boton>
          </div>
        </div>
      )}
      <p className="mt-8 text-center text-xs text-slate-400">
        <Link to="/privacidad">Privacidad</Link> · <Link to="/terminos">Términos</Link> · {CLUB.email}
      </p>
    </MarcoAcceso>
  )
}
