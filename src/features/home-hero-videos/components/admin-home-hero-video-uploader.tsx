"use client";

import { useEffect, useMemo, useState } from "react";

import type { HomeHeroVideoMediaType } from "@/types/home-hero-video";

type AdminHomeHeroVideoUploaderProps = {
  createEndpoint: string;
  signatureEndpoint: string;
  successRedirectPath: string;
  strings: {
    acceptedFormats: string;
    chooseFile: string;
    description: string;
    emptySelection: string;
    fileTooLarge: string;
    helper: string;
    imageDuration: string;
    imageDurationHelper: string;
    invalidMimeType: string;
    previewTitle: string;
    progress: string;
    selectedFile: string;
    upload: string;
    uploadFailed: string;
    uploading: string;
  };
};

type SignatureResponse = {
  acceptedMimeTypes: string[];
  apiKey: string;
  folder: string;
  maxFileSizeBytes: number;
  publicId: string;
  resourceType: HomeHeroVideoMediaType;
  signature: string;
  tags: string[];
  timestamp: number;
  uploadUrl: string;
};

type UploadedVideoPayload = {
  assetId: string;
  bytes: number;
  format: string;
  originalFilename: string;
  publicId: string;
  secureUrl: string;
};

function inferMediaType(file: File | null): HomeHeroVideoMediaType | null {
  if (!file) {
    return null;
  }

  if (file.type === "video/mp4") {
    return "video";
  }

  if (file.type.startsWith("image/")) {
    return "image";
  }

  return null;
}

function formatMegabytes(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getCloudinaryErrorMessage(responseText: string): string | null {
  try {
    const response = JSON.parse(responseText) as {
      error?: {
        message?: unknown;
      };
    };

    return typeof response.error?.message === "string" && response.error.message.trim().length > 0
      ? response.error.message.trim()
      : null;
  } catch {
    return null;
  }
}

function uploadFileToCloudinary(file: File, signature: SignatureResponse): Promise<UploadedVideoPayload> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    const formData = new FormData();

    formData.set("file", file);
    formData.set("api_key", signature.apiKey);
    formData.set("folder", signature.folder);
    formData.set("public_id", signature.publicId);
    formData.set("signature", signature.signature);
    formData.set("tags", signature.tags.join(","));
    formData.set("timestamp", String(signature.timestamp));

    request.open("POST", signature.uploadUrl);

    request.onload = () => {
      if (request.status < 200 || request.status >= 300) {
        reject(new Error(getCloudinaryErrorMessage(request.responseText) ?? "Cloudinary upload failed."));
        return;
      }

      try {
        const response = JSON.parse(request.responseText) as {
          asset_id?: string;
          bytes?: number;
          format?: string;
          original_filename?: string;
          public_id?: string;
          secure_url?: string;
        };

        if (
          typeof response.asset_id !== "string" ||
          typeof response.bytes !== "number" ||
          typeof response.format !== "string" ||
          typeof response.public_id !== "string" ||
          typeof response.secure_url !== "string"
        ) {
          reject(new Error("Cloudinary upload response was incomplete."));
          return;
        }

        resolve({
          assetId: response.asset_id,
          bytes: response.bytes,
          format: response.format,
          originalFilename: typeof response.original_filename === "string" ? response.original_filename : file.name,
          publicId: response.public_id,
          secureUrl: response.secure_url,
        });
      } catch (error) {
        reject(error instanceof Error ? error : new Error("Cloudinary upload response could not be parsed."));
      }
    };

    request.onerror = () => {
      reject(new Error("Cloudinary upload request failed."));
    };

    request.send(formData);
  });
}

export function AdminHomeHeroVideoUploader({
  createEndpoint,
  signatureEndpoint,
  successRedirectPath,
  strings,
}: AdminHomeHeroVideoUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [displayDurationSeconds, setDisplayDurationSeconds] = useState("7");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const selectedFileSize = useMemo(() => {
    return selectedFile ? formatMegabytes(selectedFile.size) : null;
  }, [selectedFile]);
  const selectedMediaType = useMemo(() => inferMediaType(selectedFile), [selectedFile]);

  async function handleUpload(): Promise<void> {
    if (!selectedFile) {
      setErrorMessage(strings.emptySelection);
      return;
    }

    const mediaType = inferMediaType(selectedFile);

    if (!mediaType) {
      setErrorMessage(strings.invalidMimeType);
      return;
    }

    if (mediaType === "image") {
      const parsedDisplayDurationSeconds = Number(displayDurationSeconds);

      if (!Number.isInteger(parsedDisplayDurationSeconds) || parsedDisplayDurationSeconds < 1) {
        setErrorMessage(strings.imageDurationHelper);
        return;
      }
    }

    setErrorMessage(null);
    setIsUploading(true);

    try {
      const signatureResponse = await fetch(signatureEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaType }),
      });

      if (!signatureResponse.ok) {
        throw new Error(strings.uploadFailed);
      }

      const signature = (await signatureResponse.json()) as SignatureResponse;

      if (!signature.acceptedMimeTypes.includes(selectedFile.type)) {
        throw new Error(strings.invalidMimeType);
      }

      if (selectedFile.size > signature.maxFileSizeBytes) {
        throw new Error(strings.fileTooLarge);
      }

      const uploadedVideo = await uploadFileToCloudinary(selectedFile, signature);
      const fileName = uploadedVideo.originalFilename.endsWith(`.${uploadedVideo.format}`)
        ? uploadedVideo.originalFilename
        : `${uploadedVideo.originalFilename}.${uploadedVideo.format}`;

      const persistResponse = await fetch(createEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cloudinaryAssetId: uploadedVideo.assetId,
          cloudinaryPublicId: uploadedVideo.publicId,
          displayDurationSeconds: mediaType === "image" ? Number(displayDurationSeconds) : null,
          fileName,
        }),
      });

      if (!persistResponse.ok) {
        throw new Error(strings.uploadFailed);
      }

      window.location.assign(successRedirectPath);
    } catch (error) {
      setErrorMessage(error instanceof Error && error.message ? error.message : strings.uploadFailed);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] lg:items-start">
      <div className="space-y-4">
        <label className="block space-y-2.5">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{strings.chooseFile}</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif,video/mp4"
              className="admin-inner-input block w-full rounded-2xl border-dashed px-4 py-3 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-emerald-700 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-emerald-800"
              onChange={(event) => {
                const file = event.currentTarget.files?.[0] ?? null;

              setSelectedFile(file);
              setErrorMessage(null);
              setPreviewUrl((currentPreviewUrl) => {
                if (currentPreviewUrl) {
                  URL.revokeObjectURL(currentPreviewUrl);
                }

                return file ? URL.createObjectURL(file) : null;
              });
              }}
            />
          </label>

          {selectedMediaType === "image" ? (
            <label className="block space-y-2.5">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{strings.imageDuration}</span>
              <input
                type="number"
                min={1}
                step={1}
                value={displayDurationSeconds}
                onChange={(event) => setDisplayDurationSeconds(event.currentTarget.value)}
                className="admin-inner-input min-h-12 w-full rounded-2xl px-4 py-3 text-sm outline-none transition"
              />
              <p className="text-xs leading-6 text-slate-500">{strings.imageDurationHelper}</p>
            </label>
          ) : null}

        <div className="space-y-2">
          <p className="text-sm leading-7 text-slate-600">{strings.description}</p>
          <p className="text-xs leading-6 text-slate-500">{strings.helper}</p>
          <p className="text-xs leading-6 text-slate-500">{strings.acceptedFormats}</p>
        </div>

        {errorMessage ? (
          <div className="admin-warning-banner rounded-2xl border px-4 py-3 text-sm leading-7">{errorMessage}</div>
        ) : null}

        <button
          type="button"
          onClick={() => {
            void handleUpload();
          }}
          disabled={isUploading}
          className="admin-primary-action inline-flex rounded-full px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isUploading ? strings.uploading : strings.upload}
        </button>
      </div>

      {previewUrl && selectedFile ? (
        <div className="admin-inner-panel-subtle space-y-3 rounded-2xl p-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{strings.previewTitle}</p>
            <p className="text-xs leading-6 text-slate-500">
              {strings.selectedFile}: <span className="font-medium text-slate-700">{selectedFile.name}</span>
            </p>
            <p className="text-xs leading-6 text-slate-500">
              {strings.progress}: <span className="font-medium text-slate-700">{selectedFileSize}</span>
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-950">
            {selectedMediaType === "image" ? (
              <img src={previewUrl} alt={selectedFile.name} className="aspect-video w-full object-cover" />
            ) : (
              <video src={previewUrl} controls muted className="aspect-video w-full object-cover" />
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
