
# Livestock Details & Fraud Detection for Farmers

## Overview

Add livestock inventory tracking to each farmer (type of animal, breed, count, expected daily yield) and use that data during milk entry to detect quantity fraud by comparing actual milk received against expected capacity.

## Why This Matters

- Your company only accepts **Buffalo** and **Gir Cow** milk
- By recording how many animals a farmer owns and their expected daily yield, you can automatically flag entries where the quantity is suspiciously high (possible mixing with Jersey/HF milk or bringing milk from outside)
- If a farmer has **both** cow and buffalo, milk must be collected separately per animal type

---

## Database Changes

### New table: `farmer_livestock`

Stores each animal type a farmer owns with breed, count, and expected daily yield.

| Column | Type | Description |
|---|---|---|
| id | uuid (PK) | Auto-generated |
| farmer_id | uuid (FK -> farmers) | The farmer |
| animal_type | text | "cow" or "buffalo" |
| breed | text | "gir" for cow, "murrah" / "jafarabadi" / etc. for buffalo |
| animal_count | integer | How many of this type |
| expected_daily_liters | numeric | Expected total daily milk from all animals of this type |
| created_at / updated_at | timestamptz | Timestamps |

RLS policies will match the existing farmers table policies (authenticated users can read/write).

**No changes to the `farmers` table** -- the existing `milk_type` field (cow/buffalo/both) stays as-is, and the livestock details live in the new table.

---

## Farmer Registration Form Changes

### `src/components/farmers/FarmerForm.tsx`

After the existing "Milk Type" selector, add a new **Livestock Details** card section:

- When milk type is **cow**: show one livestock entry for cow
- When milk type is **buffalo**: show one livestock entry for buffalo
- When milk type is **both**: show two livestock entry sections (one for cow, one for buffalo)

Each livestock entry section contains:
- **Breed** dropdown:
  - For cow: "Gir" (only accepted breed -- if the farmer has other breeds, they should know only Gir milk is accepted)
  - For buffalo: "Murrah", "Jafarabadi", "Surti", "Mehsani", "Other"
- **Number of Animals** (numeric input)
- **Expected Daily Milk (litres)** per animal type (numeric input -- total for all animals of that type)

A note/banner will be shown: "We only accept Gir cow and Buffalo milk. Please ensure the breed information is accurate."

### Form validation (Zod):
- Breed is required
- Animal count must be >= 1
- Expected daily litres must be > 0

### Data flow:
- On submit, the farmer is created first (existing flow), then livestock rows are inserted into `farmer_livestock` using the new farmer's ID
- On edit, existing livestock rows are fetched, updated, or replaced

---

## Milk Entry Form Changes

### `src/components/milk/MilkEntryForm.tsx`

When a farmer is selected:

1. **Fetch the farmer's livestock data** from `farmer_livestock`
2. **Display a "Farmer Info" card** below the farmer selector showing:
   - Animal type(s), breed(s), count, and expected daily litres
   - e.g. "Gir Cow x 3 -- Expected: 15 L/day" and "Murrah Buffalo x 2 -- Expected: 12 L/day"

3. **If farmer has milk_type = "both"**:
   - Add a **"Milk Type for this entry"** toggle (Cow / Buffalo) so that each entry is tagged to one animal type
   - This uses the existing `session` logic but adds clarity about which animal's milk is being recorded
   - The milk_entries table will need a new column `milk_type` (text, nullable) to store "cow" or "buffalo" per entry

4. **Quantity fraud warning**:
   - Compare the entered `quantity_liters` against the farmer's `expected_daily_liters` for that animal type
   - If quantity exceeds **120%** of expected daily litres: show an **amber warning** ("Quantity is 30% higher than expected daily yield of 15L for Gir Cow")
   - If quantity exceeds **150%** of expected daily litres: show a **red warning** ("Quantity is significantly higher than expected. Please verify.")
   - These are warnings only (not blocking) -- staff can still save the entry

### `milk_entries` table change:
- Add column `milk_type` (text, nullable, default null) -- stores "cow" or "buffalo" for farmers who have both

---

## Farmer Detail Page Changes

### `src/pages/FarmerDetail.tsx`

Add a **Livestock Details** card between the summary card and bank details card:
- Shows animal type, breed, count, and expected daily litres for each livestock entry
- If no livestock data: "No livestock details recorded"

---

## New Hook

### `src/hooks/useFarmerLivestock.ts`

- `useFarmerLivestock(farmerId)` -- fetches livestock rows for a farmer
- `useCreateFarmerLivestock()` -- inserts livestock rows
- `useUpdateFarmerLivestock()` -- updates livestock rows

---

## Files to Change

| File | Change |
|---|---|
| **Migration SQL** | Create `farmer_livestock` table + RLS policies; add `milk_type` column to `milk_entries` |
| `src/hooks/useFarmerLivestock.ts` | New hook for CRUD on farmer_livestock |
| `src/components/farmers/FarmerForm.tsx` | Add Livestock Details section with breed, count, expected yield fields |
| `src/pages/FarmerAdd.tsx` | After farmer creation, insert livestock rows |
| `src/pages/FarmerEdit.tsx` | Load and save livestock data alongside farmer data |
| `src/pages/FarmerDetail.tsx` | Display livestock info card |
| `src/components/milk/MilkEntryForm.tsx` | Show farmer livestock info, add milk_type selector for "both" farmers, quantity fraud warnings |
| `src/components/milk/FarmerSelector.tsx` | Pass livestock data alongside farmer selection |
| `src/components/ui/value-warning.tsx` | Add quantity warning helper function |

---

## Fraud Detection Logic (in MilkEntryForm)

```text
expectedLitres = farmer_livestock.expected_daily_liters for selected animal type
warningThreshold = expectedLitres * 1.2  (20% over)
dangerThreshold  = expectedLitres * 1.5  (50% over)

if quantity > dangerThreshold:
  RED warning: "Quantity ({quantity}L) is significantly above expected yield ({expectedLitres}L). Possible fraud -- verify source."
else if quantity > warningThreshold:
  AMBER warning: "Quantity ({quantity}L) is above expected daily yield ({expectedLitres}L). Please verify."
```

This is non-blocking -- staff can still save but are alerted to investigate.
