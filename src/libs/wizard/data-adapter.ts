import type { WizardPublishPayloadInput } from "@/libs/meta/map-wizard-to-graph";
import { WIZARD_CREATIVES_BUCKET } from "@/libs/wizard/wizard-creatives-bucket";
import * as tus from "tus-js-client";
import type { MockAccount } from "@/libs/mock-data";
import {
  type WizardInterestOption,
  type WizardLocationOption,
  type WizardPixel,
  type WizardPreset,
} from "@/libs/mock-data/wizard";
import type { Publico } from "@/libs/stores/wizardStore";
import { tryBuildCatalogPublishPayload } from "@/libs/wizard/build-wizard-publish-payload";
import { getWizardPublishSliceFromStore } from "@/libs/wizard/get-wizard-publish-slice";
import type { PublishProgressEvent } from "@/libs/wizard/unified-publish-progress";

export type { PublishProgressEvent };

export interface PublishPayload {
  /** Validated server-side together with `creativeStoragePaths` after Supabase upload. */
  snapshot: WizardPublishPayloadInput;
  /** Same order as `snapshot.creatives` — uploaded to Storage before `POST /api/wizard/publish`. */
  creativeFiles: File[];
  onProgress?: (event: PublishProgressEvent) => void;
}

export type PublishResult = {
  publishId: string;
  /** HTTP 202 — Meta publish continues server-side; poll upload_jobs on the fila page. */
  deferred?: boolean;
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
  anonKey: string,
  onBytesProgress?: (bytesUploaded: number, bytesTotal: number) => void
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
      onProgress(bytesUploaded, bytesTotal) {
        onBytesProgress?.(bytesUploaded, bytesTotal);
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

async function fetchSupabaseStorageAccessToken(): Promise<string> {
  const res = await fetch("/api/auth/supabase-token", { credentials: "include" });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Sessão em falta. Inicia sessão para enviar ficheiros.");
  }
  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) {
    throw new Error("Sessão em falta. Inicia sessão para enviar ficheiros.");
  }
  return json.access_token;
}

async function fetchKrakenUserId(): Promise<string> {
  const res = await fetch("/api/profile", { credentials: "include" });
  if (!res.ok) {
    throw new Error("Sessão em falta. Inicia sessão para publicar.");
  }
  const json = (await res.json()) as { data?: { id?: string } };
  if (!json.data?.id) {
    throw new Error("Sessão em falta. Inicia sessão para publicar.");
  }
  return json.data.id;
}

async function uploadCreativesToWizardBucket(
  files: File[],
  userId: string,
  operationId: string,
  onProgress?: (event: PublishProgressEvent) => void
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

  const accessToken = await fetchSupabaseStorageAccessToken();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const base = `${userId}/${operationId}`;

  const paths = files.map((f, i) => `${base}/creative_${i}${extensionFromFileName(f.name)}`);
  const bytesTotal = files.reduce((sum, f) => sum + f.size, 0);
  const fileCount = files.length;
  let bytesBeforeCurrent = 0;

  onProgress?.({
    kind: "upload",
    bytesUploaded: 0,
    bytesTotal,
    fileIndex: fileCount > 0 ? 1 : 0,
    fileCount,
  });

  for (let i = 0; i < files.length; i++) {
    const file = files[i]!;
    const path = paths[i]!;
    try {
      await uploadFileTus(
        file,
        path,
        accessToken,
        supabaseUrl,
        anonKey,
        (fileUploaded) => {
          const aggregate = bytesBeforeCurrent + fileUploaded;
          onProgress?.({
            kind: "upload",
            bytesUploaded: aggregate,
            bytesTotal,
            fileIndex: i + 1,
            fileCount,
          });
        }
      );
      bytesBeforeCurrent += file.size;
      onProgress?.({
        kind: "upload",
        bytesUploaded: bytesBeforeCurrent,
        bytesTotal,
        fileIndex: i + 1,
        fileCount,
      });
    } catch (e) {
      const uploadedPaths = paths.slice(0, i);
      if (uploadedPaths.length > 0) {
        const cleanupRes = await fetch("/api/wizard/publish/storage-cleanup", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paths: uploadedPaths }),
        });
        if (!cleanupRes.ok) {
          console.warn("[wizard upload] cleanup failed after partial upload");
        }
      }
      throw e;
    }
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
      const emit = payload.onProgress;
      const userId = await fetchKrakenUserId();

      const catalogBody = tryBuildCatalogPublishPayload(getWizardPublishSliceFromStore());
      if (catalogBody) {
        emit?.({ kind: "preparing" });
        emit?.({ kind: "catalog" });
        const res = await fetch("/api/meta/catalog-publish", {
          ...opts,
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(catalogBody),
        });
        const raw = await res.text();
        type CatJson = {
          error?: string;
          ok?: boolean;
          warnings?: string[];
          results?: PublishResult["results"];
        };
        let json: CatJson | null = null;
        if (raw.trim()) {
          try {
            json = JSON.parse(raw) as CatJson;
          } catch {
            /* ignore */
          }
        }
        if (!res.ok) {
          throw new Error(
            json?.error ?? (raw.trim().slice(0, 280) || `catalog_publish_${res.status}`),
          );
        }
        const rows = json?.results;
        if (rows?.some((r) => !r.ok)) {
          const failed = rows.filter((r) => !r.ok);
          const detail = failed
            .map((r) => `${r.accountName ?? "Conta"}: ${r.error ?? "Erro"}`)
            .join("\n");
          const w = json?.warnings;
          const warnSuffix = w && w.length > 0 ? `\n\nAvisos:\n${w.join("\n")}` : "";
          throw new Error((failed.length === rows.length ? detail : `Algumas contas falharam:\n${detail}`) + warnSuffix);
        }
        emit?.({ kind: "done" });
        return {
          publishId: `catalog-${Date.now()}`,
          warnings: json?.warnings,
          results: json?.results,
        };
      }

      emit?.({ kind: "preparing" });
      const initRes = await fetch("/api/wizard/publish/init", { ...opts, method: "POST" });
      if (initRes.status === 409) {
        const body = (await initRes.json()) as { error?: string };
        throw new Error(body.error ?? "Já existe um envio em curso. Abre a fila de processamento.");
      }
      const { operationId } = await parseJson<{ operationId: string }>(initRes);

      const creativeStoragePaths = await uploadCreativesToWizardBucket(
        payload.creativeFiles,
        userId,
        operationId,
        emit
      );
      const body = { ...payload.snapshot, publishOperationId: operationId, creativeStoragePaths };

      emit?.({ kind: "publishing", done: 0, total: 0 });
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

      if (res.status === 202) {
        const publishId = json?.publishId ?? operationId;
        return {
          publishId,
          deferred: true,
        };
      }

      if (!res.ok) {
        if (process.env.NODE_ENV === "development") {
          console.error("[wizard/publish]", res.status, json ?? raw.slice(0, 2000));
        }
        const rows = json?.results;
        if (rows?.length) {
          const failed = rows.filter((r) => !r.ok);
          if (failed.length > 0) {
            const detail = failedUnitLines(rows);
            const w = json?.warnings;
            const warnSuffix = w && w.length > 0 ? `\n\nAvisos:\n${w.join("\n")}` : "";
            throw new Error(
              (failed.length === rows.length ? detail : `Algumas unidades falharam:\n${detail}`) + warnSuffix
            );
          }
        }
        if (json?.error) {
          const w = json?.warnings;
          const warnSuffix = w && w.length > 0 ? `\n\nAvisos:\n${w.join("\n")}` : "";
          throw new Error(json.error + warnSuffix);
        }
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
        const w = json.warnings;
        const warnSuffix = w && w.length > 0 ? `\n\nAvisos:\n${w.join("\n")}` : "";
        throw new Error(
          (failed.length === okRows.length ? detail : `Algumas unidades falharam:\n${detail}`) + warnSuffix
        );
      }

      emit?.({ kind: "done" });
      return {
        publishId: json.publishId,
        warnings: json.warnings,
        results: json.results,
      };
    },
  };
}

export const mockWizardDataAdapter = createFetchWizardDataAdapter();
