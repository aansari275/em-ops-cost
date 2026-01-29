# OPS Cost Tracker

## Overview
Track production costs for each OPS (Order Processing Sheet) at Eastern Mills. Used by the accounts team to enter cost breakdowns per order.

## URLs
- **Live:** https://em-ops-cost.netlify.app
- **GitHub:** https://github.com/aansari275/em-ops-cost
- **Netlify Site ID:** 661a91ff-2c86-4fae-9bc1-9ff909a64e6d

## Login
- **PIN:** `1234`
- Session stored in localStorage (persists across browser sessions)
- Logout button in header

## Tech Stack
- React 18 + TypeScript, Vite, Tailwind CSS
- Firebase Firestore (shared `easternmillscom` project)
- TanStack Query

## Firebase Collections

### `ops_costs` (Created by this app)
```typescript
interface OpsCost {
  // Document ID = opsNo
  opsNo: string;
  buyerName: string;
  buyerCode: string;
  poValue: number;           // From ops_no collection

  // Cost categories (INR)
  materialPurchase: number;
  dyeing: number;
  weaving: number;
  finishing: number;
  rework: number;
  packingLabels: number;
  shipping: number;

  // Computed
  totalCost: number;
  margin: number;            // poValue - totalCost
  marginPercent: number;     // (margin / poValue) * 100

  updatedAt: string;
}
```

### `ops_no` (Read-only, from Orders app)
Fetches all OPS numbers to populate the table.

## Features
- Simple table view - one row per OPS
- Auto-save on blur (when you click out of a field)
- Search by OPS number or buyer name
- Shows all OPS from orders system

## Cross-App Integration
- **Orders App** reads from `ops_costs` to display costing summary in admin section
- Use `opsNo` as the key to join with `ops_no` collection for PO values

## Development
```bash
npm install
npm run dev     # http://localhost:5174
npm run build
```

## Deployment
```bash
git push origin main
netlify deploy --prod --dir=dist
```
