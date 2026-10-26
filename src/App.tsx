import { Fingerprint } from 'lucide-react'
import { Suspense, lazy, useEffect, useState, type ReactNode } from 'react'
import { HashRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import AppLayout from './components/AppLayout'
import { AvisoProvider, Boton, Cargando } from './components/ui'
import { biometriaActiva, verificarBiometria } from './lib/biometria'
import type { Rol } from './lib/types'
import Activar from './pages/Activar'
import Actividades, { DetalleActividad, Macabilandia } from './pages/Actividades'
import Agenda from './pages/Agenda'
import Carnet from './pages/Carnet'
import { Album, Directorio, Galeria, Noticia, Noticias, Restaurantes } from './pages/Contenido'
import Cuenta from './pages/Cuenta'
import Entradas from './pages/Entradas'
import Entrar, { MarcoAcceso } from './pages/Entrar'
import Evento from './pages/Evento'
import Familia from './pages/Familia'
import Inicio from './pages/Inicio'
import Invitados from './pages/Invitados'
import { Ayuda, Privacidad, Terminos } from './pages/Legal'
import Mas from './pages/Mas'
import Notificaciones from './pages/Notificaciones'
import PaseInvitado from './pages/PaseInvitado'
import Perfil from './pages/Perfil'
import ReportarPago from './pages/ReportarPago'
import Reservas, { Reservar } from './pages/Reservas'
import Solicitudes from './pages/Solicitudes'

// El panel de administración se carga aparte: los socios no descargan ese código.
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'))
const Escaner = lazy(() => import('./pages/admin/Escaner'))
const Reportes = lazy(() => import('./pages/admin/Reportes'))
const Resumen = lazy(() => import('./pages/admin/Resumen'))
const pagina = (nombre: string) => lazy(() => import('./pages/admin/Paginas').then((m) => ({ default: (m as any)[nombre] })))
const A = Object.fromEntries(
  ['AdminSocios', 'AdminPagos', 'AdminCargos', 'AdminTasas', 'AdminInstalaciones', 'AdminReservas', 'AdminActividades', 'AdminEventos', 'AdminNoticias', 'AdminGaleria', 'AdminNotificaciones', 'AdminSolicitudes', 'AdminDirectorio', 'AdminRestaurantes', 'AdminConfiguracion', 'AdminAccesos'].map((n) => [n, pagina(n)]),
)

function Pantalla({ children }: { children: ReactNode }) {
  return <div className="grid min-h-[100dvh] place-items-center bg-azul"><div className="text-center text-white">{children}</div></div>
}

/** Pide Face ID / huella al abrir el app si el socio lo activó. */
function Bloqueo({ children }: { children: ReactNode }) {
  const [bloqueado, setBloqueado] = useState(biometriaActiva())
  const intentar = () => verificarBiometria().then((ok) => ok && setBloqueado(false))
  useEffect(() => {
    if (bloqueado) intentar()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  if (!bloqueado) return <>{children}</>
  return (
    <Pantalla>
      <img src="./brand/logo-white.png" alt="Hebraica" className="mx-auto h-32" />
      <Boton variante="secundario" className="mt-10" onClick={intentar}><Fingerprint className="h-5 w-5" /> Desbloquear</Boton>
    </Pantalla>
  )
}

function Protegida() {
  const { cargando, sesion, socio, salir } = useAuth()
  const loc = useLocation()
  if (cargando) return <Pantalla><img src="./brand/logo-white.png" alt="Hebraica" className="mx-auto h-32 animate-pulse" /></Pantalla>
  if (!sesion) return <Navigate to="/entrar" replace state={{ desde: loc.pathname }} />
  if (!socio)
    return (
      <MarcoAcceso>
        <h1 className="font-display text-xl font-bold text-marino">Cuenta no vinculada</h1>
        <p className="mt-2 text-slate-600">Tu correo no está asociado a ningún socio activo. Comunícate con Atención al Público para actualizar tus datos.</p>
        <Boton bloque className="mt-6" onClick={salir}>Salir</Boton>
      </MarcoAcceso>
    )
  return (
    <Bloqueo>
      <Outlet />
    </Bloqueo>
  )
}

function SoloStaff({ roles = [] }: { roles?: Rol[] }) {
  const { esStaff, tieneRol } = useAuth()
  if (!esStaff || (roles.length > 0 && !tieneRol(...roles))) return <Navigate to="/" replace />
  return (
    <Suspense fallback={<Cargando />}>
      <Outlet />
    </Suspense>
  )
}

function Publica({ children }: { children: ReactNode }) {
  const { sesion, cargando } = useAuth()
  if (cargando) return null
  return sesion ? <Navigate to="/" replace /> : <>{children}</>
}

export default function App() {
  return (
    <AuthProvider>
      <AvisoProvider>
        <HashRouter>
          <Routes>
            <Route path="/entrar" element={<Publica><Entrar /></Publica>} />
            <Route path="/activar" element={<Activar />} />
            <Route path="/pase/:codigo" element={<PaseInvitado />} />
            <Route path="/privacidad" element={<div className="mx-auto max-w-lg"><Privacidad /></div>} />
            <Route path="/terminos" element={<div className="mx-auto max-w-lg"><Terminos /></div>} />

            <Route element={<Protegida />}>
              <Route element={<AppLayout />}>
                <Route index element={<Inicio />} />
                <Route path="carnet" element={<Carnet />} />
                <Route path="agenda" element={<Agenda />} />
                <Route path="eventos/:id" element={<Evento />} />
                <Route path="entradas" element={<Entradas />} />
                <Route path="cuenta" element={<Cuenta />} />
                <Route path="cuenta/reportar" element={<ReportarPago />} />
                <Route path="reservas" element={<Reservas />} />
                <Route path="reservas/:id" element={<Reservar />} />
                <Route path="actividades" element={<Actividades />} />
                <Route path="actividades/:id" element={<DetalleActividad />} />
                <Route path="macabilandia" element={<Macabilandia />} />
                <Route path="familia" element={<Familia />} />
                <Route path="invitados" element={<Invitados />} />
                <Route path="noticias" element={<Noticias />} />
                <Route path="noticias/:id" element={<Noticia />} />
                <Route path="galeria" element={<Galeria />} />
                <Route path="galeria/:id" element={<Album />} />
                <Route path="directorio" element={<Directorio />} />
                <Route path="restaurantes" element={<Restaurantes />} />
                <Route path="solicitudes" element={<Solicitudes />} />
                <Route path="notificaciones" element={<Notificaciones />} />
                <Route path="mas" element={<Mas />} />
                <Route path="perfil" element={<Perfil />} />
                <Route path="ayuda" element={<Ayuda />} />
              </Route>

              <Route path="admin" element={<SoloStaff />}>
                <Route element={<AdminLayout />}>
                  <Route index element={<Resumen />} />
                  <Route element={<SoloStaff roles={['seguridad', 'eventos']} />}>
                    <Route path="escaner" element={<Escaner />} />
                  </Route>
                  <Route element={<SoloStaff roles={['seguridad']} />}>
                    <Route path="accesos" element={<A.AdminAccesos />} />
                  </Route>
                  <Route element={<SoloStaff roles={['administracion']} />}>
                    <Route path="socios" element={<A.AdminSocios />} />
                    <Route path="pagos" element={<A.AdminPagos />} />
                    <Route path="cargos" element={<A.AdminCargos />} />
                    <Route path="tasas" element={<A.AdminTasas />} />
                    <Route path="reportes" element={<Reportes />} />
                  </Route>
                  <Route element={<SoloStaff roles={['deportes']} />}>
                    <Route path="instalaciones" element={<A.AdminInstalaciones />} />
                  </Route>
                  <Route element={<SoloStaff roles={['deportes', 'seguridad']} />}>
                    <Route path="reservas" element={<A.AdminReservas />} />
                  </Route>
                  <Route element={<SoloStaff roles={['deportes', 'eventos']} />}>
                    <Route path="actividades" element={<A.AdminActividades />} />
                  </Route>
                  <Route element={<SoloStaff roles={['eventos']} />}>
                    <Route path="eventos" element={<A.AdminEventos />} />
                    <Route path="galeria" element={<A.AdminGaleria />} />
                  </Route>
                  <Route element={<SoloStaff roles={['eventos', 'deportes', 'administracion']} />}>
                    <Route path="noticias" element={<A.AdminNoticias />} />
                  </Route>
                  <Route path="notificaciones" element={<A.AdminNotificaciones />} />
                  <Route path="solicitudes" element={<A.AdminSolicitudes />} />
                  <Route element={<SoloStaff roles={['admin']} />}>
                    <Route path="directorio" element={<A.AdminDirectorio />} />
                    <Route path="restaurantes" element={<A.AdminRestaurantes />} />
                    <Route path="configuracion" element={<A.AdminConfiguracion />} />
                  </Route>
                </Route>
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </AvisoProvider>
    </AuthProvider>
  )
}
