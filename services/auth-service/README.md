# TraceMem auth service

Express authentication API using MongoDB, JWTs, and an `HttpOnly` cookie.

## Local run

```powershell
Copy-Item .env.example .env
npm install
npm run dev
```

Set a private random `JWT_SECRET` and a reachable `MONGO_URI` in `.env`. The default local values use `http://localhost:5173`, port `5001`, and the `tracemem_auth` database.

API routes are under `/api/auth`: `POST /register`, `POST /login`, `POST /logout`, `GET /profile`, and `GET /health`. `GET /api/auth/health` returns service health.

## Render deployment

Use the repository root as the Render Root Directory, then:

```text
Build Command: npm install --prefix services/auth-service
Start Command: npm --prefix services/auth-service start
```

Set `NODE_VERSION=22`, `NODE_ENV=production`, `CLIENT_URL` to the exact HTTPS Vercel production origin, `MONGO_URI` to the Atlas `tracemem_auth` database, `JWT_SECRET` to a unique random value of at least 32 characters, and optionally `JWT_EXPIRES_IN=7d`. Render supplies `PORT`.

The service trusts one reverse-proxy hop for client IP handling by the auth rate limiter.

Production cookies are `HttpOnly`, `Secure`, and `SameSite=None` for cross-site HTTPS use. The browser's third-party-cookie policy may still affect cookie authentication across Vercel and Render domains.
