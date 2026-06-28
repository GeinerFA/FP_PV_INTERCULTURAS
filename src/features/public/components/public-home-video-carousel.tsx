"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type CarouselSlide = {
  src: string;
  alt: string;
};

type PublicHomeVideoCarouselProps = {
  slides: CarouselSlide[];
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
}: PublicHomeVideoCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);

  const hasMultipleSlides = slides.length > 1;

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
    if (prefersReducedMotion || !hasMultipleSlides) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % slides.length);
    }, AUTOPLAY_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [hasMultipleSlides, prefersReducedMotion, slides.length]);

  const statusLabel = useMemo(
    () => `${activeIndex + 1} / ${slides.length}`,
    [activeIndex, slides.length],
  );

  return (
    <section className="animate-fade-up relative left-1/2 isolate w-screen -translate-x-1/2 overflow-hidden bg-slate-950 text-white shadow-[0_30px_80px_-40px_rgba(15,23,42,0.9)]">
      <div className="absolute inset-0">
        {slides.map((slide, index) => (
          <div
            key={slide.src}
            className={`absolute inset-0 transition-opacity duration-700 ${index === activeIndex ? "opacity-100" : "opacity-0"}`}
          >
            <video
              ref={(node) => {
                videoRefs.current[index] = node;
              }}
              aria-hidden="true"
              className="h-full w-full object-cover"
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
              {slide.alt}
            </video>
          </div>
        ))}
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(2,6,23,0.82)_0%,rgba(15,23,42,0.45)_45%,rgba(6,78,59,0.52)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.22),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(251,191,36,0.16),transparent_30%)]" />
      </div>

      <div className="relative flex min-h-[22rem] flex-col justify-end px-6 py-6 sm:px-8 md:min-h-[30rem] md:px-10 md:py-8 lg:min-h-[38rem] lg:px-14 lg:py-10">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 border-t border-white/15 pt-5 text-sm text-slate-200">
          <div className="flex items-center gap-3 rounded-full bg-slate-950/30 px-4 py-3 backdrop-blur-sm">
            {slides.map((slide, index) => (
              <button
                key={slide.src}
                type="button"
                aria-label={`Mostrar video ${index + 1}`}
                aria-pressed={index === activeIndex}
                onClick={() => setActiveIndex(index)}
                className={`h-2.5 rounded-full transition-all ${index === activeIndex ? "w-10 bg-emerald-300" : "w-2.5 bg-white/45 hover:bg-white/70"}`}
              />
            ))}
          </div>
          <p className="rounded-full bg-slate-950/30 px-4 py-3 font-medium uppercase tracking-[0.18em] text-white/80 backdrop-blur-sm">
            {statusLabel}
          </p>
        </div>
      </div>
    </section>
  );
}
