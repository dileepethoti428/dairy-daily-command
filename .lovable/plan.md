
# Fix: Reset Password Page Not Detecting Recovery Session

## Root Cause

There are two bugs causing "Link Expired or Invalid" to show even when the link is valid:

### Bug 1 — Supabase PKCE flow sends a `?code=` query param, not a hash fragment

The current code checks:
```typescript
if (hash.includes('type=recovery')) { ... }
```

But with PKCE (the modern Supabase default), the email link looks like:
```
https://dairy-daily-command.vercel.app/reset-password?code=abc123
```

There is NO `#type=recovery` in the URL anymore. Supabase auto-exchanges the `code` for a session silently. The hash check always fails, so the component shows the "Link Expired" error screen.

### Bug 2 — The `PASSWORD_RECOVERY` event fires in `AuthContext`, not in `ResetPassword`

`AuthContext` has a global `onAuthStateChange` listener that is already active when the user lands on `/reset-password`. When Supabase fires `PASSWORD_RECOVERY`, `AuthContext` catches it first. By the time `ResetPassword.tsx` mounts and registers its own listener, the event has already been consumed and will never fire again.

---

## The Fix — `src/pages/ResetPassword.tsx`

Replace the broken event-listening approach with a direct session check using `supabase.auth.getSession()`.

When a user clicks a valid reset link, Supabase automatically exchanges the code in the URL for a real session. The session object contains `session.user.aud` and the user will have an active authenticated session. We just need to:

1. Call `supabase.auth.getSession()` on mount
2. If a session exists → show the password reset form (the user came from a valid link)
3. If no session exists → show the "Link Expired or Invalid" error

Also check for a `?code=` query parameter as an additional early indicator that Supabase is processing a recovery flow.

### The new detection logic:

```typescript
useEffect(() => {
  const checkSession = async () => {
    // Check for PKCE code in query params (modern Supabase flow)
    const params = new URLSearchParams(window.location.search);
    const hasCode = params.has('code');
    
    // Also check legacy hash-based flow
    const hash = window.location.hash;
    const hasHashRecovery = hash.includes('type=recovery');

    if (hasHashRecovery) {
      setIsRecoverySession(true);
      setChecking(false);
      return;
    }

    // For PKCE flow: wait for Supabase to exchange the code, then check session
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setIsRecoverySession(true);
    }
    setChecking(false);
  };

  // Also listen for the event in case it hasn't fired yet
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') {
      setIsRecoverySession(true);
      setChecking(false);
    }
  });

  checkSession();

  return () => subscription.unsubscribe();
}, []);
```

---

## Summary of Changes

| File | Change |
|---|---|
| `src/pages/ResetPassword.tsx` | Replace hash-only detection with `getSession()` check + query param detection + keep event listener as fallback |

No Supabase dashboard changes needed — the redirect URLs you've already added are correct. This is purely a code fix.
