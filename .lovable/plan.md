
# Fix: Partner Pricing Formula Showing Global Values — True Root Cause Found

## The Actual Problem (Confirmed via Database)

All previous fixes were addressing the wrong layer. The real issue is a **missing center assignment**.

The partner `poori673@gmail.com` was approved but has **no row in `user_center_assignments`**:

```
user_id: c54659bb...
role: user
center_id: NULL  ← no assignment exists
```

Because there is no center assignment:
1. `CenterContext` loads — `userAssignedCenter` is `null` — `selectedCenter` is `null`
2. `Settings.tsx` passes `centerId={selectedCenter?.id ?? null}` → `null`
3. `PricingFormulaCard` receives `centerId=null` — the same as admin's global view
4. `useEnsureCenterFormula(null)` immediately returns (no-op for null)
5. The partner edits and saves to the **global formula** row (not their own center)
6. On refresh, they load the global formula — their changes are there only because they overwrote global

The `useApproveApplication` hook only grants a `user` role. **It never assigns the partner to a center.** This is the root cause of everything.

---

## Two-Part Fix

### Part 1 — Admin must be able to assign a center when approving a partner

The Partner Approvals page needs a "Assign Center" step. When the admin approves a partner, they should also be able to select which collection center to assign that partner to.

**Changes to `src/hooks/usePartnerApplications.ts`:**

Update `useApproveApplication` to accept an optional `centerId`. If provided, insert a row into `user_center_assignments` after approving:

```typescript
mutationFn: async ({ applicationId, userId, centerId }: { 
  applicationId: string; 
  userId: string; 
  centerId?: string;
}) => {
  // 1. Update application status (existing)
  // 2. Assign 'user' role (existing)
  // 3. NEW: If centerId provided, create center assignment
  if (centerId) {
    await supabase.from('user_center_assignments').upsert({
      user_id: userId,
      center_id: centerId,
      is_primary: true,
    }, { onConflict: 'user_id,center_id' });
  }
}
```

**Changes to `src/pages/PartnerApprovals.tsx`:**

When admin clicks "Approve", show a dialog asking them to select a collection center before confirming approval. The dialog should:
- Show a dropdown/select of all active collection centers
- Make center selection required
- Pass `centerId` to `useApproveApplication`

### Part 2 — Fix `Settings.tsx` for partners without a center (edge case safety)

Currently, when `selectedCenter` is null for a non-admin user, the `PricingFormulaCard` shows the global formula card (same as admin). This is wrong.

For partners/staff with no center assigned, show a clear message instead of the formula card: "No collection center assigned to your account. Please contact the administrator."

**Change in `src/pages/Settings.tsx`:**

```tsx
{isAdmin ? (
  <PricingFormulaCard centerId={null} centerName={null} />
) : selectedCenter ? (
  <PricingFormulaCard 
    centerId={selectedCenter.id} 
    centerName={selectedCenter.name} 
  />
) : (
  <Card>
    <CardContent>
      <p className="text-muted-foreground text-sm">
        No collection center assigned. Contact admin.
      </p>
    </CardContent>
  </Card>
)}
```

---

## Files to Modify

| File | Change |
|---|---|
| `src/hooks/usePartnerApplications.ts` | Update `useApproveApplication` to accept and handle `centerId` |
| `src/pages/PartnerApprovals.tsx` | Add center selection dialog on approve, pass centerId |
| `src/pages/Settings.tsx` | Guard formula card — only show when partner has a center |

## Database Migration

One new migration is needed: ensure `user_center_assignments` has a unique constraint on `(user_id, center_id)` so the upsert in `useApproveApplication` works cleanly. This may already exist — we will check and add if missing.

---

## What This Solves

- Partners who are newly approved get assigned to a specific center immediately
- Their `selectedCenter` will be non-null after login
- The pricing formula isolation (per-center rows) will work correctly
- Admin changes to global formula will never affect center-specific rows
- Partners navigating away and back will always see their own saved values

## Bonus: Assign Center to Existing Approved Partners

For already-approved partners with no center (like `poori673@gmail.com`), the admin can use the existing "Assign to Center" feature in the Partner Approvals approved tab. We will add an "Assign Center" button for approved partners who have no center assignment yet.
