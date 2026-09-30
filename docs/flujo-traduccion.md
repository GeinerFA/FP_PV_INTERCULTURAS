# Traducción automática de contenido con corrección manual

Especificación reutilizable, extraída del proyecto Natural Land CR (Next.js 15 + Prisma + DeepL).
Está escrita para que otra sesión de Claude Code la implemente en un proyecto distinto: explica el
**qué** y el **por qué**, y trae el código base ya generalizado (sin referencias a "tours").

> **Para Claude Code:** antes de implementar, adaptá los nombres a la entidad del proyecto
> (Artículo, Producto, Evento...), confirmá con el usuario el idioma de origen y los de destino,
> y revisá qué ORM, validador y sistema de rutas usa el proyecto. Los fragmentos de código son
> TypeScript con Prisma y zod; si el proyecto usa otra cosa, conservá la lógica, no la sintaxis.

---

## 1. Idea general

- El contenido se **escribe en un solo idioma** (el idioma de origen, aquí español) en un panel admin.
- Al guardar, el servidor **traduce automáticamente** a los demás idiomas con una API (DeepL) y
  **guarda la traducción en la base de datos**.
- Las páginas públicas **solo leen de la base de datos**: nunca llaman a la API de traducción. Así el
  sitio es rápido, no depende de que DeepL esté disponible y no gasta cuota por cada visita.
- El admin puede **corregir a mano** la traducción. Una traducción corregida a mano **no se
  sobrescribe** en los siguientes guardados, salvo que el admin pida explícitamente "Retraducir".
- Un **hash del contenido de origen** permite saber si una traducción está al día o quedó
  desactualizada, sin comparar textos campo por campo.

Esto es distinto de traducir la **interfaz** (menús, botones), que va en archivos de mensajes
estáticos (`messages/es.json`, `messages/en.json` con next-intl). Este documento trata solo el
**contenido dinámico** creado desde el admin.

## 2. Flujo completo

```
Admin guarda el formulario en español
        │
        ▼
Server action: valida (zod) ──✖──> devuelve errores por campo
        │ ok
        ▼
Guarda/actualiza la fila de origen (locale=es, source=ORIGINAL)
        │
        ▼
syncTranslation(entidad, idioma destino)
        │
        ├─ hash(origen) == destino.sourceHash ─────────> "up-to-date"  (no llama a la API)
        ├─ destino.source == MANUAL (y no es forzado) ──> "manual"      (no toca las correcciones)
        ├─ no hay proveedor configurado ────────────────> "not-configured"
        │
        ▼
rate limit por admin ──✖──> error "demasiadas solicitudes"
        │
        ▼
Aplana todos los campos en un arreglo de textos → API (en lotes de 50, sin textos vacíos)
        │
        ▼
Rearma los campos y hace upsert de la fila destino
(source=MACHINE, sourceHash=hash(origen), translatedAt=now; el slug se genera solo la primera vez)
        │
        ▼
Revalida la caché de las páginas públicas
        │
        ▼
El guardado del origen SIEMPRE se confirma. Si la traducción falló, se muestra
como aviso ("se guardó, pero no se pudo traducir: <motivo>"), nunca como error que bloquee.
```

**Regla clave:** un fallo de traducción (API caída, cuota agotada, clave inválida) **nunca impide
guardar el idioma de origen**. Se guarda primero y se traduce después; el resultado de la
traducción se devuelve como un aviso aparte.

## 3. Modelo de datos

Una tabla de traducciones separada de la entidad: los datos que **no dependen del idioma**
(duración, ubicación, estado, orden) viven en la entidad; los textos, en una fila por idioma.

```prisma
enum Locale {
  es
  en
}

/// ORIGINAL: escrito en el admin (idioma de origen). MACHINE: traducido por la API.
/// MANUAL: traducción corregida a mano; la retraducción automática no la sobrescribe.
enum TranslationSource {
  ORIGINAL
  MACHINE
  MANUAL
}

model Item {
  id           String            @id @default(cuid())
  // ...campos que no dependen del idioma...
  translations ItemTranslation[]
}

model ItemTranslation {
  id           String            @id @default(cuid())
  itemId       String
  locale       Locale
  /// Slug por idioma para SEO: /es/tours/volcan-arenal y /en/tours/arenal-volcano.
  slug         String
  title        String
  summary      String
  description  String            @db.Text
  includes     String[]          // listas: un elemento por línea en el formulario
  seoTitle     String?
  // ...resto de campos traducibles...

  source       TranslationSource
  /// Hash del contenido de origen del que salió esta traducción; si cambia, está desactualizada.
  sourceHash   String?
  /// Última traducción automática (no cambia al editar a mano).
  translatedAt DateTime?
  createdAt    DateTime          @default(now())
  updatedAt    DateTime          @updatedAt

  item Item @relation(fields: [itemId], references: [id], onDelete: Cascade)

  @@unique([itemId, locale])   // una fila por idioma
  @@unique([locale, slug])     // slug único dentro de cada idioma
}
```

Por qué así:
- **`source`** distingue quién escribió cada versión y decide si la automatización puede pisarla.
- **`sourceHash`** es el hash del contenido de origen *en el momento en que se generó o se revisó*
  esta traducción. Comparándolo con el hash actual del origen se sabe si está al día.
- **Slug por idioma**: mejora el SEO (palabras clave en cada idioma). Se genera una vez y **no
  cambia** aunque cambie el título, para no romper enlaces ya compartidos o indexados.

## 4. Estados de una traducción

Se calculan al vuelo con el origen y el destino; no se guardan.

| Estado | Condición | Qué significa para el admin |
| --- | --- | --- |
| `missing` | no existe fila destino | Sin traducir |
| `machine` | `MACHINE` y hash igual | Traducida y al día; se retraduce sola si cambia el origen |
| `machine-stale` | `MACHINE` y hash distinto | Desactualizada; se actualiza al guardar el origen |
| `manual` | `MANUAL` y hash igual | Editada a mano y al día |
| `manual-stale` | `MANUAL` y hash distinto | Editada a mano, pero el origen cambió después: revisar |

Mostrá este estado como insignia en el listado del admin y con una explicación en la pestaña del
idioma destino. `manual-stale` es el único caso que exige atención humana.

## 5. Código base

### 5.1 Contrato del proveedor (intercambiable)

```ts
// src/lib/translation/types.ts
export type Locale = "es" | "en";

/** Contrato de un proveedor. Para cambiar de DeepL a otro, implementar esto y registrarlo en index.ts. */
export interface Translator {
  readonly name: string;
  /** Traduce cada texto; devuelve un arreglo del mismo largo y en el mismo orden. */
  translate(texts: string[], from: Locale, to: Locale): Promise<string[]>;
}

/** Error con mensaje apto para mostrar en el panel. */
export class TranslationError extends Error {}
```

El resto del sistema solo conoce `Translator`. Cambiar a Google Translate, Azure u OpenAI es
escribir otra implementación de esta interfaz, sin tocar la lógica de sincronización.

### 5.2 Proveedor DeepL

```ts
// src/lib/translation/deepl.ts
import "server-only";
import { TranslationError, type Locale, type Translator } from "./types";

const SOURCE_LANG: Record<Locale, string> = { es: "ES", en: "EN" };
// DeepL exige variante regional para inglés/portugués como destino.
const TARGET_LANG: Record<Locale, string> = { es: "ES", en: "EN-US" };

/** DeepL acepta hasta 50 textos por solicitud. */
const BATCH_SIZE = 50;

const statusMessages: Record<number, string> = {
  403: "La clave de DeepL (DEEPL_API_KEY) es inválida.",
  429: "DeepL recibió demasiadas solicitudes. Intentá de nuevo en un momento.",
  456: "Se agotó la cuota mensual de DeepL.",
};

export function createDeepLTranslator(apiKey: string): Translator {
  // Las claves del plan gratuito terminan en ":fx" y usan otro dominio.
  const endpoint = apiKey.endsWith(":fx")
    ? "https://api-free.deepl.com/v2/translate"
    : "https://api.deepl.com/v2/translate";

  async function translateBatch(texts: string[], from: Locale, to: Locale) {
    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `DeepL-Auth-Key ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          text: texts,
          source_lang: SOURCE_LANG[from],
          target_lang: TARGET_LANG[to],
          preserve_formatting: true,
        }),
        signal: AbortSignal.timeout(30_000),
      });
    } catch {
      throw new TranslationError("No se pudo conectar con DeepL.");
    }
    if (!response.ok) {
      throw new TranslationError(statusMessages[response.status] ?? `DeepL respondió con un error (${response.status}).`);
    }
    const data = (await response.json()) as { translations: { text: string }[] };
    return data.translations.map((t) => t.text);
  }

  return {
    name: "DeepL",
    async translate(texts, from, to) {
      const results: string[] = [];
      for (let i = 0; i < texts.length; i += BATCH_SIZE) {
        results.push(...(await translateBatch(texts.slice(i, i + BATCH_SIZE), from, to)));
      }
      return results;
    },
  };
}
```

Notas: se usa `fetch` directo (sin SDK) para no sumar dependencias. Si el contenido lleva HTML o
Markdown, agregá `tag_handling: "html"` o protegé la sintaxis; si hace falta tono formal/informal,
DeepL acepta `formality`, y para términos fijos (nombres de lugares, marcas) conviene un glosario.

### 5.3 Selección del proveedor y traducción por lotes sin vacíos

```ts
// src/lib/translation/index.ts
import "server-only";
import { createDeepLTranslator } from "./deepl";
import type { Locale, Translator } from "./types";

export { TranslationError, type Translator } from "./types";

/** Proveedor según TRANSLATION_PROVIDER, o null si no hay uno configurado. */
export function getTranslator(): Translator | null {
  const provider = (process.env.TRANSLATION_PROVIDER || "deepl").toLowerCase();
  if (provider === "deepl") {
    const apiKey = process.env.DEEPL_API_KEY;
    return apiKey ? createDeepLTranslator(apiKey) : null;
  }
  return null;
}

/** Traduce saltándose los textos vacíos (no gastan cuota y algunos proveedores los rechazan). */
export async function translateTexts(translator: Translator, texts: string[], from: Locale, to: Locale) {
  const pending = texts.map((text, index) => ({ text: text.trim(), index })).filter((item) => item.text);
  const translated = pending.length ? await translator.translate(pending.map((item) => item.text), from, to) : [];

  const result = texts.map(() => "");
  pending.forEach((item, i) => {
    result[item.index] = translated[i] ?? "";
  });
  return result;
}
```

`getTranslator()` devuelve `null` si falta la clave: el panel lo usa para avisar "la traducción
automática no está configurada" en vez de fallar.

### 5.4 Hash, slug único, estado y sincronización

```ts
// src/server/admin/translation.ts
import "server-only";
import { createHash } from "node:crypto";
import { db } from "@/lib/db";
import { slugify } from "@/lib/slug";
import { getTranslator, translateTexts } from "@/lib/translation";

// Lista explícita de campos traducibles: la misma en el hash, en la traducción y en el formulario.
type TranslatableContent = {
  title: string;
  summary: string;
  description: string;
  includes: string[];
  seoTitle: string | null;
};

/** Hash del contenido traducible (sin slug ni metadatos): si cambia, la traducción quedó desactualizada. */
export function contentHash(c: TranslatableContent) {
  return createHash("sha256")
    .update(JSON.stringify([c.title, c.summary, c.description, c.includes, c.seoTitle]))
    .digest("hex");
}

/** Slug libre en ese idioma; agrega -2, -3... si otro registro ya lo usa. */
export async function uniqueSlug(locale: "es" | "en", base: string, itemId?: string) {
  const root = base || "item";
  for (let n = 1; ; n++) {
    const candidate = n === 1 ? root : `${root}-${n}`;
    const taken = await db.itemTranslation.findFirst({
      where: { locale, slug: candidate, ...(itemId ? { itemId: { not: itemId } } : {}) },
      select: { id: true },
    });
    if (!taken) return candidate;
  }
}

export type TranslationStatus = "missing" | "machine" | "machine-stale" | "manual" | "manual-stale";

export function translationStatus(
  source: TranslatableContent | undefined,
  target: { source: "ORIGINAL" | "MACHINE" | "MANUAL"; sourceHash: string | null } | undefined,
): TranslationStatus {
  if (!target) return "missing";
  const stale = !source || target.sourceHash !== contentHash(source);
  if (target.source === "MANUAL") return stale ? "manual-stale" : "manual";
  return stale ? "machine-stale" : "machine";
}

export type SyncResult = "translated" | "up-to-date" | "manual" | "not-configured";

/**
 * Genera o actualiza la traducción a partir del origen.
 * Sin `force` no toca traducciones corregidas a mano ni las que ya están al día.
 * `beforeTranslate` corre justo antes de llamar a la API (p. ej. para aplicar el rate limit),
 * así no se consume el límite cuando no hace falta traducir.
 */
export async function syncTranslation(
  itemId: string,
  { force = false, beforeTranslate }: { force?: boolean; beforeTranslate?: () => void } = {},
): Promise<SyncResult> {
  const [es, en] = await Promise.all([
    db.itemTranslation.findUnique({ where: { itemId_locale: { itemId, locale: "es" } } }),
    db.itemTranslation.findUnique({ where: { itemId_locale: { itemId, locale: "en" } } }),
  ]);
  if (!es) throw new Error("El registro no tiene contenido en el idioma de origen.");

  const hash = contentHash(es);
  if (!force && en?.sourceHash === hash) return "up-to-date";
  if (!force && en?.source === "MANUAL") return "manual";

  const translator = getTranslator();
  if (!translator) return "not-configured";
  beforeTranslate?.();

  // Aplanar: primero los campos simples (los opcionales como ""), después las listas en orden.
  const scalars = [es.title, es.summary, es.description, es.seoTitle ?? ""];
  const out = await translateTexts(translator, [...scalars, ...es.includes], "es", "en");

  const [title, summary, description, seoTitle] = out;
  let offset = scalars.length;
  const take = (count: number) => out.slice(offset, (offset += count));
  const includes = take(es.includes.length);

  const content = {
    // Si la API devolvió vacío en un campo obligatorio, se conserva el original antes que dejarlo en blanco.
    title: title || es.title,
    summary: summary || es.summary,
    description: description || es.description,
    seoTitle: seoTitle || null,
    includes,
    source: "MACHINE" as const,
    sourceHash: hash,
    translatedAt: new Date(),
  };

  // El slug destino se genera una vez (del título traducido) y después se conserva.
  const slug = en?.slug ?? (await uniqueSlug("en", slugify(content.title), itemId));

  await db.itemTranslation.upsert({
    where: { itemId_locale: { itemId, locale: "en" } },
    create: { itemId, locale: "en", slug, ...content },
    update: content,
  });
  return "translated";
}
```

```ts
// src/lib/slug.ts — "Volcán Arenal & Río Celeste" → "volcan-arenal-rio-celeste"
export function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/, "");
}
```

### 5.5 Server actions del admin

Tres acciones. Todas verifican primero que el usuario sea admin **en el servidor** (no confiar en
que el middleware ya lo hizo).

```ts
// src/app/admin/items/actions.ts
"use server";

/** Traduce y convierte el resultado en un aviso; nunca bloquea el guardado del origen. */
async function translate(itemId: string, adminId: string, force = false): Promise<{ ok: boolean; message?: string }> {
  try {
    const result = await syncTranslation(itemId, {
      force,
      beforeTranslate() {
        const limit = rateLimit(`translate:${adminId}`, { limit: 30, windowMs: 10 * 60_000 });
        if (!limit.ok) throw new TranslationError(rateLimitMessage(limit.retryAfterSec));
      },
    });
    switch (result) {
      case "translated":     return { ok: true, message: "Versión en inglés actualizada." };
      case "up-to-date":     return { ok: true };
      case "manual":         return { ok: false, message: "El inglés fue editado a mano y no se actualizó. Revisalo en la pestaña Inglés." };
      case "not-configured": return { ok: false, message: "La traducción automática no está configurada (falta DEEPL_API_KEY)." };
    }
  } catch (error) {
    if (!(error instanceof TranslationError)) console.error("Error al traducir", itemId, error);
    return { ok: false, message: `No se pudo traducir: ${error instanceof TranslationError ? error.message : "error inesperado."}` };
  }
}

/** 1) Guardar el origen: valida, guarda (slug solo al crear) y traduce. */
export async function saveItem(itemId: string | null, _prev: FormState, formData: FormData) {
  const admin = await requireAdminOrThrow();
  // validar con zod → si falla, devolver fieldErrors
  // slug de origen: si ya existe se conserva; si es nuevo, uniqueSlug("es", slugify(title))
  // upsert de la fila locale="es" con source: "ORIGINAL"
  const translation = await translate(id, admin.id);
  revalidateSite();
  return {
    status: "saved",
    message: ["Cambios guardados.", translation.ok && translation.message].filter(Boolean).join(" "),
    warning: translation.ok ? undefined : translation.message,
  };
}

/** 2) Guardar la traducción corregida a mano. */
export async function saveEnglish(itemId: string, _prev: FormState, formData: FormData) {
  await requireAdminOrThrow();
  // validar con el MISMO esquema zod que el origen
  const es = await db.itemTranslation.findUnique({ where: { itemId_locale: { itemId, locale: "es" } } });
  if (!es) return { status: "error", message: "Primero guardá el contenido en el idioma de origen." };
  // El hash del origen ACTUAL marca esta versión como revisada y al día, hasta que el origen vuelva a cambiar.
  const data = { ...fields, slug, source: "MANUAL" as const, sourceHash: contentHash(es) };
  // upsert de la fila locale="en" (translatedAt NO se toca: sigue marcando la última traducción automática)
  revalidateSite();
}

/** 3) Retraducir: fuerza la traducción automática y reemplaza las correcciones manuales. */
export async function retranslateItem(itemId: string) {
  const admin = await requireAdminOrThrow();
  const result = await translate(itemId, admin.id, true);
  if (result.ok) revalidateSite();
  return result;
}
```

Detalle importante de `saveEnglish`: guarda `sourceHash = hash(origen actual)`. Eso significa "un
humano revisó esta traducción contra *este* origen". Si después cambia el origen, el hash deja de
coincidir y el estado pasa a `manual-stale`, avisando que hay que revisar.

### 5.6 Rate limit

La traducción consume cuota pagada, así que se limita por admin (en este proyecto: 30 llamadas cada
10 minutos). El límite se aplica **dentro de `beforeTranslate`**, o sea solo cuando de verdad se va
a llamar a la API; un guardado que no cambia el texto no lo consume.

La implementación de este proyecto es en memoria (ventana fija con un `Map`), que alcanza para un
servidor único. **En serverless (Vercel) o con varias instancias hay que usar un almacén compartido**
(Upstash Redis con `@upstash/ratelimit`), porque cada instancia llevaría su propia cuenta.

## 6. Interfaz del admin

- **Una pestaña por idioma** en la edición del registro: "Contenido" (origen) e "Inglés".
- **Insignia de estado** en el listado (Sin traducir / Traducida / Desactualizada / Editada a mano /
  Editada a mano · revisar).
- **Pestaña del idioma destino:**
  - Texto que explica el estado actual y la fecha de la última traducción automática.
  - Botón "Traducir ahora" (si falta) o "Retraducir desde el español". Si la traducción es manual,
    pide confirmación: *"Se reemplazarán tus correcciones. ¿Continuar?"*
  - El mismo formulario que el origen, precargado con la traducción; guardarlo la marca como `MANUAL`.
  - Truco de React: `key={translatedAt}` en el formulario, para que después de retraducir se vuelva
    a montar con el texto nuevo (los formularios no controlados no se actualizan solos).
- **Aviso global** en el dashboard si falta `DEEPL_API_KEY`: el sistema sigue funcionando y el
  idioma destino se escribe a mano.
- **Textos cortos sueltos** (por ejemplo, el texto alternativo de una imagen): se aplica la misma
  idea en pequeño. Si el campo destino llega vacío, se traduce el de origen al guardar, y si la
  traducción falla, se guarda igual con un aviso.

## 7. Sitio público

- Cada página pide la fila del idioma de la URL (`where: { locale, slug }`). No hay traducción en
  tiempo real.
- **Listados:** solo muestran registros que tienen fila en ese idioma
  (`translations: { some: { locale } }`). Un registro sin traducción no aparece en inglés, en lugar
  de mostrarse en español dentro del sitio en inglés.
- **Cambio de idioma en una página de detalle:** como los slugs difieren, el selector de idioma
  envía el slug actual; si no existe en el idioma destino, la página busca a qué registro pertenece
  ese slug en otro idioma y **redirige al slug correcto**.
- **SEO:** cada página declara `canonical` y `hreflang` (es, en y `x-default`) usando el slug de
  cada idioma. El sitemap incluye solo los registros que tienen ambos idiomas.
- **Caché:** las páginas son estáticas con revalidación (ISR). Después de cada cambio en el admin
  se llama a `revalidatePath("/", "layout")` para regenerarlas.

## 8. Decisiones y casos borde

| Situación | Comportamiento |
| --- | --- |
| DeepL caído, cuota agotada o clave inválida | Se guarda el origen; aviso con el motivo en lenguaje claro |
| Sin `DEEPL_API_KEY` | Todo funciona; el destino se escribe a mano; aviso en el dashboard |
| El admin guarda sin cambiar el texto | Hash igual → no llama a la API ni consume el rate limit |
| Traducción corregida a mano y después cambia el origen | No se pisa; estado `manual-stale` para que alguien la revise |
| El admin quiere descartar sus correcciones | "Retraducir" con confirmación (`force: true`) |
| Cambia el título | El slug NO cambia (en ningún idioma) para no romper enlaces |
| Dos registros con el mismo título | `uniqueSlug` agrega `-2`, `-3`... dentro de cada idioma |
| Campos opcionales vacíos | No se envían a la API; quedan `null` en el destino |
| La API devuelve vacío en un campo obligatorio | Se conserva el texto de origen en ese campo |
| Listas (incluye, qué llevar) | Se aplanan con los demás textos en una sola llamada y se rearman por posición |

**Limitaciones conocidas** (mejoras posibles si el otro proyecto lo necesita):
- Dos guardados simultáneos del mismo registro pueden cruzarse; con pocos admins no importa. Si
  importa, traducir dentro de una transacción o con una cola de trabajos.
- La traducción es síncrona dentro del guardado: con textos muy largos el admin espera unos segundos.
  Para volúmenes grandes, moverla a un job en segundo plano (Inngest, QStash, una cola propia).
- Varios idiomas destino: generalizar `syncTranslation(itemId, targetLocale)` y recorrer
  `locales.filter(l => l !== sourceLocale)`; el modelo de datos ya lo soporta sin cambios.

## 9. Checklist de implementación

1. Tabla de traducciones con `locale`, `slug`, campos traducibles, `source`, `sourceHash`,
   `translatedAt`, y las claves únicas `(itemId, locale)` y `(locale, slug)`. Migración nueva.
2. `lib/translation/`: `types.ts` (interfaz y error), `deepl.ts` (proveedor), `index.ts`
   (`getTranslator` y `translateTexts`).
3. `slugify` y `uniqueSlug`.
4. `contentHash`, `translationStatus` y `syncTranslation` con **una sola lista** de campos traducibles.
5. Rate limit por admin, aplicado en `beforeTranslate`.
6. Server actions: guardar origen (con traducción no bloqueante), guardar destino manual y
   retraducir. Todas verifican el admin en el servidor.
7. UI del admin: pestañas por idioma, insignias de estado, botón de retraducir con confirmación,
   `key={translatedAt}` en el formulario destino y aviso si falta la clave.
8. Sitio público: consultas por `(locale, slug)`, listados filtrados por idioma, redirección de slug
   entre idiomas, `hreflang` y sitemap.
9. Variables de entorno: `TRANSLATION_PROVIDER=deepl` y `DEEPL_API_KEY=` (la clave gratuita termina
   en `:fx`). Nunca exponer la clave al navegador: todo corre en el servidor (`import "server-only"`).
10. Probar: crear un registro (se traduce), guardar sin cambios (no llama a la API), editar el
    destino a mano, cambiar el origen (estado `manual-stale`, no se pisa), retraducir (se pisa) y
    quitar la clave (se guarda igual, con aviso).

## 10. Archivos de referencia en Natural Land CR

| Archivo | Qué contiene |
| --- | --- |
| `prisma/schema.prisma` | `TourTranslation`, `Locale`, `TranslationSource` |
| `src/lib/translation/types.ts`, `deepl.ts`, `index.ts` | Proveedor intercambiable |
| `src/server/admin/translation.ts` | Hash, slug único, estado y `syncEnglish` |
| `src/server/admin/tour-schema.ts` | Esquema zod compartido por el origen y el destino |
| `src/app/admin/(panel)/tours/actions.ts` | `saveTour`, `saveEnglish`, `retranslateTour` |
| `src/app/admin/(panel)/tours/media-actions.ts` | `updateMediaAlt`: traducción de textos cortos |
| `src/app/admin/(panel)/tours/[id]/ingles/page.tsx` | Pestaña Inglés: estado, retraducir y formulario |
| `src/server/tours.ts` | Consultas públicas por idioma y búsqueda de slug traducido |
| `src/lib/rate-limit.ts` | Rate limit en memoria |
