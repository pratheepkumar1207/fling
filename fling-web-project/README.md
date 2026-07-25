# Fling — Web App

This is a full React (Vite) web frontend for the Fling "watch party" app, built to talk to
the existing Node/Express backend (`fling-backend-updated/`, a copy of your original
`fling_backend` with one small addition — see below).

## What's included

- Phone/OTP login (Firebase Auth)
- Create/join a watch party room
- Synced YouTube **and** Google Drive video playback across everyone in the room
- Real-time chat (Socket.io)
- Live audio/video calling in a room (Agora)
- Coin wallet: buy coins (Razorpay), send gifts to other viewers, request cash-out, KYC
  submission

## What I changed in the backend

Your original backend was already fully web-compatible (plain Express + Socket.io — nothing
mobile-specific), so it didn't need a rewrite. I made exactly two small additions, both in
`fling-backend-updated/`:

1. **`src/middleware/requireAuth.js`** — now also accepts the JWT as `?token=` on the URL, not
   just the `Authorization` header. This is needed because an HTML `<video>` tag streaming
   from `/drive/stream/:fileId` can't attach custom headers.
2. **`src/sockets/syncHandler.js`** — added a small in-memory "who's in this room right now"
   roster, broadcast as `presence:roster`. Your original backend had no member-list concept,
   which the gifting UI needs (to know who you can send coins to). Nothing touches the
   database — it's just Socket.io state.

Everything else — auth, wallet, gifting, cash-out, KYC, Agora tokens, Razorpay
orders/verification, Drive proxying — is your original code, unmodified.

## Running locally

**Backend:**
```bash
cd fling-backend-updated
npm install
cp .env.example .env   # fill in real values — see "Credentials needed" below
npm start
```

**Frontend:**
```bash
cd fling-web
npm install
cp .env.example .env   # fill in the same Firebase/Agora/Razorpay values
npm run dev
```
Then open the printed local URL (usually `http://localhost:5173`).

## Credentials needed (production hookup)

Paste these into `fling-backend-updated/.env` and `fling-web/.env` respectively. A couple of
notes:
- This chat isn't a secrets vault — for anything beyond local testing, consider rotating any
  key you paste here afterward, or set them directly in your hosting provider's environment
  variables instead of in a file you send me.
- Secret values (Firebase service account, Agora certificate, Razorpay secret) only ever go in
  the **backend** env. Only public identifiers (Firebase web config, Agora App ID, Razorpay Key
  ID) go in the **frontend** env — that's intentional, not a mistake.

| Value | Where it goes | Where to get it |
|---|---|---|
| Firebase service account JSON | backend | Firebase Console → Project Settings → Service Accounts → Generate new private key |
| Firebase web config (apiKey, authDomain, projectId, etc.) | frontend | Firebase Console → Project Settings → General → Your apps → Web app |
| Agora App ID | both | Agora Console → your project |
| Agora App Certificate | backend only | Agora Console → your project → enable a certificate |
| Razorpay Key ID | both | Razorpay Dashboard → Settings → API Keys |
| Razorpay Key Secret | backend only | same screen |
| Razorpay webhook secret | backend | Razorpay Dashboard → Webhooks (set the webhook URL to your deployed backend's `/webhook`) |
| Postgres `DATABASE_URL` | backend | e.g. a free Postgres from Railway, Supabase, or Neon |
| Google Drive service account JSON (optional — only if hosting private Drive files) | backend | Google Cloud Console → Service Accounts |

I generated a random `JWT_SECRET` for you already — no need to supply that one.

## Deploying — "launching as a website"

**Backend** — your repo already has a `Dockerfile` and `railway.json`, so the fastest path is
[Railway](https://railway.app): new project → deploy from this folder → add a Postgres plugin
→ paste the env vars above → deploy. You'll get a public URL like
`https://fling-backend-production.up.railway.app`.

**Frontend** — push `fling-web/` to GitHub and import it on
[Vercel](https://vercel.com) or [Netlify](https://netlify.com) (a `vercel.json` is already
included for SPA routing). Set `VITE_API_URL` / `VITE_SOCKET_URL` to your deployed backend URL,
plus the Firebase/Agora/Razorpay public values, in the host's environment variable settings.
You'll get a live URL like `https://fling.vercel.app` — that's your website.

## Known limitations to be upfront about

- **Cash-out is a request queue, not an automatic payout** — your original backend design
  intentionally only marks a transaction `cashout_requested`; an admin or a payout job (bank
  transfer/UPI) still has to action it. That's a deliberate compliance choice in your code, not
  something I should silently automate.
- **KYC is manual review**, not a live verification provider — same reasoning, flagged in your
  original `kyc.js` as a TODO.
- Real money features (buying coins, cashing out) need you to actually go live with Razorpay
  (KYB-verified business account) before real payments will process — test-mode keys will work
  for development.
