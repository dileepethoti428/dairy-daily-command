

## Fix Pricing Configuration Card Styling

The Pricing Configuration card exists in the code but has incorrect styling that makes it look different from your screenshot. Here's the plan to fix it:

### Current Issues
1. Card has `border-dashed` class making it look faded
2. Title has `text-muted-foreground` making the text gray instead of dark
3. DollarSign icon doesn't have the primary/orange color
4. Info icon used instead of a simple bullet point style
5. Badge positioning slightly different

### Changes to Make

**File: `src/pages/SystemSettings.tsx`**

Update the Pricing Configuration card (lines 211-235) to:
1. Remove `border-dashed` from the Card component
2. Remove `text-muted-foreground` from the CardTitle
3. Add `text-primary` to the DollarSign icon
4. Restructure the title to have proper flex layout with badge on the right
5. Replace Info icon with a bullet point character "◦"

### Expected Result
The card will display exactly like your screenshot:
- Normal card border (not dashed)
- Dollar sign icon in orange/primary color
- "Pricing Configuration" in normal dark text
- "Coming Soon" badge aligned to the right
- Bullet point "◦" instead of Info icon in the feature notice

