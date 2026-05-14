/** Normalized row before Meta / CSV (common commerce fields). */
export type ProductFeedRow = {
  id?: string;
  retailer_id?: string;
  title?: string;
  description?: string;
  availability?: string;
  condition?: string;
  price?: string;
  image_link?: string;
  brand?: string;
  google_product_category?: string;
  /** Shopify-style group id for variants */
  item_group_id?: string;
};

export type FeedValidationIssue = {
  rowIndex: number;
  field?: string;
  message: string;
  severity: "error" | "warning";
};

export type FeedAutoFix = {
  rowIndex: number;
  field: string;
  from: string;
  to: string;
};

export type ValidateFeedResult = {
  ok: boolean;
  issues: FeedValidationIssue[];
  fixes: FeedAutoFix[];
  /** Rows after applying conservative auto-fixes (availability casing, duplicate retailer_id suffix). */
  normalizedRows: ProductFeedRow[];
};

const AVAILABILITY_OK = new Set(["in stock", "out of stock", "preorder", "available for order", "discontinued"]);

function normalizeAvailability(raw: string | undefined): { value?: string; fixed?: string } {
  if (!raw?.trim()) return {};
  const t = raw.trim().toLowerCase();
  if (AVAILABILITY_OK.has(t)) return { value: t };
  if (t === "in_stock" || t === "instock") return { value: "in stock", fixed: raw };
  if (t === "out_of_stock") return { value: "out of stock", fixed: raw };
  return { value: undefined };
}

function hasPrice(row: ProductFeedRow): boolean {
  const p = row.price?.trim();
  return !!p && p !== "0" && p !== "0.00" && p !== "0,00";
}

function parsePriceMinor(price: string): number | null {
  const s = price.replace(/[^\d.,]/g, "").replace(",", ".");
  const n = Number.parseFloat(s);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

/**
 * Validates a list of product rows (already parsed from CSV/XML/JSON).
 * Auto-fixes: availability synonyms, duplicate `retailer_id` by suffixing `__dup{n}`.
 */
export function validateFeed(rows: ProductFeedRow[]): ValidateFeedResult {
  const issues: FeedValidationIssue[] = [];
  const fixes: FeedAutoFix[] = [];
  const normalizedRows: ProductFeedRow[] = rows.map((r) => ({ ...r }));
  const seenRetailer = new Map<string, number>();

  for (let i = 0; i < normalizedRows.length; i++) {
    const row = normalizedRows[i];
    if (!row) continue;

    const rid = (row.retailer_id ?? row.id)?.trim();
    if (!rid) {
      issues.push({ rowIndex: i, field: "retailer_id", message: "Falta id ou retailer_id.", severity: "error" });
    } else {
      const prev = seenRetailer.get(rid);
      if (prev !== undefined) {
        const newId = `${rid}__dup${i}`;
        fixes.push({ rowIndex: i, field: "retailer_id", from: rid, to: newId });
        row.retailer_id = newId;
        row.id = newId;
        issues.push({
          rowIndex: i,
          field: "retailer_id",
          message: `retailer_id duplicado (linha ${prev}); corrigido para ${newId}.`,
          severity: "warning",
        });
      } else {
        seenRetailer.set(rid, i);
      }
    }

    if (!row.title?.trim()) {
      issues.push({ rowIndex: i, field: "title", message: "Título em falta.", severity: "error" });
    }
    if (!row.description?.trim()) {
      issues.push({ rowIndex: i, field: "description", message: "Descrição em falta.", severity: "warning" });
    }

    const av = normalizeAvailability(row.availability);
    if (av.fixed) {
      fixes.push({ rowIndex: i, field: "availability", from: row.availability ?? "", to: av.value ?? "" });
      row.availability = av.value;
    } else if (row.availability?.trim() && !av.value) {
      issues.push({
        rowIndex: i,
        field: "availability",
        message: `availability inválido: ${row.availability}`,
        severity: "error",
      });
    } else if (!row.availability?.trim()) {
      issues.push({ rowIndex: i, field: "availability", message: "availability em falta.", severity: "error" });
    } else {
      row.availability = av.value;
    }

    if (!hasPrice(row)) {
      issues.push({ rowIndex: i, field: "price", message: "Preço em falta ou zero.", severity: "error" });
    } else {
      const minor = parsePriceMinor(row.price!);
      if (minor != null && minor <= 0) {
        issues.push({ rowIndex: i, field: "price", message: "Preço inválido (<= 0).", severity: "error" });
      }
    }

    if (!row.image_link?.trim()) {
      issues.push({ rowIndex: i, field: "image_link", message: "image_link em falta.", severity: "error" });
    } else {
      const u = row.image_link.trim();
      if (!/^https?:\/\//i.test(u)) {
        issues.push({ rowIndex: i, field: "image_link", message: "image_link deve ser http(s).", severity: "error" });
      }
    }

    if (!row.brand?.trim()) {
      issues.push({ rowIndex: i, field: "brand", message: "brand em falta.", severity: "warning" });
    }
    if (!row.google_product_category?.trim()) {
      issues.push({
        rowIndex: i,
        field: "google_product_category",
        message: "google_product_category em falta.",
        severity: "warning",
      });
    }

    if (!row.condition?.trim()) {
      issues.push({ rowIndex: i, field: "condition", message: "condition em falta (usar new/refurbished/used).", severity: "warning" });
    }
  }

  const ok = !issues.some((x) => x.severity === "error");
  return { ok, issues, fixes, normalizedRows };
}
