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

Sin credenciales de Supabase, el app arranca en **modo demo** con datos de ejemplo guardados en el navegador. En la pantalla de entrada hay botones para entrar como Socio, Admin o Seguridad. En el modo demo, el código de activación es `123456`.

## Puesta en producción (todo gratis para ~1.000 socios)

### 1. Base de datos: Supabase (plan gratuito)
1. Crear un proyecto en https://supabase.com (región: `us-east-1`, la más cercana a Venezuela).
2. En **SQL Editor**, ejecutar `supabase/migrations/0001_esquema.sql`.
3. Editar `supabase/seed.sql` con tus datos de administrador y ejecutarlo.
4. En **Authentication → Email Templates**, editar las plantillas *Magic Link* y *Confirm signup* para que muestren el código:
   `Tu código de Mi Hebraica es: {{ .Token }}`
5. En **Authentication → SMTP Settings**, configurar un SMTP propio. El correo integrado de Supabase solo envía unos pocos mensajes por hora. [Resend](https://resend.com) es gratis hasta 3.000 correos/mes.
6. Copiar en **Project Settings → API** la *URL* y la *anon key*.

### 2. Publicar el web app: GitHub Pages (gratis)
1. En el repositorio: **Settings → Pages → Source: GitHub Actions**.
2. En **Settings → Secrets and variables → Actions**, crear `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
3. Cada push a `main` publica el app automáticamente (`.github/workflows/deploy.yml`).

Los socios lo abren en el teléfono y lo instalan con **Compartir → Agregar a pantalla de inicio** (iPhone) o **Instalar app** (Android).

### 3. Cargar socios
Panel → Socios → **Importar desde Excel (CSV)**. Columnas: `accion, cedula, nombre, apellido, email, telefono, parentesco, fecha_nacimiento`.
Cada socio entra con **"Activa tu cuenta"** usando su acción y cédula. Recibe un código en su correo y crea su contraseña.

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
