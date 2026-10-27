// Tasa oficial del BCV. Fuente: DolarApi (https://ve.dolarapi.com), que publica la tasa oficial del
// Banco Central de Venezuela. Se usa desde el panel (botón "Obtener tasa oficial") y en el modo demo.
// En producción la registra automáticamente la función supabase/functions/tasa-bcv todos los días.

export const FUENTE_BCV = 'https://ve.dolarapi.com/v1/dolares/oficial'

export interface TasaOficial {
  valor: number
  fecha: string // AAAA-MM-DD
}

export async function obtenerTasaOficial(): Promise<TasaOficial> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), 8000)
  try {
    const r = await fetch(FUENTE_BCV, { signal: ctrl.signal })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    const d = await r.json()
    const valor = Number(d.promedio ?? d.venta ?? d.compra)
    if (!valor || !isFinite(valor)) throw new Error('Respuesta sin tasa')
    const fecha = String(d.fechaActualizacion ?? new Date().toISOString()).slice(0, 10)
    return { valor: Math.round(valor * 10000) / 10000, fecha }
  } catch (e) {
    throw new Error(`No se pudo consultar la tasa oficial del BCV (${(e as Error).message})`)
  } finally {
    clearTimeout(t)
  }
}
