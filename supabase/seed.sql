-- ============================================================================
-- Datos iniciales. Ejecutar DESPUÉS de migrations/0001_esquema.sql.
-- Todo lo marcado "(completar)" debe editarse desde el panel de administración.
-- ============================================================================

-- 1) Primer administrador.
--    a) Abre el app y usa "Soy nuevo · Registrarme" con tu nombre, cédula, usuario y contraseña.
--    b) Luego ejecuta esto (cambia 'tu_usuario' y la acción) para aprobarte como administrador:
--
-- insert into public.socios (user_id, usuario, accion, cedula, nombre, apellido, rol)
--   select user_id, usuario, '0001', cedula, nombre, apellido, 'admin' from public.registros where usuario = 'tu_usuario';
-- update public.registros set estado = 'aprobado' where usuario = 'tu_usuario';
--
--    Desde ahí, las demás solicitudes se aprueban en el panel → Solicitudes de acceso.

-- 2) Datos bancarios para reportar pagos
insert into public.configuracion (id, valor) values ('datos_bancarios', '{
  "pago_movil": {"banco": "(completar)", "telefono": "(completar)", "rif": "(completar)"},
  "transferencia_bs": {"banco": "(completar)", "cuenta": "(completar)", "titular": "Hebraica", "rif": "(completar)"},
  "zelle": {"email": "(completar)", "titular": "(completar)"},
  "transferencia_usd": {"banco": "(completar)", "cuenta": "(completar)", "titular": "(completar)"},
  "nota": "Los pagos en bolívares se calculan a la tasa oficial del BCV del día del pago."
}'::jsonb) on conflict (id) do nothing;

-- 3) Directorio (departamentos de servicio del Manual de Identidad)
insert into public.directorio (departamento, email, orden) values
  ('Atención al Público', 'info@hebraica.org', 1),
  ('Admisión', 'info@hebraica.org', 2),
  ('Administración y Cobranzas', 'info@hebraica.org', 3),
  ('Comunicaciones', 'info@hebraica.org', 4),
  ('Deportes', 'info@hebraica.org', 5),
  ('Juventud y Educación', 'info@hebraica.org', 6),
  ('Cultura', 'info@hebraica.org', 7),
  ('Bienestar', 'info@hebraica.org', 8),
  ('Capital Humano', 'info@hebraica.org', 9),
  ('Seguridad', 'info@hebraica.org', 10);

-- 4) Instalaciones de ejemplo (ajusta nombres, horarios y reglas)
insert into public.instalaciones (nombre, tipo, hora_apertura, hora_cierre, duracion_min, max_reservas_dia) values
  ('Cancha de Tenis 1', 'Tenis', '06:00', '21:00', 60, 1),
  ('Cancha de Tenis 2', 'Tenis', '06:00', '21:00', 60, 1),
  ('Cancha de Pádel', 'Pádel', '07:00', '22:00', 90, 1),
  ('Cancha de Fútbol', 'Fútbol', '08:00', '20:00', 60, 1),
  ('Parrillera A', 'Parrillera', '11:00', '19:00', 240, 1),
  ('Salón de Fiestas', 'Salón', '10:00', '22:00', 240, 1);

-- 5) Restaurantes (completar con los reales)
insert into public.restaurantes (nombre, descripcion, horario, orden) values
  ('Restaurante (completar)', 'Descripción del restaurante', 'Mar a Dom 12:00 m – 10:00 pm', 1);
