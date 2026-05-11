import type { WizardPublishPayloadInput } from "@/lib/meta/map-wizard-to-graph";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { WIZARD_CREATIVES_BUCKET } from "@/lib/wizard/wizard-creatives-bucket";
import type { MockAccount } from "@/lib/mock-data";
import {
  type WizardInterestOption,
  type WizardLocationOption,
  type WizardPixel,
  type WizardPreset,
} from "@/lib/mock-data/wizard";
import type { Publico } from "@/lib/stores/wizardStore";

export interface PublishPayload {
  /** Validated server-side together with `creativeStoragePaths` after Supabase upload. */
  snapshot: WizardPublishPayloadInput;
  /** Same order as `snapshot.creatives` — uploaded to Storage before `POST /api/wizard/publish`. */
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

function extensionFromFileName(name: string): string {
  const i = name.lastIndexOf(".");
  if (i <= 0 || i === name.length - 1) return ".jpg";
  const ext = name.slice(i).replace(/[^a-zA-Z0-9.]/g, "");
  if (!ext || ext === ".") return ".jpg";
  return ext.startsWith(".") ? ext : `.${ext}`;
}

async function uploadCreativesToWizardBucket(files: File[], userId: string): Promise<string[]> {
  const supabase = createBrowserSupabaseClient();
  const session = crypto.randomUUID();
  const base = `${userId}/${session}`;
  const paths: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const path = `${base}/creative_${i}${extensionFromFileName(files[i].name)}`;
    const { error } = await supabase.storage.from(WIZARD_CREATIVES_BUCKET).upload(path, files[i], {
      cacheControl: "3600",
      upsert: false,
      contentType: files[i].type || undefined,
    });
    if (error) {
      for (const p of paths) {
        await supabase.storage.from(WIZARD_CREATIVES_BUCKET).remove([p]);
      }
      throw new Error(error.message);
    }
    paths.push(path);
  }
  return paths;
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
      const supabase = createBrowserSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Sessão em falta. Inicia sessão para publicar.");
      }

      const creativeStoragePaths = await uploadCreativesToWizardBucket(payload.creativeFiles, user.id);
      const body = { ...payload.snapshot, creativeStoragePaths };

      const res = await fetch("/api/wizard/publish", {
        ...opts,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
