import { describe, expect, it } from "vitest";

import {
  applyInterestReplacementsToTargeting,
  parseDeprecatedInterestReplacements,
  replacementsToMap,
} from "@/lib/meta/deprecated-targeting-interests";

describe("parseDeprecatedInterestReplacements", () => {
  it("parses replacements from error_data array nested in error", () => {
    const rawBody = JSON.stringify({
      error: {
        message: "Invalid parameter",
        error_user_title: "Algumas opções de direcionamento detalhado foram combinadas",
        error_data: {
          relevant_alternatives: [
            {
              deprecated_interest_id: "6014791869470",
              deprecated_interest_name: "Emagrecer Certo",
              alternative_interest_id: "6003385609165",
              alternative_interest_name: "Recipes",
            },
          ],
        },
      },
    });
    const rows = parseDeprecatedInterestReplacements(rawBody);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      deprecatedId: "6014791869470",
      alternativeId: "6003385609165",
      deprecatedName: "Emagrecer Certo",
      alternativeName: "Recipes",
    });
  });

  it("parses replacements from JSON string inside error_data", () => {
    const inner = JSON.stringify([
      {
        deprecated_interest_id: "111",
        alternative_interest_id: "222",
      },
    ]);
    const rawBody = JSON.stringify({
      error: {
        message: "x",
        error_data: { blob: inner },
      },
    });
    expect(parseDeprecatedInterestReplacements(rawBody)).toEqual([
      expect.objectContaining({ deprecatedId: "111", alternativeId: "222" }),
    ]);
  });

  it("dedupes by deprecatedId (last wins)", () => {
    const rawBody = JSON.stringify({
      error: {
        error_data: [
          { deprecated_interest_id: "1", alternative_interest_id: "9" },
          { deprecated_interest_id: "1", alternative_interest_id: "2" },
        ],
      },
    });
    const rows = parseDeprecatedInterestReplacements(rawBody);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.alternativeId).toBe("2");
  });

  it("returns empty for invalid JSON", () => {
    expect(parseDeprecatedInterestReplacements("not json")).toEqual([]);
  });
});

describe("applyInterestReplacementsToTargeting", () => {
  it("replaces numeric interest ids in flexible_spec", () => {
    const targeting: Record<string, unknown> = {
      geo_locations: { countries: ["BR"] },
      flexible_spec: [{ interests: [{ id: 6014791869470 }] }],
    };
    const map = replacementsToMap(
      parseDeprecatedInterestReplacements(
        JSON.stringify({
          error: {
            error_data: [
              {
                deprecated_interest_id: "6014791869470",
                alternative_interest_id: "6003385609165",
              },
            ],
          },
        })
      )
    );
    const { changed } = applyInterestReplacementsToTargeting(targeting, map);
    expect(changed).toBe(true);
    const spec = targeting.flexible_spec as Array<{ interests: Array<{ id: number | string }> }>;
    expect(spec[0]!.interests[0]!.id).toBe(6003385609165);
  });

  it("replaces string interest ids and dedupes", () => {
    const targeting: Record<string, unknown> = {
      flexible_spec: [
        {
          interests: [{ id: "6014791869470" }, { id: "6014791869470" }],
        },
      ],
    };
    const map = new Map([["6014791869470", "6003385609165"]]);
    const { changed } = applyInterestReplacementsToTargeting(targeting, map);
    expect(changed).toBe(true);
    const spec = targeting.flexible_spec as Array<{ interests: Array<{ id: number | string }> }>;
    expect(spec[0]!.interests).toHaveLength(1);
    expect(spec[0]!.interests[0]!.id).toBe(6003385609165);
  });

  it("returns changed false when flexible_spec missing", () => {
    const targeting: Record<string, unknown> = { geo_locations: { countries: ["PT"] } };
    expect(applyInterestReplacementsToTargeting(targeting, new Map([["1", "2"]])).changed).toBe(false);
  });
});
