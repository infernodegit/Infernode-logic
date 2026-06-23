import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [{ title: "Dashboard · InferNode" }] }),
  component: Dashboard,
});

const RECENT = [
  { id: "job_a91b", task: "text-generation", model: "llama3.1:8b", status: "COMPLETED", price: "0.00284", t: "2m ago" },
  { id: "job_a917", task: "summarization", model: "qwen2.5:14b", status: "RUNNING", price: "0.00210", t: "4m ago" },
  { id: "job_a912", task: "embedding", model: "nomic-embed-text", status: "COMPLETED", price: "0.00018", t: "11m ago" },
  { id: "job_a90e", task: "code-review", model: "deepseek-coder:6.7b", status: "FAILED", price: "0.00065", t: "23m ago" },
  { id: "job_a908", task: "text-generation", model: "llama3.1:70b", status: "COMPLETED", price: "0.00410", t: "1h ago" },
];

function Dashboard() {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Buyer dashboard
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Welcome back.</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Submit jobs, monitor execution, and audit results.
          </p>
        </div>
        <Link
          to="/app/new"
          className="rounded-md bg-foreground px-4 py-2 font-mono text-xs text-background hover:opacity-90"
        >
          + New job
        </Link>
      </header>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard k="Jobs submitted" v="142" delta="+12 today" />
        <StatCard k="Spent (SOL)" v="0.4831" delta="+0.018 today" />
        <StatCard k="Avg latency" v="3.8s" delta="-0.4s w/w" tone="good" />
        <StatCard k="Success rate" v="98.1%" delta="last 30d" tone="good" />
      </div>

      <section className="rounded-lg border border-border bg-surface">
        <header className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">
            Recent jobs
          </h2>
          <Link to="/app/jobs" className="font-mono text-xs text-muted-foreground hover:text-foreground">
            View all →
          </Link>
        </header>
        <div>
          <div className="grid grid-cols-12 border-b border-border px-5 py-2 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
            <div className="col-span-3">Job</div>
            <div className="col-span-3">Task</div>
            <div className="col-span-3">Model</div>
            <div className="col-span-1">Price</div>
            <div className="col-span-2 text-right">Status</div>
          </div>
          {RECENT.map((j) => (
            <div key={j.id} className="grid grid-cols-12 items-center border-b border-border px-5 py-3 last:border-b-0 hover:bg-surface-elevated/40">
              <div className="col-span-3">
                <div className="font-mono text-sm text-foreground">{j.id}</div>
                <div className="font-mono text-[11px] text-muted-foreground">{j.t}</div>
              </div>
              <div className="col-span-3 font-mono text-xs text-foreground/80">{j.task}</div>
              <div className="col-span-3 font-mono text-xs text-foreground/80">{j.model}</div>
              <div className="col-span-1 font-mono text-xs">{j.price}</div>
              <div className="col-span-2 text-right">
                <StatusBadge status={j.status} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({ k, v, delta, tone }: { k: string; v: string; delta?: string; tone?: "good" }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{k}</div>
      <div className="mt-3 font-mono text-2xl text-foreground">{v}</div>
      {delta && (
        <div className={"mt-1 font-mono text-[11px] " + (tone === "good" ? "text-success" : "text-muted-foreground")}>
          {delta}
        </div>
      )}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    COMPLETED: "text-success border-success/30 bg-success/10",
    RUNNING: "text-primary border-primary/30 bg-primary/10",
    FAILED: "text-destructive border-destructive/30 bg-destructive/10",
    QUEUED: "text-warning border-warning/30 bg-warning/10",
    PENDING_PAYMENT: "text-muted-foreground border-border bg-surface-elevated",
  };
  return (
    <span className={"inline-flex items-center gap-1.5 rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider " + (map[status] ?? map.PENDING_PAYMENT)}>
      ● {status}
    </span>
  );
}
