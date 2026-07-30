module.exports = {
  // Cloudflare Pages exposes the branch being built via CF_PAGES_BRANCH.
  // Production is deployed from the `main` branch.
  isProduction: process.env.CF_PAGES_BRANCH === "main",
};
