import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

class TestResizeObserver implements ResizeObserver {
  readonly root = null;
  readonly rootMargin = "0px";
  readonly thresholds = [0];

  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): ResizeObserverEntry[] { return []; }
}

window.ResizeObserver = TestResizeObserver;
window.matchMedia ??= () => ({
  matches: false,
  media: "",
  onchange: null,
  addListener() {},
  removeListener() {},
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent() { return false; },
});
window.HTMLElement.prototype.hasPointerCapture ??= () => false;
window.HTMLElement.prototype.setPointerCapture ??= () => {};
window.HTMLElement.prototype.releasePointerCapture ??= () => {};
window.HTMLElement.prototype.scrollIntoView ??= () => {};
