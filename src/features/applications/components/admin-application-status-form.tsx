"use client";

import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";
import { createPortal, useFormStatus } from "react-dom";

import type { ApplicationStatus } from "@/types/application";

type NotificationTemplateCopy = {
  subject: string;
  message: string;
};

export type AdminApplicationStatusFormCopy = {
  selectLabel: string;
  submitLabel: string;
  submittingLabel: string;
  notificationDecisionRequired: string;
  statuses: Record<ApplicationStatus, string>;
  modal: {
    badge: string;
    title: string;
    description: string;
    subjectLabel: string;
    messageLabel: string;
    cancelLabel: string;
    sendAndSaveLabel: string;
    skipAndSaveLabel: string;
  };
  templates: Record<Exclude<ApplicationStatus, "pending">, NotificationTemplateCopy>;
};

type AdminApplicationStatusFormProps = {
  currentStatus: ApplicationStatus;
  updateAction: (formData: FormData) => Promise<void>;
  copy: AdminApplicationStatusFormCopy;
};

function SubmitButton({ idleLabel, pendingLabel }: { idleLabel: string; pendingLabel: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="admin-primary-action inline-flex rounded-full px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}

export function AdminApplicationStatusForm({
  currentStatus,
  updateAction,
  copy,
}: AdminApplicationStatusFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const lastActiveElementRef = useRef<HTMLElement | null>(null);
  const notificationIntentRef = useRef<HTMLInputElement>(null);
  const notificationSubjectRef = useRef<HTMLInputElement>(null);
  const notificationMessageRef = useRef<HTMLTextAreaElement>(null);
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus>(currentStatus);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const dialogTitleId = useId();
  const dialogDescriptionId = useId();

  const activeTemplate = useMemo(() => {
    if (selectedStatus === "pending") {
      return null;
    }

    return copy.templates[selectedStatus];
  }, [copy.templates, selectedStatus]);
  const initialTemplate = currentStatus === "pending" ? null : copy.templates[currentStatus];
  const [notificationSubject, setNotificationSubject] = useState(initialTemplate?.subject ?? "");
  const [notificationMessage, setNotificationMessage] = useState(initialTemplate?.message ?? "");

  const requiresNotificationDecision = currentStatus === "pending" && selectedStatus === "in_process";
  const canSendNotification =
    notificationSubject.trim().length > 0 && notificationMessage.trim().length > 0;

  function closeModal(): void {
    setIsModalOpen(false);
  }

  useEffect(() => {
    if (!isModalOpen) {
      lastActiveElementRef.current?.focus();
      return;
    }

    lastActiveElementRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const getFocusableElements = () =>
      Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => !element.hasAttribute("hidden") && element.getAttribute("aria-hidden") !== "true");

    const focusableElements = getFocusableElements();
    const initialFocusTarget = focusableElements.find((element) => element.id === "notification-subject") ?? focusableElements[0];
    initialFocusTarget?.focus();

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        event.preventDefault();
        closeModal();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const currentFocusableElements = getFocusableElements();

      if (currentFocusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = currentFocusableElements[0];
      const lastElement = currentFocusableElements[currentFocusableElements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    dialog.addEventListener("keydown", handleKeyDown);

    return () => {
      dialog.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isModalOpen]);

  function resetNotificationIntent(): void {
    if (notificationIntentRef.current) {
      notificationIntentRef.current.value = "none";
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    if (!requiresNotificationDecision) {
      resetNotificationIntent();
      return;
    }

    const notificationIntent = notificationIntentRef.current?.value ?? "none";

    if (notificationIntent !== "send" && notificationIntent !== "skip") {
      event.preventDefault();
      setIsModalOpen(true);
    }
  }

  function submitWithDecision(intent: "send" | "skip"): void {
    if (!formRef.current || !notificationIntentRef.current || !notificationSubjectRef.current || !notificationMessageRef.current) {
      return;
    }

    notificationIntentRef.current.value = intent;
    notificationSubjectRef.current.value = notificationSubject;
    notificationMessageRef.current.value = notificationMessage;
    setIsModalOpen(false);
    formRef.current.requestSubmit();
  }

  return (
    <>
      <form ref={formRef} action={updateAction} className="space-y-4" onSubmit={handleSubmit}>
        <input ref={notificationIntentRef} type="hidden" name="notificationIntent" defaultValue="none" />
        <input
          ref={notificationSubjectRef}
          type="hidden"
          name="notificationSubject"
          value={notificationSubject}
          readOnly
        />
        <textarea
          ref={notificationMessageRef}
          name="notificationMessage"
          value={notificationMessage}
          readOnly
          hidden
        />

        <div>
          <label htmlFor="status" className="block text-sm font-semibold text-slate-950">
            {copy.selectLabel}
          </label>
          <select
            id="status"
            name="status"
            value={selectedStatus}
            onChange={(event) => {
              const nextStatus = event.currentTarget.value as ApplicationStatus;

              setSelectedStatus(nextStatus);

              if (nextStatus === "pending") {
                setNotificationSubject("");
                setNotificationMessage("");
              } else {
                const template = copy.templates[nextStatus];

                setNotificationSubject(template.subject);
                setNotificationMessage(template.message);
              }

              resetNotificationIntent();
              setIsModalOpen(false);
            }}
            className="admin-inner-input mt-2 min-h-12 w-full rounded-2xl px-4 py-3 text-sm outline-none transition"
          >
            {Object.entries(copy.statuses).map(([status, label]) => (
              <option key={status} value={status}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {requiresNotificationDecision ? (
          <p className="text-xs leading-6 text-slate-500">{copy.notificationDecisionRequired}</p>
        ) : null}

        <SubmitButton idleLabel={copy.submitLabel} pendingLabel={copy.submittingLabel} />
      </form>

        {typeof document !== "undefined" && isModalOpen && activeTemplate
          ? createPortal(
              <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/55 px-4 py-6 sm:px-6 sm:py-10">
                <div className="flex min-h-full items-center justify-center">
                  <div
                    ref={dialogRef}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={dialogTitleId}
                    aria-describedby={dialogDescriptionId}
                    className="surface-soft-strong mx-auto w-full max-w-3xl overflow-hidden rounded-[32px] border border-white/80 shadow-[0_36px_110px_-44px_rgba(15,23,42,0.42)]"
                  >
                    <div className="border-b border-emerald-900/8 bg-gradient-to-r from-emerald-50/80 via-white/90 to-amber-50/60 px-6 py-5 sm:px-8 sm:py-6">
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-800/85">{copy.modal.badge}</p>
                        <h3 id={dialogTitleId} className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-[1.75rem]">
                          {copy.modal.title}
                        </h3>
                        <p id={dialogDescriptionId} className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-[0.95rem]">
                          {copy.modal.description}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-5 px-6 py-6 sm:px-8 sm:py-7">
                      <div>
                        <label htmlFor="notification-subject" className="block text-sm font-semibold text-slate-950">
                          {copy.modal.subjectLabel}
                        </label>
                        <input
                          id="notification-subject"
                          value={notificationSubject}
                          onChange={(event) => setNotificationSubject(event.currentTarget.value)}
                          className="admin-inner-input mt-2 min-h-12 w-full rounded-2xl px-4 py-3 text-sm outline-none transition"
                        />
                      </div>

                      <div>
                        <label htmlFor="notification-message" className="block text-sm font-semibold text-slate-950">
                          {copy.modal.messageLabel}
                        </label>
                        <textarea
                          id="notification-message"
                          value={notificationMessage}
                          onChange={(event) => setNotificationMessage(event.currentTarget.value)}
                          rows={9}
                          className="admin-inner-input mt-2 w-full rounded-2xl px-4 py-3 text-sm outline-none transition"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 border-t border-emerald-900/8 bg-white/55 px-6 py-5 sm:flex-row sm:justify-end sm:px-8">
                      <button
                        type="button"
                        className="admin-outline-action inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition"
                        onClick={() => {
                          resetNotificationIntent();
                          closeModal();
                        }}
                      >
                        {copy.modal.cancelLabel}
                      </button>
                      <button
                        type="button"
                        className="admin-secondary-action inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition"
                        onClick={() => submitWithDecision("skip")}
                      >
                        {copy.modal.skipAndSaveLabel}
                      </button>
                      <button
                        type="button"
                        disabled={!canSendNotification}
                        className="admin-primary-action inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70"
                        onClick={() => submitWithDecision("send")}
                      >
                        {copy.modal.sendAndSaveLabel}
                      </button>
                    </div>
                  </div>
                </div>
              </div>,
              document.body,
            )
          : null}
     </>
   );
}
