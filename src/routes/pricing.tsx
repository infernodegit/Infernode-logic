import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing · InferNode" },
      { name: "description", content: "Deterministic per-token pricing on InferNode. No subscriptions, no minimums." },
    ],
  }),
  component: Pricing,
});

function Pricing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <section className="border-b border-border">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-20">
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Pricing</div>
          <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
            Per token. Per job. Nothing else.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground sm:text-base">
            No subscriptions, no minimums. Pay the protocol baseline plus the network per-token rate.
          </p>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-3">
            <Tier
              name="Buyer"
              price="0.0001"
              unit="SOL base fee + 0.0005 / 1K tok"
              features={["Per-token billing", "On-chain payment verification", "Multi-model selection", "Escrow + refunds (coming soon)"]}
              cta={{ to: "/app/new", label: "Submit a job →" }}
            />
            <Tier
              highlight
              name="Provider"
              price="5%"
              unit="protocol fee on job revenue"
              features={["Fixed network per-token rate", "Reputation tracking", "Run any compatible engine", "Staking + auto payouts (coming soon)"]}
              cta={{ to: "/providers", label: "Become a provider →" }}
            />
            <Tier
              name="Enterprise"
              price="Custom"
              unit="dedicated capacity & SLA"
              features={["Priority queueing", "Dedicated providers", "Volume discounts", "Direct support channel"]}
              cta={{ to: "/docs", label: "Contact us →" }}
            />
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function Tier({
  name, price, unit, features, cta, highlight,
}: {
  name: string;
  price: string;
  unit: string;
  features: string[];
  cta: { to: string; label: string };
  highlight?: boolean;
}) {
  return (
    <div className={"flex flex-col p-6 sm:p-8 " + (highlight ? "bg-surface" : "bg-background")}>
      <div className="flex items-center justify-between">
        <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{name}</div>
        {highlight && (
          <span className="rounded border border-primary/40 bg-primary/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-primary">
            most active
          </span>
        )}
      </div>
      <div className="mt-6 font-mono text-4xl tracking-tight">{price}</div>
      <div className="mt-1 font-mono text-xs text-muted-foreground">{unit}</div>
      <ul className="mt-6 flex-1 space-y-2">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 font-mono text-xs">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 bg-foreground" />
            {f}
          </li>
        ))}
      </ul>
      <Link
        to={cta.to}
        className={
          "mt-8 inline-flex justify-center rounded-md px-4 py-2 font-mono text-xs transition-colors " +
          (highlight
            ? "bg-foreground text-background hover:opacity-90"
            : "border border-border bg-surface text-foreground hover:bg-surface-elevated")
        }
      >
        {cta.label}
      </Link>
    </div>
  );
}
