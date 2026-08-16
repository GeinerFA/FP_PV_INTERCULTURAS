import assert from "node:assert/strict";
import test, { afterEach } from "node:test";

import { JSDOM } from "jsdom";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { forwardRef, useImperativeHandle, useState } from "react";

import {
  emptyApplicationFormValues,
  type ApplicationSubmissionActionState,
} from "@/features/applications/public-application-form-contract";
import {
  PublicApplicationForm,
  type PublicApplicationFormCopy,
} from "@/features/applications/components/public-application-form";
import { publicPhoneCountryOptions } from "@/features/applications/phone-country-options";

type RenderHandle = {
  root: Root;
  container: HTMLDivElement;
  window: JSDOM["window"];
  cleanup: () => void;
};

const defaultCopy: PublicApplicationFormCopy = {
  introTitle: "Apply",
  introDescription: "Complete the form",
  requiredLegend: "Required",
  requiredFieldWarning: {
    badge: "Warning",
    title: "Review the required information",
    description: "One or more required fields are empty. Complete them before sending the form.",
  },
  privacyNotice: "Privacy",
  captchaLabel: "Security check",
  captchaHelp: "Complete the captcha to enable submit.",
  captchaExpired: "Captcha expired.",
  captchaError: "Captcha failed to load.",
  submitLabel: "Submit application",
  submittingLabel: "Submitting",
  phoneDialCodeLabel: "Dial code",
  searchableSelect: {
    searchPlaceholder: "Search",
    noResults: "No results",
  },
  fields: {
    firstName: { label: "First name", placeholder: "First name" },
    lastName: { label: "Last name", placeholder: "Last name" },
    email: { label: "Email", placeholder: "Email" },
    phone: { label: "Phone", placeholder: "Phone" },
    nationality: { label: "Nationality", placeholder: "Nationality" },
    birthDate: { label: "Birth date", placeholder: "Birth date" },
    message: { label: "Message", placeholder: "Message" },
    curriculum: { label: "Curriculum", placeholder: "Curriculum" },
  },
  validation: {
    required: "Required",
    invalidEmail: "Invalid email",
    invalidDate: "Invalid date",
    invalidSelection: "Invalid selection",
    invalidFileType: "Invalid file type",
    fileTooLarge: "File too large",
  },
  errors: {
    captchaFailed: "Captcha failed",
    submissionFailed: "Submission failed",
  },
};

const initialState: ApplicationSubmissionActionState = {
  status: "idle",
  values: emptyApplicationFormValues,
  fieldErrors: {},
  resetCaptcha: false,
};

const renderedHandles = new Set<RenderHandle>();

afterEach(async () => {
  for (const handle of renderedHandles) {
    await act(async () => {
      handle.root.unmount();
    });

    handle.cleanup();
    renderedHandles.delete(handle);
  }
});

const FakeCaptcha = forwardRef<{ reset: () => void }, {
  language: string;
  siteKey: string;
  onChange: (value: string | null) => void;
  onExpired: () => void;
  onErrored: () => void;
}>(function FakeCaptcha({ language, siteKey, onChange, onExpired, onErrored }, ref) {
  const [resetCount, setResetCount] = useState(0);

  useImperativeHandle(ref, () => ({
    reset() {
      setResetCount((count) => count + 1);
    },
  }), []);

  return (
    <div>
      <span data-testid="captcha-props">{`${language}:${siteKey}`}</span>
      <span data-testid="captcha-reset-count">{String(resetCount)}</span>
      <button type="button" onClick={() => onChange("captcha-token")}>Verify captcha</button>
      <button type="button" onClick={() => onChange(null)}>Clear captcha</button>
      <button type="button" onClick={onExpired}>Expire captcha</button>
      <button type="button" onClick={onErrored}>Error captcha</button>
    </div>
  );
});

function renderForm(
  stateOverride: ApplicationSubmissionActionState = initialState,
  copyOverride: PublicApplicationFormCopy = defaultCopy,
): RenderHandle {
  const dom = new JSDOM("<!doctype html><html><body></body></html>");
  const { window } = dom;
  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  const previousNavigator = globalThis.navigator;
  const previousHTMLElement = globalThis.HTMLElement;
  const previousHTMLInputElement = globalThis.HTMLInputElement;
  const previousHTMLButtonElement = globalThis.HTMLButtonElement;
  const previousHTMLFormElement = globalThis.HTMLFormElement;
  const previousNode = globalThis.Node;
  const previousReactActEnvironment = (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean })
    .IS_REACT_ACT_ENVIRONMENT;

  defineGlobal("window", window);
  defineGlobal("document", window.document);
  defineGlobal("navigator", window.navigator);
  defineGlobal("HTMLElement", window.HTMLElement);
  defineGlobal("HTMLInputElement", window.HTMLInputElement);
  defineGlobal("HTMLButtonElement", window.HTMLButtonElement);
  defineGlobal("HTMLFormElement", window.HTMLFormElement);
  defineGlobal("Node", window.Node);
  defineGlobal("IS_REACT_ACT_ENVIRONMENT", true);

  if (!window.HTMLElement.prototype.scrollIntoView) {
    window.HTMLElement.prototype.scrollIntoView = () => {};
  }

  if (!("attachEvent" in window.HTMLElement.prototype)) {
    Object.defineProperty(window.HTMLElement.prototype, "attachEvent", {
      configurable: true,
      writable: true,
      value: () => {},
    });
  }

  if (!("detachEvent" in window.HTMLElement.prototype)) {
    Object.defineProperty(window.HTMLElement.prototype, "detachEvent", {
      configurable: true,
      writable: true,
      value: () => {},
    });
  }

  const container = window.document.createElement("div");
  window.document.body.appendChild(container);
  const root = createRoot(container);

  const handle: RenderHandle = {
    root,
    container,
    window,
    cleanup: () => {
      defineGlobal("window", previousWindow);
      defineGlobal("document", previousDocument);
      defineGlobal("navigator", previousNavigator);
      defineGlobal("HTMLElement", previousHTMLElement);
      defineGlobal("HTMLInputElement", previousHTMLInputElement);
      defineGlobal("HTMLButtonElement", previousHTMLButtonElement);
      defineGlobal("HTMLFormElement", previousHTMLFormElement);
      defineGlobal("Node", previousNode);
      defineGlobal("IS_REACT_ACT_ENVIRONMENT", previousReactActEnvironment);

      dom.window.close();
    },
  };

  renderedHandles.add(handle);

  void act(() => {
    root.render(
      <PublicApplicationForm
        action={async () => stateOverride}
        copy={copyOverride}
        recaptchaLanguage="es"
        recaptchaSiteKey="site-key"
        captchaComponent={FakeCaptcha}
        stateOverride={stateOverride}
      />,
    );
  });

  return handle;
}

async function rerenderForm(
  handle: RenderHandle,
  stateOverride: ApplicationSubmissionActionState,
  copyOverride: PublicApplicationFormCopy = defaultCopy,
) {
  await act(async () => {
    handle.root.render(
      <PublicApplicationForm
        action={async () => stateOverride}
        copy={copyOverride}
        recaptchaLanguage="es"
        recaptchaSiteKey="site-key"
        captchaComponent={FakeCaptcha}
        stateOverride={stateOverride}
      />,
    );
  });
}

function getButton(container: HTMLDivElement, label: string): HTMLButtonElement {
  const button = Array.from(container.querySelectorAll("button")).find(
    (candidate) => candidate.textContent === label,
  );

  assert.ok(button, `Expected button \"${label}\" to exist`);
  return button;
}

function defineGlobal(key: PropertyKey, value: unknown) {
  Object.defineProperty(globalThis, key, {
    configurable: true,
    writable: true,
    value,
  });
}

function querySubmitButton(container: HTMLDivElement) {
  return Array.from(container.querySelectorAll("button")).find(
    (candidate) => candidate.getAttribute("type") === "submit",
  );
}

test("submit button stays hidden until captcha succeeds", async () => {
  const handle = renderForm();

  assert.equal(querySubmitButton(handle.container), undefined);
  assert.match(handle.container.textContent ?? "", /Complete the captcha to enable submit\./);
  assert.equal(handle.container.querySelector('[name="recaptchaToken"]')?.getAttribute("value"), "");
  assert.match(handle.container.textContent ?? "", /es:site-key/);

  await act(async () => {
    getButton(handle.container, "Verify captcha").click();
  });

  assert.ok(querySubmitButton(handle.container));
  assert.equal(handle.container.querySelector('[name="recaptchaToken"]')?.getAttribute("value"), "captcha-token");
});

test("required fields show an asterisk legend without marking optional fields", () => {
  const handle = renderForm();

  const labelTexts = Array.from(handle.container.querySelectorAll("label")).map((label) => label.textContent?.replace(/\s+/g, " ").trim());

  assert.ok(labelTexts.includes("First name*"));
  assert.ok(labelTexts.includes("Last name*"));
  assert.ok(labelTexts.includes("Email*"));
  assert.ok(labelTexts.includes("Phone*"));
  assert.ok(labelTexts.includes("Nationality*"));
  assert.ok(labelTexts.includes("Birth date*"));
  assert.ok(labelTexts.includes("Message"));
  assert.ok(labelTexts.includes("Curriculum"));
  assert.ok(!labelTexts.includes("Message*"));
  assert.ok(!labelTexts.includes("Curriculum*"));
  assert.match(handle.container.textContent ?? "", /\*\s*Required/);
});

test("curriculum input accepts PDF uploads only", () => {
  const handle = renderForm();
  const curriculumInput = handle.container.querySelector('#application-curriculum');

  assert.ok(curriculumInput, "Expected the curriculum file input to exist");
  assert.equal(curriculumInput.getAttribute("accept"), ".pdf,application/pdf");
});

test("missing required fields show a destructive warning card on submit attempt", () => {
  const handle = renderForm({
    ...initialState,
    status: "error",
    fieldErrors: {
      firstName: "required",
      email: "required",
    },
  });

  assert.match(handle.container.textContent ?? "", /Warning/);
  assert.match(handle.container.textContent ?? "", /Review the required information/);
  assert.match(handle.container.textContent ?? "", /One or more required fields are empty\. Complete them before sending the form\./);
});

test("missing required fields scroll the warning card into view and focus it", async () => {
  const handle = renderForm();
  const scrollCalls: ScrollIntoViewOptions[] = [];
  const originalScrollIntoView = handle.window.HTMLElement.prototype.scrollIntoView;
  const originalFocus = handle.window.HTMLElement.prototype.focus;

  handle.window.HTMLElement.prototype.scrollIntoView = function scrollIntoView(options?: ScrollIntoViewOptions) {
    scrollCalls.push(options ?? {});
  };

  handle.window.HTMLElement.prototype.focus = function focus(options?: FocusOptions) {
    originalFocus.call(this, options);
  };

  await rerenderForm(handle, {
    ...initialState,
    status: "error",
    fieldErrors: {
      firstName: "required",
      email: "required",
    },
  });

  const warningCard = Array.from(handle.container.querySelectorAll("section")).find((candidate) =>
    candidate.textContent?.includes("Review the required information"),
  );

  assert.ok(warningCard, "Expected the required-fields warning card to exist");
  assert.equal(scrollCalls.length, 1);
  assert.deepEqual(scrollCalls[0], { behavior: "smooth", block: "start" });
  assert.equal(handle.window.document.activeElement, warningCard);

  handle.window.HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
  handle.window.HTMLElement.prototype.focus = originalFocus;
});

test("missing required fields do not crash when warning copy is unavailable", () => {
  const copyWithoutWarning: PublicApplicationFormCopy = {
    ...defaultCopy,
    requiredFieldWarning: undefined,
  };

  const handle = renderForm(
    {
      ...initialState,
      status: "error",
      fieldErrors: {
        firstName: "required",
      },
    },
    copyWithoutWarning,
  );

  assert.doesNotMatch(handle.container.textContent ?? "", /Review the required information/);
  assert.match(handle.container.textContent ?? "", /Required/);
});

test("non-required validation errors do not show the missing-required warning card", () => {
  const handle = renderForm({
    ...initialState,
    status: "error",
    fieldErrors: {
      email: "invalidEmail",
    },
  });

  assert.doesNotMatch(handle.container.textContent ?? "", /Review the required information/);
});

test("non-required validation errors do not trigger auto-scroll", async () => {
  const handle = renderForm();
  const scrollCalls: ScrollIntoViewOptions[] = [];
  const originalScrollIntoView = handle.window.HTMLElement.prototype.scrollIntoView;

  handle.window.HTMLElement.prototype.scrollIntoView = function scrollIntoView(options?: ScrollIntoViewOptions) {
    scrollCalls.push(options ?? {});
  };

  await rerenderForm(handle, {
    ...initialState,
    status: "error",
    fieldErrors: {
      email: "invalidEmail",
    },
  });

  assert.equal(scrollCalls.length, 0);

  handle.window.HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
});

test("phone dial-code trigger stays compact while the open list keeps country names", async () => {
  const handle = renderForm();
  const selectedPhoneOption = publicPhoneCountryOptions.find((option) => option.dialCode === emptyApplicationFormValues.phoneDialCode);

  assert.ok(selectedPhoneOption, "Expected a default phone dial-code option");

  const dialCodeTrigger = handle.container.querySelector("#application-phoneDialCode-trigger");
  const dialCodeLabel = handle.container.querySelector('label[for="application-phoneDialCode-trigger"]');

  assert.ok(dialCodeTrigger, "Expected the phone dial-code trigger to exist");
  assert.ok(dialCodeLabel, "Expected the phone dial-code label to exist for accessibility");
  assert.match(dialCodeLabel.className, /sr-only/);
  const compactTriggerText = dialCodeTrigger.textContent?.replace(/\s+/g, " ").trim() ?? "";

  assert.ok(compactTriggerText.startsWith(`${selectedPhoneOption.flag} ${selectedPhoneOption.dialCode}`));
  assert.ok(!compactTriggerText.includes(selectedPhoneOption.name));
  assert.match(dialCodeTrigger.className, /w-auto/);

  await act(async () => {
    (dialCodeTrigger as HTMLButtonElement).click();
  });

  const dialCodePanel = dialCodeTrigger.parentElement?.querySelector('.absolute.z-20');
  assert.ok(dialCodePanel, "Expected the open phone dial-code panel to exist");
  assert.match((dialCodePanel as HTMLDivElement).className, /w-\[min\(22rem,calc\(100vw-4rem\)\)\]/);
  assert.match((dialCodePanel as HTMLDivElement).className, /sm:right-0/);
  assert.match((dialCodePanel as HTMLDivElement).className, /sm:min-w-\[24rem\]/);

  const selectedListOption = Array.from(handle.container.querySelectorAll('[role="option"]')).find(
    (option) => option.textContent?.includes(selectedPhoneOption.dialCode),
  );

  assert.ok(selectedListOption, "Expected the open list to include the selected phone dial-code option");
  assert.match(selectedListOption.textContent ?? "", new RegExp(selectedPhoneOption.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(selectedListOption.textContent ?? "", new RegExp(selectedPhoneOption.dialCode.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});

test("shared dial codes use a neutral closed-state indicator", async () => {
  const handle = renderForm();
  const sharedDialCodeOption = publicPhoneCountryOptions.find((option) => option.dialCode === "+1");

  assert.ok(sharedDialCodeOption, "Expected a shared +1 phone dial-code option");

  const dialCodeTrigger = handle.container.querySelector("#application-phoneDialCode-trigger") as HTMLButtonElement | null;
  assert.ok(dialCodeTrigger, "Expected the phone dial-code trigger to exist");

  await act(async () => {
    dialCodeTrigger.click();
  });

  const sharedListOption = Array.from(handle.container.querySelectorAll('[role="option"]')).find(
    (option) => option.textContent?.includes("+1"),
  ) as HTMLButtonElement | undefined;

  assert.ok(sharedListOption, "Expected the +1 option to exist in the open list");
  assert.match(sharedListOption.textContent ?? "", /🌐 \+1/);
  assert.doesNotMatch(sharedListOption.textContent ?? "", /🇦🇬 \+1/);

  await act(async () => {
    sharedListOption.click();
  });

  const compactTriggerText = dialCodeTrigger.textContent?.replace(/\s+/g, " ").trim() ?? "";
  assert.ok(compactTriggerText.startsWith("🌐 +1"));
  assert.doesNotMatch(compactTriggerText, /🇦🇬/);
});

test("phone field keeps the number input wide without increasing its height", () => {
  const handle = renderForm();
  const phoneInput = handle.container.querySelector('#application-phone');

  assert.ok(phoneInput, "Expected the phone input to exist");
  const phoneRow = phoneInput.parentElement?.parentElement;

  assert.ok(phoneRow, "Expected the phone field row to exist");
  assert.match(phoneRow.className, /grid-cols-\[max-content_minmax\(0,1fr\)\]/);
  assert.match(phoneRow.className, /items-end/);
  assert.match(phoneInput.parentElement?.className ?? "", /min-w-0/);
  assert.match(phoneInput.className, /text-sm/);
  assert.doesNotMatch(phoneInput.className, /md:text-lg/);
});

test("phone dial-code list uses a fixed mobile panel so the form does not shift sideways", async () => {
  const handle = renderForm();
  const dialCodeTrigger = handle.container.querySelector("#application-phoneDialCode-trigger") as HTMLButtonElement | null;

  assert.ok(dialCodeTrigger, "Expected the phone dial-code trigger to exist");

  Object.defineProperty(handle.window, "innerWidth", {
    configurable: true,
    writable: true,
    value: 390,
  });

  await act(async () => {
    dialCodeTrigger.click();
  });

  const dialCodePanel = dialCodeTrigger.parentElement?.querySelector('.z-20') as HTMLDivElement | null;

  assert.ok(dialCodePanel, "Expected the open phone dial-code panel to exist");
  assert.equal(dialCodePanel.style.position, "fixed");
  assert.equal(dialCodePanel.style.width, "352px");
  assert.equal(dialCodePanel.style.left, "16px");
});

test("submit button hides again when captcha expires", async () => {
  const handle = renderForm();

  await act(async () => {
    getButton(handle.container, "Verify captcha").click();
  });
  assert.ok(querySubmitButton(handle.container));

  await act(async () => {
    getButton(handle.container, "Expire captcha").click();
  });

  assert.equal(querySubmitButton(handle.container), undefined);
  assert.match(handle.container.textContent ?? "", /Captcha expired\./);
  assert.equal(handle.container.querySelector('[name="recaptchaToken"]')?.getAttribute("value"), "");
});

test("submit button hides again when captcha errors", async () => {
  const handle = renderForm();

  await act(async () => {
    getButton(handle.container, "Verify captcha").click();
  });
  assert.ok(querySubmitButton(handle.container));

  await act(async () => {
    getButton(handle.container, "Error captcha").click();
  });

  assert.equal(querySubmitButton(handle.container), undefined);
  assert.match(handle.container.textContent ?? "", /Captcha failed to load\./);
  assert.equal(handle.container.querySelector('[name="recaptchaToken"]')?.getAttribute("value"), "");
});

test("retry after captcha verification failure resets the widget and hides submit", async () => {
  const handle = renderForm();

  await act(async () => {
    getButton(handle.container, "Verify captcha").click();
  });
  assert.ok(querySubmitButton(handle.container));

  await rerenderForm(handle, {
    ...initialState,
    status: "error",
    formError: "captchaFailed",
    resetCaptcha: true,
  });

  await act(async () => {
    await new Promise((resolve) => handle.window.setTimeout(resolve, 0));
  });

  assert.equal(querySubmitButton(handle.container), undefined);
  assert.equal(handle.container.querySelector('[data-testid="captcha-reset-count"]')?.textContent, "1");
  assert.equal(handle.container.querySelector('[name="recaptchaToken"]')?.getAttribute("value"), "");
  assert.match(handle.container.textContent ?? "", /Complete the captcha to enable submit\./);
});

test("retry after submission failure resets the widget and hides submit", async () => {
  const handle = renderForm();

  await act(async () => {
    getButton(handle.container, "Verify captcha").click();
  });
  assert.ok(querySubmitButton(handle.container));

  await rerenderForm(handle, {
    ...initialState,
    status: "error",
    formError: "submissionFailed",
    resetCaptcha: true,
  });

  await act(async () => {
    await new Promise((resolve) => handle.window.setTimeout(resolve, 0));
  });

  assert.equal(querySubmitButton(handle.container), undefined);
  assert.equal(handle.container.querySelector('[data-testid="captcha-reset-count"]')?.textContent, "1");
  assert.equal(handle.container.querySelector('[name="recaptchaToken"]')?.getAttribute("value"), "");
  assert.match(handle.container.textContent ?? "", /Complete the captcha to enable submit\./);
});
