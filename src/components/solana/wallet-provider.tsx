import "../../lib/buffer-polyfill";
import { useMemo, type ReactNode } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { SOLANA_RPC_URL } from "../../lib/solana-config";

export function SolanaProviders({ children }: { children: ReactNode }) {
  const endpoint = SOLANA_RPC_URL;
  // Modern wallets (Phantom, Solflare, Backpack, ...) register through the
  // Wallet Standard and are auto-detected and merged in by WalletProvider, so
  // the explicit adapter list is intentionally empty. This also avoids the
  // @solana/wallet-adapter-wallets package, whose Ledger transitive deps fail
  // to build in this environment.
  const wallets = useMemo(() => [], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        {children}
      </WalletProvider>
    </ConnectionProvider>
  );
}
