/* eslint-disable @next/next/no-img-element */

"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

type ProgramCoverImageLightboxProps = {
  imageSrc: string;
  imageAlt: string;
  previewHintLabel: string;
  dialogTitle: string;
  closeLabel: string;
};

export function ProgramCoverImageLightbox({
  imageSrc,
  imageAlt,
  previewHintLabel,
  dialogTitle,
  closeLabel,
}: ProgramCoverImageLightboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const lastActiveElementRef = useRef<HTMLElement | null>(null);
  const dialogTitleId = useId();

  useEffect(() => {
    if (!isOpen) {
      lastActiveElementRef.current?.focus();
      return;
    }

    lastActiveElementRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        className="mt-3 block w-full cursor-zoom-in overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50 text-left transition hover:border-emerald-300/70"
        aria-label={previewHintLabel}
        title={previewHintLabel}
        onClick={() => setIsOpen(true)}
      >
        <img src={imageSrc} alt={imageAlt} className="h-64 w-full object-contain md:h-80" />
      </button>

      <p className="text-xs leading-6 text-slate-500">{previewHintLabel}</p>

      {typeof document !== "undefined" && isOpen
        ? createPortal(
            <div
              className="fixed inset-0 z-50 bg-slate-950/60 px-4 py-6 backdrop-blur-sm sm:px-6 sm:py-10"
              onClick={() => setIsOpen(false)}
            >
              <div className="flex min-h-full items-center justify-center">
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby={dialogTitleId}
                  className="surface-soft-strong w-full max-w-5xl rounded-[32px] border border-white/75 p-4 shadow-[0_36px_110px_-44px_rgba(15,23,42,0.42)] sm:p-5"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <h3 id={dialogTitleId} className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">
                      {dialogTitle}
                    </h3>
                    <button
                      ref={closeButtonRef}
                      type="button"
                      className="admin-outline-action inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition"
                      onClick={() => setIsOpen(false)}
                    >
                      {closeLabel}
                    </button>
                  </div>

                  <div className="overflow-hidden rounded-[24px] bg-slate-950/5 p-2 sm:p-3">
                    <img src={imageSrc} alt={imageAlt} className="max-h-[80vh] w-full rounded-[20px] object-contain" />
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
