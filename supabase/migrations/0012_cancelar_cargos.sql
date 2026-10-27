-- ============================================================================
-- Mi Hebraica — cancelar desde "Cuenta" lo que aún no se ha pagado:
-- inscripciones y entradas a eventos. Pagado o con pago en revisión, no.
-- Ejecutar después de 0011.
-- ============================================================================

alter table public.entradas add column if not exists cargo_id uuid references public.cargos(id) on delete set null;

-- Compras anteriores: se enlazan con su cargo ("N entrada(s): <evento>", misma acción, mismo momento)
update public.entradas en
set cargo_id = c.id
from public.eventos ev, public.cargos c
where en.cargo_id is null and ev.id = en.evento_id
  and c.accion = en.accion and c.tipo = 'evento'
  and c.concepto like '% entrada(s): ' || ev.titulo
  and abs(extract(epoch from c.created_at - en.created_at)) < 120;

-- Compra de entradas: el cargo queda enlazado a sus entradas
create or replace function public.comprar_entradas(p_evento uuid, p_asistentes text[]) returns void
language plpgsql security definer set search_path = public as $$
declare v_yo public.socios; v_ev public.eventos; v_vendidas int; v_mias int; v_n int; v_nombre text; v_cargo uuid;
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
  if v_ev.precio_usd > 0 then
    insert into public.cargos(accion, concepto, monto_usd, tipo)
      values (v_yo.accion, v_n || ' entrada(s): ' || v_ev.titulo, v_ev.precio_usd * v_n, 'evento')
      returning id into v_cargo;
  end if;
  foreach v_nombre in array p_asistentes loop
    insert into public.entradas(evento_id, socio_id, accion, nombre_asistente, cargo_id) values (p_evento, v_yo.id, v_yo.accion, trim(v_nombre), v_cargo);
  end loop;
end $$;

-- Cancela un cargo sin pagar de inscripción o de entradas: anula lo que generó y borra el cargo.
-- Las cuotas y cargos que crea Administración no se cancelan desde el app.
create or replace function public.cancelar_cargo(p_cargo uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_c public.cargos; v_n int := 0; v_k int;
begin
  select * into v_c from public.cargos where id = p_cargo for update;
  if v_c.id is null or (v_c.accion is distinct from public.mi_accion() and not public.tiene_rol(array['admin','administracion'])) then
    raise exception 'No encontrado';
  end if;
  if v_c.estado = 'pagado' then raise exception 'Ya está pagado y no se puede cancelar'; end if;
  if exists (select 1 from public.pagos p where v_c.id = any(p.cargo_ids) and p.estado = 'pendiente') then
    raise exception 'Tienes un pago en revisión para este concepto; espera la respuesta de Administración';
  end if;

  -- Inscripciones (enlazadas, o anteriores por el concepto "Inscripción: <actividad> (<nombre>)")
  update public.inscripciones i set estado = 'cancelada'
  where i.estado <> 'cancelada' and (i.cargo_id = v_c.id or (i.cargo_id is null and i.accion = v_c.accion and exists (
    select 1 from public.actividades a, public.socios s
    where a.id = i.actividad_id and s.id = i.socio_id and v_c.concepto = 'Inscripción: ' || a.nombre || ' (' || s.nombre || ')')));
  get diagnostics v_k = row_count; v_n := v_n + v_k;

  -- Entradas (enlazadas, o anteriores por el concepto "N entrada(s): <evento>")
  update public.entradas en set estado = 'anulada'
  where en.estado = 'activa' and (en.cargo_id = v_c.id or (en.cargo_id is null and en.accion = v_c.accion and exists (
    select 1 from public.eventos ev where ev.id = en.evento_id and v_c.concepto like '% entrada(s): ' || ev.titulo)));
  get diagnostics v_k = row_count; v_n := v_n + v_k;

  if v_n = 0 and v_c.concepto not like 'Inscripción: %' and v_c.concepto not like '% entrada(s): %' then
    raise exception 'Este concepto no se puede cancelar desde el app; comunícate con Administración';
  end if;
  delete from public.cargos where id = v_c.id;
end $$;
revoke execute on function public.cancelar_cargo(uuid) from public, anon;
grant execute on function public.cancelar_cargo(uuid) to authenticated;
