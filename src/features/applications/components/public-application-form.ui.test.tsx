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
import { PublicApplicationForm } from "@/features/applications/components/public-application-form";

type RenderHandle = {
  root: Root;
  container: HTMLDivElement;
  window: JSDOM["window"];
  cleanup: () => void;
};

const defaultCopy = {
  introTitle: "Apply",
  introDescription: "Complete the form",
  requiredLegend: "Required",
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
} as const;

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

function renderForm(stateOverride: ApplicationSubmissionActionState = initialState): RenderHandle {
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
        copy={defaultCopy}
        recaptchaLanguage="es"
        recaptchaSiteKey="site-key"
        captchaComponent={FakeCaptcha}
        stateOverride={stateOverride}
      />,
    );
  });

  return handle;
}

async function rerenderForm(handle: RenderHandle, stateOverride: ApplicationSubmissionActionState) {
  await act(async () => {
    handle.root.render(
      <PublicApplicationForm
        action={async () => stateOverride}
        copy={defaultCopy}
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
