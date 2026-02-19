
# Add Edit Toggle to Bank Details Card

## Overview

Currently the Bank Details card in Settings always shows editable input fields. The change adds a **view mode** (default) where the values are displayed as read-only text, and an **Edit** button in the card header. Clicking Edit switches to edit mode, revealing the input fields, a **Save** button, and a **Cancel** button.

---

## Behaviour

| State | What the user sees |
|---|---|
| **View mode** (default) | Each field shown as plain text. "Edit" button (pencil icon) in the top-right of the card header. |
| **Edit mode** | Input fields are shown with current values pre-filled. "Save" and "Cancel" buttons at the bottom. |
| **Save clicked** | Validates, calls mutation, on success → returns to view mode. |
| **Cancel clicked** | Resets field values back to what was fetched, returns to view mode without saving. |

---

## Files to Change

### `src/pages/Settings.tsx` only

**State additions inside `BankDetailsCard`:**
```typescript
const [isEditing, setIsEditing] = useState(false);
```

**Cancel handler** — resets field values to the last-fetched application data and exits edit mode:
```typescript
const handleCancel = () => {
  setHolderName(application.bank_account_holder_name ?? '');
  setAccountNumber(application.bank_account_number ?? '');
  setIfsc(application.bank_ifsc ?? '');
  setBankName(application.bank_name ?? '');
  setErrors({});
  setIsEditing(false);
};
```

**Save handler** — after successful mutation, also calls `setIsEditing(false)`. To do this, the `onSuccess` callback in `useUpdateBankDetails` needs to be extended, OR we can pass an `onSuccess` option to `mutate()`:
```typescript
const handleSave = () => {
  if (!validate()) return;
  updateBankDetails.mutate({ ... }, {
    onSuccess: () => setIsEditing(false),
  });
};
```

**Card header** — add Edit button on the right:
```tsx
<CardHeader className="pb-3">
  <div className="flex items-center justify-between">
    <CardTitle className="flex items-center gap-2">
      <Landmark className="h-5 w-5 text-primary" />
      Bank Details
    </CardTitle>
    {!isEditing && (
      <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
        <Pencil className="h-4 w-4 mr-1" />
        Edit
      </Button>
    )}
  </div>
  <CardDescription>Your bank account information</CardDescription>
</CardHeader>
```

**Card content** — conditionally show view or edit mode:

In **view mode**, each field is shown as a labelled row:
```tsx
<div className="space-y-3">
  <div className="flex flex-col gap-0.5">
    <span className="text-xs text-muted-foreground">Account Holder Name</span>
    <span className="font-medium">{holderName || '—'}</span>
  </div>
  <Separator />
  <div className="flex flex-col gap-0.5">
    <span className="text-xs text-muted-foreground">Account Number</span>
    <span className="font-medium">{accountNumber || '—'}</span>
  </div>
  <Separator />
  <div className="flex flex-col gap-0.5">
    <span className="text-xs text-muted-foreground">IFSC Code</span>
    <span className="font-medium">{ifsc || '—'}</span>
  </div>
  <Separator />
  <div className="flex flex-col gap-0.5">
    <span className="text-xs text-muted-foreground">Bank Name</span>
    <span className="font-medium">{bankName || '—'}</span>
  </div>
</div>
```

In **edit mode**, the existing Input fields are shown (same as current), plus Save and Cancel buttons:
```tsx
{/* ...existing input fields... */}
<div className="flex gap-2 pt-1">
  <Button variant="outline" className="flex-1" onClick={handleCancel}>
    Cancel
  </Button>
  <Button className="flex-1" onClick={handleSave} disabled={updateBankDetails.isPending}>
    {updateBankDetails.isPending ? 'Saving…' : 'Save'}
  </Button>
</div>
```

**Import addition:** Add `Pencil` to the lucide-react import list.

---

## Empty State Handling

If a field has no value saved yet (e.g. the partner registered before bank fields were added), the view mode shows `—` as a dash placeholder. This is a clear visual cue that the field is empty.

---

## No Database or Hook Changes Needed

This is a pure UI/UX change — only `src/pages/Settings.tsx` is modified.

---

## Summary

| File | Change |
|---|---|
| `src/pages/Settings.tsx` | Add `isEditing` state, view/edit mode toggle, Edit/Save/Cancel buttons, `Pencil` icon import |
