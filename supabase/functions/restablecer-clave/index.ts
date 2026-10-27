// Supabase Edge Function: recuperación de contraseña.
//
//  1) { usuario }                  → el socio pide un enlace; se envía a su correo (Resend).
//  2) { modo: 'admin', socio_id }  → Administración genera una contraseña temporal (requiere sesión de admin).
//
// Variables (Project Settings → Edge Functions → Secrets):
//   RESEND_API_KEY   clave de https://resend.com (gratis hasta 3.000 correos/mes)
//   CORREO_REMITENTE p. ej. "Mi Hebraica <no-responder@hebraica.org>" (dominio verificado en Resend)
//   APP_URL          p. ej. https://hebraicaapp.vercel.app
// Despliegue: supabase functions deploy restablecer-clave --no-verify-jwt
import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: cors })

function claveTemporal() {
  const letras = 'abcdefghjkmnpqrstuvwxyz23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(10))
  return 'Heb-' + Array.from(bytes, (b) => letras[b % letras.length]).join('')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const body = await req.json().catch(() => ({}))

  try {
    // ---- Administración: contraseña temporal ----
    if (body.modo === 'admin') {
      const jwt = (req.headers.get('Authorization') ?? '').replace('Bearer ', '')
      const comoUsuario = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
        global: { headers: { Authorization: `Bearer ${jwt}` } },
      })
      const { data: autorizado } = await comoUsuario.rpc('tiene_rol', { roles: ['admin', 'administracion'] })
      if (!autorizado) return json({ error: 'No autorizado' }, 403)
      const { data: socio } = await admin.from('socios').select('user_id, nombre').eq('id', body.socio_id).maybeSingle()
      if (!socio?.user_id) return json({ error: 'Este socio todavía no tiene usuario en el app' }, 400)
      const clave = claveTemporal()
      const { error } = await admin.auth.admin.updateUserById(socio.user_id, { password: clave })
      if (error) throw error
      return json({ clave })
    }

    // ---- Socio: enlace por correo ----
    const usuario = String(body.usuario ?? '').trim().toLowerCase()
    if (!usuario) return json({ ok: true })
    const { data: socio } = await admin.from('socios').select('user_id, nombre, email').eq('usuario', usuario).maybeSingle()
    // Siempre responde ok: no revela si el usuario existe
    if (!socio?.user_id || !socio.email) return json({ ok: true })

    const { data: u } = await admin.auth.admin.getUserById(socio.user_id)
    const { data: enlace, error } = await admin.auth.admin.generateLink({ type: 'recovery', email: u.user!.email! })
    if (error) throw error
    const url = `${Deno.env.get('APP_URL')}/#/nueva-clave?token_hash=${enlace.properties.hashed_token}`

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: Deno.env.get('CORREO_REMITENTE'),
        to: socio.email,
        subject: 'Restablece tu contraseña de Mi Hebraica',
        html: `<p>Hola ${socio.nombre},</p>
<p>Recibimos una solicitud para restablecer la contraseña de tu usuario <b>${usuario}</b> en Mi Hebraica.</p>
<p><a href="${url}" style="display:inline-block;padding:12px 20px;background:#293E9B;color:#fff;border-radius:999px;text-decoration:none">Crear nueva contraseña</a></p>
<p>Si no fuiste tú, ignora este correo. El enlace vence en 1 hora.</p>`,
      }),
    })
    if (!r.ok) throw new Error(`Resend respondió ${r.status}`)
    return json({ ok: true })
  } catch (e) {
    return json({ error: (e as Error).message }, 500)
  }
})
