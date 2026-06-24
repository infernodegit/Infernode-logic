import {
  pgTable,
  uuid,
  text,
  integer,
  bigint,
  boolean,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  walletAddress: text("wallet_address").notNull().unique(),
  role: text("role").notNull().default("BUYER"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const providers = pgTable("providers", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  endpointUrl: text("endpoint_url"),
  apiMode: text("api_mode").notNull().default("OLLAMA"),
  publicKey: text("public_key").notNull(),
  apiKeyHash: text("api_key_hash").notNull(),
  stakeLamports: bigint("stake_lamports", { mode: "number" }).notNull().default(0),
  stakeTxSignature: text("stake_tx_signature"),
  reputation: integer("reputation").notNull().default(100),
  successCount: integer("success_count").notNull().default(0),
  failureCount: integer("failure_count").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const providerCapabilities = pgTable("provider_capabilities", {
  id: uuid("id").primaryKey().defaultRandom(),
  providerId: uuid("provider_id")
    .notNull()
    .references(() => providers.id, { onDelete: "cascade" }),
  taskType: text("task_type").notNull(),
  modelName: text("model_name").notNull(),
  pricePerKTokensLamports: bigint("price_per_ktokens_lamports", { mode: "number" })
    .notNull()
    .default(500000),
  maxInputTokens: integer("max_input_tokens").notNull().default(8192),
  maxOutputTokens: integer("max_output_tokens").notNull().default(2048),
});

export interface JobInput {
  prompt: string;
}

export interface JobOutput {
  text: string;
}

export const jobs = pgTable(
  "jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    buyerId: uuid("buyer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    providerId: uuid("provider_id").references(() => providers.id, {
      onDelete: "set null",
    }),
    taskType: text("task_type").notNull(),
    modelName: text("model_name").notNull(),
    inputJson: jsonb("input_json").$type<JobInput>().notNull(),
    outputJson: jsonb("output_json").$type<JobOutput>(),
    resultHash: text("result_hash"),
    status: text("status").notNull().default("PENDING_PAYMENT"),
    priceLamports: bigint("price_lamports", { mode: "number" }).notNull(),
    protocolFeeLamports: bigint("protocol_fee_lamports", { mode: "number" })
      .notNull()
      .default(0),
    estimatedTokens: integer("estimated_tokens").notNull().default(0),
    escrowPda: text("escrow_pda"),
    txSignature: text("tx_signature"),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
  },
  (table) => ({
    statusIdx: index("jobs_status_idx").on(table.status),
    buyerIdx: index("jobs_buyer_idx").on(table.buyerId),
    providerIdx: index("jobs_provider_idx").on(table.providerId),
  }),
);

export type User = typeof users.$inferSelect;
export type Provider = typeof providers.$inferSelect;
export type ProviderCapability = typeof providerCapabilities.$inferSelect;
export type Job = typeof jobs.$inferSelect;
