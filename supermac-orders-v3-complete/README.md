# Supermac Orders V3 Complete

This is the clean full project for the Supermac internal order app.

## Features

- Admin login
- Engineer login
- Admin can add new orders
- Admin can edit old orders
- Admin can delete old orders
- Engineer can search old orders
- Engineer can view full order details
- Data stored in Google Sheets through Apps Script
- PWA install support

## Files

- `index.html` - app UI
- `styles.css` - app design
- `app.js` - frontend logic
- `apps-script.gs` - Google Apps Script backend
- `supermac-orders-database-template.xlsx` - Google Sheet template
- `manifest.json` - PWA manifest
- `service-worker.js` - PWA cache
- `icon-192.png`, `icon-512.png` - app icons

## Setup Steps

### 1. Upload database template

Upload `supermac-orders-database-template.xlsx` to Google Drive.
Open it with Google Sheets.
Rename it to `Supermac Orders Database`.

### 2. Copy Google Sheet ID

From the sheet URL:

`https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit`

Copy only the Sheet ID between `/d/` and `/edit`.

### 3. Paste Apps Script code

Open Apps Script.
Paste the full code from `apps-script.gs`.
Replace:

`const SHEET_ID = "PASTE_YOUR_GOOGLE_SHEET_ID_HERE";`

with your real Google Sheet ID.

### 4. Deploy Apps Script

Deploy → New deployment → Web app

Use:
- Execute as: Me
- Who has access: Anyone

Copy the Web App URL. It must look like:

`https://script.google.com/macros/s/AKfycbxxxxx/exec`

### 5. Paste URL in app.js

Open `app.js`.
Replace:

`const API_URL = "PASTE_YOUR_WEB_APP_URL_HERE";`

with your Web App URL ending in `/exec`.

### 6. Test backend

Open:

`YOUR_WEB_APP_URL?action=test`

Expected:

`Supermac Orders API V3 connected successfully`

### 7. Test app

Open `index.html` using VS Code Live Server.

Default users in the Google Sheet:

- Admin / 4321
- Engineer / 2222

Change PINs from the `Users` tab.

### 8. Redeploy Apps Script after backend code changes

If you edit Apps Script later:

Deploy → Manage deployments → Edit pencil → Version → New version → Deploy

Only Save is not enough.

## Security Note

Keep the Google Sheet private. Engineers should only get app link + PIN, not the sheet link.
