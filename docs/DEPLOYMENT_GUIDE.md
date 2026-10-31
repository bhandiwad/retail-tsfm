# Deployment Guide
## Pandita's Adaptive Demand Decision Layer (ADDL)

This guide covers all supported deployment topologies for **Pandita's Adaptive Demand Decision Layer**:
1. **Local Development & Executive Workstation** (`Vite` + `FastAPI`)
2. **Single-Container Docker / Docker Compose** (Unified Full-Stack Production Server)
3. **Cloud PaaS Deployment** (Render, Railway, Google Cloud Run, AWS App Runner, Fly.io)
4. **Split Frontend + Backend Deployment** (Vercel / Netlify + FastAPI Cloud Service)
5. **Enterprise Retailer VPC Deployment** (Private Cloud / Air-Gapped Snowflake & SAP Overlay)

---

## 1. Local Development Deployment

### 1.1 Clone & Install
```bash
git clone https://github.com/bhandiwad/retail-tsfm.git
cd retail-tsfm

# 1. Install Frontend Dependencies
npm install

# 2. Create Python Virtual Environment & Install Backend Dependencies
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

### 1.2 Configure Environment Variables
Copy `.env.example` to `.env` and add your Central AI API key:
```bash
cp .env.example .env
```
Edit `.env`:
```ini
OPENROUTER_API_KEY=your-api-key-here
OPENROUTER_MODEL=google/gemini-2.5-flash
```
*(Alternatively, start the app and configure your key directly via the **AI Engine** button in the top-right UI header.)*

### 1.3 Run Frontend & Backend
```bash
# Terminal 1: Start the FastAPI Quantitative & AI Backend (http://localhost:8005)
npm run api

# Terminal 2: Start the Vite React Frontend (http://localhost:5173)
npm run dev
```

---

## 2. Docker & Docker Compose Deployment (Recommended for Production & PoC)

The repository includes a multi-stage [`Dockerfile`](file:///Users/pb/retail-tsfm/Dockerfile) that:
1. Builds the optimized React + TypeScript production bundle (`dist/`).
2. Installs the Python quantitative forecasting stack (`chronos-forecasting`, `statsforecast`, `torch`, `fastapi`).
3. Pre-caches the `amazon/chronos-bolt-tiny` foundation model weights inside the container image so startup has zero download latency.
4. Serves both the **Frontend UI** and the **`/api/*` endpoints** from a single unified FastAPI process on port `8005`.

### 2.1 Launch with Docker Compose
```bash
cp .env.example .env
# Add your OPENROUTER_API_KEY in .env

docker compose up --build -d
```
Once running, open **http://localhost:8005/** in your browser.

### 2.2 Run with Standalone Docker CLI
```bash
docker build -t pandita-addl:latest .
docker run -d -p 8005:8005 --env-file .env --name pandita-addl pandita-addl:latest
```

---

## 3. Cloud PaaS Deployment (Render, Railway, Google Cloud Run)

Because [`Dockerfile`](file:///Users/pb/retail-tsfm/Dockerfile) bundles both the frontend and backend and respects the dynamic `$PORT` environment variable, you can deploy the entire platform to any container cloud in one step:

### 3.1 Google Cloud Run
```bash
gcloud run deploy pandita-addl \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --port 8005 \
  --set-env-vars="OPENROUTER_API_KEY=your-key,OPENROUTER_MODEL=google/gemini-2.5-flash"
```

### 3.2 Render / Railway
1. Connect your GitHub repository (`https://github.com/bhandiwad/retail-tsfm`) to **Render** or **Railway**.
2. Select **Docker** as the runtime environment (auto-detected via `Dockerfile`).
3. Add environment variables in the dashboard:
   * `OPENROUTER_API_KEY`: `<your-key>`
   * `OPENROUTER_MODEL`: `google/gemini-2.5-flash`
   * `PORT`: `8005`
4. Deploy (allocate at least `2 GB RAM` for PyTorch + `Chronos-Bolt` weights).

---

## 4. Split Deployment (Vercel / Netlify Frontend + Cloud Backend)

If you prefer hosting the React UI on a global edge CDN (Vercel or Netlify) and the Python AI backend separately:

1. **Deploy Backend:** Deploy the repo to Cloud Run / Railway / Render and note its public URL (e.g., `https://addl-api.yourdomain.com`).
2. **Deploy Frontend (Vercel / Netlify):**
   * **Build Command:** `npm run build`
   * **Output Directory:** `dist`
   * **Environment Variable:** `VITE_API_BASE_URL=https://addl-api.yourdomain.com`

---

## 5. Enterprise Customer VPC Deployment (Retail Pilot Architecture)

When deploying for a retail pilot (e.g., inside a customer's AWS, GCP, or Azure VPC):
* **Network Security:** Run the Docker container inside a private subnet behind an internal Application Load Balancer (ALB) with SSO/Okta authentication.
* **Data Warehouse Read-Only Sync:** Grant a read-only service principal to the customer's Snowflake or BigQuery dataset (`WEEKLY_SKU_STORE_POS`, `INVENTORY_ON_HAND_SNAPSHOT`, `PROMO_MARKETING_CALENDAR`).
* **Zero Data Training Assurance:** `Chronos-Bolt` and `StatsForecast` execute 100% locally inside the container memory; no historical POS arrays leave the container for time-series inference.
