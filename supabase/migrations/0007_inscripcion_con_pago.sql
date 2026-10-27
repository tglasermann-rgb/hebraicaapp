-- ============================================================================
-- Mi Hebraica — inscribirse = pagar.
-- Una actividad con precio queda "pendiente de pago" (aparta el cupo) hasta que
-- se aprueba el pago de su cargo; si en 48 h no se reporta ningún pago, se libera.
-- Ejecutar después de 0006.
-- ============================================================================

alter table public.inscripciones add column if not exists cargo_id uuid references public.cargos(id) on delete set null;
alter table public.inscripciones drop constraint if exists inscripciones_estado_check;
alter table public.inscripciones add constraint inscripciones_estado_check check (estado in ('activa','pendiente_pago','cancelada'));
drop index if exists public.inscripcion_unica;
create unique index inscripcion_unica on public.inscripciones (actividad_id, socio_id) where estado in ('activa','pendiente_pago');

-- Los socios ya no modifican inscripciones directamente (cancelan con cancelar_inscripcion)
drop policy if exists inscripciones_cancelar on public.inscripciones;
drop policy if exists inscripciones_admin on public.inscripciones;
create policy inscripciones_admin on public.inscripciones for update to authenticated
  using (public.tiene_rol(array['admin','deportes','eventos'])) with check (public.tiene_rol(array['admin','deportes','eventos']));

-- Libera las inscripciones sin pagar: más de 48 h y ningún pago en revisión o aprobado para su cargo
create or replace function public.liberar_inscripciones_vencidas() returns int
language plpgsql security definer set search_path = public as $$
declare v_n int;
begin
  with vencidas as (
    update public.inscripciones i set estado = 'cancelada'
    where i.estado = 'pendiente_pago' and i.created_at < now() - interval '48 hours'
      and not exists (select 1 from public.pagos p where i.cargo_id = any(p.cargo_ids) and p.estado in ('pendiente','aprobado'))
    returning i.cargo_id
  )
  delete from public.cargos c using vencidas v where c.id = v.cargo_id and c.estado = 'pendiente';
  get diagnostics v_n = row_count;
  return v_n;
end $$;
revoke execute on function public.liberar_inscripciones_vencidas() from public, anon, authenticated;

drop function if exists public.inscribir(uuid, uuid);
-- Devuelve el id del cargo a pagar (null si la actividad no tiene costo y la inscripción ya quedó activa)
create function public.inscribir(p_actividad uuid, p_socio uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_yo public.socios; v_act public.actividades; v_s public.socios; v_cant int; v_ins public.inscripciones; v_cargo uuid;
begin
  v_yo := public.mi_socio();
  if v_yo.id is null or v_yo.estado <> 'activo' then raise exception 'No autorizado'; end if;
  select * into v_s from public.socios where id = p_socio and accion = v_yo.accion;
  if v_s.id is null then raise exception 'El socio no pertenece a su acción'; end if;
  select * into v_act from public.actividades where id = p_actividad for update;
  if v_act.id is null or not v_act.inscripciones_abiertas then raise exception 'Inscripciones cerradas'; end if;

  perform public.liberar_inscripciones_vencidas();

  -- Ya tenía una inscripción esperando el pago: se retoma el mismo cargo
  select * into v_ins from public.inscripciones where actividad_id = p_actividad and socio_id = p_socio and estado in ('activa','pendiente_pago');
  if v_ins.estado = 'activa' then raise exception '% ya está inscrito en esta actividad', v_s.nombre; end if;
  if v_ins.estado = 'pendiente_pago' then return v_ins.cargo_id; end if;

  if v_act.cupo is not null then
    select count(*) into v_cant from public.inscripciones where actividad_id = p_actividad and estado in ('activa','pendiente_pago');
    if v_cant >= v_act.cupo then raise exception 'No quedan cupos disponibles'; end if;
  end if;

  if v_act.precio_usd > 0 then
    insert into public.cargos(accion, concepto, monto_usd, tipo, vence)
      values (v_yo.accion, 'Inscripción: ' || v_act.nombre || ' (' || v_s.nombre || ')', v_act.precio_usd, 'actividad',
              (now() at time zone 'America/Caracas')::date + 2)
      returning id into v_cargo;
    insert into public.inscripciones(actividad_id, socio_id, accion, estado, cargo_id)
      values (p_actividad, p_socio, v_yo.accion, 'pendiente_pago', v_cargo);
    return v_cargo;
  end if;

  insert into public.inscripciones(actividad_id, socio_id, accion) values (p_actividad, p_socio, v_yo.accion);
  return null;
end $$;

-- El socio cancela una inscripción que aún no pagó (si no tiene un pago en revisión)
create or replace function public.cancelar_inscripcion(p_inscripcion uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_i public.inscripciones;
begin
  select * into v_i from public.inscripciones where id = p_inscripcion for update;
  if v_i.id is null or v_i.accion <> public.mi_accion() then raise exception 'No encontrada'; end if;
  if v_i.estado <> 'pendiente_pago' then raise exception 'Para retirarte de una actividad pagada comunícate con el departamento'; end if;
  if exists (select 1 from public.pagos p where v_i.cargo_id = any(p.cargo_ids) and p.estado = 'pendiente') then
    raise exception 'Tu pago está en revisión; espera la respuesta de Administración';
  end if;
  update public.inscripciones set estado = 'cancelada' where id = v_i.id;
  delete from public.cargos where id = v_i.cargo_id and estado = 'pendiente';
end $$;

-- Cuando el cargo queda pagado (pago aprobado o marcado por Administración), la inscripción se confirma
create or replace function public.confirmar_inscripcion_pagada() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_i record;
begin
  if new.estado = 'pagado' and old.estado is distinct from 'pagado' then
    for v_i in
      update public.inscripciones i set estado = 'activa' where i.cargo_id = new.id and i.estado = 'pendiente_pago'
      returning i.socio_id, i.actividad_id
    loop
      insert into public.notificaciones(titulo, cuerpo, destino, socio_id, enlace)
      select '¡Inscripción confirmada!', s.nombre || ' quedó inscrito en ' || a.nombre || '.', 'socio', s.id, '/actividades/' || a.id
      from public.socios s, public.actividades a where s.id = v_i.socio_id and a.id = v_i.actividad_id;
    end loop;
  end if;
  return new;
end $$;
drop trigger if exists confirmar_inscripcion on public.cargos;
create trigger confirmar_inscripcion after update of estado on public.cargos
  for each row execute function public.confirmar_inscripcion_pagada();

-- Revisión cada hora (requiere pg_cron; si no está, se libera igual al inscribir)
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    execute $c$select cron.schedule('liberar-inscripciones', '0 * * * *', 'select public.liberar_inscripciones_vencidas()')$c$;
  end if;
end $$;

-- Nota más corta en los datos para pagar (solo si sigue el texto original)
update public.configuracion
set valor = jsonb_set(valor, '{nota}', to_jsonb('En el concepto indica tu número de acción y qué estás pagando. Los pagos en bolívares se calculan a la tasa oficial del BCV.'::text))
where id = 'datos_bancarios' and valor->>'nota' like 'Al pagar indica el número de cédula%';
