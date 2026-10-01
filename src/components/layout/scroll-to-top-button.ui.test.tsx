import assert from "node:assert/strict";
import test, { afterEach } from "node:test";

import { JSDOM } from "jsdom";
import { act } from "react";
import { createRoot } from "react-dom/client";

import { ScrollToTopButton } from "./scroll-to-top-button";

type Handle = {
  window: JSDOM["window"];
  button: () => HTMLButtonElement;
  container: HTMLElement;
  cleanup: () => void;
};

const handles = new Set<Handle>();

function defineGlobal(name: string, value: unknown) {
  Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
}

function setScrollMetrics(element: HTMLElement, metrics: { scrollTop: number; scrollHeight: number; clientHeight: number }) {
  for (const [key, value] of Object.entries(metrics)) {
    Object.defineProperty(element, key, { configurable: true, value });
  }
}

async function nextFrame(window: JSDOM["window"]) {
  await act(async () => {
    await new Promise((resolve) => window.requestAnimationFrame(() => resolve(undefined)));
  });
}

async function render(props: { scrollContainerId?: string } = {}): Promise<Handle> {
  const dom = new JSDOM("<!doctype html><html><body><main id=\"scroller\"></main><div id=\"root\"></div></body></html>", {
    pretendToBeVisual: true,
  });
  const { window } = dom;
  const previous = {
    window: globalThis.window,
    document: globalThis.document,
    navigator: globalThis.navigator,
    HTMLElement: globalThis.HTMLElement,
    actEnvironment: (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT,
  };

  defineGlobal("window", window);
  defineGlobal("document", window.document);
  defineGlobal("navigator", window.navigator);
  defineGlobal("HTMLElement", window.HTMLElement);
  defineGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  window.matchMedia = ((query: string) => ({ matches: false, media: query })) as typeof window.matchMedia;
  setScrollMetrics(window.document.documentElement, { scrollTop: 0, scrollHeight: 4000, clientHeight: 800 });

  const root = createRoot(window.document.getElementById("root")!);

  await act(async () => {
    root.render(<ScrollToTopButton label="Volver arriba" {...props} />);
  });
  await nextFrame(window);

  const handle: Handle = {
    window,
    button: () => window.document.querySelector("button")!,
    container: window.document.getElementById("scroller")!,
    cleanup: () => {
      act(() => root.unmount());
      defineGlobal("window", previous.window);
      defineGlobal("document", previous.document);
      defineGlobal("navigator", previous.navigator);
      defineGlobal("HTMLElement", previous.HTMLElement);
      defineGlobal("IS_REACT_ACT_ENVIRONMENT", previous.actEnvironment);
      window.close();
    },
  };

  handles.add(handle);

  return handle;
}

afterEach(() => {
  for (const handle of handles) {
    handle.cleanup();
  }

  handles.clear();
});

test("stays hidden and out of the tab order at the top of the page", async () => {
  const { button } = await render();

  assert.equal(button().dataset.visible, "false");
  assert.equal(button().getAttribute("aria-hidden"), "true");
  assert.equal(button().tabIndex, -1);
  assert.equal(button().getAttribute("aria-label"), "Volver arriba");
});

test("appears after scrolling the window and scrolls it back to the top", async () => {
  const { window, button } = await render();
  const scrollCalls: unknown[] = [];

  window.scrollTo = ((options: ScrollToOptions) => scrollCalls.push(options)) as typeof window.scrollTo;
  Object.defineProperty(window, "scrollY", { configurable: true, value: 1600 });
  window.dispatchEvent(new window.Event("scroll"));
  await nextFrame(window);

  assert.equal(button().dataset.visible, "true");
  assert.equal(button().tabIndex, 0);

  await act(async () => {
    button().click();
  });

  assert.deepEqual(scrollCalls, [{ top: 0, behavior: "smooth" }]);
});

test("follows a scrolling container (admin desktop) and scrolls it back to the top", async () => {
  const { window, button, container } = await render({ scrollContainerId: "scroller" });
  const containerCalls: unknown[] = [];

  container.scrollTo = ((options: ScrollToOptions) => containerCalls.push(options)) as typeof container.scrollTo;
  window.scrollTo = (() => {}) as typeof window.scrollTo;
  setScrollMetrics(container, { scrollTop: 900, scrollHeight: 3000, clientHeight: 700 });
  container.dispatchEvent(new window.Event("scroll"));
  await nextFrame(window);

  assert.equal(button().dataset.visible, "true");

  const progressCircle = window.document.querySelector(".scroll-top-button-ring-progress")!;
  const circumference = Number(progressCircle.getAttribute("stroke-dasharray"));
  const offset = Number(progressCircle.getAttribute("stroke-dashoffset"));

  // 900 of 2300 scrollable px ≈ 39% of the ring filled.
  assert.ok(Math.abs(1 - offset / circumference - 900 / 2300) < 0.01);

  await act(async () => {
    button().click();
  });

  assert.deepEqual(containerCalls, [{ top: 0, behavior: "smooth" }]);
});
