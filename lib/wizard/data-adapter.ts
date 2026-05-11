import type { WizardPublishPayload } from "@/lib/meta/map-wizard-to-graph";
import type { MockAccount } from "@/lib/mock-data";
import {
  type WizardInterestOption,
  type WizardLocationOption,
  type WizardPixel,
  type WizardPreset,
} from "@/lib/mock-data/wizard";
import type { Publico } from "@/lib/stores/wizardStore";

export interface PublishPayload {
  /** Must match `wizardPublishPayloadSchema` (validated server-side). */
  snapshot: WizardPublishPayload;
  /** Same order as `snapshot.creatives` — binary files for multipart `creative_N`. */
  creativeFiles: File[];
}

export type PublishResult = {
  publishId: string;
  warnings?: string[];
  results?: Array<{
    ok: boolean;
    error?: string;
    creativeName?: string;
    accountName?: string;
    metaCampaignId?: string;
  }>;
};

export interface WizardDataAdapter {
  listAccounts: () => Promise<MockAccount[]>;
  listPixels: () => Promise<WizardPixel[]>;
  listSavedPresets: () => Promise<WizardPreset[]>;
  listSavedPublicos: () => Promise<Publico[]>;
  listLocationOptions: () => Promise<WizardLocationOption[]>;
  listInterestOptions: () => Promise<WizardInterestOption[]>;
  savePublico: (publico: Publico) => Promise<Publico>;
  publishCampaigns: (payload: PublishPayload) => Promise<PublishResult>;
}

async function parseJson<T>(res: Response): Promise<T> {
  const json = (await res.json()) as { error?: string; data?: T };
  if (!res.ok) {
    throw new Error(json.error ?? `Request failed (${res.status})`);
  }
  if (json.data === undefined) {
    throw new Error("Missing data in response");
  }
  return json.data;
}

export function createFetchWizardDataAdapter(): WizardDataAdapter {
  const opts: RequestInit = { credentials: "include" };

  return {
    async listAccounts() {
      const res = await fetch("/api/wizard/accounts", opts);
      return parseJson<MockAccount[]>(res);
    },
    async listPixels() {
      const res = await fetch("/api/wizard/pixels", opts);
      return parseJson<WizardPixel[]>(res);
    },
    async listSavedPresets() {
      const res = await fetch("/api/wizard/presets", opts);
      return parseJson<WizardPreset[]>(res);
    },
    async listSavedPublicos() {
      const res = await fetch("/api/wizard/publicos", opts);
      return parseJson<Publico[]>(res);
    },
    async listLocationOptions() {
      return [];
    },
    async listInterestOptions() {
      return [];
    },
    async savePublico(publico) {
      const res = await fetch("/api/wizard/publicos", {
        ...opts,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(publico),
      });
      return parseJson<Publico>(res);
    },
    async publishCampaigns(payload) {
      const form = new FormData();
      form.append("payload", JSON.stringify(payload.snapshot));
      payload.creativeFiles.forEach((file, i) => {
        form.append(`creative_${i}`, file, file.name);
      });
      const res = await fetch("/api/wizard/publish", {
        ...opts,
        method: "POST",
        body: form,
      });
      const raw = await res.text();

      if (res.status === 413) {
        throw new Error(
          "O pedido é demasiado grande (ficheiros de criativos). Reduz o tamanho ou o número de ficheiros e tenta novamente."
        );
      }

      const ct = res.headers.get("content-type") ?? "";
      const looksJson =
        ct.includes("application/json") ||
        ct.includes("application/problem+json") ||
        raw.trimStart().startsWith("{");

      type PublishResponse = {
        error?: string;
        publishId?: string;
        warnings?: string[];
        results?: PublishResult["results"];
      };
      let json: PublishResponse | null = null;
      if (looksJson && raw.trim().length > 0) {
        try {
          json = JSON.parse(raw) as PublishResponse;
        } catch {
          throw new Error(
            "Não foi possível ler a resposta do servidor. Se estás a enviar muitos ou ficheiros muito grandes, tenta reduzir."
          );
        }
      }

      if (!res.ok) {
        if (json?.error) throw new Error(json.error);
        const hint = raw.trim().slice(0, 280);
        throw new Error(hint || `Publicação falhou (${res.status}).`);
      }

      if (!json?.publishId) {
        throw new Error(json?.error ?? "Publicação falhou: resposta sem identificador.");
      }

      return {
        publishId: json.publishId,
        warnings: json.warnings,
        results: json.results,
      };
    },
  };
}

export const mockWizardDataAdapter = createFetchWizardDataAdapter();
