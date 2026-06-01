import "server-only";

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { invalidateUserDataShortCache } from "@/libs/api/user-data-short-cache";
import { scheduleBackgroundWork } from "@/libs/api/schedule-background-work";
import {
  createAwaitingCreativesUploadJob,
  deleteUploadJob,
  getUploadJobStatus,
  markUploadJobError,
} from "@/libs/database/queries/upload-jobs";
import { listMetaAdAccountsByMetaIdsForUser } from "@/libs/database/queries/meta-ad-accounts";
import {
  buildMcpCampaignPreview,
  buildWizardPublishPayload,
  mcpCampaignArgsSchema,
} from "@/libs/mcp/build-publish-payload";
import { fetchCreativesFromUrls } from "@/libs/mcp/fetch-creatives-from-urls";
import { getMcpContext } from "@/libs/mcp/request-context";
import { mcpJsonText } from "@/libs/mcp/tool-result";
import { normalizeActId } from "@/libs/meta/graph-campaign-publish";
import {
  fetchUserFacebookPages,
  pageIdInUserPages,
} from "@/libs/meta/graph-user-pages";
import { getMetaGraphAccessToken } from "@/libs/meta/graph-token";
import { GraphApiError } from "@/libs/meta/graph-client";
import {
  humanizeMetaObjectNotFoundError,
  isMetaObjectNotFoundError,
} from "@/libs/meta/humanize-graph-publish-error";
import {
  adsetAndAdsCountsForWizardShape,
  wizardPublishPayloadSchema,
} from "@/libs/meta/map-wizard-to-graph";
import {
  runWizardPublish,
  type PublishUnitResult,
} from "@/libs/meta/publish-campaigns";
import { shouldDeferWizardPublish } from "@/libs/meta/publish-concurrency";
import { resolveMetaAppCredentials } from "@/libs/meta/resolve-app-credentials";
import { checkInFlightUploadJob } from "@/libs/wizard/upload-jobs-in-flight.server";

function orderSelectedAccounts(
  selectedRaw: string[],
  rows: Array<{ meta_account_id: string; name: string }>
): Array<{ meta_account_id: string; name: string }> {
  const byNorm = new Map(rows.map((r) => [normalizeActId(r.meta_account_id), r]));
  const seen = new Set<string>();
  const ordered: Array<{ meta_account_id: string; name: string }> = [];
  for (const raw of selectedRaw) {
    const n = normalizeActId(raw);
    if (seen.has(n)) continue;
    seen.add(n);
    const row = byNorm.get(n);
    if (row) ordered.push(row);
  }
  return ordered;
}

export function registerPublishTools(server: McpServer): void {
  server.tool(
    "prepare_campaign",
    "Assemble and validate a wizard publish payload from conversational args without publishing.",
    { campaign: mcpCampaignArgsSchema },
    async ({ campaign }) => {
      const { userId } = getMcpContext();
      const preview = buildMcpCampaignPreview(userId, campaign);
      return mcpJsonText({
        preview: {
          spendEstimate: preview.spendEstimate,
          publishOperationId: preview.publishOperationId,
          selectedAccountIds: preview.payload.selectedAccountIds,
          objective: preview.payload.objective,
          structure: preview.payload.structure,
          creativeCount: preview.payload.creatives.length,
        },
        payload: preview.payload,
        creativeUrls: preview.creativeUrls,
        nextStep:
          "Revise the preview, then call publish_campaign with confirm:true and the same campaign fields.",
      });
    }
  );

  server.tool(
    "publish_campaign",
    "Publish a Meta campaign via Kraken. Requires confirm:true. Poll get_publish_status with returned jobId.",
    {
      confirm: z.boolean(),
      campaign: mcpCampaignArgsSchema,
    },
    async ({ confirm, campaign }) => {
      if (!confirm) {
        return mcpJsonText({
          error: "Publicação recusada: confirme com confirm:true após rever prepare_campaign.",
        });
      }

      const { userId } = getMcpContext();

      const inFlight = await checkInFlightUploadJob(userId);
      if (!inFlight.ok) {
        return mcpJsonText({ error: inFlight.message || "in_flight_check_failed" });
      }
      if (inFlight.blockingId) {
        return mcpJsonText({
          error: "Já existe um envio em curso. Aguarde ou consulte get_publish_status.",
          blockingJobId: inFlight.blockingId,
        });
      }

      const jobRow = await createAwaitingCreativesUploadJob(userId, "MCP");

      if (!jobRow) {
        return mcpJsonText({ error: "Falha ao criar job de publicação." });
      }

      const operationId = jobRow.id;

      let payload;
      try {
        payload = buildWizardPublishPayload(userId, operationId, campaign);
      } catch (e) {
        await deleteUploadJob(userId, jobRow.id);
        const message = e instanceof Error ? e.message : "invalid_payload";
        return mcpJsonText({ error: message });
      }

      const parsed = wizardPublishPayloadSchema.safeParse(payload);
      if (!parsed.success) {
        await deleteUploadJob(userId, jobRow.id);
        return mcpJsonText({ error: "Invalid payload.", issues: parsed.error.flatten() });
      }

      const pageId =
        parsed.data.pageId?.trim() || process.env.META_DEFAULT_PAGE_ID?.trim();
      if (!pageId) {
        return mcpJsonText({
          error:
            "pageId é obrigatório (campo campaign.pageId ou META_DEFAULT_PAGE_ID no servidor).",
        });
      }

      const adLinkUrl =
        parsed.data.destinationUrl?.trim() ||
        process.env.META_AD_LINK_URL?.trim() ||
        "https://www.facebook.com/business";

      const tokenRes = await getMetaGraphAccessToken(userId);
      if ("error" in tokenRes) {
        return mcpJsonText({ error: tokenRes.error });
      }

      try {
        const userPages = await fetchUserFacebookPages(tokenRes.accessToken);
        if (!pageIdInUserPages(pageId, userPages)) {
          return mcpJsonText({
            error: "pageId inválido para as páginas acessíveis com este token Meta.",
          });
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : "pages_fetch_failed";
        return mcpJsonText({ error: `Validação de página falhou: ${message}` });
      }

      const normIds = Array.from(
        new Set(parsed.data.selectedAccountIds.map((id) => normalizeActId(id)))
      );
      const accountRows = await listMetaAdAccountsByMetaIdsForUser(userId, normIds);

      if (!accountRows.length || accountRows.length !== normIds.length) {
        return mcpJsonText({
          error: "Uma ou mais contas selecionadas não existem ou não pertencem ao utilizador.",
        });
      }

      const accountsOrdered = orderSelectedAccounts(parsed.data.selectedAccountIds, accountRows);

      let creativeFilesByIndex;
      try {
        creativeFilesByIndex = await fetchCreativesFromUrls(
          campaign.creatives.map((c) => ({ url: c.url, type: c.type }))
        );
      } catch (e) {
        const message = e instanceof Error ? e.message : "creative_fetch_failed";
        await markUploadJobError(userId, operationId, { v: 1, message });
        return mcpJsonText({ error: message });
      }

      const metaAppCredentials = await resolveMetaAppCredentials(userId);
      const { adsets } = adsetAndAdsCountsForWizardShape(
        parsed.data.structure,
        parsed.data.customStructure
      );

      const publishCtx = {
        userId,
        accessToken: tokenRes.accessToken,
        payload: parsed.data,
        creativeFilesByIndex,
        pageId,
        adLinkUrl,
        accounts: accountsOrdered,
        existingPublishJobId: operationId,
        metaAppCredentials,
      };

      let out: Awaited<ReturnType<typeof runWizardPublish>> | null = null;

      const executePublish = async () => {
        out = await runWizardPublish(publishCtx);
        invalidateUserDataShortCache(userId);
      };

      const runPublishWithJobError = async () => {
        try {
          await executePublish();
        } catch (e) {
          const message = e instanceof Error ? e.message : "publish_failed";
          await markUploadJobError(userId, operationId, { v: 1, message });
        }
      };

      try {
        if (shouldDeferWizardPublish(adsets)) {
          const deferred = await scheduleBackgroundWork(runPublishWithJobError);
          if (deferred) {
            return mcpJsonText({
              jobId: operationId,
              deferred: true,
              message:
                "Publicação em curso em segundo plano. Use get_publish_status(jobId) para acompanhar.",
            });
          }
        } else {
          await runPublishWithJobError();
        }

        if (!out) {
          const job = await getUploadJobStatus(userId, operationId);
          const errMsg =
            job?.status === "error" && job.error_details && typeof job.error_details === "object"
              ? String((job.error_details as { message?: string }).message ?? "publish_failed")
              : "Publicação não devolveu resultado.";
          return mcpJsonText({ jobId: operationId, error: errMsg });
        }

        const resolved = out as {
          publishId: string;
          results: PublishUnitResult[];
          warnings: string[];
        };
        const okCount = resolved.results.filter((r) => r.ok).length;
        return mcpJsonText({
          jobId: operationId,
          publishId: resolved.publishId,
          okCount,
          total: resolved.results.length,
          results: resolved.results,
          warnings: resolved.warnings,
          ...(okCount === 0
            ? { error: "Nenhuma publicação concluiu com sucesso no Meta." }
            : {}),
        });
      } catch (e) {
        let message = e instanceof Error ? e.message : "publish_failed";
        if (e instanceof GraphApiError && isMetaObjectNotFoundError(e)) {
          message = humanizeMetaObjectNotFoundError(e);
        }
        return mcpJsonText({ jobId: operationId, error: message });
      }
    }
  );
}
