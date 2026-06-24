export const LAMPORTS_PER_SOL = 1_000_000_000;

export const BASE_FEE_LAMPORTS = 100_000;
export const PRICE_PER_KTOKENS_LAMPORTS = 500_000;
export const PROTOCOL_FEE_BPS = 500;

export const TASK_TYPES = [
  "TEXT_GENERATION",
  "SUMMARIZATION",
  "EMBEDDING",
  "CLASSIFICATION",
  "CODE_REVIEW",
] as const;

export type TaskType = (typeof TASK_TYPES)[number];

export function estimateTokensFromText(input: string): number {
  const inputTokens = Math.ceil(input.trim().length / 4);
  const outputTokens = Math.ceil(inputTokens * 0.5) + 64;
  return inputTokens + outputTokens;
}

export interface PriceBreakdown {
  estimatedTokens: number;
  baseFeeLamports: number;
  tokenCostLamports: number;
  subtotalLamports: number;
  protocolFeeLamports: number;
  totalLamports: number;
  providerPayoutLamports: number;
}

export function computePrice(estimatedTokens: number): PriceBreakdown {
  const tokenCostLamports = Math.ceil(
    (estimatedTokens / 1000) * PRICE_PER_KTOKENS_LAMPORTS,
  );
  const subtotalLamports = BASE_FEE_LAMPORTS + tokenCostLamports;
  const protocolFeeLamports = Math.ceil((subtotalLamports * PROTOCOL_FEE_BPS) / 10000);
  const totalLamports = subtotalLamports + protocolFeeLamports;
  return {
    estimatedTokens,
    baseFeeLamports: BASE_FEE_LAMPORTS,
    tokenCostLamports,
    subtotalLamports,
    protocolFeeLamports,
    totalLamports,
    providerPayoutLamports: subtotalLamports,
  };
}

export function lamportsToSol(lamports: number): number {
  return lamports / LAMPORTS_PER_SOL;
}

export function formatSol(lamports: number, digits = 5): string {
  return lamportsToSol(lamports).toFixed(digits);
}
