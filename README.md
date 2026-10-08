<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/20f6e066-bf6e-426a-9102-73c29c08c94b

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Prototype login (hardcoded)

Pick a role on the sign-in page, then use the matching account:

| Role       | Email                   | Password      | Pages                                        |
|------------|-------------------------|---------------|----------------------------------------------|
| Pharmacist | pharmacist@medicore.in  | pharma123     | All pages                                    |
| Customer   | customer@medicore.in    | customer123   | Dashboard, Purchases, Prescription Validation |

Accounts live in `src/context/AuthContext.tsx`; page access per role lives in `src/config/roles.ts`.
This is demo-only auth and must be replaced before real use.

## Prototype notes (final demo build)

- **No database needed.** All pharmacy data (medicines, suppliers, customers, sales, purchase orders) is hardcoded in `src/data/mockData.ts` and kept in browser localStorage. Pharmacist menu > *Reset Demo Data* restores the seed.
- **Logins:** `pharmacist@medicore.in` / `pharma123` and `customer@medicore.in` / `customer123`.
- **Customer role:** My Dashboard (personal spend stats), My Purchases (hardcoded history + *Add Purchase*), Find Pharmacy, Prescription Validation.
- **Prescription photo upload:** set `GROQ_API_KEY` in `.env`, then `npm run dev`. Images are processed in memory and never stored.
