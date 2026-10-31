# Stage 1: Build React + TypeScript Frontend
FROM node:22-slim AS frontend-builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html vite.config.ts tsconfig.json ./
COPY src ./src
ENV VITE_API_BASE_URL=""
RUN npm run build

# Stage 2: Python FastAPI + Chronos-Bolt + Static Frontend Production Runtime
FROM python:3.12-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Pre-cache amazon/chronos-bolt-tiny weights inside image for zero cold-start lag
RUN python3 -c "from chronos import BaseChronosPipeline; BaseChronosPipeline.from_pretrained('amazon/chronos-bolt-tiny', device_map='cpu')"

COPY backend ./backend
COPY engine ./engine
COPY --from=frontend-builder /app/dist ./dist

EXPOSE 8005
ENV PORT=8005

CMD ["uvicorn", "backend.server:app", "--host", "0.0.0.0", "--port", "8005"]
