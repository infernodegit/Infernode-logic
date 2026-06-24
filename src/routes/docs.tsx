import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [
      { title: "Docs · InferNode" },
      { name: "description", content: "InferNode developer documentation — worker CLI, API, and on-chain payment reference." },
    ],
  }),
  component: Docs,
});

const SECTIONS = [
  { id: "intro", label: "Introduction" },
  { id: "buyer", label: "Buyer API" },
  { id: "worker", label: "Worker CLI" },
  { id: "anchor", label: "On-chain program" },
];

function Docs() {
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

      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[200px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <nav className="sticky top-20 space-y-1">
            <div className="px-2 pb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              On this page
            </div>
            {SECTIONS.map((s) => (
              <a key={s.id} href={`#${s.id}`} className="block rounded px-2 py-1 font-mono text-xs text-muted-foreground hover:bg-surface hover:text-foreground">
                {s.label}
              </a>
            ))}
          </nav>
        </aside>

        <article className="prose prose-invert max-w-none space-y-12">
          <section id="intro">
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Docs</div>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">InferNode developer docs</h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Everything you need to submit inference jobs as a buyer or earn as a provider.
              This is a hybrid marketplace: payments are verified on-chain on Solana; the registry,
              job dispatch, and execution run off-chain.
            </p>
          </section>

          <Block id="buyer" title="Buyer API">
            <p className="text-sm text-muted-foreground">
              Create a job from the web app. Payment is a direct SOL transfer to the
              protocol treasury, verified on-chain before the job is queued.
            </p>
            <CodeBlock language="flow">
{`1. createJob(task, model, input, maxOutputTokens)
   → { id, priceLamports, treasury, status: "PENDING_PAYMENT" }

2. Wallet sends priceLamports to the treasury wallet

3. confirmJobPayment(jobId, txSignature)
   → server verifies the transfer on-chain
   → { status: "QUEUED" }`}
            </CodeBlock>
          </Block>

          <Block id="worker" title="Worker CLI">
            <p className="text-sm text-muted-foreground">
              The worker authenticates as a provider, polls for matching jobs, runs
              inference against your configured endpoint, and submits the result.
            </p>
            <CodeBlock language="bash">
{`# The worker ships with the repo. Register on the Providers page
# first to get your API key, then from the project root:

# Authenticate with the API key shown after registration
node cli/infernode.mjs provider login --key infq_...

# Point the worker at your inference backend
node cli/infernode.mjs provider set-endpoint --url http://localhost:11434 --mode ollama

# Run
node cli/infernode.mjs worker start
node cli/infernode.mjs provider status`}
            </CodeBlock>
          </Block>

          <Block id="anchor" title="On-chain program (roadmap)">
            <p className="text-sm text-muted-foreground">
              Today payments settle by direct transfer to the protocol treasury,
              verified server-side on-chain. A trust-minimized Anchor escrow program
              is written but not yet deployed — escrow release, refunds, and slashing
              are coming soon. The planned instruction set:
            </p>
            <CodeBlock language="rust">
{`initialize_registry(treasury)
register_provider(stake_amount)
deactivate_provider()

create_job(job_id_hash, amount, protocol_fee, expires_at)
assign_provider(job_id_hash, provider)
submit_result_hash(job_id_hash, result_hash)
release_payment(job_id_hash)
refund_job(job_id_hash)
slash_provider(provider, amount)`}
            </CodeBlock>
          </Block>
        </article>
      </div>
      <SiteFooter />
    </div>
  );
}

function Block({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function CodeBlock({ language, children }: { language: string; children: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-4 py-2 font-mono text-[11px] text-muted-foreground">
        <span>{language}</span>
        <span>copy</span>
      </div>
      <pre className="overflow-x-auto p-5 font-mono text-[12.5px] leading-relaxed text-foreground/90">{children}</pre>
    </div>
  );
}
