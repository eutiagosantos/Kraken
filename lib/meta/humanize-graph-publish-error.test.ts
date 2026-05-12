import { describe, expect, it } from "vitest";

import { GraphApiError } from "@/lib/meta/graph-client";
import {
  humanizeMetaAppDevelopmentModeError,
  humanizeMetaAudienceTooNarrowError,
  humanizeMetaBillingUnavailableError,
  humanizeMetaDetailedTargetingInvalidError,
  humanizeVideoProcessingError,
  isMetaAppDevelopmentModeError,
  isMetaAudienceTooNarrowError,
  isMetaBillingUnavailableError,
  isMetaDetailedTargetingInvalidParameterError,
  messageIndicatesMetaAppDevelopmentMode,
} from "@/lib/meta/humanize-graph-publish-error";

describe("isMetaAppDevelopmentModeError", () => {
  it("detects Portuguese Meta message", () => {
    const e = new GraphApiError(
      "O post do criativo dos anúncios foi criada por um app que está em modo de desenvolvimento: Invalid parameter",
      { status: 400, rawBody: "{}" }
    );
    expect(isMetaAppDevelopmentModeError(e)).toBe(true);
  });

  it("detects English development mode phrase", () => {
    const e = new GraphApiError("Cannot use this feature in development mode.", {
      status: 400,
      rawBody: "{}",
    });
    expect(isMetaAppDevelopmentModeError(e)).toBe(true);
  });

  it("detects created by an app + development", () => {
    const e = new GraphApiError("Post was created by an app still in development.", {
      status: 400,
      rawBody: "{}",
    });
    expect(isMetaAppDevelopmentModeError(e)).toBe(true);
  });

  it("is case-insensitive", () => {
    const e = new GraphApiError("MODO DE DESENVOLVIMENTO", { status: 400, rawBody: "{}" });
    expect(isMetaAppDevelopmentModeError(e)).toBe(true);
  });

  it("returns false for unrelated Graph errors", () => {
    const e = new GraphApiError("Invalid OAuth access token.", { status: 401, rawBody: "{}" });
    expect(isMetaAppDevelopmentModeError(e)).toBe(false);
  });

  it("returns false for non-Graph errors", () => {
    expect(isMetaAppDevelopmentModeError(new Error("network"))).toBe(false);
  });
});

describe("messageIndicatesMetaAppDevelopmentMode", () => {
  it("detects Kraken humanized hint substring", () => {
    expect(
      messageIndicatesMetaAppDevelopmentMode(
        "A app Meta usada no login (Facebook) está em modo Desenvolvimento. …"
      )
    ).toBe(true);
  });

  it("detects raw Portuguese Meta message in a thrown error string", () => {
    expect(
      messageIndicatesMetaAppDevelopmentMode(
        "Conta — f.mp4: O post do criativo dos anúncios foi criada por um app que está em modo de desenvolvimento: Invalid parameter"
      )
    ).toBe(true);
  });

  it("returns false for unrelated errors", () => {
    expect(messageIndicatesMetaAppDevelopmentMode("Invalid OAuth access token.")).toBe(false);
  });
});

describe("humanizeVideoProcessingError", () => {
  it("adds codec hint for codec-related Meta messages", () => {
    const out = humanizeVideoProcessingError("Unsupported video codec");
    expect(out).toContain("Unsupported video codec");
    expect(out).toContain("H.264");
  });

  it("adds duration hint when Meta mentions length", () => {
    const out = humanizeVideoProcessingError("Video duration exceeds limit");
    expect(out).toContain("duration");
    expect(out).toContain("duração");
  });
});

describe("humanizeMetaAppDevelopmentModeError", () => {
  it("includes hint and original Meta text", () => {
    const e = new GraphApiError("modo de desenvolvimento", {
      status: 400,
      errorUserTitle: "Invalid parameter",
      rawBody: "{}",
    });
    const out = humanizeMetaAppDevelopmentModeError(e);
    expect(out).toContain("developers.facebook.com");
    expect(out).toContain("Invalid parameter");
    expect(out).toContain("modo de desenvolvimento");
  });
});

describe("isMetaAudienceTooNarrowError", () => {
  it("detects Portuguese Amplie seu público with title", () => {
    const e = new GraphApiError("Invalid parameter", {
      status: 400,
      errorUserTitle: "O público configurado é inválido",
      errorUserMsg: "Amplie seu público para permitir que este anúncio seja veiculado.",
      rawBody: "{}",
    });
    expect(isMetaAudienceTooNarrowError(e)).toBe(true);
  });

  it("detects English expand your audience", () => {
    const e = new GraphApiError("Invalid parameter", {
      status: 400,
      errorUserTitle: "Invalid audience",
      errorUserMsg: "Expand your audience to run this ad.",
      rawBody: "{}",
    });
    expect(isMetaAudienceTooNarrowError(e)).toBe(true);
  });

  it("returns false for unrelated Graph errors", () => {
    const e = new GraphApiError("Invalid parameter", {
      status: 400,
      errorUserTitle: "Budget too low",
      rawBody: "{}",
    });
    expect(isMetaAudienceTooNarrowError(e)).toBe(false);
  });
});

describe("humanizeMetaAudienceTooNarrowError", () => {
  it("includes checklist hint and original Meta text", () => {
    const e = new GraphApiError("Invalid parameter", {
      status: 400,
      errorUserTitle: "O público configurado é inválido",
      errorUserMsg: "Amplie seu público para permitir que este anúncio seja veiculado.",
      rawBody: "{}",
    });
    const out = humanizeMetaAudienceTooNarrowError(e);
    expect(out).toContain("só país");
    expect(out).toContain("resposta Meta:");
    expect(out).toContain("Amplie seu público");
  });
});

describe("isMetaDetailedTargetingInvalidParameterError", () => {
  it("detects Portuguese detailed targeting + Invalid parameter", () => {
    const e = new GraphApiError("Invalid parameter", {
      status: 400,
      errorUserTitle: "Algumas opções de direcionamento detalhado foram combinadas",
      errorUserMsg: "Atualize a especificação de direcionamento.",
      rawBody: "{}",
    });
    expect(isMetaDetailedTargetingInvalidParameterError(e)).toBe(true);
  });

  it("returns false when only Invalid parameter", () => {
    const e = new GraphApiError("Invalid parameter", {
      status: 400,
      errorUserTitle: "Budget",
      rawBody: "{}",
    });
    expect(isMetaDetailedTargetingInvalidParameterError(e)).toBe(false);
  });
});

describe("isMetaBillingUnavailableError", () => {
  it("detects PT billing unavailable via errorUserTitle", () => {
    const e = new GraphApiError("Invalid parameter", {
      status: 400,
      errorUserTitle: "Opção de cobrança indisponível",
      errorUserMsg: "As contas de anúncios de empresas novas nos Produtos do Facebook podem escolher esta opção de pagamento de anúncios após seguirem nossas políticas por várias semanas.",
      rawBody: "{}",
    });
    expect(isMetaBillingUnavailableError(e)).toBe(true);
  });

  it("detects via 'empresas novas' substring", () => {
    const e = new GraphApiError("Invalid parameter", {
      status: 400,
      errorUserMsg: "empresas novas nos Produtos do Facebook",
      rawBody: "{}",
    });
    expect(isMetaBillingUnavailableError(e)).toBe(true);
  });

  it("returns false for unrelated errors", () => {
    const e = new GraphApiError("Some other error", { status: 400, rawBody: "{}" });
    expect(isMetaBillingUnavailableError(e)).toBe(false);
  });

  it("humanize includes LINK_CLICKS hint and resposta Meta", () => {
    const e = new GraphApiError("Invalid parameter", {
      status: 400,
      errorUserTitle: "Opção de cobrança indisponível",
      errorUserMsg: "empresas novas",
      rawBody: "{}",
    });
    const out = humanizeMetaBillingUnavailableError(e);
    expect(out).toContain("LINK_CLICKS");
    expect(out).toContain("resposta Meta:");
  });
});

describe("humanizeMetaDetailedTargetingInvalidError", () => {
  it("includes re-search interests hint", () => {
    const e = new GraphApiError("Invalid parameter", {
      status: 400,
      errorUserTitle: "Detailed targeting",
      errorUserMsg: "Update the targeting specification.",
      rawBody: "{}",
    });
    const out = humanizeMetaDetailedTargetingInvalidError(e);
    expect(out).toContain("Buscar interesses");
    expect(out).toContain("resposta Meta:");
  });
});
