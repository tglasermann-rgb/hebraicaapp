import clsx from 'clsx'
import { ArrowLeft, BarChart3, BookOpen, Dumbbell, History, PieChart, LogOut, Smartphone, Bell, CalendarCheck, CalendarDays, Contact, DollarSign, Image, LayoutDashboard, ListChecks, MessageSquareText, Newspaper, QrCode, Receipt, Settings, ShieldCheck, Trophy, UserCheck, Users, UtensilsCrossed, Wallet } from 'lucide-react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import type { Rol } from '@/lib/types'

export const SECCIONES: { a: string; texto: string; icono: typeof Users; roles: Rol[]; grupo: string }[] = [
  { a: '/admin', texto: 'Resumen', icono: LayoutDashboard, roles: ['administracion', 'deportes', 'eventos', 'seguridad'], grupo: '' },
  { a: '/admin/escaner', texto: 'Escáner de acceso', icono: QrCode, roles: ['seguridad', 'eventos'], grupo: 'Seguridad' },
  { a: '/admin/accesos', texto: 'Registro de accesos', icono: ShieldCheck, roles: ['seguridad'], grupo: 'Seguridad' },
  { a: '/admin/accesos-nuevos', texto: 'Solicitudes de acceso', icono: UserCheck, roles: ['administracion'], grupo: 'Administración' },
  { a: '/admin/socios', texto: 'Socios', icono: Users, roles: ['administracion'], grupo: 'Administración' },
  { a: '/admin/pagos', texto: 'Pagos reportados', icono: Wallet, roles: ['administracion'], grupo: 'Administración' },
  { a: '/admin/cargos', texto: 'Cargos y cuotas', icono: Receipt, roles: ['administracion'], grupo: 'Administración' },
  { a: '/admin/tasas', texto: 'Tasa BCV', icono: DollarSign, roles: ['administracion'], grupo: 'Administración' },
  { a: '/admin/instalaciones', texto: 'Instalaciones', icono: CalendarCheck, roles: ['deportes'], grupo: 'Deportes' },
  { a: '/admin/reservas', texto: 'Reservas', icono: ListChecks, roles: ['deportes', 'seguridad'], grupo: 'Deportes' },
  { a: '/admin/actividades', texto: 'Actividades e inscritos', icono: Trophy, roles: ['deportes', 'eventos'], grupo: 'Deportes' },
  { a: '/admin/clases', texto: 'Clases y lista de espera', icono: Dumbbell, roles: ['deportes'], grupo: 'Deportes' },
  { a: '/admin/eventos', texto: 'Eventos y entradas', icono: CalendarDays, roles: ['eventos'], grupo: 'Eventos y contenido' },
  { a: '/admin/noticias', texto: 'Noticias', icono: Newspaper, roles: ['eventos', 'deportes', 'administracion'], grupo: 'Eventos y contenido' },
  { a: '/admin/galeria', texto: 'Galería', icono: Image, roles: ['eventos'], grupo: 'Eventos y contenido' },
  { a: '/admin/notificaciones', texto: 'Enviar notificación', icono: Bell, roles: ['administracion', 'deportes', 'eventos', 'seguridad'], grupo: 'Eventos y contenido' },
  { a: '/admin/solicitudes', texto: 'Trámites de socios', icono: MessageSquareText, roles: ['administracion', 'deportes', 'eventos', 'seguridad'], grupo: 'Atención al socio' },
  { a: '/admin/normas', texto: 'Normas del club', icono: BookOpen, roles: ['administracion', 'deportes', 'eventos'], grupo: 'Atención al socio' },
  { a: '/admin/directorio', texto: 'Directorio', icono: Contact, roles: [], grupo: 'Configuración' },
  { a: '/admin/restaurantes', texto: 'Restaurantes', icono: UtensilsCrossed, roles: [], grupo: 'Configuración' },
  { a: '/admin/configuracion', texto: 'Datos bancarios', icono: Settings, roles: [], grupo: 'Configuración' },
  { a: '/admin/reportes', texto: 'Reportes', icono: BarChart3, roles: ['administracion'], grupo: 'Administración' },
  { a: '/admin/estadisticas', texto: 'Estadísticas', icono: PieChart, roles: ['administracion'], grupo: 'Administración' },
  { a: '/admin/historial', texto: 'Historial de cambios', icono: History, roles: [], grupo: 'Configuración' },
]

export function useSecciones() {
  const { tieneRol } = useAuth()
  return SECCIONES.filter((s) => tieneRol(...s.roles))
}

export default function AdminLayout() {
  const secciones = useSecciones()
  const { socio, salir } = useAuth()
  const soloSeguridad = socio?.rol === 'seguridad'
  const { pathname } = useLocation()
  const actual = secciones.find((s) => s.a === pathname)
  const grupos = [...new Set(secciones.map((s) => s.grupo))]

  return (
    <div className="min-h-[100dvh] bg-fondo lg:flex">
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-superficie lg:block">
        <div className="sticky top-0 h-[100dvh] overflow-y-auto">
          <div className="bg-azul px-5 py-4">
            <img src="./brand/wordmark-white.png" alt="Hebraica" className="h-6" />
            <p className="mt-1 text-xs text-white/70">Panel de administración</p>
          </div>
          <nav className="p-3">
            {grupos.map((g) => (
              <div key={g} className="mb-3">
                {g && <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{g}</p>}
                {secciones.filter((s) => s.grupo === g).map(({ a, texto, icono: I }) => (
                  <NavLink key={a} to={a} end className={({ isActive }) => clsx('flex items-center gap-3 rounded-lg px-3 py-2 text-sm', isActive ? 'bg-azul-50 font-medium text-azul' : 'text-slate-600 hover:bg-slate-50')}>
                    <I className="h-4 w-4" />{texto}
                  </NavLink>
                ))}
              </div>
            ))}
            {!soloSeguridad && <Link to="/" className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"><Smartphone className="h-4 w-4" />Ver app de socio</Link>}
            <button onClick={salir} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"><LogOut className="h-4 w-4" />Cerrar sesión</button>
          </nav>
        </div>
      </aside>
      <div className="mx-auto w-full max-w-4xl flex-1">
        <header className="sticky top-0 z-20 flex min-h-[52px] items-center gap-2 border-b border-slate-200 bg-fondo/90 px-2 pt-[env(safe-area-inset-top)] backdrop-blur">
          {pathname !== '/admin' && (
            <Link to="/admin" aria-label="Volver" className="grid h-10 w-10 place-items-center rounded-full text-azul active:bg-azul-50 lg:hidden">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          )}
          <h1 className="flex-1 truncate px-2 font-display text-lg font-extrabold text-tinta">{actual?.texto ?? 'Administración'}</h1>
          {!soloSeguridad && (
            <Link to="/" className="flex items-center gap-1.5 rounded-full bg-azul-50 px-3 py-2 text-sm font-semibold text-azul lg:hidden">
              <Smartphone className="h-4 w-4" /> App socio
            </Link>
          )}
          <button onClick={salir} aria-label="Cerrar sesión" className="grid h-10 w-10 place-items-center rounded-full text-red-600 active:bg-red-50 lg:hidden">
            <LogOut className="h-5 w-5" />
          </button>
        </header>
        <main className="px-4 py-4 pb-[calc(2rem+env(safe-area-inset-bottom))]">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
