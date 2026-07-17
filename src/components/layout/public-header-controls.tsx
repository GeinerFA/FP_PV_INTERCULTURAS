import Image from "next/image";

import type { AdminSession } from "@/lib/admin-session";

export type PublicHeaderControlsLabels = {
  accountMenuLabel: string;
  accountMenuTitle: string;
  accountMenuDescription: string;
  accountLoginAction: string;
  accountSignedInHint: string;
  accountAdminAction: string;
  accountLogoutAction: string;
};

type PublicHeaderControlsProps = {
  adminHref: string;
  loginHref: string;
  logoutHref: string;
  labels: PublicHeaderControlsLabels;
  session: AdminSession | null;
};

type ProfileAvatarProps = {
  className: string;
  fallbackClassName: string;
  imageUrl: string | null | undefined;
  initial: string;
};

function ProfileAvatar({ className, fallbackClassName, imageUrl, initial }: ProfileAvatarProps) {
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

  return <span aria-hidden="true" className={fallbackClassName}>{initial}</span>;
}

export function PublicHeaderControls({
  adminHref,
  loginHref,
  logoutHref,
  labels,
  session,
}: PublicHeaderControlsProps) {
  const isSignedIn = Boolean(session);
  const profileLabel = session?.displayName?.trim() || session?.email || "PV";
  const profileInitial = profileLabel.charAt(0).toUpperCase() || "P";
  const profileName = session?.displayName?.trim() || session?.email;
  const triggerClassName =
    "flex h-12 w-12 cursor-pointer list-none select-none items-center justify-center overflow-hidden rounded-full border border-white/80 bg-white/70 text-sm font-semibold tracking-[0.18em] text-slate-700 shadow-[0_16px_38px_-28px_rgba(15,23,42,0.38)] transition hover:border-emerald-200 hover:bg-white hover:text-slate-950 focus-visible:bg-white focus-visible:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white [&::-webkit-details-marker]:hidden";
  const panelClassName =
    "surface-dark-soft-strong pointer-events-none absolute right-0 top-[calc(100%+0.75rem)] z-30 w-[min(22rem,calc(100vw-2rem))] translate-y-2 rounded-[28px] p-5 text-left opacity-0 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.28)] transition duration-150 ease-out group-open:pointer-events-auto group-open:translate-y-0 group-open:opacity-100 md:group-hover:pointer-events-auto md:group-hover:translate-y-0 md:group-hover:opacity-100 md:group-focus-within:pointer-events-auto md:group-focus-within:translate-y-0 md:group-focus-within:opacity-100";

  return (
    <div className="flex w-full items-center justify-end gap-2 text-right md:w-auto">
      <details className="group relative shrink-0">
        <summary aria-label={labels.accountMenuLabel} title={labels.accountMenuLabel} className={triggerClassName}>
          <ProfileAvatar
            className="block h-full w-full object-cover"
            fallbackClassName="inline-flex h-full w-full items-center justify-center"
            imageUrl={session?.imageUrl}
            initial={isSignedIn ? profileInitial : "PV"}
          />
        </summary>

        <div className={panelClassName}>
          <div className="mb-4 h-px w-16 bg-gradient-to-r from-emerald-700/70 to-transparent" />
          <p className="text-sm font-semibold text-slate-950">{labels.accountMenuTitle}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{labels.accountMenuDescription}</p>

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
                <p className="mt-3 text-sm font-medium text-emerald-900">{labels.accountSignedInHint}</p>
              </div>
              <form action={logoutHref} method="post">
                <button
                  type="submit"
                  className="admin-danger-action inline-flex min-h-11 w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition"
                >
                  {labels.accountLogoutAction}
                </button>
              </form>
            </div>
          ) : (
            <a
              href={loginHref}
              className="admin-primary-action mt-4 inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition"
            >
              {labels.accountLoginAction}
            </a>
          )}
        </div>
      </details>

      {isSignedIn ? (
        <a
          href={adminHref}
          className="admin-secondary-action inline-flex min-h-12 shrink-0 items-center justify-center whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold transition md:px-5"
        >
          {labels.accountAdminAction}
        </a>
      ) : null}
    </div>
  );
}
