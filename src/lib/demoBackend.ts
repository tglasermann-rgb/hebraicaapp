import { format } from 'date-fns'
import type { Backend, Filtro, Sesion } from './backend'
import { semilla, type DB } from './demoSeed'
import type { Tabla } from './types'

// Modo demo: replica las reglas de supabase/migrations en el navegador para poder probar el app sin servidor.

const CLAVE_DB = 'mi-hebraica-demo-v1'
const CLAVE_SESION = 'mi-hebraica-demo-sesion'
const CODIGO_DEMO = '123456'

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

  const buscar = (accion: string, cedula: string) => {
    const s = db.socios.find((x) => x.accion === accion.trim() && x.cedula === cedula.replace(/\D/g, '') && x.estado === 'activo')
    if (!s || !s.email) throw new Error('No encontramos un socio activo con esa acción y cédula, o no tiene correo registrado. Contacte a Atención al Público.')
    return s
  }
  const yo = () => {
    const s = db.socios.find((x) => sesion && x.user_id === sesion.userId)
    if (!s) throw new Error('No autenticado')
    return s
  }
  const tabla = <T extends Tabla>(t: T) => db[t] as any[]

  const backend: Backend = {
    modo: 'demo',

    async sesionActual() {
      return sesion
    },
    alCambiarSesion(cb) {
      oyentes.add(cb)
      return () => oyentes.delete(cb)
    },
    async entrar(accion, cedula, clave) {
      await espera()
      const s = buscar(accion, cedula)
      if (!s.user_id || db.claves[s.user_id] !== clave) throw new Error('Contraseña incorrecta')
      fijarSesion({ userId: s.user_id, email: s.email! })
    },
    async solicitarCodigo(accion, cedula) {
      await espera()
      const s = buscar(accion, cedula)
      const [u, dom] = s.email!.split('@')
      return `${u.slice(0, 2)}•••@${dom} (modo demo: el código es ${CODIGO_DEMO})`
    },
    async verificarCodigo(accion, cedula, codigo) {
      await espera()
      if (codigo.trim() !== CODIGO_DEMO) throw new Error('Código inválido o vencido')
      const s = buscar(accion, cedula)
      if (!s.user_id) s.user_id = id()
      guardar()
      fijarSesion({ userId: s.user_id, email: s.email! })
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
      guardar()
      return fila
    },
    async actualizar(t, rid, datos) {
      await espera()
      const fila = tabla(t).find((r) => r.id === rid)
      if (!fila) throw new Error('No encontrado')
      Object.assign(fila, datos)
      guardar()
      return fila
    },
    async eliminar(t, rid) {
      await espera()
      ;(db as any)[t] = tabla(t).filter((r) => r.id !== rid)
      guardar()
    },

    async crearVarios(t, filas) {
      for (const f of filas) await backend.crear(t, f)
      return filas.length
    },

    async emitirTokenCarnet(socioId) {
      const s = db.socios.find((x) => x.id === socioId)
      const expira = new Date(Date.now() + 60_000).toISOString()
      // En demo el token lleva el id del socio y la expiración (en producción es aleatorio y se guarda en la BD)
      return { token: `${s?.id}.${Date.parse(expira)}`, expira }
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
    async reservar(instalacionId, fecha, hora, socioId) {
      await espera()
      const s = yo()
      const inst = db.instalaciones.find((x) => x.id === instalacionId)!
      if (fecha < hoy()) throw new Error('No se puede reservar en fechas pasadas')
      const mias = db.reservas.filter((r) => r.instalacion_id === instalacionId && r.fecha === fecha && r.accion === s.accion && r.estado === 'confirmada')
      if (mias.length >= inst.max_reservas_dia) throw new Error('Su acción ya alcanzó el máximo de reservas de este día')
      if (db.reservas.some((r) => r.instalacion_id === instalacionId && r.fecha === fecha && r.hora_inicio === hora && r.estado === 'confirmada'))
        throw new Error('Ese horario acaba de ser reservado por otro socio')
      db.reservas.push({ id: id(), instalacion_id: instalacionId, socio_id: socioId, accion: s.accion!, fecha, hora_inicio: hora, estado: 'confirmada', created_at: new Date().toISOString() })
      guardar()
    },
    async inscribir(actividadId, socioId) {
      await espera()
      const s = yo()
      const act = db.actividades.find((x) => x.id === actividadId)!
      const p = db.socios.find((x) => x.id === socioId)!
      if (!act.inscripciones_abiertas) throw new Error('Inscripciones cerradas')
      const activas = db.inscripciones.filter((x) => x.actividad_id === actividadId && x.estado === 'activa')
      if (act.cupo != null && activas.length >= act.cupo) throw new Error('No quedan cupos disponibles')
      if (activas.some((x) => x.socio_id === socioId)) throw new Error(`${p.nombre} ya está inscrito en esta actividad`)
      const ahora = new Date().toISOString()
      db.inscripciones.push({ id: id(), actividad_id: actividadId, socio_id: socioId, accion: s.accion!, estado: 'activa', created_at: ahora })
      if (act.precio_usd > 0)
        db.cargos.push({ id: id(), accion: s.accion!, concepto: `Inscripción: ${act.nombre} (${p.nombre})`, monto_usd: act.precio_usd, fecha: hoy(), vence: null, tipo: 'actividad', created_at: ahora })
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
        db.cargos.push({ id: id(), accion: s.accion!, concepto: `${asistentes.length} entrada(s): ${ev.titulo}`, monto_usd: ev.precio_usd * asistentes.length, fecha: hoy(), vence: null, tipo: 'evento', created_at: ahora })
      guardar()
    },
    async revisarPago(pagoId, aprobado, nota) {
      await espera()
      const p = db.pagos.find((x) => x.id === pagoId)
      if (!p || p.estado !== 'pendiente') throw new Error('El pago ya fue procesado')
      p.estado = aprobado ? 'aprobado' : 'rechazado'
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
