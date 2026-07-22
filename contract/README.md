# Freelance Escrow Hub — Soroban Smart Contracts

This workspace contains four Soroban smart contracts for the Freelance Escrow Hub on the Stellar network.

## Contracts

| Contract | Directory | Description |
|----------|-----------|-------------|
| **Escrow** | `contracts/escrow/` | Manages escrow lifecycle: creation, funding, milestone releases, refunds, and dispute resolution. |
| **Milestone** | `contracts/milestone/` | Tracks project milestones with states: Pending -> InProgress -> Completed -> Approved/Rejected. |
| **Dispute** | `contracts/dispute/` | Handles dispute raising, evidence management, review, and resolution with verdicts and fund splits. |
| **Reputation** | `contracts/reputation/` | Maintains user reputation scores, ratings, project completion stats, and dispute history. |

## Prerequisites

- Rust (nightly toolchain)
- Soroban CLI (`cargo install soroban-cli`)
- Stellar network access (testnet/mainnet)

## Build

```bash
cargo build --release
```

## Test

```bash
cargo test
```

## Deploy

```bash
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/escrow.wasm \
  --source <identity> \
  --network testnet
```

Repeat for each contract (`milestone`, `dispute`, `reputation`).
