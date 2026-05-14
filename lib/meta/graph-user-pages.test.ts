import { describe, expect, it } from "vitest";

import {
  mapMeAccountsNode,
  mapUserFacebookPagesToPublic,
  pageIdInUserPages,
  resolvePageAccessTokenForPosts,
  toPublicFacebookPage,
  type UserFacebookPage,
} from "./graph-user-pages";

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

describe("toPublicFacebookPage", () => {
  it("strips pageAccessToken from payload", () => {
    const pub = toPublicFacebookPage({
      id: "1",
      name: "P",
      pictureUrl: "https://x",
      pageAccessToken: "secret",
    });
    expect(pub).toEqual({ id: "1", name: "P", pictureUrl: "https://x" });
    expect("pageAccessToken" in pub).toBe(false);
  });
});

describe("mapUserFacebookPagesToPublic", () => {
  it("maps list without tokens", () => {
    const pages: UserFacebookPage[] = [
      { id: "a", name: "A", pageAccessToken: "t1" },
      { id: "b", name: "B" },
    ];
    expect(mapUserFacebookPagesToPublic(pages)).toEqual([
      { id: "a", name: "A" },
      { id: "b", name: "B" },
    ]);
  });
});

describe("resolvePageAccessTokenForPosts", () => {
  const pages: UserFacebookPage[] = [
    { id: "111", name: "With", pageAccessToken: "page-token-xyz" },
    { id: "222", name: "No token" },
  ];

  it("returns page token when present", () => {
    expect(resolvePageAccessTokenForPosts(pages, "111")).toEqual({
      ok: true,
      pageAccessToken: "page-token-xyz",
    });
    expect(resolvePageAccessTokenForPosts(pages, " 111 ")).toEqual({
      ok: true,
      pageAccessToken: "page-token-xyz",
    });
  });

  it("returns page_access_token_unavailable when page has no token", () => {
    expect(resolvePageAccessTokenForPosts(pages, "222")).toEqual({
      ok: false,
      reason: "page_access_token_unavailable",
    });
  });

  it("returns page_not_in_list when id missing", () => {
    expect(resolvePageAccessTokenForPosts(pages, "999")).toEqual({
      ok: false,
      reason: "page_not_in_list",
    });
  });
});
