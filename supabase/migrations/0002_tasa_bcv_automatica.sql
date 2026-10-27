-- ============================================================================
-- Tasa BCV automática: llama a la función `tasa-bcv` todos los días.
-- Requisitos: desplegar la función (supabase functions deploy tasa-bcv) y activar
-- las extensiones pg_cron y pg_net (Database → Extensions).
-- Reemplaza <PROYECTO> y <ANON_KEY> con los datos de Project Settings → API.
-- ============================================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- El BCV publica la tasa en la tarde (vigente para el día hábil siguiente).
-- Se consulta 8:05 am, 1:05 pm y 6:05 pm hora de Caracas (12:05, 17:05 y 22:05 UTC), lunes a viernes.
select cron.schedule(
  'tasa-bcv-diaria',
  '5 12,17,22 * * 1-5',
  $$
  select net.http_post(
    url := 'https://<PROYECTO>.supabase.co/functions/v1/tasa-bcv',
    headers := jsonb_build_object('Authorization', 'Bearer <ANON_KEY>', 'Content-Type', 'application/json'),
    body := '{}'::jsonb
  );
  $$
);
