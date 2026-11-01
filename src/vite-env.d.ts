/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GAS_API_URL?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_ALLOWED_DOMAIN?: string;
  readonly VITE_FORCE_DEMO?: string;
  readonly VITE_BASE_PATH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
