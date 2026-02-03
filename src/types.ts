export interface GlobalOutputOptions {
  apiKey?: string;
  json: boolean;
  save?: string;
  quiet: boolean;
  verbose: boolean;
}

export interface ApiErrorShape {
  success?: boolean;
  error?: string | null;
  tx_id?: string | null;
}