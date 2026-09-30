"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import { usePathname } from "@/i18n/navigation";

type PublicHeaderState = {
  /** Encabezado transparente sobre el hero (inicio, arriba de todo y con el menú cerrado). */
  isTransparent: boolean;
  menuOpen: boolean;
  setMenuOpen: Dispatch<SetStateAction<boolean>>;
};

const PublicHeaderContext = createContext<PublicHeaderState>({
  isTransparent: false,
  menuOpen: false,
  setMenuOpen: () => undefined,
});

export function usePublicHeader() {
  return useContext(PublicHeaderContext);
}

const SCROLL_THRESHOLD_PX = 24;

export function PublicHeader({ children }: { children: React.ReactNode }) {
  // Locale-less pathname: "/" en / y en /en.
  const pathname: string = usePathname();
  const isHome = pathname === "/";
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!isHome) {
      return;
    }

    const syncScroll = () => {
      setIsScrolled(window.scrollY > SCROLL_THRESHOLD_PX);
    };

    syncScroll();
    window.addEventListener("scroll", syncScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", syncScroll);
    };
  }, [isHome]);

  const isTransparent = isHome && !isScrolled && !menuOpen;

  return (
    <PublicHeaderContext.Provider value={{ isTransparent, menuOpen, setMenuOpen }}>
      {/* En inicio el encabezado es fixed para quedar encima del hero; en el resto sigue sticky. */}
      <header
        className={`${isHome ? "fixed inset-x-0" : "sticky"} top-0 z-20 border-b transition-[background-color,border-color,box-shadow] duration-500 ${
          isTransparent
            ? "border-transparent bg-transparent"
            : "border-white/70 bg-white/80 shadow-[0_12px_40px_-32px_rgba(15,23,42,0.4)] backdrop-blur-xl"
        }`}
      >
        {children}
      </header>
    </PublicHeaderContext.Provider>
  );
}
