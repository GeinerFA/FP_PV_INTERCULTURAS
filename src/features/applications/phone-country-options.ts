import { publicCountryOptions, type CountryOption } from "@/features/applications/country-options";

export type PhoneCountryOption = CountryOption & {
  countries: string[];
};

export const defaultPublicPhoneDialCode = "+506";

export const publicPhoneCountryOptions: PhoneCountryOption[] = Array.from(
  publicCountryOptions.reduce(
    (optionsByDialCode, option) => {
      const existingOption = optionsByDialCode.get(option.dialCode);

      if (existingOption) {
        existingOption.countries.push(option.name);
        return optionsByDialCode;
      }

      optionsByDialCode.set(option.dialCode, {
        ...option,
        countries: [option.name],
      });

      return optionsByDialCode;
    },
    new Map<string, PhoneCountryOption>(),
  ).values(),
);

const supportedDialCodes = new Set(publicPhoneCountryOptions.map((option) => option.dialCode));

export function isSupportedPhoneDialCode(value: string): boolean {
  return supportedDialCodes.has(value);
}

export function normalizePhoneNumber(phoneDialCode: string, phoneNumber: string): string {
  const dialCode = isSupportedPhoneDialCode(phoneDialCode)
    ? phoneDialCode
    : defaultPublicPhoneDialCode;
  const normalizedPhoneNumber = phoneNumber
    .trim()
    .replace(/^\+/, "")
    .replace(/\s+/g, " ");

  return [dialCode, normalizedPhoneNumber].filter((value) => value.length > 0).join(" ").trim();
}
