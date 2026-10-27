import { CheckCircle2, Trash2, UserCheck, UserX } from 'lucide-react'
import { useState } from 'react'
import { Boton, Campo, Insignia, Selector, Tarjeta, Vacio, useAviso } from '@/components/ui'
import { api } from '@/lib/api'
import { fHace } from '@/lib/formato'
import { useDatos } from '@/lib/useDatos'
import type { Registro } from '@/lib/types'

/** Solicitudes de acceso: Administración verifica que la persona es socio y aprueba su usuario. */
export default function SolicitudesAcceso() {
  const [estado, setEstado] = useState<Registro['estado']>('pendiente')
  const { datos, recargar } = useDatos(async () => {
    const regs = await api.listar('registros', { eq: { estado }, orden: { campo: 'created_at', asc: false } })
    const cedulas = [...new Set(regs.map((r) => r.cedula))]
    const socios = cedulas.length ? await api.listar('socios', { in: { cedula: cedulas } }) : []
    return regs.map((r) => ({ ...r, socio: socios.find((s) => s.cedula === r.cedula) ?? null }))
  }, [estado])
  const incompletas = useDatos(() => api.cuentasIncompletas(), [])
  const aviso = useAviso()

  async function borrarIncompleta(userId: string, usuario: string) {
    if (!confirm(`¿Borrar el usuario "${usuario}"? Podrá registrarse de nuevo.`)) return
    try {
      await api.eliminarCuenta(userId)
      aviso('Usuario borrado')
      incompletas.recargar()
    } catch (e) {
      aviso((e as Error).message, 'error')
    }
  }

  return (
    <div>
      {!!incompletas.datos?.length && (
        <Tarjeta className="mb-4 p-4">
          <p className="flex items-center gap-2 font-semibold text-tinta"><UserX className="h-4 w-4 text-amber-500" />Usuarios sin solicitud</p>
          <p className="mt-1 text-sm text-slate-500">Se crearon pero su solicitud no llegó (un registro quedó a medias). Bórralos para que la persona se registre de nuevo con ese usuario.</p>
          <div className="mt-2 divide-y divide-linea/5">
            {incompletas.datos.map((c) => (
              <div key={c.user_id} className="flex items-center justify-between py-2">
                <span className="text-sm"><b>{c.usuario}</b>{c.creada && <span className="text-slate-500"> · {fHace(c.creada)}</span>}</span>
                <button onClick={() => borrarIncompleta(c.user_id, c.usuario)} className="flex items-center gap-1 text-sm font-medium text-red-500"><Trash2 className="h-4 w-4" />Borrar</button>
              </div>
            ))}
          </div>
        </Tarjeta>
      )}
      <Selector value={estado} onChange={(e) => setEstado(e.target.value as Registro['estado'])} className="mb-3">
        <option value="pendiente">Por aprobar</option>
        <option value="aprobado">Aprobadas</option>
        <option value="rechazado">Rechazadas</option>
      </Selector>
      {datos?.length === 0 && <Vacio icono={<UserCheck />} titulo="No hay solicitudes en esta lista" />}
      <div className="space-y-3">
        {(datos ?? []).map((r) => <Solicitud key={r.id} r={r} alTerminar={recargar} />)}
      </div>
    </div>
  )
}

function Solicitud({ r, alTerminar }: { r: Registro & { socio: { nombre: string; apellido: string; accion: string | null; user_id: string | null } | null }; alTerminar: () => void }) {
  const aviso = useAviso()
  const [accion, setAccion] = useState('')
  const [parentesco, setParentesco] = useState('titular')
  const [motivo, setMotivo] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const yaTieneUsuario = !!r.socio?.user_id

  async function correr(fn: () => Promise<void>, ok: string) {
    setOcupado(true)
    try {
      await fn()
      aviso(ok)
      alTerminar()
    } catch (e) {
      aviso((e as Error).message, 'error')
    } finally {
      setOcupado(false)
    }
  }

  return (
    <Tarjeta className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-lg font-extrabold">{r.nombre} {r.apellido}</p>
          <p className="text-sm text-slate-500">C.I. {Number(r.cedula).toLocaleString('es-VE')} · usuario <b className="text-slate-700">{r.usuario}</b></p>
          <p className="text-xs text-slate-400">Solicitado {fHace(r.created_at)}</p>
        </div>
        {r.estado !== 'pendiente' && <Insignia color={r.estado === 'aprobado' ? 'verde' : 'rojo'}>{r.estado}</Insignia>}
      </div>

      {r.estado === 'rechazado' && r.motivo && <p className="mt-2 text-sm text-slate-500">Motivo: {r.motivo}</p>}
      {r.estado === 'rechazado' && (
        <button
          disabled={ocupado}
          onClick={() => confirm(`¿Borrar la solicitud y el usuario "${r.usuario}"? Podrá registrarse de nuevo.`) && correr(() => api.eliminarCuenta(r.user_id), 'Solicitud borrada')}
          className="mt-3 flex items-center gap-1 text-sm font-medium text-red-500"
        >
          <Trash2 className="h-4 w-4" />Borrar solicitud
        </button>
      )}

      {r.estado === 'pendiente' && (
        <>
          {r.socio ? (
            <div className={`mt-3 flex items-center gap-2 rounded-2xl px-3 py-2.5 text-sm ${yaTieneUsuario ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-800'}`}>
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {yaTieneUsuario
                ? `Esta cédula ya tiene usuario (${r.socio.nombre} ${r.socio.apellido}). Probablemente es un duplicado.`
                : `Coincide con el socio ${r.socio.nombre} ${r.socio.apellido} · Acción ${r.socio.accion}`}
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              <p className="rounded-2xl bg-amber-50 px-3 py-2.5 text-sm text-amber-700">No hay un socio registrado con esta cédula. Si es socio, indica su acción para crearlo.</p>
              <div className="grid grid-cols-2 gap-3">
                <Campo etiqueta="Acción" value={accion} onChange={(e) => setAccion(e.target.value)} />
                <Selector etiqueta="Parentesco" value={parentesco} onChange={(e) => setParentesco(e.target.value)}>
                  <option value="titular">Titular</option>
                  <option value="conyuge">Cónyuge</option>
                  <option value="hijo">Hijo(a)</option>
                  <option value="otro">Otro</option>
                </Selector>
              </div>
            </div>
          )}
          <Campo className="mt-3" placeholder="Motivo (si se rechaza)" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Boton variante="peligro" disabled={ocupado} onClick={() => (motivo.trim() ? correr(() => api.rechazarRegistro(r.id, motivo), 'Solicitud rechazada') : aviso('Indica el motivo del rechazo', 'error'))}>Rechazar</Boton>
            <Boton cargando={ocupado} disabled={yaTieneUsuario || (!r.socio && !accion.trim())} onClick={() => correr(() => api.aprobarRegistro(r.id, accion, parentesco), 'Acceso aprobado')}>Aprobar</Boton>
          </div>
          <button
            disabled={ocupado}
            onClick={() => confirm(`¿Borrar la solicitud y el usuario "${r.usuario}"? Podrá registrarse de nuevo con los datos correctos.`) && correr(() => api.eliminarCuenta(r.user_id), 'Solicitud borrada')}
            className="mx-auto mt-3 flex items-center gap-1 text-sm font-medium text-red-500"
          >
            <Trash2 className="h-4 w-4" />Borrar solicitud (se equivocó)
          </button>
        </>
      )}
    </Tarjeta>
  )
}
