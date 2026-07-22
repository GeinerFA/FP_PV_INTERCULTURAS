"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type AdminBackButtonProps = {
  locale: string;
  label: string;
};

const previousAdminPathStorageKey = "fp-pv-interculturas.admin.previous-path";
const currentAdminPathStorageKey = "fp-pv-interculturas.admin.current-path";

function readStoredPath(key: string) {
  if (typeof window === "undefined") {
    return null;
  }

  return window.sessionStorage.getItem(key);
}

function getSafeReferrerPath() {
  if (typeof window === "undefined" || document.referrer.length === 0) {
    return null;
  }

  try {
    const referrerUrl = new URL(document.referrer);

    if (referrerUrl.origin !== window.location.origin) {
      return null;
    }

    return `${referrerUrl.pathname}${referrerUrl.search}${referrerUrl.hash}`;
  } catch {
    return null;
  }
}

export function AdminBackButton({ locale, label }: AdminBackButtonProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const currentRoute = search.length > 0 ? `${pathname}?${search}` : pathname;
  const fallbackHref = pathname === `/${locale}/admin/login` ? `/${locale}` : `/${locale}/admin`;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedCurrentPath = window.sessionStorage.getItem(currentAdminPathStorageKey);

    if (storedCurrentPath && storedCurrentPath !== currentRoute) {
      window.sessionStorage.setItem(previousAdminPathStorageKey, storedCurrentPath);
    }

    window.sessionStorage.setItem(currentAdminPathStorageKey, currentRoute);
  }, [currentRoute]);

  const handleClick = () => {
    const previousAdminPath = readStoredPath(previousAdminPathStorageKey);
    const safeReferrerPath = getSafeReferrerPath();
    const canUseBrowserBack = window.history.length > 1;
    const hasTrackedAdminHistory = previousAdminPath !== null && previousAdminPath !== currentRoute;
    const hasSafeReferrerHistory = safeReferrerPath !== null && safeReferrerPath !== currentRoute;

    if (canUseBrowserBack && (hasTrackedAdminHistory || hasSafeReferrerHistory)) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label}
      title={label}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-emerald-900/10 bg-white/72 text-slate-700 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.28)] transition hover:border-emerald-600/30 hover:bg-emerald-50 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus-visible:ring-offset-[#eef8f1]"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <path d="M15.75 4.5L8.25 12l7.5 7.5" />
        <path d="M8.75 12h11" />
      </svg>
      <span className="sr-only">{label}</span>
    </button>
  );
}
