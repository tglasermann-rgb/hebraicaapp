import type { ResultadoValidacion, Socio, Tabla, Tablas } from './types'

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
  /** Inicia sesión con número de acción + cédula + contraseña. */
  entrar(accion: string, cedula: string, clave: string): Promise<void>
  /** Envía un código de 6 dígitos al correo registrado del socio. Devuelve el correo enmascarado. */
  solicitarCodigo(accion: string, cedula: string): Promise<string>
  /** Verifica el código y deja la sesión iniciada. */
  verificarCodigo(accion: string, cedula: string, codigo: string): Promise<void>
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
  reservar(instalacionId: string, fecha: string, hora: string, socioId: string): Promise<void>
  inscribir(actividadId: string, socioId: string): Promise<void>
  comprarEntradas(eventoId: string, asistentes: string[]): Promise<void>
  revisarPago(pagoId: string, aprobado: boolean, nota: string): Promise<void>
  paseInvitado(codigo: string): Promise<{ nombre: string; fecha: string; anfitrion: string; estado: string } | null>
  subirArchivo(bucket: 'comprobantes' | 'publico', archivo: File): Promise<string>
  urlArchivo(bucket: 'comprobantes' | 'publico', ruta: string): Promise<string>
}
