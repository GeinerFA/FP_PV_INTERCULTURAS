"use client";

import { createContext, useContext, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";

// Menú hamburguesa del admin en celular (< md). Desde md la barra lateral se ve completa como siempre.
type AdminMobileMenuState = {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
};

const AdminMobileMenuContext = createContext<AdminMobileMenuState>({
  isOpen: false,
  setIsOpen: () => undefined,
});

export function AdminMobileMenuProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return <AdminMobileMenuContext.Provider value={{ isOpen, setIsOpen }}>{children}</AdminMobileMenuContext.Provider>;
}

export function AdminMobileMenuButton({ label }: { label: string }) {
  const { isOpen, setIsOpen } = useContext(AdminMobileMenuContext);

  return (
    <button
      type="button"
      aria-expanded={isOpen}
      aria-controls="admin-mobile-menu"
      aria-label={label}
      title={label}
      onClick={() => setIsOpen((current) => !current)}
      className="admin-sidebar-home-link inline-flex h-11 w-11 items-center justify-center rounded-full md:hidden"
    >
      <span aria-hidden="true" className="relative block h-3.5 w-5">
        <span
          className={`absolute left-0 top-0 h-0.5 w-5 rounded-full bg-current transition duration-300 ${isOpen ? "translate-y-1.5 rotate-45" : ""}`}
        />
        <span
          className={`absolute left-0 top-1.5 h-0.5 w-5 rounded-full bg-current transition duration-300 ${isOpen ? "opacity-0" : ""}`}
        />
        <span
          className={`absolute left-0 top-3 h-0.5 w-5 rounded-full bg-current transition duration-300 ${isOpen ? "-translate-y-1.5 -rotate-45" : ""}`}
        />
      </span>
    </button>
  );
}

export function AdminMobileMenuPanel({ className, children }: { className: string; children: ReactNode }) {
  const { isOpen, setIsOpen } = useContext(AdminMobileMenuContext);

  return (
    // Al tocar un enlace (navegar a otra sección) el menú se cierra.
    <div
      id="admin-mobile-menu"
      onClick={(event) => {
        if ((event.target as HTMLElement).closest("a")) {
          setIsOpen(false);
        }
      }}
      className={`${className} ${isOpen ? "flex animate-[fade-down_220ms_ease-out] md:animate-none" : "hidden md:flex"}`}
    >
      {children}
    </div>
  );
}
