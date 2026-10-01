// Windows no dibuja los emojis de banderas (muestra solo las letras del país), así que se
// muestran como imagen SVG. El código ISO se obtiene de los dos "regional indicators" del emoji.
const REGIONAL_INDICATOR_A = 0x1f1e6;

export function getCountryCodeFromFlag(flag: string): string {
  return [...flag]
    .map((character) => String.fromCharCode((character.codePointAt(0) ?? 0) - REGIONAL_INDICATOR_A + 97))
    .join("");
}

export function CountryFlag({ flag }: { flag: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- SVG diminuto de un CDN externo; next/image no aporta nada.
    <img
      src={`https://flagcdn.com/${getCountryCodeFromFlag(flag)}.svg`}
      alt=""
      aria-hidden="true"
      width={20}
      height={15}
      loading="lazy"
      decoding="async"
      className="inline-block h-[0.9375rem] w-5 shrink-0 rounded-[2px] object-cover shadow-[0_0_0_1px_rgba(15,23,42,0.12)]"
    />
  );
}

/** Ícono para prefijos compartidos por varios países (+1, +7, ...). */
export function MultiCountryIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-5 shrink-0 text-emerald-700"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.7 3.75 5.7 3.75 9S14.5 18.3 12 21M12 3C9.5 5.7 8.25 8.7 8.25 12S9.5 18.3 12 21" />
    </svg>
  );
}
