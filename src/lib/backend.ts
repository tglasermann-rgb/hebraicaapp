import type { Estadisticas, Registro, ResultadoValidacion, Socio, Tabla, Tablas } from './types'

export interface DatosRegistro {
  nombre: string
  apellido: string
  cedula: string
  usuario: string
  email: string
  clave: string
}

/** Normaliza el usuario: minúsculas, sin espacios. */
export const limpiarUsuario = (u: string) => u.trim().toLowerCase()
export const USUARIO_VALIDO = /^[a-z0-9._-]{3,30}$/

export interface Filtro<T> {
  eq?: Partial<Record<keyof T & string, string | number | boolean | null>>
  in?: Partial<Record<keyof T & string, (string | number)[]>>
  gte?: Partial<Record<keyof T & string, string | number>>
  lte?: Partial<Record<keyof T & string, string | number>>
  orden?: { campo: keyof T & string; asc?: boolean }
  limite?: number
}

export interface Sesion {
  userId: string
  email: string
}

/**
 * Todo el acceso a datos pasa por esta interfaz. Hay dos implementaciones:
 * - supabaseBackend: producción (Postgres + RLS + funciones RPC en supabase/migrations)
 * - demoBackend: sin servidor, guarda datos de ejemplo en el navegador.
 */
export interface Backend {
  modo: 'supabase' | 'demo'

  // ---- Autenticación ----
  sesionActual(): Promise<Sesion | null>
  alCambiarSesion(cb: (s: Sesion | null) => void): () => void
  /** Inicia sesión con usuario y contraseña. */
  entrar(usuario: string, clave: string): Promise<void>
  /** Primera vez: crea el usuario y envía la solicitud de acceso para que Administración la apruebe. */
  registrar(datos: DatosRegistro): Promise<void>
  /** Solicitud de acceso del usuario autenticado (si aún no está aprobado). */
  miRegistro(): Promise<Registro | null>
  /** Corrige y reenvía una solicitud rechazada. */
  reenviarRegistro(datos: Omit<DatosRegistro, 'usuario' | 'clave'>): Promise<void>
  /** Olvidé mi contraseña: envía un enlace al correo del socio. En demo devuelve el enlace para probarlo. */
  recuperarClave(usuario: string): Promise<string | null>
  /** Abre la sesión con el enlace de recuperación (luego se llama cambiarClave). */
  verificarRecuperacion(tokenHash: string): Promise<void>
  cambiarClave(nueva: string): Promise<void>
  salir(): Promise<void>
  /** Socio vinculado al usuario autenticado. */
  miSocio(): Promise<Socio | null>

  // ---- CRUD genérico (en Supabase lo restringe RLS) ----
  listar<T extends Tabla>(tabla: T, filtro?: Filtro<Tablas[T]>): Promise<Tablas[T][]>
  obtener<T extends Tabla>(tabla: T, id: string): Promise<Tablas[T] | null>
  crear<T extends Tabla>(tabla: T, datos: Partial<Tablas[T]>): Promise<Tablas[T]>
  actualizar<T extends Tabla>(tabla: T, id: string, datos: Partial<Tablas[T]>): Promise<Tablas[T]>
  eliminar(tabla: Tabla, id: string): Promise<void>
  crearVarios<T extends Tabla>(tabla: T, filas: Partial<Tablas[T]>[]): Promise<number>

  // ---- Operaciones con reglas de negocio (RPC en Supabase) ----
  emitirTokenCarnet(socioId: string): Promise<{ token: string; expira: string }>
  validarCodigo(codigo: string): Promise<ResultadoValidacion>
  horariosOcupados(instalacionId: string, fecha: string): Promise<string[]>
  reservar(instalacionId: string, fecha: string, hora: string, socioId: string, jugadores?: string[]): Promise<void>
  /** Cancela respetando el límite de horas de la instalación. */
  cancelarReserva(reservaId: string): Promise<void>
  /** Devuelve el id del cargo a pagar; la inscripción se confirma al aprobarse ese pago (null si no tiene costo). */
  inscribir(actividadId: string, socioId: string): Promise<string | null>
  cancelarInscripcion(inscripcionId: string): Promise<void>
  comprarEntradas(eventoId: string, asistentes: string[]): Promise<void>
  revisarPago(pagoId: string, aprobado: boolean, nota: string): Promise<void>
  aprobarRegistro(registroId: string, accion: string, parentesco: string): Promise<void>
  rechazarRegistro(registroId: string, motivo: string): Promise<void>
  /** Administración: genera una contraseña temporal para un socio. */
  restablecerClaveAdmin(socioId: string): Promise<string>
  ocupacionClases(desde: string, hasta: string): Promise<{ clase_id: string; confirmados: number; en_espera: number }[]>
  reservarClase(claseId: string, socioId: string): Promise<'confirmada' | 'espera'>
  cancelarReservaClase(reservaId: string): Promise<void>
  votar(encuestaId: string, opcion: number, comentario: string): Promise<void>
  resultadosEncuesta(encuestaId: string): Promise<{ opcion: number; votos: number }[]>
  estadisticas(): Promise<Estadisticas>
  paseInvitado(codigo: string): Promise<{ nombre: string; fecha: string; anfitrion: string; estado: string } | null>
  subirArchivo(bucket: 'comprobantes' | 'publico', archivo: File): Promise<string>
  urlArchivo(bucket: 'comprobantes' | 'publico', ruta: string): Promise<string>
}
