"use client";

import { useEffect } from "react";

// Bloques que aparecen al hacer scroll. Si un bloque está dentro de otro que ya
// se anima (por ejemplo, un <p> dentro de un <article>), solo se anima el de afuera.
const REVEAL_SELECTOR = "h1, h2, h3, h4, p, li, article, blockquote, figure, a[class*='rounded-full'], button";
// Zonas que manejan su propio movimiento o no deben ocultarse nunca.
const SKIP_SELECTOR = "[data-no-reveal], form, dialog, [role='dialog'], .animate-fade-up";
const STAGGER_MS = 70;
const MAX_STAGGER_STEPS = 6;

type PublicScrollRevealProps = {
  targetId: string;
};

export function PublicScrollReveal({ targetId }: PublicScrollRevealProps) {
  useEffect(() => {
    const root = document.getElementById(targetId);

    if (
      !root ||
      typeof IntersectionObserver === "undefined" ||
      typeof root.animate !== "function" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const tracked = new WeakSet<Element>();
    const pending = new Set<HTMLElement>();

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries
          .filter((entry) => entry.isIntersecting)
          .forEach((entry, index) => {
            const element = entry.target as HTMLElement;

            intersectionObserver.unobserve(element);
            pending.delete(element);
            element.style.opacity = "";
            element.animate(
              [
                { opacity: 0, transform: "translateY(18px)" },
                { opacity: 1, transform: "none" },
              ],
              {
                duration: 650,
                delay: Math.min(index, MAX_STAGGER_STEPS) * STAGGER_MS,
                easing: "cubic-bezier(0.22, 1, 0.36, 1)",
                fill: "backwards",
              },
            );
          });
      },
      { rootMargin: "0px 0px -8% 0px" },
    );

    const collect = (scope: Element, skipVisible: boolean) => {
      const candidates = [
        ...(scope.matches(REVEAL_SELECTOR) ? [scope] : []),
        ...scope.querySelectorAll(REVEAL_SELECTOR),
      ];

      for (const element of candidates) {
        if (!(element instanceof HTMLElement) || tracked.has(element)) continue;
        if (element.closest(SKIP_SELECTOR)) continue;

        const parentTarget = element.parentElement?.closest(REVEAL_SELECTOR);
        if (parentTarget && root.contains(parentTarget)) continue;

        tracked.add(element);

        // En la primera carga lo que ya está en pantalla no se oculta (evita parpadeo);
        // la animación de entrada de <main> se encarga de eso.
        if (skipVisible) {
          const rect = element.getBoundingClientRect();
          if (rect.top < window.innerHeight && rect.bottom > 0) continue;
        }

        element.style.opacity = "0";
        pending.add(element);
        intersectionObserver.observe(element);
      }
    };

    collect(root, true);

    // Contenido nuevo (navegación entre páginas, secciones que se abren) se anima al aparecer.
    const mutationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof Element) collect(node, false);
        }
      }
    });
    mutationObserver.observe(root, { childList: true, subtree: true });

    return () => {
      mutationObserver.disconnect();
      intersectionObserver.disconnect();
      for (const element of pending) element.style.opacity = "";
    };
  }, [targetId]);

  return null;
}
