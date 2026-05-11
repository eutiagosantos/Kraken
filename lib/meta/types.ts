export interface MetaAccount {
  id: string;
  name: string;
}

export interface MetaTokenValidationResult {
  valid: boolean;
  reason?: string;
}
