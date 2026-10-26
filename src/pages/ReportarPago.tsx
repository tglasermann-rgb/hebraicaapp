import { Check, Copy, Upload } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { Boton, Campo, MensajeError, Pagina, Selector, Tarjeta, useAviso } from '@/components/ui'
import { api } from '@/lib/api'
import { estadoCuenta } from '@/lib/cuenta'
import { fBs, fUSD, hoyISO } from '@/lib/formato'
import { useDatos } from '@/lib/useDatos'
import { Casilla } from './Cuenta'
import { NOMBRE_METODO, type DatosBancarios, type MetodoPago } from '@/lib/types'

const EN_BS: MetodoPago[] = ['pago_movil', 'transferencia_bs']

function Dato({ k, v }: { k: string; v: string }) {
  const [ok, setOk] = useState(false)
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(v)
        setOk(true)
        setTimeout(() => setOk(false), 1500)
      }}
      className="flex w-full items-center justify-between py-1.5 text-left"
    >
      <span className="text-sm text-slate-500">{k}</span>
      <span className="flex items-center gap-1.5 text-sm font-medium text-slate-900">
        {v} {ok ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
      </span>
    </button>
  )
}

export default function ReportarPago() {
  const { socio } = useAuth()
  const nav = useNavigate()
  const aviso = useAviso()
  const cuenta = useDatos(() => estadoCuenta(socio!.accion!), [socio?.accion])
  const bancos = useDatos(() => api.obtener('configuracion', 'datos_bancarios'))
  const [params] = useSearchParams()
  const [sel, setSel] = useState<Set<string>>(new Set((params.get('cargos') ?? '').split(',').filter(Boolean)))
  const [metodo, setMetodo] = useState<MetodoPago>('pago_movil')
  const [monto, setMonto] = useState('')
  const [referencia, setReferencia] = useState('')
  const [fecha, setFecha] = useState(hoyISO())
  const [archivo, setArchivo] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const enBs = EN_BS.includes(metodo)
  const tasa = cuenta.datos?.tasa?.bs_por_usd ?? null
  const montoNum = Number(monto.replace(',', '.')) || 0
  const montoUSD = enBs ? (tasa ? montoNum / tasa : 0) : montoNum
  const pendientes = cuenta.datos?.pendientes ?? []
  const elegidos = pendientes.filter((x) => sel.has(x.id))
  const totalUSD = Math.round(elegidos.reduce((t, x) => t + Number(x.monto_usd), 0) * 100) / 100
  const alternar = (id: string) => setSel((v) => {
    const n = new Set(v)
    if (n.has(id)) n.delete(id)
    else n.add(id)
    return n
  })
  // El monto a pagar se calcula a partir de lo que el socio eligió
  useEffect(() => {
    setMonto(totalUSD > 0 ? (enBs && tasa ? (totalUSD * tasa).toFixed(2) : totalUSD.toFixed(2)) : '')
  }, [totalUSD, enBs, tasa])
  const db = bancos.datos?.valor as DatosBancarios | undefined

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (elegidos.length === 0) return setError('Elige al menos un concepto a pagar')
    if (montoNum <= 0) return setError('Indica el monto pagado')
    if (enBs && !tasa) return setError('No hay tasa BCV registrada. Intenta más tarde.')
    setEnviando(true)
    try {
      const comprobante_url = archivo ? await api.subirArchivo('comprobantes', archivo) : null
      await api.crear('pagos', {
        accion: socio!.accion!,
        socio_id: socio!.id,
        metodo,
        moneda: enBs ? 'VES' : 'USD',
        monto: montoNum,
        tasa: enBs ? tasa : null,
        monto_usd: Math.round(montoUSD * 100) / 100,
        referencia: referencia.trim(),
        fecha_pago: fecha,
        comprobante_url,
        cargo_ids: elegidos.map((x) => x.id),
        estado: 'pendiente',
        nota_admin: null,
      })
      aviso('Pago reportado. Te avisaremos cuando sea aprobado.')
      nav('/cuenta', { replace: true })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Pagina titulo="Reportar pago" atras>
      <form onSubmit={enviar} className="space-y-4">
        <div>
          <p className="mb-2 px-1 text-[13px] font-semibold text-slate-600">¿Qué estás pagando?</p>
          {pendientes.length === 0 ? (
            <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">No tienes conceptos pendientes por pagar.</p>
          ) : (
            <Tarjeta className="divide-y divide-slate-100 overflow-hidden">
              {pendientes.map((x) => (
                <button key={x.id} type="button" onClick={() => alternar(x.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-slate-50">
                  <Casilla marcada={sel.has(x.id)} />
                  <span className="min-w-0 flex-1 truncate font-medium text-tinta">{x.concepto}</span>
                  <span className="font-semibold tabular-nums">{fUSD(Number(x.monto_usd))}</span>
                </button>
              ))}
              <div className="flex items-center justify-between bg-slate-50 px-4 py-3">
                <span className="text-sm font-semibold text-slate-600">Total a pagar</span>
                <span className="text-right">
                  <span className="block font-display text-lg font-extrabold text-tinta">{fUSD(totalUSD)}</span>
                  {tasa && <span className="block text-xs text-slate-500">{fBs(totalUSD * tasa)} · BCV {tasa}</span>}
                </span>
              </div>
            </Tarjeta>
          )}
        </div>

        <Selector etiqueta="Método de pago" value={metodo} onChange={(e) => setMetodo(e.target.value as MetodoPago)}>
          {Object.entries(NOMBRE_METODO).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </Selector>

        {db && (
          <Tarjeta className="px-4 py-2">
            <p className="pt-1 text-xs font-medium uppercase tracking-wide text-slate-400">Datos para pagar · toca para copiar</p>
            {metodo === 'pago_movil' && (<><Dato k="Banco" v={db.pago_movil.banco} /><Dato k="Teléfono" v={db.pago_movil.telefono} /><Dato k="RIF" v={db.pago_movil.rif} /></>)}
            {metodo === 'transferencia_bs' && (<><Dato k="Banco" v={db.transferencia_bs.banco} /><Dato k="Cuenta" v={db.transferencia_bs.cuenta} /><Dato k="Titular" v={db.transferencia_bs.titular} /><Dato k="RIF" v={db.transferencia_bs.rif} /></>)}
            {metodo === 'zelle' && (<><Dato k="Correo" v={db.zelle.email} /><Dato k="Titular" v={db.zelle.titular} /></>)}
            {metodo === 'transferencia_usd' && (<><Dato k="Banco" v={db.transferencia_usd.banco} /><Dato k="Cuenta" v={db.transferencia_usd.cuenta} /><Dato k="Titular" v={db.transferencia_usd.titular} /></>)}
            {(metodo === 'tarjeta' || metodo === 'efectivo') && <p className="py-2 text-sm text-slate-600">Paga en la caja del club y reporta aquí el número del recibo.</p>}
            {db.nota && <p className="border-t border-slate-100 py-2 text-xs text-slate-500">{db.nota}</p>}
          </Tarjeta>
        )}

        <Campo etiqueta={`Monto pagado en ${enBs ? 'bolívares' : 'dólares'}`} inputMode="decimal" required value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="0,00"
          ayuda={enBs && tasa && montoNum > 0 ? `Equivale a ${fUSD(montoUSD)} a tasa BCV ${tasa}` : undefined} />
        <Campo etiqueta="Número de referencia" required value={referencia} onChange={(e) => setReferencia(e.target.value)} />
        <Campo etiqueta="Fecha del pago" type="date" required max={hoyISO()} value={fecha} onChange={(e) => setFecha(e.target.value)} />

        <label className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-white px-4 py-4">
          <Upload className="h-5 w-5 text-azul" />
          <span className="flex-1 text-sm text-slate-600">{archivo ? archivo.name : 'Adjuntar comprobante (opcional)'}</span>
          <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => setArchivo(e.target.files?.[0] ?? null)} />
        </label>

        {error && <MensajeError texto={error} />}
        <Boton type="submit" bloque cargando={enviando}>Enviar reporte</Boton>
        <p className="text-center text-xs text-slate-500">Administración verificará el pago y se reflejará en tu estado de cuenta.</p>
      </form>
    </Pagina>
  )
}
