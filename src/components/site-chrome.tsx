import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <Logo />
          <span className="font-mono text-sm font-semibold tracking-tight">InferNode</span>
          <span className="ml-2 hidden rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground sm:inline">
            devnet
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <NavLink to="/providers">Providers</NavLink>
          <NavLink to="/docs">Docs</NavLink>
          <NavLink to="/pricing">Pricing</NavLink>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/app"
            className="hidden rounded-md border border-border bg-surface px-3 py-1.5 font-mono text-xs text-foreground transition-colors hover:bg-surface-elevated sm:inline-flex"
          >
            Open app
          </Link>
          <Link
            to="/app/new"
            className="rounded-md bg-foreground px-3 py-1.5 font-mono text-xs text-background transition-opacity hover:opacity-90"
          >
            Submit job →
          </Link>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <Logo />
            <span className="font-mono text-sm font-semibold">InferNode</span>
          </div>
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">
            Solana-native AI inference marketplace. Pay per job. Earn from idle compute.
          </p>
          <div className="mt-4 font-mono text-[11px] text-muted-foreground">
            v0.1.0 · devnet · {new Date().getFullYear()}
          </div>
        </div>

        <FooterCol title="Product" items={[
          ["Submit job", "/app/new"],
          ["Buyer dashboard", "/app"],
          ["Provider portal", "/providers"],
          ["Pricing", "/pricing"],
        ]} />
        <FooterCol title="Developers" items={[
          ["Documentation", "/docs"],
          ["Worker CLI", "/docs"],
          ["Anchor program", "/docs"],
        ]} />
      </div>
    </footer>
  );
}

function FooterCol({ title, items }: { title: string; items: [string, string][] }) {
  return (
    <div>
      <div className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
        {title}
      </div>
      <ul className="mt-3 space-y-2">
        {items.map(([label, href]) => (
          <li key={label}>
            <Link to={href} className="text-sm text-foreground/80 hover:text-foreground">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function NavLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="rounded-md px-3 py-1.5 font-mono text-xs text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
      activeProps={{ className: "rounded-md px-3 py-1.5 font-mono text-xs bg-surface text-foreground" }}
    >
      {children}
    </Link>
  );
}

export function Logo() {
  return (
    <div className="grid h-6 w-6 place-items-center rounded border border-border bg-surface">
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-foreground" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 7h6M4 12h16M14 17h6M4 17h6M14 7h6" strokeLinecap="square" />
      </svg>
    </div>
  );
}
