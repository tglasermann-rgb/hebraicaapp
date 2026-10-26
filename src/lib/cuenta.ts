import { api } from './api'
import type { Cargo, Pago, Tasa } from './types'

export interface EstadoCuenta {
  cargos: Cargo[]
  pagos: Pago[]
  saldo: number // positivo = deuda en USD
  pendientePorAprobar: number
  tasa: Tasa | null
}

export async function tasaVigente(): Promise<Tasa | null> {
  const t = await api.listar('tasas', { orden: { campo: 'fecha', asc: false }, limite: 1 })
  return t[0] ?? null
}

export async function estadoCuenta(accion: string): Promise<EstadoCuenta> {
  const [cargos, pagos, tasa] = await Promise.all([
    api.listar('cargos', { eq: { accion }, orden: { campo: 'fecha', asc: false } }),
    api.listar('pagos', { eq: { accion }, orden: { campo: 'created_at', asc: false } }),
    tasaVigente(),
  ])
  const debe = cargos.reduce((s, c) => s + Number(c.monto_usd), 0)
  const pagado = pagos.filter((p) => p.estado === 'aprobado').reduce((s, p) => s + Number(p.monto_usd), 0)
  const pendientePorAprobar = pagos.filter((p) => p.estado === 'pendiente').reduce((s, p) => s + Number(p.monto_usd), 0)
  return { cargos, pagos, saldo: Math.round((debe - pagado) * 100) / 100, pendientePorAprobar, tasa }
}
