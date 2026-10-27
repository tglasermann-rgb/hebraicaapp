-- ============================================================================
-- Corrección para bases creadas con la primera versión de 0001_esquema.sql:
-- gen_random_bytes() vive en el esquema `extensions` de Supabase y las funciones
-- (search_path = public) no la encontraban. Se usa gen_random_uuid(), incluida en PostgreSQL.
-- ============================================================================

alter table public.entradas alter column codigo set default replace(gen_random_uuid()::text, '-', '');
alter table public.invitados alter column codigo set default replace(gen_random_uuid()::text, '-', '');

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

-- Pases de invitado: "hoy" según la hora de Caracas (antes usaba UTC y después de las 8 pm rechazaba el día actual)
drop policy if exists invitados_crear on public.invitados;
create policy invitados_crear on public.invitados for insert to authenticated
  with check (accion = public.mi_accion() and socio_id = (public.mi_socio()).id and estado = 'activo' and fecha >= (now() at time zone 'America/Caracas')::date);
