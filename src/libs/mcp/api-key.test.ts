import { createHash } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { generateApiKey, hashApiKey, resolveUserFromApiKey } from "@/libs/mcp/api-key";

const mockFindByHash = vi.fn();
const mockTouchLastUsed = vi.fn();

vi.mock("@/libs/database/queries/mcp-api-keys", () => ({
  findMcpApiKeyByHash: (...args: unknown[]) => mockFindByHash(...args),
  touchMcpApiKeyLastUsed: (...args: unknown[]) => mockTouchLastUsed(...args),
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
    mockFindByHash.mockReset();
    mockTouchLastUsed.mockReset();
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
    mockFindByHash.mockResolvedValue({
      id: "key-1",
      user_id: "user-abc",
      revoked_at: null,
    });

    const result = await resolveUserFromApiKey(`Bearer ${plaintext}`);
    expect(result).toEqual({ userId: "user-abc" });
    expect(mockFindByHash).toHaveBeenCalled();
    expect(mockTouchLastUsed).toHaveBeenCalledWith("key-1", expect.any(String));
    expect(hashApiKey(plaintext)).toBe(hash);
  });

  it("rejects revoked keys", async () => {
    const { plaintext } = generateApiKey();
    mockFindByHash.mockResolvedValue({
      id: "key-1",
      user_id: "user-abc",
      revoked_at: "2026-01-01T00:00:00Z",
    });
    expect(await resolveUserFromApiKey(`Bearer ${plaintext}`)).toBeNull();
  });
});
