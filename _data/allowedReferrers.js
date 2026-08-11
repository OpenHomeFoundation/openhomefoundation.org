const { loadAllowedReferrers } = require("../config/referrers.js");

// Available to templates as `allowedReferrers`. loadAllowedReferrers() throws on
// an invalid entry, which fails the build — a bad list can never deploy.
//
// `json` is pre-stringified so templates don't need a JSON filter, and because
// every entry is validated down to [a-z0-9.-] it is safe to interpolate straight
// into a <script> block.
module.exports = () => {
  const list = loadAllowedReferrers();

  return {
    list,
    json: JSON.stringify(list),
  };
};
