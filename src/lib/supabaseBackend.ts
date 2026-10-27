import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { limpiarUsuario, USUARIO_VALIDO, type Backend, type Filtro, type Sesion } from './backend'
import type { Registro, ResultadoValidacion, Socio, Tabla } from './types'

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
      if (error) throw new Error(/registered|exists/i.test(error.message) ? 'Ese usuario ya existe. Elige otro.' : error.message)
      if (!data.session) throw new Error('Falta desactivar la confirmación por correo en Supabase (ver README).')
      const { error: e2 } = await sb.from('registros').insert({
        user_id: data.user!.id,
        nombre: d.nombre.trim(),
        apellido: d.apellido.trim(),
        cedula: d.cedula.replace(/\D/g, ''),
        usuario: limpiarUsuario(d.usuario),
      })
      if (e2) throw new Error(e2.message.includes('registro_pendiente_unico') ? 'Ya hay una solicitud en revisión con esa cédula.' : e2.message)
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
      const { error } = await sb
        .from('registros')
        .update({ nombre: d.nombre.trim(), apellido: d.apellido.trim(), cedula: d.cedula.replace(/\D/g, ''), estado: 'pendiente', motivo: null })
        .eq('user_id', u.user!.id)
      err(error)
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
    async reservar(instalacionId, fecha, hora, socioId) {
      const { error } = await sb.rpc('reservar', { p_instalacion: instalacionId, p_fecha: fecha, p_hora: hora, p_socio: socioId })
      err(error)
    },
    async inscribir(actividadId, socioId) {
      const { error } = await sb.rpc('inscribir', { p_actividad: actividadId, p_socio: socioId })
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
