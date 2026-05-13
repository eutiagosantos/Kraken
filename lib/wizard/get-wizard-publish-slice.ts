"use client";

import { useWizardStore } from "@/lib/stores/wizardStore";
import type { WizardPublishStateSlice } from "@/lib/wizard/build-wizard-publish-payload";

export function getWizardPublishSliceFromStore(): WizardPublishStateSlice {
  const w = useWizardStore.getState();
  return {
    pageId: w.pageId,
    selectedAccountIds: w.selectedAccountIds,
    creatives: w.creatives,
    campaignType: w.campaignType,
    budget: w.budget,
    budgetPeriod: w.budgetPeriod,
    bidStrategy: w.bidStrategy,
    bidLimit: w.bidLimit,
    roasTarget: w.roasTarget,
    objective: w.objective,
    pixelId: w.pixelId,
    status: w.status,
    structure: w.structure,
    customStructure: w.customStructure,
    nomenclaturePreview: w.nomenclaturePreview,
    publico: w.publico,
    campaignSchedule: w.campaignSchedule,
    adSetBillingEvent: w.adSetBillingEvent,
  };
}
