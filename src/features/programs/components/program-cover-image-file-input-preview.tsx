/* eslint-disable @next/next/no-img-element */

"use client";

import { useEffect, useState } from "react";

type ProgramCoverImageFileInputPreviewProps = {
  accept: string;
  coverImageLabel: string;
  description: string;
  name: string;
  previewAlt: string;
  previewTitle: string;
  publishBoundary: string;
  selectedFileLabel: string;
};

type CoverImagePreviewState = {
  fileName: string;
  url: string;
};

export function ProgramCoverImageFileInputPreview({
  accept,
  coverImageLabel,
  description,
  name,
  previewAlt,
  previewTitle,
  publishBoundary,
  selectedFileLabel,
}: ProgramCoverImageFileInputPreviewProps) {
  const [preview, setPreview] = useState<CoverImagePreviewState | null>(null);

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview.url);
      }
    };
  }, [preview]);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] lg:items-start">
      <div className="space-y-4">
        <label className="block">
          <span className="sr-only">{coverImageLabel}</span>
          <input
            type="file"
            name={name}
            accept={accept}
            className="admin-inner-input block w-full rounded-2xl border-dashed px-4 py-3 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-emerald-700 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-emerald-800"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0] ?? null;

              setPreview((currentPreview) => {
                if (currentPreview) {
                  URL.revokeObjectURL(currentPreview.url);
                }

                if (!file) {
                  return null;
                }

                return {
                  fileName: file.name,
                  url: URL.createObjectURL(file),
                };
              });
            }}
          />
        </label>

        <div className="space-y-2">
          <p className="text-sm leading-7 text-slate-600">{description}</p>
          <p className="text-xs leading-6 text-slate-500">{publishBoundary}</p>
        </div>
      </div>

      {preview ? (
        <div className="admin-inner-panel-subtle space-y-3 rounded-2xl p-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{previewTitle}</p>
            <p className="text-xs leading-6 text-slate-500">
              {selectedFileLabel}: <span className="font-medium text-slate-700">{preview.fileName}</span>
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
            <img src={preview.url} alt={previewAlt} className="h-56 w-full object-contain" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
