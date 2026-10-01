"use client";

import { useRef, useState } from "react";

type AdminRowDetailsToggleProps = {
  showLabel: string;
  hideLabel: string;
};

/**
 * Botón "Ver detalle" de las tablas del admin en vista de tarjetas (< 1280px).
 * Marca la fila con data-expanded y el CSS (globals.css) muestra u oculta el resto de las celdas.
 * Va dentro de una celda con data-cell="toggle", que en escritorio está oculta.
 */
export function AdminRowDetailsToggle({ showLabel, hideLabel }: AdminRowDetailsToggleProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  return (
    <button
      ref={buttonRef}
      type="button"
      aria-expanded={isExpanded}
      onClick={() => {
        const nextExpanded = !isExpanded;

        setIsExpanded(nextExpanded);
        buttonRef.current?.closest("tr")?.setAttribute("data-expanded", String(nextExpanded));
      }}
      className="admin-outline-action inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold transition"
    >
      {isExpanded ? hideLabel : showLabel}
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        className={`h-4 w-4 fill-current transition duration-300 ${isExpanded ? "rotate-180" : ""}`}
      >
        <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z" />
      </svg>
    </button>
  );
}
