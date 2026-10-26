import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Boton, Campo, MensajeError } from '@/components/ui'
import { api } from '@/lib/api'
import { MarcoAcceso } from './Entrar'

/** Activación de cuenta y recuperación de contraseña: acción + cédula → código por correo → nueva contraseña. */
export default function Activar() {
  const [params] = useSearchParams()
  const recuperar = params.has('recuperar')
  const nav = useNavigate()
  const [paso, setPaso] = useState<1 | 2 | 3>(1)
  const [accion, setAccion] = useState('')
  const [cedula, setCedula] = useState('')
  const [correo, setCorreo] = useState('')
  const [codigo, setCodigo] = useState('')
  const [clave, setClave] = useState('')
  const [clave2, setClave2] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  async function correr(fn: () => Promise<void>) {
    setError('')
    setCargando(true)
    try {
      await fn()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setCargando(false)
    }
  }

  const paso1 = (e: FormEvent) => {
    e.preventDefault()
    correr(async () => {
      setCorreo(await api.solicitarCodigo(accion, cedula))
      setPaso(2)
    })
  }
  const paso2 = (e: FormEvent) => {
    e.preventDefault()
    correr(async () => {
      await api.verificarCodigo(accion, cedula, codigo)
      setPaso(3)
    })
  }
  const paso3 = (e: FormEvent) => {
    e.preventDefault()
    if (clave.length < 8) return setError('La contraseña debe tener al menos 8 caracteres')
    if (clave !== clave2) return setError('Las contraseñas no coinciden')
    correr(async () => {
      await api.cambiarClave(clave)
      nav('/', { replace: true })
    })
  }

  return (
    <MarcoAcceso>
      <h1 className="font-display text-[26px] font-extrabold text-tinta">{recuperar ? 'Recuperar contraseña' : 'Activa tu cuenta'}</h1>
      <div className="mt-3 flex gap-1.5">
        {[1, 2, 3].map((n) => (
          <span key={n} className={`h-1.5 flex-1 rounded-full ${n <= paso ? 'bg-azul' : 'bg-slate-200'}`} />
        ))}
      </div>

      {paso === 1 && (
        <form onSubmit={paso1} className="mt-6 space-y-4">
          <p className="text-sm text-slate-500">Te enviaremos un código de verificación al correo registrado en el club.</p>
          <Campo etiqueta="Número de acción" required value={accion} onChange={(e) => setAccion(e.target.value)} />
          <Campo etiqueta="Cédula de identidad" inputMode="numeric" required value={cedula} onChange={(e) => setCedula(e.target.value)} />
          {error && <MensajeError texto={error} />}
          <Boton type="submit" bloque cargando={cargando}>Enviar código</Boton>
        </form>
      )}

      {paso === 2 && (
        <form onSubmit={paso2} className="mt-6 space-y-4">
          <p className="text-sm text-slate-500">
            Enviamos un código de 6 dígitos a <b className="text-slate-800">{correo}</b>. Revisa también la carpeta de spam.
          </p>
          <Campo etiqueta="Código" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required value={codigo} onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))} className="[&_input]:text-center [&_input]:text-2xl [&_input]:tracking-[.5em]" />
          {error && <MensajeError texto={error} />}
          <Boton type="submit" bloque cargando={cargando}>Verificar</Boton>
          <button type="button" onClick={() => setPaso(1)} className="w-full text-sm text-slate-500">Volver</button>
        </form>
      )}

      {paso === 3 && (
        <form onSubmit={paso3} className="mt-6 space-y-4">
          <p className="text-sm text-slate-500">Crea tu contraseña para entrar al app.</p>
          <Campo etiqueta="Nueva contraseña" type="password" autoComplete="new-password" required value={clave} onChange={(e) => setClave(e.target.value)} ayuda="Mínimo 8 caracteres" />
          <Campo etiqueta="Repite la contraseña" type="password" autoComplete="new-password" required value={clave2} onChange={(e) => setClave2(e.target.value)} />
          {error && <MensajeError texto={error} />}
          <Boton type="submit" bloque cargando={cargando}>Guardar y entrar</Boton>
        </form>
      )}

      <p className="mt-6 text-center text-sm">
        <Link to="/entrar" className="text-azul">Ya tengo contraseña</Link>
      </p>
    </MarcoAcceso>
  )
}
