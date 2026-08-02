import { getLocale, getTranslations } from "next-intl/server";

import type { AppLocale } from "@/config/i18n";
import { hasAdminPermission, type AdminSession } from "@/lib/admin-session";
import { AdminWorkspaceSection } from "@/features/admin/components/admin-workspace-section";
import { isKnownAdminMongoUnavailableError } from "@/features/admin/lib/is-known-admin-mongo-unavailable-error";
import { DestructiveActionConfirmation } from "@/features/programs/components/destructive-action-confirmation";
import { listAdminHomeHeroVideos } from "@/services/home-hero-videos/home-hero-video-service";
import { formatBytesLabel } from "@/validators/home-hero-video";

import { deleteHomeHeroVideoAction, updateHomeHeroVideoOrderAction } from "@/app/[locale]/admin/settings/home-videos/actions";

import { AdminHomeHeroVideoUploader } from "./admin-home-hero-video-uploader";

type AdminHomeHeroVideoSettingsProps = {
  feedback?: "created" | "reordered" | "deleted" | "invalid" | "save-failed" | "delete-failed" | "reorder-failed";
  selectedVideoId?: string;
  session: AdminSession;
};

type TranslationValues = Record<string, string | number>;

function formatFallbackMessage(template: string, values?: TranslationValues): string {
  if (!values) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (_, token: string) => {
    const value = values[token];
    return value == null ? `{${token}}` : String(value);
  });
}

export async function AdminHomeHeroVideoSettings({
  feedback,
  selectedVideoId,
  session,
}: AdminHomeHeroVideoSettingsProps) {
  const [t, locale] = await Promise.all([getTranslations("AdminHomeHeroVideoSettings"), getLocale()]);
  const message = (key: string, fallback: string, values?: TranslationValues) =>
    t.has(key) ? t(key as never, values as never) : formatFallbackMessage(fallback, values);

  let videos: Awaited<ReturnType<typeof listAdminHomeHeroVideos>>;

  try {
    videos = await listAdminHomeHeroVideos();
  } catch (error) {
    if (!isKnownAdminMongoUnavailableError(error)) {
      throw error;
    }

    return (
      <AdminWorkspaceSection
        eyebrow={message("unavailable.eyebrow", "Videos no disponibles")}
        title={message("unavailable.title", "No se pudo cargar el mantenimiento de videos de la home")}
        description={message(
          "unavailable.description",
          "La autenticación se completó, pero la fuente administrativa de MongoDB no está disponible o tiene una configuración inválida para esta ruta protegida.",
        )}
        tone="warning"
      >
        <p className="max-w-3xl text-sm leading-7 text-slate-700">
          {message(
            "unavailable.note",
            "Verificá la conectividad y la configuración de MongoDB antes de continuar. Esta vista no reemplaza los videos reales por datos simulados dentro del panel.",
          )}
        </p>
      </AdminWorkspaceSection>
    );
  }

  const activeLocale = locale as AppLocale;
  const canManage = hasAdminPermission(session, "settings.manage");
  const canDelete = hasAdminPermission(session, "settings.delete");
  const feedbackTone =
    feedback === "invalid" || feedback === "save-failed" || feedback === "delete-failed" || feedback === "reorder-failed"
      ? "admin-warning-banner"
      : "admin-success-banner";
  const cloudinaryCount = videos.filter((video) => video.storageProvider === "cloudinary").length;
  const imageCount = videos.filter((video) => video.mediaType === "image").length;
  const successRedirectPath = `/${activeLocale}/admin/settings/home-videos?status=created#admin-home-hero-video-settings-top`;

  return (
    <div id="admin-home-hero-video-settings-top" className="space-y-8">
      {feedback ? (
        <div className={`${feedbackTone} rounded-[28px] border px-5 py-4 text-sm leading-7 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.9)]`}>
          {message(`feedback.${feedback}`, "La acción se completó.")}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-3">
        <article className="admin-inner-panel rounded-[28px] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{message("stats.total.label", "Videos configurados")}</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{videos.length}</p>
          <p className="mt-2 text-sm text-slate-600">{message("stats.total.description", "Total actual de recursos ordenados para el hero principal de la portada.")}</p>
        </article>
        <article className="admin-inner-panel rounded-[28px] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{message("stats.images.label", "Imágenes configuradas")}</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{imageCount}</p>
          <p className="mt-2 text-sm text-slate-600">{message("stats.images.description", "Cantidad de imágenes que hoy rotan como slides estáticos dentro del hero público.")}</p>
        </article>
        <article className="admin-inner-panel rounded-[28px] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{message("stats.cloudinary.label", "Hospedados en Cloudinary")}</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{cloudinaryCount}</p>
          <p className="mt-2 text-sm text-slate-600">{message("stats.cloudinary.description", "Cantidad de videos ya migrados al flujo nuevo de subida desde el dispositivo.")}</p>
        </article>
      </div>

      <AdminWorkspaceSection
        title={message("live.label", "Impacto inmediato")}
        description={message(
          "live.description",
          "El orden y las eliminaciones impactan la home pública en cuanto se revalida esta ruta. No existe un paso separado de publicación.",
        )}
      >
        <p className="max-w-3xl text-sm leading-7 text-slate-700">
          {message("live.note", "Las subidas nuevas quedan disponibles en esta misma configuración apenas termina el guardado del recurso.")}
        </p>
      </AdminWorkspaceSection>

      <AdminWorkspaceSection
        title={message("upload.title", "Subir un nuevo video")}
        description={message("upload.description", "Agregá un recurso nuevo al carrusel principal desde tu dispositivo con almacenamiento real en Cloudinary.")}
      >
        {canManage ? (
          <AdminHomeHeroVideoUploader
            createEndpoint="/api/admin/settings/home-videos"
            signatureEndpoint="/api/admin/settings/home-videos/signature"
            successRedirectPath={successRedirectPath}
            strings={{
              acceptedFormats: message("upload.acceptedFormats", "Formatos aceptados en esta iteración: JPG, PNG, WEBP, AVIF y MP4."),
              chooseFile: message("upload.chooseFile", "Archivo de video o imagen"),
              description: message(
                "upload.descriptionBody",
                "Este flujo sube directamente a Cloudinary y después guarda solo la metadata necesaria en MongoDB para el orden público.",
              ),
              emptySelection: message("upload.emptySelection", "Elegí un archivo antes de subirlo."),
              fileTooLarge: message(
                "upload.fileTooLarge",
                "El archivo supera el límite permitido para este flujo. Reducí el peso o reemplazalo por una versión optimizada.",
              ),
              helper: message(
                "upload.helper",
                "Límite operativo inicial: hasta 150 MB para videos y 25 MB para imágenes para mantener una calidad útil sin reintroducir el cuello de botella anterior.",
              ),
              invalidMimeType: message("upload.invalidMimeType", "Por ahora este mantenimiento acepta imágenes compatibles y archivos MP4."),
              imageDuration: message("upload.imageDuration", "Duración de la imagen (segundos)"),
              imageDurationHelper: message("upload.imageDurationHelper", "Ingresá un número entero mayor o igual a 1 para definir cuánto tiempo se muestra esta imagen."),
              previewTitle: message("upload.previewTitle", "Vista previa local"),
              progress: message("upload.fileSize", "Tamaño"),
              selectedFile: message("upload.selectedFile", "Archivo elegido"),
              upload: message("upload.action", "Subir video"),
              uploadFailed: message("upload.failed", "No se pudo completar la subida del video en este momento. Reintentá en unos minutos."),
              uploading: message("upload.uploading", "Subiendo video…"),
            }}
          />
        ) : (
          <p className="text-sm leading-7 text-slate-600">
            {message("permissions.manageRequired", "Tu sesión puede ver este módulo, pero no tiene permisos para subir, reordenar o eliminar videos.")}
          </p>
        )}
      </AdminWorkspaceSection>

      <AdminWorkspaceSection
        title={message("list.title", "Videos configurados")}
        description={message("list.description", "Cada tarjeta representa el orden real del hero público. Cambiá la posición con un número entero y guardá para reorganizar el carrusel.")}
      >
        {videos.length === 0 ? (
          <p className="text-sm leading-7 text-slate-600">
            {message("empty", "Todavía no hay videos persistidos en este módulo. Cuando subas el primero, aparecerá enseguida en la portada pública.")}
          </p>
        ) : null}

        <div className="space-y-5">
          {videos.map((video) => {
            const formId = `admin-home-hero-video-entry-${video.id}`;

            return (
              <article
                key={video.id}
                className={`admin-inner-panel rounded-[28px] p-5 md:p-6 ${selectedVideoId === video.id ? "ring-2 ring-emerald-200" : ""}`.trim()}
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{message("entry.position", "Posición {order}", { order: video.order })}</p>
                    <h3 className="text-lg font-semibold text-slate-950 md:text-xl">{video.fileName}</h3>
                    <div className="space-y-1 text-sm leading-7 text-slate-600">
                      <p>
                        {message("entry.mediaType", "Tipo: {type}", {
                          type: message(`mediaTypes.${video.mediaType}`, video.mediaType === "image" ? "Imagen" : "Video"),
                        })}
                      </p>
                      <p>
                        {message("entry.storageProvider", "Origen: {provider}", {
                          provider: message(
                            `storageProviders.${video.storageProvider}`,
                            video.storageProvider === "cloudinary" ? "Cloudinary" : "archivo local heredado",
                          ),
                        })}
                      </p>
                      <p>{message("entry.fileSize", "Tamaño: {size}", { size: formatBytesLabel(video.bytes) })}</p>
                      {video.mediaType === "image" && video.displayDurationSeconds ? (
                        <p>{message("entry.displayDuration", "Duración visible: {seconds} segundos", { seconds: video.displayDurationSeconds })}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-950">
                    {video.mediaType === "image" ? (
                      <img src={video.sourceUrl} alt={video.fileName} className="aspect-video w-full object-cover" />
                    ) : (
                      <video src={video.sourceUrl} controls muted className="aspect-video w-full object-cover" />
                    )}
                  </div>
                </div>

                <div className="mt-5 border-t border-emerald-900/8 pt-5">
                  {canManage ? (
                    <form id={formId} action={updateHomeHeroVideoOrderAction.bind(null, activeLocale, video.id)} className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                      <label className="block space-y-2.5 md:max-w-xs">
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{message("fields.order", "Posición pública")}</span>
                        <input
                          type="number"
                          min={1}
                          max={videos.length}
                          name="order"
                          defaultValue={video.order}
                          className="admin-inner-input min-h-12 w-full rounded-2xl px-4 py-3 text-sm outline-none transition"
                        />
                      </label>
                      <input type="hidden" name="mediaType" value={video.mediaType} />

                      {video.mediaType === "image" ? (
                        <label className="block space-y-2.5 md:max-w-xs">
                          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{message("fields.displayDuration", "Duración visible (segundos)")}</span>
                          <input
                            type="number"
                            min={1}
                            step={1}
                            name="displayDurationSeconds"
                            defaultValue={video.displayDurationSeconds ?? 7}
                            className="admin-inner-input min-h-12 w-full rounded-2xl px-4 py-3 text-sm outline-none transition"
                          />
                        </label>
                      ) : null}

                      <div className="flex flex-col gap-3 md:flex-row md:items-start">
                        <button type="submit" className="admin-secondary-action inline-flex rounded-full px-5 py-3 text-sm font-semibold transition">
                          {message("actions.saveOrder", "Guardar posición")}
                        </button>
                        {canDelete ? (
                          <DestructiveActionConfirmation
                            title={message("delete.title", "Confirmar eliminación")}
                            description={message("delete.description", "Eliminar quita este video del panel y del carrusel de la home pública.")}
                            warning={
                                video.storageProvider === "cloudinary"
                                  ? message(
                                      "delete.cloudinaryWarning",
                                      "En videos subidos con el flujo nuevo, también se intenta borrar el asset real en Cloudinary para no dejar basura remota.",
                                    )
                                  : message(
                                      "delete.localWarning",
                                      "Los videos heredados locales solo se eliminan de la metadata persistida. El archivo estático del proyecto no se borra desde esta interfaz.",
                                    )
                              }
                            triggerLabel={message("actions.delete", "Eliminar video")}
                            confirmLabel={message("delete.confirm", "Sí, eliminar video")}
                            cancelLabel={message("delete.cancel", "Cancelar")}
                            confirmValue="delete"
                            formAction={deleteHomeHeroVideoAction.bind(null, activeLocale, video.id)}
                            formId={formId}
                            tone="danger"
                            actionLayout="stacked"
                            className="w-full md:max-w-xs"
                          />
                        ) : null}
                      </div>
                    </form>
                  ) : (
                    <p className="text-sm leading-7 text-slate-600">
                      {message("permissions.manageRequired", "Tu sesión puede ver este módulo, pero no tiene permisos para subir, reordenar o eliminar videos.")}
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </AdminWorkspaceSection>
    </div>
  );
}
