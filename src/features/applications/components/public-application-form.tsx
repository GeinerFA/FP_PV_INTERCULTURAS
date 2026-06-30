"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  applicationAttachmentFieldNames,
  applicationFormFieldNames,
  initialApplicationSubmissionState,
  type ApplicationFormErrorFieldName,
  type ApplicationFormFieldName,
  type ApplicationSubmissionActionState,
} from "@/features/applications/public-application-form-contract";
import { publicCountryOptions, type CountryOption } from "@/features/applications/country-options";
import {
  publicPhoneCountryOptions,
  type PhoneCountryOption,
} from "@/features/applications/phone-country-options";
import {
  SearchableSelect,
  type SearchableSelectOption,
} from "@/features/applications/components/searchable-select";

type FieldCopy = {
  label: string;
  placeholder: string;
  description?: string;
};

type PublicApplicationFormCopy = {
  introTitle: string;
  introDescription: string;
  requiredLegend: string;
  privacyNotice: string;
  submitLabel: string;
  submittingLabel: string;
  phoneDialCodeLabel: string;
  searchableSelect: {
    searchPlaceholder: string;
    noResults: string;
  };
  fields: Record<ApplicationFormFieldName | (typeof applicationAttachmentFieldNames)[number], FieldCopy>;
  validation: {
    required: string;
    invalidEmail: string;
    invalidDate: string;
    invalidSelection: string;
    invalidFileType: string;
    fileTooLarge: string;
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
    case "birthDate":
      return "bday";
    case "message":
      return "off";
    default:
      return "off";
  }
}

function PhoneField({
  copy,
  value,
  dialCode,
  errorMessage,
}: {
  copy: PublicApplicationFormCopy;
  value: string;
  dialCode: string;
  errorMessage: string | null;
}) {
  const fieldId = "application-phone";
  const dialCodeFieldId = "application-phoneDialCode";

  return (
    <div>
      <label htmlFor={fieldId} className="mb-2 block text-sm font-semibold text-slate-900">
        {copy.fields.phone.label}
      </label>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,220px)_minmax(0,1fr)]">
        <SearchableSelect
          id={dialCodeFieldId}
          name="phoneDialCode"
          label={copy.phoneDialCodeLabel}
          placeholder={copy.phoneDialCodeLabel}
          value={dialCode}
          options={publicPhoneCountryOptions.map<SearchableSelectOption>((option) => ({
            value: option.dialCode,
            label: formatPhoneCountryOption(option),
            searchText: `${option.countries.join(" ")} ${option.dialCode}`,
          }))}
          copy={copy.searchableSelect}
        />

        <input
          id={fieldId}
          name="phone"
          type="tel"
          autoComplete="tel"
          defaultValue={value}
          placeholder={copy.fields.phone.placeholder}
          aria-invalid={errorMessage ? true : undefined}
          aria-describedby={errorMessage ? `${fieldId}-error` : undefined}
          className="min-h-12 w-full rounded-2xl border border-white/75 bg-white/80 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
      </div>

      {errorMessage ? <p id={`${fieldId}-error`} className="mt-2 text-sm text-rose-600">{errorMessage}</p> : null}
    </div>
  );
}

function formatPhoneCountryOption(option: PhoneCountryOption): string {
  if (option.countries.length === 1) {
    return `${option.flag} ${option.name} (${option.dialCode})`;
  }

  const [firstCountry, secondCountry] = option.countries;
  const remainingCountries = option.countries.length - 2;

  if (remainingCountries > 0) {
    return `${option.flag} ${option.dialCode} · ${firstCountry}, ${secondCountry} +${remainingCountries}`;
  }

  return `${option.flag} ${option.dialCode} · ${firstCountry}, ${secondCountry}`;
}

function formatCountryOption(option: CountryOption): string {
  return `${option.flag} ${option.name}`;
}

function CountryField({
  copy,
  value,
  errorMessage,
}: {
  copy: PublicApplicationFormCopy;
  value: string;
  errorMessage: string | null;
}) {
  const fieldId = "application-nationality";

  return (
    <div>
      <SearchableSelect
        id={fieldId}
        name="nationality"
        label={copy.fields.nationality.label}
        placeholder={copy.fields.nationality.placeholder}
        value={value}
        autoComplete="country-name"
        options={publicCountryOptions.map<SearchableSelectOption>((option) => ({
          value: option.name,
          label: formatCountryOption(option),
          searchText: option.name,
        }))}
        copy={copy.searchableSelect}
        errorMessage={errorMessage}
      />
    </div>
  );
}

function getValidationMessage(
  code: ApplicationSubmissionActionState["fieldErrors"][ApplicationFormErrorFieldName],
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
    <div className="surface-soft rounded-3xl p-6 md:p-8">
      <div className="max-w-3xl space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{copy.introTitle}</h2>
        <p className="text-base leading-7 text-slate-600">{copy.introDescription}</p>
        <p className="text-sm font-medium text-slate-500">{copy.requiredLegend}</p>
      </div>

      <form action={formAction} className="mt-8 space-y-6">
        {state.formError ? (
          <div className="rounded-2xl border border-rose-200/80 bg-rose-50/95 px-4 py-3 text-sm text-rose-700 shadow-[0_14px_36px_-30px_rgba(190,24,93,0.55)]">
            {copy.errors[state.formError]}
          </div>
        ) : null}

        <div className="grid gap-5 md:grid-cols-2">
          {applicationFormFieldNames.map((name) => {
            const fieldCopy = copy.fields[name];
            const errorMessage = getValidationMessage(state.fieldErrors[name], copy);
            const fieldId = `application-${name}`;
            const isTextArea = name === "message";
            const fullWidth = isTextArea;

            if (name === "phone") {
              return (
                <PhoneField
                  key={name}
                  copy={copy}
                  value={state.values.phone}
                  dialCode={state.values.phoneDialCode}
                  errorMessage={errorMessage}
                />
              );
            }

            if (name === "nationality") {
              return (
                <CountryField
                  key={name}
                  copy={copy}
                  value={state.values.nationality}
                  errorMessage={errorMessage}
                />
              );
            }

            return (
              <div key={name} className={fullWidth ? "md:col-span-2" : undefined}>
                <label htmlFor={fieldId} className="mb-2 block text-sm font-semibold text-slate-900">
                  {fieldCopy.label}
                </label>
                {fieldCopy.description ? (
                  <p className="mb-3 text-sm leading-6 text-slate-600">{fieldCopy.description}</p>
                ) : null}
                {isTextArea ? (
                  <textarea
                    id={fieldId}
                    name={name}
                    rows={5}
                    defaultValue={state.values[name]}
                    placeholder={fieldCopy.placeholder}
                    aria-invalid={errorMessage ? true : undefined}
                    aria-describedby={errorMessage ? `${fieldId}-error` : undefined}
                    className="min-h-32 w-full rounded-2xl border border-white/75 bg-white/80 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
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
                    className="min-h-12 w-full rounded-2xl border border-white/75 bg-white/80 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
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

          {applicationAttachmentFieldNames.map((name) => {
            const fieldCopy = copy.fields[name];
            const errorMessage = getValidationMessage(state.fieldErrors[name], copy);
            const fieldId = `application-${name}`;

            return (
              <div key={name} className="md:col-span-2">
                <label htmlFor={fieldId} className="mb-2 block text-sm font-semibold text-slate-900">
                  {fieldCopy.label}
                </label>
                {fieldCopy.description ? (
                  <p className="mb-3 text-sm leading-6 text-slate-600">{fieldCopy.description}</p>
                ) : null}
                <input
                  id={fieldId}
                  name={name}
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  aria-invalid={errorMessage ? true : undefined}
                  aria-describedby={errorMessage ? `${fieldId}-error` : undefined}
                  className="block min-h-12 w-full rounded-2xl border border-white/75 bg-white/80 px-4 py-3 text-sm text-slate-900 file:mr-4 file:rounded-full file:border-0 file:bg-emerald-800 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-emerald-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
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
