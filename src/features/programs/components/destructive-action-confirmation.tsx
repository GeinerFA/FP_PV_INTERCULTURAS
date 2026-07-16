"use client";

import { useId, useState, type ComponentProps } from "react";

type DestructiveActionConfirmationProps = {
  title: string;
  description: string;
  warning: string;
  triggerLabel: string;
  confirmLabel: string;
  cancelLabel: string;
  confirmValue: string;
  confirmName?: string;
  formId?: string;
  formAction?: ComponentProps<"button">["formAction"];
  tone?: "warning" | "danger";
  className?: string;
};

const triggerClassName = {
  warning: "admin-warning-action",
  danger: "admin-danger-action",
} as const;

const panelClassName = {
  warning: "admin-destructive-confirmation admin-destructive-confirmation-warning",
  danger: "admin-destructive-confirmation admin-destructive-confirmation-danger",
} as const;

export function DestructiveActionConfirmation({
  title,
  description,
  warning,
  triggerLabel,
  confirmLabel,
  cancelLabel,
  confirmValue,
  confirmName = "destructiveIntent",
  formId,
  formAction,
  tone = "warning",
  className,
}: DestructiveActionConfirmationProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hiddenFieldId = useId();

  const resetIntentFields = (form: HTMLFormElement | null) => {
    if (!form) {
      return;
    }

    form.querySelectorAll<HTMLInputElement>("[data-destructive-intent-field]").forEach((field) => {
      field.value = "";
      field.disabled = true;
    });
  };

  if (!isExpanded) {
    return (
      <button
        type="button"
        form={formId}
        className={[
          triggerClassName[tone],
          className,
          "inline-flex items-center justify-center rounded-full px-4 py-2.5 text-[0.8125rem] font-semibold transition",
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={() => setIsExpanded(true)}
      >
        {triggerLabel}
      </button>
    );
  }

  return (
    <div
      className={[panelClassName[tone], className, "space-y-3 rounded-[24px] p-4 text-sm"]
        .filter(Boolean)
        .join(" ")}
      role="alert"
    >
      <input
        id={hiddenFieldId}
        type="hidden"
        name={confirmName}
        value=""
        disabled
        form={formId}
        data-destructive-intent-field="true"
      />
      <div className="space-y-1.5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em]">{title}</p>
        <p className="font-medium text-slate-950">{description}</p>
      </div>
      <p className="text-xs leading-6 text-slate-700">{warning}</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="submit"
          form={formId}
          formAction={formAction}
          className="admin-danger-action inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold transition"
          onClick={(event) => {
            const form = event.currentTarget.form;

            if (!form) {
              return;
            }

            resetIntentFields(form);

            const hiddenField = form.querySelector<HTMLInputElement>(`#${CSS.escape(hiddenFieldId)}`);

            if (hiddenField) {
              hiddenField.disabled = false;
              hiddenField.value = confirmValue;
            }
          }}
        >
          {confirmLabel}
        </button>
        <button
          type="button"
          form={formId}
          className="admin-outline-action inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold transition"
          onClick={(event) => {
            const form = event.currentTarget.form;

            if (form) {
              const hiddenField = form.querySelector<HTMLInputElement>(`#${CSS.escape(hiddenFieldId)}`);

              if (hiddenField) {
                hiddenField.value = "";
                hiddenField.disabled = true;
              }
            }

            setIsExpanded(false);
          }}
        >
          {cancelLabel}
        </button>
      </div>
    </div>
  );
}
