import { MailCheck } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Boton, Campo, Cargando, MensajeError } from '@/components/ui'
import { api } from '@/lib/api'
import { CLUB } from '@/lib/brand'
import { MarcoAcceso } from './Entrar'

/** Olvidé mi contraseña: se envía un enlace al correo registrado del socio. */
export function Recuperar() {
  const [usuario, setUsuario] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [enlaceDemo, setEnlaceDemo] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setError('')
    setCargando(true)
    try {
      setEnlaceDemo(await api.recuperarClave(usuario))
      setEnviado(true)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setCargando(false)
    }
  }

  return (
    <MarcoAcceso>
      {enviado ? (
        <>
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-400"><MailCheck className="h-7 w-7" /></span>
          <h1 className="mt-4 font-display text-[26px] font-extrabold">Revisa tu correo</h1>
          <p className="mt-2 text-slate-500">Si el usuario <b className="text-tinta">{usuario}</b> tiene un correo registrado, te enviamos un enlace para crear una nueva contraseña. Revisa también la carpeta de spam.</p>
          <p className="mt-3 text-sm text-slate-500">¿No te llegó? Comunícate con Atención al Público ({CLUB.email}).</p>
          {enlaceDemo && (
            <a href={enlaceDemo} className="mt-5 block rounded-2xl bg-amber-50 p-4 text-sm text-amber-700">Modo demostración: toca aquí para abrir el enlace que llegaría por correo.</a>
          )}
          <Link to="/entrar" className="mt-6 block text-center text-sm font-semibold text-azul">Volver a entrar</Link>
        </>
      ) : (
        <>
          <h1 className="font-display text-[26px] font-extrabold">Recupera tu contraseña</h1>
          <p className="mt-1 text-sm text-slate-500">Escribe tu usuario y te enviaremos un enlace a tu correo.</p>
          <form onSubmit={enviar} className="mt-6 space-y-4">
            <Campo etiqueta="Usuario" autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} required value={usuario} onChange={(e) => setUsuario(e.target.value)} />
            {error && <MensajeError texto={error} />}
            <Boton type="submit" bloque cargando={cargando}>Enviar enlace</Boton>
          </form>
          <Link to="/entrar" className="mt-6 block text-center text-sm font-semibold text-azul">Volver</Link>
        </>
      )}
    </MarcoAcceso>
  )
}

/** Página a la que lleva el enlace del correo: verifica el enlace y pide la nueva contraseña. */
export function NuevaClave() {
  const [params] = useSearchParams()
  const nav = useNavigate()
  const [estado, setEstado] = useState<'verificando' | 'listo' | 'error'>('verificando')
  const [clave, setClave] = useState('')
  const [clave2, setClave2] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    const token = params.get('token_hash')
    if (!token) return setEstado('error')
    api.verificarRecuperacion(token).then(() => setEstado('listo')).catch((e) => {
      setError((e as Error).message)
      setEstado('error')
    })
  }, [params])

  async function guardar(e: FormEvent) {
    e.preventDefault()
    if (clave.length < 8) return setError('La contraseña debe tener al menos 8 caracteres')
    if (clave !== clave2) return setError('Las contraseñas no coinciden')
    setCargando(true)
    try {
      await api.cambiarClave(clave)
      nav('/', { replace: true })
    } catch (err) {
      setError((err as Error).message)
      setCargando(false)
    }
  }

  return (
    <MarcoAcceso>
      {estado === 'verificando' && <Cargando texto="Verificando el enlace…" />}
      {estado === 'error' && (
        <>
          <h1 className="font-display text-[24px] font-extrabold">Enlace no válido</h1>
          <p className="mt-2 text-slate-500">{error || 'El enlace está incompleto.'}</p>
          <Link to="/recuperar" className="mt-6 block"><Boton bloque>Pedir un enlace nuevo</Boton></Link>
        </>
      )}
      {estado === 'listo' && (
        <>
          <h1 className="font-display text-[26px] font-extrabold">Crea tu nueva contraseña</h1>
          <form onSubmit={guardar} className="mt-6 space-y-4">
            <Campo etiqueta="Nueva contraseña" type="password" autoComplete="new-password" required value={clave} onChange={(e) => setClave(e.target.value)} ayuda="Mínimo 8 caracteres" />
            <Campo etiqueta="Repite la contraseña" type="password" autoComplete="new-password" required value={clave2} onChange={(e) => setClave2(e.target.value)} />
            {error && <MensajeError texto={error} />}
            <Boton type="submit" bloque cargando={cargando}>Guardar y entrar</Boton>
          </form>
        </>
      )}
    </MarcoAcceso>
  )
}
