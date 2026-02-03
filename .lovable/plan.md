

# Milk Procurement & Farmer Management App — Prompt 1 Implementation Plan

## Overview
Build the foundation for a mobile-first internal operations app for milk collection centers. This prompt establishes the global design system, authentication, database structure, and homepage skeleton.

---

## Phase 1: Global Design System
Apply your dairy-themed design tokens across the entire app:
- **Colors**: Dairy Green (#2E7D32), Milk White (#FFFFFF), Warm Yellow (#FBC02D), plus text and background colors
- **Typography**: Inter font with semi-bold headings, regular body text
- **Layout**: 8px spacing system, 10px rounded corners, card-based UI with soft shadows
- **Components**: Large tap-target buttons, accessible input fields with clear labels, high contrast text (minimum 14px)

---

## Phase 2: Supabase Connection & Database Structure
Connect your existing Supabase project and create these tables:

| Table | Purpose |
|-------|---------|
| `profiles` | User details linked to Supabase Auth |
| `user_roles` | Secure role storage (staff/admin) with enum type |
| `collection_centers` | Multi-center support with center details |
| `farmers` | Farmer records linked to collection centers |
| `milk_entries` | Daily milk collection entries |
| `settlements` | 15-day settlement periods |

**Relationships:**
- One collection center → many farmers
- One farmer → many milk entries
- One settlement → many milk entries

**Security:** Secure `has_role()` function for RLS policies to prevent privilege escalation.

---

## Phase 3: Authentication System
Simple, functional login system:
- Email + password login/signup page
- Session management with auth state listener
- Role-based access control (staff vs admin)
- Automatic redirect after login
- Protected routes structure

---

## Phase 4: Homepage — Daily Command Center
Mobile-first homepage with static/dummy data:

1. **Sticky Header**
   - App logo/name (left)
   - Selected collection center dropdown (center)
   - Profile icon with menu (right)

2. **Date & Session Status**
   - Today's date display
   - "Collection Open" status badge

3. **Primary Actions**
   - Large "Add Milk Entry" button (primary)
   - "View Today's Entries" button (secondary)

4. **Today Snapshot Card**
   - Total milk collected (litres)
   - Farmers served count
   - Average FAT & SNF placeholders

5. **Recent Farmers Section**
   - Last 5 farmers list (dummy data)
   - Quick-tap ready structure

6. **Alerts Section**
   - Placeholder alert cards (e.g., "Pending settlements")

7. **Reports Shortcut**
   - Today PDF button
   - Current 15-Day Settlement button

8. **Bottom Navigation Bar**
   - Home (active), Farmers, Reports, Settings

---

## Phase 5: Navigation Structure
Set up routing for future screens:
- `/auth` - Login/Signup page
- `/` - Homepage (protected)
- `/farmers` - Farmers list (placeholder)
- `/reports` - Reports (placeholder)
- `/settings` - Settings (placeholder)

---

## What's NOT Included (Per Your Rules)
- No pricing/rate calculations
- No PDF generation logic
- No farmer creation forms
- No settlement calculations
- No milk entry mutations

---

## Deliverables
✅ Supabase connected with proper table structure  
✅ Secure role-based authentication working  
✅ Global dairy-themed UI system applied  
✅ Homepage fully laid out with static data  
✅ Navigation ready for future screens

