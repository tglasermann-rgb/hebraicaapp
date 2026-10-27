import { History, Share2, UserPlus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useAuth } from '@/auth/AuthContext'
import { AreaTexto, Boton, Campo, Cargando, CodigoQR, Hoja, Insignia, MensajeError, Pagina, Selector, Tarjeta, Vacio, useAviso } from '@/components/ui'
import { TERMINOS_INVITADOS } from '@/lib/datosHebraica'
import { api } from '@/lib/api'
import { fFecha, hoyISO } from '@/lib/formato'
import { useDatos } from '@/lib/useDatos'
import type { Invitado } from '@/lib/types'

export function enlacePase(codigo: string) {
  return `${location.origin}${location.pathname}#/pase/${codigo}`
}

export const TIPOS_INVITADO = ['Familiar', 'Amigo', 'Profesor o entrenador', 'Servicio o proveedor', 'Otro']
const DOCUMENTOS = { V: 'Cédula (V)', E: 'Extranjero (E)', P: 'Pasaporte' } as const
const nombreCompleto = (i: Pick<Invitado, 'nombre' | 'apellido'>) => [i.nombre, i.apellido].filter(Boolean).join(' ')

const VACIO = { nombre: '', apellido: '', tipo_documento: 'V' as Invitado['tipo_documento'], cedula: '', email: '', tipo_invitado: '', placa: '', marca_vehiculo: '', motivo: '' }

export default function Invitados() {
  const { socio } = useAuth()
  const aviso = useAviso()
  const lista = useDatos(() => api.listar('invitados', { eq: { accion: socio!.accion! }, gte: { fecha: hoyISO() }, orden: { campo: 'fecha' } }), [socio?.accion])
  const [nuevo, setNuevo] = useState(false)
  const [ver, setVer] = useState<Invitado | null>(null)
  // Invitados de cualquier fecha, para repetir uno anterior sin volver a escribir sus datos
  const anteriores = useDatos(async () => {
    const todos = await api.listar('invitados', { eq: { accion: socio!.accion! }, orden: { campo: 'created_at', asc: false } })
    const vistos = new Set<string>()
    return todos.filter((i) => !vistos.has(i.tipo_documento + i.cedula) && vistos.add(i.tipo_documento + i.cedula))
  }, [socio?.accion])
  const [verAnteriores, setVerAnteriores] = useState(false)
  const [verTerminos, setVerTerminos] = useState(false)
  const [d, setD] = useState(VACIO)
  const [acepto, setAcepto] = useState(false)
  const [fecha, setFecha] = useState(hoyISO())
  const fijar = (k: keyof typeof VACIO) => (e: { target: { value: string } }) => setD({ ...d, [k]: e.target.value })
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function crear(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!acepto) return setError('Debes aceptar los términos y condiciones')
    setEnviando(true)
    try {
      const limpio = (v: string) => v.trim() || null
      const inv = await api.crear('invitados', {
        socio_id: socio!.id, accion: socio!.accion!, fecha, estado: 'activo', acepto_terminos: true,
        nombre: d.nombre.trim(), apellido: d.apellido.trim(), tipo_documento: d.tipo_documento,
        // Cédula: solo números; pasaporte: letras y números
        cedula: d.tipo_documento === 'P' ? d.cedula.replace(/[^0-9a-z]/gi, '').toUpperCase() : d.cedula.replace(/\D/g, ''),
        email: limpio(d.email.toLowerCase()), tipo_invitado: limpio(d.tipo_invitado), placa: limpio(d.placa.toUpperCase()),
        marca_vehiculo: limpio(d.marca_vehiculo), motivo: limpio(d.motivo),
      })
      setNuevo(false)
      setD(VACIO)
      setAcepto(false)
      lista.recargar()
      anteriores.recargar()
      setVer(inv)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setEnviando(false)
    }
  }

  async function compartir(i: Invitado) {
    const url = enlacePase(i.codigo)
    const texto = `Hola ${nombreCompleto(i)}, te invito a Hebraica el ${fFecha(i.fecha, "d 'de' MMMM")}. Muestra este pase en la entrada: ${url}`
    if (navigator.share) await navigator.share({ title: 'Pase de invitado Hebraica', text: texto }).catch(() => {})
    else {
      await navigator.clipboard?.writeText(texto)
      aviso('Enlace copiado')
    }
  }

  async function anular(i: Invitado) {
    if (!confirm(`¿Anular el pase de ${nombreCompleto(i)}?`)) return
    await api.actualizar('invitados', i.id, { estado: 'anulado' })
    setVer(null)
    lista.recargar()
  }

  return (
    <Pagina titulo="Pases de invitados" atras>
      <Boton bloque onClick={() => setNuevo(true)}><UserPlus className="h-5 w-5" /> Nuevo invitado</Boton>
      <p className="mt-2 text-center text-xs text-slate-500">El invitado recibe un enlace con su código QR. Es válido solo el día indicado.</p>
      <div className="mt-5 space-y-3">
        {lista.cargando ? <Cargando /> : !lista.datos?.length ? <Vacio icono={<UserPlus />} titulo="No tienes invitados registrados" /> : lista.datos.map((i) => (
          <Tarjeta key={i.id} onClick={() => setVer(i)} className="flex items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-slate-900">{nombreCompleto(i)}</p>
              <p className="text-sm text-slate-500">{i.tipo_documento}-{i.cedula} · {fFecha(i.fecha, "EEE d 'de' MMM")}</p>
            </div>
            <Insignia color={i.estado === 'activo' ? 'verde' : 'gris'}>{i.estado}</Insignia>
          </Tarjeta>
        ))}
      </div>

      <Hoja abierta={nuevo} onCerrar={() => setNuevo(false)} titulo="Agregar invitado">
        <form onSubmit={crear} className="space-y-4">
          {!!anteriores.datos?.length && (
            <Boton type="button" variante="secundario" bloque onClick={() => setVerAnteriores(true)}><History className="h-5 w-5" /> Invitados anteriores</Boton>
          )}
          <Campo etiqueta="Fecha de la invitación" type="date" required min={hoyISO()} value={fecha} onChange={(e) => setFecha(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <Campo etiqueta="Nombre" required value={d.nombre} onChange={fijar('nombre')} />
            <Campo etiqueta="Apellido" required value={d.apellido} onChange={fijar('apellido')} />
          </div>
          <div className="grid grid-cols-[1fr_1.2fr] gap-3">
            <Selector etiqueta="Tipo de documento" value={d.tipo_documento} onChange={fijar('tipo_documento')}>
              {Object.entries(DOCUMENTOS).map(([k, t]) => <option key={k} value={k}>{t}</option>)}
            </Selector>
            <Campo etiqueta="Número de documento" required inputMode={d.tipo_documento === 'P' ? 'text' : 'numeric'} value={d.cedula} onChange={fijar('cedula')} />
          </div>
          <Campo etiqueta="Email" type="email" autoCapitalize="none" value={d.email} onChange={fijar('email')} />
          <Selector etiqueta="Tipo de invitado" required value={d.tipo_invitado} onChange={fijar('tipo_invitado')}>
            <option value="" disabled>Selecciona…</option>
            {TIPOS_INVITADO.map((t) => <option key={t}>{t}</option>)}
          </Selector>
          <div className="grid grid-cols-2 gap-3">
            <Campo etiqueta="Placa (si viene en carro)" autoCapitalize="characters" value={d.placa} onChange={fijar('placa')} />
            <Campo etiqueta="Marca del vehículo" value={d.marca_vehiculo} onChange={fijar('marca_vehiculo')} />
          </div>
          <AreaTexto etiqueta="Observación / motivo de la visita" rows={2} value={d.motivo} onChange={fijar('motivo')} />
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={acepto} onChange={(e) => setAcepto(e.target.checked)} className="h-5 w-5 accent-azul" />
            <span className="text-sm text-slate-600">
              Acepto los <button type="button" onClick={() => setVerTerminos(true)} className="font-semibold text-azul underline">términos y condiciones</button>
            </span>
          </label>
          {error && <MensajeError texto={error} />}
          <Boton type="submit" bloque cargando={enviando}>Invitar</Boton>
        </form>
      </Hoja>

      <Hoja abierta={verAnteriores} onCerrar={() => setVerAnteriores(false)} titulo="Invitados anteriores">
        <div className="divide-y divide-linea/5">
          {(anteriores.datos ?? []).map((i) => (
            <button
              key={i.id}
              type="button"
              onClick={() => {
                setD({ nombre: i.nombre, apellido: i.apellido ?? '', tipo_documento: i.tipo_documento ?? 'V', cedula: i.cedula, email: i.email ?? '', tipo_invitado: i.tipo_invitado ?? '', placa: i.placa ?? '', marca_vehiculo: i.marca_vehiculo ?? '', motivo: i.motivo ?? '' })
                setVerAnteriores(false)
              }}
              className="block w-full py-3 text-left"
            >
              <p className="font-medium text-tinta">{nombreCompleto(i)}</p>
              <p className="text-sm text-slate-500">{i.tipo_documento}-{i.cedula}{i.tipo_invitado && ` · ${i.tipo_invitado}`}{i.placa && ` · ${i.placa}`}</p>
            </button>
          ))}
        </div>
      </Hoja>

      <Hoja abierta={verTerminos} onCerrar={() => setVerTerminos(false)} titulo="Términos y condiciones">
        <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600">
          {TERMINOS_INVITADOS.map((t) => <li key={t}>{t}</li>)}
        </ul>
        <Boton bloque className="mt-5" onClick={() => { setAcepto(true); setVerTerminos(false) }}>Acepto</Boton>
      </Hoja>

      <Hoja abierta={!!ver} onCerrar={() => setVer(null)} titulo="Pase de invitado">
        {ver && (
          <div className="flex flex-col items-center pb-2 text-center">
            <p className="font-display text-xl font-extrabold text-tinta">{nombreCompleto(ver)}</p>
            <p className="text-sm text-slate-500">{fFecha(ver.fecha, "EEEE d 'de' MMMM")}</p>
            <div className="mt-4"><CodigoQR valor={`HEB:I:${ver.codigo}`} tam={220} /></div>
            {ver.estado === 'activo' && (
              <div className="mt-5 w-full space-y-2">
                <Boton bloque onClick={() => compartir(ver)}><Share2 className="h-5 w-5" /> Enviar al invitado</Boton>
                <Boton bloque variante="peligro" onClick={() => anular(ver)}>Anular pase</Boton>
              </div>
            )}
          </div>
        )}
      </Hoja>
    </Pagina>
  )
}
