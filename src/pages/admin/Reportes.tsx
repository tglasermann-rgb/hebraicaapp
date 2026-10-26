import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Download } from 'lucide-react'
import { Boton, Cargando, Seccion, Tarjeta } from '@/components/ui'
import { api } from '@/lib/api'
import { fUSD } from '@/lib/formato'
import { useDatos } from '@/lib/useDatos'

export default function Reportes() {
  const { datos, cargando } = useDatos(async () => {
    const [cargos, pagos] = await Promise.all([api.listar('cargos'), api.listar('pagos', { eq: { estado: 'aprobado' } })])
    const saldo = new Map<string, number>()
    for (const c of cargos) if (c.estado !== 'pagado') saldo.set(c.accion, (saldo.get(c.accion) ?? 0) + Number(c.monto_usd))
    const deudores = [...saldo.entries()].filter(([, v]) => v > 0.009).sort((a, b) => b[1] - a[1])
    const porMes = new Map<string, number>()
    for (const p of pagos) {
      const k = p.fecha_pago.slice(0, 7)
      porMes.set(k, (porMes.get(k) ?? 0) + Number(p.monto_usd))
    }
    const meses = [...porMes.entries()].sort((a, b) => b[0].localeCompare(a[0])).slice(0, 12)
    return { deudores, meses, totalDeuda: deudores.reduce((s, [, v]) => s + v, 0) }
  })

  function exportar() {
    const csv = 'accion,saldo_usd\n' + datos!.deudores.map(([a, v]) => `${a},${v.toFixed(2)}`).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `saldos_${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
  }

  if (cargando || !datos) return <Cargando />
  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <Tarjeta className="p-4"><p className="font-display text-[26px] font-extrabold text-llama">{fUSD(datos.totalDeuda)}</p><p className="text-sm text-slate-500">Por cobrar</p></Tarjeta>
        <Tarjeta className="p-4"><p className="font-display text-[26px] font-extrabold text-azul">{datos.deudores.length}</p><p className="text-sm text-slate-500">Acciones con saldo</p></Tarjeta>
      </div>
      <Seccion titulo="Cobrado por mes (pagos aprobados)">
        <Tarjeta className="divide-y divide-slate-100">
          {datos.meses.map(([m, v]) => (
            <div key={m} className="flex justify-between px-4 py-2.5 text-sm">
              <span className="capitalize">{format(parseISO(m + '-01'), 'MMMM yyyy', { locale: es })}</span>
              <span className="font-medium tabular-nums">{fUSD(v)}</span>
            </div>
          ))}
        </Tarjeta>
      </Seccion>
      <Seccion titulo="Saldos pendientes por acción">
        <Boton variante="secundario" bloque className="mb-3" onClick={exportar}><Download className="h-4 w-4" /> Exportar CSV</Boton>
        <Tarjeta className="divide-y divide-slate-100">
          {datos.deudores.slice(0, 100).map(([a, v]) => (
            <div key={a} className="flex justify-between px-4 py-2.5 text-sm">
              <span>Acción {a}</span>
              <span className="font-medium tabular-nums text-llama">{fUSD(v)}</span>
            </div>
          ))}
        </Tarjeta>
      </Seccion>
    </div>
  )
}
