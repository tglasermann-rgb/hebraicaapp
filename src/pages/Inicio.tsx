import { ArrowUpRight, Bell, CheckCircle2, Dumbbell, QrCode, ShieldCheck, CalendarCheck, Flame, Moon, Ticket, Trophy, UserPlus, Users, UtensilsCrossed } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { Avatar, Portada, Seccion, Tarjeta } from '@/components/ui'
import { api } from '@/lib/api'
import { depto } from '@/lib/brand'
import { proximoShabat } from '@/lib/calendarioJudio'
import { estadoCuenta } from '@/lib/cuenta'
import { capitalizar, fBs, fEvento, fFecha, fHace, fHora, fUSD, hoyISO } from '@/lib/formato'
import { useNoLeidas } from '@/lib/notificaciones'
import { useDatos } from '@/lib/useDatos'

const GRANDES = ['/reservas', '/entradas']

const ACCESOS = [
  { a: '/reservas', icono: CalendarCheck, texto: 'Reservar', color: '#16A394' },
  { a: '/actividades', icono: Trophy, texto: 'Actividades', color: '#2C55D8' },
  { a: '/clases', icono: Dumbbell, texto: 'Clases', color: '#16A394' },
  { a: '/macabilandia', icono: Flame, texto: 'Macabilandia', color: '#F07D0E' },
  { a: '/entradas', icono: Ticket, texto: 'Entradas', color: '#DB1F86' },
  { a: '/invitados', icono: UserPlus, texto: 'Invitados', color: '#7B3FD1' },
  { a: '/familia', icono: Users, texto: 'Familia', color: '#293E9B' },
  { a: '/restaurantes', icono: UtensilsCrossed, texto: 'Comer', color: '#E8312F' },
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

  const hoy = capitalizar(fFecha(new Date().toISOString(), "EEEE d 'de' MMMM"))

  return (
    <div className="px-4 pt-[calc(env(safe-area-inset-top)+12px)]">
      {/* Barra superior */}
      <div className="flex items-center justify-between">
        <img src="./brand/wordmark-white.png" alt="Hebraica" className="h-[20px] opacity-90" />
        <div className="flex items-center gap-2">
          <Link to="/notificaciones" aria-label="Notificaciones" className="relative grid h-10 w-10 place-items-center rounded-full bg-elevada">
            <Bell className="h-[19px] w-[19px]" />
            {noLeidas > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-llama px-1 text-[10px] font-bold text-white ring-2 ring-fondo">{noLeidas > 9 ? '9+' : noLeidas}</span>}
          </Link>
          <Link to="/perfil" aria-label="Perfil">
            <Avatar nombre={`${socio?.nombre} ${socio?.apellido}`} foto={socio?.foto_url} tam={40} />
          </Link>
        </div>
      </div>

      <div className="mt-7">
        <p className="text-[13px] font-medium text-slate-500">{hoy}</p>
        <h1 className="font-display text-[34px] font-extrabold leading-tight">{saludo}, {socio?.nombre}</h1>
      </div>

      {/* Saldo */}
      <div className="mt-5 rounded-[28px] bg-superficie p-5 shadow-card">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-medium text-slate-500">Por pagar · Acción {socio?.accion}</p>
          {c && c.pendientePorAprobar > 0 && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">{fUSD(c.pendientePorAprobar)} en revisión</span>}
        </div>
        {c ? (
          c.saldo > 0 ? (
            <>
              <p className="mt-2 font-display text-[44px] font-extrabold leading-none tracking-tight">{fUSD(c.saldo)}</p>
              {c.tasa && <p className="mt-2 text-[13px] text-slate-500">{fBs(c.saldo * c.tasa.bs_por_usd)} · BCV {c.tasa.bs_por_usd}</p>}
              <div className="mt-5 grid grid-cols-2 gap-2">
                <Link to="/cuenta" className="rounded-full bg-llama py-3 text-center text-sm font-semibold text-white active:scale-[.98]">Pagar</Link>
                <Link to="/cuenta" className="rounded-full bg-elevada py-3 text-center text-sm font-semibold active:scale-[.98]">Ver detalle</Link>
              </div>
            </>
          ) : (
            <p className="mt-2 flex items-center gap-2 font-display text-[32px] font-extrabold text-emerald-400"><CheckCircle2 className="h-8 w-8" /> Al día</p>
          )
        ) : (
          <div className="mt-3 h-11 w-40 animate-pulse rounded-2xl bg-elevada" />
        )}
      </div>

      {esStaff && (
        <Link to="/admin" className="mt-3 flex items-center gap-3 rounded-[24px] bg-superficie p-4 shadow-card">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-azul-50 text-azul"><ShieldCheck className="h-5 w-5" /></span>
          <span className="flex-1">
            <span className="block font-semibold">Panel de administración</span>
            <span className="block text-[13px] text-slate-500">Estás viendo el app como socio</span>
          </span>
          <ArrowUpRight className="h-5 w-5 text-slate-400" />
        </Link>
      )}

      {/* Bento */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Link to="/carnet" className="malla relative col-span-1 row-span-2 flex min-h-[188px] flex-col justify-between overflow-hidden rounded-[28px] p-4 text-white active:scale-[.98]">
          <img src="./brand/isotipo-white.png" alt="" className="pointer-events-none absolute -bottom-6 -right-6 h-36 rotate-[-12deg] opacity-15" />
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15"><QrCode className="h-6 w-6" /></span>
          <span className="relative">
            <span className="block font-display text-[22px] font-extrabold leading-tight">Mi carnet</span>
            <span className="block text-[13px] text-white/70">Toca para entrar al club</span>
          </span>
        </Link>
        {ACCESOS.filter((x) => GRANDES.includes(x.a)).map(({ a, icono: I, texto, color }) => (
          <Link key={a} to={a} className="flex min-h-[88px] items-center gap-3 rounded-[24px] bg-superficie p-4 shadow-card active:scale-[.98]">
            <span className="grid h-10 w-10 place-items-center rounded-2xl" style={{ background: `${color}26`, color }}><I className="h-5 w-5" strokeWidth={2.2} /></span>
            <span className="font-semibold">{texto}</span>
          </Link>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2.5">
        {ACCESOS.filter((x) => !GRANDES.includes(x.a)).map(({ a, icono: I, texto, color }) => (
          <Link key={a} to={a} className="flex flex-col items-center gap-2 rounded-[22px] bg-superficie px-1 py-3.5 shadow-card active:scale-[.97]">
            <span className="grid h-10 w-10 place-items-center rounded-2xl" style={{ background: `${color}26`, color }}><I className="h-5 w-5" strokeWidth={2.2} /></span>
            <span className="text-[11.5px] font-semibold leading-tight">{texto}</span>
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
                    <span className="rounded-2xl bg-superficie px-3 py-2 text-center leading-none text-tinta shadow-sm">
                      <span className="block font-display text-xl font-extrabold">{fFecha(e.fecha_inicio, 'd')}</span>
                      <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">{fFecha(e.fecha_inicio, 'MMM')}</span>
                    </span>
                    {e.venta_entradas && <span className="vidrio rounded-full px-3 py-1.5 text-[11px] font-semibold">🎟️ Entradas</span>}
                  </div>
                  <div className="relative -mx-4 -mb-4 bg-black/55 px-4 pb-4 pt-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-white/75">{depto(e.departamento).nombre}</p>
                    <p className="font-display text-[20px] font-bold leading-tight">{e.titulo}</p>
                    <p className="mt-1 text-[13px] text-white/80">{fEvento(e)}</p>
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
  )
}
