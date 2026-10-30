# TraceMem analysis service

Express API that accepts model and dataset uploads, returns a job ID, and runs the Python TraceMem pipeline asynchronously. S3 is supported for persistent artifact storage.

## Local run

From this directory:

```powershell
Copy-Item .env.example .env
npm install
python -m pip install -r ..\core-service\requirements.txt
npm run dev
```

Configure MongoDB as `tracemem_analysis` or use the provided local Mongo URI. For local filesystem storage use `STORAGE_MODE=local`. Set `PYTHON_PATH` to the Python executable for the environment containing the core dependencies.

`POST /api/analysis/run` responds with HTTP 202 and a `jobId`; poll `GET /api/analysis/:id`. Health is `GET /api/analysis/health`, registered before the dynamic ID route. Upload size defaults to 512 MB per file and can be changed with `MAX_FILE_SIZE_MB`.

## Render deployment

Leave Render's Root Directory at the repository root so both service and core files are available:

```text
Build Command: npm install --prefix services/analysis-service && python -m pip install -r services/core-service/requirements.txt
Start Command: npm --prefix services/analysis-service start
```

Set `NODE_VERSION=22`, install/provide Python 3, and configure `NODE_ENV=production`, `CLIENT_URL` as the exact Vercel HTTPS origin, `MONGO_URI` for the Atlas `tracemem_analysis` database, and:

```text
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

Render supplies `PORT`. The bucket must remain private; grant only required object access under `jobs/*`. The local filesystem is ephemeral on Render, so use S3 in production. Choose a service plan that can handle the Python model's memory and runtime requirements. EC2 is an alternative for heavier analysis workloads.

Only provide both AWS key variables or neither (for instance-role credentials). `AWS_REGION` and `S3_BUCKET` are required for S3 mode. `TEMP_DIR` is cleaned after each job; in-process jobs are interrupted by service restarts.
