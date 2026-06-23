import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "InferNode — Solana AI Compute Marketplace" },
      {
        name: "description",
        content:
          "Pay for AI inference jobs in SOL. Independent providers earn by running models on idle GPUs and OpenAI-compatible endpoints.",
      },
      { property: "og:title", content: "InferNode — Solana AI Compute Marketplace" },
      {
        property: "og:description",
        content:
          "Pay for AI inference jobs in SOL. Independent providers earn by running models on idle GPUs and OpenAI-compatible endpoints.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <Hero />
      <Marquee />
      <HowItWorks />
      <Sides />
      <Models />
      <PricingPreview />
      <Architecture />
      <CTA />
      <SiteFooter />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="absolute inset-0 grid-bg opacity-40" />
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, var(--color-primary), transparent)" }}
      />

      <div className="relative mx-auto max-w-7xl px-6 pt-24 pb-28">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-3 py-1 backdrop-blur">
            <span className="status-dot" />
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Live on Solana devnet
            </span>
          </div>

          <h1 className="mt-6 text-balance text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl">
            AI inference,
            <br />
            <span className="text-muted-foreground">priced per token,</span>
            <br />
            paid in <span className="font-mono text-primary">SOL</span>.
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-balance text-base text-muted-foreground md:text-lg">
            InferNode is a Solana-native marketplace where buyers submit AI jobs and
            independent providers earn by running models on idle GPUs and
            OpenAI-compatible endpoints.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/app/new"
              className="rounded-md bg-foreground px-5 py-2.5 font-mono text-sm text-background transition-opacity hover:opacity-90"
            >
              Submit a job →
            </Link>
            <Link
              to="/providers"
              className="rounded-md border border-border bg-surface px-5 py-2.5 font-mono text-sm text-foreground transition-colors hover:bg-surface-elevated"
            >
              Become a provider
            </Link>
          </div>

          <div className="mt-6 font-mono text-[11px] text-muted-foreground">
            $ npm i -g infernode-worker
          </div>
        </div>

        <TerminalPreview />
      </div>
    </section>
  );
}

function TerminalPreview() {
  return (
    <div className="mx-auto mt-16 max-w-4xl">
      <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-2xl shadow-black/40">
        <div className="flex items-center justify-between border-b border-border bg-surface-elevated px-4 py-2">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />
            <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />
            <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />
          </div>
          <div className="font-mono text-[11px] text-muted-foreground">
            infernode worker start — devnet
          </div>
          <div className="font-mono text-[11px] text-success">● ONLINE</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2">
          <pre className="border-b border-border p-5 font-mono text-xs leading-relaxed text-muted-foreground md:border-b-0 md:border-r">
{`$ infernode worker start
[14:02:11] auth ........ ok (provider_8x4f)
[14:02:11] endpoint .... http://localhost:11434
[14:02:11] models ...... llama3.1, mistral
[14:02:12] polling jobs every 2s ...

`}<span className="text-foreground">{`[14:02:14] job_a91b accepted
           task: text-generation
           model: llama3.1
           input: 312 tok
[14:02:18] inference complete  ✓
           output: 248 tok | 4.1s
[14:02:18] submitting result hash ...
[14:02:19] payout queued       0.00284 SOL`}</span>
          </pre>
          <div className="flex flex-col p-5">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Active job
            </div>
            <div className="mt-3 font-mono text-xs text-foreground">job_a91b · text-generation</div>
            <div className="mt-1 font-mono text-[11px] text-muted-foreground">llama3.1 · 312→248 tok</div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              <Stat k="Price" v="0.0030 SOL" />
              <Stat k="Fee" v="5%" />
              <Stat k="You earn" v="0.0028 SOL" />
            </div>

            <div className="mt-5 flex-1 rounded-md border border-border bg-background p-3">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Escrow PDA
              </div>
              <div className="mt-1 truncate font-mono text-[11px] text-foreground">
                7Hk2…fQp9
              </div>
              <div className="mt-3 flex items-center justify-between font-mono text-[11px]">
                <span className="text-muted-foreground">status</span>
                <span className="text-success">● RESULT_SUBMITTED</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-md border border-border bg-background p-2">
      <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{k}</div>
      <div className="mt-1 font-mono text-[11px] text-foreground">{v}</div>
    </div>
  );
}

function Marquee() {
  const items = [
    "OLLAMA", "vLLM", "OPENAI-COMPATIBLE", "ANCHOR ESCROW", "SOL · USDC", "LLAMA 3.1",
    "MISTRAL", "EMBEDDINGS", "DEEPSEEK", "QWEN 2.5", "STAKED PROVIDERS",
  ];
  return (
    <div className="border-b border-border bg-surface/40">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-6 py-5">
        {items.map((i) => (
          <span key={i} className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {i}
          </span>
        ))}
      </div>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "01",
      t: "Submit",
      d: "Connect wallet. Choose a task — text generation, summarization, embeddings, classification. Pay into a Solana escrow.",
      code: "POST /jobs\n{ task: 'text-generation',\n  model: 'llama3.1',\n  input: '...' }",
    },
    {
      n: "02",
      t: "Dispatch",
      d: "The job lands in a queue. Capable, staked providers running infernode-worker poll for matching tasks.",
      code: "worker.poll()\n→ job_a91b\n  llama3.1 · 312 tok",
    },
    {
      n: "03",
      t: "Execute",
      d: "Provider runs inference locally via Ollama / vLLM or an OpenAI-compatible API. Result + hash submitted back.",
      code: "POST /jobs/a91b/result\n{ output: '...',\n  hash: '0x7Hk2…fQp9' }",
    },
    {
      n: "04",
      t: "Settle",
      d: "Anchor program releases payment to the provider, minus protocol fee. Refunds on timeout. Disputable window for failures.",
      code: "release_payment(job_a91b)\n→ provider: 0.00284 SOL\n→ treasury: 0.00015 SOL",
    },
  ];

  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <SectionHead label="01 / Protocol" title="From prompt to payout in four steps." />

        <div className="mt-12 grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div key={s.n} className="flex flex-col bg-background p-6">
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                  Step {s.n}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">→</span>
              </div>
              <h3 className="mt-4 text-xl font-semibold tracking-tight">{s.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
              <pre className="mt-5 whitespace-pre-wrap rounded border border-border bg-surface p-3 font-mono text-[10.5px] leading-relaxed text-foreground/80">
{s.code}
              </pre>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Sides() {
  return (
    <section className="border-b border-border bg-surface/30">
      <div className="mx-auto grid max-w-7xl gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-2 mx-6 my-20" style={{ marginInline: "auto" }}>
        <SideCard
          tag="For buyers"
          title="Cheap inference, on demand."
          desc="Submit jobs without API keys or vendor lock-in. Pay only for the tokens you use. Choose the model and price point that fits."
          bullets={[
            "Wallet-native: no signup",
            "Per-token pricing, transparent fees",
            "Multiple supported task types",
            "Job history + result hashes on-chain",
          ]}
          cta={{ to: "/app/new", label: "Submit a job →" }}
        />
        <SideCard
          tag="For providers"
          title="Monetize idle compute."
          desc="Run infernode-worker on your GPU box, VPS, or wire up a hosted OpenAI-compatible endpoint. Stake to join, earn per job."
          bullets={[
            "Ollama, vLLM & OpenAI-compatible",
            "Set your own prices per model",
            "Provider stake + reputation",
            "Automatic payouts via Anchor escrow",
          ]}
          cta={{ to: "/providers", label: "Become a provider →" }}
        />
      </div>
    </section>
  );
}

function SideCard({
  tag, title, desc, bullets, cta,
}: {
  tag: string;
  title: string;
  desc: string;
  bullets: string[];
  cta: { to: string; label: string };
}) {
  return (
    <div className="bg-background p-8 md:p-12">
      <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{tag}</div>
      <h3 className="mt-3 text-balance text-3xl font-semibold tracking-tight md:text-4xl">{title}</h3>
      <p className="mt-3 max-w-md text-sm text-muted-foreground">{desc}</p>
      <ul className="mt-6 space-y-2">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-3 font-mono text-xs text-foreground/90">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 bg-primary" />
            {b}
          </li>
        ))}
      </ul>
      <Link
        to={cta.to}
        className="mt-8 inline-flex rounded-md border border-border bg-surface px-4 py-2 font-mono text-xs text-foreground hover:bg-surface-elevated"
      >
        {cta.label}
      </Link>
    </div>
  );
}

function Models() {
  const rows = [
    { model: "llama3.1:8b", task: "text-generation", providers: 14, price: "0.00048" },
    { model: "llama3.1:70b", task: "text-generation", providers: 4, price: "0.00310" },
    { model: "mistral:7b", task: "text-generation", providers: 11, price: "0.00041" },
    { model: "qwen2.5:14b", task: "summarization", providers: 6, price: "0.00072" },
    { model: "nomic-embed-text", task: "embedding", providers: 9, price: "0.00009" },
    { model: "deepseek-coder:6.7b", task: "code-review", providers: 5, price: "0.00065" },
  ];

  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <SectionHead label="02 / Catalog" title="Models available across the network." />

        <div className="mt-10 overflow-hidden rounded-lg border border-border">
          <div className="grid grid-cols-12 border-b border-border bg-surface px-5 py-3 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
            <div className="col-span-5">Model</div>
            <div className="col-span-3">Task</div>
            <div className="col-span-2">Providers</div>
            <div className="col-span-2 text-right">SOL / 1K tok</div>
          </div>
          {rows.map((r) => (
            <div
              key={r.model}
              className="grid grid-cols-12 items-center border-b border-border px-5 py-3 last:border-b-0 hover:bg-surface/60"
            >
              <div className="col-span-5 font-mono text-sm text-foreground">{r.model}</div>
              <div className="col-span-3 font-mono text-xs text-muted-foreground">{r.task}</div>
              <div className="col-span-2 flex items-center gap-2 font-mono text-xs text-foreground">
                <span className="status-dot" /> {r.providers}
              </div>
              <div className="col-span-2 text-right font-mono text-sm text-foreground">{r.price}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingPreview() {
  return (
    <section className="border-b border-border bg-surface/30">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <SectionHead label="03 / Pricing" title="Simple, deterministic pricing." />

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          <div className="rounded-lg border border-border bg-background p-6 lg:col-span-2">
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Formula
            </div>
            <pre className="mt-3 overflow-x-auto rounded-md border border-border bg-surface p-4 font-mono text-sm text-foreground">
{`price = baseFee + (estimatedTokens / 1000) * pricePerKTokens
fee   = price * protocolFeePct
payout = price - fee`}
            </pre>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <KV k="Base fee" v="0.0001 SOL" />
              <KV k="Per 1K tokens" v="0.0005 SOL" />
              <KV k="Protocol fee" v="5%" />
            </div>
          </div>

          <div className="rounded-lg border border-border bg-background p-6">
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Example
            </div>
            <div className="mt-3 font-mono text-sm">2,500 token job</div>
            <ul className="mt-5 space-y-2 font-mono text-xs">
              <Row k="base" v="0.00010" />
              <Row k="tokens (2.5 × 0.0005)" v="0.00125" />
              <Row k="subtotal" v="0.00135" />
              <Row k="protocol fee (5%)" v="-0.00007" />
              <li className="mt-3 flex items-center justify-between border-t border-border pt-3 text-sm">
                <span className="text-muted-foreground">Provider receives</span>
                <span className="text-foreground">0.00128 SOL</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <li className="flex items-center justify-between">
      <span className="text-muted-foreground">{k}</span>
      <span className="text-foreground">{v}</span>
    </li>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-md border border-border bg-surface p-3">
      <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{k}</div>
      <div className="mt-1 font-mono text-sm text-foreground">{v}</div>
    </div>
  );
}

function Architecture() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <SectionHead label="04 / System" title="Hybrid by design. Trustless where it matters." />

        <div className="mt-12 overflow-x-auto rounded-lg border border-border bg-surface p-6">
          <pre className="min-w-fit font-mono text-[12px] leading-relaxed text-foreground/85">
{`┌──────────────────┐    submit job + pay     ┌──────────────────────┐
│   Buyer (web)    │ ─────────────────────▶  │  Anchor Escrow PDA   │
│ wallet · prompt  │                         │  amount · expires_at │
└────────┬─────────┘                         └──────────┬───────────┘
         │                                              │
         │ job metadata                                 │ assign · release
         ▼                                              ▼
┌──────────────────┐    dispatch via queue   ┌──────────────────────┐
│  Backend (API)   │ ───────────────────────▶│  Worker CLI (provider)│
│  postgres·redis  │ ◀───────────────────────│  ollama / vllm / api │
└────────┬─────────┘   result + hash          └──────────────────────┘
         │
         ▼
   buyer sees result, provider receives payout`}
          </pre>
        </div>

        <div className="mt-8 grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-3">
          {[
            ["On-chain", "Provider registry, escrow PDAs, payment release, refund + slash paths."],
            ["Off-chain", "Job queue, dispatcher, result storage, reputation scoring."],
            ["Edge", "Worker CLI on provider hardware. Polls jobs, runs inference, submits result + hash."],
          ].map(([t, d]) => (
            <div key={t} className="bg-background p-6">
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{t}</div>
              <p className="mt-2 text-sm text-foreground/90">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="border-b border-border">
      <div className="relative mx-auto max-w-7xl px-6 py-24">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="relative text-center">
          <h2 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl">
            Compute should be a commodity.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Help us build it. Submit your first inference job in under a minute, or spin up a worker tonight.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/app/new"
              className="rounded-md bg-foreground px-5 py-2.5 font-mono text-sm text-background hover:opacity-90"
            >
              Submit a job →
            </Link>
            <Link
              to="/providers"
              className="rounded-md border border-border bg-surface px-5 py-2.5 font-mono text-sm text-foreground hover:bg-surface-elevated"
            >
              Run a worker
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionHead({ label, title }: { label: string; title: string }) {
  return (
    <div className="flex flex-col items-start gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
        <h2 className="mt-2 max-w-2xl text-balance text-3xl font-semibold tracking-tight md:text-4xl">
          {title}
        </h2>
      </div>
    </div>
  );
}
