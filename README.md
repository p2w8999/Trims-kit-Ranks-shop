# Trims Kit Ranks Shop — Website Setup

This folder is the **entire shop website**. It sells tab ranks, money, shards
and crate keys for **$0.00** and the Minecraft mod (TrimKits, `/buyranks`)
delivers everything in game.

Everything in this folder is ready to upload **as-is** — the settings already
point at your repository:

| Setting | Value (already set in `config.js`) |
|---|---|
| Repository | `p2w8999/Trims-kit-Ranks-shop` |
| Branch | `main` |
| Shop link (in game) | `https://p2w8999.github.io/Trims-kit-Ranks-shop/` |
| Orders file (mod reads) | `https://raw.githubusercontent.com/p2w8999/Trims-kit-Ranks-shop/main/orders.json` |

---

## Step 1 — Upload these files to GitHub

1. Open your repo: <https://github.com/p2w8999/Trims-kit-Ranks-shop>
2. Click **Add file → Upload files**.
3. Drag in **every file from this folder** (all 8):

   ```
   .nojekyll    app.js    catalog.json    config.js
   index.html   orders.json   README.md   style.css
   ```

   > `README.md` will replace the empty one already in the repo — that's
   > wanted. If GitHub hides `.nojekyll`, enable "show hidden files" in your
   > file explorer first, or create it on the repo page with
   > **Add file → Create new file** and name it exactly `.nojekyll` (empty).
4. Press **Commit changes**.

## Step 2 — Turn on GitHub Pages

1. In the repo: **Settings → Pages**.
2. Under *Build and deployment*: Source = **Deploy from a branch**.
3. Branch = **main**, folder = **/ (root)**, click **Save**.
4. Wait ~1 minute, then open:
   **<https://p2w8999.github.io/Trims-kit-Ranks-shop/>**
   — the shop should load with the catalog.

## Step 3 — Mod side (already done, nothing to configure)

The mod ships with defaults pointing at this exact repo, so `/buyranks` works
out of the box:

- `webstore.orders_url` = the raw `orders.json` above (polled every 5 minutes)
- `webstore.website_url` = the Pages link above (what `/buyranks` prints)

⚠️ **Only if your server already generated `config/trimskits.json` before this
update**: open it and change (or delete) these lines so the new defaults apply:

```json
"webstore": {
  "enabled": true,
  "orders_url": "https://raw.githubusercontent.com/p2w8999/Trims-kit-Ranks-shop/main/orders.json",
  "website_url": "https://p2w8999.github.io/Trims-kit-Ranks-shop/",
  "poll_interval_ticks": 6000
}
```

## Step 4 — (Optional) Instant delivery with a token

Without a token the site still works: **Place Order** opens a pre-filled
GitHub issue with the order JSON, and once you (or an Action) append it to
`orders.json`, the mod delivers it.

For **instant** delivery, give the site a token so it can commit orders
itself:

1. GitHub → **Settings → Developer settings → Personal access tokens**
   → **Fine-grained tokens → Generate new token**.
2. Repository access = **Only select repositories** → `Trims-kit-Ranks-shop`.
   Permissions = **Contents: Read and write**. Create it.
3. Paste the token into `config.js` in this folder:

   ```js
   token: "github_pat_..."
   ```

4. Re-upload `config.js` to the repo.

> ⚠️ The token is visible to anyone who views the page. Scope it to this one
> repo only and rotate it if it leaks. The issue fallback needs no token.

---

## How a purchase flows

1. Player runs `/buyranks` in game → clicks the website button → opens the shop.
2. They click **Buy** on items and type the **Minecraft username that should
   receive them** (checkout always asks).
3. **Place Order ($0.00)** writes one order per item into `orders.json`:
   `{"id":"...","user":"Notch","type":"rank","value":"vip"}`
4. The mod's next poll (5 min, or the *Web Store Deliveries* button in
   `/buyranks`, or the player's next relog) sees the new order and delivers:
   - `rank` → tab rank granted + equipped
   - `money` → credited to `/money`
   - `shards` → credited to shards
   - `keys` → crate key items (1-64)
5. Each order id is delivered **exactly once** — re-polling never duplicates.

## Editing what's for sale

`catalog.json` drives the grid. Each entry:

```json
{ "id": "vip", "name": "VIP", "icon": "💚", "type": "rank", "value": "vip",
  "description": "Very Important Player status." }
```

- `type` = `rank` | `money` | `shards` | `keys`
- `value` = rank id (vip, mvp_plus, legend...), an amount for money/shards,
  or 1-64 for keys
- every item displays as $0.00 — that's the point

## Troubleshooting

| Symptom | Fix |
|---|---|
| Page 404s | Pages not enabled yet (Step 2), or wait a minute after saving |
| Mod says "HTTP 404" fetching orders | `orders.json` not committed, or repo/branch name mismatch in `config/trimskits.json` |
| Order placed but nothing in game | Mod polls every 5 min — use the compass button in `/buyranks` or relog to force a check; check the server log for "Web store order ... not delivered" |
| Username rejected at checkout | Must be 3-16 letters, numbers or `_` |
