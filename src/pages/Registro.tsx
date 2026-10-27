import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { Boton, Campo, MensajeError } from '@/components/ui'
import { api } from '@/lib/api'
import { limpiarUsuario, USUARIO_VALIDO } from '@/lib/backend'
import { MarcoAcceso } from './Entrar'

/** Primera vez: la persona crea su usuario y envía sus datos para que Administración la apruebe. */
export default function Registro() {
  const { recargar } = useAuth()
  const [d, setD] = useState({ nombre: '', apellido: '', cedula: '', email: '', usuario: '', clave: '', clave2: '' })
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const fijar = (k: keyof typeof d) => (e: React.ChangeEvent<HTMLInputElement>) => setD({ ...d, [k]: e.target.value })

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (d.cedula.replace(/\D/g, '').length < 6) return setError('Revisa el número de cédula')
    if (!/^\S+@\S+\.\S+$/.test(d.email.trim())) return setError('Revisa tu correo electrónico')
    if (!USUARIO_VALIDO.test(limpiarUsuario(d.usuario))) return setError('El usuario debe tener de 3 a 30 letras o números, sin espacios')
    if (d.clave.length < 8) return setError('La contraseña debe tener al menos 8 caracteres')
    if (d.clave !== d.clave2) return setError('Las contraseñas no coinciden')
    setCargando(true)
    try {
      await api.registrar(d) // al terminar queda la sesión abierta y el app muestra "en revisión"
      await recargar() // la sesión se abre antes de guardar la solicitud: volver a leerla
    } catch (err) {
      setError((err as Error).message)
      setCargando(false)
    }
  }

  return (
    <MarcoAcceso>
      <h1 className="font-display text-[26px] font-extrabold text-tinta">Valida tu cuenta</h1>
      <p className="mt-1 text-sm text-slate-500">Completa tus datos. Administración verificará que eres socio y aprobará tu acceso.</p>
      <form onSubmit={enviar} className="mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Campo etiqueta="Nombre" autoComplete="given-name" required value={d.nombre} onChange={fijar('nombre')} />
          <Campo etiqueta="Apellido" autoComplete="family-name" required value={d.apellido} onChange={fijar('apellido')} />
        </div>
        <Campo etiqueta="Número de cédula" inputMode="numeric" required value={d.cedula} onChange={fijar('cedula')} placeholder="Ej. 12345678" />
        <Campo etiqueta="Correo electrónico" type="email" autoComplete="email" autoCapitalize="none" required value={d.email} onChange={fijar('email')} ayuda="Lo usaremos para recuperar tu contraseña si la olvidas." />
        <div className="border-t border-white/10 pt-4">
          <Campo etiqueta="Crea tu usuario" autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} required value={d.usuario} onChange={fijar('usuario')} placeholder="Ej. davidcohen" ayuda="Letras, números, punto o guion. Sin espacios." />
        </div>
        <Campo etiqueta="Contraseña" type="password" autoComplete="new-password" required value={d.clave} onChange={fijar('clave')} ayuda="Mínimo 8 caracteres" />
        <Campo etiqueta="Repite la contraseña" type="password" autoComplete="new-password" required value={d.clave2} onChange={fijar('clave2')} />
        {error && <MensajeError texto={error} />}
        <Boton type="submit" bloque cargando={cargando}>Enviar solicitud</Boton>
      </form>
      <p className="mt-6 text-center text-sm">
        <Link to="/entrar" className="font-semibold text-azul">Ya tengo usuario</Link>
      </p>
    </MarcoAcceso>
  )
}
