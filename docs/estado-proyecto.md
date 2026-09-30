# Estado del proyecto — Pura Vida Interculturas

Última actualización: 29 de septiembre de 2026.

Documento para retomar el trabajo en otro dispositivo o en otra sesión de Claude Code. Resume qué es
el sitio, qué se hizo, qué está a medias y qué sigue.

> **Para Claude Code:** leé este archivo completo antes de continuar. Después revisá `git status` y
> `git log` para confirmar que el estado del código coincide con lo que dice acá.

---

## 1. Qué es el proyecto

Sitio web de **Pura Vida Interculturas** (voluntariados, pasantías y clases de español en Costa Rica),
que se va a entregar al dueño.

- **Stack:** Next.js 16 (App Router) + React 19 + Tailwind 4 + Flowbite, MongoDB con Mongoose,
  next-intl, Cloudinary (media de la portada), Nodemailer con Gmail SMTP, reCAPTCHA v2, Google OAuth
  para el admin.
- **Gestor de paquetes:** pnpm. En esta máquina `node` no está en el PATH del shell por defecto; está en
  `/home/linuxbrew/.linuxbrew/bin/node` (o usar la terminal "Workspace Shell" de VS Code).
- **Sitio público:** inicio con carrusel de videos/imágenes, sobre nosotros, catálogo y detalle de
  programas, preguntas frecuentes, formulario de aplicación (reCAPTCHA, CV en PDF, correo de confirmación).
- **Panel admin** (`/admin`, ingreso con Google): programas (borrador/publicado/archivado), solicitudes
  (estados, correo al postulante, exportar Excel/PDF), historial de actividad, categorías, preguntas
  frecuentes, media de la portada, usuarios con permisos y traducción automática.
- **Comandos de verificación:**
  ```bash
  pnpm exec tsx --test $(git ls-files '*.test.ts' '*.test.tsx')   # 104 tests
  pnpm exec tsc --noEmit
  pnpm lint        # 0 errores, 15 advertencias preexistentes
  pnpm build
  ```

## 2. Estado de git

- Rama `main`, remoto `origin` → `https://github.com/GeinerFA/FP_PV_INTERCULTURAS.git`.
- **Ya en GitHub:** el arreglo de subida de videos/fotos (commit `aac74d5 Cloudinary edit`).
- **Sin commit todavía:** toda la traducción automática (sección 4), `docs/flujo-traduccion.md` y este
  documento. **Para continuar en otro dispositivo hay que hacer commit y push primero**; si no, el otro
  equipo no va a tener esos cambios.
- `.env.local` no está en git (tiene secretos). Hay que copiarlo a mano al otro dispositivo por un medio
  seguro, no por el repositorio.

## 3. Trabajo terminado

### 3.1 Subida de videos y fotos en el admin (en GitHub)

- **Causa:** muchos `.MP4` de drones, GoPro o iPhone son en realidad contenedores QuickTime (MOV).
  Cloudinary los registraba como `mov` y el servidor solo aceptaba `mp4`, así que borraba el video y
  mostraba un error genérico.
- **Arreglo** (`src/lib/cloudinary.ts` y el uploader):
  - Se aceptan MP4 y MOV. Cloudinary genera una versión MP4 H.264 de 1080p como máximo (transformación
    `eager` asíncrona). Un video de 39 MB quedó en 10 MB.
  - Los límites se ajustaron al plan Free de Cloudinary: imágenes de 10 MB y 25 megapíxeles, videos de
    100 MB.
  - El mensaje de error ahora muestra la causa real.
- **Pendiente:** confirmar la subida de **fotos** desde el panel. No se tenía la foto que fallaba; lo
  más probable es que pasara de 10 MB o de 25 MP. Ahora el mensaje dice la causa.

### 3.2 Traducción automática español → inglés (SIN commit)

Implementada siguiendo `docs/flujo-traduccion.md`, adaptada de Prisma a Mongoose. Detalle en la
sección 4.

### 3.3 Diagnóstico: "no puedo ingresar al panel" (resuelto, sin cambios de código)

- **Causa:** en esta máquina el puerto 3000 lo ocupa **Natural Land CR**, otra app. `APP_ORIGIN` apunta
  a `http://localhost:3000`, así que el ingreso con Google terminaba en esa otra app (respondía 401 y
  redirigía con `callbackUrl`). Además `pnpm dev` de este proyecto no arrancaba (`EADDRINUSE`).
- **Verificado:** en otro puerto el flujo llega bien a Google, y `geinerfa@gmail.com` y
  `tanyacascr@gmail.com` son superadmin activos en la base de datos.
- **Decisión pendiente del usuario:**
  1. Detener Natural Land CR cuando se trabaje en este proyecto, o
  2. Pasar este proyecto al puerto 3001: script `"dev": "next dev -p 3001"`,
     `APP_ORIGIN=http://localhost:3001` y agregar
     `http://localhost:3001/api/admin/auth/google/callback` en Google Cloud Console (URIs de
     redireccionamiento autorizados). Sin ese último paso Google responde `redirect_uri_mismatch`.

## 4. Traducción automática: cómo quedó

### Diseño

- **Idiomas:** español (`/`, fuente) e inglés (`/en`). El admin es solo en español: `/en/admin/...`
  redirige a `/admin/...`. No hay detección por idioma del navegador (`localeDetection: false`).
- **Textos de interfaz:** `messages/es.json` y `messages/en.json`. El inglés de las páginas públicas lo
  tradujo Claude a mano; los namespaces del admin quedan en español en `en.json`.
- **Contenido dinámico** (programas, preguntas frecuentes, categorías): se escribe en español. Al
  guardar, el servidor traduce con DeepL y guarda el inglés en MongoDB. Las páginas públicas solo leen
  de la base de datos.
- **Programas:** el inglés vive en el mismo documento (`translations.en`, `seo.en`, `location.en`,
  `duration.en`, `availability.en`) más `translationMeta.en = { source: machine|manual, sourceHash,
  translatedAt }`. Viaja con el flujo borrador/publicado. Si el español publicado coincide con el del
  borrador, el snapshot publicado recibe la misma traducción.
- **Un solo slug compartido** entre idiomas (`/programs/x` y `/en/programs/x`). Es una desviación
  consciente del documento, que proponía un slug por idioma: el slug ya es inmutable después de
  publicar.
- **Estados:** `missing`, `machine`, `machine-stale`, `manual`, `manual-stale`, calculados con el hash
  del contenido en español.
- **Una traducción editada a mano** no se sobrescribe. "Retraducir" la reemplaza, previa confirmación.
- **Si DeepL falla**, el español se guarda igual y se muestra un aviso con el motivo.
- **Rate limit:** 30 traducciones cada 10 minutos por admin, en memoria (sirve para un solo servidor).

### Dónde está en el admin

- **Editor de programa:** pestañas "Contenido en español" / "Inglés". La pestaña Inglés
  (`/admin/programs/[id]/english`) muestra el español al lado de cada campo, el estado, la fecha de la
  última traducción automática, "Traducir ahora" / "Retraducir" y el guardado manual.
- **Listado de programas:** insignia de estado del inglés y botón "Inglés".
- **Preguntas frecuentes y categorías:** campos en inglés en el formulario de edición. Vacíos = traducir
  automáticamente; editados = traducción manual.
- **Configuración → Traducción automática** (`/admin/settings/translations`): si DeepL está
  configurado, conteo por estado, lista de programas para revisar y "Traducir todo lo pendiente".

### Sitio público

- Selector ES/EN en el encabezado.
- En inglés solo aparece lo que ya tiene traducción. Un programa sin traducir en `/en/programs/x`
  redirige a la versión en español.
- `canonical` y `hreflang` en cada página, `<html lang>`, `sitemap.xml` y `robots.txt`.
- **Bug arreglado de paso:** la cookie de "solicitud enviada" estaba limitada a `/apply` y no habría
  funcionado en `/en/apply/success`.

### Archivos principales

| Archivo | Contenido |
| --- | --- |
| `src/lib/translation/` | Proveedor DeepL, `translateTexts`, hash y estados |
| `src/lib/rate-limit.ts` | Rate limit en memoria |
| `src/services/programs/program-translation-content.ts` | Campos traducibles, hash, estados (lógica pura) |
| `src/services/programs/program-translation-service.ts` | Sincronización, guardado manual y traducción masiva |
| `src/services/translation/short-text-translation.ts` | Lógica para preguntas frecuentes y categorías |
| `src/services/translation/admin-translation.ts` | Avisos no bloqueantes y rate limit por admin |
| `src/app/[locale]/admin/programs/actions.ts` | Guardar/publicar con traducción, `saveProgramEnglishAction`, `retranslateProgramAction` |
| `src/app/[locale]/admin/settings/actions.ts` | Preguntas frecuentes, categorías y `translatePendingContentAction` |
| `src/features/translations/` | Insignia de estado, avisos y página de configuración |
| `src/components/layout/public-language-switcher.tsx` | Selector de idioma |
| `src/app/sitemap.ts`, `src/app/robots.ts` | SEO |

### Verificación hecha

- 104 tests en verde (19 nuevos, con un traductor simulado), `tsc` y `lint` sin errores, `pnpm build`
  OK.
- Se levantó el build y se revisaron las rutas públicas, las redirecciones y todas las páginas nuevas
  del admin (con una sesión local, solo lectura).
- **No se probó con DeepL real:** todavía no hay `DEEPL_API_KEY`. Hoy todo el contenido figura como
  "Sin traducir" (6 programas, 7 preguntas frecuentes, 4 categorías), así que `/en/programs` y
  `/en/faqs` se ven vacíos.

## 5. Próximos pasos

1. **Commit y push** de la traducción automática, para tenerla en el otro dispositivo.
2. **Resolver el puerto del admin** (sección 3.3).
3. **Activar DeepL:** crear una cuenta (el plan gratis alcanza, idealmente a nombre del dueño), poner
   `DEEPL_API_KEY` en `.env.local` y en el hosting. Después usar Configuración → Traducción automática
   → "Traducir todo lo pendiente" y revisar la pestaña Inglés de cada programa.
4. Probar la subida de fotos desde el panel.
5. **`NEXT_PUBLIC_RECAPTCHA_SITE_KEY` y `RECAPTCHA_SECRET_KEY`** faltan en `.env.local`. En modo
   producción (`pnpm start`) `/apply` da error 500 sin ellas. En desarrollo se usan las claves de
   prueba de Google.

### Arreglos pendientes para la entrega (del análisis inicial)

- Sacar del repositorio los videos de respaldo pesados (`public/videos/*.mp4`, 95 MB y 61 MB) y
  subirlos a Cloudinary.
- Optimizar `public/branding/logo-sin-fondo.png` (1,3 MB, se usa como favicon) y `logo.png` (~1 MB).
- Agregar una imagen OpenGraph para compartir en redes.
- Reescribir el `README.md` en español para el dueño: instalación, variables, deploy y cómo dar acceso
  a otros admins.
- Confirmar con el dueño los enlaces de Instagram y WhatsApp (en
  `src/features/public/components/public-home-page.tsx`).
- Limpiar carpetas vacías (`src/app/admin/`, `(public)/impact`, `(public)/privacy`) y archivos de
  desarrollo (`openspec/`, `.atl/`, `sdd/`, `.vscode/bin/`), y quitar `allowedDevOrigins` con la IP
  local de `next.config.ts`.
- Resolver las 15 advertencias de lint (variables `locale` sin usar, `<img>`).
- Decidir con el dueño el correo de envío (hoy Gmail SMTP "temporal") y crear la **política de
  privacidad** (el formulario recoge datos personales y CV).
- Traspasar al dueño las cuentas de MongoDB, Cloudinary, Google OAuth, reCAPTCHA (registrada para su
  dominio), DeepL y el correo remitente, y ajustar `ADMIN_ALLOWED_EMAIL`.

### Limitaciones conocidas de la traducción

- El rate limit en memoria no se comparte entre instancias. En Vercel con varias instancias haría falta
  Redis (por ejemplo, Upstash).
- Los correos de cambio de estado al postulante siguen solo en español. La confirmación de solicitud sí
  tiene versión en inglés.
- Las traducciones no se registran en el historial de actividad del admin.
