export type PolishApiSuccess = {
  result: string;
  error?: never;
};

export type PolishApiError = {
  error: string;
  result?: never;
};

/** Shared response contract for POST /api/polish. */
export type PolishApiResponse = PolishApiSuccess | PolishApiError;
