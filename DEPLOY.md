# Freelance Escrow Hub — Production Deployment Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         DNS / CDN                                │
│                   (Cloudflare / AWS Route53)                     │
└─────────────────────────┬───────────────────────────────────────┘
                          │
          ┌───────────────┴───────────────┐
          │           Load Balancer        │
          │        (AWS ALB / Render)       │
          └───────┬───────────────┬───────┘
                  │               │
          ┌───────┴───────┐ ┌───┴────────────┐
          │  Frontend      │ │   Backend API   │
          │  Next.js 16    │ │   NestJS 10     │
          │  Port 3000     │ │   Port 4000     │
          │  Vercel/Render │ │   Render/AWS    │
          └───────┬───────┘ └───┬────────────┘
                  │             │
                  │     ┌───────┴────────┐
                  │     │  PostgreSQL     │
                  │     │  (Render / RDS) │
                  │     └────────────────┘
                  │
          ┌───────┴───────────────────────────────────────┐
          │               Stellar Network                   │
          │  (Testnet / Pubnet via Soroban RPC)             │
          │                                                │
          │  ┌──────────┐  ┌───────────┐  ┌────────────┐  │
          │  │  Escrow   │  │ Milestone  │  │  Dispute    │  │
          │  │ Contract  │  │ Contract   │  │  Contract   │  │
          │  └──────────┘  └───────────┘  └────────────┘  │
          │  ┌──────────┐                                  │
          │  │Reputation│                                   │
          │  │ Contract │                                   │
          │  └──────────┘                                  │
          └────────────────────────────────────────────────┘
```

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Environment Configuration](#2-environment-configuration)
3. [Database Setup](#3-database-setup)
4. [Backend Deployment](#4-backend-deployment)
5. [Frontend Deployment](#5-frontend-deployment)
6. [Soroban Smart Contract Deployment](#6-soroban-smart-contract-deployment)
7. [Storage (S3 / Cloudinary)](#7-storage-s3--cloudinary)
8. [CI/CD Pipeline](#8-cicd-pipeline)
9. [Monitoring & Logging](#9-monitoring--logging)
10. [Post-Deployment Verification](#10-post-deployment-verification)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Prerequisites

### Local Development
- **Node.js** 20.x LTS or later
- **npm** 10.x or later
- **Rust** nightly toolchain (for Soroban contracts)
- **Soroban CLI**: `cargo install soroban-cli`
- **PostgreSQL** 15+ (local dev or Docker)
- **Freighter Wallet** browser extension (for Stellar auth)

### Production Accounts
- **Stellar** testnet/pubnet account with USDC trustline
- **PostgreSQL** database (Render, AWS RDS, or Neon.tech)
- **S3 bucket** or **Cloudinary** account (for file uploads)
- **GitHub** repository (CI/CD via GitHub Actions)

### Recommended Hosting Platforms
| Service | Backend | Frontend | Database | Notes |
|---------|---------|----------|----------|-------|
| **Render** | Web Service (Docker) | Static Site | Managed Postgres | Easiest setup |
| **AWS** | ECS / App Runner | Amplify / S3+CloudFront | RDS | Most control |
| **Vercel** | N/A | Native Next.js support | N/A | Frontend only |
| **Railway** | Web Service | Static Site | Managed Postgres | Good middle ground |

---

## 2. Environment Configuration

### 2.1 Backend Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in all values:

```bash
cp backend/.env.example backend/.env
```

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string | `postgresql://user:pass@host:5432/db?schema=public` |
| `JWT_SECRET` | Yes | HMAC secret for JWT tokens (min 32 chars) | `openssl rand -hex 32` |
| `STELLAR_NETWORK` | Yes | Stellar network target | `TESTNET` or `PUBLIC` |
| `STELLAR_RPC_URL` | Yes | Soroban RPC endpoint | `https://soroban-testnet.stellar.org` |
| `CORSAIR_API_KEY` | No | Corsair integration API key | (get from Corsair dashboard) |
| `CORSAIR_SIGNING_SECRET` | No | Corsair webhook signing secret | (get from Corsair dashboard) |
| `CORSAIR_KEK` | No | Corsair key encryption key | (get from Corsair dashboard) |
| `APP_URL` | Yes | CORS origin for frontend | `https://app.yourdomain.com` |
| `PORT` | No | Backend listen port (default 4000) | `4000` |

### 2.2 Frontend Environment Variables

Create `frontend/.env.local`:

```bash
echo "NEXT_PUBLIC_API_URL=https://api.yourdomain.com" > frontend/.env.local
```

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Yes | Backend API base URL | `https://api.yourdomain.com` |

### 2.3 Stellar Account Setup

```bash
# Generate a Stellar keypair for the backend admin account
soroban keys generate --network testnet escrow-admin
soroban keys address escrow-admin  # Save this

# Fund with testnet XLM
# Visit: https://lab.stellar.org/account/fund

# Establish USDC trustline (testnet issuer)
soroban lab trustline \
  --asset USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5 \
  --source escrow-admin \
  --network testnet
```

---

## 3. Database Setup

### 3.1 Provision PostgreSQL

**Option A — Render Managed Postgres:**
```bash
# Created via Render Dashboard:
# 1. New → PostgreSQL
# 2. Select plan (Starter $7/mo is sufficient for MVP)
# 3. Note the "Internal Database URL" for DATABASE_URL
```

**Option B — AWS RDS:**
```bash
# Via AWS CLI
aws rds create-db-instance \
  --engine postgres \
  --db-instance-class db.t3.micro \
  --db-instance-identifier freelance-escrow-hub \
  --master-username postgres \
  --master-user-password <password> \
  --allocated-storage 20
```

**Option C — Neon.tech (Serverless PostgreSQL):**
```bash
# Sign up at neon.tech, create a project
# Copy the connection string (uses pooled connection for serverless)
```

### 3.2 Run Migrations

```bash
cd backend

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Run seed (dev only)
npx prisma db seed
```

For production, use migrations instead of `db push`:

```bash
npx prisma migrate deploy
```

### 3.3 Connection Pooling

For serverless/containerized deployments, configure connection pooling:

```
# Render: Use the "Internal Database URL" (already pooled)
# For direct connections, add to DATABASE_URL:
?connection_limit=5&pool_timeout=10
```

---

## 4. Backend Deployment

### 4.1 Dockerfile (Backend)

Create `backend/Dockerfile`:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json tsconfig*.json nest-cli.json ./
RUN npm ci
COPY prisma/ ./prisma/
RUN npx prisma generate
COPY src/ ./src/
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
RUN npx prisma generate
USER nestjs
EXPOSE 4000
ENV NODE_ENV=production
CMD ["node", "dist/main"]
```

### 4.2 Dockerfile (Frontend)

Create `frontend/Dockerfile`:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
```

Update `next.config.ts` for standalone output:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
};

export default nextConfig;
```

### 4.3 Docker Compose (Local / Single-Server)

Create `docker-compose.yml`:

```yaml
version: "3.8"

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: freelance_escrow_hub
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "4000:4000"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/freelance_escrow_hub?schema=public
      JWT_SECRET: ${JWT_SECRET:-dev-secret-change-in-production}
      STELLAR_NETWORK: TESTNET
      STELLAR_RPC_URL: https://soroban-testnet.stellar.org
      APP_URL: http://localhost:3000
    depends_on:
      postgres:
        condition: service_healthy

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_API_URL: http://localhost:4000
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  pgdata:
```

### 4.4 Deploy to Render

**Backend Web Service:**
```
1. Dashboard → New → Web Service
2. Connect GitHub repository
3. Root Directory: backend
4. Build Command: npm ci && npx prisma generate && npm run build
5. Start Command: node dist/main
6. Instance Type: Starter ($7/mo)
7. Add Environment Variables (all from .env.example)
8. Add a Managed PostgreSQL database
9. Deploy
```

**Frontend Static Site (Alternative to Docker):**
```
1. Dashboard → New → Static Site
2. Connect GitHub repository
3. Root Directory: frontend
4. Build Command: npm ci && npm run build
5. Publish Directory: out
6. Add Environment Variable: NEXT_PUBLIC_API_URL
```

For Next.js with SSR, use **Render Web Service** instead of Static Site, using the frontend Dockerfile above.

### 4.5 Deploy to AWS

**Backend (ECS Fargate):**
```bash
# Build and push to ECR
aws ecr create-repository --repository-name freelance-escrow-hub-backend
docker build -t backend ./backend
docker tag backend:latest <account>.dkr.ecr.<region>.amazonaws.com/backend:latest
docker push <account>.dkr.ecr.<region>.amazonaws.com/backend:latest

# Create ECS cluster and service
aws ecs create-cluster --cluster-name freelance-escrow-hub
aws ecs register-task-definition --cli-input-json file://aws/backend-task.json
aws ecs create-service --cluster freelance-escrow-hub --service-name backend ...
```

**Frontend (Amplify):**
```bash
# Connect GitHub repo to AWS Amplify
# Build settings: npm ci && npm run build
# Output directory: .next
```

### 4.6 Deploy to Vercel (Frontend Only)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel --prod

# Set environment variable
vercel env add NEXT_PUBLIC_API_URL
```

---

## 5. Frontend Deployment

### 5.1 Build Configuration

Ensure `next.config.ts` has standalone output (for containerized deployment):

```typescript
const nextConfig: NextConfig = {
  output: process.env.NODE_ENV === "production" ? "standalone" : undefined,
};
```

### 5.2 Static Export (Alternative)

```typescript
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
};
```

Note: Static export disables API routes and SSR. Use only if the frontend is fully client-side (which this project is — all data fetching happens client-side via hooks).

### 5.3 Health Check Endpoint

The backend exposes health at the root (`GET /`). The frontend can use this for health checks.

---

## 6. Soroban Smart Contract Deployment

### 6.1 Build Contracts

```bash
cd contract

# Build all contracts
cargo build --release

# Verify WASM files
ls -la target/wasm32-unknown-unknown/release/*.wasm
```

Expected outputs:
- `escrow.wasm`
- `milestone.wasm`
- `dispute.wasm`
- `reputation.wasm`

### 6.2 Deploy to Stellar Testnet

```bash
# Deploy Escrow contract
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/escrow.wasm \
  --source escrow-admin \
  --network testnet

# Output: CABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890 (contract ID)
# Save this as CONTRACT_ESCROW_ID

# Repeat for milestone, dispute, reputation
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/milestone.wasm \
  --source escrow-admin \
  --network testnet

soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/dispute.wasm \
  --source escrow-admin \
  --network testnet

soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/reputation.wasm \
  --source escrow-admin \
  --network testnet
```

### 6.3 Initialize Contracts

```bash
# Initialize escrow contract
soroban contract invoke \
  --id <CONTRACT_ESCROW_ID> \
  --source escrow-admin \
  --network testnet \
  -- \
  initialize \
  --admin GABC...YOUR_ADMIN_ADDRESS

# Initialize milestone contract
soroban contract invoke \
  --id <CONTRACT_MILESTONE_ID> \
  --source escrow-admin \
  --network testnet \
  -- \
  initialize \
  --admin GABC...YOUR_ADMIN_ADDRESS

# Initialize dispute contract
soroban contract invoke \
  --id <CONTRACT_DISPUTE_ID> \
  --source escrow-admin \
  --network testnet \
  -- \
  initialize \
  --admin GABC...YOUR_ADMIN_ADDRESS

# Initialize reputation contract
soroban contract invoke \
  --id <CONTRACT_REPUTATION_ID> \
  --source escrow-admin \
  --network testnet \
  -- \
  initialize \
  --admin GABC...YOUR_ADMIN_ADDRESS
```

### 6.4 Deploy to Mainnet

Same steps as testnet, but:
- Use `--network pubnet`
- Ensure account has XLM for deployment fees (~5 XLM per contract)
- Use production USDC issuer: `GA5ZSEJYB37JRC5AVCIA5MOP4RHTV335V2CEX6MYTUTDMGEYPNHTD`
- Update `STELLAR_NETWORK=PUBLIC` and `STELLAR_RPC_URL=https://soroban.stellar.org` in backend config

### 6.5 Update Backend with Contract IDs

After deploying, update the backend environment with contract addresses:

```
ESCROW_CONTRACT_ID=<deployed-escrow-id>
MILESTONE_CONTRACT_ID=<deployed-milestone-id>
DISPUTE_CONTRACT_ID=<deployed-dispute-id>
REPUTATION_CONTRACT_ID=<deployed-reputation-id>
```

The backend's `EscrowService`, `MilestonesService`, etc. need these to make on-chain calls.

---

## 7. Storage (S3 / Cloudinary)

### 7.1 AWS S3 (for submission URIs, evidence, avatars)

Create an S3 bucket and configure IAM:

```bash
aws s3 mb s3://freelance-escrow-hub-uploads --region us-east-1

# Create IAM user with programmatic access
aws iam create-user --user-name escrow-uploader
aws iam put-user-policy \
  --user-name escrow-uploader \
  --policy-name S3Upload \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject"],
      "Resource": "arn:aws:s3:::freelance-escrow-hub-uploads/*"
    }]
  }'
```

Add to backend `.env`:

```env
S3_BUCKET=freelance-escrow-hub-uploads
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=<from-iam-user>
S3_SECRET_ACCESS_KEY=<from-iam-user>
```

Install the SDK:

```bash
cd backend
npm install @aws-sdk/client-s3
```

### 7.2 Cloudinary (Simpler Alternative)

```env
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret
```

Install the SDK:

```bash
cd backend
npm install cloudinary
```

Update user avatar and submission URI upload endpoints to use Cloudinary's upload API.

### 7.3 CORS Configuration

**S3 CORS:**
```json
{
  "CORSRules": [{
    "AllowedOrigins": ["https://app.yourdomain.com"],
    "AllowedMethods": ["GET", "PUT"],
    "AllowedHeaders": ["*"]
  }]
}
```

**Cloudinary:** Configure in dashboard under Settings → Security → Allowed CORS domains.

---

## 8. CI/CD Pipeline

### 8.1 GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: test
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
        working-directory: backend
      - run: npx prisma generate
        working-directory: backend
      - run: npm test
        working-directory: backend
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test?schema=public
          JWT_SECRET: test-secret
          STELLAR_NETWORK: TESTNET

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
        working-directory: frontend
      - run: npm run build
        working-directory: frontend
        env:
          NEXT_PUBLIC_API_URL: http://localhost:4000

  build-contracts:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions-rust-lang/setup-rust-toolchain@v1
        with:
          target: wasm32-unknown-unknown
      - run: cargo build --release
        working-directory: contract

  deploy-backend:
    needs: [test-backend]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Render
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.RENDER_API_KEY }}" \
            -H "Content-Type: application/json" \
            "https://api.render.com/v1/services/${{ secrets.RENDER_BACKEND_ID }}/deploys"

  deploy-frontend:
    needs: [test-frontend]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: --prod

  deploy-contracts:
    needs: [build-contracts]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Stellar Testnet
        run: |
          soroban contract deploy \
            --wasm target/wasm32-unknown-unknown/release/escrow.wasm \
            --source admin \
            --network testnet
        working-directory: contract
        env:
          SOROBAN_SECRET_KEY: ${{ secrets.STELLAR_ADMIN_SECRET }}
```

### 8.2 GitHub Secrets

| Secret | Description |
|--------|-------------|
| `RENDER_API_KEY` | Render API key for trigger deploys |
| `RENDER_BACKEND_ID` | Render backend service ID |
| `VERCEL_TOKEN` | Vercel API token |
| `VERCEL_ORG_ID` | Vercel org/team ID |
| `VERCEL_PROJECT_ID` | Vercel project ID |
| `STELLAR_ADMIN_SECRET` | Stellar admin secret key |

---

## 9. Monitoring & Logging

### 9.1 Backend Logging

The NestJS backend already has built-in logging via `Logger`. In production, configure structured JSON logging:

```bash
npm install @nestjs/winston winston
```

Update `main.ts` to use Winston with transports for:
- Console (JSON format)
- File rotation
- Cloud watch / Logtail / Axiom

### 9.2 Health Checks

**Backend endpoint:** `GET /` returns `{ status: "ok", timestamp: ... }`

Configure Render / AWS health check to hit `/` every 30 seconds.

### 9.3 Alerts

Set up alerts for:
- 5xx error rate > 1%
- P99 latency > 2s
- Database connection pool exhaustion (CPU > 80%)
- Soroban RPC failures

### 9.4 Error Tracking

```bash
# Sentry
npm install @sentry/node @sentry/nextjs
```

Configure DSN in both `backend/main.ts` and `frontend/src/app/layout.tsx`.

---

## 10. Post-Deployment Verification

### 10.1 Smoke Tests

```bash
# 1. Health check
curl https://api.yourdomain.com/
# Expected: { "status": "ok", ... }

# 2. Swagger docs
curl https://api.yourdomain.com/api/docs
# Expected: Swagger UI HTML

# 3. Auth flow
curl -X POST https://api.yourdomain.com/auth/challenge \
  -H "Content-Type: application/json" \
  -d '{"publicKey":"GABC..."}'
# Expected: { "challenge": "...", "expiresAt": "..." }

# 4. Frontend
curl https://app.yourdomain.com
# Expected: 200 OK, HTML

# 5. Database
curl https://api.yourdomain.com/auth/me \
  -H "Authorization: Bearer <jwt>"
# Expected: User object
```

### 10.2 Contract Verification

```bash
# Verify escrow contract is initialized
soroban contract invoke \
  --id <CONTRACT_ESCROW_ID> \
  --network testnet \
  -- \
  get_escrow_count
# Expected: 0 (no escrows yet)

# Verify milestone contract
soroban contract invoke \
  --id <CONTRACT_MILESTONE_ID> \
  --network testnet \
  -- \
  get_project_milestones \
  --project_id 1
# Expected: []
```

### 10.3 End-to-End Flow

```bash
# 1. Connect Freighter → Sign In
# 2. Create a project with milestones
# 3. Fund escrow via Freighter
# 4. Start milestone → submit work → approve
# 5. Verify payment release
```

---

## 11. Troubleshooting

### Database Connection Issues
```
Error: Can't reach database server
→ Check DATABASE_URL format and network rules
→ Render: use Internal Database URL (not External)
→ AWS: ensure security group allows inbound on port 5432
→ Check connection pool limits
```

### CORS Errors
```
Access to fetch at 'https://api.yourdomain.com' has been blocked by CORS
→ Verify APP_URL in backend env matches exactly (no trailing slash)
→ For Vercel frontend + Render backend: ensure CORS origin is set
→ Check for protocol mismatch (http vs https)
```

### Soroban Contract Issues
```
Error: (InvalidInput) Contract invocation failed
→ Verify contract IDs in backend config
→ Ensure admin account has enough XLM for fees
→ Check network (testnet vs pubnet) matches between deploy and invoke
→ Ensure contract was initialized after deploy
```

### x402 / Payment Issues
```
Error: Payment authorization failed
→ Verify Stellar account has USDC trustline
→ Ensure sufficient USDC balance
→ Check facilitator URL configuration
→ Verify network passphrase matches (Testnet vs Public)
```

### Prisma Migration Issues
```
Error: P1001: Can't reach database server
→ RDS: check if database is publicly accessible
→ Render: use internal database URL within same region
→ Reset: `npx prisma db push --force-reset` (dev only)
```

### Common HTTP Status Codes
| Code | Meaning | Resolution |
|------|---------|------------|
| 401 | Unauthorized | Re-authenticate via Freighter |
| 403 | Forbidden | Check role/ownership |
| 404 | Not found | Verify resource ID |
| 409 | Conflict | Resource already exists |
| 422 | Validation error | Check request body |
| 500 | Internal error | Check server logs |

---

## Quick Start (One-Command Local)

```bash
# 1. Clone and install
git clone <repo> && cd Proj1
cd backend && npm ci && npx prisma generate && npx prisma db push && npx prisma db seed
cd ../frontend && npm ci

# 2. Start backend (terminal 1)
cd backend
npm run start:dev

# 3. Start frontend (terminal 2)
cd frontend
npm run dev

# 4. Open http://localhost:3000
# 5. Connect Freighter wallet
# 6. Create and fund a project
```

---

## Security Checklist

- [ ] JWT_SECRET is at least 32 random characters (use `openssl rand -hex 32`)
- [ ] Database password is not the default
- [ ] CORS origin is set to the exact frontend domain
- [ ] Stellar admin secret key is stored in secrets manager, not in code
- [ ] Raw body capture is enabled for webhook HMAC verification
- [ ] All Soroban contracts have `require_auth()` on state-changing functions
- [ ] PostgreSQL is not publicly accessible (use private networking)
- [ ] Backend logs do not leak secrets or private keys
- [ ] Rate limiting is enabled (add `@nestjs/throttler`)
- [ ] S3/Cloudinary bucket is not publicly writable
