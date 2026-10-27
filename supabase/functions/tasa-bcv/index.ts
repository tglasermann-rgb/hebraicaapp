// Supabase Edge Function: registra la tasa oficial del BCV del día en la tabla `tasas`.
// Se programa con pg_cron (ver supabase/migrations/0002_tasa_bcv_automatica.sql).
// Despliegue: supabase functions deploy tasa-bcv
import { createClient } from 'npm:@supabase/supabase-js@2'

const FUENTE = 'https://ve.dolarapi.com/v1/dolares/oficial'

Deno.serve(async () => {
  try {
    const r = await fetch(FUENTE)
    if (!r.ok) throw new Error(`Fuente respondió ${r.status}`)
    const d = await r.json()
    const valor = Number(d.promedio ?? d.venta ?? d.compra)
    if (!valor || !isFinite(valor)) throw new Error('Respuesta sin tasa')
    const fecha = String(d.fechaActualizacion ?? new Date().toISOString()).slice(0, 10)

    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { error } = await sb.from('tasas').upsert({ fecha, bs_por_usd: valor }, { onConflict: 'fecha' })
    if (error) throw error
    return Response.json({ ok: true, fecha, bs_por_usd: valor })
  } catch (e) {
    return Response.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
})
