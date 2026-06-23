import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";

export const Route = createFileRoute("/providers")({
  head: () => ({
    meta: [
      { title: "Providers · InferNode" },
      { name: "description", content: "Earn from idle GPUs and API endpoints. Register as a provider on InferNode." },
      { property: "og:title", content: "Providers · InferNode" },
      { property: "og:description", content: "Earn from idle GPUs and API endpoints. Register as a provider on InferNode." },
    ],
  }),
  component: Providers,
});

const TOP = [
  { name: "prov_8x4f", stake: "12.4", jobs: 1827, success: "99.2%", earnings: "4.812", models: ["llama3.1:8b", "mistral:7b"] },
  { name: "prov_qq42", stake: "32.0", jobs: 991, success: "98.7%", earnings: "9.221", models: ["llama3.1:70b"] },
  { name: "prov_91kk", stake: "8.1", jobs: 612, success: "97.4%", earnings: "1.118", models: ["qwen2.5:14b", "mistral:7b"] },
  { name: "prov_2vva", stake: "5.0", jobs: 4421, success: "99.8%", earnings: "2.402", models: ["nomic-embed-text"] },
  { name: "prov_jjr1", stake: "10.0", jobs: 283, success: "96.1%", earnings: "0.918", models: ["deepseek-coder:6.7b"] },
];

function Providers() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <section className="relative border-b border-border">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="relative mx-auto max-w-7xl px-6 py-20">
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Provider portal
          </div>
          <h1 className="mt-3 max-w-3xl text-balance text-5xl font-semibold tracking-tight md:text-6xl">
            Turn your GPU into <span className="text-muted-foreground">a paid endpoint.</span>
          </h1>
          <p className="mt-4 max-w-xl text-muted-foreground">
            Stake SOL, register an endpoint, run the worker. Earn per inference job — paid automatically via Anchor escrow.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/docs" className="rounded-md bg-foreground px-5 py-2.5 font-mono text-sm text-background hover:opacity-90">
              Read the CLI docs →
            </Link>
            <button className="rounded-md border border-border bg-surface px-5 py-2.5 font-mono text-sm text-foreground hover:bg-surface-elevated">
              Register provider
            </button>
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid gap-4 md:grid-cols-4">
            <NetStat k="Active providers" v="49" />
            <NetStat k="Total staked" v="312.4 SOL" />
            <NetStat k="Jobs (24h)" v="8,431" />
            <NetStat k="Avg payout / job" v="0.00216 SOL" />
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Setup
          </div>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">Get a worker running in 4 commands.</h2>

          <div className="mt-8 overflow-hidden rounded-lg border border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border px-4 py-2 font-mono text-[11px] text-muted-foreground">
              <span>~/infernode</span>
              <span>bash</span>
            </div>
            <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-relaxed text-foreground/90">
{`$ npm i -g infernode-worker

$ infernode provider init
  ✓ generated keypair  → prov_8x4f.json

$ infernode provider set-endpoint \\
    --url http://localhost:11434 \\
    --mode ollama
  ✓ endpoint reachable · 2 models discovered

$ infernode provider register \\
    --stake 5 \\
    --model llama3.1:8b \\
    --price 0.00048
  ✓ on-chain registration confirmed
  ✓ provider is now ACTIVE

$ infernode worker start
  → polling jobs · ctrl-c to stop`}
            </pre>
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Top providers
          </div>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">Leaderboard</h2>

          <div className="mt-8 overflow-hidden rounded-lg border border-border">
            <div className="grid grid-cols-12 border-b border-border bg-surface px-5 py-3 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              <div className="col-span-3">Provider</div>
              <div className="col-span-3">Models</div>
              <div className="col-span-1">Stake</div>
              <div className="col-span-2">Jobs</div>
              <div className="col-span-1">Success</div>
              <div className="col-span-2 text-right">Earnings (SOL)</div>
            </div>
            {TOP.map((p) => (
              <div key={p.name} className="grid grid-cols-12 items-center border-b border-border bg-background px-5 py-3 last:border-b-0 hover:bg-surface/60">
                <div className="col-span-3 flex items-center gap-2 font-mono text-sm">
                  <span className="status-dot" />
                  {p.name}
                </div>
                <div className="col-span-3 flex flex-wrap gap-1">
                  {p.models.map((m) => (
                    <span key={m} className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                      {m}
                    </span>
                  ))}
                </div>
                <div className="col-span-1 font-mono text-xs">{p.stake}</div>
                <div className="col-span-2 font-mono text-xs text-foreground/80">{p.jobs.toLocaleString()}</div>
                <div className="col-span-1 font-mono text-xs text-success">{p.success}</div>
                <div className="col-span-2 text-right font-mono text-sm">{p.earnings}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function NetStat({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{k}</div>
      <div className="mt-2 font-mono text-2xl text-foreground">{v}</div>
    </div>
  );
}
