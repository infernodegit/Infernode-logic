import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { StatusBadge } from "./app.index";

export const Route = createFileRoute("/app/jobs")({
  head: () => ({ meta: [{ title: "Jobs · InferNode" }] }),
  component: Jobs,
});

const JOBS = [
  { id: "job_a91b", task: "text-generation", model: "llama3.1:8b", status: "COMPLETED", price: "0.00284", t: "2m ago", provider: "prov_8x4f" },
  { id: "job_a917", task: "summarization", model: "qwen2.5:14b", status: "RUNNING", price: "0.00210", t: "4m ago", provider: "prov_91kk" },
  { id: "job_a915", task: "text-generation", model: "mistral:7b", status: "QUEUED", price: "0.00091", t: "5m ago", provider: "—" },
  { id: "job_a912", task: "embedding", model: "nomic-embed-text", status: "COMPLETED", price: "0.00018", t: "11m ago", provider: "prov_2vva" },
  { id: "job_a90e", task: "code-review", model: "deepseek-coder:6.7b", status: "FAILED", price: "0.00065", t: "23m ago", provider: "prov_8x4f" },
  { id: "job_a908", task: "text-generation", model: "llama3.1:70b", status: "COMPLETED", price: "0.00410", t: "1h ago", provider: "prov_qq42" },
  { id: "job_a8z2", task: "summarization", model: "llama3.1:8b", status: "COMPLETED", price: "0.00152", t: "3h ago", provider: "prov_8x4f" },
];

const FILTERS = ["All", "Running", "Queued", "Completed", "Failed"];

function Jobs() {
  const [filter, setFilter] = useState("All");
  const filtered = filter === "All" ? JOBS : JOBS.filter((j) => j.status.toLowerCase() === filter.toLowerCase());

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Jobs
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">All inference jobs</h1>
        </div>
        <div className="flex gap-1 rounded-md border border-border bg-surface p-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={
                "rounded px-3 py-1 font-mono text-xs transition-colors " +
                (filter === f ? "bg-surface-elevated text-foreground" : "text-muted-foreground hover:text-foreground")
              }
            >
              {f}
            </button>
          ))}
        </div>
      </header>

      <div className="overflow-hidden rounded-lg border border-border">
        <div className="grid grid-cols-12 border-b border-border bg-surface px-5 py-3 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
          <div className="col-span-2">Job</div>
          <div className="col-span-2">Task</div>
          <div className="col-span-3">Model</div>
          <div className="col-span-2">Provider</div>
          <div className="col-span-1">Price</div>
          <div className="col-span-2 text-right">Status</div>
        </div>
        {filtered.map((j) => (
          <div key={j.id} className="grid grid-cols-12 items-center border-b border-border bg-background px-5 py-3 last:border-b-0 hover:bg-surface/60">
            <div className="col-span-2">
              <div className="font-mono text-sm">{j.id}</div>
              <div className="font-mono text-[11px] text-muted-foreground">{j.t}</div>
            </div>
            <div className="col-span-2 font-mono text-xs text-foreground/80">{j.task}</div>
            <div className="col-span-3 font-mono text-xs text-foreground/80">{j.model}</div>
            <div className="col-span-2 font-mono text-xs text-muted-foreground">{j.provider}</div>
            <div className="col-span-1 font-mono text-xs">{j.price}</div>
            <div className="col-span-2 text-right">
              <StatusBadge status={j.status} />
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="bg-background p-12 text-center font-mono text-sm text-muted-foreground">
            No jobs match this filter.
          </div>
        )}
      </div>
    </div>
  );
}
