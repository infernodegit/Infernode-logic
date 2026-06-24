import { and, desc, eq, ne, sql } from "drizzle-orm";
import crypto from "node:crypto";
import { Connection } from "@solana/web3.js";
import { db } from "../db";
import { jobs, providerCapabilities, providers, users } from "../db/schema";
import { computePrice, estimateTokensFromText, TASK_TYPES } from "../lib/pricing";
import { SERVER_SOLANA_RPC_URL, TREASURY_WALLET } from "../lib/solana-config";

const JOB_TTL_MS = 1000 * 60 * 30;

/**
 * Verifies that a Solana transaction really paid the protocol treasury for a
 * job. This is the authoritative check — the client signature alone is never
 * trusted. We confirm the tx exists, succeeded, was signed by the buyer, and
 * moved at least `minLamports` from the buyer to the configured treasury.
 */
async function verifyTreasuryPayment(opts: {
  signature: string;
  buyerWallet: string;
  minLamports: number;
}): Promise<void> {
  if (!TREASURY_WALLET) {
    throw new Error("Treasury wallet is not configured (VITE_TREASURY_WALLET)");
  }
  const connection = new Connection(SERVER_SOLANA_RPC_URL, "confirmed");
  const tx = await connection.getParsedTransaction(opts.signature, {
    commitment: "confirmed",
    maxSupportedTransactionVersion: 0,
  });
  if (!tx) throw new Error("Transaction not found on-chain");
  if (tx.meta?.err) throw new Error("Transaction failed on-chain");

  const signers = tx.transaction.message.accountKeys
    .filter((k) => k.signer)
    .map((k) => k.pubkey.toBase58());
  if (!signers.includes(opts.buyerWallet)) {
    throw new Error("Transaction was not signed by the job buyer");
  }

  let transferred = 0;
  for (const ix of tx.transaction.message.instructions) {
    if (
      "parsed" in ix &&
      ix.program === "system" &&
      (ix.parsed as any)?.type === "transfer"
    ) {
      const info = (ix.parsed as any).info;
      if (
        info.source === opts.buyerWallet &&
        info.destination === TREASURY_WALLET
      ) {
        transferred += Number(info.lamports);
      }
    }
  }
  if (transferred < opts.minLamports) {
    throw new Error(
      `Payment of ${transferred} lamports is less than the required ${opts.minLamports}`,
    );
  }
}

export function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function generateApiKey(): string {
  return "infq_" + crypto.randomBytes(24).toString("hex");
}

export async function getOrCreateUser(walletAddress: string) {
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.walletAddress, walletAddress))
    .limit(1);
  if (existing[0]) return existing[0];
  const inserted = await db
    .insert(users)
    .values({ walletAddress })
    .onConflictDoNothing()
    .returning();
  if (inserted[0]) return inserted[0];
  const again = await db
    .select()
    .from(users)
    .where(eq(users.walletAddress, walletAddress))
    .limit(1);
  return again[0];
}

export interface CreateJobInput {
  walletAddress: string;
  taskType: string;
  modelName: string;
  input: string;
}

export async function createJobRecord(data: CreateJobInput) {
  if (!TASK_TYPES.includes(data.taskType as never)) {
    throw new Error(`Unsupported task type: ${data.taskType}`);
  }
  if (!data.input.trim()) throw new Error("Input cannot be empty");
  const user = await getOrCreateUser(data.walletAddress);
  const estimatedTokens = estimateTokensFromText(data.input);
  const price = computePrice(estimatedTokens);
  const expiresAt = new Date(Date.now() + JOB_TTL_MS);
  const [job] = await db
    .insert(jobs)
    .values({
      buyerId: user.id,
      taskType: data.taskType,
      modelName: data.modelName,
      inputJson: { prompt: data.input },
      status: "PENDING_PAYMENT",
      priceLamports: price.totalLamports,
      protocolFeeLamports: price.protocolFeeLamports,
      estimatedTokens,
      expiresAt,
    })
    .returning();
  return job;
}

export async function confirmJobPayment(jobId: string, txSignature: string) {
  const [row] = await db
    .select({ job: jobs, walletAddress: users.walletAddress })
    .from(jobs)
    .innerJoin(users, eq(jobs.buyerId, users.id))
    .where(eq(jobs.id, jobId))
    .limit(1);
  if (!row) throw new Error("Job not found");
  const { job, walletAddress } = row;
  if (job.status !== "PENDING_PAYMENT") return job;

  // Reject a signature that has already been credited to a different job.
  const [reused] = await db
    .select({ id: jobs.id })
    .from(jobs)
    .where(and(eq(jobs.txSignature, txSignature), ne(jobs.id, jobId)))
    .limit(1);
  if (reused) {
    throw new Error("This transaction has already been used for another job");
  }

  // Authoritative on-chain check — never trust the client's claim alone.
  await verifyTreasuryPayment({
    signature: txSignature,
    buyerWallet: walletAddress,
    minLamports: job.priceLamports,
  });

  // Atomic transition: only succeeds if the job is still awaiting payment.
  const [updated] = await db
    .update(jobs)
    .set({ status: "QUEUED", txSignature })
    .where(and(eq(jobs.id, jobId), eq(jobs.status, "PENDING_PAYMENT")))
    .returning();
  return updated ?? job;
}

export async function listJobsByWallet(walletAddress: string) {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.walletAddress, walletAddress))
    .limit(1);
  if (!user[0]) return [];
  return db
    .select()
    .from(jobs)
    .where(eq(jobs.buyerId, user[0].id))
    .orderBy(desc(jobs.createdAt))
    .limit(100);
}

export async function getJobById(jobId: string) {
  const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
  return job ?? null;
}

export interface RegisterProviderInput {
  walletAddress: string;
  name: string;
  endpointUrl?: string;
  apiMode: string;
  models: { taskType: string; modelName: string }[];
  stakeLamports?: number;
  stakeTxSignature?: string;
}

export async function registerProviderRecord(data: RegisterProviderInput) {
  if (!data.name.trim()) throw new Error("Provider name is required");
  const user = await getOrCreateUser(data.walletAddress);
  const apiKey = generateApiKey();
  const apiKeyHash = sha256(apiKey);

  const existing = await db
    .select()
    .from(providers)
    .where(eq(providers.userId, user.id))
    .limit(1);

  let provider;
  if (existing[0]) {
    [provider] = await db
      .update(providers)
      .set({
        name: data.name,
        endpointUrl: data.endpointUrl ?? null,
        apiMode: data.apiMode,
        publicKey: data.walletAddress,
        apiKeyHash,
        stakeLamports: data.stakeLamports ?? existing[0].stakeLamports,
        stakeTxSignature: data.stakeTxSignature ?? existing[0].stakeTxSignature,
        isActive: true,
      })
      .where(eq(providers.id, existing[0].id))
      .returning();
    await db
      .delete(providerCapabilities)
      .where(eq(providerCapabilities.providerId, provider.id));
  } else {
    [provider] = await db
      .insert(providers)
      .values({
        userId: user.id,
        name: data.name,
        endpointUrl: data.endpointUrl ?? null,
        apiMode: data.apiMode,
        publicKey: data.walletAddress,
        apiKeyHash,
        stakeLamports: data.stakeLamports ?? 0,
        stakeTxSignature: data.stakeTxSignature ?? null,
      })
      .returning();
    await db
      .update(users)
      .set({ role: "PROVIDER" })
      .where(eq(users.id, user.id));
  }

  if (data.models.length) {
    await db.insert(providerCapabilities).values(
      data.models.map((m) => ({
        providerId: provider.id,
        taskType: m.taskType,
        modelName: m.modelName,
      })),
    );
  }

  return { provider, apiKey };
}

export async function listProvidersWithStats() {
  const rows = await db
    .select()
    .from(providers)
    .orderBy(desc(providers.successCount))
    .limit(100);
  const caps = await db.select().from(providerCapabilities);
  return rows.map((p) => ({
    ...p,
    capabilities: caps.filter((c) => c.providerId === p.id),
  }));
}

export async function getNetworkStats() {
  const [providerAgg] = await db
    .select({
      activeProviders: sql<number>`count(*) filter (where ${providers.isActive})`,
      totalStake: sql<number>`coalesce(sum(${providers.stakeLamports}), 0)`,
    })
    .from(providers);
  const [jobAgg] = await db
    .select({
      totalJobs: sql<number>`count(*)`,
      completedJobs: sql<number>`count(*) filter (where ${jobs.status} in ('COMPLETED','PAID_OUT'))`,
      paidOut: sql<number>`coalesce(sum(${jobs.priceLamports}) filter (where ${jobs.status} in ('COMPLETED','PAID_OUT')), 0)`,
    })
    .from(jobs);
  return {
    activeProviders: Number(providerAgg?.activeProviders ?? 0),
    totalStakeLamports: Number(providerAgg?.totalStake ?? 0),
    totalJobs: Number(jobAgg?.totalJobs ?? 0),
    completedJobs: Number(jobAgg?.completedJobs ?? 0),
    paidOutLamports: Number(jobAgg?.paidOut ?? 0),
  };
}

export async function getBuyerStats(walletAddress: string) {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.walletAddress, walletAddress))
    .limit(1);
  if (!user[0]) {
    return { totalJobs: 0, spentLamports: 0, completedJobs: 0, successRate: 0 };
  }
  const [agg] = await db
    .select({
      totalJobs: sql<number>`count(*)`,
      spent: sql<number>`coalesce(sum(${jobs.priceLamports}) filter (where ${jobs.status} <> 'PENDING_PAYMENT'), 0)`,
      completed: sql<number>`count(*) filter (where ${jobs.status} in ('COMPLETED','PAID_OUT'))`,
      failed: sql<number>`count(*) filter (where ${jobs.status} = 'FAILED')`,
    })
    .from(jobs)
    .where(eq(jobs.buyerId, user[0].id));
  const totalJobs = Number(agg?.totalJobs ?? 0);
  const completed = Number(agg?.completed ?? 0);
  const failed = Number(agg?.failed ?? 0);
  const finished = completed + failed;
  return {
    totalJobs,
    spentLamports: Number(agg?.spent ?? 0),
    completedJobs: completed,
    successRate: finished ? Math.round((completed / finished) * 100) : 0,
  };
}

export async function authProviderByKey(apiKey: string) {
  if (!apiKey) return null;
  const hash = sha256(apiKey);
  const [provider] = await db
    .select()
    .from(providers)
    .where(eq(providers.apiKeyHash, hash))
    .limit(1);
  return provider ?? null;
}

export async function claimNextJob(providerId: string) {
  const caps = await db
    .select()
    .from(providerCapabilities)
    .where(eq(providerCapabilities.providerId, providerId));
  if (!caps.length) return null;
  // Match both the task type AND the specific model the provider supports, so a
  // worker is never assigned a job it cannot actually run.
  const pairs = sql.join(
    caps.map((c) => sql`(${c.taskType}, ${c.modelName})`),
    sql`, `,
  );

  const claimed = await db.execute(sql`
    UPDATE jobs SET status = 'ASSIGNED', provider_id = ${providerId}, accepted_at = now()
    WHERE id = (
      SELECT id FROM jobs
      WHERE status = 'QUEUED' AND (task_type, model_name) IN (${pairs})
      ORDER BY created_at ASC
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    )
    RETURNING *;
  `);
  const row = (claimed.rows as any[])[0];
  return row ?? null;
}

export async function submitJobResult(
  providerId: string,
  jobId: string,
  output: string,
  failed = false,
) {
  const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
  if (!job) throw new Error("Job not found");
  if (job.providerId !== providerId) throw new Error("Job not assigned to you");
  if (job.status !== "ASSIGNED" && job.status !== "RUNNING") {
    throw new Error(`Job is not in a submittable state (status: ${job.status})`);
  }

  if (failed) {
    const [updated] = await db
      .update(jobs)
      .set({ status: "FAILED", error: output, completedAt: new Date() })
      .where(eq(jobs.id, jobId))
      .returning();
    await db
      .update(providers)
      .set({ failureCount: sql`${providers.failureCount} + 1` })
      .where(eq(providers.id, providerId));
    return updated;
  }

  const resultHash = sha256(output);
  const [updated] = await db
    .update(jobs)
    .set({
      status: "COMPLETED",
      outputJson: { text: output },
      resultHash,
      completedAt: new Date(),
    })
    .where(eq(jobs.id, jobId))
    .returning();
  await db
    .update(providers)
    .set({ successCount: sql`${providers.successCount} + 1` })
    .where(eq(providers.id, providerId));
  return updated;
}

export async function markRunning(providerId: string, jobId: string) {
  await db
    .update(jobs)
    .set({ status: "RUNNING" })
    .where(and(eq(jobs.id, jobId), eq(jobs.providerId, providerId)));
}
