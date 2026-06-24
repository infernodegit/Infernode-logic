import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  confirmJobPayment,
  createJobRecord,
  getBuyerStats,
  getJobById,
  getNetworkStats,
  getOrCreateUser,
  listJobsByWallet,
  listProvidersWithStats,
  registerProviderRecord,
} from "../server/core";
import { TASK_TYPES } from "./pricing";

const walletSchema = z
  .string()
  .min(32)
  .max(64)
  .regex(/^[1-9A-HJ-NP-Za-km-z]+$/, "Invalid Solana address");

export const ensureUser = createServerFn({ method: "POST" })
  .inputValidator(z.object({ walletAddress: walletSchema }))
  .handler(async ({ data }) => {
    const user = await getOrCreateUser(data.walletAddress);
    return { id: user.id, role: user.role };
  });

export const createJob = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      walletAddress: walletSchema,
      taskType: z.enum(TASK_TYPES),
      modelName: z.string().min(1).max(120),
      input: z.string().min(1).max(50000),
    }),
  )
  .handler(async ({ data }) => createJobRecord(data));

export const confirmPayment = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({ jobId: z.string().uuid(), txSignature: z.string().min(32) }),
  )
  .handler(async ({ data }) => confirmJobPayment(data.jobId, data.txSignature));

export const listJobs = createServerFn({ method: "GET" })
  .inputValidator(z.object({ walletAddress: walletSchema }))
  .handler(async ({ data }) => listJobsByWallet(data.walletAddress));

export const getJob = createServerFn({ method: "GET" })
  .inputValidator(z.object({ jobId: z.string().uuid() }))
  .handler(async ({ data }) => getJobById(data.jobId));

export const buyerStats = createServerFn({ method: "GET" })
  .inputValidator(z.object({ walletAddress: walletSchema }))
  .handler(async ({ data }) => getBuyerStats(data.walletAddress));

export const registerProvider = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      walletAddress: walletSchema,
      name: z.string().min(1).max(80),
      endpointUrl: z.string().url().optional().or(z.literal("").transform(() => undefined)),
      apiMode: z.enum(["OLLAMA", "OPENAI_COMPATIBLE", "CUSTOM"]),
      models: z
        .array(z.object({ taskType: z.enum(TASK_TYPES), modelName: z.string().min(1) }))
        .min(1),
      stakeLamports: z.number().int().nonnegative().optional(),
      stakeTxSignature: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { provider, apiKey } = await registerProviderRecord(data);
    return { providerId: provider.id, apiKey, name: provider.name };
  });

export const listProviders = createServerFn({ method: "GET" }).handler(
  async () => listProvidersWithStats(),
);

export const networkStats = createServerFn({ method: "GET" }).handler(
  async () => getNetworkStats(),
);

