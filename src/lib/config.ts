// Centralized, typed config loaded from VITE_* env vars.
// Edit values via .env (see .env.example for the full list).

const bool = (v: string | undefined, fallback = false) =>
  v == null || v === "" ? fallback : v === "true" || v === "1";

const str = (v: string | undefined, fallback = "") => (v == null || v === "" ? fallback : v);

const num = (v: string | undefined, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const e = import.meta.env;

export const config = {
  app: {
    name: str(e.VITE_APP_NAME, "Auralis"),
    description: str(e.VITE_APP_DESCRIPTION, "Modern premium music streaming"),
    url: str(e.VITE_APP_URL, "http://localhost:5173"),
    logoText: str(e.VITE_LOGO_TEXT, "Auralis"),
  },
  ui: {
    glassmorphism: bool(e.VITE_ENABLE_GLASSMORPHISM, true),
    animations: bool(e.VITE_ENABLE_ANIMATIONS, true),
  },
  seo: {
    title: str(e.VITE_META_TITLE, "Auralis — Premium music streaming"),
    description: str(e.VITE_META_DESCRIPTION, "Modern, fast, beautiful music streaming"),
    keywords: str(e.VITE_META_KEYWORDS, "music,streaming,audio,playlists"),
  },
  auth: {
    email: bool(e.VITE_AUTH_EMAIL, true),
    google: bool(e.VITE_AUTH_GOOGLE, true),
    github: bool(e.VITE_AUTH_GITHUB, false),
    microsoft: bool(e.VITE_AUTH_MICROSOFT, false),
  },
  donation: {
    provider: str(e.VITE_DONATION_PROVIDER, "paypal") as "paypal" | "kofi" | "",
    link: str(e.VITE_DONATION_LINK, ""),
    label: str(e.VITE_DONATION_LABEL, "Support Auralis"),
  },
  audio: {
    hifi: bool(e.VITE_ENABLE_HIFI, true),
    crossfade: bool(e.VITE_ENABLE_CROSSFADE, true),
    crossfadeSeconds: num(e.VITE_CROSSFADE_SECONDS, 4),
    visualizer: bool(e.VITE_ENABLE_VISUALIZER, true),
    deviceSwitching: bool(e.VITE_ENABLE_DEVICE_SWITCHING, true),
  },
  features: {
    lyrics: bool(e.VITE_ENABLE_LYRICS, true),
    social: bool(e.VITE_ENABLE_SOCIAL, true),
    downloads: bool(e.VITE_ENABLE_DOWNLOADS, true),
    uploads: bool(e.VITE_ENABLE_UPLOADS, true),
  },
  catalog: {
    audiusApp: str(e.VITE_AUDIUS_APP_NAME, "auralis"),
  },
  legal: {
    companyName: str(e.VITE_COMPANY_NAME, "Auralis Labs"),
    companyEmail: str(e.VITE_COMPANY_EMAIL, "hello@auralis.app"),
    supportEmail: str(e.VITE_SUPPORT_EMAIL, "support@auralis.app"),
  },
  analytics: { enabled: bool(e.VITE_ENABLE_ANALYTICS, false) },
};

export type Config = typeof config;
