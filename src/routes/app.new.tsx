import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/app/new")({
  head: () => ({ meta: [{ title: "New job · InferNode" }] }),
  component: NewJob,
});

const TASKS = [
  { id: "text-generation", label: "Text generation", glyph: "T", desc: "Prompt → text output" },
  { id: "summarization", label: "Summarization", glyph: "S", desc: "Long text → summary" },
  { id: "embedding", label: "Embedding", glyph: "E", desc: "Text → vector" },
  { id: "classification", label: "Classification", glyph: "C", desc: "Input → label + confidence" },
  { id: "code-review", label: "Code review", glyph: "{ }", desc: "Code snippet → review" },
];

const MODELS = ["llama3.1:8b", "llama3.1:70b", "mistral:7b", "qwen2.5:14b", "deepseek-coder:6.7b"];

const BASE = 0.0001;
const PER_K = 0.0005;
const FEE = 0.05;

function NewJob() {
  const [task, setTask] = useState("text-generation");
  const [model, setModel] = useState("llama3.1:8b");
  const [input, setInput] = useState("Write a concise product summary for a Solana-native AI compute marketplace.");
  const [maxOutput, setMaxOutput] = useState(512);

  const inputTokens = Math.max(1, Math.ceil(input.length / 4));
  const totalTokens = inputTokens + maxOutput;
  const price = useMemo(() => BASE + (totalTokens / 1000) * PER_K, [totalTokens]);
  const fee = price * FEE;
  const payout = price - fee;

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-8">
        <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          New job
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Submit an inference task</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure your job, fund the escrow, and a provider will pick it up.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Section title="01 · Task">
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              {TASKS.map((t) => {
                const active = t.id === task;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTask(t.id)}
                    className={
                      "flex flex-col items-start gap-2 rounded-md border p-3 text-left transition-colors " +
                      (active
                        ? "border-foreground bg-surface-elevated"
                        : "border-border bg-surface hover:border-foreground/40")
                    }
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded border border-border bg-background font-mono text-xs">
                      {t.glyph}
                    </div>
                    <div className="font-mono text-xs text-foreground">{t.label}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">{t.desc}</div>
                  </button>
                );
              })}
            </div>
          </Section>

          <Section title="02 · Model">
            <div className="flex flex-wrap gap-2">
              {MODELS.map((m) => {
                const active = m === model;
                return (
                  <button
                    key={m}
                    onClick={() => setModel(m)}
                    className={
                      "rounded-md border px-3 py-1.5 font-mono text-xs transition-colors " +
                      (active
                        ? "border-foreground bg-surface-elevated text-foreground"
                        : "border-border bg-surface text-muted-foreground hover:text-foreground")
                    }
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </Section>

          <Section title="03 · Input">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={10}
              className="w-full resize-y rounded-md border border-border bg-background p-4 font-mono text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-foreground/40"
              placeholder="Paste your prompt or input here…"
            />
            <div className="mt-2 flex items-center justify-between font-mono text-[11px] text-muted-foreground">
              <span>{input.length} chars · ~{inputTokens} tokens</span>
              <label className="flex items-center gap-2">
                max output tokens
                <input
                  type="number"
                  value={maxOutput}
                  onChange={(e) => setMaxOutput(Math.max(1, Number(e.target.value) || 1))}
                  className="w-20 rounded border border-border bg-background px-2 py-1 font-mono text-xs text-foreground"
                />
              </label>
            </div>
          </Section>
        </div>

        <aside className="space-y-4">
          <div className="sticky top-20 space-y-4">
            <div className="rounded-lg border border-border bg-surface">
              <div className="border-b border-border px-5 py-3 font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                Estimate
              </div>
              <div className="space-y-3 p-5 font-mono text-sm">
                <Line k="Input tokens" v={inputTokens.toString()} />
                <Line k="Max output" v={maxOutput.toString()} />
                <Line k="Base fee" v={`${BASE.toFixed(4)} SOL`} />
                <Line k="Tokens cost" v={`${((totalTokens / 1000) * PER_K).toFixed(5)} SOL`} />
                <div className="border-t border-border pt-3">
                  <Line k="Subtotal" v={`${price.toFixed(5)} SOL`} bold />
                  <Line k="Protocol fee (5%)" v={`-${fee.toFixed(5)}`} muted />
                </div>
                <div className="rounded-md border border-border bg-background p-3">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Provider receives
                  </div>
                  <div className="mt-1 text-lg text-foreground">{payout.toFixed(5)} SOL</div>
                </div>
              </div>
              <div className="border-t border-border p-4">
                <button className="w-full rounded-md bg-foreground py-2.5 font-mono text-xs text-background hover:opacity-90">
                  Pay {price.toFixed(5)} SOL & submit →
                </button>
                <div className="mt-2 text-center font-mono text-[10px] text-muted-foreground">
                  Funds locked in Anchor escrow until result delivered.
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-surface p-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                Available providers
              </div>
              <div className="mt-2 flex items-center gap-2 font-mono text-sm text-foreground">
                <span className="status-dot" /> 14 online · {model}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-surface">
      <header className="border-b border-border px-5 py-3 font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
        {title}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Line({ k, v, bold, muted }: { k: string; v: string; bold?: boolean; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-muted-foreground">{k}</span>
      <span className={(bold ? "text-foreground " : "") + (muted ? "text-muted-foreground" : "text-foreground")}>
        {v}
      </span>
    </div>
  );
}
