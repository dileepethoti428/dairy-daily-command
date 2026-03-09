

# Fix Admin Promotion to Grant Full Admin Access

## Problem

There are two bugs preventing promoted admins from working properly:

1. **Promotion creates a duplicate role row instead of replacing**: `usePromoteToAdmin` upserts with `onConflict: 'user_id,role'`, but the unique constraint is on `(user_id, role)`. Since the user already has a 'staff' or 'user' role, inserting 'admin' doesn't conflict -- it adds a **second** row. Now the user has two roles (e.g., 'staff' + 'admin').

2. **Multiple roles break role detection**: `fetchUserRole` in `AuthContext` uses `.maybeSingle()`, which errors when multiple rows exist. On error, it falls back to `'staff'` -- so the promoted user is **never recognized as admin**. They don't see the Administration section, can't switch centers, etc.

## Fix (3 files)

### 1. `src/hooks/usePartnerApplications.ts` -- Fix promote/demote mutations

**Promote**: Delete existing role rows for the user first, then insert `'admin'`.  
**Demote**: Delete existing role rows, then insert `'user'` (instead of trying to delete only the admin row).

### 2. `src/contexts/AuthContext.tsx` -- Handle multiple role rows gracefully

Change `fetchUserRole` from `.maybeSingle()` to `.select('role')` with a check: if any row has `'admin'`, treat user as admin. This makes it resilient even if duplicate rows exist from past bugs.

### 3. No UI changes needed

The `Settings.tsx` Administration section, `AppHeader.tsx` center switcher, and `CenterContext.tsx` all already check `isAdmin` correctly. Once the role is properly detected, promoted admins automatically get:
- Administration section (System Settings, Collection Centers, Partner Approvals)
- Center switcher in header (view all stores)
- Global data access (all farmers, entries, reports across centers)

## Summary of changes

| File | Change |
|---|---|
| `src/hooks/usePartnerApplications.ts` | Fix promote: delete old roles, insert admin. Fix demote: delete old roles, insert user. |
| `src/contexts/AuthContext.tsx` | Change `fetchUserRole` to handle multiple rows -- pick highest role (admin > others) |

