"use client";

import Image from "next/image";

import { useCallback, useEffect, useId, useRef, useState } from "react";

import type { AdminSession } from "@/lib/admin-session";

type AdminSidebarAccountControlLabels = {
  accountMenuLabel: string;
  accountMenuTitle: string;
  accountMenuDescription: string;
  accountLoginAction: string;
  accountLogoutAction: string;
  sessionActive: string;
};

type AdminSidebarAccountControlProps = {
  loginHref: string;
  logoutHref: string;
  labels: AdminSidebarAccountControlLabels;
  session: AdminSession | null | undefined;
};

type ProfileAvatarProps = {
  className: string;
  fallbackClassName: string;
  imageUrl: string | null | undefined;
  initial: string;
  useUserIcon?: boolean;
};

const POPOVER_EXIT_DURATION_MS = 180;

function UserAvatarIcon({ className }: { className: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 12a4.5 4.5 0 1 0-4.5-4.5A4.5 4.5 0 0 0 12 12Zm0 2.25c-3.76 0-6.75 2.07-6.75 4.5 0 .41.34.75.75.75h12c.41 0 .75-.34.75-.75 0-2.43-2.99-4.5-6.75-4.5Z" />
    </svg>
  );
}

function ProfileAvatar({ className, fallbackClassName, imageUrl, initial, useUserIcon = false }: ProfileAvatarProps) {
  if (imageUrl) {
    return (
      <Image
        alt=""
        aria-hidden="true"
        className={className}
        draggable={false}
        height={48}
        referrerPolicy="no-referrer"
        sizes="48px"
        src={imageUrl}
        width={48}
      />
    );
  }

  if (useUserIcon) {
    return (
      <span aria-hidden="true" className={fallbackClassName}>
        <UserAvatarIcon className="h-6 w-6 text-slate-950" />
      </span>
    );
  }

  return <span aria-hidden="true" className={fallbackClassName}>{initial}</span>;
}

export function AdminSidebarAccountControl({
  loginHref,
  logoutHref,
  labels,
  session,
}: AdminSidebarAccountControlProps) {
  const [popoverState, setPopoverState] = useState<"closed" | "open" | "closing">("closed");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);
  const panelId = useId();
  const titleId = useId();
  const descriptionId = useId();
  const isSignedIn = Boolean(session);
  const isOpen = popoverState === "open";
  const isRendered = popoverState !== "closed";
  const profileLabel = session?.displayName?.trim() || session?.email || "Pura Vida";
  const profileInitial = profileLabel.charAt(0).toUpperCase() || "P";
  const profileName = session?.displayName?.trim() || session?.email;
  const triggerClassName =
    "relative flex h-12 w-12 cursor-pointer select-none items-center justify-center overflow-hidden rounded-full border border-white/80 bg-white/72 text-sm font-semibold tracking-[0.18em] text-slate-700 shadow-[0_16px_38px_-28px_rgba(15,23,42,0.38)] transition duration-150 ease-out hover:border-emerald-200 hover:bg-white hover:text-slate-950 focus-visible:bg-white focus-visible:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent motion-reduce:transition-none";
  const panelClassName =
    "surface-dark-soft-strong absolute right-0 top-[calc(100%+0.875rem)] z-30 w-[min(19.5rem,calc(100vw-2rem))] origin-top-right rounded-[28px] border border-white/85 p-5 text-left shadow-[0_30px_80px_-45px_rgba(15,23,42,0.28)] motion-reduce:animate-none";

  const clearCloseTimeout = useCallback(() => {
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  const closePopover = useCallback(() => {
    if (popoverState === "closed" || popoverState === "closing") {
      return;
    }

    clearCloseTimeout();

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      setPopoverState("closed");
      return;
    }

    setPopoverState("closing");
    closeTimeoutRef.current = window.setTimeout(() => {
      setPopoverState("closed");
      closeTimeoutRef.current = null;
    }, POPOVER_EXIT_DURATION_MS);
  }, [clearCloseTimeout, popoverState]);

  const openPopover = useCallback(() => {
    clearCloseTimeout();
    setPopoverState("open");
  }, [clearCloseTimeout]);

  const togglePopover = useCallback(() => {
    if (isOpen) {
      closePopover();
      return;
    }

    openPopover();
  }, [closePopover, isOpen, openPopover]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        closePopover();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closePopover();
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closePopover, isOpen]);

  useEffect(() => {
    return () => {
      clearCloseTimeout();
    };
  }, [clearCloseTimeout]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        aria-controls={panelId}
        aria-expanded={isOpen}
        aria-label={labels.accountMenuLabel}
        title={labels.accountMenuLabel}
        className={triggerClassName}
        onClick={togglePopover}
      >
        <ProfileAvatar
          className="block h-full w-full object-cover"
          fallbackClassName="inline-flex h-full w-full items-center justify-center"
          imageUrl={session?.imageUrl}
          initial={profileInitial}
          useUserIcon={!isSignedIn}
        />
        {isSignedIn ? (
          <span className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
        ) : null}
      </button>

      {isRendered ? (
        <div
          id={panelId}
          aria-hidden={!isOpen}
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          inert={!isOpen}
          className={`${panelClassName} ${
            isOpen
              ? "pointer-events-auto opacity-100 [animation:account-control-popover-in_160ms_ease-out]"
              : "pointer-events-none opacity-0 [animation:account-control-popover-out_180ms_ease-in_forwards]"
          }`}
        >
          <span
            aria-hidden="true"
            className="absolute -top-2 right-4 h-4 w-4 rotate-45 rounded-[0.35rem] border-l border-t border-white/85 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(246,251,247,0.92))]"
          />
          <div className="mb-4 h-px w-16 bg-gradient-to-r from-emerald-700/70 to-transparent" />
          <p id={titleId} className="text-sm font-semibold text-slate-950">{labels.accountMenuTitle}</p>
          <p id={descriptionId} className="mt-2 text-sm leading-6 text-slate-600">{labels.accountMenuDescription}</p>

          {isSignedIn ? (
            <div className="mt-4 space-y-4">
              <div className="rounded-3xl border border-emerald-200/80 bg-emerald-50/80 p-4 text-emerald-950 shadow-[0_18px_42px_-34px_rgba(5,150,105,0.4)]">
                <div className="flex items-center gap-3">
                  <ProfileAvatar
                    className="block h-12 w-12 rounded-full border border-white/80 object-cover shadow-sm"
                    fallbackClassName="flex h-12 w-12 items-center justify-center rounded-full border border-white/80 bg-white/80 text-sm font-semibold uppercase text-emerald-900 shadow-sm"
                    imageUrl={session?.imageUrl}
                    initial={profileInitial}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-emerald-950">{profileName}</p>
                    <p className="mt-1 break-all text-xs text-emerald-900/80">{session?.email}</p>
                  </div>
                </div>
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-emerald-950">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  {labels.sessionActive}
                </div>
              </div>
              <form action={logoutHref} method="post">
                <button
                  type="submit"
                  tabIndex={isOpen ? undefined : -1}
                  className="admin-danger-action inline-flex min-h-11 w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition"
                >
                  {labels.accountLogoutAction}
                </button>
              </form>
            </div>
          ) : (
            <a
              href={loginHref}
              tabIndex={isOpen ? undefined : -1}
              className="admin-primary-action mt-4 inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition"
            >
              {labels.accountLoginAction}
            </a>
          )}
        </div>
      ) : null}

      <style jsx>{`
        @keyframes account-control-popover-in {
          from {
            opacity: 0;
            transform: translateY(0.5rem) scale(0.98);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes account-control-popover-out {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
          }

          to {
            opacity: 0;
            transform: translateY(0.35rem) scale(0.985);
          }
        }
      `}</style>
    </div>
  );
}
