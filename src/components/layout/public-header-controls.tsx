"use client";

import { Avatar } from "flowbite-react";

export type PublicHeaderControlsLabels = {
  accountMenuLabel: string;
  accountMenuTitle: string;
  accountMenuDescription: string;
  accountDashboard: string;
  accountSettings: string;
  accountChangePasswordFuture: string;
  accountSignOutFuture: string;
  futureActionBadge: string;
};

type PublicHeaderControlsProps = {
  locale: string;
  labels: PublicHeaderControlsLabels;
};

export function PublicHeaderControls({ locale, labels }: PublicHeaderControlsProps) {
  const adminHref = `/${locale}/admin`;
  const triggerClassName =
    "rounded-full bg-white/35 p-1 transition hover:bg-white/60 focus-visible:bg-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white";

  return (
    <div className="flex w-full flex-wrap items-center justify-end gap-2 text-right">
      <a
        href={adminHref}
        aria-label={labels.accountMenuLabel}
        title={labels.accountMenuLabel}
        className={triggerClassName}
      >
        <Avatar
          rounded
          placeholderInitials="PV"
          alt={labels.accountMenuLabel}
          className="bg-slate-100/90 text-slate-700"
        />
      </a>
    </div>
  );
}
