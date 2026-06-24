import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import type { WalletContextState } from "@solana/wallet-adapter-react";
import { SOLANA_RPC_URL, TREASURY_WALLET } from "./solana-config";

export interface PaymentResult {
  signature: string;
}

/**
 * Sends a real SOL transfer from the connected wallet to the protocol
 * treasury and waits for confirmation. This is the v1 escrow-funding path
 * (a custom on-chain escrow program can replace the treasury destination
 * once it is deployed and audited).
 */
export async function payForJob(
  wallet: WalletContextState,
  lamports: number,
): Promise<PaymentResult> {
  if (!wallet.publicKey || !wallet.sendTransaction) {
    throw new Error("Wallet not connected");
  }
  if (!TREASURY_WALLET) {
    throw new Error(
      "Treasury wallet is not configured (VITE_TREASURY_WALLET). Payment cannot proceed.",
    );
  }

  const connection = new Connection(SOLANA_RPC_URL, "confirmed");
  const treasury = new PublicKey(TREASURY_WALLET);

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash("confirmed");

  const tx = new Transaction({
    feePayer: wallet.publicKey,
    blockhash,
    lastValidBlockHeight,
  }).add(
    SystemProgram.transfer({
      fromPubkey: wallet.publicKey,
      toPubkey: treasury,
      lamports,
    }),
  );

  const signature = await wallet.sendTransaction(tx, connection);
  const confirmation = await connection.confirmTransaction(
    { signature, blockhash, lastValidBlockHeight },
    "confirmed",
  );
  if (confirmation.value.err) {
    throw new Error("Transaction failed to confirm on-chain");
  }
  return { signature };
}
