import { Clock3, RefreshCw, XCircle } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useAuth } from '@/auth/AuthContext'
import { Boton, Campo, MensajeError } from '@/components/ui'
import { api } from '@/lib/api'
import { CLUB } from '@/lib/brand'
import { MarcoAcceso } from './Entrar'

/** Lo que ve una persona registrada mientras Administración no aprueba su acceso. */
export default function EnRevision() {
  const { registro, recargar, salir } = useAuth()
  const [d, setD] = useState({ nombre: registro?.nombre ?? '', apellido: registro?.apellido ?? '', cedula: registro?.cedula ?? '' })
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  async function reenviar(e: FormEvent) {
    e.preventDefault()
    setCargando(true)
    try {
      await api.reenviarRegistro(d)
      await recargar()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setCargando(false)
    }
  }

  async function actualizar() {
    setCargando(true)
    await recargar()
    setCargando(false)
  }

  if (!registro)
    return (
      <MarcoAcceso>
        <h1 className="font-display text-xl font-extrabold">Cuenta sin acceso</h1>
        <p className="mt-2 text-slate-500">Este usuario no está asociado a ningún socio. Comunícate con Atención al Público ({CLUB.email}).</p>
        <Boton bloque className="mt-6" onClick={salir}>Salir</Boton>
      </MarcoAcceso>
    )

  if (registro.estado === 'rechazado')
    return (
      <MarcoAcceso>
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-red-50 text-red-600"><XCircle className="h-7 w-7" /></span>
        <h1 className="mt-4 font-display text-[24px] font-extrabold">No pudimos validar tu cuenta</h1>
        {registro.motivo && <p className="mt-2 rounded-2xl bg-superficie p-4 text-sm text-slate-700">Motivo: {registro.motivo}</p>}
        <p className="mt-3 text-sm text-slate-500">Corrige tus datos y vuelve a enviar la solicitud.</p>
        <form onSubmit={reenviar} className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Campo etiqueta="Nombre" required value={d.nombre} onChange={(e) => setD({ ...d, nombre: e.target.value })} />
            <Campo etiqueta="Apellido" required value={d.apellido} onChange={(e) => setD({ ...d, apellido: e.target.value })} />
          </div>
          <Campo etiqueta="Número de cédula" inputMode="numeric" required value={d.cedula} onChange={(e) => setD({ ...d, cedula: e.target.value })} />
          {error && <MensajeError texto={error} />}
          <Boton type="submit" bloque cargando={cargando}>Reenviar solicitud</Boton>
        </form>
        <Boton variante="fantasma" bloque className="mt-2" onClick={salir}>Salir</Boton>
      </MarcoAcceso>
    )

  return (
    <MarcoAcceso>
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-amber-700"><Clock3 className="h-7 w-7" /></span>
      <h1 className="mt-4 font-display text-[26px] font-extrabold">Tu solicitud está en revisión</h1>
      <p className="mt-2 text-slate-500">Administración verificará tus datos y aprobará tu acceso. Te avisaremos apenas esté lista; luego entras con tu usuario y contraseña.</p>
      <div className="mt-5 divide-y divide-white/5 rounded-[22px] bg-superficie">
        {[
          ['Nombre', `${registro.nombre} ${registro.apellido}`],
          ['Cédula', Number(registro.cedula).toLocaleString('es-VE')],
          ['Usuario', registro.usuario],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between px-4 py-3 text-sm">
            <span className="text-slate-500">{k}</span>
            <span className="font-semibold">{v}</span>
          </div>
        ))}
      </div>
      <Boton bloque className="mt-6" cargando={cargando} onClick={actualizar}><RefreshCw className="h-4 w-4" /> Ver si ya fue aprobada</Boton>
      <Boton variante="fantasma" bloque className="mt-2" onClick={salir}>Salir</Boton>
    </MarcoAcceso>
  )
}
