# InferNode Escrow (Anchor program)

On-chain SOL escrow for InferNode jobs. This is **code only** — it is not
deployed. The live marketplace currently uses a direct treasury transfer
(`src/lib/solana-pay.ts`); this program is the audited-escrow upgrade path.

## What it does

| Instruction | Caller | Effect |
|---|---|---|
| `initialize_escrow(job_id, amount, protocol_fee, expires_at)` | Buyer | Locks `amount + fee` lamports into a per-job PDA. |
| `assign_provider(provider)` | Marketplace authority | Records the provider that claimed the job. |
| `release()` | Marketplace authority | Pays `amount` to the provider, `fee` to treasury, refunds rent to buyer, closes escrow. |
| `refund()` | Anyone, after `expires_at` | Returns all lamports to the buyer, closes escrow. |

The escrow PDA is derived from `["escrow", buyer, job_id]`.

## Security review (internal)

> This is an **internal** review by the build agent, **not** an independent
> third-party audit. A real audit by a Solana security firm (e.g. OtterSec,
> Neodyme, Halborn) is still required before this program custodies real user
> funds on mainnet.

### Findings & fixes applied

| # | Severity | Finding | Status |
|---|---|---|---|
| 1 | **Critical** | `initialize_escrow` accepted an arbitrary `expires_at`. A buyer could set a past / near-instant expiry, then call permissionless `refund` immediately after a provider was assigned — reclaiming funds out from under a provider who had already started the job (theft of provider labor). | **Fixed**: `initialize_escrow` now reads the on-chain clock and requires `expires_at >= now + MIN_ESCROW_SECONDS` (15 min). |
| 2 | **High** | `assign_provider` had no time check. The authority could assign an already-expired (or about-to-expire) escrow, after which `refund` fires immediately and strands the assigned provider with no payout. | **Fixed**: `assign_provider` requires `expires_at >= now + MIN_ASSIGN_REMAINING_SECONDS` (5 min). |
| 3 | **High** | Buyer chose the `authority` and `treasury` at funding time; correctness relied entirely on off-chain backend validation (one bug → stuck/misdirected funds). | **Fixed**: `initialize_escrow` now enforces `authority == MARKETPLACE_AUTHORITY` and `treasury == PROTOCOL_TREASURY` on-chain (compile-time constants you set before deploy). |
| 4 | Medium | `release` / `refund` used unchecked `+=` / `-=` on raw lamports. | **Fixed**: checked add/sub with an explicit `InsufficientEscrowBalance` guard. |
| 5 | Low | `assign_provider` accepted `Pubkey::default()` as the provider, which would then never be able to claim a `release`. | **Fixed**: rejects the default pubkey (`InvalidProvider`). |

### Open items that MUST still be handled at integration / deploy time

- **Set the canonical constants before build.** `MARKETPLACE_AUTHORITY` and
  `PROTOCOL_TREASURY` ship as placeholders. They are now enforced on-chain, so
  they MUST be replaced with your real authority/treasury pubkeys before
  `anchor build` (see the runbook below), or every `initialize_escrow` will fail.
- **Set `expires_at` generously.** It must exceed the longest realistic job
  duration (queue wait + inference + result submission), comfortably above the
  15-minute on-chain floor, so a slow-but-honest provider is never refunded out.
- **Protect the authority key.** The server-side authority keypair that signs
  `assign_provider` / `release` is a hot key controlling payouts. Store it as a
  secret, never in the client bundle, and scope its funding to fees only.
- **Independent audit before mainnet funds.** See the warning above.

## Build & deploy (requires your own keypair + SOL + audit)

> ⚠️ This program is **unaudited**. Do not hold real user funds on mainnet
> until it has been independently audited. Deploying costs real SOL.

```bash
# 1. Install toolchain
#    https://www.anchor-lang.com/docs/installation
solana --version && anchor --version

cd anchor

# 2. Generate the program keypair and sync the declared id
anchor keys list                 # prints the program pubkey
# Paste that pubkey into:
#   - declare_id!(...) in programs/infernode_escrow/src/lib.rs
#   - [programs.mainnet]/[programs.devnet] in Anchor.toml

# 2b. Set the canonical authority + treasury (ENFORCED ON-CHAIN at funding).
#     Replace these consts in programs/infernode_escrow/src/lib.rs — the program
#     will not build/behave correctly while they hold the placeholder pubkey:
#   - MARKETPLACE_AUTHORITY -> your server-side authority keypair's pubkey
#   - PROTOCOL_TREASURY     -> your treasury wallet (matches VITE_TREASURY_WALLET)

# 3. Build
anchor build

# 4. Deploy to devnet first (free SOL via `solana airdrop 2`)
anchor deploy --provider.cluster devnet

# 5. Mainnet deploy (after audit) — needs ~2-4 SOL for rent + fees
anchor deploy --provider.cluster mainnet
```

## Wiring into the app (after deploy)

1. Add the program id and authority pubkey to env (e.g. `VITE_ESCROW_PROGRAM_ID`).
2. Replace the body of `payForJob` in `src/lib/solana-pay.ts` with an
   `initialize_escrow` instruction (use `@coral-xyz/anchor` + the generated IDL),
   storing the escrow PDA on the job via the existing `escrow_pda` column.
3. Have the marketplace backend (holding the authority key) call
   `assign_provider` when a worker claims a job and `release` when a result is
   verified.
