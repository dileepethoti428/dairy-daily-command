
# Fix: "Cannot coerce the result to a single JSON object" Error for Partners

## Root Cause

In `src/hooks/usePricingFormula.ts`, the `useUpdatePricingFormula` mutation uses `.single()` after both the `.update()` and `.insert()` calls:

```typescript
.update({ ... })
  .eq('id', existingFormula.id)
  .select()
  .single()   // <-- THROWS if RLS filters out the row

.insert({ ... })
  .select()
  .single()   // <-- THROWS if RLS filters out the row
```

The PostgREST method `.single()` throws an error **"Cannot coerce the result to a single JSON object"** whenever it receives 0 rows or more than 1 row. For **partners**, the RLS `USING` clause on `pricing_formula` restricts which rows are visible after the write. In some cases (e.g. the center assignment isn't immediately verifiable after insert, or multiple active formula rows exist), PostgREST returns 0 rows to `.single()`, causing the crash.

Admins don't hit this because their existing `"Admins can manage pricing formulas"` policy is unrestricted (FOR ALL with no row filter), so `.select().single()` always sees exactly 1 row.

## Fix

**Single file change**: `src/hooks/usePricingFormula.ts`

Replace both `.single()` calls with `.maybeSingle()`. This makes the mutation return `null` instead of throwing when 0 rows are returned, and the `onSuccess` handler still fires correctly since no error is thrown. The query cache invalidation in `onSuccess` ensures the UI refetches the updated formula regardless.

### Code change (lines 135–168):

```typescript
if (existingFormula) {
  // Update existing
  const { data, error } = await supabase
    .from('pricing_formula')
    .update({ ... })
    .eq('id', existingFormula.id)
    .select()
    .maybeSingle();   // changed from .single()
  
  if (error) throw error;
  return data;
} else {
  // Insert new
  const { data, error } = await supabase
    .from('pricing_formula')
    .insert({ ... })
    .select()
    .maybeSingle();   // changed from .single()
  
  if (error) throw error;
  return data;
}
```

## Why This Works

- `.maybeSingle()` returns `null` when 0 rows come back (RLS filtered them out post-write), but does NOT throw an error.
- The write (UPDATE/INSERT) still succeeds — only the `.select()` after it is affected by RLS visibility.
- `onSuccess` fires, invalidates `['pricing-formula']` query cache, and the UI refetches the correct formula.
- The "Pricing Formula Updated" toast appears correctly for partners.
- Admin behavior is unchanged — they still get the full row back via their unrestricted policy.

## Files Changed

| File | Change |
|---|---|
| `src/hooks/usePricingFormula.ts` | Replace `.single()` with `.maybeSingle()` on UPDATE and INSERT paths (2 lines) |

This is a minimal, targeted fix — no database changes, no RLS changes, no UI changes needed.
