import { describe, expect, it } from "vitest";

import { mapMeAccountsNode, pageIdInUserPages, type UserFacebookPage } from "./graph-user-pages";

describe("mapMeAccountsNode", () => {
  it("returns null without id", () => {
    expect(mapMeAccountsNode({ name: "X" })).toBeNull();
    expect(mapMeAccountsNode({ id: "  " })).toBeNull();
  });

  it("maps id and name with picture url from nested data", () => {
    expect(
      mapMeAccountsNode({
        id: "123",
        name: "My Page",
        picture: { data: { url: "https://example.com/p.jpg" } },
      })
    ).toEqual({
      id: "123",
      name: "My Page",
      pictureUrl: "https://example.com/p.jpg",
    });
  });

  it("uses id as name when name missing", () => {
    expect(mapMeAccountsNode({ id: "999" })).toEqual({ id: "999", name: "999" });
  });
});

describe("pageIdInUserPages", () => {
  const pages: UserFacebookPage[] = [{ id: "111", name: "A" }];

  it("returns true when page exists", () => {
    expect(pageIdInUserPages("111", pages)).toBe(true);
    expect(pageIdInUserPages(" 111 ", pages)).toBe(true);
  });

  it("returns false when missing or blank", () => {
    expect(pageIdInUserPages("222", pages)).toBe(false);
    expect(pageIdInUserPages("", pages)).toBe(false);
    expect(pageIdInUserPages("   ", pages)).toBe(false);
  });
});
