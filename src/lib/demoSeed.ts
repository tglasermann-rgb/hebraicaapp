import { addDays, format, subDays } from 'date-fns'
import { ACTIVIDADES, DATOS_BANCARIOS, DIRECTORIO, EVENTOS, NORMAS, REGLAS_PADEL } from './datosHebraica'
import type { Tablas } from './types'

/** Datos de ejemplo para el modo demo. Todos los nombres y montos son ficticios. */
export type DB = { [K in keyof Tablas]: Tablas[K][] } & { claves: Record<string, string>; usuarios: Record<string, string> }

const d = (n: number) => format(addDays(new Date(), n), 'yyyy-MM-dd')
const dt = (n: number, h: string) => `${d(n)}T${h}:00-04:00`
const ahora = new Date().toISOString()
const base = { created_at: ahora }

/** Entradas de ejemplo de los últimos 30 días, para las estadísticas */
function accesosEjemplo(): Tablas['accesos'][] {
  const pesos = [0, 0, 0, 0, 0, 1, 4, 8, 6, 4, 3, 3, 4, 3, 3, 5, 8, 10, 9, 6, 3, 1, 0, 0]
  const lista: Tablas['accesos'][] = []
  let n = 0
  for (let d = 0; d < 30; d++)
    for (let h = 0; h < 24; h++)
      for (let k = 0; k < pesos[h] * (d % 7 === 5 || d % 7 === 6 ? 2 : 1); k++) {
        const f = subDays(new Date(), d)
        f.setHours(h, (k * 7) % 60, 0, 0)
        lista.push({ id: `ac${n++}`, tipo: 'socio', referencia_id: null, nombre: 'Socio', resultado: 'permitido', motivo: 'Acceso permitido', created_at: f.toISOString() })
      }
  return lista.reverse()
}

export function semilla(): DB {
  const socios: Tablas['socios'][] = [
    { ...base, id: 's1', user_id: 'u1', usuario: 'david', accion: '1234', cedula: '12345678', nombre: 'David', apellido: 'Cohen', email: 'david@ejemplo.com', telefono: '0414-1234567', parentesco: 'titular', fecha_nacimiento: '1982-05-10', foto_url: null, estado: 'activo', rol: 'socio' },
    { ...base, id: 's2', user_id: null, usuario: null, accion: '1234', cedula: '12345679', nombre: 'Sara', apellido: 'Cohen', email: 'sara@ejemplo.com', telefono: '0414-7654321', parentesco: 'conyuge', fecha_nacimiento: '1984-08-22', foto_url: null, estado: 'activo', rol: 'socio' },
    { ...base, id: 's3', user_id: null, usuario: null, accion: '1234', cedula: '30123456', nombre: 'Daniel', apellido: 'Cohen', email: null, telefono: null, parentesco: 'hijo', fecha_nacimiento: '2012-02-14', foto_url: null, estado: 'activo', rol: 'socio' },
    { ...base, id: 's4', user_id: null, usuario: null, accion: '1234', cedula: '32123456', nombre: 'Ana', apellido: 'Cohen', email: null, telefono: null, parentesco: 'hijo', fecha_nacimiento: '2016-11-03', foto_url: null, estado: 'activo', rol: 'socio' },
    { ...base, id: 's5', user_id: 'u2', usuario: 'admin', accion: '0001', cedula: '11111111', nombre: 'Raquel', apellido: 'Levy', email: 'admin@ejemplo.com', telefono: null, parentesco: 'titular', fecha_nacimiento: null, foto_url: null, estado: 'activo', rol: 'admin' },
    { ...base, id: 's6', user_id: 'u3', usuario: 'seguridad', accion: 'E-001', cedula: '22222222', nombre: 'José', apellido: 'Pérez', email: 'seguridad@ejemplo.com', telefono: null, parentesco: 'titular', fecha_nacimiento: null, foto_url: null, estado: 'activo', rol: 'seguridad' },
    { ...base, id: 's7', user_id: null, usuario: null, accion: '5678', cedula: '9876543', nombre: 'Moisés', apellido: 'Benzaquén', email: 'moises@ejemplo.com', telefono: null, parentesco: 'titular', fecha_nacimiento: null, foto_url: null, estado: 'activo', rol: 'socio' },
  ]

  const mes = (n: number) => format(subDays(new Date(), 30 * n), 'yyyy-MM-01')
  const cargos: Tablas['cargos'][] = [
    { ...base, id: 'c1', accion: '1234', concepto: 'Cuota de mantenimiento', monto_usd: 120, fecha: mes(2), vence: mes(2), tipo: 'cuota', estado: 'pagado' },
    { ...base, id: 'c2', accion: '1234', concepto: 'Cuota de mantenimiento', monto_usd: 120, fecha: mes(1), vence: mes(1), tipo: 'cuota', estado: 'pagado' },
    { ...base, id: 'c3', accion: '1234', concepto: 'Cuota de mantenimiento', monto_usd: 120, fecha: mes(0), vence: d(10), tipo: 'cuota', estado: 'pendiente' },
    { ...base, id: 'c4', accion: '1234', concepto: 'Academia de Tenis (Daniel)', monto_usd: 45, fecha: mes(0), vence: d(3), tipo: 'actividad', estado: 'pendiente' },
    { ...base, id: 'c5', accion: '5678', concepto: 'Cuota de mantenimiento', monto_usd: 120, fecha: mes(0), vence: d(10), tipo: 'cuota', estado: 'pendiente' },
  ]

  const pagos: Tablas['pagos'][] = [
    { ...base, id: 'p1', accion: '1234', socio_id: 's1', metodo: 'zelle', moneda: 'USD', monto: 120, tasa: null, monto_usd: 120, referencia: 'ZL-88213', fecha_pago: format(subDays(new Date(), 50), 'yyyy-MM-dd'), comprobante_url: null, lectura: null, cargo_ids: ['c1'], estado: 'aprobado', nota_admin: null },
    { ...base, id: 'p2', accion: '1234', socio_id: 's1', metodo: 'pago_movil', moneda: 'VES', monto: 4380, tasa: 36.5, monto_usd: 120, referencia: '004512', fecha_pago: format(subDays(new Date(), 20), 'yyyy-MM-dd'), comprobante_url: null, lectura: null, cargo_ids: ['c2'], estado: 'aprobado', nota_admin: null },
    { ...base, id: 'p3', accion: '5678', socio_id: 's7', metodo: 'transferencia_bs', moneda: 'VES', monto: 4400, tasa: 36.6, monto_usd: 120.22, referencia: '7781234', fecha_pago: d(-1), comprobante_url: null, lectura: null, cargo_ids: ['c5'], estado: 'pendiente', nota_admin: null },
  ]

  const tasas: Tablas['tasas'][] = [{ ...base, id: 't1', fecha: d(0), bs_por_usd: 36.62 }]

  const sinReglas = { max_reservas_activas: null, cancelar_hasta_horas: null, jugadores_min: null, sancion_horas: null }
  const instalaciones: Tablas['instalaciones'][] = [
    { ...base, ...sinReglas, id: 'i1', nombre: 'Cancha de Tenis 1', tipo: 'Tenis', descripcion: 'Arcilla. Traer raqueta y pelotas.', imagen_url: null, hora_apertura: '06:00', hora_cierre: '21:00', duracion_min: 60, max_reservas_dia: 1, activo: true },
    { ...base, ...sinReglas, id: 'i2', nombre: 'Cancha de Tenis 2', tipo: 'Tenis', descripcion: 'Arcilla. Iluminación nocturna.', imagen_url: null, hora_apertura: '06:00', hora_cierre: '21:00', duracion_min: 60, max_reservas_dia: 1, activo: true },
    { ...base, ...sinReglas, id: 'i3', nombre: 'Cancha de Pádel', tipo: 'Pádel', descripcion: null, imagen_url: null, hora_apertura: '07:00', hora_cierre: '22:00', duracion_min: 90, max_reservas_dia: 1, activo: true, ...REGLAS_PADEL },
    { ...base, ...sinReglas, id: 'i4', nombre: 'Cancha de Fútbol', tipo: 'Fútbol', descripcion: 'Grama artificial, fútbol 7.', imagen_url: null, hora_apertura: '08:00', hora_cierre: '20:00', duracion_min: 60, max_reservas_dia: 1, activo: true },
    { ...base, ...sinReglas, id: 'i5', nombre: 'Parrillera A', tipo: 'Parrillera', descripcion: 'Capacidad 25 personas. Reserva por bloque.', imagen_url: null, hora_apertura: '11:00', hora_cierre: '19:00', duracion_min: 240, max_reservas_dia: 1, activo: true },
    { ...base, ...sinReglas, id: 'i6', nombre: 'Salón de Fiestas', tipo: 'Salón', descripcion: 'Capacidad 80 personas.', imagen_url: null, hora_apertura: '10:00', hora_cierre: '22:00', duracion_min: 240, max_reservas_dia: 1, activo: true },
  ]

  // Actividades reales de la Guía de Inscripciones 2026-2027
  const actividades: Tablas['actividades'][] = ACTIVIDADES.map((a, i) => ({
    ...base, ...a, id: `a${i + 1}`, precio_usd: 0, imagen_url: null, inscripciones_abiertas: true, cupo: a.cupo ?? null, programa: a.programa ?? null,
  }))
  const idAct = (nombre: string) => actividades.find((a) => a.nombre === nombre)!.id

  const inscripciones: Tablas['inscripciones'][] = [
    { ...base, id: 'ins1', actividad_id: idAct('Tenis de Campo · Pelota Amarilla'), socio_id: 's3', accion: '1234', estado: 'activa' },
  ]

  // Calendario real 2026-2027 (eventos de día completo)
  const eventos: Tablas['eventos'][] = EVENTOS.map((e, i) => ({
    ...base, id: `ev${i + 1}`, titulo: e.titulo, descripcion: e.descripcion, departamento: e.departamento, lugar: e.lugar,
    fecha_inicio: `${e.fecha}T12:00:00-04:00`, fecha_fin: e.hasta ? `${e.hasta}T12:00:00-04:00` : null,
    imagen_url: null, destacado: false, todo_el_dia: true, venta_entradas: false, precio_usd: 0, aforo: null, max_por_accion: null,
  }))
  // Solo en la demo: el Festival Kineret con venta de entradas, para mostrar esa función
  const kineret = eventos.find((e) => e.titulo === 'Festival Kineret')!
  Object.assign(kineret, { destacado: true, venta_entradas: true, precio_usd: 15, aforo: 400, max_por_accion: 8, todo_el_dia: false, fecha_inicio: '2027-06-27T18:00:00-04:00', lugar: 'Anfiteatro' })
  const idEv = (titulo: string) => eventos.find((e) => e.titulo === titulo)!.id

  const noticias: Tablas['noticias'][] = [
    { ...base, id: 'n1', titulo: '¡Bienvenidos a Mi Hebraica!', resumen: 'Ya puedes llevar tu carnet en el teléfono, pagar tus cuotas y reservar canchas desde el app.', contenido: 'A partir de hoy todos los socios pueden usar Mi Hebraica para:\n\n• Entrar al club con el carnet digital\n• Consultar el estado de cuenta y reportar pagos\n• Reservar canchas, parrilleras y salones\n• Inscribirse en actividades y comprar entradas\n\nSi tienes dudas, escríbenos a info@hebraica.org.', imagen_url: null, departamento: 'comunicaciones', destacado: true, publicado_en: ahora },
    { ...base, id: 'n2', titulo: 'Abiertas las inscripciones de Macabilandia', resumen: 'Inscribe a tus hijos en el plan vacacional directamente desde el app.', contenido: 'Las inscripciones para Macabilandia ya están abiertas. Cupos limitados por semana.', imagen_url: null, departamento: 'macabilandia', destacado: false, publicado_en: subDays(new Date(), 2).toISOString() },
    { ...base, id: 'n3', titulo: 'Mantenimiento de la piscina', resumen: 'La piscina olímpica estará cerrada el próximo lunes por mantenimiento.', contenido: 'La piscina olímpica permanecerá cerrada el lunes por labores de mantenimiento preventivo. La piscina de niños funcionará en horario normal.', imagen_url: null, departamento: 'deportes', destacado: false, publicado_en: subDays(new Date(), 5).toISOString() },
  ]

  const albumes: Tablas['albumes'][] = [
    { ...base, id: 'al1', titulo: 'Jánuca en Hebraica', fecha: d(-40), portada_url: null },
    { ...base, id: 'al2', titulo: 'Macabiada interna', fecha: d(-90), portada_url: null },
  ]

  const directorio: Tablas['directorio'][] = DIRECTORIO.map((c, i) => ({ ...base, ...c, id: `dir${i}` }))

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

  const configuracion: Tablas['configuracion'][] = [{ id: 'datos_bancarios', valor: DATOS_BANCARIOS }]


  // Clases de los próximos 10 días
  const horario: [string, string, number[], string, number, string][] = [
    ['Spinning', 'gimnasio', [1, 2, 3, 4, 5], '06:30', 12, 'Sala de spinning'],
    ['Yoga', 'gimnasio', [2, 4, 6], '18:00', 15, 'Salón de yoga'],
    ['Pilates', 'gimnasio', [1, 3], '19:00', 10, 'Salón de yoga'],
    ['Zumba', 'bailes', [5], '17:00', 25, 'Salón de baile'],
  ]
  const clases: Tablas['clases'][] = []
  for (let n = 0; n < 10; n++) {
    const dia = addDays(new Date(), n)
    for (const [nombre, dep, dias, hora, cupo, lugar] of horario)
      if (dias.includes(dia.getDay())) clases.push({ ...base, id: `cl-${nombre}-${n}`, nombre, departamento: dep, instructor: null, lugar, inicio: `${format(dia, 'yyyy-MM-dd')}T${hora}:00-04:00`, duracion_min: 60, cupo, cancelada: false })
  }
  // Una clase mañana ya llena, para ver la lista de espera
  clases.push({ ...base, id: 'cl-boxeo', nombre: 'Boxeo funcional', departamento: 'deportes', instructor: 'Prof. Miguel', lugar: 'Cancha techada', inicio: dt(1, '19:00'), duracion_min: 60, cupo: 2, cancelada: false })
  const reservas_clase: Tablas['reservas_clase'][] = [
    { ...base, id: 'rc1', clase_id: 'cl-boxeo', socio_id: 's7', accion: '5678', estado: 'confirmada' },
    { ...base, id: 'rc2', clase_id: 'cl-boxeo', socio_id: 's5', accion: '0001', estado: 'confirmada' },
  ]

  const encuestas: Tablas['encuestas'][] = [
    { ...base, id: 'en1', titulo: '¿Qué nueva actividad te gustaría?', descripcion: 'Ayúdanos a escoger la próxima academia del club.', tipo: 'opciones', opciones: ['Boxeo', 'Pilates reformer', 'Ajedrez', 'Cocina'], evento_id: null, abierta: true, cierra: null },
    { ...base, id: 'en2', titulo: 'Califica el Shavuatón de Juventud', descripcion: null, tipo: 'calificacion', opciones: [], evento_id: idEv('Shavuatón de Juventud'), abierta: true, cierra: null },
  ]
  const votos: Tablas['votos'][] = [
    { ...base, id: 'v1', encuesta_id: 'en1', socio_id: 's7', opcion: 0, comentario: null },
    { ...base, id: 'v2', encuesta_id: 'en1', socio_id: 's5', opcion: 1, comentario: null },
    { ...base, id: 'v3', encuesta_id: 'en2', socio_id: 's7', opcion: 5, comentario: '¡Muy bonito!' },
  ]

  return {
    socios, cargos, pagos, tasas, instalaciones, reservas: [], actividades, inscripciones, eventos, entradas: [],
    noticias, albumes, fotos: [], directorio, restaurantes, solicitudes, invitados: [], notificaciones, accesos: accesosEjemplo(), configuracion,
    clases, reservas_clase, encuestas, votos, auditoria: [],
    normas: NORMAS.map((n, i) => ({ ...base, ...n, id: `no${i}` })),
    registros: [
      { id: 'rg1', user_id: 'u4', nombre: 'Sara', apellido: 'Cohen', cedula: '12345679', usuario: 'sara', email: 'sara@ejemplo.com', estado: 'pendiente', motivo: null, socio_id: null, created_at: ahora },
      { id: 'rg2', user_id: 'u5', nombre: 'Rebeca', apellido: 'Toledano', cedula: '18765432', usuario: 'rebeca.t', email: 'rebeca@ejemplo.com', estado: 'pendiente', motivo: null, socio_id: null, created_at: ahora },
    ],
    claves: { u1: 'demo1234', u2: 'admin1234', u3: 'seguridad1234', u4: 'sara1234', u5: 'rebeca1234' },
    usuarios: { david: 'u1', admin: 'u2', seguridad: 'u3', sara: 'u4', 'rebeca.t': 'u5' },
  }
}
