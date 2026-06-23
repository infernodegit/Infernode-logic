import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [
      { title: "Docs · InferNode" },
      { name: "description", content: "InferNode developer documentation — worker CLI, API, and Anchor program reference." },
    ],
  }),
  component: Docs,
});

const SECTIONS = [
  { id: "intro", label: "Introduction" },
  { id: "buyer", label: "Buyer API" },
  { id: "worker", label: "Worker CLI" },
  { id: "anchor", label: "Anchor program" },
];

function Docs() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-[200px_minmax(0,1fr)]">
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
              This is a hybrid marketplace: payments and registry on Solana, execution off-chain.
            </p>
          </section>

          <Block id="buyer" title="Buyer API">
            <p className="text-sm text-muted-foreground">
              Create a job via the REST API or the web app. Funds are locked in an
              Anchor escrow PDA until the result is delivered.
            </p>
            <CodeBlock language="HTTP">
{`POST /v1/jobs
Authorization: Wallet <signed-message>

{
  "task": "text-generation",
  "model": "llama3.1:8b",
  "input": "Summarize the Solana whitepaper.",
  "max_output_tokens": 512
}

201 Created
{
  "id": "job_a91b",
  "escrow_pda": "7Hk2...fQp9",
  "price_lamports": 285000,
  "status": "PENDING_PAYMENT"
}`}
            </CodeBlock>
          </Block>

          <Block id="worker" title="Worker CLI">
            <p className="text-sm text-muted-foreground">
              The worker authenticates as a provider, polls for matching jobs, runs
              inference against your configured endpoint, and submits the result.
            </p>
            <CodeBlock language="bash">
{`# Install
npm i -g infernode-worker

# Init & register
infernode provider init
infernode provider set-endpoint --url http://localhost:11434 --mode ollama
infernode provider register --stake 5 --model llama3.1:8b --price 0.00048

# Run
infernode worker start
infernode worker status`}
            </CodeBlock>
          </Block>

          <Block id="anchor" title="Anchor program">
            <p className="text-sm text-muted-foreground">
              On-chain logic lives in a single Anchor program: provider registry,
              job escrows, payout release, and refund / slash paths.
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
