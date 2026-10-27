-- ============================================================================
-- Mi Hebraica — inscripciones hechas antes de 0007 y regla de cancelación.
-- Ejecutar después de 0008.
-- ============================================================================

-- Las inscripciones anteriores no tenían su cargo enlazado: se enlazan por el concepto
-- ("Inscripción: <actividad> (<nombre>)") y, si el cargo sigue sin pagar, quedan pendientes de pago.
update public.inscripciones i
set cargo_id = c.id,
    estado = case when c.estado = 'pagado' then 'activa' else 'pendiente_pago' end
from public.actividades a, public.socios s, public.cargos c
where i.cargo_id is null and i.estado = 'activa'
  and a.id = i.actividad_id and s.id = i.socio_id
  and c.accion = i.accion and c.tipo = 'actividad'
  and c.concepto = 'Inscripción: ' || a.nombre || ' (' || s.nombre || ')'
  and not exists (select 1 from public.inscripciones o where o.cargo_id = c.id);

-- Cancelar: se puede mientras no esté pagada (pendiente de pago, o sin costo). Pagada, no.
create or replace function public.cancelar_inscripcion(p_inscripcion uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_i public.inscripciones; v_staff boolean := public.tiene_rol(array['admin','deportes','eventos','administracion']);
begin
  select * into v_i from public.inscripciones where id = p_inscripcion for update;
  if v_i.id is null or (v_i.accion <> public.mi_accion() and not v_staff) then raise exception 'No encontrada'; end if;
  if v_i.estado = 'cancelada' then raise exception 'La inscripción ya fue cancelada'; end if;
  if v_i.cargo_id is not null and exists (select 1 from public.cargos where id = v_i.cargo_id and estado = 'pagado') then
    raise exception 'Esta inscripción ya está pagada y no se puede borrar';
  end if;
  if exists (select 1 from public.pagos p where v_i.cargo_id = any(p.cargo_ids) and p.estado = 'pendiente') then
    raise exception 'Hay un pago en revisión para esta inscripción; espera la respuesta de Administración';
  end if;
  update public.inscripciones set estado = 'cancelada' where id = v_i.id;
  delete from public.cargos where id = v_i.cargo_id and estado = 'pendiente';
end $$;
