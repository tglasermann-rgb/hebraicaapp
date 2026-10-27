import { createPortal } from 'react-dom'
import clsx from 'clsx'
import { ChevronLeft, ChevronRight, Loader2, X } from 'lucide-react'
import QRCode from 'qrcode'
import { createContext, useCallback, useContext, useEffect, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { depto } from '@/lib/brand'

// ---------------------------------------------------------------------------
// Botones y formularios
// ---------------------------------------------------------------------------

type Variante = 'primario' | 'secundario' | 'acento' | 'peligro' | 'fantasma'

const VARIANTES: Record<Variante, string> = {
  primario: 'bg-azul text-white active:bg-azul-700 disabled:opacity-50',
  secundario: 'bg-azul-50 text-azul active:bg-azul-100',
  acento: 'bg-llama text-white active:brightness-95 disabled:opacity-50',
  peligro: 'bg-red-50 text-red-600 active:bg-red-100',
  fantasma: 'text-azul active:bg-azul-50',
}

export function Boton({
  variante = 'primario',
  cargando,
  bloque,
  className,
  children,
  ...p
}: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante; cargando?: boolean; bloque?: boolean }) {
  return (
    <button
      {...p}
      disabled={p.disabled || cargando}
      className={clsx(
        'inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full px-5 text-[15px] font-semibold tracking-[-0.01em] transition active:scale-[.98] disabled:cursor-not-allowed',
        VARIANTES[variante],
        bloque && 'w-full',
        className,
      )}
    >
      {cargando && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}

const campoBase =
  'w-full rounded-2xl border border-transparent bg-slate-100/80 px-4 py-3.5 text-[16px] text-tinta outline-none transition placeholder:text-slate-400 focus:border-azul/30 focus:bg-superficie focus:ring-4 focus:ring-azul/10'

export function Campo({ etiqueta, ayuda, className, ...p }: InputHTMLAttributes<HTMLInputElement> & { etiqueta?: string; ayuda?: string }) {
  return (
    <label className={clsx('block', className)}>
      {etiqueta && <span className="mb-1.5 block px-1 text-[13px] font-semibold text-slate-600">{etiqueta}</span>}
      <input {...p} className={campoBase} />
      {ayuda && <span className="mt-1.5 block px-1 text-xs text-slate-500">{ayuda}</span>}
    </label>
  )
}

export function AreaTexto({ etiqueta, className, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement> & { etiqueta?: string }) {
  return (
    <label className={clsx('block', className)}>
      {etiqueta && <span className="mb-1.5 block px-1 text-[13px] font-semibold text-slate-600">{etiqueta}</span>}
      <textarea rows={4} {...p} className={campoBase} />
    </label>
  )
}

export function Selector({ etiqueta, className, children, ...p }: SelectHTMLAttributes<HTMLSelectElement> & { etiqueta?: string }) {
  return (
    <label className={clsx('block', className)}>
      {etiqueta && <span className="mb-1.5 block px-1 text-[13px] font-semibold text-slate-600">{etiqueta}</span>}
      <select {...p} className={clsx(campoBase, 'appearance-none bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-9')} style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }}>
        {children}
      </select>
    </label>
  )
}

// ---------------------------------------------------------------------------
// Estructura
// ---------------------------------------------------------------------------

export function Pagina({ titulo, atras, accion, children, sinPadding }: { titulo?: string; atras?: boolean | string; accion?: ReactNode; children: ReactNode; sinPadding?: boolean }) {
  const nav = useNavigate()
  return (
    <div className="pb-6">
      {titulo && (
        <div className="sticky top-0 z-20 bg-fondo/75 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+10px)] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            {atras && (
              <button aria-label="Volver" onClick={() => (typeof atras === 'string' ? nav(atras) : nav(-1))} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-superficie text-tinta shadow-card active:scale-95">
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            <h1 className={clsx('flex-1 truncate font-display font-extrabold text-tinta', atras ? 'text-[22px]' : 'text-[30px]')}>{titulo}</h1>
            {accion}
          </div>
        </div>
      )}
      <div className={clsx('animar-entrada', !sinPadding && 'px-4 pt-2')}>{children}</div>
    </div>
  )
}

export function Tarjeta({ className, children, onClick }: { className?: string; children: ReactNode; onClick?: () => void }) {
  return (
    <div onClick={onClick} className={clsx('relative rounded-3xl shadow-card ring-1 ring-white/[0.06]', !/(^|\s)bg-/.test(className ?? '') && 'bg-superficie', onClick && 'cursor-pointer active:scale-[.99]', className)}>
      {children}
    </div>
  )
}

export function Seccion({ titulo, enlace, children, className }: { titulo: string; enlace?: { a: string; texto?: string }; children: ReactNode; className?: string }) {
  return (
    <section className={clsx('mt-6', className)}>
      <div className="mb-2.5 flex items-baseline justify-between">
        <h2 className="font-display text-[19px] font-bold text-tinta">{titulo}</h2>
        {enlace && (
          <Link to={enlace.a} className="rounded-full bg-azul-50 px-3 py-1 text-[13px] font-semibold text-azul">
            {enlace.texto ?? 'Ver todo'}
          </Link>
        )}
      </div>
      {children}
    </section>
  )
}

export function FilaEnlace({ a, icono, titulo, sub, extra, onClick }: { a?: string; icono?: ReactNode; titulo: ReactNode; sub?: ReactNode; extra?: ReactNode; onClick?: () => void }) {
  const cont = (
    <>
      {icono && <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-azul-50 text-azul">{icono}</span>}
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold text-tinta">{titulo}</span>
        {sub && <span className="block truncate text-sm text-slate-500">{sub}</span>}
      </span>
      {extra}
      {(a || onClick) && <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" />}
    </>
  )
  const cls = 'flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-slate-50'
  if (a) return <Link to={a} className={cls}>{cont}</Link>
  if (onClick) return <button onClick={onClick} className={cls}>{cont}</button>
  return <div className={cls}>{cont}</div>
}

export function Lista({ children }: { children: ReactNode }) {
  return <Tarjeta className="divide-y divide-slate-100/80 overflow-hidden">{children}</Tarjeta>
}

// ---------------------------------------------------------------------------
// Estados
// ---------------------------------------------------------------------------

export function Cargando({ texto = 'Cargando…' }: { texto?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-slate-500">
      <Loader2 className="h-5 w-5 animate-spin text-azul" /> {texto}
    </div>
  )
}

export function Vacio({ icono, titulo, texto, children }: { icono?: ReactNode; titulo: string; texto?: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      {icono && <div className="mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-azul-50 text-azul">{icono}</div>}
      <p className="font-display text-lg font-bold text-tinta">{titulo}</p>
      {texto && <p className="mt-1 text-sm text-slate-500">{texto}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  )
}

export function MensajeError({ texto }: { texto: string }) {
  return <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{texto}</div>
}

const INSIGNIAS = {
  azul: 'bg-azul-50 text-azul',
  verde: 'bg-emerald-50 text-emerald-700',
  ambar: 'bg-amber-50 text-amber-700',
  rojo: 'bg-red-50 text-red-700',
  gris: 'bg-slate-100 text-slate-600',
}

export function Insignia({ color = 'azul', children }: { color?: keyof typeof INSIGNIAS; children: ReactNode }) {
  return <span className={clsx('inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold', INSIGNIAS[color])}>{children}</span>
}

export function Pestanas<T extends string>({ opciones, valor, onChange }: { opciones: { id: T; texto: string }[]; valor: T; onChange: (v: T) => void }) {
  return (
    <div className="flex gap-1 rounded-full bg-slate-200/70 p-1">
      {opciones.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={clsx('flex-1 rounded-full px-3 py-2 text-sm font-semibold transition', valor === o.id ? 'bg-superficie text-tinta shadow-sm' : 'text-slate-500')}
        >
          {o.texto}
        </button>
      ))}
    </div>
  )
}

export function Avatar({ nombre, foto, tam = 40 }: { nombre: string; foto?: string | null; tam?: number }) {
  const ini = nombre.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase()
  if (foto) return <img src={foto} alt="" className="shrink-0 rounded-full object-cover" style={{ width: tam, height: tam }} />
  return (
    <span className="grid shrink-0 place-items-center rounded-full bg-azul font-display font-bold text-white" style={{ width: tam, height: tam, fontSize: tam * 0.36 }}>
      {ini}
    </span>
  )
}

/** Imagen del contenido o, si no hay, una portada con el color del departamento y el isotipo. */
export function Portada({ imagen, departamento, className, children }: { imagen?: string | null; departamento?: string | null; className?: string; children?: ReactNode }) {
  const d = depto(departamento)
  return (
    <div
      className={clsx('relative overflow-hidden', className)}
      style={{ backgroundColor: d.color }}
    >
      {imagen ? (
        <img src={imagen} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <img src="./brand/isotipo-white.png" alt="" className="absolute -bottom-[18%] -right-[6%] h-[110%] rotate-[-8deg] opacity-[.18]" />
      )}
      {children}
    </div>
  )
}

export function CodigoQR({ valor, tam = 240 }: { valor: string; tam?: number }) {
  const [src, setSrc] = useState('')
  useEffect(() => {
    QRCode.toDataURL(valor, { width: tam * 2, margin: 1, errorCorrectionLevel: 'M', color: { dark: '#0E1430', light: '#ffffff' } }).then(setSrc)
  }, [valor, tam])
  return src ? <img src={src} alt="Código QR" width={tam} height={tam} className="rounded-lg" /> : <div style={{ width: tam, height: tam }} className="animate-pulse rounded-lg bg-slate-100" />
}

// ---------------------------------------------------------------------------
// Hoja inferior (modal) y avisos
// ---------------------------------------------------------------------------

export function Hoja({ abierta, onCerrar, titulo, children }: { abierta: boolean; onCerrar: () => void; titulo: string; children: ReactNode }) {
  useEffect(() => {
    if (!abierta) return
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [abierta, onCerrar])
  if (!abierta) return null
  // Portal al body: si se dibuja dentro de la página animada, "fixed" queda relativo a ella y la hoja se corta
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCerrar} />
      <div className="animar-entrada relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-[32px] bg-superficie pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:rounded-[32px]">
        <div className="sticky top-0 z-10 bg-superficie/90 px-5 pb-3 pt-2 backdrop-blur">
          <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-200" />
          <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-extrabold text-tinta">{titulo}</h2>
          <button onClick={onCerrar} aria-label="Cerrar" className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-600">
            <X className="h-5 w-5" />
          </button>
          </div>
        </div>
        <div className="px-5 pt-4">{children}</div>
      </div>
    </div>,
    document.body,
  )
}

const AvisoCtx = createContext<(texto: string, tipo?: 'ok' | 'error') => void>(() => {})

export function AvisoProvider({ children }: { children: ReactNode }) {
  const [aviso, setAviso] = useState<{ texto: string; tipo: 'ok' | 'error'; k: number } | null>(null)
  const mostrar = useCallback((texto: string, tipo: 'ok' | 'error' = 'ok') => setAviso({ texto, tipo, k: Date.now() }), [])
  useEffect(() => {
    if (!aviso) return
    const t = setTimeout(() => setAviso(null), 3500)
    return () => clearTimeout(t)
  }, [aviso])
  return (
    <AvisoCtx.Provider value={mostrar}>
      {children}
      {aviso && (
        <div key={aviso.k} className="pointer-events-none fixed inset-x-0 top-[max(1rem,env(safe-area-inset-top))] z-[60] flex justify-center px-4">
          <div className={clsx('animar-entrada rounded-full px-5 py-3 text-sm font-semibold text-white shadow-flota backdrop-blur-xl', aviso.tipo === 'ok' ? 'bg-elevada/95' : 'bg-red-600/95')}>{aviso.texto}</div>
        </div>
      )}
    </AvisoCtx.Provider>
  )
}

export const useAviso = () => useContext(AvisoCtx)
