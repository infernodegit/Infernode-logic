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
const POLL_MS = 6000;

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
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!publicKey) {
      setJobs([]);
      return;
    }
    const walletAddress = publicKey.toBase58();
    let cancelled = false;
    const load = async (background: boolean) => {
      if (!background) setLoading(true);
      try {
        const j = await listJobs({ data: { walletAddress } });
        if (!cancelled) setJobs(j as Job[]);
      } catch {
        // Transient fetch errors are ignored; the next poll retries.
      } finally {
        if (!cancelled && !background) setLoading(false);
      }
    };
    load(false);
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") load(true);
    }, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") load(true);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [publicKey]);

  const filtered = jobs.filter((j) => matchesFilter(j.status, filter));
  const selected = jobs.find((j) => j.id === selectedId) ?? null;

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
              <button
                key={j.id}
                onClick={() => setSelectedId(j.id)}
                className="grid w-full grid-cols-12 items-center border-b border-border bg-background px-5 py-3 text-left last:border-b-0 hover:bg-surface/60"
              >
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
              </button>
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
              <button
                key={j.id}
                onClick={() => setSelectedId(j.id)}
                className="block w-full px-4 py-3 text-left"
              >
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
              </button>
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

      {selected && <JobDetail job={selected} onClose={() => setSelectedId(null)} />}
    </div>
  );
}

function statusHint(status: string): string {
  switch (status) {
    case "PENDING_PAYMENT":
      return "Waiting for payment confirmation.";
    case "QUEUED":
      return "Paid and queued — waiting for a provider to pick it up.";
    case "ASSIGNED":
      return "A provider has claimed this job.";
    case "RUNNING":
      return "A provider is running this job now.";
    default:
      return "";
  }
}

function JobDetail({ job, onClose }: { job: Job; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const output = job.outputJson?.text ?? null;
  const isDone = job.status === "COMPLETED" || job.status === "PAID_OUT";
  const isFailed = job.status === "FAILED";

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background/80 p-4 backdrop-blur-sm sm:p-8"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-lg border border-border bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm text-foreground">{shortId(job.id)}</span>
            <StatusBadge status={job.status} />
          </div>
          <button
            onClick={onClose}
            className="rounded border border-border px-2 py-1 font-mono text-xs text-muted-foreground hover:text-foreground"
          >
            Close ✕
          </button>
        </header>

        <div className="space-y-5 p-5">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 font-mono text-xs sm:grid-cols-3">
            <Meta k="Task" v={taskLabel(job.taskType)} />
            <Meta k="Model" v={job.modelName} />
            <Meta k="Price" v={`${formatSol(job.priceLamports)} SOL`} />
            <Meta k="Est. tokens" v={job.estimatedTokens.toString()} />
            <Meta k="Created" v={timeAgo(job.createdAt)} />
            <Meta k="Completed" v={job.completedAt ? timeAgo(job.completedAt) : "—"} />
          </div>

          {job.txSignature && (
            <div className="font-mono text-xs">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Payment tx</div>
              <a
                href={`https://solscan.io/tx/${job.txSignature}`}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block break-all text-primary hover:underline"
              >
                {job.txSignature}
              </a>
            </div>
          )}

          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Input</div>
            <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap rounded-md border border-border bg-background p-3 font-mono text-xs text-foreground/90">
              {job.inputJson?.prompt ?? "—"}
            </pre>
          </div>

          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {isFailed ? "Error" : "Result"}
            </div>
            {isFailed ? (
              <pre className="mt-1 max-h-72 overflow-auto whitespace-pre-wrap rounded-md border border-destructive/30 bg-destructive/10 p-3 font-mono text-xs text-destructive">
                {job.error ?? "The provider reported a failure."}
              </pre>
            ) : isDone && output ? (
              <pre className="mt-1 max-h-96 overflow-auto whitespace-pre-wrap rounded-md border border-border bg-background p-3 font-mono text-xs text-foreground/90">
                {output}
              </pre>
            ) : (
              <div className="mt-1 rounded-md border border-border bg-background p-4 font-mono text-xs text-muted-foreground">
                {statusHint(job.status) || "No result yet."}
              </div>
            )}
          </div>

          {job.resultHash && (
            <div className="font-mono text-xs">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Result hash (SHA-256)</div>
              <div className="mt-1 break-all text-muted-foreground">{job.resultHash}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Meta({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{k}</div>
      <div className="mt-0.5 truncate text-foreground/90">{v}</div>
    </div>
  );
}
