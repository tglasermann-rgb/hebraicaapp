import { api } from './api'
import type { Cargo, Pago, Tasa } from './types'

export interface EstadoCuenta {
  cargos: Cargo[]
  pagos: Pago[]
  /** Cargos sin pagar y que no están en un pago por aprobar */
  pendientes: Cargo[]
  /** Cargos incluidos en un pago que Administración aún no revisa */
  enRevision: Set<string>
  saldo: number // suma en USD de lo que falta por pagar
  pendientePorAprobar: number
  tasa: Tasa | null
}

export async function tasaVigente(): Promise<Tasa | null> {
  const t = await api.listar('tasas', { orden: { campo: 'fecha', asc: false }, limite: 1 })
  return t[0] ?? null
}

const suma = (l: { monto_usd: number }[]) => Math.round(l.reduce((s, x) => s + Number(x.monto_usd), 0) * 100) / 100

export async function estadoCuenta(accion: string): Promise<EstadoCuenta> {
  const [cargos, pagos, tasa] = await Promise.all([
    api.listar('cargos', { eq: { accion }, orden: { campo: 'fecha', asc: false } }),
    api.listar('pagos', { eq: { accion }, orden: { campo: 'created_at', asc: false } }),
    tasaVigente(),
  ])
  const porAprobar = pagos.filter((p) => p.estado === 'pendiente')
  const enRevision = new Set(porAprobar.flatMap((p) => p.cargo_ids ?? []))
  const sinPagar = cargos.filter((c) => c.estado !== 'pagado')
  return {
    cargos,
    pagos,
    pendientes: sinPagar.filter((c) => !enRevision.has(c.id)),
    enRevision,
    saldo: suma(sinPagar),
    pendientePorAprobar: suma(porAprobar),
    tasa,
  }
}
