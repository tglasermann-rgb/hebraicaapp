// Colores y departamentos según el Manual de Identidad Institucional Hebraica (2019).

export const COLORES = {
  marino: '#293779',
  azul: '#293E9B',
  llama: '#F14D23',
  amarillo: '#E7EC18',
}

export interface Departamento {
  id: string
  nombre: string
  color: string
}

export const DEPARTAMENTOS: Departamento[] = [
  { id: 'deportes', nombre: 'Deportes', color: '#3AAA9C' },
  { id: 'gimnasio', nombre: 'Gimnasio Galsky', color: '#78C043' },
  { id: 'bailes', nombre: 'Bailes', color: '#E3198B' },
  { id: 'juventud', nombre: 'Juventud y Educación', color: '#1D4FB3' },
  { id: 'diam', nombre: 'DIAM', color: '#6E1423' },
  { id: 'brief_kohn', nombre: 'Centro Creativo Brief Kohn', color: '#6B2D90' },
  { id: 'cultura', nombre: 'Cultura', color: '#1E6B3B' },
  { id: 'tiptipot', nombre: 'Tip Tipot', color: '#1FADE4' },
  { id: 'espacio', nombre: 'Espacio Hebraica', color: '#E8312F' },
  { id: 'macabilandia', nombre: 'Macabilandia', color: '#F39019' },
  { id: 'comunicaciones', nombre: 'Comunicaciones', color: COLORES.azul },
  { id: 'club', nombre: 'Hebraica', color: COLORES.marino },
]

export function depto(id: string | null | undefined): Departamento {
  return DEPARTAMENTOS.find((d) => d.id === id) ?? DEPARTAMENTOS[DEPARTAMENTOS.length - 1]
}

export const CLUB = {
  nombreApp: 'Mi Hebraica',
  nombre: 'Hebraica',
  lema: 'Centro Social Cultural Deportivo y Religioso',
  email: 'info@hebraica.org',
  // Caracas, Venezuela — para horarios de Shabat
  lat: 10.4806,
  lon: -66.9036,
  zona: 'America/Caracas',
}
