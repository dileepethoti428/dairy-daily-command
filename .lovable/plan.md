
# Daily Milk Entry Module - Implementation Plan

## Overview
This module implements the core daily milk collection workflow - the most-used feature of the app. Users will be able to add milk entries for farmers, view today's entries, and edit same-day entries.

## Database Schema Updates

### Modify `milk_entries` Table
The current table needs updates to match the requirements:

**Current columns**: `id`, `farmer_id`, `settlement_id`, `entry_date`, `session`, `quantity_liters`, `fat_percentage`, `snf_percentage`, `recorded_by`, `created_at`, `updated_at`

**Changes needed**:
- Add `center_id` (UUID, foreign key to collection_centers) - for filtering entries by center
- Add `rate_per_litre` (DECIMAL) - manual entry for pricing
- Add `total_amount` (DECIMAL) - client-calculated value stored for records
- Remove or make `session` nullable (prompt specifies one entry per farmer per day, not per session)
- Add unique constraint on `farmer_id + entry_date` to enforce one entry per farmer per day

---

## New Files to Create

### 1. Data Hooks (`src/hooks/useMilkEntries.ts`)
React Query hooks for milk entry operations:
- `useMilkEntries(date?, centerId?)` - fetch entries with farmer details
- `useMilkEntry(id)` - fetch single entry
- `useCreateMilkEntry()` - create new entry with duplicate detection
- `useUpdateMilkEntry()` - update existing entry
- `useTodayStats(centerId?)` - aggregated stats for dashboard

### 2. Add Milk Entry Screen (`src/pages/MilkEntryAdd.tsx`)
Main entry form with:
- Date display (today by default, editable only by admin)
- Searchable farmer selector (filters inactive farmers with warning)
- Numeric inputs for: Quantity (L), Fat (%), SNF (%), Rate per Litre
- Real-time total amount calculation
- Duplicate entry prevention
- Success flow with "Add Another" or "Go Home" options

### 3. Today's Entries Screen (`src/pages/TodayEntries.tsx`)
Daily summary view:
- Date selector (defaults to today)
- Summary card: Total milk (L), Total farmers, Total amount
- List of entries with: Farmer name, Quantity, Fat/SNF, Amount
- Tap entry to view details/edit

### 4. Milk Entry Detail Screen (`src/pages/MilkEntryDetail.tsx`)
Read-only view of an entry with:
- Farmer info summary
- Entry data (Quantity, Fat, SNF, Rate, Total)
- Edit button (enabled only for same-day entries)

### 5. Edit Milk Entry Screen (`src/pages/MilkEntryEdit.tsx`)
Edit form (same-day only):
- Pre-filled data
- Same validation as add form
- Confirmation before save
- Past entries show read-only view

### 6. Reusable Components
- `src/components/milk/FarmerSelector.tsx` - Searchable dropdown for farmer selection
- `src/components/milk/MilkEntryForm.tsx` - Reusable form for add/edit
- `src/components/milk/MilkEntrySummary.tsx` - Summary card component
- `src/components/milk/MilkEntryCard.tsx` - Entry list item

---

## Screen Flow Diagram

```text
                    +---------------+
                    |   Homepage    |
                    |  (Add Entry)  |
                    +-------+-------+
                            |
            +---------------+---------------+
            |                               |
            v                               v
    +-------+-------+               +-------+-------+
    |  Add Milk     |               | View Today's  |
    |  Entry        |               | Entries       |
    +-------+-------+               +-------+-------+
            |                               |
            v                               v
    +-------+-------+               +-------+-------+
    |   Success     |               |  Entry List   |
    | (Add Another  |               |  (tap entry)  |
    |  or Go Home)  |               +-------+-------+
    +---------------+                       |
                                            v
                                    +-------+-------+
                                    | Entry Detail  |
                                    |  (Edit btn)   |
                                    +-------+-------+
                                            |
                                            v (if same day)
                                    +-------+-------+
                                    | Edit Entry    |
                                    +---------------+
```

---

## Integration Points

### Homepage Updates (`src/pages/Index.tsx`)
- Wire "Add Entry" button to navigate to `/milk/add`
- Wire "View Today" button to navigate to `/milk/today`
- Update "Today's Snapshot" card to use real data from `useTodayStats()`

### Farmer Detail Updates (`src/pages/FarmerDetail.tsx`)
- Add "Add Milk Entry" button that navigates to `/milk/add?farmerId=xxx`
- Wire "Milk History" placeholder to navigate to farmer's entry history

### Navigation
- Add routes in `App.tsx`:
  - `/milk/add` - Add Milk Entry
  - `/milk/today` - Today's Entries  
  - `/milk/:id` - Entry Detail
  - `/milk/:id/edit` - Edit Entry

---

## Validation Rules

### Form Validation (Zod Schema)
```text
- farmer_id: required UUID
- quantity_litres: required, positive number, max 999.99
- fat: required, 0-15% range
- snf: required, 0-20% range  
- rate_per_litre: required, positive number
```

### Business Rules
- One entry per farmer per day (enforced via DB constraint + client check)
- Inactive farmer warning before allowing entry
- Edit only allowed on same day as entry_date
- Admin can change entry date; regular users cannot

---

## Technical Details

### UI Patterns (following existing conventions)
- Mobile-first card-based layout
- Large touch targets (h-14 buttons, tap-target class)
- Numeric keypad (`inputMode="numeric"`)
- Inline validation with error messages
- Toast notifications for success/error feedback
- Skeleton loaders during data fetch

### Real-time Calculation
```text
Total Amount = Quantity x Rate per Litre
```
Displayed prominently with currency symbol, updates as user types.

### State Management
- React Query for server state
- React Hook Form for form state
- URL params for farmer pre-selection

---

## Summary of Changes

| Category | Files |
|----------|-------|
| Database | 1 migration (add columns, unique constraint) |
| Hooks | 1 new file (`useMilkEntries.ts`) |
| Pages | 4 new files (Add, Today, Detail, Edit) |
| Components | 4 new files (Selector, Form, Summary, Card) |
| Updates | 3 files (App.tsx, Index.tsx, FarmerDetail.tsx) |
