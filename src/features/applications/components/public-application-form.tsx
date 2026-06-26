"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  applicationFormFieldNames,
  initialApplicationSubmissionState,
  type ApplicationFormFieldName,
  type ApplicationSubmissionActionState,
} from "@/features/applications/public-application-form-contract";

type FieldCopy = {
  label: string;
  placeholder: string;
};

type PublicApplicationFormCopy = {
  introTitle: string;
  introDescription: string;
  requiredLegend: string;
  privacyNotice: string;
  submitLabel: string;
  submittingLabel: string;
  fields: Record<ApplicationFormFieldName, FieldCopy>;
  validation: {
    required: string;
    invalidEmail: string;
    invalidDate: string;
  };
  errors: {
    submissionFailed: string;
  };
};

type PublicApplicationFormProps = {
  action: (
    state: ApplicationSubmissionActionState,
    payload: FormData,
  ) => Promise<ApplicationSubmissionActionState>;
  copy: PublicApplicationFormCopy;
};

function SubmitButton({ idleLabel, pendingLabel }: { idleLabel: string; pendingLabel: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-12 items-center justify-center rounded-full bg-emerald-800 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-500"
    >
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}

function getInputType(name: ApplicationFormFieldName): "email" | "date" | "text" {
  if (name === "email") {
    return "email";
  }

  if (name === "birthDate") {
    return "date";
  }

  return "text";
}

function getAutoComplete(name: ApplicationFormFieldName): string {
  switch (name) {
    case "firstName":
      return "given-name";
    case "lastName":
      return "family-name";
    case "email":
      return "email";
    case "phone":
      return "tel";
    case "nationality":
      return "country-name";
    case "residenceCountry":
      return "country-name";
    case "residenceCity":
      return "address-level2";
    case "birthDate":
      return "bday";
    case "identityDocument":
      return "off";
    case "availability":
      return "off";
    case "message":
      return "off";
    default:
      return "off";
  }
}

function getValidationMessage(
  code: ApplicationSubmissionActionState["fieldErrors"][ApplicationFormFieldName],
  copy: PublicApplicationFormCopy,
) {
  if (!code) {
    return null;
  }

  return copy.validation[code];
}

export function PublicApplicationForm({ action, copy }: PublicApplicationFormProps) {
  const [state, formAction] = useActionState(action, initialApplicationSubmissionState);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <div className="max-w-3xl space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{copy.introTitle}</h2>
        <p className="text-base leading-7 text-slate-600">{copy.introDescription}</p>
        <p className="text-sm font-medium text-slate-500">{copy.requiredLegend}</p>
      </div>

      <form action={formAction} className="mt-8 space-y-6">
        {state.formError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {copy.errors[state.formError]}
          </div>
        ) : null}

        <div className="grid gap-5 md:grid-cols-2">
          {applicationFormFieldNames.map((name) => {
            const fieldCopy = copy.fields[name];
            const errorMessage = getValidationMessage(state.fieldErrors[name], copy);
            const fieldId = `application-${name}`;
            const isTextArea = name === "message";
            const fullWidth = isTextArea || name === "availability";

            return (
              <div key={name} className={fullWidth ? "md:col-span-2" : undefined}>
                <label htmlFor={fieldId} className="mb-2 block text-sm font-semibold text-slate-900">
                  {fieldCopy.label}
                </label>
                {isTextArea ? (
                  <textarea
                    id={fieldId}
                    name={name}
                    rows={5}
                    defaultValue={state.values[name]}
                    placeholder={fieldCopy.placeholder}
                    aria-invalid={errorMessage ? true : undefined}
                    aria-describedby={errorMessage ? `${fieldId}-error` : undefined}
                    className="min-h-32 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                ) : (
                  <input
                    id={fieldId}
                    name={name}
                    type={getInputType(name)}
                    autoComplete={getAutoComplete(name)}
                    defaultValue={state.values[name]}
                    placeholder={fieldCopy.placeholder}
                    aria-invalid={errorMessage ? true : undefined}
                    aria-describedby={errorMessage ? `${fieldId}-error` : undefined}
                    className="min-h-12 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                )}
                {errorMessage ? (
                  <p id={`${fieldId}-error`} className="mt-2 text-sm text-rose-600">
                    {errorMessage}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-4 border-t border-slate-200 pt-6">
          <p className="text-sm leading-6 text-slate-600">{copy.privacyNotice}</p>
          <SubmitButton idleLabel={copy.submitLabel} pendingLabel={copy.submittingLabel} />
        </div>
      </form>
    </div>
  );
}

export type { PublicApplicationFormCopy };
