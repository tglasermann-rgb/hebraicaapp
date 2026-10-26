import { Fingerprint, KeyRound, LogOut, RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '@/auth/AuthContext'
import { Avatar, Boton, Campo, FilaEnlace, Hoja, Lista, MensajeError, Pagina, Seccion, Tarjeta, useAviso } from '@/components/ui'
import { api } from '@/lib/api'
import { activarBiometria, biometriaActiva, biometriaDisponible, desactivarBiometria } from '@/lib/biometria'
import { reiniciarDemo } from '@/lib/demoBackend'
import { fFechaCorta } from '@/lib/formato'

export default function Perfil() {
  const { socio, salir } = useAuth()
  const aviso = useAviso()
  const [bioDisp, setBioDisp] = useState(false)
  const [bio, setBio] = useState(biometriaActiva())
  const [clave, setClave] = useState(false)
  const [nueva, setNueva] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    biometriaDisponible().then(setBioDisp)
  }, [])

  async function alternarBio() {
    try {
      if (bio) {
        desactivarBiometria()
        setBio(false)
      } else {
        await activarBiometria(`${socio?.nombre} ${socio?.apellido}`)
        setBio(true)
        aviso('Desbloqueo con Face ID / huella activado')
      }
    } catch {
      aviso('No se pudo activar en este dispositivo', 'error')
    }
  }

  async function cambiar() {
    if (nueva.length < 8) return setError('Mínimo 8 caracteres')
    try {
      await api.cambiarClave(nueva)
      setClave(false)
      setNueva('')
      aviso('Contraseña actualizada')
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function eliminarCuenta() {
    if (!confirm('Se enviará a Atención al Público la solicitud para eliminar tu cuenta del app y tus datos personales asociados. ¿Continuar?')) return
    await api.crear('solicitudes', { socio_id: socio!.id, accion: socio!.accion!, categoria: 'tramite', asunto: 'Eliminar mi cuenta del app', descripcion: 'Solicito la eliminación de mi cuenta de Mi Hebraica y de los datos personales asociados.', estado: 'abierta', respuesta: null })
    aviso('Solicitud enviada. Te confirmaremos por correo.')
  }

  if (!socio) return null
  return (
    <Pagina titulo="Mi perfil" atras>
      <Tarjeta className="flex flex-col items-center p-6 text-center">
        <Avatar nombre={`${socio.nombre} ${socio.apellido}`} foto={socio.foto_url} tam={84} />
        <p className="mt-3 font-display text-xl font-extrabold text-tinta">{socio.nombre} {socio.apellido}</p>
        <p className="text-sm text-slate-500">Acción {socio.accion} · C.I. {socio.cedula}</p>
      </Tarjeta>
      <Seccion titulo="Datos">
        <Lista>
          <FilaEnlace titulo="Correo" sub={socio.email ?? '—'} />
          <FilaEnlace titulo="Teléfono" sub={socio.telefono ?? '—'} />
          {socio.fecha_nacimiento && <FilaEnlace titulo="Fecha de nacimiento" sub={fFechaCorta(socio.fecha_nacimiento)} />}
        </Lista>
        <p className="mt-2 text-xs text-slate-500">Para corregir tus datos envía una solicitud a Atención al Público.</p>
      </Seccion>
      <Seccion titulo="Seguridad">
        <Lista>
          {bioDisp && (
            <FilaEnlace onClick={alternarBio} icono={<Fingerprint className="h-5 w-5" />} titulo="Desbloquear con Face ID / huella" extra={<span className={`text-sm font-medium ${bio ? 'text-emerald-600' : 'text-slate-400'}`}>{bio ? 'Activo' : 'Inactivo'}</span>} />
          )}
          <FilaEnlace onClick={() => setClave(true)} icono={<KeyRound className="h-5 w-5" />} titulo="Cambiar contraseña" />
        </Lista>
      </Seccion>
      <Seccion titulo="Cuenta">
        <Lista>
          <FilaEnlace a="/ayuda" titulo="Ayuda, privacidad y términos" />
          <FilaEnlace onClick={eliminarCuenta} titulo={<span className="text-red-600">Solicitar eliminación de mi cuenta</span>} />
        </Lista>
      </Seccion>
      <Boton variante="peligro" bloque className="mt-6" onClick={salir}><LogOut className="h-5 w-5" /> Cerrar sesión</Boton>
      {api.modo === 'demo' && (
        <Boton variante="fantasma" bloque className="mt-2" onClick={reiniciarDemo}><RotateCcw className="h-4 w-4" /> Reiniciar datos de demostración</Boton>
      )}
      <p className="mt-4 text-center text-xs text-slate-400">Mi Hebraica v{__APP_VERSION__}</p>

      <Hoja abierta={clave} onCerrar={() => setClave(false)} titulo="Cambiar contraseña">
        <Campo etiqueta="Nueva contraseña" type="password" autoComplete="new-password" value={nueva} onChange={(e) => setNueva(e.target.value)} />
        {error && <div className="mt-3"><MensajeError texto={error} /></div>}
        <Boton bloque className="mt-4" onClick={cambiar}>Guardar</Boton>
      </Hoja>
    </Pagina>
  )
}
