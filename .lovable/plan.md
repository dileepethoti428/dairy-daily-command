
# Add Forgot Password Feature

## Supabase Dashboard URLs (You Must Add These)

Go to your Supabase project → **Authentication** → **URL Configuration** → **Redirect URLs** and add both of these:

```
https://dairy-daily-command.vercel.app/reset-password
https://id-preview--42dc2dbb-d739-47e8-a719-e2b549f43fe7.lovable.app/reset-password
```

Add both so the flow works on your live Vercel deployment AND in the Lovable preview.

---

## Files to Create / Modify

### 1. `src/pages/Auth.tsx` — Add Forgot Password view

A new `isForgotPassword` state is added. When the user clicks "Forgot Password?", the form switches to an email-only screen. On submit it calls:

```typescript
await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/reset-password`
});
```

After sending, a green success screen shows "Check your email for the reset link."

The three form states inside `Auth.tsx`:
- Login form
- Register / Become a Partner form  
- Forgot Password form (new)

A "Forgot password?" link will appear below the password field on the login form only.

### 2. `src/pages/ResetPassword.tsx` — New page

This page handles users arriving from the email link. Supabase appends `#access_token=...&type=recovery` to the URL hash.

The page will:
- Listen for the Supabase `PASSWORD_RECOVERY` auth event via `onAuthStateChange`
- Show a "Set New Password" form with a new password + confirm password field
- Call `supabase.auth.updateUser({ password: newPassword })` on submit
- Redirect to `/auth` after success
- Show an error + link back to login if the token is missing or expired

### 3. `src/App.tsx` — Register the public route

Add a single public (non-protected) route:

```tsx
import ResetPassword from "./pages/ResetPassword";

<Route path="/reset-password" element={<ResetPassword />} />
```

This must be outside `ProtectedRoute` because the user arrives unauthenticated.

---

## User Flow

```text
Login Page  
   │  
   └─ "Forgot password?" link (below password field)  
          │  
          ▼  
   Forgot Password Screen  
   [Enter email] → "Send Reset Link"  
          │  
          ▼  
   Supabase sends email  
          │  
          ▼  
   User clicks email link → lands on /reset-password  
   [Enter new password] → "Update Password"  
          │  
          ▼  
   Success → redirect to /auth (login)
```

---

## Summary

| File | Action | Purpose |
|---|---|---|
| `src/pages/Auth.tsx` | Modify | Add forgot password state, form, and success screen |
| `src/pages/ResetPassword.tsx` | Create | New page to set a new password from the email link |
| `src/App.tsx` | Modify | Register `/reset-password` as a public route |

No database changes required — Supabase handles password reset natively.

---

## Links to Add in Supabase

**Authentication → URL Configuration → Redirect URLs:**

1. `https://dairy-daily-command.vercel.app/reset-password`
2. `https://id-preview--42dc2dbb-d739-47e8-a719-e2b549f43fe7.lovable.app/reset-password`
