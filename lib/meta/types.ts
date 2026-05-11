export type MetaLocationType = "country" | "region" | "city";

export type LocationOption = {
  value: string;
  label: string;
  type: MetaLocationType;
  key: string;
};

export type InterestOption = {
  value: string;
  label: string;
  audience_size?: number;
};

export type TargetingSearchRequest = {
  q: string;
};
export interface MetaAccount {
  id: string;
  name: string;
}

export interface MetaTokenValidationResult {
  valid: boolean;
  reason?: string;
}
