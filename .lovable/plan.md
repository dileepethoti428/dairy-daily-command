
## Pricing Configuration - UPDATED TO FORMULA-BASED

The Pricing Configuration has been updated from slab-based to formula-based pricing.

### Formula
```
rate_per_litre = (FAT × fat_multiplier) + (SNF × snf_multiplier) − constant_value
total_amount = rate_per_litre × quantity
```

### Default Values
- fat_multiplier = 6
- snf_multiplier = 2
- constant_value = 6.8

### Pricing Modes
- **Manual**: Staff enters rate manually
- **Auto**: Rate is calculated and locked (cannot be changed)
- **Hybrid**: Rate is auto-calculated but editable

### Implementation Details
- Database table: `pricing_formula` with RLS policies
- Hook: `usePricingFormula.ts` with rate calculation utilities
- Components: 
  - `PricingFormulaCard.tsx` - Admin configuration screen
  - `RateBreakdown.tsx` - Shows calculation breakdown in milk entry form
- Milk entry form shows rate breakdown above rate input
