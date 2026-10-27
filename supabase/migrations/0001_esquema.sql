-- ============================================================================
-- Mi Hebraica — esquema de base de datos (Supabase / PostgreSQL)
-- Ejecutar en: Supabase > SQL Editor (o `supabase db push`).
-- ============================================================================

-- Los códigos aleatorios usan gen_random_uuid(), incluida en PostgreSQL (no requiere extensiones).

-- ---------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------

create table public.socios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  accion text,
  cedula text not null unique,
  nombre text not null,
  apellido text not null,
  usuario text unique,
  email text unique,
  telefono text,
  parentesco text not null default 'titular' check (parentesco in ('titular','conyuge','hijo','otro')),
  fecha_nacimiento date,
  foto_url text,
  estado text not null default 'activo' check (estado in ('activo','suspendido')),
  rol text not null default 'socio' check (rol in ('socio','admin','administracion','deportes','eventos','seguridad')),
  created_at timestamptz not null default now()
);
create index on public.socios (accion);

-- Solicitudes de acceso: la persona se registra (nombre, apellido, cédula, usuario y contraseña)
-- y Administración la aprueba vinculándola a su ficha de socio.
create table public.registros (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  nombre text not null,
  apellido text not null,
  cedula text not null,
  usuario text not null unique,
  estado text not null default 'pendiente' check (estado in ('pendiente','aprobado','rechazado')),
  motivo text,
  socio_id uuid,
  created_at timestamptz not null default now()
);
create unique index registro_pendiente_unico on public.registros (cedula) where estado = 'pendiente';

create table public.cargos (
  id uuid primary key default gen_random_uuid(),
  accion text not null,
  concepto text not null,
  monto_usd numeric(12,2) not null,
  fecha date not null default current_date,
  vence date,
  tipo text not null default 'cuota' check (tipo in ('cuota','actividad','evento','otro')),
  estado text not null default 'pendiente' check (estado in ('pendiente','pagado')),
  created_at timestamptz not null default now()
);
create index on public.cargos (accion);

create table public.pagos (
  id uuid primary key default gen_random_uuid(),
  accion text not null,
  socio_id uuid not null references public.socios(id),
  metodo text not null check (metodo in ('pago_movil','zelle','transferencia_bs','transferencia_usd','tarjeta','efectivo')),
  moneda text not null check (moneda in ('USD','VES')),
  monto numeric(14,2) not null check (monto > 0),
  tasa numeric(14,4),
  monto_usd numeric(12,2) not null,
  referencia text not null,
  fecha_pago date not null,
  comprobante_url text,
  cargo_ids uuid[] not null default '{}',
  estado text not null default 'pendiente' check (estado in ('pendiente','aprobado','rechazado')),
  nota_admin text,
  created_at timestamptz not null default now()
);
create index on public.pagos (accion);

create table public.tasas (
  id uuid primary key default gen_random_uuid(),
  fecha date not null unique,
  bs_por_usd numeric(14,4) not null check (bs_por_usd > 0),
  created_at timestamptz not null default now()
);

create table public.instalaciones (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  tipo text not null,
  descripcion text,
  imagen_url text,
  hora_apertura text not null default '07:00',
  hora_cierre text not null default '21:00',
  duracion_min int not null default 60,
  max_reservas_dia int not null default 1,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.reservas (
  id uuid primary key default gen_random_uuid(),
  instalacion_id uuid not null references public.instalaciones(id) on delete cascade,
  socio_id uuid not null references public.socios(id),
  accion text not null,
  fecha date not null,
  hora_inicio text not null,
  estado text not null default 'confirmada' check (estado in ('confirmada','cancelada')),
  created_at timestamptz not null default now()
);
create unique index reservas_unica on public.reservas (instalacion_id, fecha, hora_inicio) where estado = 'confirmada';

create table public.actividades (
  id uuid primary key default gen_random_uuid(),
  departamento text not null,
  nombre text not null,
  descripcion text,
  horario text,
  instructor text,
  edad_min int,
  edad_max int,
  cupo int,
  precio_usd numeric(12,2) not null default 0,
  imagen_url text,
  inscripciones_abiertas boolean not null default true,
  programa text,
  created_at timestamptz not null default now()
);

create table public.inscripciones (
  id uuid primary key default gen_random_uuid(),
  actividad_id uuid not null references public.actividades(id) on delete cascade,
  socio_id uuid not null references public.socios(id),
  accion text not null,
  estado text not null default 'activa' check (estado in ('activa','cancelada')),
  created_at timestamptz not null default now()
);
create unique index inscripcion_unica on public.inscripciones (actividad_id, socio_id) where estado = 'activa';

create table public.eventos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descripcion text,
  fecha_inicio timestamptz not null,
  fecha_fin timestamptz,
  lugar text,
  imagen_url text,
  departamento text,
  destacado boolean not null default false,
  venta_entradas boolean not null default false,
  precio_usd numeric(12,2) not null default 0,
  aforo int,
  max_por_accion int,
  created_at timestamptz not null default now()
);

create table public.entradas (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.eventos(id) on delete cascade,
  socio_id uuid not null references public.socios(id),
  accion text not null,
  nombre_asistente text not null,
  codigo text not null unique default replace(gen_random_uuid()::text, '-', ''),
  estado text not null default 'activa' check (estado in ('activa','usada','anulada')),
  created_at timestamptz not null default now()
);

create table public.noticias (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  resumen text,
  contenido text,
  imagen_url text,
  departamento text,
  destacado boolean not null default false,
  publicado_en timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.albumes (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  fecha date not null default current_date,
  portada_url text,
  created_at timestamptz not null default now()
);

create table public.fotos (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references public.albumes(id) on delete cascade,
  url text not null,
  created_at timestamptz not null default now()
);

create table public.directorio (
  id uuid primary key default gen_random_uuid(),
  departamento text not null,
  responsable text,
  telefono text,
  whatsapp text,
  email text,
  ubicacion text,
  horario text,
  orden int not null default 0,
  created_at timestamptz not null default now()
);

create table public.restaurantes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text,
  horario text,
  telefono text,
  ubicacion text,
  imagen_url text,
  orden int not null default 0,
  created_at timestamptz not null default now()
);

create table public.solicitudes (
  id uuid primary key default gen_random_uuid(),
  socio_id uuid not null references public.socios(id),
  accion text not null,
  categoria text not null check (categoria in ('mantenimiento','reclamo','sugerencia','tramite','otro')),
  asunto text not null,
  descripcion text not null,
  estado text not null default 'abierta' check (estado in ('abierta','en_proceso','resuelta','cerrada')),
  respuesta text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.invitados (
  id uuid primary key default gen_random_uuid(),
  socio_id uuid not null references public.socios(id),
  accion text not null,
  nombre text not null,
  cedula text not null,
  fecha date not null,
  codigo text not null unique default replace(gen_random_uuid()::text, '-', ''),
  estado text not null default 'activo' check (estado in ('activo','usado','anulado')),
  created_at timestamptz not null default now()
);

create table public.notificaciones (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  cuerpo text not null,
  destino text not null default 'todos' check (destino in ('todos','accion','socio')),
  accion text,
  socio_id uuid references public.socios(id) on delete cascade,
  enlace text,
  created_at timestamptz not null default now()
);

create table public.accesos (
  id uuid primary key default gen_random_uuid(),
  tipo text not null,
  referencia_id uuid,
  nombre text,
  resultado text not null check (resultado in ('permitido','denegado')),
  motivo text,
  escaneado_por uuid references public.socios(id),
  created_at timestamptz not null default now()
);

create table public.configuracion (
  id text primary key,
  valor jsonb not null
);

create table public.tokens_carnet (
  token text primary key,
  socio_id uuid not null references public.socios(id) on delete cascade,
  expira timestamptz not null
);

-- ---------------------------------------------------------------------------
-- Funciones auxiliares para RLS
-- ---------------------------------------------------------------------------

create or replace function public.mi_socio() returns public.socios
language sql stable security definer set search_path = public as $$
  select * from public.socios where user_id = auth.uid() limit 1
$$;

create or replace function public.mi_accion() returns text
language sql stable security definer set search_path = public as $$
  select accion from public.socios where user_id = auth.uid() limit 1
$$;

create or replace function public.tiene_rol(roles text[]) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.socios where user_id = auth.uid() and estado = 'activo' and rol = any(roles))
$$;

create or replace function public.es_staff() returns boolean
language sql stable as $$ select public.tiene_rol(array['admin','administracion','deportes','eventos','seguridad']) $$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.socios enable row level security;
alter table public.registros enable row level security;
alter table public.cargos enable row level security;
alter table public.pagos enable row level security;
alter table public.tasas enable row level security;
alter table public.instalaciones enable row level security;
alter table public.reservas enable row level security;
alter table public.actividades enable row level security;
alter table public.inscripciones enable row level security;
alter table public.eventos enable row level security;
alter table public.entradas enable row level security;
alter table public.noticias enable row level security;
alter table public.albumes enable row level security;
alter table public.fotos enable row level security;
alter table public.directorio enable row level security;
alter table public.restaurantes enable row level security;
alter table public.solicitudes enable row level security;
alter table public.invitados enable row level security;
alter table public.notificaciones enable row level security;
alter table public.accesos enable row level security;
alter table public.configuracion enable row level security;
alter table public.tokens_carnet enable row level security; -- sin políticas: solo vía funciones

-- Socios: cada quien ve su grupo familiar; el staff ve a todos.
create policy socios_leer on public.socios for select to authenticated
  using (user_id = auth.uid() or (accion is not null and accion = public.mi_accion()) or public.es_staff());
create policy socios_admin on public.socios for all to authenticated
  using (public.tiene_rol(array['admin','administracion'])) with check (public.tiene_rol(array['admin','administracion']));

-- Solicitudes de acceso: cada persona crea y ve la suya; Administración ve todas (aprueba vía función)
create policy registros_crear on public.registros for insert to authenticated
  with check (user_id = auth.uid() and estado = 'pendiente');
create policy registros_leer on public.registros for select to authenticated
  using (user_id = auth.uid() or public.tiene_rol(array['admin','administracion']));
-- Si fue rechazada, la persona puede corregir sus datos y volver a enviarla
create policy registros_reenviar on public.registros for update to authenticated
  using (user_id = auth.uid() and estado = 'rechazado') with check (user_id = auth.uid() and estado = 'pendiente');

-- Estado de cuenta
create policy cargos_leer on public.cargos for select to authenticated
  using (accion = public.mi_accion() or public.tiene_rol(array['admin','administracion']));
create policy cargos_admin on public.cargos for all to authenticated
  using (public.tiene_rol(array['admin','administracion'])) with check (public.tiene_rol(array['admin','administracion']));

create policy pagos_leer on public.pagos for select to authenticated
  using (accion = public.mi_accion() or public.tiene_rol(array['admin','administracion']));
create policy pagos_reportar on public.pagos for insert to authenticated
  with check (accion = public.mi_accion() and socio_id = (public.mi_socio()).id and estado = 'pendiente');
create policy pagos_admin on public.pagos for update to authenticated
  using (public.tiene_rol(array['admin','administracion']));

create policy tasas_leer on public.tasas for select to authenticated using (true);
create policy tasas_admin on public.tasas for all to authenticated
  using (public.tiene_rol(array['admin','administracion'])) with check (public.tiene_rol(array['admin','administracion']));

-- Contenido público para socios; lo editan los departamentos
create policy instalaciones_leer on public.instalaciones for select to authenticated using (true);
create policy instalaciones_admin on public.instalaciones for all to authenticated
  using (public.tiene_rol(array['admin','deportes'])) with check (public.tiene_rol(array['admin','deportes']));

create policy reservas_leer on public.reservas for select to authenticated
  using (accion = public.mi_accion() or public.tiene_rol(array['admin','deportes','seguridad']));
create policy reservas_cancelar on public.reservas for update to authenticated
  using (accion = public.mi_accion() or public.tiene_rol(array['admin','deportes']))
  with check (estado = 'cancelada' or public.tiene_rol(array['admin','deportes']));

create policy actividades_leer on public.actividades for select to authenticated using (true);
create policy actividades_admin on public.actividades for all to authenticated
  using (public.tiene_rol(array['admin','deportes','eventos'])) with check (public.tiene_rol(array['admin','deportes','eventos']));

create policy inscripciones_leer on public.inscripciones for select to authenticated
  using (accion = public.mi_accion() or public.tiene_rol(array['admin','deportes','eventos','administracion']));
create policy inscripciones_cancelar on public.inscripciones for update to authenticated
  using (accion = public.mi_accion() or public.tiene_rol(array['admin','deportes','eventos']));

create policy eventos_leer on public.eventos for select to authenticated using (true);
create policy eventos_admin on public.eventos for all to authenticated
  using (public.tiene_rol(array['admin','eventos'])) with check (public.tiene_rol(array['admin','eventos']));

create policy entradas_leer on public.entradas for select to authenticated
  using (accion = public.mi_accion() or public.tiene_rol(array['admin','eventos','seguridad']));
create policy entradas_admin on public.entradas for update to authenticated
  using (public.tiene_rol(array['admin','eventos']));

create policy noticias_leer on public.noticias for select to authenticated using (publicado_en <= now() or public.es_staff());
create policy noticias_admin on public.noticias for all to authenticated
  using (public.tiene_rol(array['admin','eventos','deportes','administracion'])) with check (public.tiene_rol(array['admin','eventos','deportes','administracion']));

create policy albumes_leer on public.albumes for select to authenticated using (true);
create policy albumes_admin on public.albumes for all to authenticated
  using (public.tiene_rol(array['admin','eventos'])) with check (public.tiene_rol(array['admin','eventos']));
create policy fotos_leer on public.fotos for select to authenticated using (true);
create policy fotos_admin on public.fotos for all to authenticated
  using (public.tiene_rol(array['admin','eventos'])) with check (public.tiene_rol(array['admin','eventos']));

create policy directorio_leer on public.directorio for select to authenticated using (true);
create policy directorio_admin on public.directorio for all to authenticated
  using (public.tiene_rol(array['admin'])) with check (public.tiene_rol(array['admin']));

create policy restaurantes_leer on public.restaurantes for select to authenticated using (true);
create policy restaurantes_admin on public.restaurantes for all to authenticated
  using (public.tiene_rol(array['admin'])) with check (public.tiene_rol(array['admin']));

create policy solicitudes_leer on public.solicitudes for select to authenticated
  using (accion = public.mi_accion() or public.es_staff());
create policy solicitudes_crear on public.solicitudes for insert to authenticated
  with check (accion = public.mi_accion() and socio_id = (public.mi_socio()).id and estado = 'abierta');
create policy solicitudes_admin on public.solicitudes for update to authenticated using (public.es_staff());

create policy invitados_leer on public.invitados for select to authenticated
  using (accion = public.mi_accion() or public.tiene_rol(array['admin','seguridad']));
create policy invitados_crear on public.invitados for insert to authenticated
  with check (accion = public.mi_accion() and socio_id = (public.mi_socio()).id and estado = 'activo' and fecha >= (now() at time zone 'America/Caracas')::date);
create policy invitados_anular on public.invitados for update to authenticated
  using (accion = public.mi_accion() or public.tiene_rol(array['admin','seguridad']));

create policy notificaciones_leer on public.notificaciones for select to authenticated
  using (destino = 'todos' or accion = public.mi_accion() or socio_id = (public.mi_socio()).id or public.es_staff());
create policy notificaciones_admin on public.notificaciones for all to authenticated
  using (public.es_staff()) with check (public.es_staff());

create policy accesos_leer on public.accesos for select to authenticated using (public.tiene_rol(array['admin','seguridad']));

create policy configuracion_leer on public.configuracion for select to authenticated using (true);
create policy configuracion_admin on public.configuracion for all to authenticated
  using (public.tiene_rol(array['admin'])) with check (public.tiene_rol(array['admin']));

-- ---------------------------------------------------------------------------
-- Funciones RPC (reglas de negocio)
-- ---------------------------------------------------------------------------

-- Aprueba una solicitud de acceso. Si ya existe una ficha de socio con esa cédula se vincula;
-- si no, se crea con la acción y parentesco indicados.
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
    insert into public.socios (user_id, usuario, accion, cedula, nombre, apellido, parentesco)
      values (v_r.user_id, v_r.usuario, trim(p_accion), v_r.cedula, v_r.nombre, v_r.apellido, coalesce(nullif(p_parentesco, ''), 'titular'))
      returning * into v_s;
  else
    update public.socios set user_id = v_r.user_id, usuario = v_r.usuario where id = v_s.id returning * into v_s;
  end if;
  update public.registros set estado = 'aprobado', socio_id = v_s.id where id = v_r.id;
  insert into public.notificaciones(titulo, cuerpo, destino, socio_id, enlace)
    values ('¡Bienvenido a Mi Hebraica!', 'Tu cuenta fue aprobada. Ya puedes usar tu carnet digital.', 'socio', v_s.id, '/carnet');
end $$;

create or replace function public.rechazar_registro(p_registro uuid, p_motivo text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.tiene_rol(array['admin','administracion']) then raise exception 'No autorizado'; end if;
  update public.registros set estado = 'rechazado', motivo = nullif(trim(p_motivo), '') where id = p_registro and estado = 'pendiente';
  if not found then raise exception 'La solicitud ya fue procesada'; end if;
end $$;

-- Carnet digital: token de un solo uso con vigencia de 30 segundos (evita capturas de pantalla).
-- Cada socio solo puede generar el código de su propio carnet.
create or replace function public.emitir_token_carnet(p_socio uuid) returns json
language plpgsql security definer set search_path = public as $$
declare v_token text; v_exp timestamptz; v_yo public.socios;
begin
  v_yo := public.mi_socio();
  if v_yo.id is null then raise exception 'No autenticado'; end if;
  if p_socio <> v_yo.id then raise exception 'Solo puedes ver tu propio carnet'; end if;
  delete from public.tokens_carnet where expira < now() - interval '5 minutes';
  v_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  v_exp := now() + interval '30 seconds';
  insert into public.tokens_carnet(token, socio_id, expira) values (v_token, p_socio, v_exp);
  return json_build_object('token', v_token, 'expira', v_exp);
end $$;

-- Escáner de seguridad: valida carnets, pases de invitado y entradas.
-- Formatos: HEB:S:<token> socio · HEB:I:<codigo> invitado · HEB:E:<codigo> entrada
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
      v_res := json_build_object('valido', false, 'tipo', 'invitado', 'nombre', v_i.nombre, 'mensaje', 'Pase ' || v_i.estado);
    elsif v_i.fecha <> (now() at time zone 'America/Caracas')::date then
      v_res := json_build_object('valido', false, 'tipo', 'invitado', 'nombre', v_i.nombre, 'mensaje', 'El pase es para el ' || to_char(v_i.fecha, 'DD/MM/YYYY'));
    else
      update public.invitados set estado = 'usado' where id = v_i.id;
      v_res := json_build_object('valido', true, 'tipo', 'invitado', 'nombre', v_i.nombre,
        'detalle', 'C.I. ' || v_i.cedula || ' · Invitado de la acción ' || v_i.accion, 'mensaje', 'Acceso permitido');
    end if;
    insert into public.accesos(tipo, referencia_id, nombre, resultado, motivo, escaneado_por)
      values ('invitado', v_i.id, v_i.nombre, case when (v_res->>'valido')::boolean then 'permitido' else 'denegado' end, v_res->>'mensaje', v_staff);
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

-- Reservas
create or replace function public.horarios_ocupados(p_instalacion uuid, p_fecha date) returns setof text
language sql stable security definer set search_path = public as $$
  select hora_inicio from public.reservas where instalacion_id = p_instalacion and fecha = p_fecha and estado = 'confirmada'
$$;

create or replace function public.reservar(p_instalacion uuid, p_fecha date, p_hora text, p_socio uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_yo public.socios; v_inst public.instalaciones; v_cant int;
begin
  v_yo := public.mi_socio();
  if v_yo.id is null or v_yo.estado <> 'activo' then raise exception 'No autorizado'; end if;
  if not exists (select 1 from public.socios where id = p_socio and accion = v_yo.accion) then raise exception 'El socio no pertenece a su acción'; end if;
  select * into v_inst from public.instalaciones where id = p_instalacion and activo;
  if v_inst.id is null then raise exception 'Instalación no disponible'; end if;
  if p_fecha < (now() at time zone 'America/Caracas')::date then raise exception 'No se puede reservar en fechas pasadas'; end if;
  if p_fecha > (now() at time zone 'America/Caracas')::date + 14 then raise exception 'Solo se puede reservar con 14 días de anticipación'; end if;
  select count(*) into v_cant from public.reservas
    where instalacion_id = p_instalacion and fecha = p_fecha and accion = v_yo.accion and estado = 'confirmada';
  if v_cant >= v_inst.max_reservas_dia then raise exception 'Su acción ya alcanzó el máximo de reservas de este día'; end if;
  begin
    insert into public.reservas(instalacion_id, socio_id, accion, fecha, hora_inicio) values (p_instalacion, p_socio, v_yo.accion, p_fecha, p_hora);
  exception when unique_violation then
    raise exception 'Ese horario acaba de ser reservado por otro socio';
  end;
end $$;

-- Inscripción en actividades: crea el cargo en el estado de cuenta.
create or replace function public.inscribir(p_actividad uuid, p_socio uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_yo public.socios; v_act public.actividades; v_s public.socios; v_cant int;
begin
  v_yo := public.mi_socio();
  if v_yo.id is null or v_yo.estado <> 'activo' then raise exception 'No autorizado'; end if;
  select * into v_s from public.socios where id = p_socio and accion = v_yo.accion;
  if v_s.id is null then raise exception 'El socio no pertenece a su acción'; end if;
  select * into v_act from public.actividades where id = p_actividad;
  if v_act.id is null or not v_act.inscripciones_abiertas then raise exception 'Inscripciones cerradas'; end if;
  if v_act.cupo is not null then
    select count(*) into v_cant from public.inscripciones where actividad_id = p_actividad and estado = 'activa';
    if v_cant >= v_act.cupo then raise exception 'No quedan cupos disponibles'; end if;
  end if;
  begin
    insert into public.inscripciones(actividad_id, socio_id, accion) values (p_actividad, p_socio, v_yo.accion);
  exception when unique_violation then
    raise exception '% ya está inscrito en esta actividad', v_s.nombre;
  end;
  if v_act.precio_usd > 0 then
    insert into public.cargos(accion, concepto, monto_usd, tipo)
      values (v_yo.accion, 'Inscripción: ' || v_act.nombre || ' (' || v_s.nombre || ')', v_act.precio_usd, 'actividad');
  end if;
end $$;

-- Compra de entradas: el monto se carga al estado de cuenta de la acción.
create or replace function public.comprar_entradas(p_evento uuid, p_asistentes text[]) returns void
language plpgsql security definer set search_path = public as $$
declare v_yo public.socios; v_ev public.eventos; v_vendidas int; v_mias int; v_n int; v_nombre text;
begin
  v_yo := public.mi_socio();
  if v_yo.id is null or v_yo.estado <> 'activo' then raise exception 'No autorizado'; end if;
  v_n := coalesce(array_length(p_asistentes, 1), 0);
  if v_n = 0 then raise exception 'Indique al menos un asistente'; end if;
  select * into v_ev from public.eventos where id = p_evento for update;
  if v_ev.id is null or not v_ev.venta_entradas then raise exception 'Este evento no tiene venta de entradas'; end if;
  if v_ev.fecha_inicio < now() then raise exception 'El evento ya pasó'; end if;
  if v_ev.aforo is not null then
    select count(*) into v_vendidas from public.entradas where evento_id = p_evento and estado <> 'anulada';
    if v_vendidas + v_n > v_ev.aforo then raise exception 'Solo quedan % entradas', greatest(v_ev.aforo - v_vendidas, 0); end if;
  end if;
  if v_ev.max_por_accion is not null then
    select count(*) into v_mias from public.entradas where evento_id = p_evento and accion = v_yo.accion and estado <> 'anulada';
    if v_mias + v_n > v_ev.max_por_accion then raise exception 'Máximo % entradas por acción', v_ev.max_por_accion; end if;
  end if;
  foreach v_nombre in array p_asistentes loop
    insert into public.entradas(evento_id, socio_id, accion, nombre_asistente) values (p_evento, v_yo.id, v_yo.accion, trim(v_nombre));
  end loop;
  if v_ev.precio_usd > 0 then
    insert into public.cargos(accion, concepto, monto_usd, tipo)
      values (v_yo.accion, v_n || ' entrada(s): ' || v_ev.titulo, v_ev.precio_usd * v_n, 'evento');
  end if;
end $$;

-- Aprobación de pagos reportados
create or replace function public.revisar_pago(p_pago uuid, p_aprobado boolean, p_nota text) returns void
language plpgsql security definer set search_path = public as $$
declare v_p public.pagos;
begin
  if not public.tiene_rol(array['admin','administracion']) then raise exception 'No autorizado'; end if;
  update public.pagos set estado = case when p_aprobado then 'aprobado' else 'rechazado' end, nota_admin = nullif(p_nota, '')
    where id = p_pago and estado = 'pendiente' returning * into v_p;
  if v_p.id is null then raise exception 'El pago ya fue procesado'; end if;
  -- Al aprobar, los conceptos que el socio eligió pagar quedan saldados
  if p_aprobado then
    update public.cargos set estado = 'pagado' where id = any(v_p.cargo_ids) and accion = v_p.accion;
  end if;
  insert into public.notificaciones(titulo, cuerpo, destino, accion, enlace) values (
    case when p_aprobado then 'Pago aprobado' else 'Pago rechazado' end,
    'Su pago con referencia ' || v_p.referencia || case when p_aprobado then ' fue aprobado.' else ' fue rechazado. ' || coalesce(p_nota, '') end,
    'accion', v_p.accion, '/cuenta');
end $$;

-- Vista pública del pase de invitado (el invitado no tiene cuenta)
create or replace function public.pase_invitado(p_codigo text) returns json
language sql stable security definer set search_path = public as $$
  select json_build_object('nombre', i.nombre, 'fecha', i.fecha, 'estado', i.estado, 'anfitrion', s.nombre || ' ' || s.apellido)
  from public.invitados i join public.socios s on s.id = i.socio_id where i.codigo = p_codigo
$$;
grant execute on function public.pase_invitado(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Almacenamiento de archivos
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('publico', 'publico', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('comprobantes', 'comprobantes', false) on conflict do nothing;

create policy publico_leer on storage.objects for select using (bucket_id = 'publico');
create policy publico_subir on storage.objects for insert to authenticated with check (bucket_id = 'publico' and public.es_staff());
create policy comprobantes_subir on storage.objects for insert to authenticated
  with check (bucket_id = 'comprobantes' and (storage.foldername(name))[1] = public.mi_accion());
create policy comprobantes_leer on storage.objects for select to authenticated
  using (bucket_id = 'comprobantes' and ((storage.foldername(name))[1] = public.mi_accion() or public.tiene_rol(array['admin','administracion'])));

-- Notificaciones en tiempo real
alter publication supabase_realtime add table public.notificaciones;
