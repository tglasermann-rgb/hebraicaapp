// Datos reales de Hebraica tomados de la "Guía de Inscripciones 2026-2027", el "Calendario Hebraica 2026"
// y las "Normas de Pádel 2022". Es la única fuente: alimenta el modo demo y genera
// supabase/migrations/0006_datos_hebraica_2026_2027.sql (npm run generar:datos).

import type { Actividad, Contacto, DatosBancarios, Evento, Instalacion, Norma } from './types'

type NuevaActividad = Omit<Actividad, 'id' | 'created_at' | 'imagen_url' | 'inscripciones_abiertas' | 'precio_usd' | 'programa' | 'cupo'> &
  Partial<Pick<Actividad, 'programa' | 'cupo'>>

const CONSULTAR = 'Costo en Atención al Público'
const GRATIS = 'Sin costo'
const SIN_DESCUENTO = 'No aplica ningún tipo de descuento.'

function act(departamento: string, nombre: string, horario: string, o: Partial<NuevaActividad> = {}): NuevaActividad {
  return {
    departamento, nombre, horario,
    descripcion: o.descripcion ?? null,
    instructor: o.instructor ?? null,
    edad_min: o.edad_min ?? null,
    edad_max: o.edad_max ?? null,
    nota_precio: o.nota_precio ?? CONSULTAR,
    requisitos: o.requisitos ?? null,
    lugar: o.lugar ?? null,
    programa: o.programa ?? null,
    cupo: o.cupo ?? null,
  }
}

// ---------------------------------------------------------------------------
// ACTIVIDADES 2026-2027
// ---------------------------------------------------------------------------
const bailes = (nombre: string, horario: string, edadMin?: number) =>
  act('bailes', `Bailes Israelíes · ${nombre}`, horario, {
    edad_min: edadMin ?? null,
    descripcion: `Uniforme: franela del departamento, zapatos de baile, zapatillas o descalzo, cabello recogido y short o licra negra.\nPara participar en el Festival Kineret la niña debe estar inscrita; fecha límite de inscripción: 31 de enero.\n${SIN_DESCUENTO}`,
  })

const musica = (nombre: string, horario: string, instructor: string, edadMin: number | null, edadMax: number | null, modalidad: string) =>
  act('cultura', nombre, horario, { instructor, edad_min: edadMin, edad_max: edadMax, descripcion: `Música · Modalidad ${modalidad}.\n${SIN_DESCUENTO}`, lugar: 'Centro Cultural' })

const futbol = (categoria: string, anos: string, horario: string) =>
  act('deportes', `Fútbol · ${categoria}`, horario, {
    descripcion: `Academia de Fútbol Hebraica (deporte federado). Nacidos ${anos}.\nFormación integral con metodología moderna y cuerpo técnico calificado.\nLas franelas y ligas se cargan a la membresía y se entregan en el Departamento de Deportes.`,
  })

const EVALUACION = 'Requiere la evaluación del coordinador de la disciplina (indica el nivel). Sin ella Atención al Público no realiza la inscripción.'

export const ACTIVIDADES: NuevaActividad[] = [
  // Adulto Mayor
  act('diam', 'Círculo Edad de Oro · Grupo Biná', 'Mar 11:30 am – 4:00 pm · Mié 1:30 – 5:00 pm · Jue 12:00 m – 4:00 pm', {
    edad_min: 65,
    lugar: 'Salón Edad de Oro o Área Picnic',
    descripcion:
      '“Longevidad activa, sana y feliz”. Atención integral diurna 3 días por semana: actividades psico-físicas, culturales, formativas y socio-recreativas, con nutrición, salud y transporte.\n\nMartes: Shiurim de Parashat Hashavua, ejercicios funcionales, almuerzo, canto coral y merienda.\nMiércoles: bailes fitness y rikudim, cumpleaños, bingo y conciertos, artes manuales y yoga.\nJueves: Javerim, Taichí Chikun, almuerzo, Israel al día, Mental Gym y dinámicas de grupo.\n\nTransporte: martes y jueves ida 9:30 am / regreso 4:00 pm; miércoles ida 11:30 am / regreso 4:30 pm.\nRutas: San Bernardino · Las Palmas · La Florida · Chacaíto · Altamira · Los Palos Grandes · Santa Eduvigis · Dos Caminos · Los Chorros.',
    requisitos: 'Planilla con los datos del participante y evaluación cognitiva obligatoria con un profesional.',
  }),

  // Bailes Israelíes
  bailes('1ero y 2do grado', 'Miércoles 3:30 – 4:30 pm', 6),
  bailes('3ro y 4to grado', 'Martes 3:30 – 5:00 pm', 8),
  bailes('5to y 6to grado', 'Lunes 3:30 – 5:00 pm', 10),
  bailes('Preparatorio A y B', 'Jueves 3:30 – 4:30 pm'),
  bailes('Pre Leaká (1ero y 2do año)', 'Miércoles 5:00 – 6:30 pm', 12),
  bailes('Leaká (3ero, 4to y 5to año)', 'Jueves 5:00 – 6:30 pm', 14),
  bailes('Universitarias', 'Lunes 6:30 – 8:00 pm', 17),
  bailes('Adultas', 'Lunes 5:30 – 6:30 pm', 18),

  // Centro Creativo Brief Kohn (adultos)
  act('brief_kohn', 'Taller de Historia del Arte', 'Lunes 3:30 – 5:30 pm', { instructor: 'Emily Medina', lugar: 'Auditorio del CC Brief Kohn', edad_min: 18, descripcion: 'La evolución de las artes en su desarrollo histórico y social: referencias, perspectiva y color, para comprenderlas y valorarlas.' }),
  act('brief_kohn', 'Clase de Dispositivos Móviles', 'Martes 3:30 – 4:30 pm', { instructor: 'Raquel Chocrón', lugar: 'Auditorio del CC Brief Kohn', edad_min: 18, descripcion: 'Aprende a usar todas las funciones de tu teléfono de forma sencilla y divertida. ¡No necesitas ser un experto!' }),
  act('brief_kohn', 'Miércoles de Cine', 'Miércoles 3:30 – 5:30 pm', { lugar: 'Auditorio del CC Brief Kohn', nota_precio: GRATIS, descripcion: 'Películas que generan reflexión y pensamiento crítico, con tertulias o foros guiados en algunas ocasiones.' }),
  act('brief_kohn', 'Coro', 'Lunes 5:30 – 7:00 pm', { instructor: 'Leonardo Maldonado', lugar: 'Auditorio del CC Brief Kohn', descripcion: 'Cantos tradicionales, litúrgicos y contemporáneos. ¡No necesitas saber cantar, aquí aprenderás!' }),
  act('brief_kohn', 'Inglés Conversacional', 'Jueves 4:30 – 6:00 pm', { instructor: 'Ludmila Kariakin', lugar: 'CC Brief Kohn', descripcion: 'Una tarde en inglés conversando de actualidad, deporte, entretenimiento y más para mejorar tu inglés.' }),
  act('brief_kohn', 'Aquafitness', 'Lunes y miércoles 10:00 – 11:00 am', { instructor: 'Andrea Pino Escalona', lugar: 'Piscina Olímpica', descripcion: 'Ejercicio aeróbico en el agua que mejora fuerza, flexibilidad, resistencia y coordinación; reduce el estrés y favorece el buen dormir.' }),
  act('brief_kohn', 'Taller de Teatro', 'Martes 5:30 – 7:00 pm', { instructor: 'Zair Mora', lugar: 'Auditorio del CC Brief Kohn', descripcion: 'Interpretación de personajes con ejercicios prácticos, juegos de rol y técnicas de actuación, hasta un montaje teatral.' }),
  act('brief_kohn', 'Rosh Jodesh con Hadara', 'Una vez al mes (según el calendario judío) 10:30 am – 12:00 m', { instructor: 'Rabanit Hadara Weisman', lugar: 'Sala principal del CC Brief Kohn', nota_precio: GRATIS, descripcion: 'Charlas enriquecedoras que nos conectan con nuestra alma y nuestras raíces.' }),
  act('brief_kohn', 'Taller de Ópera', 'Jueves 3:00 – 5:00 pm', { instructor: 'María Grazia de Trum', lugar: 'Auditorio del CC Brief Kohn', descripcion: 'Proyecciones de producciones de ópera y sus principales exponentes. No necesitas conocimientos previos.' }),
  act('brief_kohn', 'Paseos Culturales y Recreativos', 'Diferentes días de la semana', { descripcion: 'Actividades recreativas, artísticas y culturales para adultos que fomentan la socialización y el crecimiento personal.' }),

  // Centro Cultural · Música
  musica('Iniciación Musical Allegro', 'Martes y jueves 2:00 – 2:45 pm', 'Alexis Ramos / Dulce Fuentes', 4, 4, 'grupal'),
  musica('Iniciación Musical Adagio', 'Martes y jueves 2:45 – 3:30 pm', 'Alexis Ramos / Dulce Fuentes', 3, 3, 'grupal'),
  musica('Iniciación Piano', 'Lunes y miércoles 2:30 pm', 'Dulce Fuentes', 5, 6, 'grupal'),
  musica('Iniciación Batería', 'Lunes y miércoles 2:30 pm', 'Petterson Ramírez', 5, 6, 'grupal'),
  musica('Flauta Dulce', 'Lunes y miércoles 2:30 pm', 'José Gregorio Lucart', 5, 6, 'grupal'),
  musica('Baby Violín', 'Martes y jueves 4:15 pm', 'Alexis Ramos', 5, 6, 'grupal'),
  musica('Canto 1', 'Lunes y miércoles 3:15 – 4:00 pm', 'María José Mendoza', 6, null, 'grupal'),
  musica('Canto 2', 'Lunes 4:00 – 6:00 pm · Jueves 3:15 – 6:00 pm', 'María José Mendoza', 6, null, 'grupal o individual'),
  musica('Batería', 'Lunes, martes y miércoles 3:00 – 6:00 pm', 'Petterson Ramírez', 5, null, 'individual'),
  musica('Violín', 'Lunes y martes 3:00 – 6:00 pm', 'Alexis Ramos', 7, null, 'individual'),
  musica('Guitarra', 'Martes 3:00 – 4:30 pm', 'Juan P. Rivas', 7, null, 'grupal o individual'),
  musica('Piano 1', 'Martes a jueves 3:00 pm y 6:00 pm', 'Dulce Fuentes', 7, null, 'individual'),
  musica('Piano 2', 'Miércoles 3:15 – 6:00 pm', 'Jheison Cardona', 7, null, 'individual'),
  musica('Cuatro', 'Jueves 2:00 pm (individual, 6+ años) · 3:00 – 6:00 pm (grupal, 7+ años)', 'José Herrera', 6, null, 'grupal o individual'),
  musica('Ensamble Infantil', 'Martes 3:30 – 4:15 pm', 'Alexis Ramos', 8, 10, 'grupal'),
  musica('Banda Juvenil', 'Martes 4:30 – 5:30 pm', 'Juan Rivas / Petterson Ramírez', 14, 18, 'grupal'),
  musica('Ensamble Vocal / Coro Infantil', 'Miércoles 4:00 pm y 4:45 pm', 'Dulce Fuentes / María José Mendoza', 6, 7, 'grupal'),

  // Centro Cultural · Artes y aprendizaje
  act('cultura', 'Artes', 'Lunes y martes 3:15, 4:15 o 5:15 pm', { instructor: 'Soledad Tovar', edad_min: 6, descripcion: `Artes plásticas en grupo.\n${SIN_DESCUENTO}` }),
  act('cultura', 'Arte y Lettering', 'Lunes a jueves 3:15, 4:15 o 5:15 pm', { instructor: 'Nicole Katsef', edad_min: 5, descripcion: `Artes plásticas en grupo.\n${SIN_DESCUENTO}` }),
  act('cultura', 'Taller de Pintura (adultos)', 'Martes y jueves 9:30 am – 12:30 pm', { instructor: 'Luis Franco', edad_min: 18, descripcion: SIN_DESCUENTO }),
  act('cultura', 'Discovering English', 'Lunes a jueves 2:00 pm o a convenir', { edad_min: 3, descripcion: `Inglés con juegos y canciones: vocabulario, comprensión, pronunciación y comunicación. Grupal o individual.\n${SIN_DESCUENTO}` }),
  act('cultura', 'Taller de Arte Creativo (5 a 6 años)', 'Lunes a miércoles 2:00 – 2:45 pm', { instructor: 'Jennifer Salama', edad_min: 5, edad_max: 6, descripcion: `Dibujo y pintura en un ambiente de compañerismo, risas y creatividad.\n${SIN_DESCUENTO}` }),
  act('cultura', 'Taller de Arte Creativo (6 a 7 años)', 'Lunes a miércoles 3:45 – 4:30 pm', { instructor: 'Jennifer Salama', edad_min: 6, edad_max: 7, descripcion: `Dibujo y pintura en un ambiente de compañerismo, risas y creatividad.\n${SIN_DESCUENTO}` }),
  act('cultura', 'Taller de Arte Creativo (7 a 9 años)', 'Lunes a miércoles 4:30 – 5:25 pm', { instructor: 'Jennifer Salama', edad_min: 7, edad_max: 9, descripcion: `Dibujo y pintura en un ambiente de compañerismo, risas y creatividad.\n${SIN_DESCUENTO}` }),
  act('cultura', 'Baby Art 1', 'Lunes y miércoles 4:00 – 4:45 pm', { edad_min: 2, edad_max: 3, descripcion: `Exploración de técnicas de arte y grandes artistas, de lo clásico a lo moderno.\n${SIN_DESCUENTO}` }),
  act('cultura', 'Baby Art 2', 'Lunes y miércoles 3:00 – 3:45 pm', { edad_min: 3, edad_max: 4, descripcion: `Exploración de técnicas de arte y grandes artistas, de lo clásico a lo moderno.\n${SIN_DESCUENTO}` }),
  act('cultura', 'Mercaz Peilut', '1 a 4 días por semana · 1:45 – 5:00 pm o 1:45 – 3:30 pm', { descripcion: `Apoyo en actividades escolares, acompañamiento, juegos y talleres en un ambiente seguro y divertido.\n${SIN_DESCUENTO}` }),
  act('cultura', 'Ludoteca', 'Lunes a jueves 3:00 – 6:00 pm · Domingos y feriados 2:00 – 6:00 pm', { descripcion: `Centro infantil donde los niños juegan y aprenden desarrollando creatividad y habilidades.\n${SIN_DESCUENTO}` }),

  // Deportes · Fútbol
  futbol('Compotas', '2021-2022', 'Lunes y miércoles 2:30 – 3:30 pm'),
  futbol('Sub 7', '2020', 'Lunes y miércoles 2:30 – 3:30 pm'),
  futbol('Sub 8', '2019', 'Lunes y miércoles 3:30 – 4:30 pm'),
  futbol('Sub 10', '2017-2018', 'Lunes, martes y jueves 3:30 – 5:00 pm'),
  futbol('Sub 12', '2015-2016', 'Lunes, martes y jueves 3:30 – 5:00 pm'),
  futbol('Sub 14', '2013-2014', 'Lunes, martes y jueves 5:00 – 6:30 pm'),
  futbol('Sub 16', '2011-2012', 'Lunes, martes y jueves 5:00 – 6:30 pm'),
  futbol('Sub 18', '2009-2010', 'Lunes, martes y jueves 5:00 – 6:30 pm'),
  futbol('Femenino Sub 10', '2017-2018', 'Lunes 3:45 – 4:45 pm · Jueves 3:30 – 4:30 pm'),
  futbol('Femenino Sub 12', '2015-2016', 'Miércoles 4:30 – 5:30 pm · Jueves 3:30 – 4:30 pm'),

  // Deportes · Natación
  act('deportes', 'Natación · Nivel 1 (sección 1)', 'Lunes y miércoles o martes y jueves · 2:30 – 3:25 pm o 3:30 – 4:25 pm', { edad_min: 4, edad_max: 6, requisitos: EVALUACION, descripcion: 'Escuela deportiva. Traje de baño y gorro se cargan a la membresía. Kit: tabla de aprendizaje, pull boy, chapaletas y lentes.' }),
  act('deportes', 'Natación · Nivel 2 (sección 2)', 'Lunes y miércoles o martes y jueves · 2:30 – 3:25 pm o 3:30 – 4:25 pm', { edad_min: 6, edad_max: 8, requisitos: EVALUACION, descripcion: 'Escuela deportiva. Traje de baño y gorro se cargan a la membresía. Kit: tabla de aprendizaje, pull boy, chapaletas y lentes.' }),
  act('deportes', 'Natación · Nivel 3 (sección 3)', 'Lunes y miércoles o martes y jueves · 2:30 – 3:25 pm o 3:30 – 4:25 pm', { edad_min: 5, edad_max: 7, requisitos: EVALUACION, descripcion: 'Escuela deportiva. Traje de baño y gorro se cargan a la membresía. Kit: tabla de aprendizaje, pull boy, chapaletas y lentes.' }),
  act('deportes', 'Natación · Elemental Precompetitivo (sección 4)', 'Lunes y miércoles o martes y jueves · 2:30 – 3:25 pm o 3:30 – 4:25 pm', { edad_min: 6, edad_max: 14, requisitos: EVALUACION, descripcion: 'Escuela deportiva. Traje de baño y gorro se cargan a la membresía. Kit: tabla de aprendizaje, pull boy, chapaletas y lentes.' }),
  act('deportes', 'Natación · Equipo Infantil', 'Lunes a jueves 3:30 – 4:45 pm', { edad_min: 6, edad_max: 10, requisitos: EVALUACION, descripcion: 'Deporte federado.' }),
  act('deportes', 'Natación · Equipo Juvenil', 'Lunes a jueves 3:30 – 4:30 pm · Viernes 2:30 – 4:00 pm', { edad_min: 11, edad_max: 18, requisitos: EVALUACION, descripcion: 'Deporte federado.' }),
  act('deportes', 'Natación Máster', 'Martes, miércoles y viernes 6:15 – 8:45 am · Sábado 8:00 – 9:30 am', { edad_min: 18, descripcion: 'Nivel avanzado, de 18 años en adelante.' }),
  act('deportes', 'Natación Particular (0 a 3 años)', 'Según disponibilidad · clases de ½ o 1 hora, 2 veces por semana', { edad_max: 3, descripcion: `Para niños de 6 meses a 3 años y 11 meses. Día y horario a elección entre los ofrecidos por Atención al Público.\nLas mensualidades se pagan los primeros 5 días del mes. ${SIN_DESCUENTO}\nVer el reglamento completo en Normas del club.` }),
  act('deportes', 'Espacio Sensoriomotriz (2 a 4 años)', 'Lun y mié: 2:00, 3:00 o 4:00 pm · Mar y jue: 2:00 o 3:00 pm', { edad_min: 2, edad_max: 4, descripcion: 'Secciones por edad: 2 años a 2 años y 9 meses; 2 años y 9 meses a 3 años y 9 meses; 4 años.' }),

  // Deportes · Tenis, voleibol, gimnasia
  act('deportes', 'Tenis de Campo · Pelota Roja', 'Lun y mié o mar y jue · 2:30 – 3:30 pm o 3:30 – 4:30 pm', { edad_min: 4, edad_max: 7, requisitos: EVALUACION, descripcion: 'Escuela deportiva y deporte federado. Prueba solo para nuevos ingresos.' }),
  act('deportes', 'Tenis de Campo · Pelota Naranja', 'Lun y mié o mar y jue · 3:30 – 4:30 pm', { edad_min: 6, edad_max: 8, requisitos: EVALUACION, descripcion: 'Escuela deportiva y deporte federado. Prueba solo para nuevos ingresos.' }),
  act('deportes', 'Tenis de Campo · Pelota Verde', 'Lun y mié o mar y jue · 3:30 – 4:30 pm (8 a 10 años) · 4:30 – 5:30 pm (9+ años)', { edad_min: 8, requisitos: EVALUACION, descripcion: 'Escuela deportiva y deporte federado. Prueba solo para nuevos ingresos.' }),
  act('deportes', 'Tenis de Campo · Pelota Amarilla', 'Lun y mié o mar y jue · 4:30 – 5:30 pm', { edad_min: 11, requisitos: EVALUACION, descripcion: 'Escuela deportiva y deporte federado. Prueba solo para nuevos ingresos.' }),
  act('deportes', 'Voleibol de Playa', 'Martes y jueves 4:00 – 6:00 pm', { edad_min: 12, edad_max: 18, descripcion: `Categorías Sub 14, Sub 16 y Sub 18.\n${SIN_DESCUENTO}` }),
  act('deportes', 'Gimnasia Artística · Iniciación', 'Lun y mié o mar y jue · 2:30 – 3:30 pm', { edad_min: 4, edad_max: 6, requisitos: EVALUACION }),
  act('deportes', 'Gimnasia Artística · Intermedio', 'Lun y mié (6 a 10 años) o mar y jue (7 a 13 años) · 3:30 – 4:30 pm', { edad_min: 6, edad_max: 13, requisitos: EVALUACION }),
  act('deportes', 'Gimnasia Artística · Avanzado', 'Lun y mié (7 a 12 años) o mar y jue (7 a 14 años) · 4:30 – 5:30 pm', { edad_min: 7, edad_max: 14, requisitos: EVALUACION }),
  act('deportes', 'Gimnasia Acrobática · Masculino', 'Lunes y miércoles 3:30 – 4:30 pm'),
  act('deportes', 'Gimnasia Acrobática · Femenino', 'Lunes a jueves 3:30 – 5:30 pm'),
  act('deportes', 'Gimnasia Acrobática · Femenino (sección privada)', 'Viernes 2:30 – 3:30 pm', { descripcion: 'Se imparte los viernes que no haya Peulá de Noar Le Noar.' }),
  act('deportes', 'Telas Acrobáticas · Petit Inicial', 'Martes y jueves 2:30 – 3:30 pm', { descripcion: 'Paquetes de 1 a 4 clases por semana.' }),
  act('deportes', 'Telas Acrobáticas · Básico Intermedio', 'Lunes a jueves 3:30 – 4:30 pm o 4:30 – 5:30 pm', { descripcion: 'Paquetes de 1 a 4 clases por semana.' }),
  act('deportes', 'Telas Acrobáticas · Fuerza y Flexibilidad', 'Martes y jueves 5:30 – 6:00 pm', { descripcion: 'Cuenta como una sola clase semanal junto con otro paquete.' }),
  act('deportes', 'Telas Acrobáticas · Adultos', 'Lunes a viernes 8:30 – 9:30 am', { edad_min: 18, descripcion: 'Paquetes de 1 a 4 clases por semana.' }),

  // Gimnasio Galsky
  act('gimnasio', 'Gimnasio Galsky · Plan mensual', 'Lun a jue 6:30 am – 8:00 pm · Vie 6:30 am – 4:00 pm · Sáb, dom y feriados 9:00 am – 3:00 pm', {
    edad_min: 13,
    descripcion: 'Máquinas de fuerza, pesas libres, entrenamiento funcional y clases grupales: steps, workout, baile, stretching, pilates en mat, yoga, fit combat, spinning y TRX.\nPlanes: mensual, mensual + pilates, juvenil, juvenil + pilates, +65 años y +65 años + pilates.\nEntrada diaria sin inscripción previa (se paga el pase del día).\nLa inscripción se paga una sola vez al ingresar. Es obligatorio traer toalla o solicitarla en recepción (costo adicional).\nContacto: +58 412-927.9682 · gimnasiohebraica@gmail.com · Instagram @gimnasiogalsky',
  }),

  // Juventud y Educación
  act('juventud', 'Peulot de Noar Le Noar', 'Viernes (previa convocatoria) 2:15 – 4:00 pm', { nota_precio: GRATIS, descripcion: 'Actividades educativas y recreativas de los madrijim del Movimiento Juvenil Noar Le Noar para 1ero a 6to grado. Incluye merienda, premios y rifas. Confirmar asistencia con los madrijim del grado.' }),
  act('juventud', 'Escuela de Madrijim', 'Miércoles 3:40 – 5:00 pm', { requisitos: 'Requiere entrevista para ser admitido. Para jóvenes de 3er año de bachillerato.', descripcion: 'Capacitación semanal en liderazgo, trabajo en equipo, sionismo, judaísmo y juegos. Al culminar reciben el diploma de Madrijim del Movimiento Juvenil Noar Le Noar.' }),
  act('juventud', 'Limud Juventud', 'Según programación del departamento', { requisitos: 'Requiere entrevista para ser admitido. Para jóvenes de 4to y 5to año.', descripcion: 'Formación y actividades comunitarias para quienes no cursaron Escuela de Madrijim y quieren pertenecer al Movimiento Juvenil Noar Le Noar.' }),
  act('juventud', 'Closer', 'Según programación', { edad_min: 18, descripcion: 'Actividades sociales, educativas y recreativas para jóvenes mayores de 18 años de la comunidad.' }),

  // Macabilandia
  act('macabilandia', 'Macabilandia Janucá', 'Desde el lunes 14 de diciembre de 2026', { programa: 'macabilandia', descripcion: 'Plan vacacional de Janucá. Ver normas de Macabilandia en Normas del club.' }),
  act('macabilandia', 'Macabilandia Summer 2027', 'Desde el lunes 12 de julio de 2027 · lunes a viernes, julio y agosto', { programa: 'macabilandia', descripcion: 'El plan vacacional de verano de Hebraica. El pago es por semana consecutiva (no por días sueltos de distintas semanas).' }),
]

// ---------------------------------------------------------------------------
// CALENDARIO 2026-2027 (eventos del club; las festividades judías salen en el calendario judío)
// ---------------------------------------------------------------------------
type NuevoEvento = Pick<Evento, 'titulo' | 'descripcion' | 'departamento' | 'lugar'> & { fecha: string; hasta?: string }
const ev = (fecha: string, titulo: string, departamento = 'club', descripcion: string | null = null, hasta?: string): NuevoEvento => ({ fecha, titulo, departamento, descripcion, lugar: null, hasta })
const CIERRA = 'Hebraica cierra a las 4:30 pm.'
const CERRADA = 'Hebraica permanece cerrada.'
const SIN_ACT = 'No hay actividades.'

export const EVENTOS: NuevoEvento[] = [
  ev('2026-09-07', 'Inicio de inscripciones 2026-2027', 'club', 'Inicio de información e inscripciones de actividades en Atención al Público.'),
  ev('2026-09-08', 'Seder de Rosh Hashaná · Edad de Oro', 'diam'),
  ev('2026-09-11', 'Erev Rosh Hashaná', 'club', CIERRA),
  ev('2026-09-12', 'Rosh Hashaná · Hebraica cerrada', 'club', CERRADA, '2026-09-13'),
  ev('2026-09-14', 'Inicio de actividades', 'club'),
  ev('2026-09-20', 'Erev Yom Kipur', 'club', CIERRA),
  ev('2026-09-21', 'Yom Kipur · Hebraica cerrada', 'club', CERRADA),
  ev('2026-09-26', 'Sucot · No hay actividades', 'club', SIN_ACT, '2026-09-27'),
  ev('2026-09-29', 'Seudá de Sucot · Edad de Oro', 'diam'),
  ev('2026-09-30', 'Parrilla de Sucot · Juventud', 'juventud'),
  ev('2026-10-01', 'Actividad de Sucot · Centro Cultural', 'cultura'),
  ev('2026-10-03', 'Sheminí Atzéret y Simjat Torá · No hay actividades', 'club', SIN_ACT, '2026-10-04'),
  ev('2026-10-07', 'Acto conmemorativo del 7 de Octubre', 'club'),
  ev('2026-10-12', 'Feriado: Día de la Resistencia Indígena', 'club'),
  ev('2026-10-13', 'Curso de cocina asiática con el chef Kevin Fekete', 'brief_kohn'),
  ev('2026-10-18', 'Shavuatón de Juventud', 'juventud'),
  ev('2026-10-23', '1ª Peulá de Noar Le Noar', 'juventud'),
  ev('2026-10-29', 'Shabat Project', 'club'),
  ev('2026-11-04', 'Acto en memoria de Itzjak Rabin', 'club'),
  ev('2026-11-06', 'Peulá de Juventud', 'juventud'),
  ev('2026-11-10', 'Conmemoración de la Kristallnacht', 'cultura'),
  ev('2026-11-15', 'Copa Hebraica «Danny Chocrón» Máster', 'deportes'),
  ev('2026-11-16', 'Copa Hebraica «Danny Chocrón» Escuelas', 'deportes', null, '2026-11-17'),
  ev('2026-11-20', 'Peulá de Juventud', 'juventud'),
  ev('2026-11-23', 'Inicio del Torneo Interno de Janucá', 'deportes'),
  ev('2026-11-28', 'Shavuatón del Departamento de Juventud', 'juventud', null, '2026-11-29'),
  ev('2026-12-04', 'Peulá de Juventud · Erev Janucá', 'juventud'),
  ev('2026-12-06', 'Janucá Fest · Día Familiar de Janucá', 'club', 'Día familiar y cierre del Torneo de Janucá.'),
  ev('2026-12-09', 'Janucá Hallacada · Edad de Oro', 'diam'),
  ev('2026-12-11', 'Finalizan las actividades', 'club', 'Inicio de las vacaciones de fin de año.'),
  ev('2026-12-14', 'Macabilandia Janucá', 'macabilandia'),
  ev('2026-12-24', 'Noche Buena', 'club', CIERRA),
  ev('2026-12-25', 'Feriado: Navidad', 'club'),
  ev('2026-12-31', 'Noche Vieja', 'club', CIERRA),
  ev('2027-01-01', 'Feriado: Año Nuevo', 'club'),
  ev('2027-01-07', 'Inicio de actividades', 'club'),
  ev('2027-01-15', 'Día del Maestro · Peulá de Juventud', 'juventud'),
  ev('2027-01-21', 'Seder de Tu Bishvat · Edad de Oro', 'diam'),
  ev('2027-01-24', 'Día Familiar de Tu Bishvat', 'club'),
  ev('2027-01-25', 'Día Internacional en Conmemoración de las Víctimas del Holocausto', 'cultura'),
  ev('2027-01-29', 'Peulá de Juventud', 'juventud'),
  ev('2027-02-08', 'Carnaval', 'club', null, '2027-02-09'),
  ev('2027-02-12', 'Peulá de Juventud', 'juventud'),
  ev('2027-02-14', 'Día de los Enamorados', 'club'),
  ev('2027-02-21', 'Copa Escuela', 'deportes', 'Inauguración el domingo 21 y final el domingo 28.', '2027-02-28'),
  ev('2027-03-08', 'Día de la Mujer', 'club'),
  ev('2027-03-12', 'Peulá de Juventud', 'juventud'),
  ev('2027-03-14', 'Fiesta de la Cultura', 'cultura'),
  ev('2027-03-23', 'Purim · Lectura de Meguilat Esther', 'club'),
  ev('2027-03-23', 'Seudá y fiesta de Purim · Edad de Oro', 'diam'),
  ev('2027-03-25', 'Semana Santa (jueves y viernes santo)', 'club', null, '2027-03-26'),
  ev('2027-03-29', 'Inicio de actividades', 'club'),
  ev('2027-03-31', 'Cumpleaños de Hebraica', 'club', 'Recordación de los 533 años de la expulsión de los judíos de España.'),
  ev('2027-04-02', 'Peulá de Juventud', 'juventud'),
  ev('2027-04-11', 'Verbena de Purim', 'club'),
  ev('2027-04-13', 'Seder de Pésaj · Edad de Oro', 'diam'),
  ev('2027-04-19', 'Feriado: Declaración de la Independencia', 'club'),
  ev('2027-04-21', 'Erev Pésaj', 'club', CIERRA),
  ev('2027-04-22', 'Pésaj Yom Tov · Hebraica cerrada', 'club', CERRADA, '2027-04-23'),
  ev('2027-04-28', 'Pésaj Yom Tov · No hay actividades', 'club', SIN_ACT),
  ev('2027-04-29', 'Gran Noche de Mimona', 'club', `Pésaj Yom Tov. ${SIN_ACT}`),
  ev('2027-05-01', 'Feriado: Día del Trabajador', 'club'),
  ev('2027-05-04', 'Yom Hashoá · Acto conmemorativo', 'club'),
  ev('2027-05-06', 'Homenaje a las madres · Edad de Oro', 'diam'),
  ev('2027-05-07', 'Peulá de Juventud', 'juventud'),
  ev('2027-05-09', 'Día de la Madre', 'club'),
  ev('2027-05-10', 'Erev Yom Hazikarón · Inicio de Guardias de Honor', 'club'),
  ev('2027-05-11', 'Yom Hazikarón · Acto Central de Yom Haatzmaut', 'club'),
  ev('2027-05-12', 'Yom Haatzmaut · Día Israelí', 'club'),
  ev('2027-05-12', 'Seudá de Yom Haatzmaut · Edad de Oro', 'diam'),
  ev('2027-05-14', 'Peulá de Yom Haatzmaut · Noar Le Noar', 'juventud'),
  ev('2027-05-25', 'Lag Baómer', 'club'),
  ev('2027-06-03', 'Acto y Seudá de Yom Yerushalaim · Edad de Oro', 'diam'),
  ev('2027-06-08', 'Seudá de Shavuot · Edad de Oro', 'diam'),
  ev('2027-06-11', 'Shavuot · No hay actividades', 'club', SIN_ACT, '2027-06-12'),
  ev('2027-06-13', 'Sprint de Natación', 'deportes'),
  ev('2027-06-16', 'Homenaje a los padres · Edad de Oro', 'diam'),
  ev('2027-06-20', 'Día del Padre · 1er ensayo general de Kineret', 'bailes'),
  ev('2027-06-23', 'Graduación de la Escuela de Madrijim', 'juventud'),
  ev('2027-06-24', 'Feriado: Batalla de Carabobo', 'club'),
  ev('2027-06-25', '2° ensayo general de Kineret', 'bailes'),
  ev('2027-06-27', 'Festival Kineret', 'bailes', 'El gran festival de Bailes Israelíes de Hebraica.'),
  ev('2027-07-01', 'Robinson', 'juventud', null, '2027-07-03'),
  ev('2027-07-05', 'Feriado: Día de la Independencia', 'club'),
  ev('2027-07-09', 'Finalizan las actividades', 'club'),
  ev('2027-07-10', 'MT El Cloche', 'juventud', null, '2027-07-11'),
  ev('2027-07-12', 'Inicio de Macabilandia Summer', 'macabilandia', 'Plan vacacional de verano, de lunes a viernes durante julio y agosto.'),
  ev('2027-07-18', 'Día del Niño', 'club'),
  ev('2027-07-24', 'Feriado: Natalicio de Simón Bolívar', 'club'),
]

// ---------------------------------------------------------------------------
// NORMAS Y REGLAMENTOS
// ---------------------------------------------------------------------------
type NuevaNorma = Omit<Norma, 'id' | 'created_at'>
const norma = (orden: number, departamento: string, titulo: string, contenido: string): NuevaNorma => ({ orden, departamento, titulo, contenido })

export const NORMAS: NuevaNorma[] = [
  norma(1, 'club', 'Misión, visión y valores',
    'MISIÓN\nSomos el lugar de encuentro, esparcimiento y formación para los miembros de la Comunidad Judía de Venezuela, a través de la oferta de servicios y actividades educativas, sociales, culturales, recreativas y deportivas, con el objeto de preservar y fomentar los valores judíos y sionistas, así como el bienestar y la continuidad de nuestra Comunidad, de acuerdo a los lineamientos del Vaad Hakehilot.\n\nVISIÓN\nSer EL LUGAR de preferencia de la Comunidad Judía.\n\nVALORES\n• Optimizar la oferta de actividades y servicios para toda la kehilá, fomentando los valores judaicos y sionistas y el sentido de pertenencia a la comunidad judía y al Estado de Israel.\n• Preservar, mantener y mejorar las instalaciones para todos los grupos etarios.\n• Garantizar la sustentabilidad económica, social, ecológica y política de la institución a largo plazo.\n• Consolidar un equipo humano de calidad.\n• Promover la participación de miembros actuales y potenciales.'),
  norma(2, 'club', 'Horario de Atención al Público',
    '• Lunes a viernes: 8:00 am a 4:30 pm\n• Domingos y días feriados: 8:30 am a 2:30 pm\n• Sábados: cerrado'),
  norma(3, 'club', 'Cómo inscribirse en actividades',
    '1. Debe estar solvente con la institución.\n2. Actualice sus datos personales, familiares y de los vehículos.\n3. Solicite el material informativo en Atención al Público.\n4. Para actividades individuales (por ejemplo piano) o que requieren evaluación previa (por ejemplo natación), diríjase al departamento correspondiente.\n5. Con los requisitos listos, realice la inscripción y pague en Atención al Público.\n6. Solo el pago en caja garantiza el cupo.\n\nFECHAS 2026-2027\n• Inicio de información e inscripciones: lunes 7 de septiembre de 2026.\n• Inicio de actividades: lunes 14 de septiembre de 2026.\n\nIMPORTANTE\n• Las cuotas de las actividades se facturan mensualmente con ajustes periódicos.\n• Verifique con antelación que el participante esté registrado en el sistema. Si no aparece, lleve copia de la partida de nacimiento al Departamento de Admisión.\n• Solvencia comunitaria: es obligación de todo miembro de la Kehilá estar al día con sus compromisos comunitarios.'),
  norma(4, 'club', 'Normativas generales para actividades',
    'Todos los departamentos se rigen por las normativas administrativas, disciplinarias, de seguridad y de prevención de la institución. Todos tenemos derecho a no ser tratados de forma humillante u ofensiva y a recibir respeto a nuestras ideas y creencias.\n\n1. ASISTENCIA\nLas actividades requieren asistencia regular. Las inasistencias pueden hacer perder el derecho a actividades representativas (festivales, juegos, torneos y viajes). Los representantes deben avisar al departamento antes de la actividad. Son faltas justificadas: enfermedad, luto y compromisos en otra disciplina de la institución.\n\n2. PUNTUALIDAD\n• Clases de 45 minutos o más: tolerancia de 10 minutos.\n• Clases de menos de 45 minutos: tolerancia de 5 minutos.\n• Retirarse antes requiere autorización del representante.\n• Si el profesor llega tarde o falta, debe recuperar el tiempo o la clase. Si falta el alumno, la clase se considera impartida.\n\n3. UNIFORME\nEs obligatorio en las actividades que así lo indiquen.\n\n4. ACTITUD\nRespeto mutuo hacia compañeros, trabajadores e instalaciones. La institución puede tomar medidas disciplinarias.\n\n5. RESPONSABILIDADES\n• La información de emergencia se canaliza por el coordinador.\n• Los responsables de la actividad no usan el celular durante la clase.\n• No traer objetos de valor; la institución no se hace responsable.\n• Las inquietudes se conversan con el coordinador al terminar la actividad.\n• Los padres no pueden entrar a clases ni entrenamientos.\n• La responsabilidad de los profesores termina al finalizar la actividad.\n• Daños a bienes de la institución deben ser reparados o repuestos por el miembro.'),
  norma(5, 'club', 'Normas para padres y representantes',
    '1. Son responsables del traslado de sus representados al lugar de la actividad en el horario establecido.\n2. Deben conocer y cumplir las normativas generales y específicas de cada actividad.\n3. En clases abiertas, partidos o eventos deben permanecer en las gradas o espacios para el público, sin interferir, y mantener una conducta ejemplar.\n4. No deben inmiscuirse en el trabajo de los profesionales; las sugerencias se canalizan por el departamento.'),
  norma(6, 'club', 'Reglamento de inscripciones, pagos y descuentos',
    'GENERAL\n• Las actividades son solo para miembros activos y solventes; los invitados no pueden participar salvo autorización de la Junta Directiva.\n• El socio titular y el participante deben estar solventes.\n• Las inscripciones se tramitan en Atención al Público y están abiertas de septiembre a julio.\n• Asistir sin estar inscrito genera un cargo automático de inscripción y mensualidad con 20 % de recargo.\n\nFORMATO\n• Actividades mensuales: septiembre y julio se cobra medio mes (obligatorio). Diciembre, los meses de Pésaj y Semana Santa se pagan completos (en el Gimnasio solo diciembre es obligatorio).\n• Talleres y eventos: cada uno indica duración, costo y horario.\n• El representante firma la planilla y el compromiso de pago. La inscripción no es reembolsable.\n\nCLASES DE PRUEBA\nUna única clase de prueba (se factura). Seguir asistiendo sin inscribirse genera mensualidad e inscripción con 20 % de recargo. No aplica para alumnos regulares.\n\nCOMPROMISO\nDesde el tercer trimestre no se aceptan retiros. Los retiros se hacen en Atención al Público.\n\nLAPSOS PARA PAGAR\n• Los pagos se hacen dentro de los primeros 7 días de cada mes, en Atención al Público o por medios electrónicos reportando el pago en el app o a ingresos@hebraica.com.ve.\n• Los avisos de cobro vencidos generan mensajes en portería desde el día 7; después del tercer aviso se prohíbe la entrada a la institución.\n\nDESCUENTOS\n• Actividades particulares o con profesor por porcentaje: sin descuento.\n• 10 % desde la segunda actividad, hasta tres actividades, solo en la mensualidad.\n• 10 % desde el segundo hijo, hasta tres actividades por participante.\n• Membresías con subsidio: máximo una actividad adicional por integrante.\n• No aplican en el Centro Cultural Gonzalo Benaim Pinto, Bailes Israelíes, Natación Particular ni Voleibol de Playa.\n\nCAMBIOS, RETIROS Y REINTEGROS\n• Se solicitan en el departamento durante las reinscripciones (trimestrales) o los últimos 7 días del mes anterior (mensuales), firmando la planilla de retiro.\n• Solo el departamento que organiza autoriza los cambios; se cobra o acredita la diferencia de costo.\n• El retiro no exonera los meses ya facturados. Fuera de los lapsos se paga lo facturado aunque no se asista.\n• Retiro por razones médicas: 15 días para notificar, con informe médico obligatorio.'),
  norma(7, 'club', 'Política para turistas',
    'Aplica para grupos familiares e individuales:\n• Día 1: cortesía, sin costo de cuota de mantenimiento.\n• De 2 a 7 días (primera semana): 35 % de la cuota de mantenimiento.\n• Desde el día 8: 100 % de la cuota de mantenimiento.\nNo incluye el costo de actividades adicionales.'),
  norma(8, 'club', 'Reglamento interno · Artículo 36',
    'Está prohibida la circulación en todo el recinto de Hebraica de los menores de 6 años que no estén acompañados de sus padres o representantes. Hebraica no se hace responsable por cualquier accidente que pueda ocurrir en sus dependencias, incluso en las piscinas.'),
  norma(10, 'macabilandia', 'Normas de Macabilandia',
    '• Quien asista al campamento sin estar inscrito tendrá un cargo en la membresía por el costo de la actividad con 20 % de recargo; si persiste, la Comisión de Finanzas tomará medidas.\n• Si un inscrito no puede asistir y pide el reintegro, la Comisión de Finanzas evalúa la nota de crédito con una penalización del 20 % por gastos administrativos.\n\n1. No hay días de recuperación, salvo por razones médicas con justificativo.\n2. La participación por días se paga antes de los días a disfrutar.\n3. El pago es por semana consecutiva, no por días acumulados de distintas semanas.\n4. Los participantes extranjeros o turistas siguen la misma normativa que el miembro local.'),
  norma(20, 'deportes', 'Normas de reserva de las canchas de Pádel',
    'Para el uso justo y equitativo de las canchas entre todos los miembros solventes, sin discriminación por edad o nivel de juego.\n\n1. La reserva se hace únicamente por el app de Hebraica.\n2. Solo se puede tener una reserva activa a la vez; al terminar el juego se puede reservar de nuevo.\n3. Bloques de 1 hora y media: 7:00, 8:30 y 10:00 am; 11:30 am; 1:00, 2:30, 4:00, 5:30, 7:00 y 8:30 pm (último bloque hasta las 10:00 pm).\n4. Cada bloque se reserva con un mínimo de 4 jugadores.\n5. Deben jugar las personas que aparecen en la reserva; de lo contrario se sanciona a quien reservó.\n6. Deportes puede verificar que los jugadores estén solventes y sean los que asisten.\n7. La reserva se puede modificar o cancelar hasta 2 horas antes.\n8. Quien no asista sin cancelar no podrá reservar por 72 horas. Si llueve no hay penalización.\n9. Si los jugadores no llegan, la cancha queda libre a los 15 minutos de iniciado el bloque.\n10. Incumplir las normas puede acarrear sanción de hasta 30 días sin reservar; si es recurrente, pasa a Disciplina.\n11. La Gerencia de Deportes puede bloquear horarios para Open Play, escuelas, clases privadas, clínicas, torneos o intercambios.'),
  norma(21, 'deportes', 'Información importante de Deportes',
    '• Para tenis de campo, gimnasia y natación es obligatorio presentar la evaluación del coordinador de la disciplina (indica el nivel). Sin ella Atención al Público no realiza la inscripción.\n• Uniformes: los trajes de baño y gorros se cargan a la membresía y se entregan en el Departamento de Deportes.\n• Kit de natación: tabla de aprendizaje, pull boy, chapaletas y lentes en cada clase.\n• Fútbol: las franelas y ligas se cargan a la membresía; son indispensables para entrenar y para eventos de representación.'),
  norma(22, 'deportes', 'Reglamento de Natación Particular (0 a 3 años)',
    '1. Los participantes deben estar inscritos en Atención al Público; los profesores no reciben pagos.\n2. Las mensualidades se pagan los primeros 5 días del mes.\n3. Edades: de 6 meses a 3 años y 11 meses.\n4. Día y horario a elección entre los ofrecidos por Atención al Público.\n5. Se debe cumplir el horario establecido.\n6. Clases de media hora o 1 hora, 2 veces por semana.\n7. Si el niño falta, el representante avisa al profesor; esa clase no se recupera.\n8. Si el profesor no puede dar clase, se acuerda la recuperación (también si la suspende Hebraica).\n9. Quien se retire antes de terminar el mes pierde el cupo.\n10. Los padres no deben dirigirse a su representado durante la clase y deben hablar con el profesor fuera del horario.\n11. El retiro se solicita con el formulario de Atención al Público, firmado por la coordinación.'),
  norma(30, 'gimnasio', 'Gimnasio Galsky',
    'HORARIOS\n• Lunes a jueves: 6:30 am a 8:00 pm\n• Viernes: 6:30 am a 4:00 pm\n• Sábados, domingos y feriados: 9:00 am a 3:00 pm\n\nPara todo público a partir de 13 años cumplidos.\n\n• La inscripción se paga una sola vez al ingresar; si se retira y reingresa se paga de nuevo.\n• Entrada diaria sin inscripción previa: se paga el pase del día.\n• Es obligatorio traer toalla o solicitarla en la recepción (costo adicional).\n• Lockers del vestuario principal: alquiler mensual en la recepción del gimnasio o en Atención al Público.\n\nEXONERACIÓN TEMPORAL DE INSCRIPCIÓN\n• Hijos no residentes (solteros hasta 30 años): exonerados por estadías de hasta 1 mes.\n• Arevim no residentes: exonerados hasta 1 mes.\n• Turistas y visitantes: sin inscripción el primer mes.'),
  norma(40, 'bailes', 'Bailes Israelíes',
    '• Uniforme: franela del departamento; zapatos de baile, zapatillas o descalzo; cabello recogido; short o licra negra larga o corta.\n• Para participar en el Festival Kineret la niña debe estar inscrita; la fecha límite es el 31 de enero. No se aceptan inscripciones después.\n• Para el baile “madres e hijas” la niña debe estar inscrita y bailar con su grupo.\n• No aplica ningún tipo de descuento.'),
  norma(50, 'brief_kohn', 'Actividades de adultos en el CC Brief Kohn',
    'Las funciones de cine, charlas, talleres y cursos son para el disfrute de todos los miembros por igual:\n1. La sala abre 15 minutos antes y solo se permite el ingreso hasta 10 minutos después de iniciada la actividad.\n2. Los teléfonos deben estar apagados o en silencio.\n3. No se permite ingresar ni consumir alimentos o bebidas en el auditorio.\n4. El trato amable con asistentes y personal es esencial.\n\nINSCRIPCIONES Y RETIROS\nLas inscripciones se hacen en Atención al Público. Los retiros se gestionan en las oficinas del CC Brief Kohn llenando la planilla de forma presencial; de lo contrario la mensualidad se sigue cobrando. Quien se retire y quiera volver paga la cuota de reinscripción. Los cursos abren al tener un mínimo de participantes.'),
  norma(60, 'diam', 'Círculo Edad de Oro',
    'Para adultos mayores de 65 años de la Comunidad Judía de Venezuela.\n\nINSCRIPCIÓN\nCompletar la planilla del participante, realizar la evaluación cognitiva obligatoria con un profesional y pagar la cuota mensual en Atención al Público.\n\nTRANSPORTE\n• Martes y jueves: ida 9:30 am, regreso 4:00 pm.\n• Miércoles: ida 11:30 am, regreso 4:30 pm.\n• Rutas: San Bernardino, Las Palmas, La Florida, Chacaíto, Altamira, Los Palos Grandes, Santa Eduvigis, Dos Caminos y Los Chorros (regreso por la ruta inversa).\n• Con aire acondicionado y oficial de seguridad.\n\nACTIVIDADES VARIABLES\nCharlas, mini-talleres, paseos (anual y de un día), celebración de al menos nueve Jaguim al año y jornadas de salud (dermatología, cardiología, presión arterial, medicina interna, osteoporosis, óptica, audiometría y evaluación cognitiva).'),
]

// ---------------------------------------------------------------------------
// DIRECTORIO
// ---------------------------------------------------------------------------
type NuevoContacto = Omit<Contacto, 'id' | 'created_at'>
const contacto = (orden: number, departamento: string, o: Partial<NuevoContacto>): NuevoContacto => ({
  orden, departamento, responsable: o.responsable ?? null, telefono: o.telefono ?? null, whatsapp: o.whatsapp ?? null,
  email: o.email ?? null, ubicacion: o.ubicacion ?? null, horario: o.horario ?? null,
})

export const DIRECTORIO: NuevoContacto[] = [
  contacto(1, 'Atención al Público', { responsable: 'Georgina Aular', telefono: '0424-143.1540', whatsapp: '584241431540', email: 'ingresos@hebraica.com.ve', horario: 'Lun a vie 8:00 am – 4:30 pm · Dom y feriados 8:30 am – 2:30 pm · Sáb cerrado' }),
  contacto(2, 'Admisión', { responsable: 'Nicole Bonadies', telefono: '0212-273.6707', email: 'admision@hebraica.com.ve' }),
  contacto(3, 'Administración y Finanzas', { responsable: 'Michael Elberg', email: 'ingresos@hebraica.com.ve' }),
  contacto(4, 'Seguridad', { responsable: 'Alejandro Glasermann · Sixto Urdaneta', telefono: '0212-273.6710', email: 'seguridad@hebraica.com.ve' }),
  contacto(5, 'Deportes', { responsable: 'Francisco Torres · Sandra Rosenthal', email: 'deportes@hebraica.com.ve' }),
  contacto(6, 'Gimnasio Galsky', { responsable: 'Francisco Torres · Sandra Rosenthal', telefono: '+58 412-927.9682', whatsapp: '584129279682', email: 'gimnasio@hebraica.com.ve', horario: 'Lun a jue 6:30 am – 8:00 pm · Vie 6:30 am – 4:00 pm · Sáb, dom y feriados 9:00 am – 3:00 pm' }),
  contacto(7, 'Adulto Mayor · Edad de Oro', { responsable: 'Evelyn Fuhrman · Mirtha Rojas', email: 'edaddeoro@hebraica.com.ve' }),
  contacto(8, 'Bailes Israelíes', { responsable: 'Adriana Tacher', email: 'adrianatacher@hebraica.com.ve' }),
  contacto(9, 'Centro Cultural', { responsable: 'Marcos Moreno', email: 'cultura@hebraica.com.ve' }),
  contacto(10, 'Centro Creativo Brief Kohn', { responsable: 'Iris Acker', email: 'centrobriefkohn@hebraica.com.ve' }),
  contacto(11, 'Juventud y Educación', { responsable: 'Vanessa Serfaty', email: 'juventud@hebraica.com.ve' }),
  contacto(12, 'Comunicaciones e Información', { responsable: 'Carolina Rosenthal' }),
  contacto(13, 'Eventos Institucionales', { responsable: 'Karina Beraha' }),
  contacto(14, 'Capital Humano', { responsable: 'Francy Méndez' }),
  contacto(15, 'Mantenimiento Técnico', { responsable: 'Luis Díaz' }),
  contacto(16, 'Proyecto Arevim', { responsable: 'Gilda Szlesinger' }),
]

// ---------------------------------------------------------------------------
// DATOS BANCARIOS
// ---------------------------------------------------------------------------
const TITULAR = 'Centro Social Cultural Deportivo y Religioso Hebraica A.C.'
const RIF = 'J-30737373-3'

export const DATOS_BANCARIOS: DatosBancarios = {
  cuentas: [
    { metodo: 'transferencia_bs', titulo: 'Banco Nacional de Crédito', datos: [{ k: 'Cuenta', v: '0191-0050-21-2150071626' }, { k: 'Titular', v: TITULAR }, { k: 'RIF', v: RIF }] },
    { metodo: 'transferencia_bs', titulo: 'Banco Mercantil', datos: [{ k: 'Cuenta', v: '0105-0632-80-1632125080' }, { k: 'Titular', v: TITULAR }, { k: 'RIF', v: RIF }] },
    { metodo: 'transferencia_bs', titulo: 'Banco Banesco', datos: [{ k: 'Cuenta', v: '0134-0069-51-0691020282' }, { k: 'Titular', v: TITULAR }, { k: 'RIF', v: RIF }] },
    { metodo: 'zelle', titulo: 'Zelle', datos: [{ k: 'Correo', v: 'ingresos@hebraica.com.ve' }] },
    { metodo: 'paypal', titulo: 'PayPal', datos: [{ k: 'Correo', v: 'ingresos@hebraica.com.ve' }], nota: 'Favor incluir el cargo del 5 % sobre el monto.' },
    { metodo: 'venmo', titulo: 'Venmo', datos: [{ k: 'Usuario', v: '@hebraica' }] },
    { metodo: 'pipol', titulo: 'Pipol Pay', datos: [{ k: 'Correo', v: 'ingresos@hebraica.com.ve' }] },
    { metodo: 'efectivo', titulo: 'Dólares en efectivo', datos: [{ k: 'Dónde', v: 'Banco Nacional de Crédito o caja de Atención al Público' }] },
  ],
  nota: 'En el concepto indica tu número de acción y qué estás pagando. Los pagos en bolívares se calculan a la tasa oficial del BCV.',
}

// ---------------------------------------------------------------------------
// REGLAS DE LA CANCHA DE PÁDEL (Normas de Pádel 2022)
// ---------------------------------------------------------------------------
export const REGLAS_PADEL: Partial<Instalacion> = {
  hora_apertura: '07:00',
  hora_cierre: '22:00',
  duracion_min: 90,
  max_reservas_dia: 1,
  max_reservas_activas: 1,
  cancelar_hasta_horas: 2,
  jugadores_min: 4,
  sancion_horas: 72,
  descripcion: 'Bloques de 1 hora y media con mínimo 4 jugadores. Una reserva activa a la vez. Puedes cancelar hasta 2 horas antes. Si no asistes sin cancelar no podrás reservar por 72 horas.',
}

// ---------------------------------------------------------------------------
// NOTICIAS DE EJEMPLO (las mismas que carga la migración 0011)
// ---------------------------------------------------------------------------
export const NOTICIAS_EJEMPLO = [
  { titulo: 'Hebraica volvió a decir presente en un escenario internacional', resumen: 'Tres jóvenes nadadoras representaron a Hebraica y a la Kehilá en una competencia internacional.', contenido: 'Tres jóvenes nadadoras representaron a Hebraica y a la Kehilá en una competencia internacional. ¡Felicitaciones a nuestras atletas, a sus entrenadores y a sus familias por su esfuerzo y dedicación!', departamento: 'club', destacado: true, hace: 1 },
  { titulo: 'Hebraica ofreció tres semanas de Actividades Recreativas para acompañar a las familias', resumen: 'Un espacio de encuentro y contención para las familias en un momento de especial sensibilidad.', contenido: 'Durante tres semanas Hebraica ofreció actividades recreativas para acompañar a las familias en un momento de especial sensibilidad. Gracias a todo el equipo y a los voluntarios que lo hicieron posible.', departamento: 'club', destacado: false, hace: 4 },
  { titulo: 'Con gratitud y emoción, Hebraica despidió a la delegación israelí', resumen: 'La delegación acompañó a Venezuela en uno de los momentos más difíciles.', contenido: 'Con gratitud y emoción, Hebraica despidió a la delegación israelí que acompañó a Venezuela en uno de los momentos más difíciles. Gracias por su compromiso y solidaridad.', departamento: 'club', destacado: false, hace: 8 },
  { titulo: 'Unidos en Comunidad celebramos la Gran Fiesta de Purim', resumen: 'Disfraces, música y alegría para toda la familia.', contenido: 'Unidos en comunidad celebramos la Gran Fiesta de Purim con disfraces, música, juegos y mucha alegría para toda la familia. ¡Gracias a todos por acompañarnos!', departamento: 'club', destacado: false, hace: 12 },
  { titulo: 'XXXII Torneo de Escuelas Deportivas Hebraica 2026 – Copa BNC', resumen: 'Nuestras escuelas deportivas compitieron en una nueva edición del torneo.', contenido: 'Se celebró el XXXII Torneo de Escuelas Deportivas Hebraica 2026 – Copa BNC, con la participación de nuestros atletas de todas las categorías. ¡Felicitaciones a todos los participantes!', departamento: 'deportes', destacado: false, hace: 15 },
]

/** Términos que el socio acepta al registrar un invitado. */
export const TERMINOS_INVITADOS = [
  'El socio que invita es responsable de la conducta de su invitado y de cualquier daño que ocasione dentro de la institución.',
  'El invitado debe presentar en portería el código QR del pase y el documento de identidad indicado.',
  'El pase es personal, válido solo para la fecha indicada y para un único ingreso.',
  'Los invitados no pueden participar en actividades, academias ni competencias, salvo autorización de la Junta Directiva.',
  'El invitado debe cumplir las normas del club. Seguridad puede negar el ingreso o retirar a quien no las cumpla.',
  'Los datos del invitado se usan solo para el control de acceso.',
]
