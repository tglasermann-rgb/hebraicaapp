import { format } from 'date-fns'
import { limpiarUsuario, USUARIO_VALIDO, type Backend, type Filtro, type Sesion } from './backend'
import { obtenerTasaOficial } from './bcv'
import { semilla, type DB } from './demoSeed'
import type { Tabla, Tablas } from './types'

// Modo demo: replica las reglas de supabase/migrations en el navegador para poder probar el app sin servidor.

const CLAVE_DB = 'mi-hebraica-demo-v5'
const CLAVE_SESION = 'mi-hebraica-demo-sesion'

function cargar(): DB {
  try {
    const raw = localStorage.getItem(CLAVE_DB)
    if (raw) return JSON.parse(raw)
  } catch {
    /* almacenamiento no disponible */
  }
  return semilla()
}

const id = () => crypto.randomUUID()
const hoy = () => format(new Date(), 'yyyy-MM-dd')
const espera = () => new Promise((r) => setTimeout(r, 150))

export function crearDemoBackend(): Backend {
  let db = cargar()
  const guardar = () => {
    try {
      localStorage.setItem(CLAVE_DB, JSON.stringify(db))
    } catch {
      /* lleno o bloqueado: se mantiene en memoria */
    }
  }
  // En demo se intenta usar la tasa BCV real del día (si hay internet); si no, queda la de ejemplo
  obtenerTasaOficial()
    .then((t) => {
      db.tasas = [{ id: 'bcv-' + t.fecha, fecha: t.fecha, bs_por_usd: t.valor, created_at: new Date().toISOString() }, ...db.tasas.filter((x) => x.fecha !== t.fecha)]
      guardar()
    })
    .catch(() => {})
  let sesion: Sesion | null = null
  try {
    sesion = JSON.parse(localStorage.getItem(CLAVE_SESION) ?? 'null')
  } catch {
    sesion = null
  }
  const oyentes = new Set<(s: Sesion | null) => void>()
  const fijarSesion = (s: Sesion | null) => {
    sesion = s
    try {
      if (s) localStorage.setItem(CLAVE_SESION, JSON.stringify(s))
      else localStorage.removeItem(CLAVE_SESION)
    } catch {
      /* ignorar */
    }
    oyentes.forEach((cb) => cb(s))
  }

  const yo = () => {
    const s = db.socios.find((x) => sesion && x.user_id === sesion.userId)
    if (!s) throw new Error('No autenticado')
    return s
  }
  const tabla = <T extends Tabla>(t: T) => db[t] as any[]
  const usados = new Set<string>() // tokens de carnet ya escaneados
  const tokensRecuperacion = new Map<string, string>() // token → userId (demo)

  // Historial de cambios (en producción lo hace un trigger en la base de datos)
  const AUDITADAS = new Set(['socios', 'registros', 'cargos', 'pagos', 'tasas', 'instalaciones', 'actividades', 'eventos', 'noticias', 'clases', 'encuestas', 'configuracion', 'solicitudes', 'directorio', 'restaurantes', 'albumes'])
  const auditar = (t: string, op: 'INSERT' | 'UPDATE' | 'DELETE', antes: any, despues: any) => {
    if (!AUDITADAS.has(t)) return
    const s = db.socios.find((x) => sesion && x.user_id === sesion.userId)
    db.auditoria.unshift({
      id: String(Date.now() + Math.random()), tabla: t, registro_id: (despues ?? antes)?.id ?? null, operacion: op,
      antes: antes ? { ...antes } : null, despues: despues ? { ...despues } : null,
      socio_id: s?.id ?? null, usuario: s ? `${s.nombre} ${s.apellido}` : 'Sistema', created_at: new Date().toISOString(),
    })
    db.auditoria = db.auditoria.slice(0, 500)
  }

  // Recordatorios automáticos (en producción los genera pg_cron cada mañana)
  const generarRecordatorios = () => {
    const hoy = format(new Date(), 'yyyy-MM-dd')
    const mas = (n: number) => format(new Date(Date.now() + n * 864e5), 'yyyy-MM-dd')
    const ahora = new Date().toISOString()
    const avisar = (clave: string, n: Omit<Tablas['notificaciones'], 'id' | 'created_at' | 'clave'>) => {
      if (db.notificaciones.some((x) => x.clave === clave)) return
      db.notificaciones.unshift({ ...n, id: id(), clave, created_at: ahora })
    }
    for (const c of db.cargos.filter((c) => c.estado === 'pendiente' && c.vence)) {
      if (c.vence === mas(3)) avisar('vence3:' + c.id, { titulo: 'Tu pago vence pronto', cuerpo: `${c.concepto} ($${c.monto_usd}) vence en 3 días.`, destino: 'accion', accion: c.accion, socio_id: null, enlace: '/cuenta' })
      if (c.vence! < hoy) avisar('vencido:' + c.id, { titulo: 'Tienes un pago vencido', cuerpo: `${c.concepto} venció. Puedes pagarlo desde el app.`, destino: 'accion', accion: c.accion, socio_id: null, enlace: '/cuenta' })
    }
    for (const r of db.reservas.filter((r) => r.estado === 'confirmada' && r.fecha === mas(1))) {
      const i = db.instalaciones.find((x) => x.id === r.instalacion_id)
      avisar('reserva:' + r.id, { titulo: 'Tu reserva es mañana', cuerpo: `${i?.nombre} mañana a las ${r.hora_inicio}.`, destino: 'socio', accion: null, socio_id: r.socio_id, enlace: '/reservas' })
    }
    for (const r of db.reservas_clase.filter((r) => r.estado === 'confirmada')) {
      const c = db.clases.find((x) => x.id === r.clase_id)
      if (c && format(new Date(c.inicio), 'yyyy-MM-dd') === mas(1))
        avisar('clase:' + r.id, { titulo: 'Tu clase es mañana', cuerpo: `${c.nombre} mañana a las ${format(new Date(c.inicio), 'h:mm a')}.`, destino: 'socio', accion: null, socio_id: r.socio_id, enlace: '/clases' })
    }
  }
  generarRecordatorios()

  // Inscripciones sin pagar: se liberan a las 48 h si no hay un pago en revisión o aprobado (en producción, pg_cron)
  const liberarInscripciones = () => {
    const limite = Date.now() - 48 * 3600e3
    for (const i of db.inscripciones) {
      if (i.estado !== 'pendiente_pago' || new Date(i.created_at).getTime() > limite) continue
      if (db.pagos.some((p) => p.estado !== 'rechazado' && p.cargo_ids?.includes(i.cargo_id!))) continue
      i.estado = 'cancelada'
      db.cargos = db.cargos.filter((c) => !(c.id === i.cargo_id && c.estado === 'pendiente'))
    }
  }
  // Cargo pagado → inscripción confirmada (en producción, el trigger confirmar_inscripcion)
  const confirmarInscripciones = () => {
    for (const i of db.inscripciones.filter((x) => x.estado === 'pendiente_pago')) {
      if (db.cargos.find((c) => c.id === i.cargo_id)?.estado !== 'pagado') continue
      i.estado = 'activa'
      const so = db.socios.find((x) => x.id === i.socio_id)
      const a = db.actividades.find((x) => x.id === i.actividad_id)
      db.notificaciones.unshift({ id: id(), titulo: '¡Inscripción confirmada!', cuerpo: `${so?.nombre} quedó inscrito en ${a?.nombre}.`, destino: 'socio', accion: null, socio_id: i.socio_id, enlace: `/actividades/${i.actividad_id}`, created_at: new Date().toISOString() })
    }
  }

  const backend: Backend = {
    modo: 'demo',

    async sesionActual() {
      return sesion
    },
    alCambiarSesion(cb) {
      oyentes.add(cb)
      return () => oyentes.delete(cb)
    },
    async entrar(usuario, clave) {
      await espera()
      const uid = db.usuarios[limpiarUsuario(usuario)]
      if (!uid || db.claves[uid] !== clave) throw new Error('Usuario o contraseña incorrectos')
      fijarSesion({ userId: uid, email: limpiarUsuario(usuario) })
    },
    async registrar(d) {
      await espera()
      const usuario = limpiarUsuario(d.usuario)
      if (!USUARIO_VALIDO.test(usuario)) throw new Error('El usuario debe tener de 3 a 30 letras o números (sin espacios)')
      if (db.usuarios[usuario]) throw new Error('Ese usuario ya existe. Elige otro.')
      const cedula = d.cedula.replace(/\D/g, '')
      if (db.registros.some((x) => x.cedula === cedula && x.estado === 'pendiente')) throw new Error('Ya hay una solicitud en revisión con esa cédula.')
      const uid = id()
      db.usuarios[usuario] = uid
      db.claves[uid] = d.clave
      db.registros.push({ id: id(), user_id: uid, nombre: d.nombre.trim(), apellido: d.apellido.trim(), cedula, usuario, email: d.email.trim().toLowerCase(), estado: 'pendiente', motivo: null, socio_id: null, created_at: new Date().toISOString() })
      guardar()
      fijarSesion({ userId: uid, email: usuario })
    },
    async miRegistro() {
      return db.registros.find((x) => sesion && x.user_id === sesion.userId) ?? null
    },
    async reenviarRegistro(d) {
      if (!sesion) throw new Error('No autenticado')
      let r = db.registros.find((x) => x.user_id === sesion!.userId)
      if (!r) {
        const usuario = Object.entries(db.usuarios).find(([, u]) => u === sesion!.userId)?.[0] ?? sesion.userId
        r = { id: id(), created_at: new Date().toISOString(), user_id: sesion.userId, usuario, nombre: '', apellido: '', cedula: '', email: null, estado: 'pendiente', motivo: null, socio_id: null }
        db.registros.push(r)
      }
      Object.assign(r, { nombre: d.nombre.trim(), apellido: d.apellido.trim(), cedula: d.cedula.replace(/\D/g, ''), email: d.email.trim().toLowerCase(), estado: 'pendiente', motivo: null })
      guardar()
      fijarSesion(sesion)
    },
    async cambiarClave(nueva) {
      if (!sesion) throw new Error('No autenticado')
      db.claves[sesion.userId] = nueva
      guardar()
    },
    async salir() {
      fijarSesion(null)
    },
    async miSocio() {
      return db.socios.find((x) => sesion && x.user_id === sesion.userId) ?? null
    },

    async listar(t, f: Filtro<any> = {}) {
      await espera()
      let filas = [...tabla(t)]
      for (const [k, v] of Object.entries(f.eq ?? {})) filas = filas.filter((r) => (r[k] ?? null) === v)
      for (const [k, v] of Object.entries(f.in ?? {})) filas = filas.filter((r) => (v as any[]).includes(r[k]))
      for (const [k, v] of Object.entries(f.gte ?? {})) filas = filas.filter((r) => r[k] >= (v as any))
      for (const [k, v] of Object.entries(f.lte ?? {})) filas = filas.filter((r) => r[k] <= (v as any))
      if (f.orden) {
        const { campo, asc = true } = f.orden
        filas.sort((a, b) => (a[campo] > b[campo] ? 1 : a[campo] < b[campo] ? -1 : 0) * (asc ? 1 : -1))
      }
      if (f.limite) filas = filas.slice(0, f.limite)
      return filas
    },
    async obtener(t, rid) {
      await espera()
      return tabla(t).find((r) => r.id === rid) ?? null
    },
    async crear(t, datos) {
      await espera()
      const fila: any = { id: id(), created_at: new Date().toISOString(), ...datos }
      if (t === 'invitados' || t === 'entradas') fila.codigo ??= id().replace(/-/g, '').slice(0, 24)
      if (t === 'solicitudes') fila.updated_at = fila.created_at
      if (t === 'noticias') fila.publicado_en ??= fila.created_at
      tabla(t).push(fila)
      auditar(t, 'INSERT', null, fila)
      guardar()
      return fila
    },
    async actualizar(t, rid, datos) {
      await espera()
      const fila = tabla(t).find((r) => r.id === rid)
      if (!fila) throw new Error('No encontrado')
      const antes = { ...fila }
      Object.assign(fila, datos)
      auditar(t, 'UPDATE', antes, fila)
      if (t === 'cargos') confirmarInscripciones()
      guardar()
      return fila
    },
    async eliminar(t, rid) {
      await espera()
      auditar(t, 'DELETE', tabla(t).find((r) => r.id === rid), null)
      ;(db as any)[t] = tabla(t).filter((r) => r.id !== rid)
      guardar()
    },

    async crearVarios(t, filas) {
      for (const f of filas) await backend.crear(t, f)
      return filas.length
    },

    async emitirTokenCarnet(socioId) {
      if (socioId !== yo().id) throw new Error('Solo puedes ver tu propio carnet')
      const expira = new Date(Date.now() + 30_000).toISOString()
      // En demo el token lleva el id y la expiración (en producción es aleatorio y vive en la BD)
      return { token: `${socioId}.${Date.parse(expira)}.${id().slice(0, 8)}`, expira }
    },
    async validarCodigo(codigo) {
      await espera()
      const [pre, tipo, val] = codigo.split(':')
      const log = (t: any, nombre: string | undefined, ok: boolean, motivo: string) => {
        db.accesos.unshift({ id: id(), tipo: t, referencia_id: null, nombre: nombre ?? null, resultado: ok ? 'permitido' : 'denegado', motivo, created_at: new Date().toISOString() })
        guardar()
      }
      if (pre !== 'HEB') return { valido: false, tipo: 'desconocido', mensaje: 'Código no reconocido' }
      if (tipo === 'S') {
        const [sid, exp] = val.split('.')
        const s = db.socios.find((x) => x.id === sid)
        if (usados.has(val)) {
          log('socio', s?.nombre, false, 'Código ya usado')
          return { valido: false, tipo: 'socio', nombre: s ? `${s.nombre} ${s.apellido}` : undefined, mensaje: 'Este código ya fue usado. Posible captura de pantalla.' }
        }
        usados.add(val)
        if (!s || Number(exp) < Date.now()) {
          log('socio', s?.nombre, false, 'Carnet vencido')
          return { valido: false, tipo: 'socio', mensaje: 'Carnet vencido. Pida al socio abrir el carnet de nuevo.' }
        }
        const nombre = `${s.nombre} ${s.apellido}`
        const ok = s.estado === 'activo'
        log('socio', nombre, ok, ok ? 'Acceso permitido' : 'Socio suspendido')
        return { valido: ok, tipo: 'socio', nombre, detalle: `Acción ${s.accion}`, foto_url: s.foto_url, mensaje: ok ? 'Acceso permitido' : 'Socio suspendido. Dirigir a Atención al Público.' }
      }
      if (tipo === 'I') {
        const i = db.invitados.find((x) => x.codigo === val)
        if (!i) return { valido: false, tipo: 'invitado', mensaje: 'Pase no encontrado' }
        let msg = 'Acceso permitido'
        let ok = true
        if (i.estado !== 'activo') [ok, msg] = [false, `Pase ${i.estado}`]
        else if (i.fecha !== hoy()) [ok, msg] = [false, `El pase es para el ${i.fecha.split('-').reverse().join('/')}`]
        if (ok) i.estado = 'usado'
        log('invitado', i.nombre, ok, msg)
        return { valido: ok, tipo: 'invitado', nombre: i.nombre, detalle: `C.I. ${i.cedula} · Invitado de la acción ${i.accion}`, mensaje: msg }
      }
      if (tipo === 'E') {
        const e = db.entradas.find((x) => x.codigo === val)
        if (!e) return { valido: false, tipo: 'entrada', mensaje: 'Entrada no encontrada' }
        const ev = db.eventos.find((x) => x.id === e.evento_id)
        const ok = e.estado === 'activa'
        if (ok) e.estado = 'usada'
        log('entrada', e.nombre_asistente, ok, ok ? 'Entrada válida' : `Entrada ${e.estado}`)
        return { valido: ok, tipo: 'entrada', nombre: e.nombre_asistente, detalle: ev?.titulo, mensaje: ok ? 'Entrada válida' : `Entrada ${e.estado}` }
      }
      return { valido: false, tipo: 'desconocido', mensaje: 'Código no reconocido' }
    },
    async horariosOcupados(instalacionId, fecha) {
      await espera()
      return db.reservas.filter((r) => r.instalacion_id === instalacionId && r.fecha === fecha && r.estado === 'confirmada').map((r) => r.hora_inicio)
    },
    async reservar(instalacionId, fecha, hora, socioId, jugadores = []) {
      await espera()
      const s = yo()
      const inst = db.instalaciones.find((x) => x.id === instalacionId)!
      const inicio = (r: { fecha: string; hora_inicio: string }) => new Date(`${r.fecha}T${r.hora_inicio}:00`)
      if (inicio({ fecha, hora_inicio: hora }) <= new Date()) throw new Error('Ese horario ya pasó')
      const jug = jugadores.map((x) => x.trim()).filter(Boolean)
      if (inst.jugadores_min && jug.length < inst.jugadores_min) throw new Error(`Debes indicar al menos ${inst.jugadores_min} jugadores`)
      const mismoTipo = db.reservas.filter((r) => r.accion === s.accion && db.instalaciones.find((i) => i.id === r.instalacion_id)?.tipo === inst.tipo)
      if (inst.sancion_horas && mismoTipo.some((r) => r.estado === 'no_asistio' && inicio(r).getTime() + inst.sancion_horas! * 36e5 > Date.now()))
        throw new Error(`Por no asistir a una reserva sin cancelarla, no puedes reservar ${inst.tipo.toLowerCase()} por ${inst.sancion_horas} horas`)
      if (inst.max_reservas_activas && mismoTipo.filter((r) => r.estado === 'confirmada' && inicio(r).getTime() + inst.duracion_min * 6e4 > Date.now()).length >= inst.max_reservas_activas)
        throw new Error(`Ya tienes una reserva activa de ${inst.tipo.toLowerCase()}. Podrás reservar otra cuando termine.`)
      const mias = db.reservas.filter((r) => r.instalacion_id === instalacionId && r.fecha === fecha && r.accion === s.accion && r.estado === 'confirmada')
      if (mias.length >= inst.max_reservas_dia) throw new Error('Su acción ya alcanzó el máximo de reservas de este día')
      if (db.reservas.some((r) => r.instalacion_id === instalacionId && r.fecha === fecha && r.hora_inicio === hora && r.estado === 'confirmada'))
        throw new Error('Ese horario acaba de ser reservado por otro socio')
      db.reservas.push({ id: id(), instalacion_id: instalacionId, socio_id: socioId, accion: s.accion!, fecha, hora_inicio: hora, jugadores: jug, estado: 'confirmada', created_at: new Date().toISOString() })
      guardar()
    },
    async cancelarReserva(reservaId) {
      await espera()
      const r = db.reservas.find((x) => x.id === reservaId)
      if (!r || r.estado !== 'confirmada') throw new Error('Reserva no encontrada')
      const inst = db.instalaciones.find((x) => x.id === r.instalacion_id)!
      const staff = ['admin', 'deportes'].includes(yo().rol)
      if (!staff && inst.cancelar_hasta_horas && new Date(`${r.fecha}T${r.hora_inicio}:00`).getTime() - inst.cancelar_hasta_horas * 36e5 < Date.now())
        throw new Error(`Solo se puede cancelar hasta ${inst.cancelar_hasta_horas} horas antes`)
      r.estado = 'cancelada'
      guardar()
    },
    async inscribir(actividadId, socioId) {
      await espera()
      const s = yo()
      const act = db.actividades.find((x) => x.id === actividadId)!
      const p = db.socios.find((x) => x.id === socioId)!
      if (!act.inscripciones_abiertas) throw new Error('Inscripciones cerradas')
      liberarInscripciones()
      const vigentes = db.inscripciones.filter((x) => x.actividad_id === actividadId && x.estado !== 'cancelada')
      const mia = vigentes.find((x) => x.socio_id === socioId)
      if (mia?.estado === 'activa') throw new Error(`${p.nombre} ya está inscrito en esta actividad`)
      if (mia) return mia.cargo_id
      if (act.cupo != null && vigentes.length >= act.cupo) throw new Error('No quedan cupos disponibles')
      const ahora = new Date().toISOString()
      let cargo: string | null = null
      if (act.precio_usd > 0) {
        cargo = id()
        db.cargos.push({ id: cargo, accion: s.accion!, concepto: `Inscripción: ${act.nombre} (${p.nombre})`, monto_usd: act.precio_usd, fecha: hoy(), vence: format(new Date(Date.now() + 2 * 864e5), 'yyyy-MM-dd'), tipo: 'actividad', estado: 'pendiente', created_at: ahora })
      }
      db.inscripciones.push({ id: id(), actividad_id: actividadId, socio_id: socioId, accion: s.accion!, estado: cargo ? 'pendiente_pago' : 'activa', cargo_id: cargo, created_at: ahora })
      guardar()
      return cargo
    },
    async cancelarInscripcion(inscripcionId) {
      await espera()
      const i = db.inscripciones.find((x) => x.id === inscripcionId)
      const staff = ['admin', 'deportes', 'eventos', 'administracion'].includes(yo().rol)
      if (!i || (i.accion !== yo().accion && !staff)) throw new Error('No encontrada')
      if (i.estado === 'cancelada') throw new Error('La inscripción ya fue cancelada')
      if (db.cargos.some((c) => c.id === i.cargo_id && c.estado === 'pagado')) throw new Error('Esta inscripción ya está pagada y no se puede borrar')
      if (db.pagos.some((p) => p.estado === 'pendiente' && p.cargo_ids?.includes(i.cargo_id!))) throw new Error('Hay un pago en revisión para esta inscripción; espera la respuesta de Administración')
      i.estado = 'cancelada'
      db.cargos = db.cargos.filter((c) => !(c.id === i.cargo_id && c.estado === 'pendiente'))
      guardar()
    },
    async comprarEntradas(eventoId, asistentes) {
      await espera()
      const s = yo()
      const ev = db.eventos.find((x) => x.id === eventoId)!
      const vendidas = db.entradas.filter((e) => e.evento_id === eventoId && e.estado !== 'anulada')
      if (ev.aforo != null && vendidas.length + asistentes.length > ev.aforo) throw new Error(`Solo quedan ${ev.aforo - vendidas.length} entradas`)
      const mias = vendidas.filter((e) => e.accion === s.accion).length
      if (ev.max_por_accion != null && mias + asistentes.length > ev.max_por_accion) throw new Error(`Máximo ${ev.max_por_accion} entradas por acción`)
      const ahora = new Date().toISOString()
      for (const n of asistentes)
        db.entradas.push({ id: id(), evento_id: eventoId, socio_id: s.id, accion: s.accion!, nombre_asistente: n.trim(), codigo: id().replace(/-/g, '').slice(0, 24), estado: 'activa', created_at: ahora })
      if (ev.precio_usd > 0)
        db.cargos.push({ id: id(), accion: s.accion!, concepto: `${asistentes.length} entrada(s): ${ev.titulo}`, monto_usd: ev.precio_usd * asistentes.length, fecha: hoy(), vence: null, tipo: 'evento', estado: 'pendiente', created_at: ahora })
      guardar()
    },
    async recuperarClave(usuario) {
      await espera()
      const s = db.socios.find((x) => x.usuario === limpiarUsuario(usuario))
      if (!s?.user_id || !s.email) return null // igual que en producción: no revela si existe
      const token = id()
      tokensRecuperacion.set(token, s.user_id)
      return `#/nueva-clave?token_hash=${token}` // en producción este enlace llega por correo
    },
    async verificarRecuperacion(tokenHash) {
      await espera()
      const uid = tokensRecuperacion.get(tokenHash)
      if (!uid) throw new Error('El enlace venció o ya fue usado. Pide uno nuevo.')
      tokensRecuperacion.delete(tokenHash)
      fijarSesion({ userId: uid, email: '' })
    },
    async restablecerClaveAdmin(socioId) {
      await espera()
      const s = db.socios.find((x) => x.id === socioId)
      if (!s?.user_id) throw new Error('Este socio todavía no tiene usuario en el app')
      const clave = 'Heb-' + id().replace(/-/g, '').slice(0, 8)
      db.claves[s.user_id] = clave
      guardar()
      return clave
    },
    async ocupacionClases(desde, hasta) {
      await espera()
      return db.clases
        .filter((c) => c.inicio >= desde && c.inicio <= hasta)
        .map((c) => {
          const rs = db.reservas_clase.filter((r) => r.clase_id === c.id)
          return { clase_id: c.id, confirmados: rs.filter((r) => r.estado === 'confirmada').length, en_espera: rs.filter((r) => r.estado === 'espera').length }
        })
    },
    async reservarClase(claseId, socioId) {
      await espera()
      const yo_ = yo()
      const c = db.clases.find((x) => x.id === claseId)
      if (!c || c.cancelada) throw new Error('Clase no disponible')
      if (new Date(c.inicio) < new Date()) throw new Error('La clase ya comenzó')
      if (db.reservas_clase.some((r) => r.clase_id === claseId && r.socio_id === socioId && r.estado !== 'cancelada')) throw new Error('Ya tiene un puesto en esta clase')
      const conf = db.reservas_clase.filter((r) => r.clase_id === claseId && r.estado === 'confirmada').length
      const estado = conf < c.cupo ? 'confirmada' : 'espera'
      db.reservas_clase.push({ id: id(), clase_id: claseId, socio_id: socioId, accion: yo_.accion!, estado, created_at: new Date().toISOString() })
      guardar()
      return estado
    },
    async cancelarReservaClase(reservaId) {
      await espera()
      const r = db.reservas_clase.find((x) => x.id === reservaId)
      if (!r || r.estado === 'cancelada') throw new Error('Reserva no encontrada')
      const c = db.clases.find((x) => x.id === r.clase_id)!
      const eraConfirmada = r.estado === 'confirmada'
      r.estado = 'cancelada'
      if (eraConfirmada) {
        const sig = db.reservas_clase.filter((x) => x.clase_id === r.clase_id && x.estado === 'espera').sort((a, b) => a.created_at.localeCompare(b.created_at))[0]
        if (sig) {
          sig.estado = 'confirmada'
          db.notificaciones.unshift({ id: id(), titulo: '¡Tienes puesto en la clase!', cuerpo: `Se liberó un cupo en ${c.nombre}. Ya estás confirmado.`, destino: 'socio', accion: null, socio_id: sig.socio_id, enlace: '/clases', clave: 'promovido:' + sig.id, created_at: new Date().toISOString() })
        }
      }
      guardar()
    },
    async votar(encuestaId, opcion, comentario) {
      await espera()
      const s = yo()
      const e = db.encuestas.find((x) => x.id === encuestaId)
      if (!e || !e.abierta) throw new Error('La encuesta está cerrada')
      if (db.votos.some((v) => v.encuesta_id === encuestaId && v.socio_id === s.id)) throw new Error('Ya votaste en esta encuesta')
      db.votos.push({ id: id(), encuesta_id: encuestaId, socio_id: s.id, opcion, comentario: comentario.trim() || null, created_at: new Date().toISOString() })
      guardar()
    },
    async resultadosEncuesta(encuestaId) {
      await espera()
      const cuenta = new Map<number, number>()
      for (const v of db.votos.filter((v) => v.encuesta_id === encuestaId)) cuenta.set(v.opcion, (cuenta.get(v.opcion) ?? 0) + 1)
      return [...cuenta.entries()].sort((a, b) => a[0] - b[0]).map(([opcion, votos]) => ({ opcion, votos }))
    },
    async estadisticas() {
      await espera()
      const hoy = format(new Date(), 'yyyy-MM-dd')
      const socios = db.socios.filter((s) => s.rol === 'socio')
      const pend = db.cargos.filter((c) => c.estado === 'pendiente')
      const venc = pend.filter((c) => c.vence && c.vence < hoy)
      const contar = <T,>(l: T[], k: (x: T) => string | number) => {
        const m = new Map<string | number, number>()
        l.forEach((x) => m.set(k(x), (m.get(k(x)) ?? 0) + 1))
        return m
      }
      const permitidos = db.accesos.filter((a) => a.resultado === 'permitido')
      const porMetodo = new Map<string, { total: number; monto: number }>()
      db.pagos.filter((p) => p.estado === 'aprobado').forEach((p) => {
        const x = porMetodo.get(p.metodo) ?? { total: 0, monto: 0 }
        porMetodo.set(p.metodo, { total: x.total + 1, monto: x.monto + Number(p.monto_usd) })
      })
      return {
        socios: socios.length,
        socios_con_app: socios.filter((s) => s.user_id).length,
        acciones: new Set(socios.map((s) => s.accion)).size,
        acciones_morosas: new Set(venc.map((c) => c.accion)).size,
        monto_moroso: venc.reduce((t, c) => t + Number(c.monto_usd), 0),
        monto_pendiente: pend.reduce((t, c) => t + Number(c.monto_usd), 0),
        accesos_por_hora: [...contar(permitidos, (a) => new Date(a.created_at).getHours())].map(([hora, total]) => ({ hora: Number(hora), total })).sort((a, b) => a.hora - b.hora),
        accesos_por_dia: [...contar(permitidos, (a) => ((new Date(a.created_at).getDay() + 6) % 7) + 1)].map(([dia, total]) => ({ dia: Number(dia), total })),
        pagos_por_metodo: [...porMetodo].map(([metodo, v]) => ({ metodo: metodo as any, ...v })),
        reservas_por_instalacion: [...contar(db.reservas.filter((r) => r.estado === 'confirmada'), (r) => db.instalaciones.find((i) => i.id === r.instalacion_id)?.nombre ?? '')]
          .map(([nombre, total]) => ({ nombre: String(nombre), total })).sort((a, b) => b.total - a.total),
      }
    },
    async aprobarRegistro(registroId, accion, parentesco) {
      await espera()
      const r = db.registros.find((x) => x.id === registroId && x.estado === 'pendiente')
      if (!r) throw new Error('La solicitud ya fue procesada')
      let s = db.socios.find((x) => x.cedula === r.cedula)
      if (s?.user_id) throw new Error('Esa cédula ya tiene un usuario activo')
      if (!s) {
        if (!accion.trim()) throw new Error('Indica el número de acción')
        s = { id: id(), user_id: null, usuario: null, accion: accion.trim(), cedula: r.cedula, nombre: r.nombre, apellido: r.apellido, email: null, telefono: null, parentesco: (parentesco || 'titular') as any, fecha_nacimiento: null, foto_url: null, estado: 'activo', rol: 'socio', created_at: new Date().toISOString() }
        db.socios.push(s)
      }
      s.user_id = r.user_id
      s.usuario = r.usuario
      s.email = r.email ?? s.email
      r.estado = 'aprobado'
      r.socio_id = s.id
      auditar('registros', 'UPDATE', { ...r, estado: 'pendiente' }, r)
      db.notificaciones.unshift({ id: id(), titulo: '¡Bienvenido a Mi Hebraica!', cuerpo: 'Tu cuenta fue aprobada. Ya puedes usar tu carnet digital.', destino: 'socio', accion: null, socio_id: s.id, enlace: '/carnet', created_at: new Date().toISOString() })
      guardar()
    },
    async rechazarRegistro(registroId, motivo) {
      await espera()
      const r = db.registros.find((x) => x.id === registroId && x.estado === 'pendiente')
      if (!r) throw new Error('La solicitud ya fue procesada')
      r.estado = 'rechazado'
      r.motivo = motivo.trim() || null
      guardar()
    },
    async eliminarCuenta(userId) {
      await espera()
      if (db.socios.some((s) => s.user_id === userId)) throw new Error('Esta cuenta pertenece a un socio aprobado; desactívalo desde Socios')
      db.registros = db.registros.filter((r) => r.user_id !== userId)
      for (const [u, uid] of Object.entries(db.usuarios)) if (uid === userId) delete db.usuarios[u]
      delete db.claves[userId]
      guardar()
    },
    async cuentasIncompletas() {
      await espera()
      return Object.entries(db.usuarios)
        .filter(([, uid]) => !db.registros.some((r) => r.user_id === uid) && !db.socios.some((s) => s.user_id === uid))
        .map(([usuario, uid]) => ({ user_id: uid, usuario, creada: null }))
    },
    async revisarPago(pagoId, aprobado, nota) {
      await espera()
      const p = db.pagos.find((x) => x.id === pagoId)
      if (!p || p.estado !== 'pendiente') throw new Error('El pago ya fue procesado')
      const antesPago = { ...p }
      p.estado = aprobado ? 'aprobado' : 'rechazado'
      auditar('pagos', 'UPDATE', antesPago, p)
      if (aprobado) for (const c of db.cargos) if (p.cargo_ids?.includes(c.id) && c.accion === p.accion) c.estado = 'pagado'
      confirmarInscripciones()
      p.nota_admin = nota || null
      db.notificaciones.unshift({
        id: id(), titulo: aprobado ? 'Pago aprobado' : 'Pago rechazado',
        cuerpo: `Su pago con referencia ${p.referencia} ${aprobado ? 'fue aprobado.' : `fue rechazado. ${nota}`}`,
        destino: 'accion', accion: p.accion, socio_id: null, enlace: '/cuenta', created_at: new Date().toISOString(),
      })
      guardar()
    },
    async paseInvitado(codigo) {
      await espera()
      const i = db.invitados.find((x) => x.codigo === codigo)
      if (!i) return null
      const s = db.socios.find((x) => x.id === i.socio_id)
      return { nombre: i.nombre, fecha: i.fecha, estado: i.estado, anfitrion: s ? `${s.nombre} ${s.apellido}` : '' }
    },
    async subirArchivo(_bucket, archivo) {
      return await reducirImagen(archivo)
    },
    async urlArchivo(_bucket, ruta) {
      return ruta
    },
  }
  return backend
}

/** En demo las imágenes se guardan como data URL reducidas para no llenar el almacenamiento. */
async function reducirImagen(archivo: File): Promise<string> {
  if (!archivo.type.startsWith('image/')) return URL.createObjectURL(archivo)
  const bmp = await createImageBitmap(archivo)
  const escala = Math.min(1, 900 / Math.max(bmp.width, bmp.height))
  const c = document.createElement('canvas')
  c.width = Math.round(bmp.width * escala)
  c.height = Math.round(bmp.height * escala)
  c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height)
  return c.toDataURL('image/jpeg', 0.75)
}

export function reiniciarDemo() {
  localStorage.removeItem(CLAVE_DB)
  localStorage.removeItem(CLAVE_SESION)
  location.reload()
}
