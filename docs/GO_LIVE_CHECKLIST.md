# 🚀 Go-Live Checklist — Milk Procurement & Farmer Management App

## Pre-Deployment Requirements

### 1. Environment Configuration ✅
- [ ] Development and production environments are separate
- [ ] Supabase URL and anon key are properly configured
- [ ] No hardcoded credentials in codebase
- [ ] Environment variables are set correctly

### 2. Database Safety ✅
- [ ] Daily automatic backups enabled in Supabase
- [ ] Backup retention: 7-14 days recommended
- [ ] Point-in-time recovery available for production
- [ ] No destructive deletes - using status flags instead:
  - Farmers: `is_active` flag (never deleted)
  - Milk entries: Protected by database triggers
  - Settlements: Status-based (`open` → `locked` → `paid`)

### 3. Security Configuration ✅
- [x] RLS (Row Level Security) enabled on all core tables
- [x] Role-based access control implemented (Admin/Staff)
- [x] User roles stored in secure `user_roles` table
- [x] Database functions use `SECURITY DEFINER` with explicit `search_path`
- [x] Milk entry deletion/edit protected by database triggers
- [x] Bank account details masked for non-admin users

---

## Access & Security Checks

### Authentication ✅
- [x] Email/password authentication enforced
- [x] No anonymous access to operational data
- [x] Session handling with auto-refresh tokens
- [x] Proper email redirect URLs configured

### Permission Verification
- [ ] Staff cannot access admin-only actions:
  - System Settings
  - Collection Center Management
  - Lock/Pay settlements
- [ ] Bank data is protected (last 4 digits visible to staff)
- [ ] Locked settlements are immutable

---

## Production Configuration

### Data Integrity
- [x] Unique constraint: farmer + date for milk entries
- [x] Settlement locking prevents entry edits
- [x] Payment status cannot be reverted (locked → paid is one-way)
- [x] Farmer deactivation preserves all historical data

### Error Handling
- [x] Human-readable error messages
- [x] Network error handling with retry options
- [x] Form validation with inline errors
- [x] No debug logs shown to users

### UX Safety
- [x] Empty states with clear CTAs
- [x] Loading skeletons for all data-fetching screens
- [x] Confirmation dialogs for irreversible actions
- [x] Unsaved changes warnings on forms

---

## Go-Live Testing Flow

### Step 1: Create Admin Account
```
1. Sign up with admin email
2. Manually add to user_roles table:
   INSERT INTO public.user_roles (user_id, role) 
   VALUES ('your-user-id', 'admin');
```

### Step 2: Create Test Collection Center
1. Navigate to Settings → Collection Centers
2. Add new center with:
   - Name: "Main Center"
   - Code: "MC01"
   - Village/Area: "Main Village"

### Step 3: Add Test Farmers
1. Navigate to Farmers → Add Farmer
2. Create 2-3 test farmers with:
   - Full name
   - Phone number
   - Village
   - Milk type (Cow/Buffalo)
   - Bank details (optional)

### Step 4: Add Milk Entries
1. Navigate to Today's Entries
2. Add entries for test farmers:
   - Select farmer
   - Enter quantity (L)
   - Enter fat %
   - Enter SNF %
   - Set rate per litre

### Step 5: Create Settlement
1. Navigate to Settlements
2. Create new settlement for current period (1-15 or 16-end)
3. Verify entries are assigned to settlement

### Step 6: Lock Settlement (Admin)
1. Open settlement details
2. Review farmer-wise breakdown
3. Click "Lock Settlement"
4. Confirm action

### Step 7: Generate PDFs
1. Open locked settlement
2. Generate Settlement Summary PDF
3. Generate individual Farmer Statements
4. Verify PDF content accuracy

### Step 8: Mark as Paid (Admin)
1. Open locked settlement
2. Click "Mark as Paid"
3. Confirm payment

### Step 9: Verify Staff Permissions
1. Create staff account
2. Assign to collection center
3. Verify:
   - ✅ Can add farmers
   - ✅ Can add milk entries
   - ✅ Can view settlements
   - ❌ Cannot lock settlements
   - ❌ Cannot access system settings
   - ❌ Cannot see full bank details

---

## Monitoring & Alerts

### Basic Monitoring (Recommended)
- Monitor auth failures via Supabase dashboard
- Check Edge Function logs for errors
- Review database connection metrics

### Error Tracking (Optional)
- Consider adding error boundary with logging
- Monitor PDF generation failures
- Track network timeout patterns

---

## Post-Launch Checklist

- [ ] First admin account created
- [ ] First collection center configured
- [ ] Test farmers added
- [ ] Full settlement cycle completed
- [ ] PDFs generated and verified
- [ ] Staff account tested
- [ ] Backup verification confirmed

---

## Troubleshooting

### Common Issues

**"Cannot add milk entry"**
- Verify farmer is active
- Check if entry already exists for today
- Ensure collection center is selected

**"Settlement lock fails"**
- Must have at least one milk entry
- Settlement must be in "open" status
- User must have admin role

**"PDF generation fails"**
- Check browser console for errors
- Verify settlement is locked
- Ensure jspdf/jspdf-autotable are loaded

**"Permission denied"**
- Verify user role in user_roles table
- Check RLS policies are active
- Confirm user is authenticated

---

## Support Resources

- Supabase Dashboard: https://supabase.com/dashboard/project/amhpjsmubciahslghobw
- Edge Function Logs: Check for API errors
- Database Logs: Monitor for constraint violations

---

*Last updated: February 2026*
