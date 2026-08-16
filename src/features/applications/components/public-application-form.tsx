"use client";

import { forwardRef, useActionState, useEffect, useImperativeHandle, useRef, useState, type ReactNode, type Ref } from "react";
import { useFormStatus } from "react-dom";
import ReCAPTCHA from "react-google-recaptcha";

import {
  applicationAttachmentFieldNames,
  applicationFormFieldNames,
  initialApplicationSubmissionState,
  requiredApplicationFormFieldNames,
  type ApplicationFormErrorFieldName,
  type ApplicationFormFieldName,
  type ApplicationSubmissionActionState,
} from "@/features/applications/public-application-form-contract";
import { shouldResetCaptchaForFormError } from "@/features/applications/public-application-submission-state";
import { publicCountryOptions, type CountryOption } from "@/features/applications/country-options";
import {
  publicPhoneCountryOptions,
  type PhoneCountryOption,
} from "@/features/applications/phone-country-options";
import {
  SearchableSelect,
  type SearchableSelectOption,
} from "@/features/applications/components/searchable-select";

const textFieldClassName =
  "min-h-12 w-full rounded-2xl border border-white/80 bg-white/88 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

const textAreaClassName =
  "min-h-32 w-full rounded-2xl border border-white/80 bg-white/88 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

const fileFieldClassName =
  "block min-h-12 w-full rounded-2xl border border-white/80 bg-white/88 px-4 py-3 text-sm text-slate-900 file:mr-4 file:rounded-full file:border-0 file:bg-emerald-800 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-emerald-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

const phoneFieldClassName =
  "min-h-12 w-full rounded-2xl border border-white/80 bg-white/88 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

type FieldCopy = {
  label: string;
  placeholder: string;
  description?: string;
};

function RequiredLabel({ label }: { label: string }) {
  return (
    <>
      <span>{label}</span>
      <span aria-hidden="true" className="ml-1 align-super text-[0.65rem] font-semibold text-emerald-700">
        *
      </span>
    </>
  );
}

function renderFieldLabel(label: string, isRequired: boolean) {
  if (!isRequired) {
    return label;
  }

  return <RequiredLabel label={label} />;
}

type PublicApplicationFormCopy = {
  introTitle: string;
  introDescription: string;
  requiredLegend: string;
  requiredFieldWarning?: {
    badge: string;
    title: string;
    description: string;
  };
  privacyNotice: string;
  captchaLabel: string;
  captchaHelp: string;
  captchaExpired: string;
  captchaError: string;
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
    captchaFailed: string;
    submissionFailed: string;
  };
};

type PublicApplicationFormProps = {
  action: (
    state: ApplicationSubmissionActionState,
    payload: FormData,
  ) => Promise<ApplicationSubmissionActionState>;
  copy: PublicApplicationFormCopy;
  recaptchaLanguage: string;
  recaptchaSiteKey: string;
  captchaComponent?: CaptchaComponent;
  stateOverride?: ApplicationSubmissionActionState;
};

type CaptchaUiState = "idle" | "verified" | "expired" | "error";

type CaptchaHandle = {
  reset: () => void;
};

type CaptchaComponentProps = {
  language: string;
  siteKey: string;
  onChange: (value: string | null) => void;
  onExpired: () => void;
  onErrored: () => void;
};

type CaptchaComponent = (
  props: CaptchaComponentProps & {
    ref?: Ref<CaptchaHandle>;
  },
) => ReactNode;

const GoogleRecaptcha = forwardRef<CaptchaHandle, CaptchaComponentProps>(function GoogleRecaptcha(
  { language, siteKey, onChange, onExpired, onErrored },
  ref,
) {
  const googleRecaptchaRef = useRef<ReCAPTCHA | null>(null);

  useImperativeHandle(ref, () => ({
    reset() {
      googleRecaptchaRef.current?.reset();
    },
  }), []);

  return (
    <ReCAPTCHA
      ref={googleRecaptchaRef}
      hl={language}
      onChange={onChange}
      onErrored={onErrored}
      onExpired={onExpired}
      sitekey={siteKey}
    />
  );
});

function SubmitButton({ idleLabel, pendingLabel }: { idleLabel: string; pendingLabel: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-emerald-800 px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_34px_-24px_rgba(6,95,70,0.55)] transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-500 sm:w-auto"
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
        {renderFieldLabel(copy.fields.phone.label, true)}
      </label>

      <div className="grid grid-cols-[max-content_minmax(0,1fr)] items-end gap-3">
        <div>
          <SearchableSelect
            id={dialCodeFieldId}
            name="phoneDialCode"
            label={copy.phoneDialCodeLabel}
            labelClassName="sr-only"
            placeholder={copy.phoneDialCodeLabel}
            value={dialCode}
            options={publicPhoneCountryOptions.map<SearchableSelectOption>((option) => ({
              value: option.dialCode,
              label: formatPhoneCountryOption(option),
              optionLabel: renderPhoneCountryOption(option),
              selectedLabel: formatPhoneCountryTriggerOption(option),
              searchText: `${option.countries.join(" ")} ${option.dialCode}`,
            }))}
            copy={copy.searchableSelect}
            triggerClassName="w-auto max-w-full justify-self-start px-3 py-2 text-sm font-medium"
            panelClassName="right-auto w-[min(22rem,calc(100vw-4rem))] sm:left-auto sm:right-0 sm:min-w-[24rem] sm:w-auto"
            panelPosition="mobile-fixed"
          />
        </div>

        <div className="min-w-0">
          <input
            id={fieldId}
            name="phone"
            type="tel"
            autoComplete="tel"
            defaultValue={value}
            placeholder={copy.fields.phone.placeholder}
            aria-invalid={errorMessage ? true : undefined}
            aria-describedby={errorMessage ? `${fieldId}-error` : undefined}
            className={phoneFieldClassName}
          />
        </div>
      </div>

      {errorMessage ? <p id={`${fieldId}-error`} className="mt-2 text-sm text-rose-600">{errorMessage}</p> : null}
    </div>
  );
}

function formatPhoneCountryOption(option: PhoneCountryOption): string {
  const indicator = option.countries.length > 1 ? "🌐" : option.flag;

  if (option.countries.length === 1) {
    return `${option.name} ${indicator} ${option.dialCode}`;
  }

  const [firstCountry, secondCountry] = option.countries;
  const remainingCountries = option.countries.length - 2;

  if (remainingCountries > 0) {
    return `${firstCountry}, ${secondCountry} +${remainingCountries} ${indicator} ${option.dialCode}`;
  }

  return `${firstCountry}, ${secondCountry} ${indicator} ${option.dialCode}`;
}

function getPhoneCountryIndicator(option: PhoneCountryOption): string {
  return option.countries.length > 1 ? "🌐" : option.flag;
}

function formatPhoneCountryTriggerOption(option: PhoneCountryOption): string {
  return `${getPhoneCountryIndicator(option)} ${option.dialCode}`;
}

function renderPhoneCountryOption(option: PhoneCountryOption): ReactNode {
  return (
    <span className="flex items-center justify-between gap-3 overflow-hidden whitespace-nowrap">
      <span className="truncate text-slate-900">{formatPhoneCountryOptionName(option)}</span>
      <span className="shrink-0 font-medium text-slate-700">{formatPhoneCountryTriggerOption(option)}</span>
    </span>
  );
}

function formatPhoneCountryOptionName(option: PhoneCountryOption): string {
  if (option.countries.length === 1) {
    return option.name;
  }

  const [firstCountry, secondCountry] = option.countries;
  const remainingCountries = option.countries.length - 2;

  if (remainingCountries > 0) {
    return `${firstCountry}, ${secondCountry} +${remainingCountries}`;
  }

  return `${firstCountry}, ${secondCountry}`;
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
        label={renderFieldLabel(copy.fields.nationality.label, true)}
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

function StandardField({
  copy,
  name,
  value,
  errorMessage,
}: {
  copy: PublicApplicationFormCopy;
  name: Exclude<ApplicationFormFieldName, "phone" | "nationality" | "message">;
  value: string;
  errorMessage: string | null;
}) {
  const fieldCopy = copy.fields[name];
  const fieldId = `application-${name}`;
  const isRequired = requiredApplicationFormFieldNames.includes(name);

  return (
    <div>
      <label htmlFor={fieldId} className="mb-2 block text-sm font-semibold text-slate-900">
        {renderFieldLabel(fieldCopy.label, isRequired)}
      </label>
      <input
        id={fieldId}
        name={name}
        type={getInputType(name)}
        autoComplete={getAutoComplete(name)}
        defaultValue={value}
        placeholder={fieldCopy.placeholder}
        aria-invalid={errorMessage ? true : undefined}
        aria-describedby={errorMessage ? `${fieldId}-error` : undefined}
        className={textFieldClassName}
      />
      {errorMessage ? (
        <p id={`${fieldId}-error`} className="mt-2 text-sm text-rose-600">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}

export function PublicApplicationForm({
  action,
  copy,
  recaptchaLanguage,
  recaptchaSiteKey,
  captchaComponent: CaptchaComponent = GoogleRecaptcha,
  stateOverride,
}: PublicApplicationFormProps) {
  const [actionState, formAction] = useActionState(action, initialApplicationSubmissionState);
  const state = stateOverride ?? actionState;
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaUiState, setCaptchaUiState] = useState<CaptchaUiState>("idle");
  const captchaRef = useRef<CaptchaHandle | null>(null);
  const requiredFieldWarningRef = useRef<HTMLElement | null>(null);
  const hadRequiredFieldErrorsRef = useRef(false);
  const primaryFieldNames = applicationFormFieldNames.filter(
    (name): name is Exclude<ApplicationFormFieldName, "message"> => name !== "message",
  );
  const hasRequiredFieldErrors = Object.values(state.fieldErrors).some((code) => code === "required");
  const requiredFieldWarning = hasRequiredFieldErrors ? copy.requiredFieldWarning : undefined;

  useEffect(() => {
    if (!state.resetCaptcha || !shouldResetCaptchaForFormError(state.formError)) {
      return;
    }

    captchaRef.current?.reset();

    const resetTimer = window.setTimeout(() => {
      setCaptchaToken(null);
      setCaptchaUiState("idle");
    }, 0);

    return () => {
      window.clearTimeout(resetTimer);
    };
  }, [state.formError, state.resetCaptcha]);

  useEffect(() => {
    if (!requiredFieldWarning) {
      hadRequiredFieldErrorsRef.current = false;
      return;
    }

    if (hadRequiredFieldErrorsRef.current) {
      return;
    }

    requiredFieldWarningRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    requiredFieldWarningRef.current?.focus({ preventScroll: true });
    hadRequiredFieldErrorsRef.current = true;
  }, [requiredFieldWarning]);

  function handleCaptchaChange(value: string | null) {
    setCaptchaToken(value);
    setCaptchaUiState(value ? "verified" : "idle");
  }

  function handleCaptchaExpired() {
    setCaptchaToken(null);
    setCaptchaUiState("expired");
  }

  function handleCaptchaErrored() {
    setCaptchaToken(null);
    setCaptchaUiState("error");
  }

  function getCaptchaMessage() {
    if (captchaUiState === "expired") {
      return copy.captchaExpired;
    }

    if (captchaUiState === "error") {
      return copy.captchaError;
    }

    return copy.captchaHelp;
  }

  return (
    <div className="surface-soft-strong overflow-hidden rounded-[2rem] border border-white/80 shadow-[0_36px_110px_-44px_rgba(15,23,42,0.3)]">
      <div className="border-b border-emerald-900/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.94)_0%,rgba(248,244,232,0.8)_100%)] px-6 py-6 md:px-8 md:py-7">
        <div className="max-w-3xl space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{copy.introTitle}</h2>
          <p className="text-base leading-7 text-slate-600">{copy.introDescription}</p>
          <div className="inline-flex items-start gap-3 rounded-2xl border border-emerald-900/10 bg-white/88 px-4 py-3 text-sm text-slate-600 shadow-[0_18px_34px_-30px_rgba(6,95,70,0.28)]">
            <span aria-hidden="true" className="text-base font-semibold leading-none text-emerald-700">
              *
            </span>
            <p className="leading-6">{copy.requiredLegend}</p>
          </div>
        </div>
      </div>

      <form action={formAction} className="space-y-6 px-6 py-6 md:px-8 md:py-8">
        {requiredFieldWarning ? (
          <section
            ref={requiredFieldWarningRef}
            tabIndex={-1}
            className="rounded-3xl border border-rose-200/80 bg-[linear-gradient(180deg,rgba(255,241,242,0.96)_0%,rgba(255,228,230,0.88)_100%)] px-5 py-5 shadow-[0_20px_48px_-36px_rgba(190,24,93,0.55)] md:px-6"
          >
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-rose-900">
                {requiredFieldWarning.badge}
              </div>
              <h3 className="text-lg font-semibold tracking-tight text-rose-950">{requiredFieldWarning.title}</h3>
              <p className="text-sm leading-7 text-rose-900/85">{requiredFieldWarning.description}</p>
            </div>
          </section>
        ) : null}

        {state.formError ? (
          <div className="rounded-2xl border border-rose-200/80 bg-rose-50/95 px-4 py-3 text-sm text-rose-700 shadow-[0_14px_36px_-30px_rgba(190,24,93,0.55)]">
            {copy.errors[state.formError]}
          </div>
        ) : null}

        <section className="rounded-[1.75rem] border border-white/80 bg-white/72 p-5 shadow-[0_20px_45px_-38px_rgba(15,23,42,0.16)] md:p-6">
          <div className="grid gap-5 md:grid-cols-2">
            {primaryFieldNames.map((name) => {
              const errorMessage = getValidationMessage(state.fieldErrors[name], copy);

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

              return <StandardField key={name} copy={copy} name={name} value={state.values[name]} errorMessage={errorMessage} />;
            })}
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-white/80 bg-white/68 p-5 shadow-[0_20px_45px_-38px_rgba(15,23,42,0.14)] md:p-6">
          <div className="grid gap-5">
            <div>
              <label htmlFor="application-message" className="mb-2 block text-sm font-semibold text-slate-900">
                {copy.fields.message.label}
              </label>
              {copy.fields.message.description ? (
                <p className="mb-3 text-sm leading-6 text-slate-600">{copy.fields.message.description}</p>
              ) : null}
              <textarea
                id="application-message"
                name="message"
                rows={5}
                defaultValue={state.values.message}
                placeholder={copy.fields.message.placeholder}
                aria-invalid={state.fieldErrors.message ? true : undefined}
                aria-describedby={state.fieldErrors.message ? "application-message-error" : undefined}
                className={textAreaClassName}
              />
              {state.fieldErrors.message ? (
                <p id="application-message-error" className="mt-2 text-sm text-rose-600">
                  {getValidationMessage(state.fieldErrors.message, copy)}
                </p>
              ) : null}
            </div>

            {applicationAttachmentFieldNames.map((name) => {
              const fieldCopy = copy.fields[name];
              const errorMessage = getValidationMessage(state.fieldErrors[name], copy);
              const fieldId = `application-${name}`;

              return (
                <div key={name}>
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
                    accept=".pdf,application/pdf"
                    aria-invalid={errorMessage ? true : undefined}
                    aria-describedby={errorMessage ? `${fieldId}-error` : undefined}
                    className={fileFieldClassName}
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
        </section>

        <section className="rounded-[1.75rem] border border-slate-200/80 bg-white/78 p-5 shadow-[0_20px_45px_-38px_rgba(15,23,42,0.16)] md:p-6">
          <div className="flex flex-col gap-4">
            <p className="text-sm leading-6 text-slate-600">{copy.privacyNotice}</p>
            <div className="space-y-3">
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-900">{copy.captchaLabel}</p>
                <CaptchaComponent
                  ref={captchaRef}
                  language={recaptchaLanguage}
                  onChange={handleCaptchaChange}
                  onErrored={handleCaptchaErrored}
                  onExpired={handleCaptchaExpired}
                  siteKey={recaptchaSiteKey}
                />
                <input type="hidden" name="recaptchaToken" value={captchaToken ?? ""} />
                <p className="mt-3 text-sm leading-6 text-slate-600">{getCaptchaMessage()}</p>
              </div>

              {captchaToken ? <SubmitButton idleLabel={copy.submitLabel} pendingLabel={copy.submittingLabel} /> : null}
            </div>
          </div>
        </section>
      </form>
    </div>
  );
}

export type { PublicApplicationFormCopy };
