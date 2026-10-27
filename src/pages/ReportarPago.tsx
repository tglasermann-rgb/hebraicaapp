import { Check, Copy, ScanText, Upload } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { Boton, Campo, MensajeError, Pagina, Selector, Tarjeta, useAviso } from '@/components/ui'
import { api } from '@/lib/api'
import { estadoCuenta, METODOS_BS, normalizarBancos } from '@/lib/cuenta'
import { fBs, fUSD, hoyISO } from '@/lib/formato'
import { coincide, leerComprobante, type DatosComprobante } from '@/lib/comprobante'
import { useDatos } from '@/lib/useDatos'
import { Casilla } from './Cuenta'
import { NOMBRE_METODO, type MetodoPago } from '@/lib/types'


/** Un dato para copiar: etiqueta arriba, valor abajo y el botón de copiar a la derecha. */
function Dato({ k, v, destacado }: { k: string; v: string; destacado?: boolean }) {
  const [ok, setOk] = useState(false)
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(v)
        setOk(true)
        setTimeout(() => setOk(false), 1500)
      }}
      className="flex w-full items-center gap-3 py-2 text-left"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-xs text-slate-500">{k}</span>
        <span className={destacado ? 'block font-mono text-[15px] font-semibold tracking-tight text-tinta' : 'block text-sm font-medium text-slate-800'}>{v}</span>
      </span>
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${ok ? 'bg-emerald-50 text-emerald-600' : 'bg-elevada text-slate-500'}`}>
        {ok ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
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
  const [metodoElegido, setMetodo] = useState<MetodoPago | null>(null)
  const [monto, setMonto] = useState('')
  const [referencia, setReferencia] = useState('')
  const [fecha, setFecha] = useState(hoyISO())
  const [archivo, setArchivo] = useState<File | null>(null)
  const [lectura, setLectura] = useState<DatosComprobante | null>(null)
  const [leyendo, setLeyendo] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const db = bancos.datos ? normalizarBancos(bancos.datos.valor) : undefined
  // Métodos disponibles: los configurados por Administración, más pago en caja
  const metodos = [...new Set([...(db?.cuentas ?? []).map((c) => c.metodo), 'tarjeta' as MetodoPago, 'efectivo' as MetodoPago])]
  const metodo: MetodoPago = metodoElegido ?? metodos[0] ?? 'transferencia_bs'
  const cuentas = (db?.cuentas ?? []).filter((c) => c.metodo === metodo)
  // Datos iguales en todas las cuentas (titular, RIF) se muestran una sola vez al final
  const comunes = new Set(cuentas.length > 1 ? cuentas[0].datos.map((d) => d.k + d.v).filter((x) => cuentas.every((c) => c.datos.some((d) => d.k + d.v === x))) : [])
  const enBs = METODOS_BS.includes(metodo)
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
  // Lee la captura del comprobante y completa la referencia (y el monto si no estaba)
  async function adjuntar(f: File | null) {
    setArchivo(f)
    setLectura(null)
    if (!f || !f.type.startsWith('image/')) return
    setLeyendo(0)
    try {
      const l = await leerComprobante(f, (p) => setLeyendo(p))
      setLectura(l)
      if (l.referencia) setReferencia(l.referencia)
      if (l.monto && !monto) setMonto(String(l.monto))
    } catch {
      /* si no se puede leer, el socio llena los datos a mano */
    } finally {
      setLeyendo(null)
    }
  }


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
        lectura: lectura ? { referencia: lectura.referencia, monto: lectura.monto, coincide: coincide(lectura, referencia, montoNum) } : null,
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
          {metodos.map((k) => (
            <option key={k} value={k}>{NOMBRE_METODO[k]}</option>
          ))}
        </Selector>

        {db && (
          <Tarjeta className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Datos para pagar · toca para copiar</p>
            {cuentas.map((c, n) => (
              <div key={n} className="mt-3 rounded-2xl bg-elevada/60 px-3.5 py-2">
                {(cuentas.length > 1 || c.titulo !== NOMBRE_METODO[c.metodo]) && <p className="pt-1 text-sm font-semibold text-tinta">{c.titulo}</p>}
                {c.datos.filter((d) => !comunes.has(d.k + d.v)).map((d, i) => <Dato key={d.k} k={d.k} v={d.v} destacado={i === 0} />)}
                {c.nota && <p className="pb-1.5 text-xs font-medium text-amber-700">{c.nota}</p>}
              </div>
            ))}
            {comunes.size > 0 && (
              <div className="mt-3 divide-y divide-linea/5 px-0.5">
                {cuentas[0].datos.filter((d) => comunes.has(d.k + d.v)).map((d) => <Dato key={d.k} k={d.k} v={d.v} />)}
              </div>
            )}
            {cuentas.length === 0 && <p className="mt-2 text-sm text-slate-600">Paga en la caja de Atención al Público y reporta aquí el número del recibo.</p>}
            {db.nota && <p className="mt-3 text-xs leading-relaxed text-slate-500">{db.nota}</p>}
          </Tarjeta>
        )}

        <label className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-superficie px-4 py-4">
          {leyendo != null ? <ScanText className="h-5 w-5 animate-pulse text-azul" /> : <Upload className="h-5 w-5 text-azul" />}
          <span className="flex-1 text-sm text-slate-600">
            {leyendo != null ? `Leyendo el comprobante… ${Math.round(leyendo * 100)}%` : archivo ? archivo.name : 'Sube la captura del comprobante y llenamos los datos por ti'}
          </span>
          <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => adjuntar(e.target.files?.[0] ?? null)} />
        </label>
        {lectura && (
          <div className={`rounded-2xl px-4 py-3 text-sm ${lectura.referencia || lectura.monto ? (coincide(lectura, referencia, montoNum) ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-700') : 'bg-slate-100 text-slate-600'}`}>
            {lectura.referencia || lectura.monto ? (
              <>
                <b>Leímos del comprobante:</b> {lectura.referencia ? `Ref. ${lectura.referencia}` : 'sin referencia'} · {lectura.monto != null ? `monto ${lectura.monto.toLocaleString('es-VE')}` : 'sin monto'}
                {coincide(lectura, referencia, montoNum) ? ' ✓ coincide' : '. Revisa que la referencia y el monto de abajo sean correctos.'}
              </>
            ) : (
              'No pudimos leer el comprobante. Escribe los datos a mano.'
            )}
          </div>
        )}

        <Campo etiqueta={`Monto pagado en ${enBs ? 'bolívares' : 'dólares'}`} inputMode="decimal" required value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="0,00"
          ayuda={enBs && tasa && montoNum > 0 ? `Equivale a ${fUSD(montoUSD)} a tasa BCV ${tasa}` : undefined} />
        <Campo etiqueta="Número de referencia" required value={referencia} onChange={(e) => setReferencia(e.target.value)} />
        <Campo etiqueta="Fecha del pago" type="date" required max={hoyISO()} value={fecha} onChange={(e) => setFecha(e.target.value)} />

        {error && <MensajeError texto={error} />}
        <Boton type="submit" bloque cargando={enviando}>Enviar reporte</Boton>
        <p className="text-center text-xs text-slate-500">Administración verificará el pago y se reflejará en tu estado de cuenta.</p>
      </form>
    </Pagina>
  )
}
