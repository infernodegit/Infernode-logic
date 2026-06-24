import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { buyerStats, listJobs } from "../lib/server-fns";
import { formatSol } from "../lib/pricing";
import { taskLabel } from "../lib/tasks";
import { timeAgo, shortId } from "../lib/format";
import type { Job } from "../db/schema";

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [{ title: "Dashboard · InferNode" }] }),
  component: Dashboard,
});

interface Stats {
  totalJobs: number;
  spentLamports: number;
  completedJobs: number;
  successRate: number;
}

function Dashboard() {
  const { connected, publicKey } = useWallet();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!publicKey) {
      setJobs([]);
      setStats(null);
      return;
    }
    const walletAddress = publicKey.toBase58();
    let active = true;
    setLoading(true);
    Promise.all([
      listJobs({ data: { walletAddress } }),
      buyerStats({ data: { walletAddress } }),
    ])
      .then(([j, s]) => {
        if (!active) return;
        setJobs(j as Job[]);
        setStats(s);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [publicKey]);

  const recent = jobs.slice(0, 5);

  return (
    <div className="mx-auto max-w-6xl space-y-6 sm:space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Buyer dashboard
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Welcome back.</h1>
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

      {!connected ? (
        <ConnectPrompt />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
            <StatCard k="Jobs submitted" v={stats ? stats.totalJobs.toString() : "—"} />
            <StatCard k="Spent (SOL)" v={stats ? formatSol(stats.spentLamports) : "—"} />
            <StatCard k="Completed" v={stats ? stats.completedJobs.toString() : "—"} />
            <StatCard
              k="Success rate"
              v={stats ? `${stats.successRate}%` : "—"}
              tone="good"
            />
          </div>

          <section className="rounded-lg border border-border bg-surface">
            <header className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5">
              <h2 className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">
                Recent jobs
              </h2>
              <Link to="/app/jobs" className="font-mono text-xs text-muted-foreground hover:text-foreground">
                View all →
              </Link>
            </header>

            {loading && recent.length === 0 ? (
              <div className="p-12 text-center font-mono text-sm text-muted-foreground">Loading…</div>
            ) : recent.length === 0 ? (
              <div className="p-12 text-center font-mono text-sm text-muted-foreground">
                No jobs yet.{" "}
                <Link to="/app/new" className="text-foreground underline">
                  Submit your first job
                </Link>
                .
              </div>
            ) : (
              <>
                <div className="hidden md:block">
                  <div className="grid grid-cols-12 border-b border-border px-5 py-2 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    <div className="col-span-3">Job</div>
                    <div className="col-span-3">Task</div>
                    <div className="col-span-3">Model</div>
                    <div className="col-span-1">Price</div>
                    <div className="col-span-2 text-right">Status</div>
                  </div>
                  {recent.map((j) => (
                    <div key={j.id} className="grid grid-cols-12 items-center border-b border-border px-5 py-3 last:border-b-0 hover:bg-surface-elevated/40">
                      <div className="col-span-3">
                        <div className="font-mono text-sm text-foreground">{shortId(j.id)}</div>
                        <div className="font-mono text-[11px] text-muted-foreground">{timeAgo(j.createdAt)}</div>
                      </div>
                      <div className="col-span-3 font-mono text-xs text-foreground/80">{taskLabel(j.taskType)}</div>
                      <div className="col-span-3 font-mono text-xs text-foreground/80">{j.modelName}</div>
                      <div className="col-span-1 font-mono text-xs">{formatSol(j.priceLamports)}</div>
                      <div className="col-span-2 text-right">
                        <StatusBadge status={j.status} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="divide-y divide-border md:hidden">
                  {recent.map((j) => (
                    <div key={j.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-mono text-sm text-foreground">{shortId(j.id)}</div>
                          <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">{timeAgo(j.createdAt)}</div>
                        </div>
                        <StatusBadge status={j.status} />
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-muted-foreground">
                        <span>{taskLabel(j.taskType)}</span>
                        <span>{j.modelName}</span>
                        <span className="text-foreground">{formatSol(j.priceLamports)} SOL</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function ConnectPrompt() {
  return (
    <div className="rounded-lg border border-border bg-surface p-12 text-center">
      <div className="font-mono text-sm text-foreground">Connect your wallet to view your dashboard.</div>
      <div className="mt-1 font-mono text-xs text-muted-foreground">
        Your jobs and spending are tied to your Solana wallet.
      </div>
    </div>
  );
}

function StatCard({ k, v, tone }: { k: string; v: string; tone?: "good" }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4 sm:p-5">
      <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{k}</div>
      <div className={"mt-2 font-mono text-xl sm:mt-3 sm:text-2xl " + (tone === "good" ? "text-success" : "text-foreground")}>{v}</div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    COMPLETED: "text-success border-success/30 bg-success/10",
    PAID_OUT: "text-success border-success/30 bg-success/10",
    RUNNING: "text-primary border-primary/30 bg-primary/10",
    ASSIGNED: "text-primary border-primary/30 bg-primary/10",
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
