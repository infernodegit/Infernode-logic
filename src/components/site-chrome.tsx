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
          <SocialLinks />
          <div className="mt-4 font-mono text-[11px] text-muted-foreground">
            v0.1.0 · {clusterBadge()} · {new Date().getFullYear()}
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

function SocialLinks() {
  const links = [
    {
      label: "X",
      href: "https://x.com/infernode_",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644Z" />
        </svg>
      ),
    },
    {
      label: "GitHub",
      href: "https://github.com/infernodegit",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
          <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.5 11.5 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.91 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.014 2.898-.014 3.293 0 .322.216.694.825.576C20.565 22.092 24 17.595 24 12.297c0-6.627-5.373-12-12-12Z" />
        </svg>
      ),
    },
    {
      label: "Telegram",
      href: "#",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
        </svg>
      ),
    },
  ];
  return (
    <div className="mt-5 flex items-center gap-3">
      {links.map((l) => (
        <a
          key={l.label}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={l.label}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface text-muted-foreground transition-colors hover:bg-surface-elevated hover:text-foreground"
        >
          {l.icon}
        </a>
      ))}
    </div>
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
            <Link to={href} className="text-xs text-foreground/70 transition-colors hover:text-foreground">
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
