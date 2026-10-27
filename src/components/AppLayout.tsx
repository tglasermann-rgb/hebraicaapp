import clsx from 'clsx'
import { CalendarDays, Home, LayoutGrid, QrCode, Wallet } from 'lucide-react'
import { useEffect } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

const TABS = [
  { a: '/', icono: Home, texto: 'Inicio' },
  { a: '/agenda', icono: CalendarDays, texto: 'Agenda' },
  { a: '/carnet', icono: QrCode, texto: 'Carnet', central: true },
  { a: '/cuenta', icono: Wallet, texto: 'Cuenta' },
  { a: '/mas', icono: LayoutGrid, texto: 'Más' },
]

export default function AppLayout() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return (
    <div className="mx-auto min-h-[100dvh] max-w-lg bg-fondo">
      <main key={pathname} className="pb-[calc(110px+env(safe-area-inset-bottom))]">
        <Outlet />
      </main>

      {/* Barra de navegación flotante */}
      <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40 mx-auto max-w-lg px-4 pb-[calc(env(safe-area-inset-bottom)+12px)]">
        <div className="pointer-events-auto grid h-[68px] grid-cols-5 items-center rounded-[28px] border border-linea/10 bg-superficie/85 px-1 shadow-flota backdrop-blur-2xl">
          {TABS.map(({ a, icono: Icono, texto, central }) => (
            <NavLink key={a} to={a} end={a === '/'} className="flex flex-col items-center justify-center">
              {({ isActive }) =>
                central ? (
                  <span className={clsx('grid h-[52px] w-[52px] place-items-center rounded-[18px] text-white transition', isActive ? 'bg-llama' : 'bg-azul')}>
                    <Icono className="h-6 w-6" strokeWidth={2.2} />
                  </span>
                ) : (
                  <span className={clsx('flex flex-col items-center gap-1 text-[10.5px] font-semibold transition', isActive ? 'text-azul' : 'text-slate-400')}>
                    <span className={clsx('grid h-8 w-12 place-items-center rounded-full transition', isActive && 'bg-azul-50')}>
                      <Icono className="h-[22px] w-[22px]" strokeWidth={isActive ? 2.4 : 2} />
                    </span>
                    {texto}
                  </span>
                )
              }
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
