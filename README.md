# MediCore: AI-Assisted Pharmacy Management

MediCore is a pharmacy management web app with two role-based workspaces: a **pharmacist** workspace for running the pharmacy (inventory, sales, suppliers, AI insights, prescription safety) and a **customer** workspace for tracking personal medicine purchases, finding pharmacies and checking prescriptions.

## Features

### Pharmacist workspace
- **Dashboard**: revenue, low-stock, expiry and out-of-stock KPIs, sales trend, stock breakdown
- **Medicines, Inventory and Categories**: catalog, batch-level tracking, FEFO (earliest-expiry-first) dispensing
- **Sales (POS)**: create invoices with automatic batch allocation and GST
- **Purchases**: create, receive and cancel supplier purchase orders
- **Suppliers and Customers**: directories and records
- **AI Insights and Demand Forecast**: stockout, expiry and demand alerts with reorder recommendations
- **Prescription Validation**: interactions, allergies, duplicate therapy, dosage checks, generic substitutions
- **Generic Suggestions, Reports, Notifications, Settings**
- **Find Pharmacy**: pharmacy recommendations ranked by price, stock, rating and distance
- **MediCore AI assistant** drawer and global search

### Customer workspace
- **My Dashboard**: personal spend stats (total, this month, average order, prescription orders), monthly spend chart, spend by pharmacy, most-bought medicines, recent orders
- **My Purchases**: purchase history with search, plus **Add Purchase** to record new purchases (they update the dashboard)
- **Find Pharmacy**: compare nearby pharmacies for a medicine
- **Prescription Validation**: check a prescription for safety, including photo upload
- **MediCore AI assistant**

### Prescription safety engine
- Type in a prescription, load a preset scenario, or **upload a photo**. The photo is read by a Groq vision model, the form is auto-filled and the safety check runs immediately.
- Validation uses the Groq AI model when a key is configured. It falls back to a built-in rule-based clinical engine when the AI is unavailable.
- A safety pass removes any generic substitute that conflicts with the patient's allergies and replaces model-guessed stock numbers with the pharmacy's real inventory.
- Uploaded images are processed in memory for the single request and are never stored.

## Tech stack

React 19, TypeScript, Vite 6, Tailwind CSS 4, Recharts, Lucide icons, Express (dev server and AI proxy) and the Groq API.

## Getting started

**Requirements:** Node.js 18 or newer (the server uses the built-in `fetch`).

```bash
npm install
cp .env.example .env     # then add your Groq key (optional, see below)
npm run dev
```

Open http://localhost:3000.

### Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `GROQ_API_KEY` | Optional | Enables the AI assistant, AI prescription validation, generic suggestions and the prescription photo reader. Get a key at https://console.groq.com |
| `GROQ_MODEL` | Optional | Force a specific text model (it is tried before the built-in defaults) |
| `GROQ_VISION_MODEL` | Optional | Force a specific vision model for prescription photos |

Without a key, everything still works except the photo upload. Prescription validation uses the local rule engine and the assistant gives basic answers.

The server tries the configured models in order and moves to the next one if a model is retired. If you see model errors in the console, update the model ids in `server.ts` or set the variables above.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Express and Vite dev server on port 3000 |
| `npm run build` | Build the frontend and bundle the server into `dist/` |
| `npm start` | Run the production build (`dist/server.cjs`) |
| `npm run lint` | Type-check with `tsc --noEmit` |

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Pharmacist | `pharmacist@medicore.in` | `pharma123` |
| Customer | `customer@medicore.in` | `customer123` |

On the login page you can also use the demo buttons to fill the credentials. The selected role must match the account.

## Suggested demo flow

1. **Customer:** open My Dashboard, then My Purchases and add a purchase. Return to the dashboard to see the stats change. Open Find Pharmacy, then Prescription Validation. Upload a prescription photo, or pick a preset scenario such as "Elderly Cardiac + Allergy Conflict".
2. **Pharmacist:** open the Dashboard and AI Insights, create a purchase order and receive it, ring up a sale in POS and watch stock and batches update, then open Suppliers, Customers and Reports.
3. Use the profile menu, then **Reset Demo Data** (pharmacist only), to restore the original seed.

## Project structure

```
server.ts                      Express server: Groq text + vision AI endpoints, Vite middleware
src/
  App.tsx                      Login gate and role router
  config/roles.ts              Roles and which pages each role may open
  context/
    AuthContext.tsx            Hardcoded demo accounts and session
    PharmacyContext.tsx        Pharmacy state and actions (stock, sales, POs, toasts, navigation)
    CustomerDataContext.tsx    The customer's own purchases and derived stats
  layouts/AppShell.tsx         Sidebar, topbar, page switch and modals
  pages/
    auth/                      Login page
    customer/                  Customer portal, dashboard and purchases
    pharmacist/                Pharmacist portal
    *.tsx                      Shared and pharmacist pages
  services/
    aiService.ts               Insights, forecasting, prescription engine, AI client calls
    storageService.ts          localStorage persistence seeded from mock data
    recommendationService.ts   Pharmacy ranking for Find Pharmacy
  data/
    mockData.ts                Hardcoded pharmacy data
    customerMockData.ts        Hardcoded customer purchases
    recommendationMockData.ts  Hardcoded pharmacies and supplier offerings
  components/                  Shared UI, layout and modals
```

### How roles work

`config/roles.ts` lists the pages each role can open. The sidebar only shows allowed pages, `AppShell` refuses to render a disallowed page, and `PharmacyContext` ignores navigation to one (for example from a notification link). To give customers another page, add its route to `ROLE_PAGES.customer`.

### How data works

- Pharmacy data is seeded from `src/data/mockData.ts` and saved to localStorage under `medicore_v2_*` keys.
- The customer's purchases are seeded from `src/data/customerMockData.ts` and saved under `medicore_v2_customer_purchases`.
- To reset everything manually, clear the site's localStorage in your browser.
- The `supabase/` folder holds the old schema and is not used by the app.

### AI endpoints

All are served by `server.ts`, and the client falls back to local logic if they fail.

| Endpoint | Purpose |
| --- | --- |
| `POST /api/ai/assistant` | Pharmacy assistant answers |
| `POST /api/ai/validate-prescription` | Clinical safety review as structured JSON |
| `POST /api/ai/extract-prescription` | Prescription photo to form fields (vision) |
| `POST /api/ai/generic-suggestions` | Generic substitution opportunities |
| `GET /api/health` | Shows whether a key is configured and which models are in use |
