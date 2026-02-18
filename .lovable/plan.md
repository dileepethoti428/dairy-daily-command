
# Fix: Vercel SPA 404 on Page Refresh / Direct Route Access

## Root Cause

Vercel does **not** read `public/_redirects` (that file is specific to Netlify/Lovable's hosting). When a user refreshes `/dashboard` or navigates directly to any route, Vercel looks for a physical file at that path on its CDN. Since this is a SPA — only `index.html` exists at the root — Vercel returns a **404**.

The fix is a `vercel.json` file in the project root that tells Vercel to rewrite all requests to `index.html`, while still serving real static assets (JS, CSS, images) directly.

---

## What Will Be Created

### `vercel.json` (new file in project root)

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/(.*)\\.(?:js|css|woff2?|png|jpg|jpeg|gif|svg|ico|webp)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/index.html",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-cache, no-store, must-revalidate"
        }
      ]
    }
  ]
}
```

#### What each section does:

| Section | Purpose |
|---|---|
| `rewrites` | Catches every URL and serves `index.html` — React Router then handles the route on the client side |
| `headers` on `/assets/(.*)` | Vite outputs hashed JS/CSS chunks into `/assets/` — these are permanently cacheable (`immutable`) |
| `headers` on static file extensions | Any other static files (fonts, images, icons) also get long cache |
| `headers` on `/index.html` | The HTML shell must **never** be cached so users always get the latest deploy |

#### Why `rewrites` instead of `redirects`?

- `redirects` would change the URL in the browser (e.g., `/dashboard` → `/index.html`) — breaking the app
- `rewrites` serves `index.html` **without changing the URL**, so React Router sees `/dashboard` and renders the correct page

---

## Files to Create / Modify

| File | Action | Description |
|---|---|---|
| `vercel.json` | Create | SPA rewrite rule + cache headers for Vercel |

No existing files need to be modified. The `public/_redirects` file can stay in place — it handles Lovable's preview hosting and does not conflict with Vercel.

---

## After Deploying

Once this file is pushed and Vercel rebuilds:
- Refreshing `/farmers`, `/settings`, `/reports`, or any other route will load correctly
- Direct URL access (e.g., from a bookmark or shared link) will work
- Static assets will be aggressively cached for performance
- `index.html` will always be fresh after each deploy
