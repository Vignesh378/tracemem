# TraceMem

TraceMem attributes generated text to influential training examples using per-example gradients, multi-checkpoint TracIn, and random projection. The repository contains a React/Vite frontend, separate Express auth and analysis services, a Python analysis pipeline, MongoDB persistence, and optional S3 file storage.

The frontend calls both services directly; an API gateway is not required.

## Repository layout

- `frontend/` - React + Vite + Tailwind application
- `services/auth-service/` - Express authentication service with JWT cookies
- `services/analysis-service/` - Express API, asynchronous analysis jobs, and uploads
- `services/core-service/` - Python TraceMem pipeline

## Local development

Requirements: Node.js 20+ (22 recommended), npm, Python 3, and MongoDB. Install the Python packages in `services/core-service/requirements.txt` in the same Python environment configured for the analysis service.

Create local environment files:

```powershell
Copy-Item frontend\.env.example frontend\.env
Copy-Item services\auth-service\.env.example services\auth-service\.env
Copy-Item services\analysis-service\.env.example services\analysis-service\.env
```

Set a private random `JWT_SECRET` in `services/auth-service/.env`. The example points both services at local MongoDB and runs the analysis service in local file-storage mode.

Install dependencies and run each service in its own terminal:

```powershell
cd services\auth-service
npm install
npm run dev
```

```powershell
cd services\analysis-service
npm install
python -m pip install -r ..\core-service\requirements.txt
npm run dev
```

```powershell
cd frontend
npm install
npm run dev
```

The default local ports are auth `5001`, analysis `5002`, and Vite `5173`. The frontend `.env` values include `/api`, as required by the service routes. Health checks:

- `http://localhost:5001/api/auth/health`
- `http://localhost:5002/api/analysis/health`

## Deploy without a custom domain

Deploy the frontend to Vercel and the services to Render (or run the analysis service on EC2). Use the stable HTTPS Vercel production URL as `CLIENT_URL` on **both** services, and configure the service URLs as Vercel build environment variables. Do not include a trailing slash in `CLIENT_URL`; frontend API base URLs must end with `/api`.

### Vercel frontend

1. Import the repository in Vercel.
2. Set **Root Directory** to `frontend`.
3. Use the Vite preset, build command `npm run build`, and output directory `dist`.
4. Set:

   ```text
   VITE_AUTH_BASE=https://<auth-service>.onrender.com/api
   VITE_ANALYSIS_BASE=https://<analysis-service>.onrender.com/api
   ```

5. Redeploy after setting or changing these build-time variables.

### Render auth service

Create a Web Service from the repository, leaving **Root Directory** at the repository root so shared files remain available. Configure:

```text
Build Command: npm install --prefix services/auth-service
Start Command: npm --prefix services/auth-service start
```

Set `NODE_VERSION=22` and these environment variables in Render:

```text
NODE_ENV=production
CLIENT_URL=https://<your-vercel-project>.vercel.app
MONGO_URI=mongodb+srv://<user>:<url-encoded-password>@<cluster>/<database>?retryWrites=true&w=majority
JWT_SECRET=<a-unique-random-secret-of-at-least-32-characters>
JWT_EXPIRES_IN=7d
```

Use an Atlas database name such as `tracemem_auth`; Render supplies `PORT`.

### Render analysis service

Create a separate Web Service and leave **Root Directory** at the repository root. This is important: the service needs the adjacent `services/core-service` Python files.

```text
Build Command: npm install --prefix services/analysis-service && python -m pip install -r services/core-service/requirements.txt
Start Command: npm --prefix services/analysis-service start
```

Set `NODE_VERSION=22`, ensure Python 3 is available to the build/runtime, and configure:

```text
NODE_ENV=production
CLIENT_URL=https://<your-vercel-project>.vercel.app
MONGO_URI=mongodb+srv://<user>:<url-encoded-password>@<cluster>/<database>?retryWrites=true&w=majority
STORAGE_MODE=s3
AWS_REGION=<bucket-region>
S3_BUCKET=<private-bucket-name>
AWS_ACCESS_KEY_ID=<iam-access-key>
AWS_SECRET_ACCESS_KEY=<iam-secret-key>
MAX_EXAMPLES=30
MAX_FILE_SIZE_MB=512
TEMP_DIR=/tmp/tracemem
UPLOAD_DIR=/tmp/tracemem-uploads
PYTHON_PATH=python3
CORE_SCRIPT_PATH=../core-service/scripts/run_pipeline.py
CORE_WORKDIR=../core-service
```

Use a Render plan with enough memory, disk, and execution time for the configured model and dataset. Render's local filesystem is ephemeral; S3 is required for persistent uploaded artifacts. The service runs jobs in-process, so restarting or scaling down the service interrupts active jobs. For larger workloads, deploy the analysis service on an appropriately sized EC2 instance; keep the same environment variables and expose only its HTTPS API.

Use a separate Atlas database such as `tracemem_analysis`. Restrict Atlas network access to the service's outbound IPs where available. If the deployment has no stable outbound IP, use Atlas's documented network-access approach for that host and compensate with strong database credentials.

### Production environment examples

These are illustrative host names; replace them with the generated deployment URLs:

```text
# Vercel build environment
VITE_AUTH_BASE=https://tracemem-auth.onrender.com/api
VITE_ANALYSIS_BASE=https://tracemem-analysis.onrender.com/api

# Both Render services
CLIENT_URL=https://tracemem-web.vercel.app

# Auth service
MONGO_URI=mongodb+srv://tracemem_auth_user:<url-encoded-password>@cluster0.example.mongodb.net/tracemem_auth?retryWrites=true&w=majority

# Analysis service
MONGO_URI=mongodb+srv://tracemem_analysis_user:<url-encoded-password>@cluster0.example.mongodb.net/tracemem_analysis?retryWrites=true&w=majority
STORAGE_MODE=s3
AWS_REGION=us-east-1
S3_BUCKET=tracemem-private
```

Never commit `.env` files or real credentials. Use the platform's secret/environment-variable manager. For production cookie auth, the auth service sets `HttpOnly`, `Secure`, and `SameSite=None` cookies. Browsers can restrict third-party cookies between the Vercel and Render hostnames; test the target browsers. This setup uses the requested cross-site cookie configuration but does not bypass browser privacy restrictions.

For S3, keep the bucket private and grant the service identity only the object permissions it needs under the `jobs/*` prefix. Prefer host-provided IAM credentials on EC2; for Render, store an IAM access-key pair as encrypted service environment variables and rotate it.

## Deployment smoke tests

1. Open both `/api/auth/health` and `/api/analysis/health` on their deployed service URLs; expect HTTP 200.
2. In the Vercel UI, register and log in; verify the browser receives the auth cookie and that profile access works.
3. Confirm browser requests reach the service URLs over HTTPS without CORS errors.
4. Submit a small valid model and dataset. Confirm `POST /api/analysis/run` returns HTTP 202 and a `jobId` quickly.
5. Poll `GET /api/analysis/<jobId>` until it reaches `completed` or `failed`; verify useful results or a clear failure message.
6. Confirm S3 objects are created for a successful run and are not publicly readable.
7. Verify an invalid job ID returns HTTP 400, an unknown valid ObjectId returns HTTP 404, and an oversized upload is rejected.
8. Check Render logs for successful Atlas connection and Python startup, and confirm no secrets or stack traces appear in client responses.
