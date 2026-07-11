import type { ReactNode } from "react";

type AdminWorkspaceSectionProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  tone?: "default" | "subtle" | "warning";
  className?: string;
  contentClassName?: string;
};

const toneClassName = {
  default: "admin-inner-section",
  subtle: "admin-inner-section admin-inner-section-subtle",
  warning: "admin-inner-section admin-inner-section-warning",
} as const;

export function AdminWorkspaceSection({
  eyebrow,
  title,
  description,
  action,
  children,
  tone = "default",
  className,
  contentClassName,
}: AdminWorkspaceSectionProps) {
  return (
    <section className={[toneClassName[tone], className].filter(Boolean).join(" ")}>
      <div className="flex flex-col gap-4 border-b border-slate-700/70 px-6 py-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-3xl space-y-3">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-200/85">{eyebrow}</p>
          ) : null}
          <div className="space-y-2">
            <h2 className="text-xl font-semibold tracking-tight text-slate-50">{title}</h2>
            {description ? <p className="text-sm leading-7 text-slate-300">{description}</p> : null}
          </div>
        </div>
        {action ? <div className="md:shrink-0">{action}</div> : null}
      </div>

      <div className={["px-6 py-6", contentClassName].filter(Boolean).join(" ")}>{children}</div>
    </section>
  );
}
