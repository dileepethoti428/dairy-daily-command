
# Fix: Partner Pricing Formula + Account Deactivation

## Problem 1 — Partners Cannot Save Pricing Formula

The current RLS policy on the `pricing_formula` table only allows users with the `admin` role to INSERT or UPDATE rows. When a partner (who has the `user` role) tries to save their center's formula, Supabase blocks it with a row-level security violation error.

**Root Cause:** The policy `Admins can manage pricing formulas` uses `cmd: ALL` restricted to `has_role(auth.uid(), 'admin')`. Partners get blocked even when saving a formula for their own center.

**Fix:** Add a new RLS policy that lets any authenticated user insert or update a pricing formula row **only for a center they are assigned to**. This requires checking the `user_center_assignments` table to verify the user is actually assigned to that center.

---

## Problem 2 — No Account Deactivation Feature

There is no `is_active` flag on partner accounts. The admin cannot currently disable a partner's access without fully rejecting their application.

**Fix (two parts):**

**A. Database change** — Add an `is_active` boolean column (default `true`) to the `dairy_partner_applications` table. This tracks whether the account has been manually deactivated by an admin.

**B. Auth/UI changes:**
- `AuthContext.tsx` — after fetching application status, also check `is_active`. If the account is active = false, set a new `accountDeactivated` flag.
- `ProtectedRoute.tsx` — if `accountDeactivated` is true, show a new "Account Deactivated" screen instead of the app.
- `ApplicationPending.tsx` — add a third status variant `'deactivated'` that shows: "Your account has been deactivated. Contact customer care: +91-7842343642" with a Sign Out button.
- `PartnerApprovals.tsx` — in the Approved tab, add a "Deactivate" button per partner. In the Approved (but deactivated) state, show an "Activate" button to re-enable.
- `usePartnerApplications.ts` — add `useDeactivateAccount` and `useActivateAccount` mutation hooks.

---

## Technical Implementation

### Step 1 — Database Migration

Two SQL changes:

```sql
-- Add is_active column to dairy_partner_applications
ALTER TABLE public.dairy_partner_applications
ADD COLUMN is_active boolean NOT NULL DEFAULT true;

-- Add new RLS policy: partners can manage formula for their assigned center only
CREATE POLICY "Partners can manage their center formula"
ON public.pricing_formula
FOR ALL
TO authenticated
USING (
  collection_center_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.user_center_assignments
    WHERE user_center_assignments.center_id = pricing_formula.collection_center_id
    AND user_center_assignments.user_id = auth.uid()
  )
)
WITH CHECK (
  collection_center_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.user_center_assignments
    WHERE user_center_assignments.center_id = pricing_formula.collection_center_id
    AND user_center_assignments.user_id = auth.uid()
  )
);
```

This policy ensures:
- Partners can only touch formulas for centers they are assigned to (not global formula)
- Admins still have their existing ALL policy covering everything
- A partner cannot set another center's formula

### Step 2 — `usePartnerApplications.ts`

Add two new mutation hooks:

- `useDeactivateAccount(applicationId)` — sets `is_active = false`
- `useActivateAccount(applicationId)` — sets `is_active = true`

### Step 3 — `AuthContext.tsx`

Extend `fetchApplicationStatus` to also read `is_active` from the result. Add a new state `accountDeactivated: boolean` (exported in context). If `is_active` is false, set `accountDeactivated = true`.

### Step 4 — `ProtectedRoute.tsx`

Add a check: if `accountDeactivated` is true and user is not admin → render `<ApplicationPending status="deactivated" />`.

### Step 5 — `ApplicationPending.tsx`

Add `'deactivated'` as a valid status prop. Show:
- Red/gray icon (ShieldOff)
- Title: "Account Deactivated"
- Message: "Your account has been deactivated. Please contact customer care for assistance."
- Contact button: `tel:+91-7842343642` showing "+91-7842343642"
- Sign Out button

### Step 6 — `PartnerApprovals.tsx`

In the Approved applications tab, each `ApplicationCard` gets two new action buttons:
- **Deactivate** (shown when `is_active = true`) — red/destructive outline button
- **Activate** (shown when `is_active = false`) — green button

Show a visual badge ("Deactivated") on cards where `is_active = false` so it's clear at a glance.

The `PartnerApplication` TypeScript type in `usePartnerApplications.ts` gets a new field: `is_active: boolean`.

---

## Files Modified

| File | Change |
|---|---|
| `supabase/migrations/...` | Add `is_active` column + new RLS policy for pricing_formula |
| `src/hooks/usePartnerApplications.ts` | Add `is_active` to type, add `useDeactivateAccount` + `useActivateAccount` hooks |
| `src/contexts/AuthContext.tsx` | Read `is_active`, expose `accountDeactivated` in context |
| `src/components/ProtectedRoute.tsx` | Block deactivated accounts |
| `src/pages/ApplicationPending.tsx` | Add `deactivated` status variant with support contact |
| `src/pages/PartnerApprovals.tsx` | Add Deactivate/Activate buttons in Approved tab |

---

## Key Notes

- Existing approved partners are unaffected (default `is_active = true`)
- Deactivation does NOT remove the `user` role — it just blocks app access via the pending screen
- Admins are never blocked regardless of any flag
- The partner pricing formula fix is purely a database policy change — no hook logic needs to change because the hook already correctly passes `centerId` when saving
