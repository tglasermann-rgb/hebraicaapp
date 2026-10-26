import { UserPlus } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/auth/AuthContext'
import { AreaTexto, Avatar, Boton, Cargando, Hoja, Insignia, Lista, Pagina, useAviso } from '@/components/ui'
import { api } from '@/lib/api'
import { edad } from '@/lib/formato'
import { useDatos } from '@/lib/useDatos'

const PARENTESCO = { titular: 'Titular', conyuge: 'Cónyuge', hijo: 'Hijo(a)', otro: 'Familiar' }

export default function Familia() {
  const { socio } = useAuth()
  const aviso = useAviso()
  const { datos, cargando } = useDatos(() => api.listar('socios', { eq: { accion: socio!.accion! }, orden: { campo: 'created_at' } }), [socio?.accion])
  const [abrir, setAbrir] = useState(false)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function solicitar() {
    setEnviando(true)
    try {
      await api.crear('solicitudes', { socio_id: socio!.id, accion: socio!.accion!, categoria: 'tramite', asunto: 'Agregar o actualizar familiar', descripcion: texto, estado: 'abierta', respuesta: null })
      aviso('Solicitud enviada a Admisión')
      setAbrir(false)
      setTexto('')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Pagina titulo="Mi grupo familiar" atras>
      <p className="mb-4 text-sm text-slate-600">Todos los miembros de la acción {socio?.accion}. Los hijos sin teléfono pueden usar su carnet desde tu app (pantalla Carnet).</p>
      {cargando ? (
        <Cargando />
      ) : (
        <Lista>
          {datos!.map((f) => (
            <div key={f.id} className="flex items-center gap-3 px-4 py-3">
              <Avatar nombre={`${f.nombre} ${f.apellido}`} foto={f.foto_url} tam={44} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-900">{f.nombre} {f.apellido}</p>
                <p className="text-sm text-slate-500">{PARENTESCO[f.parentesco]}{edad(f.fecha_nacimiento) != null && ` · ${edad(f.fecha_nacimiento)} años`}</p>
              </div>
              {f.user_id ? <Insignia color="verde">Usa el app</Insignia> : f.email ? <Insignia color="gris">Sin activar</Insignia> : null}
            </div>
          ))}
        </Lista>
      )}
      <Boton variante="secundario" bloque className="mt-4" onClick={() => setAbrir(true)}>
        <UserPlus className="h-5 w-5" /> Agregar o actualizar un familiar
      </Boton>
      <p className="mt-3 text-center text-xs text-slate-500">Para que tu cónyuge o hijos mayores usen el app con su propia cuenta, deben tener correo registrado y activar su cuenta con su cédula.</p>

      <Hoja abierta={abrir} onCerrar={() => setAbrir(false)} titulo="Solicitud a Admisión">
        <p className="text-sm text-slate-600">Indica el nombre completo, cédula, parentesco, fecha de nacimiento y correo del familiar. Admisión te contactará si necesita documentos.</p>
        <AreaTexto className="mt-3" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Ej.: Agregar a mi hija Ana Cohen, C.I. 32.123.456, nacida el 03/11/2016" />
        <Boton bloque className="mt-4" disabled={texto.trim().length < 10} cargando={enviando} onClick={solicitar}>Enviar solicitud</Boton>
      </Hoja>
    </Pagina>
  )
}
