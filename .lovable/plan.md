
# Fix: Per-Center Pricing Formula Isolation

## The Problem

Currently there are two types of formula rows in the `pricing_formula` table:
- **Global** (`collection_center_id = null`) — the admin's default
- **Center-specific** (`collection_center_id = <id>`) — per-center overrides

The bug is in the **read path** of `usePricingFormula`:

```
1. Try to fetch center-specific formula for this center
2. If none found → fall back to the GLOBAL formula
```

So when a partner who has NO center-specific formula opens Settings, they see the **global** values. When they edit and save, the hook correctly writes a NEW center-specific row. This part works.

**But the remaining problems are:**

**Problem A — Admin overwrites partner data:** When the admin changes the global formula and a center has NOT yet saved their own formula, the partner sees the admin's changed values. Since the hook falls back to global, the partner is always seeing the admin's data until they save once.

**Problem B — Partner has no idea if they're seeing inherited or their own values:** There is no indication in the UI whether the currently shown formula belongs to the center or is inherited from global.

**Problem C — No auto-isolation:** Partners should have their own formula from the start, not share the global one silently.

---

## The Fix

### Strategy: Auto-create a center-specific formula on first load for partners

When a partner opens Settings and there is no center-specific formula yet, **automatically copy the global formula into a center-specific row** for their center. This creates full isolation immediately — once this happens, admin changes to global will NEVER affect that center again.

This approach means:
- Partners always see and edit THEIR OWN formula (never the global one)
- Admin changes to global don't affect any center that has already customized (or been auto-initialized)
- No database schema changes needed

---

## Implementation

### File 1: `src/hooks/usePricingFormula.ts`

Add a new `useEnsureCenterFormula` hook that auto-initializes a center-specific formula by copying from global if none exists.

Also add a helper to detect whether the formula being shown is "inherited" (global) vs. "own":

```typescript
export function useEnsureCenterFormula(centerId: string | null | undefined) {
  // When centerId is provided and no center-specific formula exists,
  // copy the global formula into a new center-specific row silently.
  // This runs once on mount if the center has no formula of its own.
}
```

The read hook `usePricingFormula` should also return a flag `isInherited: boolean` indicating whether the result came from the global fallback.

### File 2: `src/components/settings/PricingFormulaCard.tsx`

1. Call `useEnsureCenterFormula(centerId)` so that when a partner opens settings, their center gets its own formula row silently (copied from global).
2. Show a subtle informational notice when the formula was just initialized from the global template.
3. Show a clear label: "Your Center's Formula" (not "Global").

### File 3: `src/pages/Settings.tsx`

For **admins**, show two separate sections:
- The **Global Formula** card (no centerId) — clearly labelled as the default for centers without custom formulas
- Optionally indicate that changing global won't affect centers that already have their own formula

For **partners/staff**, only show their own center formula (current behavior, but now always isolated).

---

## Detailed Technical Steps

### Step 1 — Update `usePricingFormula` to return `isInherited`

Change the return type to include `isInherited`:

```typescript
export function usePricingFormula(centerId?: string | null) {
  return useQuery({
    queryKey: ['pricing-formula', effectiveCenterId],
    queryFn: async () => {
      if (effectiveCenterId) {
        const { data: centerFormula } = await supabase
          .from('pricing_formula')
          .select('*')
          .eq('collection_center_id', effectiveCenterId)
          .eq('is_active', true)
          .maybeSingle();
        
        if (centerFormula) return { formula: centerFormula, isInherited: false };
      }
      
      // Global fallback
      const { data: globalFormula } = await supabase
        .from('pricing_formula')
        .select('*')
        .is('collection_center_id', null)
        .eq('is_active', true)
        .maybeSingle();
      
      return { formula: globalFormula ?? null, isInherited: true };
    },
  });
}
```

### Step 2 — Add `useEnsureCenterFormula` hook

This hook auto-creates a center-specific formula row (by copying global) when a partner's center has no formula yet:

```typescript
export function useEnsureCenterFormula(centerId: string | null | undefined) {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    if (!centerId) return;
    
    async function ensureFormula() {
      // Check if center-specific formula exists
      const { data: existing } = await supabase
        .from('pricing_formula')
        .select('id')
        .eq('collection_center_id', centerId)
        .eq('is_active', true)
        .maybeSingle();
      
      if (existing) return; // already has own formula
      
      // Get global formula to copy from
      const { data: global } = await supabase
        .from('pricing_formula')
        .select('*')
        .is('collection_center_id', null)
        .eq('is_active', true)
        .maybeSingle();
      
      // Create center-specific formula (copy from global or use defaults)
      await supabase
        .from('pricing_formula')
        .insert({
          collection_center_id: centerId,
          fat_multiplier: global?.fat_multiplier ?? 6,
          snf_multiplier: global?.snf_multiplier ?? 2,
          constant_value: global?.constant_value ?? 6.8,
          mode: global?.mode ?? 'hybrid',
          is_active: true,
        });
      
      // Refresh the formula query
      queryClient.invalidateQueries({ queryKey: ['pricing-formula', centerId] });
    }
    
    ensureFormula();
  }, [centerId]);
}
```

### Step 3 — Update `PricingFormulaCard.tsx`

- Call `useEnsureCenterFormula(centerId)` at the top
- Update to read `{ data }` where `data` now has `{ formula, isInherited }` shape
- Show an info banner when `isInherited` is true: "This formula was copied from the global default. You can now customize it for your center."
- After `useEnsureCenterFormula` runs, `isInherited` will quickly flip to `false` as the center gets its own row

### Step 4 — Update `Settings.tsx` for admin view

Add a note under the admin's Global Formula card:
- "Changes here only affect centers that do not have their own custom formula."

Show the global formula card with `centerId={null}` for admins, making it explicit this is the global default.

For partners, pass their `selectedCenter?.id` as before (existing behavior, now always isolated).

---

## Result After Fix

| Scenario | Before Fix | After Fix |
|---|---|---|
| Partner opens Settings for first time | Sees global formula | Auto-copies global → now has own formula |
| Partner saves formula | Saves center-specific row | Same, but now guaranteed to be own row |
| Admin changes global formula | Affects ALL centers without custom formula (including partners who haven't saved yet) | Only affects centers with no formula at all (all active partner centers are auto-initialized) |
| Two partners from different centers | Could share same global values | Each center has its own independent row |
| Partner A saves, Partner B doesn't | Partner B still sees global | Partner B also auto-gets their own copy |

## Files Modified

| File | Change |
|---|---|
| `src/hooks/usePricingFormula.ts` | Update return shape to include `isInherited`, add `useEnsureCenterFormula` hook |
| `src/components/settings/PricingFormulaCard.tsx` | Use new hook and `isInherited` flag, show info banner, update data destructuring |
| `src/pages/Settings.tsx` | Add note for admin that global formula only affects centers without custom formula |
