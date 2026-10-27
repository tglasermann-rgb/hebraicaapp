import { BookOpen, CalendarCheck, Dumbbell, Vote, Flame, Image, LifeBuoy, MessageSquareText, Newspaper, Phone, Settings, ShieldCheck, Ticket, Trophy, UserPlus, Users, UtensilsCrossed } from 'lucide-react'
import { useAuth } from '@/auth/AuthContext'
import { Avatar, FilaEnlace, Lista, Pagina, Seccion, Tarjeta } from '@/components/ui'
import { NOMBRE_ROL } from '@/lib/types'
import { Link } from 'react-router-dom'

export default function Mas() {
  const { socio, esStaff } = useAuth()
  return (
    <Pagina titulo="Más">
      <Link to="/perfil">
        <Tarjeta className="flex items-center gap-3 p-4">
          <Avatar nombre={`${socio?.nombre} ${socio?.apellido}`} foto={socio?.foto_url} tam={52} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-lg font-extrabold text-tinta">{socio?.nombre} {socio?.apellido}</p>
            <p className="text-sm text-slate-500">Acción {socio?.accion} · Ver perfil</p>
          </div>
          <Settings className="h-5 w-5 text-slate-400" />
        </Tarjeta>
      </Link>

      {esStaff && (
        <Link to="/admin">
          <Tarjeta className="mt-3 flex items-center gap-3 bg-marino p-4 text-white">
            <ShieldCheck className="h-6 w-6" />
            <div className="flex-1">
              <p className="font-medium">Panel de administración</p>
              <p className="text-sm text-white/70">{NOMBRE_ROL[socio!.rol]}</p>
            </div>
          </Tarjeta>
        </Link>
      )}

      <Seccion titulo="Club">
        <Lista>
          <FilaEnlace a="/reservas" icono={<CalendarCheck className="h-5 w-5" />} titulo="Reservas" sub="Canchas, parrilleras y salones" />
          <FilaEnlace a="/actividades" icono={<Trophy className="h-5 w-5" />} titulo="Actividades y academias" />
          <FilaEnlace a="/clases" icono={<Dumbbell className="h-5 w-5" />} titulo="Clases" sub="Spinning, yoga y más, con lista de espera" />
          <FilaEnlace a="/macabilandia" icono={<Flame className="h-5 w-5" />} titulo="Macabilandia" />
          <FilaEnlace a="/entradas" icono={<Ticket className="h-5 w-5" />} titulo="Mis entradas" />
          <FilaEnlace a="/restaurantes" icono={<UtensilsCrossed className="h-5 w-5" />} titulo="Restaurantes" sub="Horarios y ubicación" />
        </Lista>
      </Seccion>
      <Seccion titulo="Mi acción">
        <Lista>
          <FilaEnlace a="/familia" icono={<Users className="h-5 w-5" />} titulo="Grupo familiar" />
          <FilaEnlace a="/invitados" icono={<UserPlus className="h-5 w-5" />} titulo="Pases de invitados" />
          <FilaEnlace a="/solicitudes" icono={<MessageSquareText className="h-5 w-5" />} titulo="Solicitudes y sugerencias" />
        </Lista>
      </Seccion>
      <Seccion titulo="Comunidad">
        <Lista>
          <FilaEnlace a="/noticias" icono={<Newspaper className="h-5 w-5" />} titulo="Noticias" />
          <FilaEnlace a="/galeria" icono={<Image className="h-5 w-5" />} titulo="Galería de fotos" />
          <FilaEnlace a="/encuestas" icono={<Vote className="h-5 w-5" />} titulo="Encuestas" />
          <FilaEnlace a="/normas" icono={<BookOpen className="h-5 w-5" />} titulo="Normas del club" sub="Inscripciones, pádel, gimnasio, horarios…" />
          <FilaEnlace a="/directorio" icono={<Phone className="h-5 w-5" />} titulo="Directorio del club" />
          <FilaEnlace a="/ayuda" icono={<LifeBuoy className="h-5 w-5" />} titulo="Ayuda y privacidad" />
        </Lista>
      </Seccion>
    </Pagina>
  )
}
