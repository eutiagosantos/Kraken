import { getFromCache, setInCache } from "@/lib/meta/cache";
import type { InterestOption, LocationOption, MetaLocationType } from "@/lib/meta/types";

const GRAPH_VERSION = "v20.0";
const GRAPH_URL = `https://graph.facebook.com/${GRAPH_VERSION}`;
const DEFAULT_LOCALE = "pt_BR";
const LOCATIONS_CACHE_TTL_MS = 1000 * 60 * 30;
const INTERESTS_CACHE_TTL_MS = 1000 * 60 * 30;
const SEARCH_LIMIT = 20;

type MetaSearchResponse<T> = {
  data?: T[];
};

type MetaLocation = {
  key?: string;
  name?: string;
  type?: string;
  country_code?: string;
};

type MetaInterest = {
  id?: string;
  name?: string;
  audience_size?: number;
};

function getSystemUserToken() {
  const token = process.env.META_SYSTEM_USER_TOKEN;
  if (!token) {
    throw new Error("META_SYSTEM_USER_TOKEN is missing.");
  }
  return token;
}

function normalizeLocationType(type?: string): MetaLocationType {
  if (type === "country") return "country";
  if (type === "region") return "region";
  return "city";
}

function buildLocationLabel(location: MetaLocation) {
  const name = location.name ?? "Sem nome";
  const type = normalizeLocationType(location.type);

  if (type === "country" && location.country_code) {
    return `${location.country_code.toUpperCase()} - ${name}`;
  }

  const typeLabel = type === "region" ? "Regiao" : "Cidade";
  return `${name} (${typeLabel})`;
}

async function fetchMeta<T>(url: URL): Promise<T> {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Meta API error ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function searchTargetingLocations(query: string): Promise<LocationOption[]> {
  const normalizedQuery = query.trim().toLowerCase();
  const cacheKey = `meta:locations:${normalizedQuery}`;
  const cached = getFromCache<LocationOption[]>(cacheKey);
  if (cached) return cached;

  const token = getSystemUserToken();
  const url = new URL(`${GRAPH_URL}/search`);
  url.searchParams.set("type", "adgeolocation");
  url.searchParams.set("location_types", JSON.stringify(["country", "region", "city"]));
  url.searchParams.set("q", query.trim());
  url.searchParams.set("limit", String(SEARCH_LIMIT));
  url.searchParams.set("locale", DEFAULT_LOCALE);
  url.searchParams.set("access_token", token);

  const payload = await fetchMeta<MetaSearchResponse<MetaLocation>>(url);
  const result =
    payload.data?.flatMap((item) => {
      if (!item.key || !item.name) return [];
      const type = normalizeLocationType(item.type);
      return [
        {
          value: item.key,
          key: item.key,
          type,
          label: buildLocationLabel(item),
        },
      ];
    }) ?? [];

  setInCache(cacheKey, result, LOCATIONS_CACHE_TTL_MS);
  return result;
}

export async function searchTargetingInterests(query: string): Promise<InterestOption[]> {
  const normalizedQuery = query.trim().toLowerCase();
  const cacheKey = `meta:interests:${normalizedQuery}`;
  const cached = getFromCache<InterestOption[]>(cacheKey);
  if (cached) return cached;

  const token = getSystemUserToken();
  const url = new URL(`${GRAPH_URL}/search`);
  url.searchParams.set("type", "adinterest");
  url.searchParams.set("q", query.trim());
  url.searchParams.set("limit", String(SEARCH_LIMIT));
  url.searchParams.set("locale", DEFAULT_LOCALE);
  url.searchParams.set("access_token", token);

  const payload = await fetchMeta<MetaSearchResponse<MetaInterest>>(url);
  const result =
    payload.data?.flatMap((item) => {
      if (!item.id || !item.name) return [];
      return [
        {
          value: item.id,
          label: item.name,
          audience_size: item.audience_size,
        },
      ];
    }) ?? [];

  setInCache(cacheKey, result, INTERESTS_CACHE_TTL_MS);
  return result;
}
