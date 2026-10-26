import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

const bs = new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const fUSD = (n: number) => `${n < 0 ? '-' : ''}$${bs.format(Math.abs(n))}`
export const fBs = (n: number) => `Bs. ${bs.format(n)}`

const p = (f: string) => (f.length === 10 ? parseISO(f + 'T12:00:00') : parseISO(f))

export const fFecha = (f: string, patron = "d 'de' MMMM yyyy") => format(p(f), patron, { locale: es })
export const fFechaCorta = (f: string) => format(p(f), 'dd/MM/yyyy')
export const fHora = (f: string) => format(p(f), 'h:mm a', { locale: es })
export const fDiaHora = (f: string) => format(p(f), "EEE d MMM · h:mm a", { locale: es })
export const fHace = (f: string) => formatDistanceToNow(p(f), { locale: es, addSuffix: true })
export const hoyISO = () => format(new Date(), 'yyyy-MM-dd')

/** "14:30" -> "2:30 pm" */
export function fHoraTexto(h: string) {
  const [hh, mm] = h.split(':').map(Number)
  const suf = hh >= 12 ? 'pm' : 'am'
  return `${((hh + 11) % 12) + 1}:${String(mm).padStart(2, '0')} ${suf}`
}

export function edad(nac: string | null) {
  if (!nac) return null
  const n = p(nac)
  const h = new Date()
  let e = h.getFullYear() - n.getFullYear()
  if (h.getMonth() < n.getMonth() || (h.getMonth() === n.getMonth() && h.getDate() < n.getDate())) e--
  return e
}

export const capitalizar = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
