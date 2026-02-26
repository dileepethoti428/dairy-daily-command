

# Adjust Fraud Warning Thresholds & Add "Other" Breed Option

## Changes

### 1. Lower the quantity warning thresholds

Currently warnings trigger at 120% (amber) and 150% (red) of expected yield. You want warnings to start as soon as the quantity exceeds the expected value.

**New thresholds in `src/hooks/useFarmerLivestock.ts`:**
- **Amber warning**: quantity exceeds expected by even 1 litre (i.e., quantity > expectedDailyLiters)
- **Red warning**: quantity exceeds 120% of expected (was 150%)

Example: If expected is 40L, then 41L triggers amber, 48L+ triggers red.

### 2. Add "Other" breed option for Cow (with custom name input)

Currently cow breeds only show "Gir". Add an "Other" option so users can enter a custom breed name -- same behavior that buffalo already has for "Other".

**Changes in `src/components/farmers/LivestockFields.tsx`:**
- Add `{ value: 'other', label: 'Other' }` to the `COW_BREEDS` array
- When "Other" is selected (for either cow or buffalo), show a text input below the dropdown asking for the custom breed name
- Store the custom name as the breed value (e.g., replace "other" with the typed name like "sahiwal" or "nili-ravi")
- Use a local state approach: select "other" to reveal the input, then update the breed field with the custom value on change

### Files to Change

| File | Change |
|---|---|
| `src/hooks/useFarmerLivestock.ts` | Lower amber threshold to 100% (any excess), red to 120% |
| `src/components/farmers/LivestockFields.tsx` | Add "Other" to cow breeds; show custom name input when "Other" is selected for either animal type |

