

# Update Favicon and Logo to Zaago Branding

## Overview

Replace the current Milk icon and "MilkPro" branding with the uploaded Zaago logo image across the app, and set it as the favicon.

## Changes

### 1. Copy the uploaded image to the project

- Copy `user-uploads://IMG_0422.jpeg` to `public/zaago-logo.jpeg` (for favicon and HTML meta)
- Copy `user-uploads://IMG_0422.jpeg` to `src/assets/zaago-logo.jpeg` (for React component imports)

### 2. Update `index.html`

- Change `<title>` from "Lovable App" to "Zaago"
- Update og:title meta tag to "Zaago"
- Add favicon link pointing to `/zaago-logo.jpeg`

### 3. Update `src/components/layout/AppHeader.tsx`

- Replace the Milk icon + green circle with an `<img>` tag showing the Zaago logo
- Change the text from "MilkPro" to "Zaago"

### 4. Update `src/pages/Auth.tsx`

- Replace the Milk icon circles (login and forgot-password views) with the Zaago logo image

### 5. Update `src/pages/ResetPassword.tsx`

- Replace the Milk icon circle with the Zaago logo image

## Files to Change

| File | Change |
|---|---|
| `public/zaago-logo.jpeg` | New file (copy from upload) |
| `src/assets/zaago-logo.jpeg` | New file (copy from upload) |
| `index.html` | Title, og:title, favicon link |
| `src/components/layout/AppHeader.tsx` | Logo image + "Zaago" text |
| `src/pages/Auth.tsx` | Logo image on auth screens |
| `src/pages/ResetPassword.tsx` | Logo image on reset screen |

