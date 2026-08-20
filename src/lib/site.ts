export const SITE_URL = "https://www.openhomefoundation.org";

export const DEFAULT_DESCRIPTION =
  "The Open Home Foundation fights for the principles of privacy, choice, and sustainability for smart homes. And for every person who lives in one. It does this by supporting the development of open source projects, and open connectivity and communication standards.";

// Netlify exposes the deploy context via CONTEXT ("production",
// "deploy-preview", or "branch-deploy"). Comments only show on production.
export const IS_PRODUCTION = process.env.CONTEXT === "production";
