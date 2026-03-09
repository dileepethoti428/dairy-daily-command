

# Fix: Include `milk_type` in Milk Entry Insert

## Problem

The `useCreateMilkEntry` hook in `src/hooks/useMilkEntries.ts` does **not** include `milk_type` in the Supabase insert payload (lines 193-204), even though:
- The `MilkEntryFormData` interface has `milk_type`
- `MilkEntryAdd.tsx` passes `milk_type` correctly
- The unique constraint is now `(farmer_id, entry_date, session, milk_type)`

Since `milk_type` is always NULL in the DB, the constraint treats both cow and buffalo entries as duplicates.

## Fix

### `src/hooks/useMilkEntries.ts`
- Add `milk_type: entry.milk_type || null` to the `.insert({...})` call in `useCreateMilkEntry` (line ~203)
- Update the error message to say: `"An entry for this milk type already exists for this farmer in this session"`

### `src/pages/MilkEntryAdd.tsx`
- Update the duplicate warning dialog description (line 161) to mention that each farmer can have one **cow** entry and one **buffalo** entry per session (not just one entry total)

Two small edits, no new files.

