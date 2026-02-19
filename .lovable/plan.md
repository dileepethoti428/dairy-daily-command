
# Add Bank Details to Partner Registration

## Overview

When a new partner registers ("Become a Partner"), the form will now also collect their bank account information. This data is stored in the `dairy_partner_applications` table so admins can view it during the approval process.

## What Fields Will Be Added

The following bank detail fields will be added to the registration form:

- **Account Holder Name** — The name on the bank account (required)
- **Account Number** — Bank account number (required)
- **IFSC Code** — Indian bank branch code, validated to 11-character standard format (required)
- **Bank Name** — Name of the bank (required)

## Database Change (Migration)

Four new nullable columns will be added to `dairy_partner_applications`:

```sql
ALTER TABLE public.dairy_partner_applications
  ADD COLUMN IF NOT EXISTS bank_account_holder_name TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
  ADD COLUMN IF NOT EXISTS bank_ifsc TEXT,
  ADD COLUMN IF NOT EXISTS bank_name TEXT;
```

Nullable so existing pending/approved applications are not broken.

---

## Files to Modify

### 1. New migration file
Adds the four bank detail columns to `dairy_partner_applications`.

### 2. `src/hooks/usePartnerApplications.ts`
Update the `PartnerApplication` interface to include the four new optional fields:

```typescript
bank_account_holder_name: string | null;
bank_account_number: string | null;
bank_ifsc: string | null;
bank_name: string | null;
```

### 3. `src/pages/Auth.tsx`

**New state variables:**
```typescript
const [bankAccountHolderName, setBankAccountHolderName] = useState('');
const [bankAccountNumber, setBankAccountNumber] = useState('');
const [bankIfsc, setBankIfsc] = useState('');
const [bankName, setBankName] = useState('');
```

**Validation (added to `validateForm`):**
- Account Holder Name: required, non-empty
- Account Number: required, 9–18 digits
- IFSC Code: required, matches `/^[A-Z]{4}0[A-Z0-9]{6}$/`
- Bank Name: required, non-empty

**New form section** (shown only in registration mode, below Contact Number, above Email — grouped under a "Bank Details" heading with a separator):

```
── Bank Details ──────────────────────

Account Holder Name      [Input]
Account Number           [Input]
IFSC Code                [Input - uppercase auto]
Bank Name                [Input]
```

**On submit**, the four values are added to the `dairy_partner_applications` insert:
```typescript
bank_account_holder_name: bankAccountHolderName,
bank_account_number: bankAccountNumber,
bank_ifsc: bankIfsc,
bank_name: bankName,
```

**On "Back to Login" reset**, clear the four new state values.

### 4. `src/pages/PartnerApprovals.tsx`

In `ApplicationCard`, add a "Bank Details" section below the contact/email fields so the admin can see it when reviewing:

```tsx
{application.bank_account_holder_name && (
  <div className="rounded-md bg-muted/50 border px-3 py-2 space-y-1">
    <p className="text-xs font-medium text-foreground">Bank Details</p>
    <p className="text-xs text-muted-foreground">Holder: {application.bank_account_holder_name}</p>
    <p className="text-xs text-muted-foreground">Account: {application.bank_account_number}</p>
    <p className="text-xs text-muted-foreground">IFSC: {application.bank_ifsc}</p>
    <p className="text-xs text-muted-foreground">Bank: {application.bank_name}</p>
  </div>
)}
```

---

## Summary

| File | Action | Purpose |
|---|---|---|
| New migration | Create | Add 4 bank detail columns to `dairy_partner_applications` |
| `usePartnerApplications.ts` | Modify | Add 4 fields to `PartnerApplication` interface |
| `src/pages/Auth.tsx` | Modify | Add bank detail form fields + validation + submit |
| `src/pages/PartnerApprovals.tsx` | Modify | Show bank details on the admin approval card |

No RLS policy changes needed — the existing policies already cover the new columns (row-level, not column-level).
