
# Deploying Soroban Smart Contracts to Stellar Testnet

This guide covers the general steps to build and deploy **any** Soroban smart contract(s) to the Stellar **testnet**. It includes both the raw `soroban-cli` commands and, optionally, how a `Makefile` can wrap them for convenience.

> Replace `<contract_name>` below with your actual contract/package name(s).

---

## 1. Prerequisites

- **Rust & Cargo** — [rustup.rs](https://rustup.rs)
- **Soroban CLI** — install with:
  ```bash
  cargo install --locked soroban-cli
  ```
- The `wasm32v1-none` Rust target:
  ```bash
  rustup target add wasm32v1-none
  ```

---

## 2. One-Time Environment Setup

### 2.1 Register the testnet network

```bash
soroban network add testnet \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015"
```

### 2.2 Generate a deployer identity

```bash
soroban keys generate --network testnet deployer
soroban keys address deployer
```

Save the printed address — you'll need it to fund the account.

### 2.3 Fund the deployer via Friendbot

```bash
soroban keys fund deployer --network testnet
```

This sends the `deployer` account testnet XLM to cover transaction fees.

---

## 3. Build Your Contract(s)

From your project root (wherever the contract's `Cargo.toml` lives):

```bash
cargo build --target wasm32v1-none --release
```

Or, for a single contract in a multi-package (workspace) project:

```bash
cargo build -p <contract_name> --target wasm32v1-none --release
```

Output `.wasm` files land in:

```
target/wasm32v1-none/release/<contract_name>.wasm
```

---

## 4. (Optional) Test & Lint

```bash
cargo test               # all tests
cargo test -p <contract_name>   # single contract's tests

cargo clippy --all -- -D warnings   # lint
cargo fmt --all                     # format
```

---

## 5. Deploy to Testnet

```bash
soroban contract deploy \
  --wasm target/wasm32v1-none/release/<contract_name>.wasm \
  --source deployer \
  --network testnet
```

This prints the deployed **contract address** — save it. If you have multiple contracts and some depend on others (e.g. one contract needs to call another), deploy them in dependency order and pass the earlier addresses into the later contracts' `init`/constructor calls as needed.

Repeat this command once per contract, swapping in each `.wasm` path.

---

## 6. Clean Build Artifacts (Optional)

```bash
cargo clean
```

---

## Quick Reference

| Command                                                                       | Purpose                         |
| ----------------------------------------------------------------------------- | ------------------------------- |
| `rustup target add wasm32v1-none`                                           | Add the WASM build target       |
| `cargo install --locked soroban-cli`                                        | Install the Soroban CLI         |
| `soroban network add testnet ...`                                           | Register the testnet network    |
| `soroban keys generate --network testnet deployer`                          | Create a deployer identity      |
| `soroban keys fund deployer --network testnet`                              | Fund the deployer via Friendbot |
| `cargo build --target wasm32v1-none --release`                              | Build contract(s)               |
| `soroban contract deploy --wasm <path> --source deployer --network testnet` | Deploy a contract               |
| `cargo clean`                                                               | Remove build artifacts          |

---

## Optional: Wrapping These in a Makefile

If you'd rather not type these commands by hand each time, you can wrap them in a `Makefile` with targets like `build`, `deploy-<name>`, etc. — substituting your own contract names and package layout. A Makefile isn't required; it's just a convenience layer around the same `cargo`/`soroban` commands above.

---

## Troubleshooting

- **`soroban: command not found`** — Ensure `~/.cargo/bin` is on your `PATH`.
- **Deployment fails with insufficient balance** — Re-run the Friendbot funding step; it can occasionally need a retry.
- **`wasm32v1-none` target not found** — Re-run `rustup target add wasm32v1-none` and confirm with `rustup target list --installed`.
- **Multiple contracts need to reference each other** — Deploy in dependency order, and manually pass each deployed contract's address into the next contract's setup/init call — the CLI doesn't wire this automatically.
