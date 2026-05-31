import { createHash } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { generateApiKey, hashApiKey, resolveUserFromApiKey } from "@/lib/mcp/api-key";

const mockMaybeSingle = vi.fn();
const mockUpdate = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createServiceSupabaseClient: () => ({
    from: mockFrom,
  }),
}));

describe("generateApiKey", () => {
  it("produces kr_mcp_ prefix and consistent hash", () => {
    const { plaintext, prefix, hash } = generateApiKey();
    expect(plaintext.startsWith("kr_mcp_")).toBe(true);
    expect(prefix).toBe(plaintext.slice(0, 16));
    expect(hash).toBe(createHash("sha256").update(plaintext, "utf8").digest("hex"));
    expect(hashApiKey(plaintext)).toBe(hash);
  });
});

describe("resolveUserFromApiKey", () => {
  beforeEach(() => {
    mockMaybeSingle.mockReset();
    mockUpdate.mockReset();
    mockFrom.mockReset();
    mockUpdate.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    mockFrom.mockImplementation((table: string) => {
      if (table === "mcp_api_keys") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: mockMaybeSingle,
            }),
          }),
          update: () => ({
            eq: mockUpdate,
          }),
        };
      }
      return {};
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns null without Bearer", async () => {
    expect(await resolveUserFromApiKey(null)).toBeNull();
    expect(await resolveUserFromApiKey("Basic abc")).toBeNull();
  });

  it("returns null for invalid key prefix", async () => {
    expect(await resolveUserFromApiKey("Bearer wrong_prefix")).toBeNull();
  });

  it("resolves user and bumps last_used_at", async () => {
    const { plaintext, hash } = generateApiKey();
    mockMaybeSingle.mockResolvedValue({
      data: { id: "key-1", user_id: "user-abc", revoked_at: null },
      error: null,
    });

    const result = await resolveUserFromApiKey(`Bearer ${plaintext}`);
    expect(result).toEqual({ userId: "user-abc" });
    expect(mockMaybeSingle).toHaveBeenCalled();
    expect(hashApiKey(plaintext)).toBe(hash);
  });

  it("rejects revoked keys", async () => {
    const { plaintext } = generateApiKey();
    mockMaybeSingle.mockResolvedValue({
      data: { id: "key-1", user_id: "user-abc", revoked_at: "2026-01-01T00:00:00Z" },
      error: null,
    });
    expect(await resolveUserFromApiKey(`Bearer ${plaintext}`)).toBeNull();
  });
});
