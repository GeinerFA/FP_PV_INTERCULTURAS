"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { AdaptiveVideo } from "@/components/media/adaptive-video";

type CarouselSlide = {
  id: string;
  src: string;
  fileName: string;
  mediaType: "image" | "video";
  displayDurationSeconds: number | null;
};

type PublicHomeVideoCarouselProps = {
  slides: CarouselSlide[];
  scrollHintLabel: string;
  children: React.ReactNode;
};

const AUTOPLAY_INTERVAL_MS = 7000;

function playVideo(video: HTMLVideoElement | null) {
  if (!video) {
    return;
  }

  if (video.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) {
    video.load();
    return;
  }

  void video.play().catch(() => undefined);
}

export function PublicHomeVideoCarousel({
  slides,
  scrollHintLabel,
  children,
}: PublicHomeVideoCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);

  const hasMultipleSlides = slides.length > 1;
  const activeSlide = slides[activeIndex] ?? null;

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const syncPreference = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    syncPreference();
    mediaQuery.addEventListener("change", syncPreference);

    return () => {
      mediaQuery.removeEventListener("change", syncPreference);
    };
  }, []);

  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (!video) {
        return;
      }

      if (index === activeIndex && !prefersReducedMotion) {
        video.currentTime = 0;
        playVideo(video);
        return;
      }

      video.pause();
      video.currentTime = 0;
    });
  }, [activeIndex, prefersReducedMotion]);

  useEffect(() => {
    if (prefersReducedMotion || !hasMultipleSlides || !activeSlide) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % slides.length);
    }, activeSlide.mediaType === "image" ? (activeSlide.displayDurationSeconds ?? 7) * 1000 : AUTOPLAY_INTERVAL_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [activeSlide, hasMultipleSlides, prefersReducedMotion, slides.length]);

  const statusLabel = useMemo(
    () => `${activeIndex + 1} / ${slides.length}`,
    [activeIndex, slides.length],
  );

  return (
    // El margen negativo anula el padding superior de <main> para que el hero llegue al borde de la pantalla.
    <section className="animate-fade-up relative left-1/2 isolate -mt-8 w-screen -translate-x-1/2 overflow-hidden bg-slate-950 text-white md:-mt-10 lg:-mt-12">
      <div className="absolute inset-0">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${index === activeIndex ? "opacity-100" : "opacity-0"}`}
          >
            {slide.mediaType === "image" ? (
              <img src={slide.src} alt={slide.fileName} className="h-full w-full object-cover" />
            ) : (
              <AdaptiveVideo
                ref={(node) => {
                  videoRefs.current[index] = node;
                }}
                aria-hidden="true"
                className="h-full w-full"
                loop
                muted
                playsInline
                autoPlay={!prefersReducedMotion && index === activeIndex}
                preload={index === activeIndex ? "auto" : "none"}
                onCanPlay={() => {
                  if (index === activeIndex && !prefersReducedMotion) {
                    playVideo(videoRefs.current[index]);
                  }
                }}
              >
                <source src={slide.src} type="video/mp4" />
                {slide.fileName}
              </AdaptiveVideo>
            )}
          </div>
        ))}
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(2,6,23,0.7)_0%,rgba(15,23,42,0.3)_50%,rgba(6,78,59,0.4)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(2,6,23,0.85)_0%,rgba(2,6,23,0.35)_40%,transparent_70%)]" />
        {/* Oscurece la franja superior para que el encabezado transparente se lea. */}
        <div className="absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,rgba(2,6,23,0.6)_0%,transparent_100%)]" />
      </div>

      {/* El encabezado es fixed en inicio, así que el hero ocupa la pantalla completa detrás de él. */}
      <div className="relative mx-auto flex min-h-[max(36rem,100svh)] w-full max-w-6xl flex-col justify-end px-6 pb-8 pt-32 md:min-h-[max(40rem,100svh)] md:pb-10 lg:pb-12">
        {children}

        {hasMultipleSlides ? (
          <div className="mt-10 flex items-center justify-between gap-4 border-t border-white/15 pt-5 text-xs text-white/70">
            <div className="flex items-center gap-2.5">
              {slides.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  aria-label={`Mostrar slide ${index + 1}`}
                  aria-pressed={index === activeIndex}
                  onClick={() => setActiveIndex(index)}
                  className={`h-1.5 rounded-full transition-all duration-500 ${index === activeIndex ? "w-10 bg-emerald-300" : "w-4 bg-white/40 hover:bg-white/70"}`}
                />
              ))}
            </div>
            <p className="font-medium uppercase tracking-[0.24em]">{statusLabel}</p>
          </div>
        ) : null}
      </div>

      <div
        aria-hidden="true"
        className="absolute bottom-10 right-8 hidden flex-col items-center gap-4 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-white/60 xl:flex"
      >
        <span className="[writing-mode:vertical-rl]">{scrollHintLabel}</span>
        <span className="relative h-16 w-px overflow-hidden bg-white/20">
          <span className="absolute inset-x-0 top-0 h-1/2 animate-[scroll-hint_2.2s_ease-in-out_infinite] bg-emerald-300" />
        </span>
      </div>
    </section>
  );
}
