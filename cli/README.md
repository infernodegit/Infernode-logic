# InferNode

**A Solana-native marketplace for AI compute.** Buyers submit inference jobs and
pay in real SOL; independent providers run the jobs on their own hardware (Ollama
or any OpenAI-compatible endpoint) and get paid. Every payment is verified
on-chain — there is no mock data and no off-chain trust in the payment path.

> ⚠️ **Mainnet, real money.** By default this app runs on Solana **mainnet-beta**
> and moves real SOL. The custom on-chain escrow program is **unaudited** and is
> not used by default — see [Escrow](#on-chain-escrow-optional-unaudited). Do not
> route real funds through unaudited code.

---

## Table of contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Database](#database)
- [How it works](#how-it-works)
- [Pricing model](#pricing-model)
- [Job lifecycle](#job-lifecycle)
- [Worker CLI](#worker-cli)
- [Worker HTTP API](#worker-http-api)
- [On-chain escrow (optional, unaudited)](#on-chain-escrow-optional-unaudited)
- [Security model](#security-model)
- [Deployment](#deployment)
- [Roadmap](#roadmap)
- [License](#license)

---

## Features

- 🔌 **Real Solana wallet connect** — Phantom / Solflare via the official wallet
  adapter, SSR-safe, mainnet by default.
- 💸 **Real on-chain payments** — buyers sign an actual SOL transfer to the
  protocol treasury. The server independently verifies the transaction against an
  RPC before a job is queued (signer, destination, and amount are all checked).
- 🗄️ **Real persistence** — Postgres via Drizzle ORM. No hardcoded/mock data on
  any page.
- 🖥️ **Provider registry** — register as a provider, declare the task types and
  models you support, and receive a one-time API key.
- 🤖 **Worker CLI** — a zero-dependency Node/Bun CLI that polls for jobs, runs
  them against Ollama or an OpenAI-compatible endpoint, and submits results.
- ⛓️ **Anchor escrow program** — a Rust/Anchor escrow program is included as the
  audited-upgrade path (code only; not deployed).

---

## Architecture

```
┌─────────────┐     server fns (RPC)      ┌──────────────────┐
│  Web app    │ ────────────────────────► │  TanStack Start  │
│ (React 19)  │ ◄──────────────────────── │  server runtime  │
│  + wallet   │                           │  (src/server)    │
└──────┬──────┘                           └────────┬─────────┘
       │ signs SOL transfer                        │ Drizzle
       ▼                                           ▼
┌─────────────┐    verify tx (RPC)         ┌──────────────────┐
│   Solana    │ ◄───────────────────────── │   PostgreSQL     │
│   mainnet   │                            └──────────────────┘
└─────▲───────┘                                    ▲
      │ submit result                              │ /api/worker/*  (x-provider-key)
      │                                   ┌─────────┴─────────┐
      └────────── runs inference ──────── │  Worker CLI       │
                                          │  (Ollama/OpenAI)  │
                                          └───────────────────┘
```

- **Buyers** use the web UI (server functions / RPC) to create jobs and pay.
- **Providers** run the **Worker CLI**, which talks to the **Worker HTTP API**
  using an API key.
- **The server** is the only component trusted to confirm payments, and it does
  so by reading the transaction back from a Solana RPC.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | [TanStack Start](https://tanstack.com/start) (file-based routing + server functions) |
| UI | React 19, Tailwind CSS 4, Radix UI, lucide-react |
| Build | Vite 8 (rolldown), Bun |
| Database | PostgreSQL + [Drizzle ORM](https://orm.drizzle.team/) |
| Chain | Solana (`@solana/web3.js`, `@solana/wallet-adapter-*`) |
| Escrow | Rust + [Anchor](https://www.anchor-lang.com/) 0.30 |
| Validation | Zod |

---

## Project structure

```
.
├── anchor/                         # On-chain escrow program (Rust/Anchor) — code only
│   ├── Anchor.toml
│   ├── Cargo.toml
│   ├── README.md                   # Build & deploy instructions
│   └── programs/infernode_escrow/
│       ├── Cargo.toml
│       └── src/lib.rs              # initialize_escrow / assign_provider / release / refund
│
├── cli/
│   ├── infernode.mjs               # Worker CLI (zero-dependency)
│   └── README.md                   # CLI usage
│
├── src/
│   ├── db/
│   │   ├── index.ts                # Drizzle client (pg)
│   │   └── schema.ts               # users, providers, provider_capabilities, jobs
│   ├── lib/
│   │   ├── server-fns.ts           # createServerFn RPC entrypoints (UI ↔ backend)
│   │   ├── solana-config.ts        # cluster / RPC (client + server) / treasury
│   │   ├── solana-pay.ts           # client-side SOL transfer to treasury
│   │   ├── pricing.ts              # token estimation + price breakdown
│   │   ├── tasks.ts                # task types + model list
│   │   ├── format.ts               # timeAgo / shortId helpers
│   │   └── buffer-polyfill.ts      # browser Buffer for web3.js
│   ├── components/solana/          # wallet provider, connect button, network status
│   ├── server/
│   │   └── core.ts                 # server-only DB logic + on-chain payment verification
│   └── routes/
│       ├── app.new.tsx             # create + pay for a job
│       ├── app.index.tsx           # buyer dashboard (real jobs)
│       ├── app.jobs.tsx            # job list
│       ├── providers.tsx           # provider registry + register form
│       └── api/worker/             # worker-facing HTTP API (api-key auth)
│           ├── jobs.next.ts        # claim next job
│           ├── jobs.$id.result.ts  # submit result
│           └── me.ts               # provider status
│
├── drizzle.config.ts
└── vite.config.ts                  # client-scoped buffer alias (SSR-safe)
```

---

## Getting started

### Prerequisites

- [Bun](https://bun.sh/) (or Node 18+)
- A PostgreSQL database (a `DATABASE_URL` connection string)
- A Solana mainnet wallet to receive payments (the **treasury**)
- A mainnet RPC URL (Helius / QuickNode recommended; the public RPC is heavily
  rate-limited)

### Install & run

```bash
bun install

# configure env (see the next section), then push the schema:
bunx drizzle-kit push

# start the dev server (http://localhost:5000)
bun run dev
```

### Scripts

| Command | Description |
|---|---|
| `bun run dev` | Start the dev server |
| `bun run build` | Production build |
| `bun run preview` | Preview the production build |
| `bun run lint` | ESLint |
| `bun run format` | Prettier |
| `bunx tsc --noEmit` | Type-check (run before deploying) |
| `bunx drizzle-kit push` | Apply the schema to the database |

---

## Environment variables

| Variable | Where | Required | Description |
|---|---|---|---|
| `DATABASE_URL` | server | ✅ | PostgreSQL connection string. |
| `VITE_TREASURY_WALLET` | client + server | ✅ | Public Solana address that receives job payments. Payment is blocked until this is set. |
| `SOLANA_RPC_URL` | **server only** | ✅ (recommended) | Private mainnet RPC (e.g. Helius/QuickNode, may contain an API key). Used for on-chain payment verification. **Never bundled into the browser** because it has no `VITE_` prefix. |
| `VITE_SOLANA_RPC_URL` | client | optional | RPC the browser uses to send the buyer's transaction. Defaults to the public RPC. Anything here **is exposed in the client bundle** — use a domain-restricted key only. |
| `VITE_SOLANA_CLUSTER` | client + server | optional | `mainnet-beta` (default), `devnet`, or `testnet`. |

> **Why two RPC variables?** The browser must talk to an RPC to send the user's
> transaction, and any `VITE_`-prefixed value is embedded in the client bundle.
> Keeping your paid RPC key in the non-`VITE_` `SOLANA_RPC_URL` ensures it stays
> server-side and is used for the reliability-critical verification step.

---

## Database

Four tables, defined in `src/db/schema.ts`:

- **`users`** — one row per wallet address (`role`: BUYER / PROVIDER).
- **`providers`** — provider profile, hashed API key, endpoint, stake, success /
  failure counters.
- **`provider_capabilities`** — the `(task_type, model_name)` pairs a provider
  supports.
- **`jobs`** — the full job record: task, model, input/output JSON, price &
  protocol fee (lamports), status, tx signature, timestamps.

Apply the schema with:

```bash
bunx drizzle-kit push
```

---

## How it works

1. A buyer connects their wallet and submits a job (task type, model, prompt).
2. The server estimates tokens, computes a price, and creates the job in
   `PENDING_PAYMENT`.
3. The buyer signs a **real SOL transfer** to `VITE_TREASURY_WALLET`.
4. The client sends the signature to the server, which **verifies the transaction
   on-chain** (it exists, succeeded, was signed by the buyer, paid the treasury,
   and the amount ≥ the price) before moving the job to `QUEUED`.
5. A provider's worker claims a `QUEUED` job whose `(task_type, model_name)` it
   supports, runs inference, and submits the result.
6. The job moves to `COMPLETED` (or `FAILED`), and the provider's stats update.

---

## Pricing model

Defined in `src/lib/pricing.ts` (all amounts in lamports; `1 SOL = 1e9 lamports`):

- **Base fee:** `100,000` lamports per job
- **Token cost:** `500,000` lamports per 1K estimated tokens
- **Protocol fee:** `5%` (500 bps) of the subtotal
- **Provider payout:** the subtotal (base fee + token cost)
- **Total charged to buyer:** subtotal + protocol fee

Tokens are estimated from input length (`~4 chars/token`) plus a projected
output. Adjust the constants in `pricing.ts` to retune.

---

## Job lifecycle

```
PENDING_PAYMENT ──(verified payment)──► QUEUED ──(provider claims)──► ASSIGNED
      │                                                                   │
      │                                                              (worker runs)
      │                                                                   ▼
      │                                                                RUNNING
      │                                                                   │
      │                                              ┌────────────────────┴───────────────┐
      │                                              ▼                                     ▼
      │                                          COMPLETED                               FAILED
      └─(expires after 30 min, unpaid → effectively abandoned)
```

`PAID_OUT` is reserved for the escrow settlement path.

---

## Worker CLI

A single-file, zero-dependency CLI (`cli/infernode.mjs`). Full docs in
[`cli/README.md`](cli/README.md).

```bash
# 1. Register on the Providers page in the web app, copy the API key shown.
node cli/infernode.mjs provider login --key infq_xxxx --server https://your-app-url

# 2. Point it at your inference backend
#    Ollama (local):
node cli/infernode.mjs provider set-endpoint --url http://localhost:11434 --mode ollama --model llama3.1:8b
#    OpenAI-compatible:
node cli/infernode.mjs provider set-endpoint --url https://api.openai.com --mode openai \
  --inference-key sk-xxxx --model gpt-4o-mini

# 3. Verify and run
node cli/infernode.mjs worker test
node cli/infernode.mjs worker start --interval 3
```

Config is stored at `~/.infernode/config.json` (chmod 600). Works with `node` or
`bun`.

---

## Worker HTTP API

All routes require the `x-provider-key` header (the API key from registration).

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/worker/jobs/next` | Atomically claim the next compatible `QUEUED` job. |
| `POST` | `/api/worker/jobs/:id/result` | Submit a result (`{ output }` or `{ failed: true, output }`). |
| `GET` | `/api/worker/me` | Return the authenticated provider's status. |

---

## On-chain escrow (optional, unaudited)

The repo includes a Rust/Anchor escrow program in `anchor/` as the path to
trust-minimized settlement. It is **code only — not deployed and not audited.**

| Instruction | Caller | Effect |
|---|---|---|
| `initialize_escrow` | Buyer | Locks `amount + fee` into a per-job PDA. |
| `assign_provider` | Authority | Records the provider that claimed the job. |
| `release` | Authority | Pays the provider, sends the fee to treasury, closes the escrow. |
| `refund` | Anyone, after expiry | Returns all lamports to the buyer. |

Build & deploy instructions are in [`anchor/README.md`](anchor/README.md). The
default payment path (direct-to-treasury, on-chain verified) works **without**
deploying this program.

---

## Security model

- **Payments are never trusted from the client.** The server re-reads the
  transaction from an RPC and checks the signer, destination, and amount before
  queuing a job. A signature already used by another job is rejected (no replay).
- **Job state transitions are guarded.** Results can only be submitted for jobs
  in `ASSIGNED` / `RUNNING`, preventing double-counting and resubmission.
- **Provider API keys are hashed** (SHA-256) at rest; the plaintext key is shown
  only once at registration.
- **Paid RPC keys stay server-side** via the non-`VITE_` `SOLANA_RPC_URL`.

### Known limitations / not yet implemented

- There is **no wallet-signature session auth** yet — server functions are scoped
  by wallet address. Reads of another wallet's job list are possible if the
  address is known (addresses are public; job inputs are the buyer's own data).
  Adding signed-message sessions is the recommended next step before scaling.
- The escrow program is **unaudited**; do not hold real funds with it.

---

## Deployment

This project targets a Node/Bun server runtime.

1. Set `DATABASE_URL`, `VITE_TREASURY_WALLET`, and `SOLANA_RPC_URL` in your host's
   environment/secrets.
2. Run the type-check and build: `bunx tsc --noEmit && bun run build`.
3. Apply the schema to the production database: `bunx drizzle-kit push`.
4. Start the server with `bun run preview` (or your platform's start command).

---

## Roadmap

- [ ] Wallet-signature session authentication
- [ ] Deploy + integrate the Anchor escrow program (after audit)
- [ ] Provider staking & slashing
- [ ] Result verification / dispute resolution
- [ ] Streaming / long-running job support

---

## License

No license file is included yet. Add one (e.g. MIT) before publishing if you want
others to reuse the code.
