-- ============================================================================
-- Mi Hebraica — seguridad: la información del club solo la ven socios APROBADOS.
-- Antes bastaba con tener sesión: alguien que se registraba (aún sin aprobar)
-- podía leer eventos, actividades, datos bancarios, etc. llamando directo a la API.
-- Ejecutar después de 0009.
-- ============================================================================

create or replace function public.es_socio_activo() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.socios where user_id = auth.uid() and estado = 'activo')
$$;

do $$
declare t text;
begin
  foreach t in array array['tasas','instalaciones','actividades','eventos','albumes','fotos','directorio','restaurantes','configuracion','clases','encuestas','normas'] loop
    execute format('drop policy if exists %I on public.%I', t || '_leer', t);
    execute format('create policy %I on public.%I for select to authenticated using (public.es_socio_activo())', t || '_leer', t);
  end loop;
end $$;

drop policy if exists noticias_leer on public.noticias;
create policy noticias_leer on public.noticias for select to authenticated
  using ((publicado_en <= now() and public.es_socio_activo()) or public.es_staff());

drop policy if exists notificaciones_leer on public.notificaciones;
create policy notificaciones_leer on public.notificaciones for select to authenticated
  using ((destino = 'todos' and public.es_socio_activo()) or accion = public.mi_accion() or socio_id = (public.mi_socio()).id or public.es_staff());

-- Funciones de consulta: solo socios aprobados (antes respondían a cualquiera)
create or replace function public.horarios_ocupados(p_instalacion uuid, p_fecha date) returns setof text
language sql stable security definer set search_path = public as $$
  select hora_inicio from public.reservas
  where instalacion_id = p_instalacion and fecha = p_fecha and estado = 'confirmada' and public.es_socio_activo()
$$;

create or replace function public.ocupacion_clases(p_desde timestamptz, p_hasta timestamptz)
returns table (clase_id uuid, confirmados int, en_espera int)
language sql stable security definer set search_path = public as $$
  select c.id,
    count(r.id) filter (where r.estado = 'confirmada')::int,
    count(r.id) filter (where r.estado = 'espera')::int
  from public.clases c left join public.reservas_clase r on r.clase_id = c.id
  where c.inicio between p_desde and p_hasta and public.es_socio_activo()
  group by c.id
$$;

-- Nadie sin sesión puede llamar funciones (el pase de invitado sigue público: necesita su código).
-- Postgres da permiso a PUBLIC por defecto; se quita y se da solo a usuarios con sesión.
revoke execute on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated, service_role;
revoke execute on function public.generar_recordatorios() from authenticated;
revoke execute on function public.liberar_inscripciones_vencidas() from authenticated;
grant execute on function public.pase_invitado(text) to anon;
alter default privileges in schema public revoke execute on functions from public, anon;
