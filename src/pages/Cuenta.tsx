import clsx from 'clsx'
import { Check, CheckCircle2, FileText } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { Boton, Cargando, Insignia, Lista, Pagina, Pestanas, Vacio } from '@/components/ui'
import { estadoCuenta } from '@/lib/cuenta'
import { fBs, fFechaCorta, fUSD } from '@/lib/formato'
import { useDatos } from '@/lib/useDatos'
import { NOMBRE_METODO, type Cargo } from '@/lib/types'

const ESTADO_PAGO = { pendiente: ['ambar', 'Por aprobar'], aprobado: ['verde', 'Aprobado'], rechazado: ['rojo', 'Rechazado'] } as const

export function Casilla({ marcada }: { marcada: boolean }) {
  return (
    <span className={clsx('grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition', marcada ? 'border-azul bg-azul text-white' : 'border-slate-300 bg-white')}>
      {marcada && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
    </span>
  )
}

export default function Cuenta() {
  const { socio } = useAuth()
  const nav = useNavigate()
  const { datos: c, cargando } = useDatos(() => estadoCuenta(socio!.accion!), [socio?.accion])
  const [vista, setVista] = useState<'pagar' | 'historial'>('pagar')
  const [sel, setSel] = useState<Set<string>>(new Set())

  if (cargando || !c) return <Pagina titulo="Mi cuenta"><Cargando /></Pagina>

  const elegidos = c.pendientes.filter((x) => sel.has(x.id))
  const total = elegidos.reduce((s, x) => s + Number(x.monto_usd), 0)
  const todos = c.pendientes.length > 0 && elegidos.length === c.pendientes.length
  const alternar = (id: string) => setSel((s) => {
    const n = new Set(s)
    if (n.has(id)) n.delete(id)
    else n.add(id)
    return n
  })
  const enRevision = c.cargos.filter((x) => x.estado !== 'pagado' && c.enRevision.has(x.id))
  const pagados = c.cargos.filter((x) => x.estado === 'pagado')

  const fila = (x: Cargo, extra: React.ReactNode, onClick?: () => void) => (
    <button key={x.id} type="button" disabled={!onClick} onClick={onClick} className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-slate-50 disabled:active:bg-transparent">
      {onClick && <Casilla marcada={sel.has(x.id)} />}
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-tinta">{x.concepto}</p>
        <p className="text-sm text-slate-500">{fFechaCorta(x.fecha)}{x.vence && ` · vence ${fFechaCorta(x.vence)}`}</p>
      </div>
      <div className="text-right">
        <p className="font-semibold tabular-nums text-tinta">{fUSD(Number(x.monto_usd))}</p>
        {extra}
      </div>
    </button>
  )

  return (
    <Pagina titulo="Mi cuenta">
      <div className="malla relative overflow-hidden rounded-[32px] p-5 text-white">
        <img src="./brand/isotipo-white.png" alt="" className="pointer-events-none absolute -right-10 -top-4 h-56 rotate-[-12deg] opacity-[.07]" />
        <p className="relative text-[13px] font-medium text-white/70">Total por pagar · Acción {socio?.accion}</p>
        <p className="relative mt-1 font-display text-[44px] font-extrabold leading-none tracking-tight">{fUSD(c.saldo)}</p>
        {c.tasa && (
          <p className="relative mt-2 text-[13px] text-white/70">
            {fBs(c.saldo * c.tasa.bs_por_usd)} · Tasa BCV {c.tasa.bs_por_usd} ({fFechaCorta(c.tasa.fecha)})
          </p>
        )}
        {c.pendientePorAprobar > 0 && <p className="relative mt-2 text-[13px] font-medium text-amarillo">{fUSD(c.pendientePorAprobar)} en pagos por aprobar</p>}
      </div>

      <div className="mt-5">
        <Pestanas opciones={[{ id: 'pagar', texto: 'Por pagar' }, { id: 'historial', texto: 'Historial' }]} valor={vista} onChange={setVista} />
      </div>

      {vista === 'pagar' && (
        <div className="mt-4">
          {c.pendientes.length === 0 && enRevision.length === 0 ? (
            <Vacio icono={<CheckCircle2 />} titulo="¡Estás al día!" texto="No tienes conceptos pendientes por pagar." />
          ) : (
            <>
              {c.pendientes.length > 0 && (
                <>
                  <div className="mb-2 flex items-center justify-between px-1">
                    <p className="text-sm font-semibold text-slate-500">Elige qué quieres pagar</p>
                    <button className="text-sm font-semibold text-azul" onClick={() => setSel(todos ? new Set() : new Set(c.pendientes.map((x) => x.id)))}>
                      {todos ? 'Quitar todo' : 'Seleccionar todo'}
                    </button>
                  </div>
                  <Lista>{c.pendientes.map((x) => fila(x, null, () => alternar(x.id)))}</Lista>
                </>
              )}
              {enRevision.length > 0 && (
                <>
                  <p className="mb-2 mt-5 px-1 text-sm font-semibold text-slate-500">Pago reportado, esperando aprobación</p>
                  <Lista>{enRevision.map((x) => fila(x, <Insignia color="ambar">En revisión</Insignia>))}</Lista>
                </>
              )}
            </>
          )}
        </div>
      )}

      {vista === 'historial' && (
        <div className="mt-4 space-y-5">
          {c.pagos.length === 0 && pagados.length === 0 && <Vacio icono={<FileText />} titulo="Aún no hay movimientos" />}
          {c.pagos.length > 0 && (
            <div>
              <p className="mb-2 px-1 text-sm font-semibold text-slate-500">Pagos reportados</p>
              <Lista>
                {c.pagos.map((p) => {
                  const conceptos = c.cargos.filter((x) => p.cargo_ids?.includes(x.id)).map((x) => x.concepto)
                  return (
                    <div key={p.id} className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-tinta">{NOMBRE_METODO[p.metodo]}</p>
                          <p className="text-sm text-slate-500">Ref. {p.referencia} · {fFechaCorta(p.fecha_pago)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold tabular-nums text-tinta">{p.moneda === 'VES' ? fBs(Number(p.monto)) : fUSD(Number(p.monto))}</p>
                          <Insignia color={ESTADO_PAGO[p.estado][0]}>{ESTADO_PAGO[p.estado][1]}</Insignia>
                        </div>
                      </div>
                      {conceptos.length > 0 && <p className="mt-1 text-xs text-slate-500">Cubre: {conceptos.join(' · ')}</p>}
                      {p.nota_admin && <p className="mt-1.5 rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-600">{p.nota_admin}</p>}
                    </div>
                  )
                })}
              </Lista>
            </div>
          )}
          {pagados.length > 0 && (
            <div>
              <p className="mb-2 px-1 text-sm font-semibold text-slate-500">Conceptos pagados</p>
              <Lista>{pagados.map((x) => fila(x, <Insignia color="verde">Pagado</Insignia>))}</Lista>
            </div>
          )}
        </div>
      )}

      {vista === 'pagar' && elegidos.length > 0 && <div className="h-24" />}

      {/* Barra para pagar la selección */}
      {vista === 'pagar' && elegidos.length > 0 && (
        <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+92px)] z-30 mx-auto max-w-lg px-4">
          <div className="flex items-center gap-3 rounded-[24px] bg-tinta p-3 pl-5 text-white shadow-flota">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-white/60">{elegidos.length} concepto(s)</p>
              <p className="font-display text-lg font-extrabold leading-tight">{fUSD(total)}{c.tasa && <span className="ml-2 text-xs font-medium text-white/60">{fBs(total * c.tasa.bs_por_usd)}</span>}</p>
            </div>
            <Boton variante="acento" onClick={() => nav(`/cuenta/reportar?cargos=${elegidos.map((x) => x.id).join(',')}`)}>Pagar</Boton>
          </div>
        </div>
      )}
    </Pagina>
  )
}
