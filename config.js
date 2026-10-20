// TrimKits web store configuration.
//
// Points at YOUR repository: https://github.com/p2w8999/Trims-kit-Ranks-shop
// Everything the site needs to talk to GitHub lives here.
window.STORE_CONFIG = {
  // GitHub repository that hosts this site, "owner/repo".
  repo: "p2w8999/Trims-kit-Ranks-shop",

  // Branch the Pages site publishes from.
  branch: "main",

  // Optional: a GitHub personal access token (classic "repo" scope, or a
  // fine-grained token with Contents: Read & write on this one repository).
  // With a token, Place Order commits the new order straight into
  // orders.json. Leave it empty ("") and the site falls back to a pre-filled
  // "new issue" page you can submit instead - no token needed, but the mod
  // only sees orders that end up in orders.json.
  //
  // SECURITY NOTE: a token embedded in a public page is visible to anyone.
  // Prefer the issue fallback, or use a fine-grained token limited to this
  // single repo and rotate it if it leaks.
  token: "",

  // Currency shown on the buttons. Everything is free - this is display only.
  currency: "USD"
};
