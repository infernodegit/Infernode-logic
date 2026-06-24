import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { listProviders, networkStats, registerProvider, ensureUser } from "../lib/server-fns";
import { formatSol, type TaskType } from "../lib/pricing";
import { TASKS, MODELS } from "../lib/tasks";

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

interface NetStats {
  activeProviders: number;
  totalStakeLamports: number;
  totalJobs: number;
  completedJobs: number;
  paidOutLamports: number;
}

interface ProviderRow {
  id: string;
  name: string;
  publicKey: string;
  stakeLamports: number;
  successCount: number;
  failureCount: number;
  isActive: boolean;
  capabilities: { taskType: string; modelName: string }[];
}

function Providers() {
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [stats, setStats] = useState<NetStats | null>(null);
  const [showForm, setShowForm] = useState(false);

  function refresh() {
    Promise.all([listProviders(), networkStats()]).then(([p, s]) => {
      setProviders(p as ProviderRow[]);
      setStats(s);
    });
  }

  useEffect(() => {
    refresh();
  }, []);

  const avgPayout =
    stats && stats.completedJobs > 0
      ? formatSol(Math.round(stats.paidOutLamports / stats.completedJobs))
      : "0.00000";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <section className="relative border-b border-border">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Provider portal
          </div>
          <h1 className="mt-3 max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
            Turn your GPU into <span className="text-muted-foreground">a paid endpoint.</span>
          </h1>
          <p className="mt-4 max-w-xl text-sm text-muted-foreground sm:text-base">
            Register an endpoint, run the worker, earn per inference job. Payments settle in SOL on mainnet.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/docs" className="rounded-md bg-foreground px-5 py-2.5 font-mono text-sm text-background hover:opacity-90">
              Read the CLI docs →
            </Link>
            <button
              onClick={() => setShowForm((v) => !v)}
              className="rounded-md border border-border bg-surface px-5 py-2.5 font-mono text-sm text-foreground hover:bg-surface-elevated"
            >
              {showForm ? "Close form" : "Register provider"}
            </button>
          </div>

          {showForm && <RegisterForm onDone={refresh} />}
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
            <NetStat k="Active providers" v={stats ? stats.activeProviders.toString() : "—"} />
            <NetStat k="Total staked" v={stats ? `${formatSol(stats.totalStakeLamports)} SOL` : "—"} />
            <NetStat k="Total jobs" v={stats ? stats.totalJobs.toLocaleString() : "—"} />
            <NetStat k="Avg payout / job" v={`${avgPayout} SOL`} />
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Setup
          </div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Get a worker running in 4 commands.</h2>

          <div className="mt-8 overflow-hidden rounded-lg border border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border px-4 py-2 font-mono text-[11px] text-muted-foreground">
              <span>~/infernode</span>
              <span>bash</span>
            </div>
            <pre className="overflow-x-auto p-4 font-mono text-[12px] leading-relaxed text-foreground/90 sm:p-5 sm:text-[13px]">
{`$ npm i -g infernode-worker

$ infernode provider login
  → paste your API key from the Register form

$ infernode provider set-endpoint \\
    --url http://localhost:11434 \\
    --mode ollama

$ infernode worker start
  → polling jobs · ctrl-c to stop`}
            </pre>
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Top providers
          </div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Leaderboard</h2>

          <div className="mt-8 overflow-hidden rounded-lg border border-border">
            <div className="hidden md:block">
              <div className="grid grid-cols-12 border-b border-border bg-surface px-5 py-3 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                <div className="col-span-3">Provider</div>
                <div className="col-span-4">Models</div>
                <div className="col-span-2">Stake</div>
                <div className="col-span-2">Jobs done</div>
                <div className="col-span-1 text-right">Success</div>
              </div>
              {providers.map((p) => {
                const total = p.successCount + p.failureCount;
                const success = total > 0 ? Math.round((p.successCount / total) * 100) : 0;
                return (
                  <div key={p.id} className="grid grid-cols-12 items-center border-b border-border bg-background px-5 py-3 last:border-b-0 hover:bg-surface/60">
                    <div className="col-span-3 flex items-center gap-2 font-mono text-sm">
                      <span className={"status-dot " + (p.isActive ? "" : "opacity-30")} />
                      {p.name}
                    </div>
                    <div className="col-span-4 flex flex-wrap gap-1">
                      {p.capabilities.length === 0 ? (
                        <span className="font-mono text-[10px] text-muted-foreground">—</span>
                      ) : (
                        [...new Set(p.capabilities.map((c) => c.modelName))].map((m) => (
                          <span key={m} className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                            {m}
                          </span>
                        ))
                      )}
                    </div>
                    <div className="col-span-2 font-mono text-xs">{formatSol(p.stakeLamports)}</div>
                    <div className="col-span-2 font-mono text-xs text-foreground/80">{p.successCount.toLocaleString()}</div>
                    <div className="col-span-1 text-right font-mono text-xs text-success">{success}%</div>
                  </div>
                );
              })}
              {providers.length === 0 && (
                <div className="bg-background p-12 text-center font-mono text-sm text-muted-foreground">
                  No providers registered yet. Be the first.
                </div>
              )}
            </div>

            <div className="divide-y divide-border bg-background md:hidden">
              {providers.map((p) => {
                const total = p.successCount + p.failureCount;
                const success = total > 0 ? Math.round((p.successCount / total) * 100) : 0;
                return (
                  <div key={p.id} className="px-4 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-mono text-sm text-foreground">
                        <span className={"status-dot " + (p.isActive ? "" : "opacity-30")} />
                        {p.name}
                      </div>
                      <span className="font-mono text-sm font-semibold text-foreground">{formatSol(p.stakeLamports)} SOL</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {[...new Set(p.capabilities.map((c) => c.modelName))].map((m) => (
                        <span key={m} className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                          {m}
                        </span>
                      ))}
                    </div>
                    <div className="mt-2 flex gap-4 font-mono text-[11px] text-muted-foreground">
                      <span>{p.successCount.toLocaleString()} jobs</span>
                      <span className="text-success">{success}%</span>
                    </div>
                  </div>
                );
              })}
              {providers.length === 0 && (
                <div className="p-12 text-center font-mono text-sm text-muted-foreground">
                  No providers registered yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function RegisterForm({ onDone }: { onDone: () => void }) {
  const { connected, publicKey } = useWallet();
  const [name, setName] = useState("");
  const [endpointUrl, setEndpointUrl] = useState("");
  const [apiMode, setApiMode] = useState<"OLLAMA" | "OPENAI_COMPATIBLE" | "CUSTOM">("OLLAMA");
  const [taskType, setTaskType] = useState<TaskType>("TEXT_GENERATION");
  const [modelName, setModelName] = useState(MODELS[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);

  async function submit() {
    setError(null);
    if (!connected || !publicKey) {
      setError("Connect your wallet first.");
      return;
    }
    if (!name.trim()) {
      setError("Provider name is required.");
      return;
    }
    const walletAddress = publicKey.toBase58();
    try {
      setSubmitting(true);
      await ensureUser({ data: { walletAddress } });
      const res = await registerProvider({
        data: {
          walletAddress,
          name: name.trim(),
          endpointUrl: endpointUrl.trim() || undefined,
          apiMode,
          models: [{ taskType, modelName }],
        },
      });
      setApiKey(res.apiKey);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  }

  if (apiKey) {
    return (
      <div className="mt-6 max-w-xl rounded-lg border border-success/40 bg-success/5 p-5">
        <div className="font-mono text-xs uppercase tracking-wider text-success">Provider registered</div>
        <p className="mt-2 font-mono text-xs text-muted-foreground">
          Save this API key now — it is shown only once. Use it with the worker CLI
          (<span className="text-foreground">infernode provider login</span>).
        </p>
        <div className="mt-3 break-all rounded border border-border bg-background p-3 font-mono text-xs text-foreground">
          {apiKey}
        </div>
        <button
          onClick={() => navigator.clipboard?.writeText(apiKey)}
          className="mt-3 rounded-md border border-border bg-surface px-3 py-1.5 font-mono text-xs hover:bg-surface-elevated"
        >
          Copy API key
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6 max-w-xl space-y-3 rounded-lg border border-border bg-surface p-5">
      <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Register as provider</div>
      <Field label="Provider name">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="my-gpu-node"
          className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-xs text-foreground outline-none focus:border-foreground/40"
        />
      </Field>
      <Field label="Endpoint URL (optional)">
        <input
          value={endpointUrl}
          onChange={(e) => setEndpointUrl(e.target.value)}
          placeholder="http://localhost:11434"
          className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-xs text-foreground outline-none focus:border-foreground/40"
        />
      </Field>
      <Field label="API mode">
        <div className="flex flex-wrap gap-2">
          {(["OLLAMA", "OPENAI_COMPATIBLE", "CUSTOM"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setApiMode(m)}
              className={
                "rounded-md border px-3 py-1.5 font-mono text-[11px] " +
                (apiMode === m
                  ? "border-foreground bg-surface-elevated text-foreground"
                  : "border-border bg-surface text-muted-foreground hover:text-foreground")
              }
            >
              {m}
            </button>
          ))}
        </div>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Task type">
          <select
            value={taskType}
            onChange={(e) => setTaskType(e.target.value as TaskType)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-xs text-foreground outline-none focus:border-foreground/40"
          >
            {TASKS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Model">
          <input
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            list="provider-models"
            className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-xs text-foreground outline-none focus:border-foreground/40"
          />
          <datalist id="provider-models">
            {MODELS.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
        </Field>
      </div>
      {error && (
        <div className="rounded border border-destructive/30 bg-destructive/10 p-2 font-mono text-[11px] text-destructive">
          {error}
        </div>
      )}
      <button
        onClick={submit}
        disabled={submitting}
        className="rounded-md bg-foreground px-4 py-2 font-mono text-xs text-background hover:opacity-90 disabled:opacity-60"
      >
        {submitting ? "Registering…" : "Register provider"}
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      {children}
    </label>
  );
}

function NetStat({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4 sm:p-5">
      <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{k}</div>
      <div className="mt-2 font-mono text-xl text-foreground sm:text-2xl">{v}</div>
    </div>
  );
}
