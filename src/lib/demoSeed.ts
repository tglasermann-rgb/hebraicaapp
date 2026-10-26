import { addDays, format, subDays } from 'date-fns'
import type { Tablas } from './types'

/** Datos de ejemplo para el modo demo. Todos los nombres y montos son ficticios. */
export type DB = { [K in keyof Tablas]: Tablas[K][] } & { claves: Record<string, string> }

const d = (n: number) => format(addDays(new Date(), n), 'yyyy-MM-dd')
const dt = (n: number, h: string) => `${d(n)}T${h}:00-04:00`
const ahora = new Date().toISOString()
const base = { created_at: ahora }

export function semilla(): DB {
  const socios: Tablas['socios'][] = [
    { ...base, id: 's1', user_id: 'u1', accion: '1234', cedula: '12345678', nombre: 'David', apellido: 'Cohen', email: 'david@ejemplo.com', telefono: '0414-1234567', parentesco: 'titular', fecha_nacimiento: '1982-05-10', foto_url: null, estado: 'activo', rol: 'socio' },
    { ...base, id: 's2', user_id: null, accion: '1234', cedula: '12345679', nombre: 'Sara', apellido: 'Cohen', email: 'sara@ejemplo.com', telefono: '0414-7654321', parentesco: 'conyuge', fecha_nacimiento: '1984-08-22', foto_url: null, estado: 'activo', rol: 'socio' },
    { ...base, id: 's3', user_id: null, accion: '1234', cedula: '30123456', nombre: 'Daniel', apellido: 'Cohen', email: null, telefono: null, parentesco: 'hijo', fecha_nacimiento: '2012-02-14', foto_url: null, estado: 'activo', rol: 'socio' },
    { ...base, id: 's4', user_id: null, accion: '1234', cedula: '32123456', nombre: 'Ana', apellido: 'Cohen', email: null, telefono: null, parentesco: 'hijo', fecha_nacimiento: '2016-11-03', foto_url: null, estado: 'activo', rol: 'socio' },
    { ...base, id: 's5', user_id: 'u2', accion: '0001', cedula: '11111111', nombre: 'Raquel', apellido: 'Levy', email: 'admin@ejemplo.com', telefono: null, parentesco: 'titular', fecha_nacimiento: null, foto_url: null, estado: 'activo', rol: 'admin' },
    { ...base, id: 's6', user_id: 'u3', accion: 'E-001', cedula: '22222222', nombre: 'José', apellido: 'Pérez', email: 'seguridad@ejemplo.com', telefono: null, parentesco: 'titular', fecha_nacimiento: null, foto_url: null, estado: 'activo', rol: 'seguridad' },
    { ...base, id: 's7', user_id: null, accion: '5678', cedula: '9876543', nombre: 'Moisés', apellido: 'Benzaquén', email: 'moises@ejemplo.com', telefono: null, parentesco: 'titular', fecha_nacimiento: null, foto_url: null, estado: 'activo', rol: 'socio' },
  ]

  const mes = (n: number) => format(subDays(new Date(), 30 * n), 'yyyy-MM-01')
  const cargos: Tablas['cargos'][] = [
    { ...base, id: 'c1', accion: '1234', concepto: 'Cuota de mantenimiento', monto_usd: 120, fecha: mes(2), vence: mes(2), tipo: 'cuota', estado: 'pagado' },
    { ...base, id: 'c2', accion: '1234', concepto: 'Cuota de mantenimiento', monto_usd: 120, fecha: mes(1), vence: mes(1), tipo: 'cuota', estado: 'pagado' },
    { ...base, id: 'c3', accion: '1234', concepto: 'Cuota de mantenimiento', monto_usd: 120, fecha: mes(0), vence: d(10), tipo: 'cuota', estado: 'pendiente' },
    { ...base, id: 'c4', accion: '1234', concepto: 'Academia de Tenis (Daniel)', monto_usd: 45, fecha: mes(0), vence: d(10), tipo: 'actividad', estado: 'pendiente' },
    { ...base, id: 'c5', accion: '5678', concepto: 'Cuota de mantenimiento', monto_usd: 120, fecha: mes(0), vence: d(10), tipo: 'cuota', estado: 'pendiente' },
  ]

  const pagos: Tablas['pagos'][] = [
    { ...base, id: 'p1', accion: '1234', socio_id: 's1', metodo: 'zelle', moneda: 'USD', monto: 120, tasa: null, monto_usd: 120, referencia: 'ZL-88213', fecha_pago: format(subDays(new Date(), 50), 'yyyy-MM-dd'), comprobante_url: null, cargo_ids: ['c1'], estado: 'aprobado', nota_admin: null },
    { ...base, id: 'p2', accion: '1234', socio_id: 's1', metodo: 'pago_movil', moneda: 'VES', monto: 4380, tasa: 36.5, monto_usd: 120, referencia: '004512', fecha_pago: format(subDays(new Date(), 20), 'yyyy-MM-dd'), comprobante_url: null, cargo_ids: ['c2'], estado: 'aprobado', nota_admin: null },
    { ...base, id: 'p3', accion: '5678', socio_id: 's7', metodo: 'transferencia_bs', moneda: 'VES', monto: 4400, tasa: 36.6, monto_usd: 120.22, referencia: '7781234', fecha_pago: d(-1), comprobante_url: null, cargo_ids: ['c5'], estado: 'pendiente', nota_admin: null },
  ]

  const tasas: Tablas['tasas'][] = [{ ...base, id: 't1', fecha: d(0), bs_por_usd: 36.62 }]

  const instalaciones: Tablas['instalaciones'][] = [
    { ...base, id: 'i1', nombre: 'Cancha de Tenis 1', tipo: 'Tenis', descripcion: 'Arcilla. Traer raqueta y pelotas.', imagen_url: null, hora_apertura: '06:00', hora_cierre: '21:00', duracion_min: 60, max_reservas_dia: 1, activo: true },
    { ...base, id: 'i2', nombre: 'Cancha de Tenis 2', tipo: 'Tenis', descripcion: 'Arcilla. Iluminación nocturna.', imagen_url: null, hora_apertura: '06:00', hora_cierre: '21:00', duracion_min: 60, max_reservas_dia: 1, activo: true },
    { ...base, id: 'i3', nombre: 'Cancha de Pádel', tipo: 'Pádel', descripcion: 'Cancha techada.', imagen_url: null, hora_apertura: '07:00', hora_cierre: '22:00', duracion_min: 90, max_reservas_dia: 1, activo: true },
    { ...base, id: 'i4', nombre: 'Cancha de Fútbol', tipo: 'Fútbol', descripcion: 'Grama artificial, fútbol 7.', imagen_url: null, hora_apertura: '08:00', hora_cierre: '20:00', duracion_min: 60, max_reservas_dia: 1, activo: true },
    { ...base, id: 'i5', nombre: 'Parrillera A', tipo: 'Parrillera', descripcion: 'Capacidad 25 personas. Reserva por bloque.', imagen_url: null, hora_apertura: '11:00', hora_cierre: '19:00', duracion_min: 240, max_reservas_dia: 1, activo: true },
    { ...base, id: 'i6', nombre: 'Salón de Fiestas', tipo: 'Salón', descripcion: 'Capacidad 80 personas.', imagen_url: null, hora_apertura: '10:00', hora_cierre: '22:00', duracion_min: 240, max_reservas_dia: 1, activo: true },
  ]

  const actividades: Tablas['actividades'][] = [
    { ...base, id: 'a1', departamento: 'deportes', nombre: 'Academia de Tenis', descripcion: 'Clases grupales por nivel para niños y jóvenes.', horario: 'Mar y Jue 4:00 – 5:30 pm', instructor: 'Prof. Andrés', edad_min: 6, edad_max: 17, cupo: 20, precio_usd: 45, imagen_url: null, inscripciones_abiertas: true, programa: null },
    { ...base, id: 'a2', departamento: 'deportes', nombre: 'Natación infantil', descripcion: 'Aprende a nadar con instructores certificados.', horario: 'Lun, Mié y Vie 3:30 – 4:30 pm', instructor: 'Prof. Carla', edad_min: 4, edad_max: 12, cupo: 15, precio_usd: 50, imagen_url: null, inscripciones_abiertas: true, programa: null },
    { ...base, id: 'a3', departamento: 'gimnasio', nombre: 'Spinning', descripcion: 'Clase de alta intensidad en el Gimnasio Galsky.', horario: 'Lun a Vie 6:30 am', instructor: null, edad_min: 16, edad_max: null, cupo: 25, precio_usd: 0, imagen_url: null, inscripciones_abiertas: true, programa: null },
    { ...base, id: 'a4', departamento: 'bailes', nombre: 'Rikudim (bailes israelíes)', descripcion: 'Grupo de baile para jóvenes y adultos.', horario: 'Miércoles 7:00 pm', instructor: null, edad_min: 12, edad_max: null, cupo: null, precio_usd: 20, imagen_url: null, inscripciones_abiertas: true, programa: null },
    { ...base, id: 'a5', departamento: 'brief_kohn', nombre: 'Taller de pintura', descripcion: 'Centro Creativo Brief Kohn. Materiales incluidos.', horario: 'Sábados 10:00 am', instructor: null, edad_min: 7, edad_max: 14, cupo: 12, precio_usd: 30, imagen_url: null, inscripciones_abiertas: true, programa: null },
    { ...base, id: 'a6', departamento: 'macabilandia', nombre: 'Macabilandia – Semana 1', descripcion: 'Plan vacacional con deportes, juegos, piscina y actividades judías.', horario: 'Lun a Vie 8:00 am – 3:00 pm', instructor: null, edad_min: 4, edad_max: 12, cupo: 120, precio_usd: 90, imagen_url: null, inscripciones_abiertas: true, programa: 'macabilandia' },
    { ...base, id: 'a7', departamento: 'macabilandia', nombre: 'Macabilandia – Semana 2', descripcion: 'Plan vacacional con deportes, juegos, piscina y actividades judías.', horario: 'Lun a Vie 8:00 am – 3:00 pm', instructor: null, edad_min: 4, edad_max: 12, cupo: 120, precio_usd: 90, imagen_url: null, inscripciones_abiertas: true, programa: 'macabilandia' },
  ]

  const inscripciones: Tablas['inscripciones'][] = [
    { ...base, id: 'ins1', actividad_id: 'a1', socio_id: 's3', accion: '1234', estado: 'activa' },
  ]

  const eventos: Tablas['eventos'][] = [
    { ...base, id: 'e1', titulo: 'Concierto Kineret', descripcion: 'Una noche de música israelí en vivo en el Anfiteatro. Entradas limitadas.', fecha_inicio: dt(12, '19:30'), fecha_fin: dt(12, '22:30'), lugar: 'Anfiteatro', imagen_url: null, departamento: 'cultura', destacado: true, venta_entradas: true, precio_usd: 15, aforo: 400, max_por_accion: 8 },
    { ...base, id: 'e2', titulo: 'Kabalat Shabat comunitario', descripcion: 'Recibimos el Shabat juntos con canciones y una cena ligera.', fecha_inicio: dt(4, '18:00'), fecha_fin: null, lugar: 'Salón Principal', imagen_url: null, departamento: 'juventud', destacado: false, venta_entradas: false, precio_usd: 0, aforo: null, max_por_accion: null },
    { ...base, id: 'e3', titulo: 'Torneo interno de Pádel', descripcion: 'Inscripción por parejas en la Coordinación de Deportes.', fecha_inicio: dt(9, '08:00'), fecha_fin: dt(9, '18:00'), lugar: 'Canchas de Pádel', imagen_url: null, departamento: 'deportes', destacado: false, venta_entradas: false, precio_usd: 0, aforo: null, max_por_accion: null },
    { ...base, id: 'e4', titulo: 'Noche de cine familiar', descripcion: 'Película al aire libre junto a la piscina. Trae tu manta.', fecha_inicio: dt(18, '19:00'), fecha_fin: null, lugar: 'Área de Piscina', imagen_url: null, departamento: 'espacio', destacado: false, venta_entradas: true, precio_usd: 0, aforo: 150, max_por_accion: 6 },
  ]

  const noticias: Tablas['noticias'][] = [
    { ...base, id: 'n1', titulo: '¡Bienvenidos a Mi Hebraica!', resumen: 'Ya puedes llevar tu carnet en el teléfono, pagar tus cuotas y reservar canchas desde el app.', contenido: 'A partir de hoy todos los socios pueden usar Mi Hebraica para:\n\n• Entrar al club con el carnet digital\n• Consultar el estado de cuenta y reportar pagos\n• Reservar canchas, parrilleras y salones\n• Inscribirse en actividades y comprar entradas\n\nSi tienes dudas, escríbenos a info@hebraica.org.', imagen_url: null, departamento: 'comunicaciones', destacado: true, publicado_en: ahora },
    { ...base, id: 'n2', titulo: 'Abiertas las inscripciones de Macabilandia', resumen: 'Inscribe a tus hijos en el plan vacacional directamente desde el app.', contenido: 'Las inscripciones para Macabilandia ya están abiertas. Cupos limitados por semana.', imagen_url: null, departamento: 'macabilandia', destacado: false, publicado_en: subDays(new Date(), 2).toISOString() },
    { ...base, id: 'n3', titulo: 'Mantenimiento de la piscina', resumen: 'La piscina olímpica estará cerrada el próximo lunes por mantenimiento.', contenido: 'La piscina olímpica permanecerá cerrada el lunes por labores de mantenimiento preventivo. La piscina de niños funcionará en horario normal.', imagen_url: null, departamento: 'deportes', destacado: false, publicado_en: subDays(new Date(), 5).toISOString() },
  ]

  const albumes: Tablas['albumes'][] = [
    { ...base, id: 'al1', titulo: 'Jánuca en Hebraica', fecha: d(-40), portada_url: null },
    { ...base, id: 'al2', titulo: 'Macabiada interna', fecha: d(-90), portada_url: null },
  ]

  const directorio: Tablas['directorio'][] = [
    ['Atención al Público', 'Planta baja, edificio administrativo'],
    ['Admisión', 'Edificio administrativo'],
    ['Administración y Cobranzas', 'Edificio administrativo'],
    ['Comunicaciones', 'Edificio administrativo'],
    ['Deportes', 'Coordinación de Deportes'],
    ['Juventud y Educación', ''],
    ['Cultura', ''],
    ['Bienestar', ''],
    ['Seguridad', 'Entrada principal'],
  ].map(([dep, ub], i) => ({ ...base, id: `dir${i}`, departamento: dep, responsable: null, telefono: '(0212) 000-0000', whatsapp: null, email: 'info@hebraica.org', ubicacion: ub || null, horario: 'Lun a Vie 8:00 am – 5:00 pm', orden: i }))

  const restaurantes: Tablas['restaurantes'][] = [
    { ...base, id: 'r1', nombre: 'Restaurante (ejemplo)', descripcion: 'Edita este registro desde el panel de administración con el nombre real del restaurante.', horario: 'Mar a Dom 12:00 m – 10:00 pm', telefono: null, ubicacion: 'Área social', imagen_url: null, orden: 0 },
    { ...base, id: 'r2', nombre: 'Cafetería de la piscina (ejemplo)', descripcion: 'Snacks, jugos y café.', horario: 'Todos los días 8:00 am – 6:00 pm', telefono: null, ubicacion: 'Piscina', imagen_url: null, orden: 1 },
  ]

  const solicitudes: Tablas['solicitudes'][] = [
    { ...base, id: 'so1', socio_id: 's1', accion: '1234', categoria: 'mantenimiento', asunto: 'Luz dañada en cancha de tenis 2', descripcion: 'Una de las lámparas no enciende en la noche.', estado: 'en_proceso', respuesta: 'Gracias por avisar. Mantenimiento ya está trabajando en ello.', updated_at: ahora },
  ]

  const notificaciones: Tablas['notificaciones'][] = [
    { ...base, id: 'no1', titulo: 'Bienvenido a Mi Hebraica', cuerpo: 'Explora tu carnet digital, tu estado de cuenta y la agenda del club.', destino: 'todos', accion: null, socio_id: null, enlace: '/' },
    { ...base, id: 'no2', titulo: 'Cuota del mes disponible', cuerpo: 'Ya puedes ver y pagar la cuota de mantenimiento de este mes.', destino: 'accion', accion: '1234', socio_id: null, enlace: '/cuenta' },
  ]

  const configuracion: Tablas['configuracion'][] = [
    {
      id: 'datos_bancarios',
      valor: {
        pago_movil: { banco: 'Banco (completar)', telefono: '0414-0000000', rif: 'J-00000000-0' },
        transferencia_bs: { banco: 'Banco (completar)', cuenta: '0000-0000-00-0000000000', titular: 'Hebraica', rif: 'J-00000000-0' },
        zelle: { email: 'pagos@ejemplo.com', titular: 'Hebraica' },
        transferencia_usd: { banco: 'Banco (completar)', cuenta: '000000000', titular: 'Hebraica' },
        nota: 'Los pagos en bolívares se calculan a la tasa oficial del BCV del día del pago.',
      },
    },
  ]

  return {
    socios, cargos, pagos, tasas, instalaciones, reservas: [], actividades, inscripciones, eventos, entradas: [],
    noticias, albumes, fotos: [], directorio, restaurantes, solicitudes, invitados: [], notificaciones, accesos: [], configuracion,
    claves: { u1: 'demo1234', u2: 'admin1234', u3: 'seguridad1234' },
  }
}
