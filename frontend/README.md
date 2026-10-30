# TraceMem frontend

React, Vite, and Tailwind frontend. Auth and analysis requests go directly to their respective services; no API gateway is used.

## Local development

```powershell
Copy-Item .env.example .env
npm install
npm run dev
```

The example `.env` points to auth at `http://localhost:5001/api` and analysis at `http://localhost:5002/api`. Start both services before using the app. Build locally with `npm run build`.

## Vercel deployment

Set the Vercel Root Directory to `frontend`, use the Vite preset, run `npm run build`, and publish `dist`. Set these build environment variables to the generated HTTPS service URLs, including `/api`:

```text
VITE_AUTH_BASE=https://<auth-service>.onrender.com/api
VITE_ANALYSIS_BASE=https://<analysis-service>.onrender.com/api
```

Set them before deployment and redeploy after changing them. On both services, set `CLIENT_URL` to the exact HTTPS origin shown for the Vercel production deployment (no trailing slash). Cross-site auth uses secure cookies; browser third-party-cookie restrictions may vary.
