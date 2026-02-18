
# Fix: Partner Pricing Formula Not Persisting Across Navigation / Sign-in

## Root Cause — Confirmed via Database

Querying the `pricing_formula` table shows only **2 rows**:
1. Global formula (`collection_center_id = null`)
2. A formula for center `56062f6b` (an unrelated center)

The ZAAGO-123 center (`3a1d1b79`) — which is the partner's center — has **no center-specific formula row**. This means:

- Every time the partner opens Settings, `usePricingFormula` falls back to the global formula (since no center-specific row exists)
- `useEnsureCenterFormula` runs and tries to INSERT a row for the partner's center, but this INSERT is **failing silently** — the error is caught but not surfaced
- When the partner edits values and presses "Save Formula", `useUpdatePricingFormula` also tries to find an existing row for the center — finds none — and tries to INSERT, which may also fail due to RLS
- The result: values always revert to global on page refresh / navigation

## Why the INSERT is Failing

The RLS policy added earlier allows partners to INSERT for their assigned center. However, there is a subtle issue with how `useEnsureCenterFormula` reads the global formula: it uses `select('*')` which **includes the `id` column** from the global row. If the INSERT accidentally includes `id` (it doesn't here), it would fail. But the real issue is likely a **race condition** or the RLS `WITH CHECK` clause not matching during the auto-initialization.

The more likely culprit: the RLS `USING` clause on the `pricing_formula` table for partners requires the row to have a `collection_center_id` that matches an assignment for `auth.uid()`. The global formula has `collection_center_id = null`, so partners **cannot read the global formula** through the existing policies. This means `useEnsureCenterFormula` fetches global with `select('*')` but gets `null` back (because the partner can't see global-scope rows), then inserts with all defaults — but this INSERT may still fail because the policy isn't granting INSERT when reading fails first.

The actual fix needed is:

**1. The existing RLS policy for partners should also allow them to READ the global formula** (so they can copy it). Currently, the only SELECT policy visible is the admin one.

**2. A safer fallback**: in `useEnsureCenterFormula`, if the global formula fetch returns `null`, use hardcoded defaults (which it already does), so this should work regardless.

**3. The real missing piece**: there is likely **no SELECT RLS policy for partners** on `pricing_formula` for their center-specific rows. Without a SELECT policy, after they INSERT their formula row, they can't READ it back — so `usePricingFormula` always falls through to the global formula fetch, which they also can't read → returns `null` → falls back to showing defaults.

## The Correct Fix

### Step 1 — Database Migration: Add proper RLS SELECT policy for partners

Two policies need to exist for partners on `pricing_formula`:

```sql
-- 1. Partners can READ their own center's formula
CREATE POLICY "Partners can read their center formula"
ON public.pricing_formula
FOR SELECT
TO authenticated
USING (
  collection_center_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.user_center_assignments
    WHERE user_center_assignments.center_id = pricing_formula.collection_center_id
    AND user_center_assignments.user_id = auth.uid()
  )
);

-- 2. Partners can also read the global formula (for copying defaults)
CREATE POLICY "All authenticated users can read global formula"
ON public.pricing_formula
FOR SELECT
TO authenticated
USING (
  collection_center_id IS NULL
);
```

The existing `"Partners can manage their center formula"` policy uses `FOR ALL` — but in Postgres RLS, `FOR ALL` does NOT automatically cover `FOR SELECT`. SELECT policies are evaluated separately. This is the core bug.

### Step 2 — Fix `useEnsureCenterFormula` to handle errors visibly

The hook silently ignores INSERT errors. It should log or handle them so we can debug in the future. More importantly, after successfully inserting, it should wait a tick before invalidating the query to avoid race conditions.

### Step 3 — Fix `useUpdatePricingFormula` to be resilient

Currently when finding an existing formula, it only searches by `is_active = true`. If the auto-ensure hook hasn't run yet, the save will try to INSERT a new row. We should ensure the INSERT in `useUpdatePricingFormula` always uses `centerId` (not `null`) for partners.

## Summary of Changes

### Database Migration (critical fix)

Add two SELECT policies to `pricing_formula`:
- Partners can SELECT rows where `collection_center_id` matches their assigned center
- All authenticated users can SELECT the global formula (`collection_center_id IS NULL`)

The previously added `FOR ALL` policy only covers INSERT/UPDATE/DELETE write operations for partners, NOT SELECT.

### `src/hooks/usePricingFormula.ts` — Minor improvements

- In `useEnsureCenterFormula`: log errors to console so failures are visible during development
- Add a small delay before query invalidation to avoid race conditions after INSERT

## Files to Modify

| File | Change |
|---|---|
| New migration | Add 2 SELECT RLS policies on `pricing_formula` for partner read access |
| `src/hooks/usePricingFormula.ts` | Improve error handling in `useEnsureCenterFormula` |

## Why This Will Work

Once the SELECT policies are added:
1. Partner opens Settings → `usePricingFormula` queries for `center_id = ZAAGO-123` → no row found → `useEnsureCenterFormula` runs INSERT → succeeds → query invalidates → refetch now finds center-specific row → partner sees their own formula
2. Partner edits values → saves → `useUpdatePricingFormula` finds center-specific row → updates it → partner sees updated values
3. Partner navigates away and back → React Query refetches → finds center-specific row → shows partner's saved values (NOT global)
4. Admin changes global → has no effect on the center-specific row for this partner

The partner's values will now correctly persist across page navigation and sign-in/sign-out.
