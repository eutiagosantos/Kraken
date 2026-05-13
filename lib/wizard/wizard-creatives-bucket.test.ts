import { describe, expect, it } from "vitest";

import {
  humanizeWizardCreativeStorageDownloadError,
  validateCreativeStoragePathsForUser,
} from "@/lib/wizard/wizard-creatives-bucket";

describe("validateCreativeStoragePathsForUser", () => {
  const uid = "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee";
  const session = "11111111-2222-4333-8444-555555555555";

  it("accepts valid layout", () => {
    expect(
      validateCreativeStoragePathsForUser(
        uid,
        [`${uid}/${session}/creative_0.png`],
        1,
        session
      )
    ).toBeNull();
  });

  it("rejects wrong user prefix", () => {
    expect(
      validateCreativeStoragePathsForUser(
        uid,
        [`other-user/${session}/creative_0.png`],
        1,
        session
      )
    ).not.toBeNull();
  });

  it("rejects length mismatch", () => {
    expect(validateCreativeStoragePathsForUser(uid, [`${uid}/${session}/a.png`], 2, session)).not.toBeNull();
  });

  it("rejects when path operation folder differs from publishOperationId", () => {
    expect(
      validateCreativeStoragePathsForUser(uid, [`${uid}/not-a-uuid/creative_0.png`], 1, session)
    ).not.toBeNull();
  });

  it("rejects invalid publishOperationId", () => {
    expect(
      validateCreativeStoragePathsForUser(uid, [`${uid}/${session}/creative_0.png`], 1, "not-a-uuid")
    ).not.toBeNull();
  });
});

describe("humanizeWizardCreativeStorageDownloadError", () => {
  it("maps Object not found to PT with bucket and migration hints", () => {
    const out = humanizeWizardCreativeStorageDownloadError("u/s/creative_0.jpg", "Object not found");
    expect(out).toContain("Não foi encontrado");
    expect(out).toContain("«u/s/creative_0.jpg»");
    expect(out).toContain("wizard_creatives");
    expect(out).toContain("NEXT_PUBLIC_SUPABASE_URL");
  });

  it("maps other not found variants", () => {
    const out = humanizeWizardCreativeStorageDownloadError("a/b/c.png", "The object was not found");
    expect(out).toContain("Não foi encontrado");
  });

  it("passes through other storage messages without long hint", () => {
    const out = humanizeWizardCreativeStorageDownloadError("a/b/c.png", "JWT expired");
    expect(out).toContain("JWT expired");
    expect(out).not.toContain("migração `wizard_creatives`");
  });
});
