import { FileText, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { Boton, Cargando, Insignia, Lista, Pagina, Pestanas, Vacio } from '@/components/ui'
import { estadoCuenta } from '@/lib/cuenta'
import { fBs, fFechaCorta, fUSD } from '@/lib/formato'
import { useDatos } from '@/lib/useDatos'
import { NOMBRE_METODO } from '@/lib/types'

const ESTADO_PAGO = { pendiente: ['ambar', 'Por aprobar'], aprobado: ['verde', 'Aprobado'], rechazado: ['rojo', 'Rechazado'] } as const

export default function Cuenta() {
  const { socio } = useAuth()
  const { datos: c, cargando } = useDatos(() => estadoCuenta(socio!.accion!), [socio?.accion])
  const [vista, setVista] = useState<'cargos' | 'pagos'>('cargos')

  return (
    <Pagina titulo="Mi cuenta">
      {cargando || !c ? (
        <Cargando />
      ) : (
        <>
          <div className="malla ruido relative overflow-hidden rounded-[32px] p-5 text-white shadow-flota">
            <img src="./brand/isotipo-white.png" alt="" className="pointer-events-none absolute -right-10 -top-4 h-56 rotate-[-12deg] opacity-[.07]" />
            <p className="relative text-[13px] font-medium text-white/60">Saldo pendiente · Acción {socio?.accion}</p>
            <p className="relative mt-1 font-display text-[44px] font-extrabold leading-none tracking-tight">{c.saldo > 0 ? fUSD(c.saldo) : fUSD(0)}</p>
            {c.tasa && (
              <p className="relative mt-2 text-[13px] text-white/60">
                {fBs(Math.max(c.saldo, 0) * c.tasa.bs_por_usd)} · Tasa BCV {c.tasa.bs_por_usd} ({fFechaCorta(c.tasa.fecha)})
              </p>
            )}
            {c.saldo < 0 && <p className="mt-1 text-sm text-amarillo">Saldo a favor: {fUSD(-c.saldo)}</p>}
            {c.pendientePorAprobar > 0 && <p className="mt-2 text-sm text-amarillo">{fUSD(c.pendientePorAprobar)} en pagos por aprobar</p>}
            <Link to="/cuenta/reportar" className="relative">
              <Boton variante="acento" bloque className="mt-5">
                <Plus className="h-5 w-5" /> Reportar un pago
              </Boton>
            </Link>
          </div>

          <div className="mt-5">
            <Pestanas opciones={[{ id: 'cargos', texto: 'Cargos' }, { id: 'pagos', texto: 'Mis pagos' }]} valor={vista} onChange={setVista} />
          </div>

          <div className="mt-3">
            {vista === 'cargos' &&
              (c.cargos.length === 0 ? (
                <Vacio icono={<FileText />} titulo="Sin cargos" />
              ) : (
                <Lista>
                  {c.cargos.map((x) => (
                    <div key={x.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-slate-900">{x.concepto}</p>
                        <p className="text-sm text-slate-500">{fFechaCorta(x.fecha)}{x.vence && ` · vence ${fFechaCorta(x.vence)}`}</p>
                      </div>
                      <p className="font-medium text-slate-900">{fUSD(Number(x.monto_usd))}</p>
                    </div>
                  ))}
                </Lista>
              ))}
            {vista === 'pagos' &&
              (c.pagos.length === 0 ? (
                <Vacio icono={<FileText />} titulo="Aún no has reportado pagos" />
              ) : (
                <Lista>
                  {c.pagos.map((p) => (
                    <div key={p.id} className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-slate-900">{NOMBRE_METODO[p.metodo]}</p>
                          <p className="text-sm text-slate-500">Ref. {p.referencia} · {fFechaCorta(p.fecha_pago)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-slate-900">{p.moneda === 'VES' ? fBs(Number(p.monto)) : fUSD(Number(p.monto))}</p>
                          <Insignia color={ESTADO_PAGO[p.estado][0]}>{ESTADO_PAGO[p.estado][1]}</Insignia>
                        </div>
                      </div>
                      {p.nota_admin && <p className="mt-1.5 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">{p.nota_admin}</p>}
                    </div>
                  ))}
                </Lista>
              ))}
          </div>
        </>
      )}
    </Pagina>
  )
}
