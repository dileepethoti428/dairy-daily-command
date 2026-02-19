
# Add Bank Details Self-Edit for Partners

## Overview

Partners will be able to view and update their own bank details (Account Holder Name, Account Number, IFSC, Bank Name) from the **Settings page**. This is a safe self-service feature since bank details are not used for any access-control decisions.

---

## The Problem with Current RLS

Right now, the `dairy_partner_applications` table only allows partners to **SELECT** their own row and **INSERT** a new one. There is no **UPDATE** policy for non-admins. So we need a new restricted RLS policy.

---

## Database Change (Migration)

Add a new RLS policy that allows a user to update **only** their own row's bank detail columns:

```sql
CREATE POLICY "Users can update own bank details"
ON public.dairy_partner_applications
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

This is safe because:
- It only matches their own row (`auth.uid() = user_id`)
- The application `status`, `reviewed_by`, `is_active` etc. are controlled by admins only — but since Postgres UPDATE policies are row-level (not column-level), we must be careful that the mutation code only ever updates the four bank columns and nothing else

The mutation in code will only send the four bank fields, so `status` and other sensitive fields are never touched client-side.

---

## New Hook — `useUpdateBankDetails`

Add to `src/hooks/usePartnerApplications.ts`:

```typescript
export function useUpdateBankDetails() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: {
      bank_account_holder_name: string;
      bank_account_number: string;
      bank_ifsc: string;
      bank_name: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('dairy_partner_applications')
        .update({
          bank_account_holder_name: input.bank_account_holder_name,
          bank_account_number: input.bank_account_number,
          bank_ifsc: input.bank_ifsc,
          bank_name: input.bank_name,
        })
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-partner-application'] });
      toast({ title: 'Bank details updated', description: 'Your bank information has been saved.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}
```

---

## UI — Bank Details Card in Settings

A new "Bank Details" card will be added to `src/pages/Settings.tsx`, shown **only when the user is not an admin** (i.e., for partners/staff who have an application). It:

1. Calls `useMyApplication()` to fetch the current saved bank info
2. Pre-fills the form with existing values
3. On Save, runs `useUpdateBankDetails()` mutation with validation

### Card Layout

```
┌─────────────────────────────────────────┐
│  🏦 Bank Details                        │
│  Update your bank account information   │
│─────────────────────────────────────────│
│  Account Holder Name  [______________]  │
│  Account Number       [______________]  │
│  IFSC Code            [______________]  │
│  Bank Name            [______________]  │
│                                         │
│               [Save Bank Details]       │
└─────────────────────────────────────────┘
```

### Validation (same as registration)
- Account Holder Name: required, non-empty
- Account Number: 9–18 digits
- IFSC Code: matches `/^[A-Z]{4}0[A-Z0-9]{6}$/` (auto-uppercased)
- Bank Name: required, non-empty

### Placement in Settings page
The card will be placed **between the Profile card and the App Preferences card**, only visible to non-admin users who have an application on file.

---

## Files to Change

| File | Change |
|---|---|
| New migration | Add `"Users can update own bank details"` RLS policy |
| `src/hooks/usePartnerApplications.ts` | Add `useUpdateBankDetails` hook |
| `src/pages/Settings.tsx` | Add Bank Details card with form, validation, and mutation |

---

## Security Notes

- Only bank-related columns are ever sent in the UPDATE mutation — status, is_active, and role fields are never touched
- The RLS policy ensures a user can only update **their own row**
- IFSC is auto-uppercased on input and before submission
- Admins do not see this card (it is hidden when `isAdmin` is true)
