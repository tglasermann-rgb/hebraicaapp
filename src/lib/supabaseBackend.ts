import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { limpiarUsuario, USUARIO_VALIDO, type Backend, type Filtro, type Sesion } from './backend'
import type { Estadisticas, Registro, ResultadoValidacion, Socio, Tabla } from './types'

// Supabase Auth necesita un correo: cada usuario se guarda con un correo interno derivado de su nombre
// de usuario. Requiere desactivar "Confirm email" en Authentication → Providers → Email.
const DOMINIO = 'usuarios.mihebraica.app'
const correoDe = (usuario: string) => `${limpiarUsuario(usuario)}@${DOMINIO}`

function err(e: { message: string } | null) {
  if (e) throw new Error(e.message)
}

export function crearSupabaseBackend(url: string, key: string): Backend {
  const sb: SupabaseClient = createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
  })

  const aSesion = (s: { user: { id: string; email?: string } } | null): Sesion | null =>
    s ? { userId: s.user.id, email: s.user.email ?? '' } : null

  return {
    modo: 'supabase',

    async sesionActual() {
      const { data } = await sb.auth.getSession()
      return aSesion(data.session)
    },
    alCambiarSesion(cb) {
      const { data } = sb.auth.onAuthStateChange((_e, s) => cb(aSesion(s)))
      return () => data.subscription.unsubscribe()
    },
    async entrar(usuario, clave) {
      const { error } = await sb.auth.signInWithPassword({ email: correoDe(usuario), password: clave })
      if (error) throw new Error(error.message.includes('Invalid') ? 'Usuario o contraseña incorrectos' : error.message)
    },
    async registrar(d) {
      if (!USUARIO_VALIDO.test(limpiarUsuario(d.usuario))) throw new Error('El usuario debe tener de 3 a 30 letras o números (sin espacios)')
      const { data, error } = await sb.auth.signUp({ email: correoDe(d.usuario), password: d.clave })
      if (error && !/registered|exists/i.test(error.message)) throw new Error(error.message)
      if (error) {
        // El usuario ya existe: si es de esta misma persona (misma contraseña) y su solicitud no se
        // llegó a guardar (p. ej. un intento anterior falló), la completamos en vez de dejarla trabada.
        const { error: e1 } = await sb.auth.signInWithPassword({ email: correoDe(d.usuario), password: d.clave })
        if (e1) throw new Error('Ese usuario ya existe. Elige otro.')
        const { data: yaSocio } = await sb.from('socios').select('id').eq('user_id', (await sb.auth.getUser()).data.user!.id).maybeSingle()
        if (yaSocio || (await this.miRegistro())) {
          await sb.auth.signOut()
          throw new Error('Ese usuario ya existe. Elige otro.')
        }
      } else if (!data.session) throw new Error('Falta desactivar la confirmación por correo en Supabase (ver README).')
      await this.reenviarRegistro(d)
    },
    async miRegistro() {
      const { data: u } = await sb.auth.getUser()
      if (!u.user) return null
      const { data, error } = await sb.from('registros').select('*').eq('user_id', u.user.id).maybeSingle()
      err(error)
      return data as Registro | null
    },
    async reenviarRegistro(d) {
      const { data: u } = await sb.auth.getUser()
      const datos = { nombre: d.nombre.trim(), apellido: d.apellido.trim(), cedula: d.cedula.replace(/\D/g, ''), email: d.email.trim().toLowerCase() }
      const { data: actual } = await sb.from('registros').select('id').eq('user_id', u.user!.id).maybeSingle()
      // Sin solicitud guardada (un intento anterior falló a medias): se crea ahora
      const { error } = actual
        ? await sb.from('registros').update({ ...datos, estado: 'pendiente', motivo: null }).eq('user_id', u.user!.id)
        : await sb.from('registros').insert({ ...datos, user_id: u.user!.id, usuario: u.user!.email!.split('@')[0] })
      if (error) throw new Error(error.message.includes('registro_pendiente_unico') ? 'Ya hay una solicitud en revisión con esa cédula.' : error.message)
    },
    async recuperarClave(usuario) {
      // La función responde igual exista o no el usuario, para no revelar quién está registrado
      const { error } = await sb.functions.invoke('restablecer-clave', { body: { usuario: limpiarUsuario(usuario) } })
      if (error) throw new Error('No se pudo enviar el correo. Intenta más tarde o comunícate con Atención al Público.')
      return null
    },
    async verificarRecuperacion(tokenHash) {
      const { error } = await sb.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' })
      if (error) throw new Error('El enlace venció o ya fue usado. Pide uno nuevo.')
    },
    async cambiarClave(nueva) {
      const { error } = await sb.auth.updateUser({ password: nueva })
      err(error)
    },
    async salir() {
      await sb.auth.signOut()
    },
    async miSocio() {
      const { data: u } = await sb.auth.getUser()
      if (!u.user) return null
      const { data, error } = await sb.from('socios').select('*').eq('user_id', u.user.id).maybeSingle()
      err(error)
      return data as Socio | null
    },

    async listar(tabla, f: Filtro<any> = {}) {
      let q = sb.from(tabla).select('*')
      for (const [k, v] of Object.entries(f.eq ?? {})) q = v === null ? q.is(k, null) : q.eq(k, v)
      for (const [k, v] of Object.entries(f.in ?? {})) q = q.in(k, v as any[])
      for (const [k, v] of Object.entries(f.gte ?? {})) q = q.gte(k, v)
      for (const [k, v] of Object.entries(f.lte ?? {})) q = q.lte(k, v)
      if (f.orden) q = q.order(f.orden.campo, { ascending: f.orden.asc ?? true })
      if (f.limite) q = q.limit(f.limite)
      const { data, error } = await q
      err(error)
      return (data ?? []) as any
    },
    async obtener(tabla, id) {
      const { data, error } = await sb.from(tabla).select('*').eq('id', id).maybeSingle()
      err(error)
      return data as any
    },
    async crear(tabla, datos) {
      const { data, error } = await sb.from(tabla).insert(datos as any).select().single()
      err(error)
      return data as any
    },
    async actualizar(tabla, id, datos) {
      const { data, error } = await sb.from(tabla).update(datos as any).eq('id', id).select().single()
      err(error)
      return data as any
    },
    async eliminar(tabla: Tabla, id) {
      const { error } = await sb.from(tabla).delete().eq('id', id)
      err(error)
    },

    async crearVarios(tabla, filas) {
      for (let i = 0; i < filas.length; i += 500) {
        const { error } = await sb.from(tabla).insert(filas.slice(i, i + 500) as any[])
        err(error)
      }
      return filas.length
    },

    async emitirTokenCarnet(socioId) {
      const { data, error } = await sb.rpc('emitir_token_carnet', { p_socio: socioId })
      err(error)
      return data as { token: string; expira: string }
    },
    async validarCodigo(codigo) {
      const { data, error } = await sb.rpc('validar_codigo', { p_codigo: codigo })
      err(error)
      return data as ResultadoValidacion
    },
    async horariosOcupados(instalacionId, fecha) {
      const { data, error } = await sb.rpc('horarios_ocupados', { p_instalacion: instalacionId, p_fecha: fecha })
      err(error)
      return (data ?? []) as string[]
    },
    async reservar(instalacionId, fecha, hora, socioId, jugadores = []) {
      const { error } = await sb.rpc('reservar', { p_instalacion: instalacionId, p_fecha: fecha, p_hora: hora, p_socio: socioId, p_jugadores: jugadores })
      err(error)
    },
    async cancelarReserva(reservaId) {
      const { error } = await sb.rpc('cancelar_reserva', { p_reserva: reservaId })
      err(error)
    },
    async inscribir(actividadId, socioId) {
      const { data, error } = await sb.rpc('inscribir', { p_actividad: actividadId, p_socio: socioId })
      err(error)
      return (data as string | null) ?? null
    },
    async cancelarCargo(cargoId) {
      const { error } = await sb.rpc('cancelar_cargo', { p_cargo: cargoId })
      err(error)
    },
    async cancelarInscripcion(inscripcionId) {
      const { error } = await sb.rpc('cancelar_inscripcion', { p_inscripcion: inscripcionId })
      err(error)
    },
    async comprarEntradas(eventoId, asistentes) {
      const { error } = await sb.rpc('comprar_entradas', { p_evento: eventoId, p_asistentes: asistentes })
      err(error)
    },
    async aprobarRegistro(registroId, accion, parentesco) {
      const { error } = await sb.rpc('aprobar_registro', { p_registro: registroId, p_accion: accion, p_parentesco: parentesco })
      err(error)
    },
    async rechazarRegistro(registroId, motivo) {
      const { error } = await sb.rpc('rechazar_registro', { p_registro: registroId, p_motivo: motivo })
      err(error)
    },
    async eliminarCuenta(userId) {
      const { error } = await sb.rpc('eliminar_cuenta', { p_user: userId })
      err(error)
    },
    async cuentasIncompletas() {
      const { data, error } = await sb.rpc('cuentas_incompletas')
      err(error)
      return data ?? []
    },
    async restablecerClaveAdmin(socioId) {
      const { data, error } = await sb.functions.invoke('restablecer-clave', { body: { modo: 'admin', socio_id: socioId } })
      if (error || !data?.clave) throw new Error(data?.error ?? 'No se pudo restablecer la contraseña')
      return data.clave as string
    },
    async ocupacionClases(desde, hasta) {
      const { data, error } = await sb.rpc('ocupacion_clases', { p_desde: desde, p_hasta: hasta })
      err(error)
      return (data ?? []) as any
    },
    async reservarClase(claseId, socioId) {
      const { data, error } = await sb.rpc('reservar_clase', { p_clase: claseId, p_socio: socioId })
      err(error)
      return data as 'confirmada' | 'espera'
    },
    async cancelarReservaClase(reservaId) {
      const { error } = await sb.rpc('cancelar_reserva_clase', { p_reserva: reservaId })
      err(error)
    },
    async votar(encuestaId, opcion, comentario) {
      const { error } = await sb.rpc('votar', { p_encuesta: encuestaId, p_opcion: opcion, p_comentario: comentario })
      err(error)
    },
    async resultadosEncuesta(encuestaId) {
      const { data, error } = await sb.rpc('resultados_encuesta', { p_encuesta: encuestaId })
      err(error)
      return (data ?? []) as any
    },
    async estadisticas() {
      const { data, error } = await sb.rpc('estadisticas')
      err(error)
      return data as Estadisticas
    },
    async revisarPago(pagoId, aprobado, nota) {
      const { error } = await sb.rpc('revisar_pago', { p_pago: pagoId, p_aprobado: aprobado, p_nota: nota })
      err(error)
    },
    async paseInvitado(codigo) {
      const { data, error } = await sb.rpc('pase_invitado', { p_codigo: codigo })
      err(error)
      return data as any
    },
    async subirArchivo(bucket, archivo) {
      const yo = await this.miSocio()
      const ext = archivo.name.split('.').pop() ?? 'jpg'
      const carpeta = bucket === 'comprobantes' ? (yo?.accion ?? 'sin-accion') : 'contenido'
      const ruta = `${carpeta}/${crypto.randomUUID()}.${ext}`
      const { error } = await sb.storage.from(bucket).upload(ruta, archivo, { contentType: archivo.type })
      err(error)
      if (bucket === 'publico') return sb.storage.from(bucket).getPublicUrl(ruta).data.publicUrl
      return ruta
    },
    async urlArchivo(bucket, ruta) {
      if (bucket === 'publico' || ruta.startsWith('http') || ruta.startsWith('data:')) return ruta
      const { data, error } = await sb.storage.from(bucket).createSignedUrl(ruta, 300)
      err(error)
      return data!.signedUrl
    },
  }
}
