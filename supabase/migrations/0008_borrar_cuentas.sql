-- ============================================================================
-- Mi Hebraica — Administración puede borrar una solicitud de acceso equivocada
-- (o una cuenta que quedó sin solicitud). Se borra el usuario completo para que
-- el nombre de usuario quede libre y la persona pueda registrarse de nuevo.
-- Ejecutar después de 0007.
-- ============================================================================

-- Usuarios que se crearon pero no tienen solicitud ni socio (un registro quedó a medias)
create or replace function public.cuentas_incompletas()
returns table (user_id uuid, usuario text, creada timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if not public.tiene_rol(array['admin','administracion']) then raise exception 'No autorizado'; end if;
  return query
    select u.id, split_part(u.email, '@', 1), u.created_at
    from auth.users u
    where not exists (select 1 from public.registros r where r.user_id = u.id)
      and not exists (select 1 from public.socios s where s.user_id = u.id)
    order by u.created_at desc;
end $$;

-- Borra el usuario y su solicitud. No toca cuentas de socios ya aprobados.
create or replace function public.eliminar_cuenta(p_user uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.tiene_rol(array['admin','administracion']) then raise exception 'No autorizado'; end if;
  if exists (select 1 from public.socios where user_id = p_user) then
    raise exception 'Esta cuenta pertenece a un socio aprobado; desactívalo desde Socios';
  end if;
  delete from public.registros where user_id = p_user;
  delete from auth.users where id = p_user;
end $$;
revoke execute on function public.cuentas_incompletas() from public, anon;
revoke execute on function public.eliminar_cuenta(uuid) from public, anon;

-- Inscripciones: se pueden borrar solo si aún no están pagadas (el socio o Deportes/Eventos/Admin)
create or replace function public.cancelar_inscripcion(p_inscripcion uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_i public.inscripciones; v_staff boolean := public.tiene_rol(array['admin','deportes','eventos','administracion']);
begin
  select * into v_i from public.inscripciones where id = p_inscripcion for update;
  if v_i.id is null or (v_i.accion <> public.mi_accion() and not v_staff) then raise exception 'No encontrada'; end if;
  if v_i.estado = 'activa' and v_i.cargo_id is not null then raise exception 'Esta inscripción ya está pagada y no se puede borrar'; end if;
  if v_i.estado <> 'pendiente_pago' and not v_staff then raise exception 'Esta inscripción ya está confirmada y no se puede borrar'; end if;
  if v_i.estado = 'cancelada' then raise exception 'La inscripción ya fue cancelada'; end if;
  if exists (select 1 from public.pagos p where v_i.cargo_id = any(p.cargo_ids) and p.estado = 'pendiente') then
    raise exception 'Hay un pago en revisión para esta inscripción; recházalo o apruébalo primero';
  end if;
  update public.inscripciones set estado = 'cancelada' where id = v_i.id;
  delete from public.cargos where id = v_i.cargo_id and estado = 'pendiente';
end $$;
