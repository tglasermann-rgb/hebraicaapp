# Mi Hebraica

App oficial para socios de **Hebraica – Centro Social Cultural Deportivo y Religioso** (Caracas, Venezuela).
Es un web app instalable (PWA) que se empaqueta luego para App Store y Google Play sin reescribir nada.

## Qué puede hacer el socio

| Módulo | Detalle |
|---|---|
| Carnet digital | Código QR dinámico que cambia cada minuto (las capturas de pantalla no sirven para entrar). El titular puede mostrar el carnet de sus hijos. |
| Estado de cuenta | Saldo en USD y su equivalente en Bs. a tasa BCV, cargos y pagos. |
| Reportar pagos | Pago Móvil, Zelle, transferencias Bs./USD, tarjeta o efectivo, con comprobante. Administración aprueba y el socio recibe una notificación. |
| Reservas | Canchas, parrilleras y salones por bloques de horario, con límite por acción y día. |
| Actividades | Academias y cursos con filtro por departamento, edad y cupos. El costo se carga a la cuenta. |
| Macabilandia | Sección propia con las inscripciones del plan vacacional. |
| Entradas | Compra o reserva de entradas (p. ej. Kineret) con QR por asistente. |
| Agenda | Eventos del club y calendario judío con encendido de velas y Havdalá de Caracas. |
| Familia | Grupo familiar de la acción y solicitud para agregar familiares. |
| Invitados | El socio registra al invitado y le envía un enlace con su pase QR. |
| Comunidad | Noticias, galería, restaurantes (horarios), directorio, solicitudes y sugerencias. |
| Notificaciones | Avisos generales o por acción. |
| Seguridad | Desbloqueo con Face ID o huella, y solicitud de eliminación de cuenta (lo exige Apple). |

## Panel de administración (dentro del mismo app)

| Rol | Puede |
|---|---|
| Administrador general | Todo, incluidos directorio, restaurantes y datos bancarios. |
| Administración | Socios (incluye importar desde Excel/CSV), pagos, cargos, cuota masiva, tasa BCV y reportes. |
| Deportes | Instalaciones, reservas y actividades. |
| Eventos | Eventos y entradas, noticias, galería y actividades. |
| Seguridad | Escáner QR de acceso (carnets, invitados, entradas) y registro de accesos. |

## Probarlo ahora (modo demo)

```bash
npm install
npm run dev
```

Sin credenciales de Supabase, el app arranca en **modo demo** con datos de ejemplo guardados en el navegador. En la pantalla de entrada hay botones para entrar como Socio, Admin o Seguridad. Usuarios de prueba: `david` / `demo1234` (socio), `admin` / `admin1234`, `seguridad` / `seguridad1234`. Hay dos solicitudes de acceso de ejemplo esperando aprobación en el panel.

## Puesta en producción (todo gratis para ~1.000 socios)

### 1. Base de datos: Supabase (plan gratuito)
1. Crear un proyecto en https://supabase.com (región: `us-east-1`, la más cercana a Venezuela).
2. En **SQL Editor**, ejecutar `supabase/migrations/0001_esquema.sql`.
3. En **Authentication → Providers → Email**, dejar Email activado y **desactivar "Confirm email"**. El acceso es con usuario y contraseña; el app usa internamente un correo derivado del usuario y no envía correos.
4. Ejecutar `supabase/seed.sql` y seguir sus instrucciones para aprobarte como primer administrador.
5. Copiar en **Project Settings → API** la *URL* y la *anon key*.

### Tasa BCV automática
La tasa oficial se obtiene del **Banco Central de Venezuela vía [DolarApi](https://ve.dolarapi.com/v1/dolares/oficial)**.
1. Desplegar la función: `supabase functions deploy tasa-bcv`.
2. Activar las extensiones `pg_cron` y `pg_net`. Ejecutar `supabase/migrations/0002_tasa_bcv_automatica.sql` con tu URL y clave.
3. La tasa se registra sola de lunes a viernes. En el panel → Tasa BCV también se puede consultar al momento o cargarla a mano.

### 2. Publicar el web app: GitHub Pages (gratis)
1. En el repositorio: **Settings → Pages → Source: GitHub Actions**.
2. En **Settings → Secrets and variables → Actions**, crear `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
3. Cada push a `main` publica el app automáticamente (`.github/workflows/deploy.yml`).

Los socios lo abren en el teléfono y lo instalan con **Compartir → Agregar a pantalla de inicio** (iPhone) o **Instalar app** (Android).

### 3. Cargar socios
Panel → Socios → **Importar desde Excel (CSV)**. Columnas: `accion, cedula, nombre, apellido, email, telefono, parentesco, fecha_nacimiento`.
Cada persona entra a **"¿Es tu primera vez? → Registrarme"**, escribe nombre, apellido y cédula, y crea su usuario y contraseña.
La solicitud aparece en **Panel → Solicitudes de acceso**:
- Si la cédula coincide con un socio cargado, se aprueba con un toque y queda vinculado a su acción.
- Si no, Administración indica la acción y el parentesco al aprobar.
- Si se rechaza (con motivo), la persona puede corregir sus datos y reenviar.

¿Olvidó su contraseña? Por ahora se gestiona con Atención al Público (Supabase → Authentication → Users).

## App Store y Google Play

Ver [docs/APP_STORE.md](docs/APP_STORE.md).

## Tecnología

React + TypeScript + Vite + Tailwind · Supabase (Postgres con Row Level Security) · PWA.
La seguridad de los datos está en la base de datos (políticas RLS y funciones en `supabase/migrations`), no en el app.

```
src/
  lib/          datos (backend.ts, supabaseBackend.ts, demoBackend.ts), marca, calendario judío
  components/   UI y navegación
  pages/        pantallas del socio
  pages/admin/  panel de administración
supabase/       esquema SQL, políticas y datos iniciales
```
