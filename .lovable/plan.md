

# Fix Vercel Deployment Configuration

## What's Wrong

Your current `vercel.json` has a few issues that can cause stale deployments and routing problems:

1. **Rewrite destination is `/index.html`** -- Vercel's modern config expects `"/"` (the root), not `"/index.html"`. Using `/index.html` can cause redirect loops or bypass Vercel's built-in static file serving.
2. **Redundant/complex header rules** -- The second header rule with a long regex pattern for file extensions is unnecessary since Vite already hashes all assets into `/assets/`. The regex can also interfere with Vercel's routing.
3. **`index.html` no-cache header** -- While well-intentioned, Vercel serves the entry point from its CDN edge and manages cache invalidation on deploy. This rule is harmless but unnecessary.

## What Will Change

### `vercel.json` -- simplified to:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/"
    }
  ]
}
```

**Key differences from current config:**
- Rewrite destination changed from `/index.html` to `/`
- Removed the complex file-extension regex header rule (Vite hashes everything under `/assets/` already)
- Removed the explicit `index.html` no-cache rule (Vercel handles this)
- Added `$schema` for editor autocompletion

### `public/_redirects` -- will be deleted

This file is a Netlify convention and has no effect on Vercel. Removing it avoids confusion.

## After Deployment

Once the changes are pushed to GitHub and Vercel redeploys:
- All routes (e.g. `/settings`, `/farmers/123`) will correctly load the SPA
- Hashed assets under `/assets/` remain cached long-term
- The HTML entry point will always serve the latest version
- To force-clear any lingering CDN cache on Vercel, you can go to your Vercel dashboard and trigger a **Redeploy** with the "Clear Build Cache" option checked

## Files to Change

| File | Action |
|---|---|
| `vercel.json` | Update to simplified config above |
| `public/_redirects` | Delete (Netlify-only, not used by Vercel) |

