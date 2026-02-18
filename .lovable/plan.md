
# Three-Feature Implementation Plan

## Overview

This plan covers three independent improvements:
1. Partner sign-up with contact number and admin approval workflow
2. Per-collection-center pricing formula (editable by the partner assigned to that center)
3. Fix 404 error when refreshing any page

---

## Feature 1: Partner Sign-Up with Approval Workflow

### How it works today
Sign-up creates a Supabase auth user immediately and the user can log in straight away. There is no approval step.

### What changes

**Database (new table: `dairy_partner_applications`)**

A new table stores the pending partner application before an admin approves it. Fields:
- `id`, `user_id` (links to the auth user created at sign-up)
- `full_name`, `contact_number`, `email`
- `status` — `pending | approved | rejected`
- `rejection_reason` (optional)
- `reviewed_by`, `reviewed_at`
- `created_at`, `updated_at`

RLS: Users can only view their own application. Admins can view and update all applications.

**Sign-up page changes (`src/pages/Auth.tsx`)**
- Add a "Contact Number" field (10-digit Indian mobile validation)
- On successful Supabase sign-up, also insert a row into `dairy_partner_applications` with status `pending`
- After sign-up, show a "Application Submitted" screen instead of redirecting to home

**AuthContext changes (`src/contexts/AuthContext.tsx`)**
- After login, check the user's application status
- If `pending` → show "Your application is under review" screen
- If `rejected` → show "Your application was rejected" with the reason
- If `approved` (or user is admin) → allow normal app access

**New screen: Application Pending (`src/pages/ApplicationPending.tsx`)**
- Shows a status card with a clock/pending icon
- Message: "Your application is submitted and is being reviewed by an admin. You'll be able to log in once approved."
- Sign Out button

**Admin Dashboard: Partner Approval (`src/pages/PartnerApprovals.tsx`)**
- New page accessible only to admins (linked from Settings)
- Lists all pending applications with name, contact, email, submission date
- Approve button → sets status to `approved`, assigns the `user` role in `user_roles`
- Reject button → opens a dialog to enter rejection reason, sets status to `rejected`
- Tabs: Pending / Approved / Rejected

**ProtectedRoute changes**
- Intercept authenticated users who are not admins and whose application status is `pending` or `rejected`
- Redirect them to the pending/rejected screen

---

## Feature 2: Per-Partner Pricing Formula

### How it works today
Only admins can manage the pricing formula on the System Settings page. The formula is either global (no center) or center-specific, but staff cannot access it at all.

### What changes

**Access control change (`usePricingFormula.ts`)**
- The `useUpdatePricingFormula` mutation currently only writes to the global formula
- Update it to: if the logged-in user is staff with an assigned center, save/update the formula for *that specific center* (using `collection_center_id`)
- The read path already falls back to global → center-specific order (this is correct)

**Settings page changes (`src/pages/Settings.tsx`)**
- Add a "Pricing Formula" section visible to **all authenticated users** (not just admins)
- Staff see and edit the formula for their assigned center
- Admins see and edit the global formula (or per-center from System Settings)

**PricingFormulaCard changes (`src/components/settings/PricingFormulaCard.tsx`)**
- Accept an optional `centerId` and `isEditable` prop
- When `centerId` is provided, read/write to that center's formula
- Show a clear label "Formula for [Center Name]" vs "Global Formula"

**`useUpdatePricingFormula` hook changes**
- Accept a `centerId` parameter
- When saving, upsert the formula for that specific center (not global)
- This means a partner's formula is isolated to their center and does not affect other centers

---

## Feature 3: Fix 404 on Page Refresh

### Why this happens
The app uses React Router for client-side routing. When deployed as a static site (Lovable preview), refreshing a URL like `/farmers/123` causes the server to look for a file at that path — which doesn't exist — resulting in a 404.

### Fix
Add a `public/_redirects` file that redirects all routes to `index.html`, which is the standard fix for Netlify/Lovable-hosted SPAs:

```text
/* /index.html 200
```

This single line tells the server: for any URL that doesn't match a static file, serve `index.html` and let React Router handle the routing. The app already uses `BrowserRouter` so this is the correct approach.

---

## Technical Implementation Order

```text
Step 1 — Database migration
  └─ Create dairy_partner_applications table with RLS

Step 2 — Fix 404 (simplest, instant)
  └─ Add public/_redirects

Step 3 — Auth sign-up flow
  ├─ Update Auth.tsx (add phone field, submit application)
  └─ Create ApplicationPending.tsx page

Step 4 — Auth context approval check
  └─ Update AuthContext.tsx to check application status on login
  └─ Update ProtectedRoute.tsx to block pending/rejected users

Step 5 — Admin approval dashboard
  ├─ Create PartnerApprovals.tsx page
  ├─ Add hook: usePartnerApplications.ts
  └─ Link from Settings page (Admin section)

Step 6 — Per-partner pricing formula
  ├─ Update usePricingFormula.ts (centerId-aware mutation)
  ├─ Update PricingFormulaCard.tsx (accept centerId prop)
  └─ Add Pricing Formula section to Settings.tsx for all users
```

---

## Key Decisions

- **No new role is added** — the existing `app_role` enum has `user` for staff and `admin` for admins. Approving a partner grants them the `user` role in `user_roles`.
- **Application table is separate from `profiles`** — roles are never stored on the profile; this follows the security guideline.
- **Formula per center is non-destructive** — the global formula remains as fallback. A partner's center-specific formula overrides it for their center only.
- **Existing milk entries are unaffected** — formula changes only apply to new entries (as per original requirements).
