
## Root Cause Analysis & Full Deployment Audit

### What Was Causing NOT_FOUND on Vercel

The core issue is that Vercel treats every URL as a request for a real file on the server. Since this is a React SPA, only `index.html` physically exists — all other "pages" like `/farmers` or `/settings` are handled client-side by React Router. Without telling Vercel to redirect everything to `index.html`, refreshing or directly visiting any route returned a 404.

The `vercel.json` file was just created with the correct rewrite rule. That fixes the primary issue. However, the audit found two additional problems that will still cause broken behavior after deployment:

---

### Additional Issue 1 — Two pages exist but have NO registered routes

Comparing `src/pages/` files against `App.tsx` routes:

| Page File | Route in App.tsx |
|---|---|
| `SettlementList.tsx` | MISSING |
| `SettlementDetail.tsx` | MISSING |
| `ApplicationPending.tsx` | Not a route (it's a component rendered inline) — OK |

`SettlementList.tsx` navigates internally to `/settlements/:id` (line 93 of that file), meaning links inside the app point to routes that don't exist in the router. Clicking a settlement card or navigating to `/settlements` would hit the `*` catch-all and render `NotFound`.

### Additional Issue 2 — Missing `SettlementDetail` route

`SettlementList.tsx` calls `navigate('/settlements/${openSettlement.id}')` — so `SettlementDetail` must also be registered.

---

### What Will Be Changed

**`src/App.tsx`** — Add the two missing routes:
```tsx
import SettlementList from "./pages/SettlementList";
import SettlementDetail from "./pages/SettlementDetail";

// Inside <Routes>:
<Route path="/settlements" element={<ProtectedRoute><SettlementList /></ProtectedRoute>} />
<Route path="/settlements/:id" element={<ProtectedRoute><SettlementDetail /></ProtectedRoute>} />
```

---

### Summary of All Changes

| # | File | What | Why |
|---|---|---|---|
| 1 | `vercel.json` | Already created — rewrites all routes to `index.html` | Fixes NOT_FOUND on refresh/direct access |
| 2 | `src/App.tsx` | Add `/settlements` and `/settlements/:id` routes | Fixes broken internal navigation to settlement pages |

### Everything Else — Already Correct

| Item | Status |
|---|---|
| Supabase URL & anon key | Hardcoded correctly in `client.ts` — no env var issues |
| Vite build output | Default `dist/` — Vercel auto-detects this, no config needed |
| All other page files | Every file in `src/pages/` has a matching route in `App.tsx` |
| `public/_redirects` | Stays in place — handles Lovable preview, does not conflict with Vercel |
| React Router using `BrowserRouter` | Correct — works perfectly with Vercel rewrites |
| Cache headers | Already set correctly in `vercel.json` |

After these changes, every route in the app — including `/settlements`, `/farmers/:id`, `/settings` — will work on Vercel whether navigated to via a link, refreshed, or opened directly from a bookmark.
