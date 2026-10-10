/**
 * Runtime configuration sourced from Vite env vars (`.env`, `.env.production`).
 * Mirrors the old Angular environment.ts / environment.prod.ts split.
 */
export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
  auth: {
    authority: import.meta.env.VITE_COGNITO_AUTHORITY,
    clientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
  },
} as const;
