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
