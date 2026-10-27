-- ============================================================================
-- Mi Hebraica — nuevas funciones (ejecutar después de 0001 y 0003)
--  1. Correo del socio (para recuperar la contraseña por email)
--  2. Lectura automática del comprobante de pago
--  3. Recordatorios automáticos
--  4. Clases con cupo por sesión y lista de espera
--  5. Encuestas y calificación de eventos
--  6. Estadísticas para el panel
--  7. Historial de cambios (auditoría)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Correo
-- ---------------------------------------------------------------------------
alter table public.registros add column if not exists email text;
-- Varios miembros de una familia pueden compartir correo
alter table public.socios drop constraint if exists socios_email_key;

create or replace function public.aprobar_registro(p_registro uuid, p_accion text, p_parentesco text) returns void
language plpgsql security definer set search_path = public as $$
declare v_r public.registros; v_s public.socios;
begin
  if not public.tiene_rol(array['admin','administracion']) then raise exception 'No autorizado'; end if;
  select * into v_r from public.registros where id = p_registro and estado = 'pendiente' for update;
  if v_r.id is null then raise exception 'La solicitud ya fue procesada'; end if;
  select * into v_s from public.socios where cedula = v_r.cedula;
  if v_s.id is not null and v_s.user_id is not null then raise exception 'Esa cédula ya tiene un usuario activo'; end if;
  if v_s.id is null then
    if coalesce(trim(p_accion), '') = '' then raise exception 'Indica el número de acción'; end if;
    insert into public.socios (user_id, usuario, accion, cedula, nombre, apellido, parentesco, email)
      values (v_r.user_id, v_r.usuario, trim(p_accion), v_r.cedula, v_r.nombre, v_r.apellido, coalesce(nullif(p_parentesco, ''), 'titular'), v_r.email)
      returning * into v_s;
  else
    update public.socios set user_id = v_r.user_id, usuario = v_r.usuario, email = coalesce(v_r.email, email)
      where id = v_s.id returning * into v_s;
  end if;
  update public.registros set estado = 'aprobado', socio_id = v_s.id where id = v_r.id;
  insert into public.notificaciones(titulo, cuerpo, destino, socio_id, enlace)
    values ('¡Bienvenido a Mi Hebraica!', 'Tu cuenta fue aprobada. Ya puedes usar tu carnet digital.', 'socio', v_s.id, '/carnet');
end $$;

-- ---------------------------------------------------------------------------
-- 2. Lectura del comprobante: lo que el app leyó de la imagen
--    { "referencia": "...", "monto": 123.45, "coincide": true }
-- ---------------------------------------------------------------------------
alter table public.pagos add column if not exists lectura jsonb;

-- ---------------------------------------------------------------------------
-- 3. Recordatorios: `clave` evita enviar el mismo aviso dos veces
-- ---------------------------------------------------------------------------
alter table public.notificaciones add column if not exists clave text unique;

-- ---------------------------------------------------------------------------
-- 4. Clases por sesión
-- ---------------------------------------------------------------------------
create table if not exists public.clases (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  departamento text not null default 'deportes',
  instructor text,
  lugar text,
  inicio timestamptz not null,
  duracion_min int not null default 60,
  cupo int not null default 20 check (cupo > 0),
  cancelada boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists clases_inicio on public.clases (inicio);

create table if not exists public.reservas_clase (
  id uuid primary key default gen_random_uuid(),
  clase_id uuid not null references public.clases(id) on delete cascade,
  socio_id uuid not null references public.socios(id),
  accion text not null,
  estado text not null default 'confirmada' check (estado in ('confirmada','espera','cancelada')),
  created_at timestamptz not null default now()
);
create unique index if not exists reserva_clase_unica on public.reservas_clase (clase_id, socio_id) where estado <> 'cancelada';

alter table public.clases enable row level security;
alter table public.reservas_clase enable row level security;

drop policy if exists clases_leer on public.clases;
create policy clases_leer on public.clases for select to authenticated using (true);
drop policy if exists clases_admin on public.clases;
create policy clases_admin on public.clases for all to authenticated
  using (public.tiene_rol(array['admin','deportes'])) with check (public.tiene_rol(array['admin','deportes']));
drop policy if exists reservas_clase_leer on public.reservas_clase;
create policy reservas_clase_leer on public.reservas_clase for select to authenticated
  using (accion = public.mi_accion() or public.tiene_rol(array['admin','deportes','seguridad']));
-- Altas, bajas y lista de espera solo mediante las funciones de abajo

-- Ocupación de cada clase (sin exponer quién reservó)
create or replace function public.ocupacion_clases(p_desde timestamptz, p_hasta timestamptz)
returns table (clase_id uuid, confirmados int, en_espera int)
language sql stable security definer set search_path = public as $$
  select c.id,
    count(r.id) filter (where r.estado = 'confirmada')::int,
    count(r.id) filter (where r.estado = 'espera')::int
  from public.clases c left join public.reservas_clase r on r.clase_id = c.id
  where c.inicio between p_desde and p_hasta
  group by c.id
$$;

create or replace function public.reservar_clase(p_clase uuid, p_socio uuid) returns text
language plpgsql security definer set search_path = public as $$
declare v_yo public.socios; v_c public.clases; v_conf int; v_estado text;
begin
  v_yo := public.mi_socio();
  if v_yo.id is null or v_yo.estado <> 'activo' then raise exception 'No autorizado'; end if;
  if not exists (select 1 from public.socios where id = p_socio and accion = v_yo.accion) then raise exception 'El socio no pertenece a su acción'; end if;
  select * into v_c from public.clases where id = p_clase for update;
  if v_c.id is null or v_c.cancelada then raise exception 'Clase no disponible'; end if;
  if v_c.inicio < now() then raise exception 'La clase ya comenzó'; end if;
  if exists (select 1 from public.reservas_clase where clase_id = p_clase and socio_id = p_socio and estado <> 'cancelada') then
    raise exception 'Ya tiene un puesto en esta clase';
  end if;
  select count(*) into v_conf from public.reservas_clase where clase_id = p_clase and estado = 'confirmada';
  v_estado := case when v_conf < v_c.cupo then 'confirmada' else 'espera' end;
  insert into public.reservas_clase (clase_id, socio_id, accion, estado) values (p_clase, p_socio, v_yo.accion, v_estado);
  return v_estado;
end $$;

-- Al cancelar un puesto confirmado, el primero de la lista de espera pasa a confirmado y se le avisa
create or replace function public.cancelar_reserva_clase(p_reserva uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_r public.reservas_clase; v_sig public.reservas_clase; v_c public.clases;
begin
  select * into v_r from public.reservas_clase where id = p_reserva for update;
  if v_r.id is null or v_r.estado = 'cancelada' then raise exception 'Reserva no encontrada'; end if;
  if v_r.accion <> public.mi_accion() and not public.tiene_rol(array['admin','deportes']) then raise exception 'No autorizado'; end if;
  select * into v_c from public.clases where id = v_r.clase_id for update;
  update public.reservas_clase set estado = 'cancelada' where id = v_r.id;
  if v_r.estado = 'confirmada' and v_c.inicio > now() then
    select * into v_sig from public.reservas_clase where clase_id = v_r.clase_id and estado = 'espera' order by created_at limit 1 for update;
    if v_sig.id is not null then
      update public.reservas_clase set estado = 'confirmada' where id = v_sig.id;
      insert into public.notificaciones (titulo, cuerpo, destino, socio_id, enlace, clave)
        values ('¡Tienes puesto en la clase!', 'Se liberó un cupo en ' || v_c.nombre || ' (' || to_char(v_c.inicio at time zone 'America/Caracas', 'DD/MM HH12:MI am') || '). Ya estás confirmado.',
                'socio', v_sig.socio_id, '/clases', 'promovido:' || v_sig.id)
        on conflict (clave) do nothing;
    end if;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 5. Encuestas
-- ---------------------------------------------------------------------------
create table if not exists public.encuestas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descripcion text,
  tipo text not null default 'opciones' check (tipo in ('opciones','calificacion')),
  opciones text[] not null default '{}',
  evento_id uuid references public.eventos(id) on delete set null,
  abierta boolean not null default true,
  cierra timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists public.votos (
  id uuid primary key default gen_random_uuid(),
  encuesta_id uuid not null references public.encuestas(id) on delete cascade,
  socio_id uuid not null references public.socios(id),
  opcion int not null,
  comentario text,
  created_at timestamptz not null default now(),
  unique (encuesta_id, socio_id)
);
alter table public.encuestas enable row level security;
alter table public.votos enable row level security;
drop policy if exists encuestas_leer on public.encuestas;
create policy encuestas_leer on public.encuestas for select to authenticated using (true);
drop policy if exists encuestas_admin on public.encuestas;
create policy encuestas_admin on public.encuestas for all to authenticated
  using (public.tiene_rol(array['admin','eventos'])) with check (public.tiene_rol(array['admin','eventos']));
drop policy if exists votos_leer on public.votos;
create policy votos_leer on public.votos for select to authenticated
  using (socio_id = (public.mi_socio()).id or public.tiene_rol(array['admin','eventos']));

create or replace function public.votar(p_encuesta uuid, p_opcion int, p_comentario text) returns void
language plpgsql security definer set search_path = public as $$
declare v_yo public.socios; v_e public.encuestas;
begin
  v_yo := public.mi_socio();
  if v_yo.id is null or v_yo.estado <> 'activo' then raise exception 'No autorizado'; end if;
  select * into v_e from public.encuestas where id = p_encuesta;
  if v_e.id is null or not v_e.abierta or (v_e.cierra is not null and v_e.cierra < now()) then raise exception 'La encuesta está cerrada'; end if;
  if v_e.tipo = 'calificacion' and p_opcion not between 1 and 5 then raise exception 'Calificación inválida'; end if;
  if v_e.tipo = 'opciones' and (p_opcion < 0 or p_opcion >= coalesce(array_length(v_e.opciones, 1), 0)) then raise exception 'Opción inválida'; end if;
  begin
    insert into public.votos (encuesta_id, socio_id, opcion, comentario) values (p_encuesta, v_yo.id, p_opcion, nullif(trim(p_comentario), ''));
  exception when unique_violation then
    raise exception 'Ya votaste en esta encuesta';
  end;
end $$;

-- Resultados: visibles para quien ya votó, para el staff de eventos o cuando la encuesta cerró
create or replace function public.resultados_encuesta(p_encuesta uuid) returns table (opcion int, votos int)
language plpgsql stable security definer set search_path = public as $$
declare v_e public.encuestas;
begin
  select * into v_e from public.encuestas where id = p_encuesta;
  if v_e.id is null then return; end if;
  if not (public.tiene_rol(array['admin','eventos'])
          or not v_e.abierta or (v_e.cierra is not null and v_e.cierra < now())
          or exists (select 1 from public.votos where encuesta_id = p_encuesta and socio_id = (public.mi_socio()).id)) then
    raise exception 'Vota para ver los resultados';
  end if;
  return query select v.opcion, count(*)::int from public.votos v where v.encuesta_id = p_encuesta group by v.opcion order by v.opcion;
end $$;

-- ---------------------------------------------------------------------------
-- 3 (cont). Recordatorios automáticos — se ejecuta a diario
-- ---------------------------------------------------------------------------
create or replace function public.generar_recordatorios() returns int
language plpgsql security definer set search_path = public as $$
declare v_hoy date := (now() at time zone 'America/Caracas')::date; v_n int := 0; v_k int;
begin
  -- Cuotas que vencen en 3 días
  insert into public.notificaciones (titulo, cuerpo, destino, accion, enlace, clave)
  select 'Tu pago vence pronto', c.concepto || ' (' || to_char(c.monto_usd, 'FM999G990D00') || ' $) vence el ' || to_char(c.vence, 'DD/MM') || '.',
         'accion', c.accion, '/cuenta', 'vence3:' || c.id
  from public.cargos c where c.estado = 'pendiente' and c.vence = v_hoy + 3
  on conflict (clave) do nothing;
  get diagnostics v_k = row_count; v_n := v_n + v_k;

  -- Cuotas vencidas ayer
  insert into public.notificaciones (titulo, cuerpo, destino, accion, enlace, clave)
  select 'Tienes un pago vencido', c.concepto || ' venció el ' || to_char(c.vence, 'DD/MM') || '. Puedes pagarlo desde el app.',
         'accion', c.accion, '/cuenta', 'vencido:' || c.id
  from public.cargos c where c.estado = 'pendiente' and c.vence = v_hoy - 1
  on conflict (clave) do nothing;
  get diagnostics v_k = row_count; v_n := v_n + v_k;

  -- Reservas de mañana
  insert into public.notificaciones (titulo, cuerpo, destino, socio_id, enlace, clave)
  select 'Tu reserva es mañana', i.nombre || ' mañana a las ' || r.hora_inicio || '.', 'socio', r.socio_id, '/reservas', 'reserva:' || r.id
  from public.reservas r join public.instalaciones i on i.id = r.instalacion_id
  where r.estado = 'confirmada' and r.fecha = v_hoy + 1
  on conflict (clave) do nothing;
  get diagnostics v_k = row_count; v_n := v_n + v_k;

  -- Clases de mañana
  insert into public.notificaciones (titulo, cuerpo, destino, socio_id, enlace, clave)
  select 'Tu clase es mañana', c.nombre || ' mañana a las ' || to_char(c.inicio at time zone 'America/Caracas', 'HH12:MI am') || '.', 'socio', r.socio_id, '/clases', 'clase:' || r.id
  from public.reservas_clase r join public.clases c on c.id = r.clase_id
  where r.estado = 'confirmada' and not c.cancelada and (c.inicio at time zone 'America/Caracas')::date = v_hoy + 1
  on conflict (clave) do nothing;
  get diagnostics v_k = row_count; v_n := v_n + v_k;

  -- Eventos de mañana con entradas
  insert into public.notificaciones (titulo, cuerpo, destino, accion, enlace, clave)
  select distinct on (e.id, en.accion) 'Tu evento es mañana', e.titulo || ' mañana a las ' || to_char(e.fecha_inicio at time zone 'America/Caracas', 'HH12:MI am') || '. Tus entradas están en el app.',
         'accion', en.accion, '/entradas', 'evento:' || e.id || ':' || en.accion
  from public.entradas en join public.eventos e on e.id = en.evento_id
  where en.estado = 'activa' and (e.fecha_inicio at time zone 'America/Caracas')::date = v_hoy + 1
  on conflict (clave) do nothing;
  get diagnostics v_k = row_count; v_n := v_n + v_k;

  return v_n;
end $$;
revoke execute on function public.generar_recordatorios() from public, anon, authenticated;

-- Programación diaria a las 8:00 am de Caracas (12:00 UTC). Requiere la extensión pg_cron.
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    execute 'create extension if not exists pg_cron';
    execute $c$select cron.schedule('recordatorios-diarios', '0 12 * * *', 'select public.generar_recordatorios()')$c$;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 6. Estadísticas para el panel
-- ---------------------------------------------------------------------------
create or replace function public.estadisticas() returns json
language plpgsql stable security definer set search_path = public as $$
declare v_hoy date := (now() at time zone 'America/Caracas')::date;
begin
  if not public.tiene_rol(array['admin','administracion']) then raise exception 'No autorizado'; end if;
  return json_build_object(
    'socios', (select count(*) from public.socios where rol = 'socio'),
    'socios_con_app', (select count(*) from public.socios where rol = 'socio' and user_id is not null),
    'acciones', (select count(distinct accion) from public.socios where rol = 'socio' and accion is not null),
    'acciones_morosas', (select count(distinct accion) from public.cargos where estado = 'pendiente' and vence < v_hoy),
    'monto_moroso', (select coalesce(sum(monto_usd), 0) from public.cargos where estado = 'pendiente' and vence < v_hoy),
    'monto_pendiente', (select coalesce(sum(monto_usd), 0) from public.cargos where estado = 'pendiente'),
    'accesos_por_hora', (select coalesce(json_agg(json_build_object('hora', h, 'total', t) order by h), '[]') from (
        select extract(hour from created_at at time zone 'America/Caracas')::int h, count(*) t
        from public.accesos where resultado = 'permitido' and created_at > now() - interval '30 days' group by 1) x),
    'accesos_por_dia', (select coalesce(json_agg(json_build_object('dia', d, 'total', t) order by d), '[]') from (
        select extract(isodow from created_at at time zone 'America/Caracas')::int d, count(*) t
        from public.accesos where resultado = 'permitido' and created_at > now() - interval '30 days' group by 1) x),
    'pagos_por_metodo', (select coalesce(json_agg(json_build_object('metodo', metodo, 'total', t, 'monto', m)), '[]') from (
        select metodo, count(*) t, sum(monto_usd) m from public.pagos where estado = 'aprobado' and created_at > now() - interval '90 days' group by 1) x),
    'reservas_por_instalacion', (select coalesce(json_agg(json_build_object('nombre', nombre, 'total', t) order by t desc), '[]') from (
        select i.nombre, count(*) t from public.reservas r join public.instalaciones i on i.id = r.instalacion_id
        where r.estado = 'confirmada' and r.fecha > v_hoy - 30 group by 1) x)
  );
end $$;

-- ---------------------------------------------------------------------------
-- 7. Historial de cambios
-- ---------------------------------------------------------------------------
create table if not exists public.auditoria (
  id bigserial primary key,
  tabla text not null,
  registro_id text,
  operacion text not null,
  antes jsonb,
  despues jsonb,
  socio_id uuid,
  usuario text,
  created_at timestamptz not null default now()
);
create index if not exists auditoria_fecha on public.auditoria (created_at desc);
alter table public.auditoria enable row level security;
drop policy if exists auditoria_leer on public.auditoria;
create policy auditoria_leer on public.auditoria for select to authenticated using (public.tiene_rol(array['admin']));

create or replace function public.registrar_auditoria() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_s public.socios;
begin
  select * into v_s from public.socios where user_id = auth.uid() limit 1;
  insert into public.auditoria (tabla, registro_id, operacion, antes, despues, socio_id, usuario)
  values (TG_TABLE_NAME,
          coalesce(case when TG_OP = 'DELETE' then to_jsonb(old) ->> 'id' else to_jsonb(new) ->> 'id' end, ''),
          TG_OP,
          case when TG_OP <> 'INSERT' then to_jsonb(old) end,
          case when TG_OP <> 'DELETE' then to_jsonb(new) end,
          v_s.id,
          coalesce(v_s.nombre || ' ' || v_s.apellido, 'Sistema'));
  return coalesce(new, old);
end $$;

do $$
declare t text;
begin
  foreach t in array array['socios','registros','cargos','pagos','tasas','instalaciones','actividades','eventos','noticias',
                           'clases','encuestas','configuracion','solicitudes','directorio','restaurantes','albumes']
  loop
    execute format('drop trigger if exists auditoria on public.%I', t);
    execute format('create trigger auditoria after insert or update or delete on public.%I for each row execute function public.registrar_auditoria()', t);
  end loop;
end $$;
