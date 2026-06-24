import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useState } from "react";
import logoUrl from "../assets/logo-b64";
import { ConnectWallet } from "./solana/connect-wallet";
import { clusterBadge } from "./solana/network-status";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <Logo />
          <span className="font-mono text-sm font-semibold tracking-tight">InferNode</span>
          <span className="ml-2 hidden rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground sm:inline">
            {clusterBadge()}
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <NavLink to="/providers">Providers</NavLink>
          <NavLink to="/docs">Docs</NavLink>
          <NavLink to="/whitepaper">Whitepaper</NavLink>
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
            className="hidden rounded-md bg-foreground px-3 py-1.5 font-mono text-xs text-background transition-opacity hover:opacity-90 sm:inline-flex"
          >
            Submit job →
          </Link>
          <div className="hidden sm:block">
            <ConnectWallet compact />
          </div>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <span className="font-mono text-xs leading-none">{open ? "✕" : "☰"}</span>
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background/95 backdrop-blur md:hidden">
          <nav className="mx-auto max-w-7xl px-4 py-3 space-y-1">
            <MobileNavLink to="/providers" onClick={() => setOpen(false)}>Providers</MobileNavLink>
            <MobileNavLink to="/docs" onClick={() => setOpen(false)}>Docs</MobileNavLink>
            <MobileNavLink to="/whitepaper" onClick={() => setOpen(false)}>Whitepaper</MobileNavLink>
            <MobileNavLink to="/pricing" onClick={() => setOpen(false)}>Pricing</MobileNavLink>
            <div className="my-2 border-t border-border" />
            <MobileNavLink to="/app" onClick={() => setOpen(false)}>Open app</MobileNavLink>
            <MobileNavLink to="/app/new" onClick={() => setOpen(false)}>Submit job →</MobileNavLink>
          </nav>
        </div>
      )}
    </header>
  );
}

function MobileNavLink({ to, children, onClick }: { to: string; children: ReactNode; onClick?: () => void }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="block rounded-md px-3 py-2.5 font-mono text-sm text-foreground/80 hover:bg-surface hover:text-foreground"
    >
      {children}
    </Link>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 sm:py-12 md:grid-cols-4">
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

        <div className="grid grid-cols-2 gap-8 md:col-span-2 md:grid-cols-2">
          <FooterCol title="Product" items={[
            ["Submit job", "/app/new"],
            ["Buyer dashboard", "/app"],
            ["Provider portal", "/providers"],
            ["Pricing", "/pricing"],
          ]} />
          <FooterCol title="Developers" items={[
            ["Whitepaper", "/whitepaper"],
            ["Documentation", "/docs"],
            ["Worker CLI", "/docs"],
            ["Anchor program", "/docs"],
          ]} />
        </div>
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

export function Logo({ size = 8 }: { size?: number }) {
  const px = size * 4;
  return (
    <img
      src={logoUrl}
      alt="InferNode logo"
      width={px}
      height={px}
      style={{ width: px, height: px, objectFit: "contain", display: "block" }}
    />
  );
}
