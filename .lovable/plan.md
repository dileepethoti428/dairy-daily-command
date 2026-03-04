

# Allow Separate Cow & Buffalo Entries Per Session

## Problem

The unique constraint on `milk_entries` is `(farmer_id, entry_date, session)`. This means a farmer can only have ONE entry per session, even if they have both cow and buffalo milk to deliver separately.

## Solution

Update the unique constraint to include `milk_type`, so a farmer with "both" can have one cow entry AND one buffalo entry per session.

### Database Migration

Drop the existing constraint and create a new one:

```sql
ALTER TABLE public.milk_entries
  DROP CONSTRAINT milk_entries_farmer_date_session_unique;

ALTER TABLE public.milk_entries
  ADD CONSTRAINT milk_entries_farmer_date_session_type_unique
  UNIQUE (farmer_id, entry_date, session, milk_type);
```

### Files to Change

| File | Change |
|---|---|
| New migration SQL | Replace unique constraint to include `milk_type` |

That's it -- one constraint change, no code changes needed.

