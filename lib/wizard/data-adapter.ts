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
    creativeIndex?: number;
    accountName?: string;
    metaCampaignId?: string;
  }>;
};

export interface WizardDataAdapter {
  listAccounts: () => Promise<MockAccount[]>;
  listPixels: (accountIds?: string[]) => Promise<WizardPixel[]>;
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

async function uploadCreativesToWizardBucket(
  files: File[],
  userId: string,
  operationId: string
): Promise<string[]> {
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
  const base = `${userId}/${operationId}`;

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
    async listPixels(accountIds) {
      const qs =
        accountIds && accountIds.length > 0
          ? `?accounts=${encodeURIComponent(accountIds.join(","))}`
          : "";
      const res = await fetch(`/api/wizard/pixels${qs}`, opts);
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

      const initRes = await fetch("/api/wizard/publish/init", { ...opts, method: "POST" });
      const { operationId } = await parseJson<{ operationId: string }>(initRes);

      const creativeStoragePaths = await uploadCreativesToWizardBucket(
        payload.creativeFiles,
        user.id,
        operationId
      );
      const body = { ...payload.snapshot, publishOperationId: operationId, creativeStoragePaths };

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

      const failedUnitLines = (rows: NonNullable<PublishResult["results"]>): string =>
        rows
          .filter((r) => !r.ok)
          .map(
            (r) =>
              `${r.accountName ?? "Conta"} — ${r.creativeName ?? "Criativo"}: ${r.error ?? "Erro desconhecido."}`
          )
          .join("\n");

      if (!res.ok) {
        const rows = json?.results;
        if (rows?.length) {
          const failed = rows.filter((r) => !r.ok);
          if (failed.length > 0) {
            const detail = failedUnitLines(rows);
            throw new Error(
              failed.length === rows.length ? detail : `Algumas unidades falharam:\n${detail}`
            );
          }
        }
        if (json?.error) throw new Error(json.error);
        const hint = raw.trim().slice(0, 280);
        throw new Error(hint || `Publicação falhou (${res.status}).`);
      }

      if (!json?.publishId) {
        throw new Error(json?.error ?? "Publicação falhou: resposta sem identificador.");
      }

      const okRows = json.results;
      if (okRows?.some((r) => !r.ok)) {
        const failed = okRows.filter((r) => !r.ok);
        const detail = failedUnitLines(okRows);
        throw new Error(
          failed.length === okRows.length ? detail : `Algumas unidades falharam:\n${detail}`
        );
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
