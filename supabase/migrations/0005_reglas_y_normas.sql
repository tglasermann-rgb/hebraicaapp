-- ============================================================================
-- Mi Hebraica — reglas de instalaciones (Normas de Pádel), normas del club y
-- campos para los datos de la Guía de Inscripciones 2026-2027.
-- Ejecutar después de 0004.
-- ============================================================================

-- Eventos de día completo
alter table public.eventos add column if not exists todo_el_dia boolean not null default false;

-- Actividades: texto de precio, requisitos y lugar
alter table public.actividades add column if not exists nota_precio text;
alter table public.actividades add column if not exists requisitos text;
alter table public.actividades add column if not exists lugar text;

-- Métodos de pago de la guía
alter table public.pagos drop constraint if exists pagos_metodo_check;
alter table public.pagos add constraint pagos_metodo_check
  check (metodo in ('pago_movil','zelle','transferencia_bs','transferencia_usd','paypal','venmo','pipol','tarjeta','efectivo'));

-- ---------------------------------------------------------------------------
-- Reglas por instalación
-- ---------------------------------------------------------------------------
alter table public.instalaciones add column if not exists max_reservas_activas int;
alter table public.instalaciones add column if not exists cancelar_hasta_horas int;
alter table public.instalaciones add column if not exists jugadores_min int;
alter table public.instalaciones add column if not exists sancion_horas int;

alter table public.reservas add column if not exists jugadores text[] not null default '{}';
alter table public.reservas drop constraint if exists reservas_estado_check;
alter table public.reservas add constraint reservas_estado_check check (estado in ('confirmada','cancelada','no_asistio'));

-- Los socios ya no cancelan con un update directo: lo hacen con cancelar_reserva (respeta el límite de horas)
drop policy if exists reservas_cancelar on public.reservas;
drop policy if exists reservas_admin on public.reservas;
create policy reservas_admin on public.reservas for update to authenticated
  using (public.tiene_rol(array['admin','deportes'])) with check (public.tiene_rol(array['admin','deportes']));

drop function if exists public.reservar(uuid, date, text, uuid);
create or replace function public.reservar(p_instalacion uuid, p_fecha date, p_hora text, p_socio uuid, p_jugadores text[] default '{}')
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_yo public.socios; v_inst public.instalaciones; v_cant int; v_inicio timestamp; v_ahora timestamp;
  v_jug text[];
begin
  v_yo := public.mi_socio();
  if v_yo.id is null or v_yo.estado <> 'activo' then raise exception 'No autorizado'; end if;
  if not exists (select 1 from public.socios where id = p_socio and accion = v_yo.accion) then raise exception 'El socio no pertenece a su acción'; end if;
  select * into v_inst from public.instalaciones where id = p_instalacion and activo;
  if v_inst.id is null then raise exception 'Instalación no disponible'; end if;

  v_ahora := now() at time zone 'America/Caracas';
  v_inicio := p_fecha + p_hora::time;
  if v_inicio <= v_ahora then raise exception 'Ese horario ya pasó'; end if;
  if p_fecha > v_ahora::date + 14 then raise exception 'Solo se puede reservar con 14 días de anticipación'; end if;

  -- Jugadores mínimos (pádel: 4)
  v_jug := array(select trim(x) from unnest(coalesce(p_jugadores, '{}')) x where trim(x) <> '');
  if v_inst.jugadores_min is not null and coalesce(array_length(v_jug, 1), 0) < v_inst.jugadores_min then
    raise exception 'Debes indicar al menos % jugadores', v_inst.jugadores_min;
  end if;

  -- Sanción por no asistir sin cancelar
  if v_inst.sancion_horas is not null and exists (
    select 1 from public.reservas r join public.instalaciones i on i.id = r.instalacion_id
    where r.accion = v_yo.accion and r.estado = 'no_asistio' and i.tipo = v_inst.tipo
      and (r.fecha + r.hora_inicio::time) + make_interval(hours => v_inst.sancion_horas) > v_ahora
  ) then
    raise exception 'Por no asistir a una reserva sin cancelarla, no puedes reservar % por % horas', lower(v_inst.tipo), v_inst.sancion_horas;
  end if;

  -- Reservas activas simultáneas (pádel: 1)
  if v_inst.max_reservas_activas is not null then
    select count(*) into v_cant from public.reservas r join public.instalaciones i on i.id = r.instalacion_id
      where r.accion = v_yo.accion and r.estado = 'confirmada' and i.tipo = v_inst.tipo
        and (r.fecha + r.hora_inicio::time) + make_interval(mins => i.duracion_min) > v_ahora;
    if v_cant >= v_inst.max_reservas_activas then
      raise exception 'Ya tienes una reserva activa de %. Podrás reservar otra cuando termine.', lower(v_inst.tipo);
    end if;
  end if;

  select count(*) into v_cant from public.reservas
    where instalacion_id = p_instalacion and fecha = p_fecha and accion = v_yo.accion and estado = 'confirmada';
  if v_cant >= v_inst.max_reservas_dia then raise exception 'Su acción ya alcanzó el máximo de reservas de este día'; end if;

  begin
    insert into public.reservas(instalacion_id, socio_id, accion, fecha, hora_inicio, jugadores)
      values (p_instalacion, p_socio, v_yo.accion, p_fecha, p_hora, v_jug);
  exception when unique_violation then
    raise exception 'Ese horario acaba de ser reservado por otro socio';
  end;
end $$;

create or replace function public.cancelar_reserva(p_reserva uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_r public.reservas; v_inst public.instalaciones; v_inicio timestamp;
begin
  select * into v_r from public.reservas where id = p_reserva for update;
  if v_r.id is null or v_r.estado <> 'confirmada' then raise exception 'Reserva no encontrada'; end if;
  if v_r.accion <> public.mi_accion() and not public.tiene_rol(array['admin','deportes']) then raise exception 'No autorizado'; end if;
  select * into v_inst from public.instalaciones where id = v_r.instalacion_id;
  v_inicio := v_r.fecha + v_r.hora_inicio::time;
  if not public.tiene_rol(array['admin','deportes']) and v_inst.cancelar_hasta_horas is not null
     and v_inicio - make_interval(hours => v_inst.cancelar_hasta_horas) < now() at time zone 'America/Caracas' then
    raise exception 'Solo se puede cancelar hasta % horas antes', v_inst.cancelar_hasta_horas;
  end if;
  update public.reservas set estado = 'cancelada' where id = v_r.id;
end $$;

-- ---------------------------------------------------------------------------
-- Normas y reglamentos del club
-- ---------------------------------------------------------------------------
create table if not exists public.normas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  departamento text not null default 'club',
  contenido text not null,
  orden int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.normas enable row level security;
drop policy if exists normas_leer on public.normas;
create policy normas_leer on public.normas for select to authenticated using (true);
drop policy if exists normas_admin on public.normas;
create policy normas_admin on public.normas for all to authenticated
  using (public.tiene_rol(array['admin','administracion','deportes','eventos'])) with check (public.tiene_rol(array['admin','administracion','deportes','eventos']));
drop trigger if exists auditoria on public.normas;
create trigger auditoria after insert or update or delete on public.normas for each row execute function public.registrar_auditoria();

