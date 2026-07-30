module.exports = {
  // Netlify exposes the deploy context via CONTEXT ("production",
  // "deploy-preview", or "branch-deploy"). Comments only show on production.
  isProduction: process.env.CONTEXT === "production",
};
