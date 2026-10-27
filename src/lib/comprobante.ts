// Lectura automática del comprobante de pago (foto o captura del Pago Móvil, transferencia o Zelle).
// Usa Tesseract (OCR) dentro del navegador: gratis y sin enviar la imagen a terceros.
// El texto en español se descarga una sola vez desde el CDN (~2 MB) y queda en caché.

export interface DatosComprobante {
  referencia: string | null
  monto: number | null
  texto: string
}

/** Convierte "1.647,90", "1,647.90", "45,00" o "45.5" a número. */
export function aNumero(s: string): number | null {
  const t = s.replace(/[^\d.,]/g, '')
  if (!t) return null
  const ultCom = t.lastIndexOf(','), ultPto = t.lastIndexOf('.')
  let n: string
  if (ultCom > -1 && ultPto > -1) n = ultCom > ultPto ? t.replace(/\./g, '').replace(',', '.') : t.replace(/,/g, '')
  else if (ultCom > -1) n = /,\d{1,2}$/.test(t) ? t.replace(/\./g, '').replace(',', '.') : t.replace(/,/g, '')
  else if (ultPto > -1) n = /\.\d{1,2}$/.test(t) && (t.match(/\./g) ?? []).length === 1 ? t : t.replace(/\./g, '')
  else n = t
  const v = Number(n)
  return isFinite(v) && v > 0 ? Math.round(v * 100) / 100 : null
}

const NUM = String.raw`(\d{1,3}(?:[.,\s]\d{3})*(?:[.,]\d{1,2})|\d+(?:[.,]\d{1,2})?)`

/** Busca la referencia y el monto en el texto leído del comprobante. */
export function analizarTexto(texto: string): Omit<DatosComprobante, 'texto'> {
  const limpio = texto.replace(/[|]/g, ' ').replace(/[ \t]+/g, ' ')

  // Referencia: número que sigue a una etiqueta típica de los bancos venezolanos y de Zelle
  const etiquetas = String.raw`(?:n[úu]mero\s+de\s+)?(?:referencia|ref\.?|operaci[óo]n|n[°ºo.]\s*(?:de\s+)?(?:operaci[óo]n|confirmaci[óo]n|transacci[óo]n|referencia)|confirmaci[óo]n|comprobante|transacci[óo]n|confirmation(?:\s+(?:number|code))?|reference)`
  const reRef = new RegExp(etiquetas + String.raw`\s*(?:n[°ºo.]\s*)?[:#.\-]?\s*([A-Z0-9]{0,3}\d{4,20})`, 'i')
  const referencia = limpio.match(reRef)?.[1]?.replace(/\s/g, '') ?? null

  // Monto: primero con etiqueta (monto, total, importe, amount); si no, junto a Bs/$/USD
  let monto: number | null = null
  const reEtiq = new RegExp(String.raw`(?:monto|total|importe|amount|cantidad)[^\d\n]{0,15}` + NUM, 'i')
  const m1 = limpio.match(reEtiq)
  if (m1) monto = aNumero(m1[1])
  if (monto == null) {
    const reMon = new RegExp(String.raw`(?:bs\.?s?|ves|usd|\$)\s*` + NUM + '|' + NUM + String.raw`\s*(?:bs\.?s?|ves|usd)\b`, 'i')
    const m2 = limpio.match(reMon)
    if (m2) monto = aNumero(m2[1] ?? m2[2])
  }
  return { referencia, monto }
}

export async function leerComprobante(archivo: File, alAvanzar?: (p: number) => void): Promise<DatosComprobante> {
  const { createWorker } = await import('tesseract.js')
  const worker = await createWorker('spa', 1, {
    logger: (m: { status: string; progress: number }) => m.status === 'recognizing text' && alAvanzar?.(m.progress),
  })
  try {
    const { data } = await worker.recognize(archivo)
    return { ...analizarTexto(data.text), texto: data.text }
  } finally {
    await worker.terminate()
  }
}

/** ¿Lo leído coincide con lo que el socio escribió? (tolerancia de 1 % en el monto) */
export function coincide(leido: DatosComprobante, referencia: string, monto: number) {
  const refOk = !!leido.referencia && !!referencia && (leido.referencia.endsWith(referencia.replace(/\D/g, '').slice(-6)) || referencia.replace(/\D/g, '').endsWith(leido.referencia.replace(/\D/g, '').slice(-6)))
  const montoOk = leido.monto != null && Math.abs(leido.monto - monto) <= Math.max(0.01, monto * 0.01)
  return refOk && montoOk
}
