function readEnv(key: string): string | undefined {
  const viteEnv =
    typeof import.meta !== "undefined" ? (import.meta as any).env : undefined;
  if (viteEnv && viteEnv[key]) return viteEnv[key] as string;
  if (typeof process !== "undefined" && process.env && process.env[key]) {
    return process.env[key];
  }
  return undefined;
}

export type SolanaCluster = "mainnet-beta" | "devnet" | "testnet";

export const SOLANA_CLUSTER: SolanaCluster =
  (readEnv("VITE_SOLANA_CLUSTER") as SolanaCluster) || "mainnet-beta";

const DEFAULT_RPC: Record<SolanaCluster, string> = {
  "mainnet-beta": "https://api.mainnet-beta.solana.com",
  devnet: "https://api.devnet.solana.com",
  testnet: "https://api.testnet.solana.com",
};

export const SOLANA_RPC_URL =
  readEnv("VITE_SOLANA_RPC_URL") || DEFAULT_RPC[SOLANA_CLUSTER];

/**
 * Server-only RPC endpoint. Prefers the non-`VITE_` `SOLANA_RPC_URL` secret so a
 * paid Helius/QuickNode key (often embedded in the URL) is NEVER bundled into
 * the client. Falls back to the public client URL. Used by on-chain payment
 * verification, which is the reliability-critical path.
 */
export const SERVER_SOLANA_RPC_URL =
  (typeof process !== "undefined" && process.env && process.env.SOLANA_RPC_URL) ||
  SOLANA_RPC_URL;

export const TREASURY_WALLET = readEnv("VITE_TREASURY_WALLET") || "";

export function explorerTxUrl(signature: string): string {
  const suffix =
    SOLANA_CLUSTER === "mainnet-beta" ? "" : `?cluster=${SOLANA_CLUSTER}`;
  return `https://explorer.solana.com/tx/${signature}${suffix}`;
}

export function explorerAddressUrl(address: string): string {
  const suffix =
    SOLANA_CLUSTER === "mainnet-beta" ? "" : `?cluster=${SOLANA_CLUSTER}`;
  return `https://explorer.solana.com/address/${address}${suffix}`;
}

