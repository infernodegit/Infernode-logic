import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";

export const Route = createFileRoute("/whitepaper")({
  head: () => ({
    meta: [
      { title: "Whitepaper · InferNode" },
      { name: "description", content: "InferNode: A Decentralized AI Inference Marketplace on Solana. Full technical whitepaper." },
    ],
  }),
  component: Whitepaper,
});

const SECTIONS = [
  { id: "abstract", label: "Abstract" },
  { id: "introduction", label: "1. Introduction" },
  { id: "problem", label: "2. Problem Statement" },
  { id: "protocol", label: "3. Protocol Design" },
  { id: "payments", label: "4. Payment Model" },
  { id: "providers", label: "5. Provider Network" },
  { id: "security", label: "6. Security & Trust" },
  { id: "roadmap", label: "7. Roadmap" },
  { id: "conclusion", label: "8. Conclusion" },
];

function Whitepaper() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <div className="border-b border-border bg-surface/40 lg:hidden">
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-2">
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="shrink-0 rounded px-3 py-1.5 font-mono text-xs text-muted-foreground hover:bg-surface hover:text-foreground">
              {s.label}
            </a>
          ))}
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <nav className="sticky top-20 space-y-1">
            <div className="px-2 pb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Contents
            </div>
            {SECTIONS.map((s) => (
              <a key={s.id} href={`#${s.id}`} className="block rounded px-2 py-1.5 font-mono text-xs text-muted-foreground hover:bg-surface hover:text-foreground transition-colors">
                {s.label}
              </a>
            ))}
            <div className="mt-6 rounded-md border border-border bg-surface p-3">
              <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Version</div>
              <div className="mt-1 font-mono text-xs text-foreground">v0.1 · Draft</div>
              <div className="mt-1 font-mono text-[10px] text-muted-foreground">June 2025</div>
            </div>
          </nav>
        </aside>

        <article className="max-w-none space-y-16">

          <section id="abstract" className="scroll-mt-20">
            <div className="rounded-lg border border-border bg-surface/60 p-6 sm:p-8">
              <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Abstract</div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                InferNode: A Decentralized AI Inference Marketplace on Solana
              </h1>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
                We present InferNode, a peer-to-peer marketplace for AI inference computation built on the Solana blockchain.
                InferNode enables buyers to submit inference jobs — text generation, summarization, embeddings, and
                classification — and receive results from an open network of GPU providers, with payment settled in
                SOL. Providers advertise model endpoints and earn per completed job without custodial intermediaries.
                In the current release, payments settle by direct, on-chain-verified transfer to the protocol treasury;
                a trust-minimized Anchor escrow with commit-reveal verification and provider slashing is on the roadmap
                (see §7). InferNode runs on Solana mainnet-beta.
              </p>
            </div>
          </section>

          <WPSection id="introduction" number="1" title="Introduction">
            <P>
              Artificial intelligence inference — the act of running a trained model to produce output — has
              become a fundamental compute primitive. Every chatbot response, every document summary, every
              code suggestion is an inference request. Yet the market for inference compute remains highly
              centralized: a handful of API providers control access, set opaque prices, and create single
              points of failure for applications that depend on them.
            </P>
            <P>
              Meanwhile, vast quantities of GPU compute sit idle. Developers with gaming rigs, researchers
              with university allocations, and operators of self-hosted model endpoints have excess capacity
              with no efficient market to sell it into.
            </P>
            <P>
              InferNode addresses both sides of this imbalance. Buyers get transparent, competitive pricing
              for AI inference without API keys, monthly seats, or vendor lock-in. Providers get a
              permissionless market to monetize idle compute, with earnings settled in SOL — trustless,
              fully automated payouts arrive with the planned escrow upgrade (see §7).
            </P>
            <P>
              Solana is uniquely suited as the settlement layer: sub-second finality, transaction costs of
              fractions of a cent, and a mature smart-contract ecosystem via the Anchor framework make it
              practical to settle per-job payments that would be economically irrational on slower or more
              expensive chains.
            </P>
          </WPSection>

          <WPSection id="problem" number="2" title="Problem Statement">
            <H3>2.1 Centralization of Inference APIs</H3>
            <P>
              The dominant model for AI inference is the hosted API: a single company runs the model,
              sets the price, and controls access. This creates several failure modes:
            </P>
            <ul className="mt-4 space-y-2 pl-4">
              {[
                "Opaque and volatile pricing with no market mechanism to drive costs down",
                "Vendor lock-in through proprietary request formats and authentication schemes",
                "Single-provider outages propagate to all dependent applications",
                "Geographic restrictions limit access in regulated or underserved markets",
                "Closed models preclude auditability of outputs",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <span className="mt-1.5 h-1 w-1 shrink-0 bg-primary" />
                  {item}
                </li>
              ))}
            </ul>

            <H3>2.2 Idle GPU Capacity</H3>
            <P>
              Estimates suggest that consumer and prosumer GPU hardware runs at less than 20% average
              utilization globally. Research institutions, development teams, and enthusiasts collectively
              hold substantial inference capacity — Llama 3.1 8B requires only 6 GB VRAM and runs
              comfortably on a gaming-class GPU — but there is no standardized, low-friction way to sell
              excess capacity.
            </P>

            <H3>2.3 Payment Friction</H3>
            <P>
              Existing peer-to-peer GPU rental markets rely on fiat payment processors, requiring KYC,
              minimum balance thresholds, and settlement periods measured in days. These frictions are
              acceptable for renting a GPU for a week, but make per-inference micropayments economically
              impractical. A Solana transaction costs ~$0.00025, making per-job settlement of even
              sub-cent jobs viable.
            </P>
          </WPSection>

          <WPSection id="protocol" number="3" title="Protocol Design">
            <H3>3.1 Architecture Overview</H3>
            <P>
              InferNode is a hybrid system: payment is verified on-chain on Solana, while the provider
              registry, job dispatch, inference execution, and result delivery run off-chain (Postgres-backed).
              Providers submit a result hash that is stored alongside the job for integrity. The planned
              escrow upgrade moves registration, slashing, and the result hash on-chain (see §3.2, §7).
            </P>
            <CodeBlock language="ASCII">{`┌──────────────────┐    submit job + pay     ┌──────────────────────┐
│   Buyer (web)    │ ─────────────────────▶  │  Protocol Treasury   │
│ wallet · prompt  │      SOL transfer       │  on-chain · verified │
└────────┬─────────┘                         └──────────┬───────────┘
         │                                              │
         │ job metadata                                 │ verify · queue
         ▼                                              ▼
┌──────────────────┐    dispatch via queue   ┌──────────────────────┐
│  Backend (API)   │ ───────────────────────▶│ Worker CLI (provider)│
│  postgres queue  │ ◀───────────────────────│  ollama / vllm / api │
└────────┬─────────┘   result + hash          └──────────────────────┘
         │
         ▼
   buyer sees result · provider earnings recorded`}</CodeBlock>

            <H3>3.2 On-Chain Program (Anchor) — planned</H3>
            <P>
              The escrow program described here is written but not yet deployed; it is the planned
              trust-minimized upgrade to today's treasury-verified payments. It is designed to expose
              the following instructions:
            </P>
            <CodeBlock language="Rust">{`// Registry
initialize_registry(treasury: Pubkey)
register_provider(stake_amount: u64)
deactivate_provider()

// Jobs
create_job(job_id_hash: [u8; 32], amount: u64, protocol_fee_bps: u16, expires_at: i64)
assign_provider(job_id_hash: [u8; 32], provider: Pubkey)
submit_result_hash(job_id_hash: [u8; 32], result_hash: [u8; 32])
release_payment(job_id_hash: [u8; 32])

// Dispute resolution
refund_job(job_id_hash: [u8; 32])      // on timeout
slash_provider(provider: Pubkey, amount: u64)  // on proven fault`}</CodeBlock>

            <H3>3.3 Job Lifecycle</H3>
            <P>
              A job passes through these states, tracked by the backend with payment verified on-chain:
            </P>
            <div className="mt-4 overflow-hidden rounded-lg border border-border">
              {[
                ["PENDING_PAYMENT", "Job created; buyer must send SOL to the protocol treasury"],
                ["QUEUED", "Payment verified on-chain; dispatcher searching for a provider"],
                ["ASSIGNED", "Provider claimed the job; worker has started running it"],
                ["RUNNING", "Inference in progress against the provider endpoint"],
                ["COMPLETED", "Result delivered; provider earnings recorded; protocol fee retained by treasury"],
                ["FAILED", "Job could not be completed (refunds via escrow coming soon)"],
              ].map(([state, desc], i) => (
                <div key={state} className={"flex flex-col gap-1 border-b border-border p-4 last:border-b-0 sm:flex-row sm:gap-4 " + (i % 2 === 0 ? "bg-surface/30" : "bg-background")}>
                  <div className="shrink-0 font-mono text-xs text-primary sm:w-44">{state}</div>
                  <div className="font-mono text-xs text-muted-foreground">{desc}</div>
                </div>
              ))}
            </div>

            <H3>3.4 Result Verification</H3>
            <P>
              Full on-chain storage of model outputs is not feasible given output sizes and cost.
              Instead, providers submit a SHA-256 hash of the raw output for integrity. A dispute
              window with on-chain slashing — where any party may challenge a result by submitting
              a pre-image that produces a different hash, causing the dishonest party's stake to be
              slashed — is part of the planned escrow upgrade (see §7). Once live, it gives
              pseudonymous providers a strong economic incentive for honest behavior.
            </P>
          </WPSection>

          <WPSection id="payments" number="4" title="Payment Model">
            <H3>4.1 Pricing Formula</H3>
            <P>
              Job cost is computed deterministically before payment, giving buyers a
              guaranteed maximum cost:
            </P>
            <CodeBlock language="formula">{`price      = baseFee + (estimatedTokens / 1000) × pricePerKTokens
protocol_fee = price × protocolFeePct          // default 5%
provider_payout = price − protocol_fee`}</CodeBlock>
            <P>
              Current network rate (fixed protocol-wide today; per-provider pricing is on the roadmap):
            </P>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                ["Base fee", "0.0001 SOL", "Flat per-job overhead"],
                ["Per 1K tokens", "0.0005 SOL", "Network rate; shown at submission"],
                ["Protocol fee", "5%", "Goes to InferNode treasury"],
              ].map(([k, v, sub]) => (
                <div key={k} className="rounded-md border border-border bg-surface p-3">
                  <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{k}</div>
                  <div className="mt-1 font-mono text-sm text-foreground">{v}</div>
                  <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">{sub}</div>
                </div>
              ))}
            </div>

            <H3>4.2 Escrow Design — planned</H3>
            <P>
              Today, payment is a direct SOL transfer to the protocol treasury, verified server-side
              on-chain before a job is queued. The escrow design below describes the planned
              trust-minimized upgrade.
            </P>
            <P>
              Each job creates a unique Program Derived Address (PDA) as its escrow. The PDA is
              seeded by the job ID hash, ensuring no two jobs share an escrow. Funds can only
              leave the PDA via three instructions: <code className="rounded bg-surface px-1 font-mono text-xs">release_payment</code> (success),{" "}
              <code className="rounded bg-surface px-1 font-mono text-xs">refund_job</code> (timeout/dispute), or{" "}
              <code className="rounded bg-surface px-1 font-mono text-xs">slash_provider</code> (proven fault). There is no admin key that can
              drain escrows unilaterally.
            </P>

            <H3>4.3 Micropayment Viability</H3>
            <P>
              A typical 1,000-token job costs ~0.0006 SOL (~$0.08 at $130/SOL). A Solana
              transaction to settle that payment costs ~0.000005 SOL (~$0.00065). The
              settlement overhead is therefore less than 0.1% of job value, making true
              per-inference micropayments economically viable for the first time.
            </P>
          </WPSection>

          <WPSection id="providers" number="5" title="Provider Network">
            <H3>5.1 Registration & Staking</H3>
            <P>
              Any operator with a compatible inference endpoint can register as a provider from the
              web portal — open and permissionless, no stake required today. Reputation is tracked
              from completed and failed jobs. On-chain staking — locking SOL as a slashable security
              deposit that boosts dispatch priority for serious operators — is part of the planned
              escrow upgrade (see §7).
            </P>

            <H3>5.2 Supported Engine Types</H3>
            <div className="mt-4 overflow-hidden rounded-lg border border-border">
              {[
                ["Ollama", "Local model runner. Worker polls `/api/generate`. Supports llama3.1, mistral, qwen, deepseek-coder, nomic-embed-text, and any GGUF-compatible model."],
                ["vLLM", "High-throughput server. OpenAI-compatible `/v1/completions` endpoint. Ideal for datacenter-grade providers running 70B+ parameter models."],
                ["OpenAI-compatible", "Any endpoint implementing the OpenAI Chat Completions or Embeddings API. Covers Together AI, Groq, Fireworks, self-hosted llama.cpp, etc."],
              ].map(([engine, desc]) => (
                <div key={engine} className="flex flex-col gap-1 border-b border-border p-4 last:border-b-0 sm:flex-row sm:gap-4">
                  <div className="shrink-0 font-mono text-xs text-foreground sm:w-36">{engine}</div>
                  <div className="text-sm text-muted-foreground">{desc}</div>
                </div>
              ))}
            </div>

            <H3>5.3 Worker CLI</H3>
            <P>
              Providers interact with the network via the worker CLI (<code className="rounded bg-surface px-1 font-mono text-xs">cli/infernode.mjs</code>),
              a Node.js daemon that handles polling, inference routing, and result submission.
              Register on the Providers page to get an API key, then run a couple of commands:
            </P>
            <CodeBlock language="bash">{`node cli/infernode.mjs provider login --key infq_...
node cli/infernode.mjs provider set-endpoint --url http://localhost:11434 --mode ollama
node cli/infernode.mjs worker start`}</CodeBlock>

            <H3>5.4 Reputation System</H3>
            <P>
              Provider reputation is computed from marketplace data: completed jobs, failed jobs,
              and (once on-chain staking ships) stake level. Reputation scores affect job dispatch
              priority — they are computed off-chain by the dispatcher and used to break ties when
              multiple providers match a job's requirements.
            </P>
          </WPSection>

          <WPSection id="security" number="6" title="Security & Trust">
            <H3>6.1 Threat Model</H3>
            <P>
              InferNode operates in an adversarial environment where providers may attempt to
              submit false results, buyers may attempt to claim refunds on valid jobs, and
              the off-chain dispatcher may be unavailable. The protocol is designed to be
              safe under all three conditions.
            </P>

            <H3>6.2 Provider Dishonesty</H3>
            <P>
              Once escrow and staking are live, a provider that submits a fabricated result hash
              will risk slashing when a dispute is raised and the honest result pre-image is produced.
              The expected value of cheating becomes negative for any provider with significant stake:
              the slashed amount far exceeds the payout from a single fraudulent job. Until then,
              dishonest providers are penalized through failed-job reputation.
            </P>

            <H3>6.3 Dispatcher Failure</H3>
            <P>
              Once the escrow program ships, funded jobs will not be lost if the off-chain dispatcher
              is unavailable: the escrow PDA records an <code className="rounded bg-surface px-1 font-mono text-xs">expires_at</code> timestamp, and after
              expiry the buyer can call <code className="rounded bg-surface px-1 font-mono text-xs">refund_job</code> directly, bypassing the dispatcher
              entirely. This guarantees buyer funds are never permanently locked even if InferNode
              infrastructure is fully offline.
            </P>

            <H3>6.4 Model Output Confidentiality</H3>
            <P>
              Raw model outputs are not stored on-chain. Providers submit only a SHA-256 hash to the
              backend, stored off-chain with the job today; on-chain hash anchoring is planned with the
              escrow upgrade. Buyers receive outputs via HTTPS from the backend API. Confidentiality of input
              prompts from providers is a known limitation of the current design: providers
              necessarily see input text to run inference. A future ZK-inference integration
              could address this at the cost of significantly higher proof generation latency.
            </P>

            <H3>6.5 Sybil Resistance</H3>
            <P>
              Once on-chain staking ships, the stake requirement will create an economic barrier to
              sybil attacks: an attacker who registers many low-stake providers gains low dispatch
              priority and risks losing all stake if any provider misbehaves, so high-priority
              positions require meaningful capital commitment. Until then, dispatch priority is based
              on tracked reputation.
            </P>
          </WPSection>

          <WPSection id="roadmap" number="7" title="Roadmap">
            <div className="mt-6 space-y-0 overflow-hidden rounded-lg border border-border">
              {[
                {
                  phase: "Phase 1",
                  status: "LIVE",
                  tone: "success",
                  title: "Mainnet Beta Launch",
                  items: [
                    "Web app: job submission, buyer dashboard, provider portal",
                    "Direct SOL payment to the protocol treasury, verified on-chain",
                    "Worker CLI: Ollama & OpenAI-compatible endpoints",
                    "text-generation, summarization, embedding, classification tasks",
                  ],
                },
                {
                  phase: "Phase 2",
                  status: "IN PROGRESS",
                  tone: "primary",
                  title: "Trust-Minimized Settlement",
                  items: [
                    "Anchor escrow program: independent audit + mainnet deployment",
                    "Automated provider payouts and timeout refunds",
                    "On-chain staking with stake-weighted dispatch priority",
                    "Result dispute mechanism and slashing",
                  ],
                },
                {
                  phase: "Phase 3",
                  status: "PLANNED",
                  tone: "muted",
                  title: "Scale & Ecosystem",
                  items: [
                    "vLLM engine support for high-throughput providers",
                    "SDK: TypeScript and Python client libraries",
                    "Streaming inference results via WebSocket",
                    "Multi-modal tasks: image generation, speech-to-text",
                  ],
                },
                {
                  phase: "Phase 4",
                  status: "RESEARCH",
                  tone: "muted",
                  title: "Trustless Verification",
                  items: [
                    "Optimistic rollup of result hashes for batch settlement",
                    "ZK-proof of inference for deterministic models",
                    "Input prompt encryption for provider-blind execution",
                    "Decentralized governance of protocol fee parameters",
                  ],
                },
              ].map((p) => (
                <div key={p.phase} className="border-b border-border p-5 last:border-b-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      {p.phase}
                    </span>
                    <span className={
                      "rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider " +
                      (p.tone === "success" ? "border-success/30 bg-success/10 text-success" :
                       p.tone === "primary" ? "border-primary/30 bg-primary/10 text-primary" :
                       "border-border bg-surface text-muted-foreground")
                    }>
                      {p.status}
                    </span>
                  </div>
                  <h3 className="mt-2 font-semibold tracking-tight">{p.title}</h3>
                  <ul className="mt-3 space-y-1.5">
                    {p.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 font-mono text-xs text-muted-foreground">
                        <span className="mt-1 h-1 w-1 shrink-0 bg-muted-foreground/40" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </WPSection>

          <WPSection id="conclusion" number="8" title="Conclusion">
            <P>
              InferNode shows that per-inference micropayments are practical today using Solana as a
              settlement layer: payments settle in SOL and are verified on-chain, with a
              trust-minimized Anchor escrow on the roadmap. The hybrid architecture — on-chain
              payment, off-chain computation — achieves the latency required for real-time AI
              workloads while preserving the trust guarantees that make decentralized markets work.
            </P>
            <P>
              The fundamental thesis is simple: AI compute is a commodity, and commodities work best
              in open, competitive markets. InferNode provides the infrastructure for that market
              to exist on Solana.
            </P>
            <P>
              We invite GPU operators, AI developers, and protocol contributors to join the network,
              run a worker, and help build the open inference layer for the decentralized web.
            </P>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="https://github.com/infernodegit"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex rounded-md border border-border bg-surface px-4 py-2 font-mono text-xs text-foreground hover:bg-surface-elevated"
              >
                GitHub →
              </a>
              <a
                href="/docs"
                className="inline-flex rounded-md bg-foreground px-4 py-2 font-mono text-xs text-background hover:opacity-90"
              >
                Read the Docs →
              </a>
            </div>
          </WPSection>

          <div className="border-t border-border pt-8 font-mono text-[11px] text-muted-foreground">
            InferNode Whitepaper v0.1 — Draft for public review — June 2025<br />
            This document describes a system under active development. All parameters are subject to change.
          </div>

        </article>
      </div>
      <SiteFooter />
    </div>
  );
}

function WPSection({ id, number, title, children }: { id: string; number: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 space-y-4">
      <div>
        <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          {number} /
        </div>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mt-6 text-base font-semibold tracking-tight sm:text-lg">{children}</h3>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">{children}</p>
  );
}

function CodeBlock({ language, children }: { language: string; children: string }) {
  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-4 py-2 font-mono text-[11px] text-muted-foreground">
        <span>{language}</span>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[11.5px] leading-relaxed text-foreground/90 sm:p-5 sm:text-[12.5px]">{children}</pre>
    </div>
  );
}
