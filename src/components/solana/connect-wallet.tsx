import { useEffect, useRef, useState, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import type { WalletName } from "@solana/wallet-adapter-base";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import { explorerAddressUrl } from "../../lib/solana-config";

function shorten(address: string): string {
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

export function ConnectWallet({ compact = false }: { compact?: boolean }) {
  const { wallets, select, connect, disconnect, connecting, connected, publicKey, wallet } =
    useWallet();
  const { connection } = useConnection();
  const [open, setOpen] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const address = publicKey?.toBase58() ?? null;

  useEffect(() => {
    let active = true;
    if (!publicKey) {
      setBalance(null);
      return;
    }
    connection
      .getBalance(publicKey)
      .then((lamports) => {
        if (active) setBalance(lamports / LAMPORTS_PER_SOL);
      })
      .catch(() => {
        if (active) setBalance(null);
      });
    return () => {
      active = false;
    };
  }, [publicKey, connection]);

  const pick = useCallback(
    async (name: WalletName) => {
      select(name);
      setOpen(false);
      try {
        // autoConnect handles most cases; connect() covers the rest.
        await connect();
      } catch {
        /* user rejected or wallet handles its own flow */
      }
    },
    [select, connect],
  );

  const available = wallets.filter(
    (w) =>
      w.readyState === WalletReadyState.Installed ||
      w.readyState === WalletReadyState.Loadable,
  );

  if (connected && address) {
    return (
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-1.5 font-mono text-xs text-foreground transition-colors hover:bg-surface-elevated"
        >
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-success align-middle" />
          {wallet?.adapter.icon && (
            <img src={wallet.adapter.icon} alt="" className="h-3.5 w-3.5" />
          )}
          <span>{shorten(address)}</span>
          {balance !== null && !compact && (
            <span className="text-muted-foreground">{balance.toFixed(3)} SOL</span>
          )}
        </button>
        {open && (
          <div className="absolute right-0 z-50 mt-2 w-56 rounded-md border border-border bg-surface p-1 shadow-lg">
            <div className="px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {wallet?.adapter.name}
            </div>
            <div className="px-3 pb-2 font-mono text-xs text-foreground break-all">
              {address}
            </div>
            {balance !== null && (
              <div className="px-3 pb-2 font-mono text-xs text-muted-foreground">
                Balance: {balance.toFixed(4)} SOL
              </div>
            )}
            <div className="my-1 border-t border-border" />
            <button
              onClick={() => {
                navigator.clipboard?.writeText(address);
                setOpen(false);
              }}
              className="block w-full rounded px-3 py-2 text-left font-mono text-xs text-foreground hover:bg-surface-elevated"
            >
              Copy address
            </button>
            <a
              href={explorerAddressUrl(address)}
              target="_blank"
              rel="noreferrer"
              className="block w-full rounded px-3 py-2 text-left font-mono text-xs text-foreground hover:bg-surface-elevated"
            >
              View on Explorer ↗
            </a>
            <button
              onClick={() => {
                disconnect();
                setOpen(false);
              }}
              className="block w-full rounded px-3 py-2 text-left font-mono text-xs text-destructive hover:bg-surface-elevated"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={connecting}
        className="flex items-center gap-2 rounded-md bg-foreground px-3 py-1.5 font-mono text-xs text-background transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-warning align-middle" />
        {connecting ? "Connecting…" : "Connect wallet"}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-60 rounded-md border border-border bg-surface p-1 shadow-lg">
          <div className="px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Select a wallet
          </div>
          {available.length === 0 ? (
            <div className="px-3 py-3 font-mono text-xs text-muted-foreground">
              No Solana wallet detected. Install{" "}
              <a
                href="https://phantom.app"
                target="_blank"
                rel="noreferrer"
                className="text-foreground underline"
              >
                Phantom
              </a>{" "}
              or{" "}
              <a
                href="https://solflare.com"
                target="_blank"
                rel="noreferrer"
                className="text-foreground underline"
              >
                Solflare
              </a>
              .
            </div>
          ) : (
            available.map((w) => (
              <button
                key={w.adapter.name}
                onClick={() => pick(w.adapter.name)}
                className="flex w-full items-center gap-3 rounded px-3 py-2 text-left font-mono text-xs text-foreground hover:bg-surface-elevated"
              >
                {w.adapter.icon && (
                  <img src={w.adapter.icon} alt="" className="h-4 w-4" />
                )}
                <span>{w.adapter.name}</span>
                {w.readyState === WalletReadyState.Installed && (
                  <span className="ml-auto text-[10px] text-success">Detected</span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
