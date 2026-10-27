import { useParams } from 'react-router-dom'
import { Cargando, CodigoQR } from '@/components/ui'
import { api } from '@/lib/api'
import { CLUB } from '@/lib/brand'
import { fFecha } from '@/lib/formato'
import { useDatos } from '@/lib/useDatos'

/** Página pública que ve el invitado (no necesita cuenta). */
export default function PaseInvitado() {
  const { codigo } = useParams()
  const { datos, cargando } = useDatos(() => api.paseInvitado(codigo!), [codigo])
  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-lg flex-col items-center bg-fondo px-6 pb-10 pt-[calc(env(safe-area-inset-top)+2rem)] text-white">
      <img src="./brand/logo-white.png" alt="Hebraica" className="h-28" />
      <div className="mt-8 w-full rounded-3xl bg-superficie p-6 text-center text-slate-900">
        {cargando ? (
          <Cargando />
        ) : !datos ? (
          <p>Este pase no existe.</p>
        ) : (
          <>
            <p className="text-sm uppercase tracking-wide text-slate-500">Pase de invitado</p>
            <p className="mt-1 font-display text-[26px] font-extrabold text-tinta">{datos.nombre}</p>
            <p className="text-slate-600">{fFecha(datos.fecha, "EEEE d 'de' MMMM yyyy")}</p>
            <p className="mt-1 text-sm text-slate-500">Invitado por {datos.anfitrion}</p>
            {datos.estado === 'activo' ? (
              <div className="mt-5 flex justify-center"><CodigoQR valor={`HEB:I:${codigo}`} tam={230} /></div>
            ) : (
              <p className="mt-5 rounded-2xl bg-slate-100 p-4 text-slate-600">Este pase ya fue {datos.estado}.</p>
            )}
            <p className="mt-5 text-xs text-slate-500">Presenta este código y tu documento de identidad en la entrada.</p>
          </>
        )}
      </div>
      <p className="mt-6 text-sm text-white/70">{CLUB.lema}</p>
    </div>
  )
}
