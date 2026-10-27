-- ============================================================================
-- Mi Hebraica — invitados con datos completos, reservas de Pádel / Pilates /
-- Bowling y noticias de ejemplo. Ejecutar después de 0010.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Invitados: mismos datos que pide portería
-- ---------------------------------------------------------------------------
alter table public.invitados add column if not exists apellido text;
alter table public.invitados add column if not exists tipo_documento text not null default 'V';
alter table public.invitados drop constraint if exists invitados_tipo_documento_check;
alter table public.invitados add constraint invitados_tipo_documento_check check (tipo_documento in ('V','E','P'));
alter table public.invitados add column if not exists email text;
alter table public.invitados add column if not exists tipo_invitado text;
alter table public.invitados add column if not exists placa text;
alter table public.invitados add column if not exists marca_vehiculo text;
alter table public.invitados add column if not exists motivo text;
alter table public.invitados add column if not exists acepto_terminos boolean not null default false;

-- Para crear un pase hay que aceptar los términos
drop policy if exists invitados_crear on public.invitados;
create policy invitados_crear on public.invitados for insert to authenticated
  with check (accion = public.mi_accion() and socio_id = (public.mi_socio()).id and estado = 'activo'
              and acepto_terminos and fecha >= (now() at time zone 'America/Caracas')::date);

create or replace function public.pase_invitado(p_codigo text) returns json
language sql stable security definer set search_path = public as $$
  select json_build_object('nombre', i.nombre || coalesce(' ' || i.apellido, ''), 'fecha', i.fecha, 'estado', i.estado, 'anfitrion', s.nombre || ' ' || s.apellido)
  from public.invitados i join public.socios s on s.id = i.socio_id where i.codigo = p_codigo
$$;

-- El escáner muestra nombre completo, documento, tipo de invitado y vehículo
create or replace function public.validar_codigo(p_codigo text) returns json
language plpgsql security definer set search_path = public as $$
declare
  v_tipo text; v_val text; v_s public.socios; v_i public.invitados; v_e public.entradas; v_ev public.eventos;
  v_tok public.tokens_carnet; v_res json; v_staff uuid;
begin
  if not public.tiene_rol(array['admin','seguridad','eventos']) then raise exception 'No autorizado'; end if;
  v_staff := (public.mi_socio()).id;
  v_tipo := split_part(p_codigo, ':', 2);
  v_val := split_part(p_codigo, ':', 3);

  if split_part(p_codigo, ':', 1) <> 'HEB' then
    return json_build_object('valido', false, 'tipo', 'desconocido', 'mensaje', 'Código no reconocido');
  end if;

  if v_tipo = 'S' then
    select * into v_tok from public.tokens_carnet where token = v_val;
    if v_tok.token is null or v_tok.expira < now() then
      v_res := json_build_object('valido', false, 'tipo', 'socio', 'mensaje', 'Carnet vencido. Pida al socio abrir el carnet de nuevo.');
    else
      select * into v_s from public.socios where id = v_tok.socio_id;
      delete from public.tokens_carnet where token = v_val;
      if v_s.estado <> 'activo' then
        v_res := json_build_object('valido', false, 'tipo', 'socio', 'nombre', v_s.nombre || ' ' || v_s.apellido,
          'detalle', 'Acción ' || coalesce(v_s.accion, '-'), 'foto_url', v_s.foto_url, 'mensaje', 'Socio suspendido. Dirigir a Atención al Público.');
      else
        v_res := json_build_object('valido', true, 'tipo', 'socio', 'nombre', v_s.nombre || ' ' || v_s.apellido,
          'detalle', 'Acción ' || coalesce(v_s.accion, '-'), 'foto_url', v_s.foto_url, 'mensaje', 'Acceso permitido');
      end if;
    end if;
    insert into public.accesos(tipo, referencia_id, nombre, resultado, motivo, escaneado_por)
      values ('socio', v_s.id, v_res->>'nombre', case when (v_res->>'valido')::boolean then 'permitido' else 'denegado' end, v_res->>'mensaje', v_staff);
    return v_res;

  elsif v_tipo = 'I' then
    select * into v_i from public.invitados where codigo = v_val;
    if v_i.id is null then
      v_res := json_build_object('valido', false, 'tipo', 'invitado', 'mensaje', 'Pase no encontrado');
    elsif v_i.estado <> 'activo' then
      v_res := json_build_object('valido', false, 'tipo', 'invitado', 'nombre', v_i.nombre || coalesce(' ' || v_i.apellido, ''), 'mensaje', 'Pase ' || v_i.estado);
    elsif v_i.fecha <> (now() at time zone 'America/Caracas')::date then
      v_res := json_build_object('valido', false, 'tipo', 'invitado', 'nombre', v_i.nombre || coalesce(' ' || v_i.apellido, ''), 'mensaje', 'El pase es para el ' || to_char(v_i.fecha, 'DD/MM/YYYY'));
    else
      update public.invitados set estado = 'usado' where id = v_i.id;
      v_res := json_build_object('valido', true, 'tipo', 'invitado', 'nombre', v_i.nombre || coalesce(' ' || v_i.apellido, ''),
        'detalle', v_i.tipo_documento || '-' || v_i.cedula || ' · Invitado de la acción ' || v_i.accion
          || coalesce(' · ' || v_i.tipo_invitado, '')
          || coalesce(' · Vehículo ' || nullif(trim(coalesce(v_i.marca_vehiculo, '') || ' ' || coalesce(v_i.placa, '')), ''), ''),
        'mensaje', 'Acceso permitido');
    end if;
    insert into public.accesos(tipo, referencia_id, nombre, resultado, motivo, escaneado_por)
      values ('invitado', v_i.id, v_i.nombre || coalesce(' ' || v_i.apellido, ''), case when (v_res->>'valido')::boolean then 'permitido' else 'denegado' end, v_res->>'mensaje', v_staff);
    return v_res;

  elsif v_tipo = 'E' then
    select * into v_e from public.entradas where codigo = v_val;
    if v_e.id is null then
      v_res := json_build_object('valido', false, 'tipo', 'entrada', 'mensaje', 'Entrada no encontrada');
    else
      select * into v_ev from public.eventos where id = v_e.evento_id;
      if v_e.estado <> 'activa' then
        v_res := json_build_object('valido', false, 'tipo', 'entrada', 'nombre', v_e.nombre_asistente, 'detalle', v_ev.titulo, 'mensaje', 'Entrada ' || v_e.estado);
      else
        update public.entradas set estado = 'usada' where id = v_e.id;
        v_res := json_build_object('valido', true, 'tipo', 'entrada', 'nombre', v_e.nombre_asistente, 'detalle', v_ev.titulo, 'mensaje', 'Entrada válida');
      end if;
    end if;
    insert into public.accesos(tipo, referencia_id, nombre, resultado, motivo, escaneado_por)
      values ('entrada', v_e.id, v_e.nombre_asistente, case when (v_res->>'valido')::boolean then 'permitido' else 'denegado' end, v_res->>'mensaje', v_staff);
    return v_res;
  end if;

  return json_build_object('valido', false, 'tipo', 'desconocido', 'mensaje', 'Código no reconocido');
end $$;

-- ---------------------------------------------------------------------------
-- Reservas: solo Pádel, Pilates y Bowling (las demás quedan inactivas, no se borran)
-- ---------------------------------------------------------------------------
update public.instalaciones set activo = false where tipo not in ('Pádel','Pilates','Bowling');
insert into public.instalaciones (nombre, tipo, descripcion, hora_apertura, hora_cierre, duracion_min, max_reservas_dia, activo)
select 'Pilates', 'Pilates', 'Reserva tu clase de Pilates. Bloques de 1 hora. Llega 5 minutos antes.', '07:00', '19:00', 60, 1, true
where not exists (select 1 from public.instalaciones where tipo = 'Pilates');
insert into public.instalaciones (nombre, tipo, descripcion, hora_apertura, hora_cierre, duracion_min, max_reservas_dia, activo)
select 'Bowling Hebraica', 'Bowling', 'Reserva una pista de bowling. Bloques de 1 hora.', '10:00', '21:00', 60, 1, true
where not exists (select 1 from public.instalaciones where tipo = 'Bowling');

-- ---------------------------------------------------------------------------
-- Noticias de ejemplo (se pueden editar o borrar en Admin → Noticias)
-- ---------------------------------------------------------------------------
insert into public.noticias (titulo, resumen, contenido, departamento, destacado, publicado_en)
select v.titulo, v.resumen, v.contenido, v.departamento, v.destacado, now() - v.hace
from (values
  ('Hebraica volvió a decir presente en un escenario internacional',
   'Tres jóvenes nadadoras representaron a Hebraica y a la Kehilá en una competencia internacional.',
   'Tres jóvenes nadadoras representaron a Hebraica y a la Kehilá en una competencia internacional. ¡Felicitaciones a nuestras atletas, a sus entrenadores y a sus familias por su esfuerzo y dedicación!',
   'club', true, interval '1 day'),
  ('Hebraica ofreció tres semanas de Actividades Recreativas para acompañar a las familias',
   'Un espacio de encuentro y contención para las familias en un momento de especial sensibilidad.',
   'Durante tres semanas Hebraica ofreció actividades recreativas para acompañar a las familias en un momento de especial sensibilidad. Gracias a todo el equipo y a los voluntarios que lo hicieron posible.',
   'club', false, interval '4 days'),
  ('Con gratitud y emoción, Hebraica despidió a la delegación israelí',
   'La delegación acompañó a Venezuela en uno de los momentos más difíciles.',
   'Con gratitud y emoción, Hebraica despidió a la delegación israelí que acompañó a Venezuela en uno de los momentos más difíciles. Gracias por su compromiso y solidaridad.',
   'club', false, interval '8 days'),
  ('Unidos en Comunidad celebramos la Gran Fiesta de Purim',
   'Disfraces, música y alegría para toda la familia.',
   'Unidos en comunidad celebramos la Gran Fiesta de Purim con disfraces, música, juegos y mucha alegría para toda la familia. ¡Gracias a todos por acompañarnos!',
   'club', false, interval '12 days'),
  ('XXXII Torneo de Escuelas Deportivas Hebraica 2026 – Copa BNC',
   'Nuestras escuelas deportivas compitieron en una nueva edición del torneo.',
   'Se celebró el XXXII Torneo de Escuelas Deportivas Hebraica 2026 – Copa BNC, con la participación de nuestros atletas de todas las categorías. ¡Felicitaciones a todos los participantes!',
   'deportes', false, interval '15 days')
) as v(titulo, resumen, contenido, departamento, destacado, hace)
where not exists (select 1 from public.noticias n where n.titulo = v.titulo);
