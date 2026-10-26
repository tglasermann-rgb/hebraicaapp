import { Share2, UserPlus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useAuth } from '@/auth/AuthContext'
import { Boton, Campo, Cargando, CodigoQR, Hoja, Insignia, MensajeError, Pagina, Tarjeta, Vacio, useAviso } from '@/components/ui'
import { api } from '@/lib/api'
import { fFecha, hoyISO } from '@/lib/formato'
import { useDatos } from '@/lib/useDatos'
import type { Invitado } from '@/lib/types'

export function enlacePase(codigo: string) {
  return `${location.origin}${location.pathname}#/pase/${codigo}`
}

export default function Invitados() {
  const { socio } = useAuth()
  const aviso = useAviso()
  const lista = useDatos(() => api.listar('invitados', { eq: { accion: socio!.accion! }, gte: { fecha: hoyISO() }, orden: { campo: 'fecha' } }), [socio?.accion])
  const [nuevo, setNuevo] = useState(false)
  const [ver, setVer] = useState<Invitado | null>(null)
  const [nombre, setNombre] = useState('')
  const [cedula, setCedula] = useState('')
  const [fecha, setFecha] = useState(hoyISO())
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function crear(e: FormEvent) {
    e.preventDefault()
    setError('')
    setEnviando(true)
    try {
      const inv = await api.crear('invitados', { socio_id: socio!.id, accion: socio!.accion!, nombre: nombre.trim(), cedula: cedula.replace(/\D/g, ''), fecha, estado: 'activo' })
      setNuevo(false)
      setNombre('')
      setCedula('')
      lista.recargar()
      setVer(inv)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setEnviando(false)
    }
  }

  async function compartir(i: Invitado) {
    const url = enlacePase(i.codigo)
    const texto = `Hola ${i.nombre}, te invito a Hebraica el ${fFecha(i.fecha, "d 'de' MMMM")}. Muestra este pase en la entrada: ${url}`
    if (navigator.share) await navigator.share({ title: 'Pase de invitado Hebraica', text: texto }).catch(() => {})
    else {
      await navigator.clipboard?.writeText(texto)
      aviso('Enlace copiado')
    }
  }

  async function anular(i: Invitado) {
    if (!confirm(`¿Anular el pase de ${i.nombre}?`)) return
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
              <p className="truncate font-medium text-slate-900">{i.nombre}</p>
              <p className="text-sm text-slate-500">C.I. {i.cedula} · {fFecha(i.fecha, "EEE d 'de' MMM")}</p>
            </div>
            <Insignia color={i.estado === 'activo' ? 'verde' : 'gris'}>{i.estado}</Insignia>
          </Tarjeta>
        ))}
      </div>

      <Hoja abierta={nuevo} onCerrar={() => setNuevo(false)} titulo="Registrar invitado">
        <form onSubmit={crear} className="space-y-4">
          <Campo etiqueta="Nombre y apellido" required value={nombre} onChange={(e) => setNombre(e.target.value)} />
          <Campo etiqueta="Cédula o pasaporte" required value={cedula} onChange={(e) => setCedula(e.target.value)} />
          <Campo etiqueta="Fecha de la visita" type="date" required min={hoyISO()} value={fecha} onChange={(e) => setFecha(e.target.value)} />
          {error && <MensajeError texto={error} />}
          <Boton type="submit" bloque cargando={enviando}>Crear pase</Boton>
        </form>
      </Hoja>

      <Hoja abierta={!!ver} onCerrar={() => setVer(null)} titulo="Pase de invitado">
        {ver && (
          <div className="flex flex-col items-center pb-2 text-center">
            <p className="font-display text-xl font-extrabold text-tinta">{ver.nombre}</p>
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
