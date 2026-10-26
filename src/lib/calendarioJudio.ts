import { CandleLightingEvent, HavdalahEvent, HDate, HebrewCalendar, Location, ParshaEvent, flags, type Event } from '@hebcal/core'
import { CLUB } from './brand'

const caracas = new Location(CLUB.lat, CLUB.lon, false, CLUB.zona, 'Caracas', 'VE')

// Traducción al español de las festividades más comunes (Hebcal no trae español).
const ES: Record<string, string> = {
  'Rosh Hashana': 'Rosh Hashaná',
  'Erev Rosh Hashana': 'Erev Rosh Hashaná',
  'Yom Kippur': 'Yom Kipur',
  'Erev Yom Kippur': 'Erev Yom Kipur',
  Sukkot: 'Sucot',
  'Erev Sukkot': 'Erev Sucot',
  'Shmini Atzeret': 'Sheminí Atzéret',
  'Simchat Torah': 'Simjat Torá',
  Chanukah: 'Jánuca',
  'Tu BiShvat': 'Tu Bishvat',
  Purim: 'Purim',
  'Erev Purim': 'Erev Purim',
  'Shushan Purim': 'Shushán Purim',
  Pesach: 'Pésaj',
  'Erev Pesach': 'Erev Pésaj',
  Shavuot: 'Shavuot',
  'Erev Shavuot': 'Erev Shavuot',
  'Tish\'a B\'Av': 'Tishá BeAv',
  'Erev Tish\'a B\'Av': 'Erev Tishá BeAv',
  'Yom HaShoah': 'Iom HaShoá',
  'Yom HaZikaron': 'Iom HaZikarón',
  "Yom HaAtzma'ut": 'Iom HaAtzmaut',
  'Yom Yerushalayim': 'Iom Ierushalaim',
  'Lag BaOmer': 'Lag BaÓmer',
  'Tzom Gedaliah': 'Ayuno de Guedalia',
  "Asara B'Tevet": 'Ayuno 10 de Tevet',
  "Ta'anit Esther": 'Ayuno de Ester',
  "Tzom Tammuz": 'Ayuno 17 de Tamuz',
  'Rosh Chodesh': 'Rosh Jódesh',
}

const OMITIR = new Set(['Sigd', 'Chag HaBanot', 'Purim Katan', 'Shushan Purim Katan', 'Leil Selichot', "Yom Kippur Katan"])

export function traducir(ev: Event): string {
  const desc = ev.getDesc()
  if (ES[desc]) return ES[desc]
  const base = desc.replace(/ (I|II|III|IV|V|VI|VII|VIII)$/, '')
  const sufijo = desc.slice(base.length)
  if (ES[base]) return ES[base] + sufijo
  if (desc.startsWith('Rosh Chodesh')) return 'Rosh Jódesh ' + desc.slice('Rosh Chodesh '.length)
  const vela = desc.match(/^Chanukah: (\d) Candle/)
  if (vela) return `Jánuca – ${vela[1]}.ª vela`
  if (desc === 'Chanukah: 8th Day') return 'Jánuca – 8.º día'
  return ev.render('en').replace(/^Shabbat /, 'Shabat ')
}

export interface DiaEspecial {
  fecha: Date
  titulo: string
  tipo: 'festividad' | 'ayuno' | 'rosh_jodesh' | 'moderna'
}

export interface Shabat {
  velas: Date | null
  havdala: Date | null
  parasha: string | null
}

/** Encendido de velas y Havdalá del próximo Shabat (o el actual) en Caracas. */
export function proximoShabat(desde = new Date()): Shabat {
  const inicio = new Date(desde)
  inicio.setHours(0, 0, 0, 0)
  const fin = new Date(inicio)
  fin.setDate(fin.getDate() + 8)
  const evs = HebrewCalendar.calendar({ start: inicio, end: fin, location: caracas, candlelighting: true, sedrot: true, noHolidays: true })
  let velas: Date | null = null
  let havdala: Date | null = null
  let parasha: string | null = null
  for (const ev of evs) {
    if (ev instanceof CandleLightingEvent && !velas && ev.getDate().getDay() === 5) velas = ev.eventTime
    if (ev instanceof HavdalahEvent && velas && !havdala && ev.eventTime > velas) havdala = ev.eventTime
    if (ev instanceof ParshaEvent && !parasha) parasha = ev.render('en').replace('Parashat', 'Parashá')
  }
  return { velas, havdala, parasha }
}

/** Festividades judías entre dos fechas. */
export function festividades(inicio: Date, fin: Date): DiaEspecial[] {
  const evs = HebrewCalendar.calendar({ start: inicio, end: fin, il: false })
  const vistos = new Set<string>()
  return evs
    .filter((ev) => !(ev.getFlags() & flags.PARSHA_HASHAVUA) && !OMITIR.has(ev.getDesc()))
    .filter((ev) => {
      const k = ev.getDate().toString() + ev.getDesc()
      if (vistos.has(k)) return false
      vistos.add(k)
      return true
    })
    .map((ev) => {
      const f = ev.getFlags()
      const tipo: DiaEspecial['tipo'] =
        f & (flags.MAJOR_FAST | flags.MINOR_FAST) ? 'ayuno'
        : f & flags.ROSH_CHODESH ? 'rosh_jodesh'
        : f & flags.MODERN_HOLIDAY ? 'moderna'
        : 'festividad'
      return { fecha: ev.getDate().greg(), titulo: traducir(ev), tipo }
    })
}

export function fechaHebrea(d = new Date()): string {
  return new HDate(d).render('en').replace(/(\d+)(st|nd|rd|th)/, '$1')
}
