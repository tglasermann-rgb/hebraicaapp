# Publicar en App Store y Google Play

El app ya está lista como web app. Para las tiendas se empaqueta con **Capacitor**: el mismo código queda dentro de una app nativa para iOS y Android.

## Requisitos (los gestiona Hebraica)

| | Apple App Store | Google Play |
|---|---|---|
| Cuenta | Apple Developer Program **como organización** | Google Play Console (organización) |
| Costo | USD 99 / año | USD 25 una sola vez |
| Documentos | Número **D-U-N-S** de la institución (gratis, tarda ~1–2 semanas), sitio web, correo del dominio | Verificación de identidad de la organización |
| Equipo | Una Mac con Xcode para compilar (o un servicio en la nube como Codemagic o Ionic Appflow) | Cualquier computadora |

## Nombre en la tienda

Ya existe un app llamado "Hebraica Venezuela", así que se recomienda:
- **Mi Hebraica** (nombre en el teléfono)
- Subtítulo en la tienda: *Socios Hebraica Caracas*

Alternativas: "Hebraica Socios", "Hebraica Club".

## Pasos técnicos (cuando existan las cuentas)

```bash
npm i @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
npx cap init "Mi Hebraica" org.hebraica.mihebraica --web-dir dist
npm run build && npx cap add ios && npx cap add android
npx cap open ios      # compilar y subir a TestFlight desde Xcode
npx cap open android  # generar el AAB para Google Play
```

Plugins nativos que reemplazan lo que hoy hace el navegador:
- `@capacitor/push-notifications` para notificaciones push reales, con Firebase Cloud Messaging (gratis).
- `@aparajita/capacitor-biometric-auth` para Face ID / huella nativos.
- `@capacitor/camera` para el escáner de seguridad y las fotos de comprobantes.

## Lo que Apple revisa (y ya está cubierto)

- **Política de privacidad y términos**: dentro del app en `/privacidad` y `/terminos`, y públicos en la web.
- **Eliminación de cuenta desde el app**: Perfil → "Solicitar eliminación de mi cuenta".
- **Pagos**: las cuotas de un club físico se pueden pagar fuera de Apple (guía 3.1.3(e)), así que no aplica la comisión del 30 %.
- **Cuenta de prueba para el revisor**: crear un socio de prueba y darlo en App Store Connect → App Review Information.
- **Funcionalidad nativa**: Apple rechaza apps que son "solo una página web". Las notificaciones push, Face ID y el carnet QR cumplen esa exigencia.

## Material para la ficha de la tienda

- Ícono 1024×1024: `public/icons/store-1024.png`
- Capturas: iPhone 6.7" (1290×2796) y 6.5". Se generan desde el app en modo demo.
- Correo de soporte: info@hebraica.org
- Contacto para TestFlight: el responsable designado por Hebraica.
