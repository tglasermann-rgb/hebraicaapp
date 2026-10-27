// Genera supabase/migrations/0006_datos_hebraica_2026_2027.sql a partir de src/lib/datosHebraica.ts
// Uso: npm run generar:datos
import { writeFileSync } from 'node:fs'

// Node 22 ejecuta TypeScript quitando los tipos (el archivo solo importa tipos)
const d = await import('../src/lib/datosHebraica.ts')

const q = (v) => (v === null || v === undefined ? 'null' : typeof v === 'number' || typeof v === 'boolean' ? String(v) : `'${String(v).replace(/'/g, "''")}'`)
const L = []
L.push('-- ============================================================================')
L.push('-- Datos reales de Hebraica 2026-2027 (Guía de Inscripciones, Calendario y Normas de Pádel).')
L.push('-- GENERADO por scripts/generar-sql-datos.mjs desde src/lib/datosHebraica.ts — no editar a mano.')
L.push('-- Se puede ejecutar más de una vez: no duplica registros. Ejecutar después de 0005.')
L.push('-- ============================================================================\n')

L.push('-- Directorio del club')
L.push('delete from public.directorio;')
for (const c of d.DIRECTORIO)
  L.push(`insert into public.directorio (departamento, responsable, telefono, whatsapp, email, ubicacion, horario, orden) values (${[c.departamento, c.responsable, c.telefono, c.whatsapp, c.email, c.ubicacion, c.horario, c.orden].map(q).join(', ')});`)

L.push('\n-- Métodos de pago')
L.push(`insert into public.configuracion (id, valor) values ('datos_bancarios', ${q(JSON.stringify(d.DATOS_BANCARIOS))}::jsonb)`)
L.push('  on conflict (id) do update set valor = excluded.valor;')

L.push('\n-- Reglas de la cancha de pádel')
const p = d.REGLAS_PADEL
L.push(`update public.instalaciones set hora_apertura = ${q(p.hora_apertura)}, hora_cierre = ${q(p.hora_cierre)}, duracion_min = ${p.duracion_min}, max_reservas_dia = ${p.max_reservas_dia}, max_reservas_activas = ${p.max_reservas_activas}, cancelar_hasta_horas = ${p.cancelar_hasta_horas}, jugadores_min = ${p.jugadores_min}, sancion_horas = ${p.sancion_horas}, descripcion = ${q(p.descripcion)} where tipo ilike 'p_del';`)

L.push('\n-- Actividades 2026-2027')
for (const a of d.ACTIVIDADES) {
  const cols = ['departamento', 'nombre', 'horario', 'descripcion', 'instructor', 'edad_min', 'edad_max', 'nota_precio', 'requisitos', 'lugar', 'programa', 'cupo']
  L.push(`insert into public.actividades (${cols.join(', ')}, precio_usd, inscripciones_abiertas) select ${cols.map((k) => q(a[k])).join(', ')}, 0, true where not exists (select 1 from public.actividades where nombre = ${q(a.nombre)});`)
}

L.push('\n-- Calendario 2026-2027 (eventos de día completo; las festividades judías salen en el calendario judío del app)')
for (const e of d.EVENTOS) {
  const ini = `${e.fecha}T12:00:00-04:00`
  const fin = e.hasta ? `${e.hasta}T12:00:00-04:00` : null
  L.push(`insert into public.eventos (titulo, descripcion, departamento, lugar, fecha_inicio, fecha_fin, todo_el_dia) select ${[e.titulo, e.descripcion, e.departamento, e.lugar, ini, fin].map(q).join(', ')}, true where not exists (select 1 from public.eventos where titulo = ${q(e.titulo)} and fecha_inicio = ${q(ini)});`)
}

L.push('\n-- Normas y reglamentos')
for (const n of d.NORMAS)
  L.push(`insert into public.normas (titulo, departamento, contenido, orden) select ${[n.titulo, n.departamento, n.contenido, n.orden].map(q).join(', ')} where not exists (select 1 from public.normas where titulo = ${q(n.titulo)});`)

writeFileSync('supabase/migrations/0006_datos_hebraica_2026_2027.sql', L.join('\n') + '\n')
console.log(`OK: ${d.ACTIVIDADES.length} actividades, ${d.EVENTOS.length} eventos, ${d.NORMAS.length} normas, ${d.DIRECTORIO.length} contactos`)
