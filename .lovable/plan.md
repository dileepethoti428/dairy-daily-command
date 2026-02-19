
# Promote Partner to Admin

## Overview

On the "Approved" tab of the Partner Approvals page, admins will see a new "Make Admin" button on each approved partner's card. Clicking it shows a confirmation dialog warning about the consequences (full system access), and upon confirmation, promotes that partner's role to `admin` in the `user_roles` table.

If a partner is already an admin, the button will instead say "Remove Admin" to allow demotion back to the `user` role.

---

## How It Works

The `user_roles` table already has an `admin` value in the `app_role` enum and an RLS policy `Admins can manage all user roles` that allows admins to insert/update/delete rows. The existing `has_role()` security definer function is already in place.

The operation is:
- **Promote**: `upsert({ user_id, role: 'admin' })` into `user_roles` (replaces their `user` role)
- **Demote**: `update role = 'user'` where `user_id` matches (puts them back to regular partner)

To show which partners are already admins, `useAllApplications` needs to join or separately fetch their current role from `user_roles`. Since Supabase RLS allows admins to read all roles, we can fetch all admin user IDs in a separate query and cross-reference in the UI.

---

## Files to Change

### 1. `src/hooks/usePartnerApplications.ts`

Add two new hooks:

**`usePromoteToAdmin`** — upserts `{ user_id, role: 'admin' }` into `user_roles`, then invalidates the `partner-applications` and `partner-roles` query keys.

**`useDemoteFromAdmin`** — updates the `user_roles` row back to `role: 'user'` for that user, then invalidates the same keys.

**`useApprovedPartnerRoles`** — a query that fetches all `user_id`s from `user_roles` where `role = 'admin'`, so we know which approved partners are already admins. Returns a `Set<string>` for O(1) lookup.

### 2. `src/pages/PartnerApprovals.tsx`

**In `ApplicationCard`**:
- Add `isAdmin?: boolean`, `onPromote?: () => void`, and `onDemote?: () => void` props.
- In the approved actions section, add a new button:
  - If `isAdmin`: shows "Remove Admin" button (amber/warning color, `ShieldAlert` icon)
  - If not admin: shows "Make Admin" button (indigo/purple color, `ShieldCheck` icon with star)

**In `ApplicationList`**:
- Add `adminUserIds?: Set<string>`, `onPromote`, and `onDemote` props, passed through to each `ApplicationCard`.

**In `PartnerApprovals` (main component)**:
- Call `useApprovedPartnerRoles()` to get the set of admin user IDs.
- Call `usePromoteToAdmin()` and `useDemoteFromAdmin()` hooks.
- Wire up `handlePromote` and `handleDemote` handlers.
- Add a confirmation `AlertDialog` (not a plain Dialog) that warns:
  > "Promoting [name] to Admin will give them full access to all centers, all farmers, all data and settings in this system. This cannot be undone without manually removing their admin role. Are you sure?"
- For demote: a simpler confirmation dialog:
  > "Removing admin access from [name] will revert them to a regular partner. They will lose access to admin-only features."

---

## UI Layout on the Approved Card

```text
┌─────────────────────────────────────┐
│  [Avatar]  Partner Name             │
│            14 Jan 2026, 10:30 AM    │
│                                [Approved Badge]
│  📞 9876543210                      │
│  ✉ partner@email.com               │
│  ── Bank Details ──────────────────│
│  Holder: ...  Account: ...          │
│                                     │
│  [Assign Center]                    │
│  [Make Admin]     ← NEW (or Remove Admin) │
│  [Deactivate Account]               │
└─────────────────────────────────────┘
```

---

## Confirmation Dialog (Promote)

Uses `AlertDialog` (not `Dialog`) to convey the severity:

- Title: "Promote to Admin?"
- Description: "This will give [Name] full administrative access to the entire system — all centers, farmers, milk entries, reports, pricing and settings. Only do this for trusted partners."
- Buttons: "Cancel" | "Yes, Make Admin" (destructive style)

## Confirmation Dialog (Demote)

- Title: "Remove Admin Access?"
- Description: "[Name] will lose admin privileges and revert to a regular partner account."
- Buttons: "Cancel" | "Remove Admin"

---

## Summary of Changes

| File | Change |
|---|---|
| `src/hooks/usePartnerApplications.ts` | Add `useApprovedPartnerRoles`, `usePromoteToAdmin`, `useDemoteFromAdmin` hooks |
| `src/pages/PartnerApprovals.tsx` | Add promote/demote buttons to cards, confirmation dialogs, wire up hooks |

No database migrations needed — the `admin` enum value already exists in `app_role`, and the RLS policy `Admins can manage all user roles` already allows this operation.
