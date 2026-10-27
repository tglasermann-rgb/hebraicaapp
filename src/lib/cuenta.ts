import { api } from './api'
import type { Cargo, CuentaPago, DatosBancarios, MetodoPago, Pago, Tasa } from './types'

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

/** Lee los datos bancarios guardados (acepta el formato anterior con campos fijos). */
export function normalizarBancos(valor: unknown): DatosBancarios {
  const v = (valor ?? {}) as Record<string, any>
  if (Array.isArray(v.cuentas)) return { cuentas: v.cuentas, nota: v.nota ?? '' }
  const cuentas: CuentaPago[] = []
  const fila = (k: string, x?: string) => (x ? [{ k, v: x }] : [])
  if (v.pago_movil) cuentas.push({ metodo: 'pago_movil', titulo: 'Pago Móvil', datos: [...fila('Banco', v.pago_movil.banco), ...fila('Teléfono', v.pago_movil.telefono), ...fila('RIF', v.pago_movil.rif)] })
  if (v.transferencia_bs) cuentas.push({ metodo: 'transferencia_bs', titulo: v.transferencia_bs.banco || 'Transferencia en Bs.', datos: [...fila('Cuenta', v.transferencia_bs.cuenta), ...fila('Titular', v.transferencia_bs.titular), ...fila('RIF', v.transferencia_bs.rif)] })
  if (v.zelle) cuentas.push({ metodo: 'zelle', titulo: 'Zelle', datos: [...fila('Correo', v.zelle.email), ...fila('Titular', v.zelle.titular)] })
  if (v.transferencia_usd) cuentas.push({ metodo: 'transferencia_usd', titulo: v.transferencia_usd.banco || 'Transferencia en USD', datos: [...fila('Cuenta', v.transferencia_usd.cuenta), ...fila('Titular', v.transferencia_usd.titular)] })
  return { cuentas, nota: v.nota ?? '' }
}

/** Métodos en bolívares (el monto se convierte con la tasa BCV). */
export const METODOS_BS: MetodoPago[] = ['pago_movil', 'transferencia_bs']
