import { describe, expect, it } from "vitest";

import {
  metaPublishConcurrency,
  runWithConcurrency,
  shouldDeferWizardPublish,
  wizardPublishDeferredMinAdsets,
} from "@/lib/meta/publish-concurrency";

describe("runWithConcurrency", () => {
  it("preserves order", async () => {
    const out = await runWithConcurrency([1, 2, 3], 2, async (n) => n * 2);
    expect(out).toEqual([2, 4, 6]);
  });
});

describe("shouldDeferWizardPublish", () => {
  it("defers at or above default min adsets", () => {
    const min = wizardPublishDeferredMinAdsets();
    expect(shouldDeferWizardPublish(min - 1)).toBe(false);
    expect(shouldDeferWizardPublish(min)).toBe(true);
    expect(shouldDeferWizardPublish(250)).toBe(true);
  });
});

describe("metaPublishConcurrency", () => {
  it("defaults to 5", () => {
    expect(metaPublishConcurrency()).toBe(5);
  });
});
