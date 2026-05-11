import type { WizardPublishPayloadInput } from "@/lib/meta/map-wizard-to-graph";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { WIZARD_CREATIVES_BUCKET } from "@/lib/wizard/wizard-creatives-bucket";
import * as tus from "tus-js-client";
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

const MAX_FILE_BYTES =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_UPLOAD_MAX_BYTES
    ? Number(process.env.NEXT_PUBLIC_UPLOAD_MAX_BYTES)
    : 500 * 1024 * 1024; // 500 MB

const TUS_CHUNK_SIZE = 6 * 1024 * 1024; // 6 MB — required by Supabase TUS

function tusEndpoint(supabaseUrl: string): string {
  // Use direct storage hostname for optimal large-file performance
  const url = new URL(supabaseUrl);
  url.hostname = url.hostname.replace(/^([^.]+)\.supabase\.co$/, "$1.storage.supabase.co");
  return `${url.origin}/storage/v1/upload/resumable`;
}

function uploadFileTus(
  file: File,
  path: string,
  accessToken: string,
  supabaseUrl: string,
  anonKey: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint: tusEndpoint(supabaseUrl),
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: {
        authorization: `Bearer ${accessToken}`,
        apikey: anonKey,
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      chunkSize: TUS_CHUNK_SIZE,
      metadata: {
        bucketName: WIZARD_CREATIVES_BUCKET,
        objectName: path,
        contentType: file.type || "application/octet-stream",
        cacheControl: "3600",
      },
      onError(error) {
        const msg = error.message ?? String(error);
        const is413 = msg.includes("413") || msg.toLowerCase().includes("maximum size exceeded");
        reject(
          new Error(
            is413
              ? `"${file.name}" é demasiado grande para enviar. Usa ficheiros até 500 MB.`
              : `Falha ao enviar "${file.name}": ${msg}`
          )
        );
      },
      onSuccess() {
        resolve();
      },
    });

    upload.findPreviousUploads().then((previous) => {
      if (previous.length) upload.resumeFromPreviousUpload(previous[0]);
      upload.start();
    });
  });
}

async function uploadCreativesToWizardBucket(files: File[], userId: string): Promise<string[]> {
  for (const file of files) {
    if (file.size > MAX_FILE_BYTES) {
      const limitMb = (MAX_FILE_BYTES / (1024 ** 2)).toFixed(0);
      const sizeMb = (file.size / (1024 ** 2)).toFixed(1);
      throw new Error(
        `O arquivo "${file.name}" (${sizeMb} MB) ultrapassa o limite de ${limitMb} MB.`
      );
    }
  }

  const supabase = createBrowserSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Sessão em falta. Inicia sessão para enviar ficheiros.");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const sessionUuid = crypto.randomUUID();
  const base = `${userId}/${sessionUuid}`;

  const paths = files.map((f, i) => `${base}/creative_${i}${extensionFromFileName(f.name)}`);

  const results = await Promise.allSettled(
    files.map((file, i) =>
      uploadFileTus(file, paths[i], session.access_token, supabaseUrl, anonKey)
    )
  );

  const failedIndexes = results
    .map((r, i) => (r.status === "rejected" ? i : -1))
    .filter((i) => i >= 0);

  if (failedIndexes.length > 0) {
    // Rollback successful uploads
    const successPaths = results
      .map((r, i) => (r.status === "fulfilled" ? paths[i] : null))
      .filter(Boolean) as string[];
    if (successPaths.length > 0) {
      await supabase.storage.from(WIZARD_CREATIVES_BUCKET).remove(successPaths);
    }
    const errors = failedIndexes
      .map((i) => (results[i] as PromiseRejectedResult).reason as Error)
      .map((e) => e.message)
      .join("; ");
    throw new Error(errors);
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
