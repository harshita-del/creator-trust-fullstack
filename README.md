# Creator Trust — Full-Stack Setup

Two projects, one product:

```
output/
├── backend/         Node + Express + PostgreSQL API
└── creator-trust/   React + Vite frontend
```

## 1. Backend setup

```bash
cd backend
cp .env.example .env     # then fill in DATABASE_URL and JWT_SECRET
npm install
npm run migrate          # creates all tables
npm run seed              # adds demo creators/brands/campaigns
npm run dev                # http://localhost:5000
```

Demo accounts (password for all: `Password123!`):
- `aisha.creator@example.com` — high-trust creator (CCS ~90s)
- `priya.creator@example.com` — flagged/fraud-risk creator (CCS ~50s, lots of fake followers)
- `meera.brand@example.com` — brand with sample campaigns

Health check: `GET http://localhost:5000/api/health`

## 2. Frontend setup

```bash
cd creator-trust
npm install
npm run dev          # http://localhost:5173
```

Vite's dev server proxies `/api/*` to `http://localhost:5000` automatically
(see `vite.config.js`). No `.env` needed for local dev — just make sure the
backend is running first.

## 3. What's actually wired up and working

- **Signup / Login** — real JWT auth, role-based (`brand` / `creator`), passwords hashed with bcrypt.
- **CCS Score** — calculated server-side from real signals (followers, engagement rate, fake-follower %, campaign completion rate, ratings). Editing your profile in `/dashboard/profile` recalculates it live — refresh the certificate to see the new number.
- **AI Matching** — `/dashboard/matching` (brand) computes a real 0–100 compatibility score per creator against a selected campaign (niche fit, follower fit, CCS fit, engagement quality, location).
- **Campaigns** — brands create campaigns; creators browse and apply from `/dashboard/campaign`.
- **Escrow** — `/dashboard/escrow` walks through fund → verify → release. Runs in demo mode (simulated Razorpay order) unless you add real `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` to the backend `.env`.
- **Verification** — creators submit a deliverable URL, brands verify it, either side rates and completes — this also triggers a CCS recalculation.
- **Analytics** — CCS factor breakdown chart (creators), campaign pipeline chart (brands).

## 4. Deploying

- **Backend**: Render/Railway — set `DATABASE_URL`, `JWT_SECRET`, run `npm run migrate` once via their shell, then `npm start`.
- **Frontend**: Vercel/Netlify — set `VITE_API_BASE` to your deployed backend URL, then `npm run build` (outputs to `dist/`).
