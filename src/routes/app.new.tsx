import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { computePrice, estimateTokensFromText, formatSol, type TaskType } from "../lib/pricing";
import { TASKS, MODELS } from "../lib/tasks";
import { payForJob } from "../lib/solana-pay";
import { TREASURY_WALLET } from "../lib/solana-config";
import { createJob, confirmPayment, ensureUser } from "../lib/server-fns";

export const Route = createFileRoute("/app/new")({
  head: () => ({ meta: [{ title: "New job · InferNode" }] }),
  component: NewJob,
});

type Phase = "idle" | "creating" | "paying" | "confirming";

function NewJob() {
  const navigate = useNavigate();
  const wallet = useWallet();
  const { connected, publicKey } = wallet;

  const [task, setTask] = useState<TaskType>("TEXT_GENERATION");
  const [model, setModel] = useState(MODELS[0]);
  const [input, setInput] = useState(
    "Write a concise product summary for a Solana-native AI compute marketplace.",
  );
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);

  const price = useMemo(() => {
    const tokens = estimateTokensFromText(input || " ");
    return computePrice(tokens);
  }, [input]);

  const busy = phase !== "idle";

  async function handlePay() {
    setError(null);
    if (!connected || !publicKey) {
      setError("Connect your wallet first.");
      return;
    }
    if (!TREASURY_WALLET) {
      setError(
        "Treasury wallet is not configured yet. The marketplace owner must set VITE_TREASURY_WALLET before payments can be accepted.",
      );
      return;
    }
    if (!input.trim()) {
      setError("Input cannot be empty.");
      return;
    }
    const walletAddress = publicKey.toBase58();
    try {
      setPhase("creating");
      await ensureUser({ data: { walletAddress } });
      const job = await createJob({
        data: { walletAddress, taskType: task, modelName: model, input },
      });
      setPhase("paying");
      const { signature } = await payForJob(wallet, job.priceLamports);
      setPhase("confirming");
      await confirmPayment({ data: { jobId: job.id, txSignature: signature } });
      navigate({ to: "/app/jobs" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setPhase("idle");
    }
  }

  const payLabel =
    phase === "creating"
      ? "Creating job…"
      : phase === "paying"
        ? "Confirm in wallet…"
        : phase === "confirming"
          ? "Confirming on-chain…"
          : `Pay ${formatSol(price.totalLamports)} SOL & submit →`;

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-8">
        <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          New job
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Submit an inference task</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure your job, pay in SOL on mainnet, and a provider will pick it up.
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
              <span>
                {input.length} chars · ~{price.estimatedTokens} tokens (est.)
              </span>
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
                <Line k="Est. tokens" v={price.estimatedTokens.toString()} />
                <Line k="Base fee" v={`${formatSol(price.baseFeeLamports)} SOL`} />
                <Line k="Tokens cost" v={`${formatSol(price.tokenCostLamports)} SOL`} />
                <div className="border-t border-border pt-3">
                  <Line k="Subtotal" v={`${formatSol(price.subtotalLamports)} SOL`} bold />
                  <Line k="Protocol fee (5%)" v={`+${formatSol(price.protocolFeeLamports)}`} muted />
                  <Line k="Total" v={`${formatSol(price.totalLamports)} SOL`} bold />
                </div>
                <div className="rounded-md border border-border bg-background p-3">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Provider receives
                  </div>
                  <div className="mt-1 text-lg text-foreground">
                    {formatSol(price.providerPayoutLamports)} SOL
                  </div>
                </div>
              </div>
              <div className="border-t border-border p-4">
                <button
                  onClick={handlePay}
                  disabled={busy}
                  className="w-full rounded-md bg-foreground py-2.5 font-mono text-xs text-background hover:opacity-90 disabled:opacity-60"
                >
                  {payLabel}
                </button>
                {!connected && (
                  <div className="mt-2 text-center font-mono text-[10px] text-warning">
                    Connect your wallet to pay.
                  </div>
                )}
                {error && (
                  <div className="mt-2 rounded border border-destructive/30 bg-destructive/10 p-2 text-center font-mono text-[10px] text-destructive">
                    {error}
                  </div>
                )}
                <div className="mt-2 text-center font-mono text-[10px] text-muted-foreground">
                  Real SOL transfer on Solana mainnet. Verify the amount in your wallet.
                </div>
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
