import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { StatusBadge } from "./app.index";
import { listJobs } from "../lib/server-fns";
import { formatSol } from "../lib/pricing";
import { taskLabel } from "../lib/tasks";
import { timeAgo, shortId } from "../lib/format";
import type { Job } from "../db/schema";

export const Route = createFileRoute("/app/jobs")({
  head: () => ({ meta: [{ title: "Jobs · InferNode" }] }),
  component: Jobs,
});

const FILTERS = ["All", "Running", "Queued", "Completed", "Failed"] as const;

function matchesFilter(status: string, filter: string): boolean {
  if (filter === "All") return true;
  if (filter === "Running") return status === "RUNNING" || status === "ASSIGNED";
  if (filter === "Queued") return status === "QUEUED" || status === "PENDING_PAYMENT";
  if (filter === "Completed") return status === "COMPLETED" || status === "PAID_OUT";
  if (filter === "Failed") return status === "FAILED";
  return true;
}

function Jobs() {
  const { connected, publicKey } = useWallet();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>("All");

  useEffect(() => {
    if (!publicKey) {
      setJobs([]);
      return;
    }
    const walletAddress = publicKey.toBase58();
    let active = true;
    setLoading(true);
    listJobs({ data: { walletAddress } })
      .then((j) => active && setJobs(j as Job[]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [publicKey]);

  const filtered = jobs.filter((j) => matchesFilter(j.status, filter));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Jobs</div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">All inference jobs</h1>
        </div>
        <div className="flex gap-1 overflow-x-auto rounded-md border border-border bg-surface p-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={
                "shrink-0 rounded px-3 py-1 font-mono text-xs transition-colors " +
                (filter === f ? "bg-surface-elevated text-foreground" : "text-muted-foreground hover:text-foreground")
              }
            >
              {f}
            </button>
          ))}
        </div>
      </header>

      {!connected ? (
        <div className="rounded-lg border border-border bg-surface p-12 text-center font-mono text-sm text-muted-foreground">
          Connect your wallet to view your jobs.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="hidden md:block">
            <div className="grid grid-cols-12 border-b border-border bg-surface px-5 py-3 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              <div className="col-span-2">Job</div>
              <div className="col-span-2">Task</div>
              <div className="col-span-3">Model</div>
              <div className="col-span-2">Tx</div>
              <div className="col-span-1">Price</div>
              <div className="col-span-2 text-right">Status</div>
            </div>
            {filtered.map((j) => (
              <div key={j.id} className="grid grid-cols-12 items-center border-b border-border bg-background px-5 py-3 last:border-b-0 hover:bg-surface/60">
                <div className="col-span-2">
                  <div className="font-mono text-sm">{shortId(j.id)}</div>
                  <div className="font-mono text-[11px] text-muted-foreground">{timeAgo(j.createdAt)}</div>
                </div>
                <div className="col-span-2 font-mono text-xs text-foreground/80">{taskLabel(j.taskType)}</div>
                <div className="col-span-3 font-mono text-xs text-foreground/80">{j.modelName}</div>
                <div className="col-span-2 font-mono text-xs text-muted-foreground">
                  {j.txSignature ? `${j.txSignature.slice(0, 6)}…` : "—"}
                </div>
                <div className="col-span-1 font-mono text-xs">{formatSol(j.priceLamports)}</div>
                <div className="col-span-2 text-right">
                  <StatusBadge status={j.status} />
                </div>
              </div>
            ))}
            {!loading && filtered.length === 0 && (
              <div className="bg-background p-12 text-center font-mono text-sm text-muted-foreground">
                No jobs match this filter.
              </div>
            )}
            {loading && (
              <div className="bg-background p-12 text-center font-mono text-sm text-muted-foreground">Loading…</div>
            )}
          </div>

          <div className="divide-y divide-border bg-background md:hidden">
            {filtered.map((j) => (
              <div key={j.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-mono text-sm text-foreground">{shortId(j.id)}</div>
                    <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">{timeAgo(j.createdAt)}</div>
                  </div>
                  <StatusBadge status={j.status} />
                </div>
                <div className="mt-2 grid grid-cols-2 gap-1 font-mono text-[11px] text-muted-foreground">
                  <span><span className="text-muted-foreground/60">task</span> {taskLabel(j.taskType)}</span>
                  <span><span className="text-muted-foreground/60">price</span> {formatSol(j.priceLamports)}</span>
                  <span className="col-span-2 truncate"><span className="text-muted-foreground/60">model</span> {j.modelName}</span>
                </div>
              </div>
            ))}
            {!loading && filtered.length === 0 && (
              <div className="p-12 text-center font-mono text-sm text-muted-foreground">
                No jobs match this filter.
              </div>
            )}
            {loading && (
              <div className="p-12 text-center font-mono text-sm text-muted-foreground">Loading…</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
