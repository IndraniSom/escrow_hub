# Freelance Escrow Hub

A decentralized freelancing marketplace built on Stellar and Soroban smart contracts. **Stellar** enables instant, low-cost global payments in USDC/XLM, **Soroban** smart contracts manage escrow, milestones, disputes, and reputation on-chain, and **Corsair** automates notifications, documentation, and external integrations with GitHub, Slack, and Gmail.

Freelancers and clients stop worrying about payment delays, platform commissions, and trust issues. Freelance Escrow Hub delivers trustless escrow, instant settlements, automated milestone releases, transparent on-chain agreements, and seamless workflows with developer tools — all powered by Stellar.

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Smart Contracts](#smart-contracts)
- [Frontend ↔ Smart Contract Integration](#frontend--smart-contract-integration)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Deploying the Contracts](#deploying-the-contracts)
- [Roadmap](#roadmap)

---

## Features

- **User Onboarding** — wallet-based authentication with Freighter, profile setup, and verification
- **Project Creation** — clients publish projects with descriptions, budgets, and milestones
- **Milestone Management** — define deliverables, set deadlines, and link to GitHub PRs and commits
- **Escrow Funding** — clients deposit USDC/XLM into on-chain escrow, locked until milestone approval
- **Milestone Approval** — clients review deliverables and approve releases via Soroban
- **Automated Release** — smart contracts transfer funds to freelancers on milestone completion
- **Dispute Handling** — mediation system for disagreements with arbiter resolution
- **Reputation System** — on-chain reputation scores, reviews, and performance metrics
- **Notifications** — real-time updates via Corsair (Slack, Email, In-App)
- **Workflow Automation** — GitHub PR/commit tracking, Slack alerts, Gmail summaries, Calendar sync
- **Analytics Dashboard** — earnings, project history, dispute rates, completion metrics
- **Multi-Signature Escrow** — optional multi-sig funding for high-value projects

---

## Architecture

```
┌─────────────────┐        ┌──────────────────────┐        ┌───────────────────────┐
│   Frontend      │  REST  │      Backend         │  RPC   │   Stellar Network     │
│   Next.js 16    │ ─────► │      NestJS          │ ─────► │  Soroban + Horizon    │
│   Freighter     │  JWT   │  Prisma (PostgreSQL) │        │  Escrow Contract      │
│   Wallet        │ ◄───── │                      │ ◄───── │  Milestone Contract   │
└─────────────────┘        └──────────────────────┘        │  Dispute Contract     │
        │                           │                       │  Reputation Contract  │
        │  Wallet signatures        │  Corsair             └───────────────────────┘
        │  OAuth connections        │  GitHub/Slack              │
        ▼                           ▼                            ▼
   Freighter             External integrations        USDC/XLM settlement
   (Connect/Sign)        (Webhooks, API calls)        & on-chain events
```

**User flow:** Client creates project and funds escrow → Soroban locks funds → Freelancer completes milestone and submits deliverables → GitHub activity verified via Corsair → Client approves → Smart contract releases payment to freelancer.

---

## Smart Contracts

The Freelance Escrow Hub includes **four interconnected Soroban contracts** written in Rust with the Soroban SDK, located in [`contract/contracts/`](contract/contracts/).

### Deployed Contracts

| Contract | Network | Address | Explorer |
|---|---|---|---|
| **Escrow** | Stellar Testnet | `CDSMU7GIFOQBYQIX5MFXMWYYJ6ITMFV5MSLNLP5MDX4ZII35YRMVRQ3V` | [stellar.expert](https://stellar.expert/explorer/testnet/contract/CDSMU7GIFOQBYQIX5MFXMWYYJ6ITMFV5MSLNLP5MDX4ZII35YRMVRQ3V) |
| **Milestone** | Stellar Testnet | `CDOA6TQYS7LW3FDIWAGYZGUAN6TFSTYO6V5DEUPQFRQAIL5PSCPFLYAS` | [stellar.expert](https://stellar.expert/explorer/testnet/contract/CDOA6TQYS7LW3FDIWAGYZGUAN6TFSTYO6V5DEUPQFRQAIL5PSCPFLYAS) |
| **Dispute** | Stellar Testnet | `CADUAHEKABD3A4DYZCXOJ6XAAC2JLTDMNXOUJMI2NGCMI4REAWEFGAIG` | [stellar.expert](https://stellar.expert/explorer/testnet/contract/CADUAHEKABD3A4DYZCXOJ6XAAC2JLTDMNXOUJMI2NGCMI4REAWEFGAIG) |
| **Reputation** | Stellar Testnet | `CCF7QXREU4U6OWZCQFBK4GLAUSXBNWB5QE4UY7Q23JFE6XQCMYYEXIVJ` | [stellar.expert](https://stellar.expert/explorer/testnet/contract/CCF7QXREU4U6OWZCQFBK4GLAUSXBNWB5QE4UY7Q23JFE6XQCMYYEXIVJ) |

> ⚠️ **Important:** These addresses are required for the backend to verify transactions on-chain. Set them in `backend/.env` as `SOROBAN_ESCROW_CONTRACT_ID`, `SOROBAN_MILESTONE_CONTRACT_ID`, etc. (see [Environment Variables](#environment-variables)).

### Contract Functions

#### **Escrow Contract**
| Function | Signature | Description |
|---|---|---|
| `fund_escrow` | `(client: Address, project_id: Symbol, amount: i128)` | Client deposits funds into escrow. Requires client auth. |
| `release_payment` | `(project_id: Symbol, amount: i128, recipient: Address)` | Releases escrowed funds to freelancer. Requires milestone contract auth. |
| `refund_escrow` | `(project_id: Symbol, amount: i128, client: Address)` | Refunds escrowed funds to client on dispute. Requires dispute contract auth. |
| `get_escrow_balance` | `(project_id: Symbol) → i128` | Read-only. Returns current escrow balance for a project. |

#### **Milestone Contract**
| Function | Signature | Description |
|---|---|---|
| `create_milestone` | `(project_id: Symbol, freelancer: Address, deliverable: Symbol, deadline: u64, amount: i128)` | Creates a new milestone. Requires freelancer auth. |
| `submit_deliverable` | `(milestone_id: Symbol, github_pr_url: String)` | Freelancer submits work with GitHub PR link. Requires freelancer auth. |
| `approve_milestone` | `(milestone_id: Symbol)` | Client approves milestone and triggers payment release. Requires client auth. |
| `cancel_milestone` | `(milestone_id: Symbol)` | Cancels a milestone. Requires client or freelancer auth. |
| `get_milestone_status` | `(milestone_id: Symbol) → Symbol` | Read-only. Returns milestone status (pending, submitted, approved, cancelled). |

#### **Dispute Contract**
| Function | Signature | Description |
|---|---|---|
| `create_dispute` | `(milestone_id: Symbol, initiator: Address, reason: Symbol)` | Initiates a dispute. Requires initiator auth. |
| `submit_evidence` | `(dispute_id: Symbol, evidence_url: String)` | Party submits evidence for dispute resolution. Requires auth. |
| `resolve_dispute` | `(dispute_id: Symbol, winner: Address)` | Arbiter resolves dispute and triggers payment (to winner or refund). Requires arbiter auth. |
| `get_dispute_status` | `(dispute_id: Symbol) → Symbol` | Read-only. Returns dispute status (open, resolved, closed). |

#### **Reputation Contract**
| Function | Signature | Description |
|---|---|---|
| `update_reputation` | `(user: Address, rating: i32, review: Symbol)` | Records a review and updates user reputation score. Requires reviewer auth. |
| `get_reputation` | `(user: Address) → (score: i32, reviews_count: u32)` | Read-only. Returns reputation score and review count. |
| `emit_completion_event` | `(project_id: Symbol, freelancer: Address, client: Address, amount: i128)` | Emits event on successful project completion. |

### Storage Model

Each contract maintains isolated storage keyed by project/milestone/dispute/user identifiers:

- **Escrow:** `DataKey::EscrowBalance(Symbol)` → balance, `DataKey::ClientFunds(Address)` → deposits
- **Milestone:** `DataKey::Milestone(Symbol)` → milestone details, status, amount
- **Dispute:** `DataKey::Dispute(Symbol)` → dispute details, evidence, resolution
- **Reputation:** `DataKey::UserRep(Address)` → score, review count, ratings history

### Contract Interop

- **Milestone → Escrow:** When a milestone is approved, the Milestone contract calls `release_payment` on Escrow
- **Dispute → Escrow:** When a dispute is resolved in the client's favor, Dispute calls `refund_escrow` on Escrow
- **All → Reputation:** On milestone completion or dispute resolution, contracts trigger reputation updates
- **Events:** All contracts emit events (milestone created/approved, payment released, dispute resolved, reputation updated) consumed by Corsair for notifications

### Contract Source

Full source: [contract/contracts/](contract/contracts/)

- [`contract/contracts/escrow/src/lib.rs`](contract/contracts/escrow/src/lib.rs)
- [`contract/contracts/milestone/src/lib.rs`](contract/contracts/milestone/src/lib.rs)
- [`contract/contracts/dispute/src/lib.rs`](contract/contracts/dispute/src/lib.rs)
- [`contract/contracts/reputation/src/lib.rs`](contract/contracts/reputation/src/lib.rs)

---

## Frontend ↔ Smart Contract Integration

Freelance Escrow Hub integrates the Soroban contracts through the **backend as the single bridge** — the frontend never talks to contracts directly. This keeps wallet signatures minimal, keeps sensitive authorization server-side, and lets the backend fall back gracefully if the RPC is unreachable.

### Integration Flow

```
1. FRONTEND (Freighter wallet)
   ├─ User connects Freighter → gets Stellar public address (G...)
   ├─ Requests challenge → signs with Freighter → logs in (JWT)
   └─ User creates project/milestone → POST /projects, /milestones
        └─ Backend wires to Soroban contracts

2. BACKEND (NestJS)
   ├─ ProjectsService, MilestonesService, DisputesService
   │    ├─ Stores project/milestone/dispute metadata in PostgreSQL
   │    ├─ Initiates on-chain transactions via Soroban RPC
   │    └─ Monitors contract events for state changes
   └─ RepresentationService & NotificationsService
        ├─ Tracks reputation scores from Reputation contract
        └─ Triggers Corsair webhooks → Slack/Gmail/GitHub notifications

3. ON-CHAIN (Soroban Contracts)
   ├─ Escrow Contract: holds client funds until milestone approval
   ├─ Milestone Contract: tracks deliverables and approval flow
   ├─ Dispute Contract: mediates disagreements
   └─ Reputation Contract: maintains user scores
        └─ Contracts emit events → backend listens → notifications sent
```

### Key Code Paths

| Layer | File | Role |
|---|---|---|
| Frontend wallet | `frontend/src/lib/freighter.ts` | Freighter connect/sign utilities |
| Frontend API client | `frontend/src/lib/api.ts` | REST client → backend (JWT auth) |
| Frontend Stellar helpers | `frontend/src/lib/stellar.ts` | Horizon balances, Friendbot funding |
| Backend contract bridge | `backend/src/stellar/stellar.service.ts` | Transaction simulation & RPC calls to contracts |
| Backend project logic | `backend/src/projects/projects.service.ts` | Project CRUD, escrow initiation |
| Backend milestone logic | `backend/src/milestones/milestones.service.ts` | Milestone lifecycle, approval, payment release |
| Backend dispute logic | `backend/src/disputes/disputes.service.ts` | Dispute creation, evidence, resolution |
| Backend reputation logic | `backend/src/reputation/reputation.service.ts` | Reputation tracking, score updates |
| Backend notifications | `backend/src/notifications/notifications.service.ts` | Corsair webhook triggers |
| Contracts | `contract/contracts/*/src/lib.rs` | Escrow, Milestone, Dispute, Reputation registries |

### How On-Chain Transactions Work

The backend builds transactions to call contract functions and submits them to the Soroban RPC server:

```typescript
// backend/src/stellar/stellar.service.ts (example)
const escrowContract = new Contract(escrowContractId);
const call = escrowContract.call('fund_escrow', [
  Address.fromString(clientAddress).toScVal(),
  xdr.ScVal.scvSymbol('project_123'),
  nativeToScVal(amount, types.i128()),
]);

const tx = await server.prepareTransaction(
  new TransactionBuilder(new Account(clientAddress, '0'), {
    fee: '100',
    networkPassphrase: this.networkPassphrase,
  })
    .addOperation(call)
    .setTimeout(30)
    .build(),
);

const response = await server.submitTransaction(tx);
// Listen for confirmation via polling or event stream
```

**Fallback behavior:** if contract IDs are unset or the RPC is unreachable, the backend falls back to local state management (demo mode). Swap in live contract IDs and a live RPC URL for production.

### Environment Wiring

```env
# backend/.env
SOROBAN_ESCROW_CONTRACT_ID=CDSMU7GIFOQBYQIX5MFXMWYYJ6ITMFV5MSLNLP5MDX4ZII35YRMVRQ3V
SOROBAN_MILESTONE_CONTRACT_ID=CDOA6TQYS7LW3FDIWAGYZGUAN6TFSTYO6V5DEUPQFRQAIL5PSCPFLYAS
SOROBAN_DISPUTE_CONTRACT_ID=CADUAHEKABD3A4DYZCXOJ6XAAC2JLTDMNXOUJMI2NGCMI4REAWEFGAIG
SOROBAN_REPUTATION_CONTRACT_ID=CCF7QXREU4U6OWZCQFBK4GLAUSXBNWB5QE4UY7Q23JFE6XQCMYYEXIVJ
STELLAR_RPC_URL=https://soroban-testnet.stellar.org
STELLAR_NETWORK=testnet
PLATFORM_WALLET_ADDRESS=G...
FACILITATOR_URL=https://www.x402.org/facilitator
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, Tailwind CSS 4, Freighter API, `@stellar/stellar-sdk` |
| Backend | NestJS 10, Prisma ORM, JWT auth, `@stellar/stellar-sdk` |
| Database | PostgreSQL (production) / SQLite (dev) |
| Blockchain | Stellar (testnet) + Soroban smart contracts (Rust, `soroban-sdk` 22) |
| Automation | Corsair (GitHub, Slack, Gmail, webhooks) |

---

## Project Structure

```
├── contract/                   # Soroban smart contracts (Rust workspace)
│   ├── contracts/
│   │   ├── escrow/            # Escrow contract — fund, release, refund
│   │   ├── milestone/         # Milestone contract — create, approve, complete
│   │   ├── dispute/           # Dispute contract — mediate, resolve
│   │   └── reputation/        # Reputation contract — rate, score
│   └── Cargo.toml
├── backend/                    # NestJS API
│   ├── src/
│   │   ├── app.module.ts
│   │   ├── main.ts
│   │   ├── auth/              # Challenge-based wallet auth (JWT)
│   │   ├── projects/          # Project CRUD, escrow management
│   │   ├── milestones/        # Milestone lifecycle
│   │   ├── disputes/          # Dispute handling & resolution
│   │   ├── reputation/        # Reputation tracking
│   │   ├── notifications/     # Corsair webhooks, alerts
│   │   ├── integrations/      # GitHub, Slack, Gmail OAuth
│   │   ├── common/            # Guards, DTOs, utilities
│   │   ├── config/            # Environment config
│   │   ├── prisma/            # Database service
│   │   ├── stellar/           # Soroban contract bridge
│   │   ├── users/             # User profiles & settings
│   │   ├── wallet/            # Wallet balances & transactions
│   │   └── webhooks/          # External webhook handling
│   ├── prisma/
│   │   └── schema.prisma      # Data model (User, Project, Milestone, etc.)
│   └── package.json
└── frontend/                   # Next.js app
    ├── src/
    │   ├── app/               # Pages: landing, auth, onboarding, dashboard
    │   ├── components/        # Reusable UI components
    │   ├── context/           # React context (wallet, auth)
    │   ├── hooks/             # Custom hooks
    │   └── lib/               # api.ts, freighter.ts, stellar.ts, etc.
    └── package.json
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- Rust & Cargo (only for contract work)
- [Freighter](https://freighter.app) browser extension (for wallet auth)
- [Soroban CLI](https://soroban.stellar.org/docs/getting-started/setup) (only for contract deployment)
- PostgreSQL 14+ (or SQLite for dev)

### 1. Run the backend

```bash
cd backend
npm install
cp .env.example .env.local   # adjust as needed (see env vars below)
npm run prisma:generate
npm run prisma:push
npm run start:dev             # http://localhost:3001
```

### 2. Run the frontend

```bash
cd frontend
npm install
npm run dev                    # http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000), connect Freighter (or fund via Friendbot on testnet), complete onboarding, and create your first project!

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | Backend port |
| `JWT_SECRET` | — | Secret for signing JWTs |
| `STELLAR_NETWORK` | `testnet` | `testnet` or `public` |
| `STELLAR_RPC_URL` | `https://soroban-testnet.stellar.org` | Soroban RPC endpoint |
| `SOROBAN_ESCROW_CONTRACT_ID` | — | **Deployed Escrow contract address** |
| `SOROBAN_MILESTONE_CONTRACT_ID` | — | **Deployed Milestone contract address** |
| `SOROBAN_DISPUTE_CONTRACT_ID` | — | **Deployed Dispute contract address** |
| `SOROBAN_REPUTATION_CONTRACT_ID` | — | **Deployed Reputation contract address** |
| `PLATFORM_WALLET_ADDRESS` | — | Stellar address for platform payouts |
| `FACILITATOR_URL` | `https://www.x402.org/facilitator` | x402 facilitator endpoint (optional) |
| `DATABASE_URL` | — | Prisma DB URL (PostgreSQL or SQLite) |

### Frontend (`.env.local`)

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | Backend base URL |

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/auth/challenge?address=` | Wallet auth challenge |
| `POST` | `/auth/login` | Verify signature, issue JWT |
| `GET` | `/auth/profile` | Current user profile |

### Projects
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/projects` | List all projects |
| `GET` | `/projects/:id` | Project detail |
| `POST` | `/projects` | Create project (client) |
| `PATCH` | `/projects/:id` | Update project |
| `DELETE` | `/projects/:id` | Cancel project |

### Milestones
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/milestones` | List my milestones |
| `GET` | `/milestones/:id` | Milestone detail |
| `POST` | `/milestones` | Create milestone (body: `projectId`, `deliverable`, `deadline`, `amount`) |
| `POST` | `/milestones/:id/submit` | Submit deliverable (body: `githubPrUrl`) |
| `POST` | `/milestones/:id/approve` | Approve & release (client) |
| `DELETE` | `/milestones/:id` | Cancel milestone |

### Disputes
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/disputes` | List my disputes |
| `GET` | `/disputes/:id` | Dispute detail |
| `POST` | `/disputes` | Create dispute (body: `milestoneId`, `reason`) |
| `POST` | `/disputes/:id/evidence` | Submit evidence (body: `evidenceUrl`) |
| `POST` | `/disputes/:id/resolve` | Resolve dispute (arbiter; body: `winner`) |

### Reputation
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/reputation/:userId` | User reputation score |
| `POST` | `/reputation` | Submit review (body: `rating`, `review`) |

### Escrow & Wallet
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/wallet` | Wallet balance & transaction history |
| `POST` | `/escrow/fund` | Fund escrow (body: `projectId`, `amount`) |
| `GET` | `/escrow/:projectId` | Escrow balance for project |

### Integrations
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/integrations/github/connect` | Start GitHub OAuth |
| `GET` | `/integrations/slack/connect` | Start Slack OAuth |
| `GET` | `/integrations` | List connected integrations |

---

## Deploying the Contracts

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for the full guide. Quick version:

```bash
rustup target add wasm32-unknown-unknown
cargo install --locked soroban-cli

soroban network add testnet \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015"

soroban keys generate --network testnet deployer
soroban keys fund deployer --network testnet

# Build & deploy each contract
cd contract/contracts/escrow
cargo build --target wasm32-unknown-unknown --release
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/escrow.wasm \
  --source deployer \
  --network testnet
```

The printed addresses are your contract IDs — update `backend/.env` with:
- `SOROBAN_ESCROW_CONTRACT_ID`
- `SOROBAN_MILESTONE_CONTRACT_ID`
- `SOROBAN_DISPUTE_CONTRACT_ID`
- `SOROBAN_REPUTATION_CONTRACT_ID`

---

## Roadmap

- [ ] Mainnet deployment of all four contracts
- [ ] Advanced dispute mediation with multi-arbiter voting
- [ ] Escrow insurance pool for high-value projects
- [ ] Portfolio builder & freelancer marketplace discovery
- [ ] API for third-party integrations
- [ ] Mobile app (React Native)
- [ ] Governance token & DAO for platform decisions
- [ ] Corsair advanced analytics & reporting dashboard

---

## License

Private / internal project. Contact the maintainers for licensing questions.
