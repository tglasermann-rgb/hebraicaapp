// Modelo de datos. Los nombres coinciden con las tablas de supabase/migrations.

export type Rol = 'socio' | 'admin' | 'administracion' | 'deportes' | 'eventos' | 'seguridad'

export const ROLES_STAFF: Rol[] = ['admin', 'administracion', 'deportes', 'eventos', 'seguridad']

export const NOMBRE_ROL: Record<Rol, string> = {
  socio: 'Socio',
  admin: 'Administrador general',
  administracion: 'Administración',
  deportes: 'Deportes',
  eventos: 'Eventos',
  seguridad: 'Seguridad',
}

export type Parentesco = 'titular' | 'conyuge' | 'hijo' | 'otro'

export interface Socio {
  id: string
  user_id: string | null
  accion: string | null
  cedula: string
  nombre: string
  apellido: string
  usuario: string | null
  email: string | null
  telefono: string | null
  parentesco: Parentesco
  fecha_nacimiento: string | null
  foto_url: string | null
  estado: 'activo' | 'suspendido'
  rol: Rol
  created_at: string
}

export interface Registro {
  id: string
  user_id: string
  nombre: string
  apellido: string
  cedula: string
  usuario: string
  email: string | null
  estado: 'pendiente' | 'aprobado' | 'rechazado'
  motivo: string | null
  socio_id: string | null
  created_at: string
}

export interface Cargo {
  id: string
  accion: string
  concepto: string
  monto_usd: number
  fecha: string
  vence: string | null
  tipo: 'cuota' | 'actividad' | 'evento' | 'otro'
  estado: 'pendiente' | 'pagado'
  created_at: string
}

export type MetodoPago = 'pago_movil' | 'zelle' | 'transferencia_bs' | 'transferencia_usd' | 'paypal' | 'venmo' | 'pipol' | 'tarjeta' | 'efectivo'

export const NOMBRE_METODO: Record<MetodoPago, string> = {
  pago_movil: 'Pago Móvil',
  zelle: 'Zelle',
  transferencia_bs: 'Transferencia en Bs.',
  transferencia_usd: 'Transferencia en USD',
  paypal: 'PayPal',
  venmo: 'Venmo',
  pipol: 'Pipol Pay',
  tarjeta: 'Tarjeta (punto de venta)',
  efectivo: 'Efectivo en caja',
}

export interface Pago {
  id: string
  accion: string
  socio_id: string
  metodo: MetodoPago
  moneda: 'USD' | 'VES'
  monto: number
  tasa: number | null
  monto_usd: number
  referencia: string
  fecha_pago: string
  comprobante_url: string | null
  /** Cargos que cubre este pago */
  cargo_ids: string[]
  /** Lo que el app leyó del comprobante (referencia y monto) */
  lectura: LecturaComprobante | null
  estado: 'pendiente' | 'aprobado' | 'rechazado'
  nota_admin: string | null
  created_at: string
}

export interface Tasa {
  id: string
  fecha: string
  bs_por_usd: number
  created_at: string
}

export interface Instalacion {
  id: string
  nombre: string
  tipo: string
  descripcion: string | null
  imagen_url: string | null
  hora_apertura: string // "07:00"
  hora_cierre: string // "21:00"
  duracion_min: number
  max_reservas_dia: number
  /** Reservas futuras simultáneas por acción (pádel: 1) */
  max_reservas_activas: number | null
  /** Horas antes del inicio en que todavía se puede cancelar */
  cancelar_hasta_horas: number | null
  /** Mínimo de jugadores a registrar en la reserva */
  jugadores_min: number | null
  /** Horas sin poder reservar si no asiste sin cancelar */
  sancion_horas: number | null
  activo: boolean
  created_at: string
}

export interface Reserva {
  id: string
  instalacion_id: string
  socio_id: string
  accion: string
  fecha: string
  hora_inicio: string
  jugadores: string[]
  estado: 'confirmada' | 'cancelada' | 'no_asistio'
  created_at: string
}

export interface Actividad {
  id: string
  departamento: string
  nombre: string
  descripcion: string | null
  horario: string | null
  instructor: string | null
  edad_min: number | null
  edad_max: number | null
  cupo: number | null
  precio_usd: number
  /** Texto cuando no hay precio fijo: "Sin costo", "Costo en Atención al Público"… */
  nota_precio: string | null
  requisitos: string | null
  lugar: string | null
  imagen_url: string | null
  inscripciones_abiertas: boolean
  programa: string | null // p. ej. "macabilandia"
  created_at: string
}

export interface Inscripcion {
  id: string
  actividad_id: string
  socio_id: string
  accion: string
  /** pendiente_pago: aparta el cupo hasta que se apruebe el pago de su cargo */
  estado: 'activa' | 'pendiente_pago' | 'cancelada'
  cargo_id: string | null
  created_at: string
}

export interface Evento {
  id: string
  titulo: string
  descripcion: string | null
  fecha_inicio: string
  fecha_fin: string | null
  lugar: string | null
  imagen_url: string | null
  departamento: string | null
  destacado: boolean
  /** Evento de día completo (sin hora) */
  todo_el_dia: boolean
  venta_entradas: boolean
  precio_usd: number
  aforo: number | null
  max_por_accion: number | null
  created_at: string
}

export interface Entrada {
  id: string
  evento_id: string
  socio_id: string
  accion: string
  nombre_asistente: string
  codigo: string
  estado: 'activa' | 'usada' | 'anulada'
  created_at: string
}

export interface Noticia {
  id: string
  titulo: string
  resumen: string | null
  contenido: string | null
  imagen_url: string | null
  departamento: string | null
  destacado: boolean
  publicado_en: string
  created_at: string
}

export interface Album {
  id: string
  titulo: string
  fecha: string
  portada_url: string | null
  created_at: string
}

export interface Foto {
  id: string
  album_id: string
  url: string
  created_at: string
}

export interface Contacto {
  id: string
  departamento: string
  responsable: string | null
  telefono: string | null
  whatsapp: string | null
  email: string | null
  ubicacion: string | null
  horario: string | null
  orden: number
  created_at: string
}

export interface Restaurante {
  id: string
  nombre: string
  descripcion: string | null
  horario: string | null
  telefono: string | null
  ubicacion: string | null
  imagen_url: string | null
  orden: number
  created_at: string
}

export type CategoriaSolicitud = 'mantenimiento' | 'reclamo' | 'sugerencia' | 'tramite' | 'otro'

export const NOMBRE_CATEGORIA: Record<CategoriaSolicitud, string> = {
  mantenimiento: 'Mantenimiento',
  reclamo: 'Reclamo',
  sugerencia: 'Sugerencia',
  tramite: 'Trámite administrativo',
  otro: 'Otro',
}

export interface Solicitud {
  id: string
  socio_id: string
  accion: string
  categoria: CategoriaSolicitud
  asunto: string
  descripcion: string
  estado: 'abierta' | 'en_proceso' | 'resuelta' | 'cerrada'
  respuesta: string | null
  created_at: string
  updated_at: string
}

export interface Invitado {
  id: string
  socio_id: string
  accion: string
  nombre: string
  apellido: string | null
  /** V: cédula venezolana · E: cédula de extranjero · P: pasaporte */
  tipo_documento: 'V' | 'E' | 'P'
  cedula: string
  email: string | null
  tipo_invitado: string | null
  placa: string | null
  marca_vehiculo: string | null
  motivo: string | null
  acepto_terminos: boolean
  fecha: string
  codigo: string
  estado: 'activo' | 'usado' | 'anulado'
  created_at: string
}

export interface Notificacion {
  id: string
  titulo: string
  cuerpo: string
  destino: 'todos' | 'accion' | 'socio'
  accion: string | null
  socio_id: string | null
  enlace: string | null
  clave?: string | null
  created_at: string
}

export interface Acceso {
  id: string
  tipo: 'socio' | 'invitado' | 'entrada'
  referencia_id: string | null
  nombre: string | null
  resultado: 'permitido' | 'denegado'
  motivo: string | null
  created_at: string
}

export interface Configuracion {
  id: string // clave
  valor: unknown
}

export interface CuentaPago {
  metodo: MetodoPago
  titulo: string
  datos: { k: string; v: string }[]
  nota?: string
}

export interface DatosBancarios {
  cuentas: CuentaPago[]
  nota: string
}

export interface Norma {
  id: string
  titulo: string
  departamento: string
  contenido: string
  orden: number
  created_at: string
}

export interface ResultadoValidacion {
  valido: boolean
  tipo: 'socio' | 'invitado' | 'entrada' | 'desconocido'
  nombre?: string
  detalle?: string
  foto_url?: string | null
  mensaje: string
}

export interface LecturaComprobante {
  referencia: string | null
  monto: number | null
  coincide: boolean
}

export interface Clase {
  id: string
  nombre: string
  departamento: string
  instructor: string | null
  lugar: string | null
  inicio: string
  duracion_min: number
  cupo: number
  cancelada: boolean
  created_at: string
}

export interface ReservaClase {
  id: string
  clase_id: string
  socio_id: string
  accion: string
  estado: 'confirmada' | 'espera' | 'cancelada'
  created_at: string
}

export interface Encuesta {
  id: string
  titulo: string
  descripcion: string | null
  tipo: 'opciones' | 'calificacion'
  opciones: string[]
  evento_id: string | null
  abierta: boolean
  cierra: string | null
  created_at: string
}

export interface Voto {
  id: string
  encuesta_id: string
  socio_id: string
  opcion: number
  comentario: string | null
  created_at: string
}

export interface Auditoria {
  id: string
  tabla: string
  registro_id: string | null
  operacion: 'INSERT' | 'UPDATE' | 'DELETE'
  antes: Record<string, unknown> | null
  despues: Record<string, unknown> | null
  socio_id: string | null
  usuario: string | null
  created_at: string
}

export interface Estadisticas {
  socios: number
  socios_con_app: number
  acciones: number
  acciones_morosas: number
  monto_moroso: number
  monto_pendiente: number
  accesos_por_hora: { hora: number; total: number }[]
  accesos_por_dia: { dia: number; total: number }[]
  pagos_por_metodo: { metodo: MetodoPago; total: number; monto: number }[]
  reservas_por_instalacion: { nombre: string; total: number }[]
}

export interface Tablas {
  socios: Socio
  registros: Registro
  cargos: Cargo
  pagos: Pago
  tasas: Tasa
  instalaciones: Instalacion
  reservas: Reserva
  actividades: Actividad
  inscripciones: Inscripcion
  eventos: Evento
  entradas: Entrada
  noticias: Noticia
  albumes: Album
  fotos: Foto
  directorio: Contacto
  restaurantes: Restaurante
  solicitudes: Solicitud
  invitados: Invitado
  notificaciones: Notificacion
  accesos: Acceso
  configuracion: Configuracion
  clases: Clase
  reservas_clase: ReservaClase
  encuestas: Encuesta
  votos: Voto
  auditoria: Auditoria
  normas: Norma
}

export type Tabla = keyof Tablas
