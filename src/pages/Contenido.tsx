import { Clock, Image as ImageIcon, Mail, MapPin, MessageCircle, Newspaper, Phone, UtensilsCrossed } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Cargando, Pagina, Portada, Tarjeta, Vacio } from '@/components/ui'
import { api } from '@/lib/api'
import { depto } from '@/lib/brand'
import { fFecha, fHace } from '@/lib/formato'
import { useDatos } from '@/lib/useDatos'

// ---------------- Noticias ----------------

export function Noticias() {
  const { datos, cargando } = useDatos(() => api.listar('noticias', { orden: { campo: 'publicado_en', asc: false } }))
  return (
    <Pagina titulo="Noticias" atras>
      {cargando ? <Cargando /> : !datos?.length ? <Vacio icono={<Newspaper />} titulo="Sin noticias" /> : (
        <div className="space-y-4">
          {datos.map((n, i) => (
            <Link key={n.id} to={`/noticias/${n.id}`} className="block">
              <Tarjeta className="overflow-hidden">
                <Portada imagen={n.imagen_url} departamento={n.departamento} className={i === 0 ? 'h-44' : 'h-28'} />
                <div className="p-4">
                  <p className="text-xs font-medium" style={{ color: depto(n.departamento).color }}>{depto(n.departamento).nombre} · {fHace(n.publicado_en)}</p>
                  <p className="mt-0.5 font-display text-lg font-extrabold leading-snug text-tinta">{n.titulo}</p>
                  {n.resumen && <p className="mt-1 line-clamp-2 text-sm text-slate-600">{n.resumen}</p>}
                </div>
              </Tarjeta>
            </Link>
          ))}
        </div>
      )}
    </Pagina>
  )
}

export function Noticia() {
  const { id } = useParams()
  const { datos: n, cargando } = useDatos(() => api.obtener('noticias', id!), [id])
  if (cargando) return <Pagina titulo="Noticia" atras><Cargando /></Pagina>
  if (!n) return <Pagina titulo="Noticia" atras><Vacio titulo="No encontrada" /></Pagina>
  return (
    <Pagina titulo="Noticia" atras sinPadding>
      <Portada imagen={n.imagen_url} departamento={n.departamento} className="h-52" />
      <article className="px-4 pt-4">
        <p className="text-sm font-medium" style={{ color: depto(n.departamento).color }}>{depto(n.departamento).nombre} · {fFecha(n.publicado_en)}</p>
        <h2 className="mt-1 font-display text-[26px] font-extrabold leading-tight text-tinta">{n.titulo}</h2>
        {n.resumen && <p className="mt-3 text-lg text-slate-600">{n.resumen}</p>}
        {n.contenido && <div className="mt-4 whitespace-pre-line leading-relaxed text-slate-800">{n.contenido}</div>}
      </article>
    </Pagina>
  )
}

// ---------------- Galería ----------------

export function Galeria() {
  const { datos, cargando } = useDatos(() => api.listar('albumes', { orden: { campo: 'fecha', asc: false } }))
  return (
    <Pagina titulo="Galería" atras>
      {cargando ? <Cargando /> : !datos?.length ? <Vacio icono={<ImageIcon />} titulo="Aún no hay álbumes" /> : (
        <div className="grid grid-cols-2 gap-3">
          {datos.map((a) => (
            <Link key={a.id} to={`/galeria/${a.id}`}>
              <Tarjeta className="overflow-hidden">
                <Portada imagen={a.portada_url} className="aspect-square" />
                <div className="p-2.5">
                  <p className="truncate text-sm font-medium text-slate-900">{a.titulo}</p>
                  <p className="text-xs text-slate-500">{fFecha(a.fecha, 'MMM yyyy')}</p>
                </div>
              </Tarjeta>
            </Link>
          ))}
        </div>
      )}
    </Pagina>
  )
}

export function Album() {
  const { id } = useParams()
  const album = useDatos(() => api.obtener('albumes', id!), [id])
  const fotos = useDatos(() => api.listar('fotos', { eq: { album_id: id! }, orden: { campo: 'created_at' } }), [id])
  const [ver, setVer] = useState<string | null>(null)
  return (
    <Pagina titulo={album.datos?.titulo ?? 'Álbum'} atras>
      {fotos.cargando ? <Cargando /> : !fotos.datos?.length ? <Vacio icono={<ImageIcon />} titulo="Este álbum aún no tiene fotos" /> : (
        <div className="-mx-4 grid grid-cols-3 gap-0.5">
          {fotos.datos.map((f) => (
            <button key={f.id} onClick={() => setVer(f.url)} className="aspect-square overflow-hidden bg-slate-200">
              <img src={f.url} alt="" loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
      {ver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black" onClick={() => setVer(null)}>
          <img src={ver} alt="" className="max-h-full max-w-full" />
        </div>
      )}
    </Pagina>
  )
}

// ---------------- Directorio ----------------

export function Directorio() {
  const { datos, cargando } = useDatos(() => api.listar('directorio', { orden: { campo: 'orden' } }))
  return (
    <Pagina titulo="Directorio" atras>
      {cargando ? <Cargando /> : (
        <div className="space-y-3">
          {datos!.map((c) => (
            <Tarjeta key={c.id} className="p-4">
              <p className="font-display text-lg font-extrabold text-tinta">{c.departamento}</p>
              {c.responsable && <p className="text-sm text-slate-600">{c.responsable}</p>}
              <div className="mt-1 space-y-0.5 text-sm text-slate-500">
                {c.ubicacion && <p className="flex items-center gap-2"><MapPin className="h-4 w-4" />{c.ubicacion}</p>}
                {c.horario && <p className="flex items-center gap-2"><Clock className="h-4 w-4" />{c.horario}</p>}
              </div>
              <div className="mt-3 flex gap-2">
                {c.telefono && <a href={`tel:${c.telefono.replace(/[^\d+]/g, '')}`} className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-azul-50 py-2.5 text-sm font-medium text-azul"><Phone className="h-4 w-4" />Llamar</a>}
                {c.whatsapp && <a href={`https://wa.me/${c.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-emerald-50 py-2.5 text-sm font-medium text-emerald-700"><MessageCircle className="h-4 w-4" />WhatsApp</a>}
                {c.email && <a href={`mailto:${c.email}`} className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-slate-100 py-2.5 text-sm font-medium text-slate-700"><Mail className="h-4 w-4" />Correo</a>}
              </div>
            </Tarjeta>
          ))}
        </div>
      )}
    </Pagina>
  )
}

// ---------------- Restaurantes ----------------

export function Restaurantes() {
  const { datos, cargando } = useDatos(() => api.listar('restaurantes', { orden: { campo: 'orden' } }))
  return (
    <Pagina titulo="Restaurantes" atras>
      {cargando ? <Cargando /> : !datos?.length ? <Vacio icono={<UtensilsCrossed />} titulo="Sin información" /> : (
        <div className="space-y-4">
          {datos.map((r) => (
            <Tarjeta key={r.id} className="overflow-hidden">
              <Portada imagen={r.imagen_url} departamento="espacio" className="h-32" />
              <div className="p-4">
                <p className="font-display text-lg font-extrabold text-tinta">{r.nombre}</p>
                {r.descripcion && <p className="mt-1 text-sm text-slate-600">{r.descripcion}</p>}
                <div className="mt-2 space-y-1 text-sm text-slate-600">
                  {r.horario && <p className="flex items-start gap-2"><Clock className="mt-0.5 h-4 w-4 shrink-0 text-llama" /><span className="whitespace-pre-line">{r.horario}</span></p>}
                  {r.ubicacion && <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-llama" />{r.ubicacion}</p>}
                  {r.telefono && <a href={`tel:${r.telefono.replace(/[^\d+]/g, '')}`} className="flex items-center gap-2 text-azul"><Phone className="h-4 w-4" />{r.telefono}</a>}
                </div>
              </div>
            </Tarjeta>
          ))}
        </div>
      )}
    </Pagina>
  )
}
