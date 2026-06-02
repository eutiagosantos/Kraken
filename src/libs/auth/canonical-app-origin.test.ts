import { afterEach, describe, expect, it } from "vitest";

import {
  buildCanonicalAppUrl,
  buildCanonicalRedirectUrl,
  CANONICAL_APP_ORIGIN,
  getCanonicalAppHost,
  getCanonicalAppOrigin,
  isPreviewDeploymentHost,
} from "./canonical-app-origin";

const ORIGINAL = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL };
});

describe("getCanonicalAppOrigin", () => {
  it("uses NEXT_PUBLIC_APP_URL when set", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://custom.example.com";
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    expect(getCanonicalAppOrigin()).toBe("https://custom.example.com");
  });

  it("uses VERCEL_PROJECT_PRODUCTION_URL when public URL unset", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "kraken-sigma-three.vercel.app";
    expect(getCanonicalAppOrigin()).toBe("https://kraken-sigma-three.vercel.app");
  });

  it("falls back to CANONICAL_APP_ORIGIN", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    expect(getCanonicalAppOrigin()).toBe(CANONICAL_APP_ORIGIN);
  });

  it("ignores non-https NEXT_PUBLIC_APP_URL", () => {
    process.env.NEXT_PUBLIC_APP_URL = "http://insecure.example.com";
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    expect(getCanonicalAppOrigin()).toBe(CANONICAL_APP_ORIGIN);
  });
});

describe("isPreviewDeploymentHost", () => {
  it("is true on preview when host differs from canonical", () => {
    process.env.VERCEL_ENV = "preview";
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    expect(isPreviewDeploymentHost("kraken-git-refactor.vercel.app")).toBe(true);
  });

  it("is false on preview when host matches canonical", () => {
    process.env.VERCEL_ENV = "preview";
    delete process.env.NEXT_PUBLIC_APP_URL;
    expect(isPreviewDeploymentHost(getCanonicalAppHost())).toBe(false);
  });

  it("is false outside preview", () => {
    process.env.VERCEL_ENV = "production";
    expect(isPreviewDeploymentHost("kraken-git-refactor.vercel.app")).toBe(false);
  });
});

describe("buildCanonicalRedirectUrl", () => {
  it("redirects to canonical origin and strips toolbar query", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    const requestUrl = new URL(
      "https://kraken-git-refactor.vercel.app/cadastro?__vercel_toolbar_code=abc&foo=bar"
    );
    expect(buildCanonicalRedirectUrl(requestUrl)).toBe(
      "https://kraken-sigma-three.vercel.app/cadastro?foo=bar"
    );
  });
});

describe("buildCanonicalAppUrl", () => {
  it("joins path to canonical origin", () => {
    expect(buildCanonicalAppUrl("/home")).toBe(`${CANONICAL_APP_ORIGIN}/home`);
  });
});
