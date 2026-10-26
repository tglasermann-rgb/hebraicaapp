import { ArrowUpRight, Bell, ShieldCheck, CalendarCheck, Flame, MessageSquareText, Moon, Ticket, Trophy, UserPlus, Users, UtensilsCrossed } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { Avatar, Portada, Seccion, Tarjeta } from '@/components/ui'
import { api } from '@/lib/api'
import { depto } from '@/lib/brand'
import { proximoShabat } from '@/lib/calendarioJudio'
import { estadoCuenta } from '@/lib/cuenta'
import { fBs, fDiaHora, fFecha, fHace, fHora, fUSD, hoyISO } from '@/lib/formato'
import { useNoLeidas } from '@/lib/notificaciones'
import { useDatos } from '@/lib/useDatos'

const ACCESOS = [
  { a: '/reservas', icono: CalendarCheck, texto: 'Reservar', color: '#16A394' },
  { a: '/actividades', icono: Trophy, texto: 'Actividades', color: '#2C55D8' },
  { a: '/macabilandia', icono: Flame, texto: 'Macabilandia', color: '#F07D0E' },
  { a: '/entradas', icono: Ticket, texto: 'Entradas', color: '#DB1F86' },
  { a: '/invitados', icono: UserPlus, texto: 'Invitados', color: '#7B3FD1' },
  { a: '/familia', icono: Users, texto: 'Familia', color: '#293E9B' },
  { a: '/restaurantes', icono: UtensilsCrossed, texto: 'Comer', color: '#E8312F' },
  { a: '/solicitudes', icono: MessageSquareText, texto: 'Solicitudes', color: '#1E8A4C' },
]

export default function Inicio() {
  const { socio, esStaff } = useAuth()
  const noLeidas = useNoLeidas(socio)
  const shabat = proximoShabat()
  const cuenta = useDatos(() => (socio?.accion ? estadoCuenta(socio.accion) : Promise.resolve(null)), [socio?.accion])
  const eventos = useDatos(() => api.listar('eventos', { gte: { fecha_inicio: hoyISO() }, orden: { campo: 'fecha_inicio' }, limite: 6 }))
  const noticias = useDatos(() => api.listar('noticias', { orden: { campo: 'publicado_en', asc: false }, limite: 3 }))

  const hora = new Date().getHours()
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches'
  const c = cuenta.datos

  return (
    <div>
      {/* Encabezado con malla de marca */}
      <div className="malla relative overflow-hidden rounded-b-[36px] px-5 pb-6 pt-[calc(env(safe-area-inset-top)+14px)] text-white">
        <img src="./brand/isotipo-white.png" alt="" className="pointer-events-none absolute -right-10 top-6 h-64 rotate-[-10deg] opacity-[.07]" />
        <div className="relative flex items-center justify-between">
          <img src="./brand/wordmark-white.png" alt="Hebraica" className="h-[22px]" />
          <div className="flex items-center gap-2">
            <Link to="/notificaciones" aria-label="Notificaciones" className="vidrio relative grid h-10 w-10 place-items-center rounded-full">
              <Bell className="h-[19px] w-[19px]" />
              {noLeidas > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-llama px-1 text-[10px] font-bold ring-2 ring-[#1B2556]">{noLeidas > 9 ? '9+' : noLeidas}</span>}
            </Link>
            <Link to="/perfil" aria-label="Perfil" className="rounded-full ring-2 ring-white/25">
              <Avatar nombre={`${socio?.nombre} ${socio?.apellido}`} foto={socio?.foto_url} tam={38} />
            </Link>
          </div>
        </div>

        <div className="relative mt-7">
          <p className="text-[15px] text-white/65">{saludo},</p>
          <p className="font-display text-[32px] font-extrabold leading-tight">{socio?.nombre} 👋</p>
        </div>

        <Link to="/cuenta" className="vidrio relative mt-5 block rounded-[26px] p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[13px] font-medium text-white/60">Saldo · Acción {socio?.accion}</p>
              {c ? (
                <>
                  <p className="mt-1 font-display text-[38px] font-extrabold leading-none tracking-tight">{c.saldo > 0 ? fUSD(c.saldo) : 'Al día ✓'}</p>
                  {c.saldo > 0 && c.tasa && <p className="mt-2 text-[13px] text-white/60">{fBs(c.saldo * c.tasa.bs_por_usd)} · BCV {c.tasa.bs_por_usd}</p>}
                </>
              ) : (
                <div className="mt-2 h-9 w-36 animate-pulse rounded-2xl bg-white/15" />
              )}
            </div>
            <span className="grid h-11 w-11 place-items-center rounded-full bg-white text-tinta"><ArrowUpRight className="h-5 w-5" /></span>
          </div>
          {c && c.saldo > 0 && (
            <div className="mt-4 flex gap-2">
              <span className="flex-1 rounded-full bg-llama py-2.5 text-center text-sm font-semibold">Pagar ahora</span>
              <span className="flex-1 rounded-full bg-white/15 py-2.5 text-center text-sm font-semibold">Ver detalle</span>
            </div>
          )}
          {c && c.pendientePorAprobar > 0 && <p className="mt-3 text-xs font-medium text-amber-200">{fUSD(c.pendientePorAprobar)} en pagos por aprobar</p>}
        </Link>
      </div>

      <div className="animar-entrada px-4">
        {esStaff && (
          <Link to="/admin" className="mt-5 flex items-center gap-3 rounded-3xl bg-tinta p-4 text-white">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10"><ShieldCheck className="h-5 w-5" /></span>
            <span className="flex-1">
              <span className="block font-semibold">Panel de administración</span>
              <span className="block text-[13px] text-white/60">Estás viendo el app como socio</span>
            </span>
            <ArrowUpRight className="h-5 w-5 text-white/50" />
          </Link>
        )}
        {/* Accesos rápidos */}
        <div className="mt-5 grid grid-cols-4 gap-2.5">
          {ACCESOS.map(({ a, icono: I, texto, color }) => (
            <Link key={a} to={a} className="flex flex-col items-center gap-2 rounded-3xl bg-white py-3.5 shadow-card ring-1 ring-tinta/[0.03] active:scale-95">
              <span className="grid h-11 w-11 place-items-center rounded-2xl" style={{ background: `${color}14`, color }}>
                <I className="h-[22px] w-[22px]" strokeWidth={2.2} />
              </span>
              <span className="text-[11.5px] font-semibold leading-none text-slate-700">{texto}</span>
            </Link>
          ))}
        </div>

        {/* Shabat */}
        <Link to="/agenda?vista=judio" className="relative mt-4 flex items-center gap-4 overflow-hidden rounded-3xl bg-marino p-4 text-white shadow-card">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10"><Moon className="h-6 w-6 text-amber-200" /></span>
          <div className="relative min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[.12em] text-white/50">Shabat Shalom{shabat.parasha && ` · ${shabat.parasha.replace('Parashá ', '')}`}</p>
            <p className="mt-0.5 font-display text-[17px] font-bold">
              {shabat.velas ? `Velas ${fFecha(shabat.velas.toISOString(), 'EEE')} ${fHora(shabat.velas.toISOString())}` : 'Shabat'}
            </p>
            {shabat.havdala && <p className="text-[13px] text-white/60">Havdalá {fHora(shabat.havdala.toISOString())} · Caracas</p>}
          </div>
          <ArrowUpRight className="h-5 w-5 text-white/40" />
        </Link>

        {/* Eventos */}
        <Seccion titulo="Próximos eventos" enlace={{ a: '/agenda' }}>
          <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2">
            {(eventos.datos ?? []).map((e) => (
              <Link key={e.id} to={`/eventos/${e.id}`} className="w-[250px] shrink-0 snap-start active:scale-[.98]">
                <Portada imagen={e.imagen_url} departamento={e.departamento} className="flex h-[300px] flex-col justify-between rounded-[28px] p-4 text-white shadow-card">
                  <div className="relative flex items-start justify-between">
                    <span className="rounded-2xl bg-white px-3 py-2 text-center leading-none text-tinta shadow-sm">
                      <span className="block font-display text-xl font-extrabold">{fFecha(e.fecha_inicio, 'd')}</span>
                      <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">{fFecha(e.fecha_inicio, 'MMM')}</span>
                    </span>
                    {e.venta_entradas && <span className="vidrio rounded-full px-3 py-1.5 text-[11px] font-semibold">🎟️ Entradas</span>}
                  </div>
                  <div className="relative -mx-4 -mb-4 bg-tinta/75 px-4 pb-4 pt-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-white/75">{depto(e.departamento).nombre}</p>
                    <p className="font-display text-[20px] font-bold leading-tight">{e.titulo}</p>
                    <p className="mt-1 text-[13px] text-white/80">{fDiaHora(e.fecha_inicio)}</p>
                  </div>
                </Portada>
              </Link>
            ))}
            {eventos.datos?.length === 0 && <p className="text-sm text-slate-500">No hay eventos próximos.</p>}
          </div>
        </Seccion>

        {/* Noticias */}
        <Seccion titulo="Noticias" enlace={{ a: '/noticias' }}>
          <Tarjeta className="divide-y divide-slate-100 overflow-hidden">
            {(noticias.datos ?? []).map((n) => (
              <Link key={n.id} to={`/noticias/${n.id}`} className="flex gap-3.5 p-3 active:bg-slate-50">
                <Portada imagen={n.imagen_url} departamento={n.departamento} className="h-[72px] w-[72px] shrink-0 rounded-2xl" />
                <div className="min-w-0 flex-1 py-0.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: depto(n.departamento).color }}>{depto(n.departamento).nombre}</p>
                  <p className="line-clamp-2 font-semibold leading-snug text-tinta">{n.titulo}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{fHace(n.publicado_en)}</p>
                </div>
              </Link>
            ))}
          </Tarjeta>
        </Seccion>

        {api.modo === 'demo' && <p className="mt-6 text-center text-xs font-medium text-slate-400">Modo demostración · datos de ejemplo</p>}
      </div>
    </div>
  )
}
