import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Logo } from "./site-chrome";
import { ConnectWallet } from "./solana/connect-wallet";
import { NetworkStatus } from "./solana/network-status";
import type { ReactNode } from "react";

const NAV = [
  { to: "/app", label: "Dashboard", glyph: "▦" },
  { to: "/app/new", label: "New job", glyph: "+" },
  { to: "/app/jobs", label: "Jobs", glyph: "≡" },
  { to: "/providers", label: "Providers", glyph: "◇" },
  { to: "/docs", label: "Docs", glyph: "?" },
];

export function AppShell({ children }: { children?: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <aside className="sticky top-0 hidden h-screen w-60 flex-col border-r border-border bg-surface md:flex">
          <Link to="/" className="flex h-14 items-center gap-2 border-b border-border px-5">
            <Logo />
            <span className="font-mono text-sm font-semibold">InferNode</span>
          </Link>

          <div className="px-3 py-4">
            <div className="px-2 pb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Workspace
            </div>
            <nav className="space-y-0.5">
              {NAV.map((item) => {
                const active = pathname === item.to || (item.to !== "/app" && pathname.startsWith(item.to));
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={
                      "flex items-center gap-3 rounded-md px-2 py-1.5 font-mono text-xs transition-colors " +
                      (active
                        ? "bg-surface-elevated text-foreground"
                        : "text-muted-foreground hover:bg-surface-elevated hover:text-foreground")
                    }
                  >
                    <span className="w-4 text-center text-muted-foreground">{item.glyph}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="mt-auto border-t border-border p-3">
            <NetworkStatus />
          </div>
        </aside>

        <main className="min-h-screen flex-1">
          <TopBar />
          <div className="px-4 py-6 pb-24 sm:px-6 sm:py-8 md:px-10 md:pb-8">
            {children ?? <Outlet />}
          </div>
        </main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-border bg-background md:hidden">
        {NAV.map((item) => {
          const active = pathname === item.to || (item.to !== "/app" && pathname.startsWith(item.to));
          return (
            <Link
              key={item.to}
              to={item.to}
              className={
                "flex flex-1 flex-col items-center gap-0.5 py-2.5 font-mono text-[9px] transition-colors " +
                (active ? "text-foreground" : "text-muted-foreground")
              }
            >
              <span className="text-base leading-none">{item.glyph}</span>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function TopBar() {
  return (
    <div className="flex h-14 items-center justify-between border-b border-border bg-background px-4 sm:px-6 md:px-10">
      <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground">~/</Link>
        <span className="hidden sm:inline">infernode</span>
      </div>
      <div className="flex items-center gap-2">
        <ConnectWallet />
      </div>
    </div>
  );
}
