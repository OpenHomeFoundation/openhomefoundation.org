export const SITE_URL = "https://www.openhomefoundation.org";

export const SITE_NAME = "Open Home Foundation";

export const THEME_COLOR = "#09293B";

export const MASTODON_PROFILE_URL = "https://fosstodon.org/@openhomefoundation";

export const DEFAULT_DESCRIPTION =
  "The Open Home Foundation fights for privacy, choice, and sustainability in the smart home, supporting open source projects like Home Assistant and ESPHome.";

// Netlify exposes the deploy context via CONTEXT ("production",
// "deploy-preview", or "branch-deploy"). Comments only show on production.
export const IS_PRODUCTION = process.env.CONTEXT === "production";
