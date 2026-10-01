"use client";

import { useEffect, useRef, useState } from "react";

type ScrollToTopButtonProps = {
  label: string;
  /**
   * Element that scrolls instead of the window on some breakpoints (the admin <main> on desktop).
   * Both are watched, since on mobile the window scrolls even when this element exists.
   */
  scrollContainerId?: string;
  /** Distance in px scrolled before the button shows up. */
  threshold?: number;
};

const RING_RADIUS = 21;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

type ScrollState = {
  visible: boolean;
  progress: number;
};

function readScrollState(container: HTMLElement | null, threshold: number): ScrollState {
  const containerScrolls = container !== null && container.scrollHeight > container.clientHeight + 1 && container.scrollTop > 0;
  const top = containerScrolls ? container.scrollTop : window.scrollY;
  const maxScroll = containerScrolls
    ? container.scrollHeight - container.clientHeight
    : document.documentElement.scrollHeight - window.innerHeight;

  return {
    visible: top > threshold,
    progress: maxScroll > 0 ? Math.min(1, Math.max(0, top / maxScroll)) : 0,
  };
}

/** Floating "back to top" button with a ring that fills as the page is scrolled. */
export function ScrollToTopButton({ label, scrollContainerId, threshold = 420 }: ScrollToTopButtonProps) {
  const [state, setState] = useState<ScrollState>({ visible: false, progress: 0 });
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const container = scrollContainerId ? document.getElementById(scrollContainerId) : null;

    const update = () => {
      if (frameRef.current !== null) {
        return;
      }

      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null;
        setState(readScrollState(container, threshold));
      });
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    container?.addEventListener("scroll", update, { passive: true });

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      container?.removeEventListener("scroll", update);

      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, [scrollContainerId, threshold]);

  const scrollToTop = () => {
    const behavior: ScrollBehavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    const container = scrollContainerId ? document.getElementById(scrollContainerId) : null;

    container?.scrollTo({ top: 0, behavior });
    window.scrollTo({ top: 0, behavior });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label={label}
      title={label}
      data-visible={state.visible}
      aria-hidden={!state.visible}
      tabIndex={state.visible ? undefined : -1}
      className="scroll-top-button"
    >
      <svg aria-hidden="true" viewBox="0 0 48 48" className="scroll-top-button-ring">
        <circle cx="24" cy="24" r={RING_RADIUS} className="scroll-top-button-ring-track" />
        <circle
          cx="24"
          cy="24"
          r={RING_RADIUS}
          className="scroll-top-button-ring-progress"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={RING_CIRCUMFERENCE * (1 - state.progress)}
        />
      </svg>
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="scroll-top-button-arrow"
      >
        <path d="M12 19V5" />
        <path d="m5.5 11.5 6.5-6.5 6.5 6.5" />
      </svg>
    </button>
  );
}
