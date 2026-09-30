# Archived login and band-link system

This folder is a snapshot of the venue-login / passwordless band-link flow that used to sit in front of the editor.

The live app now opens the stage editor immediately. No account, no `/b/[token]` gate, and no JSON login files are required.

Kept here so the old approach can be restored later if needed:

- Venue accounts in `data/accounts.json`
- Band slots and unique URLs in `data/bands.json`
- Login wall, band-link generation, venue inbox, and submit-to-venue UI
- `/api/accounts` and `/api/bands` routes

These files are not compiled or tested. Do not import them from `src/`.
