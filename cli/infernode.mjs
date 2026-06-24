#!/usr/bin/env node
// InferNode worker CLI — polls the marketplace for jobs, runs inference on a
// local/remote model endpoint (Ollama or OpenAI-compatible), and submits results.
// No external dependencies — uses Node's global fetch (Node 18+) / Bun.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const CONFIG_DIR = path.join(os.homedir(), ".infernode");
const CONFIG_PATH = path.join(CONFIG_DIR, "config.json");

const C = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
};
const ok = (s) => console.log(`${C.green}✓${C.reset} ${s}`);
const info = (s) => console.log(`${C.dim}→${C.reset} ${s}`);
const warn = (s) => console.log(`${C.yellow}!${C.reset} ${s}`);
const err = (s) => console.error(`${C.red}✗${C.reset} ${s}`);

function loadConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
  } catch {
    return {};
  }
}

function saveConfig(cfg) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
  fs.chmodSync(CONFIG_PATH, 0o600);
}

function parseFlags(args) {
  const flags = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].slice(2);
      const next = args[i + 1];
      if (next && !next.startsWith("--")) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    }
  }
  return flags;
}

function requireConfig(cfg, keys) {
  const missing = keys.filter((k) => !cfg[k]);
  if (missing.length) {
    err(`Missing config: ${missing.join(", ")}. Run setup commands first.`);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Marketplace API
// ---------------------------------------------------------------------------

async function api(cfg, method, route, body) {
  const url = cfg.server.replace(/\/$/, "") + route;
  const res = await fetch(url, {
    method,
    headers: {
      "x-provider-key": cfg.apiKey,
      ...(body ? { "content-type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) throw new Error("Unauthorized — check your API key (infernode provider login).");
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Bad response from ${route}: ${text.slice(0, 200)}`);
  }
  if (!res.ok) throw new Error(json?.message || text || `HTTP ${res.status}`);
  return json;
}

// ---------------------------------------------------------------------------
// Inference
// ---------------------------------------------------------------------------

function buildPrompt(taskType, prompt) {
  switch (taskType) {
    case "SUMMARIZATION":
      return `Summarize the following text concisely:\n\n${prompt}`;
    case "CLASSIFICATION":
      return `Classify the following input. Respond with a single label and a confidence score (0-1):\n\n${prompt}`;
    case "CODE_REVIEW":
      return `Review the following code. List bugs, security issues, and concrete improvements:\n\n${prompt}`;
    default:
      return prompt;
  }
}

async function runInference(cfg, job) {
  const prompt = job.input?.prompt ?? "";
  const model = cfg.defaultModel || job.modelName;
  const endpoint = cfg.endpointUrl.replace(/\/$/, "");
  const isEmbedding = job.taskType === "EMBEDDING";

  if (cfg.mode === "OLLAMA") {
    if (isEmbedding) {
      const r = await fetch(`${endpoint}/api/embeddings`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ model, prompt }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || `Ollama error ${r.status}`);
      return JSON.stringify(j.embedding);
    }
    const r = await fetch(`${endpoint}/api/generate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ model, prompt: buildPrompt(job.taskType, prompt), stream: false }),
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j?.error || `Ollama error ${r.status}`);
    return j.response ?? "";
  }

  // OPENAI_COMPATIBLE (and CUSTOM treated as OpenAI shape)
  const authHeader = cfg.inferenceKey ? { authorization: `Bearer ${cfg.inferenceKey}` } : {};
  if (isEmbedding) {
    const r = await fetch(`${endpoint}/v1/embeddings`, {
      method: "POST",
      headers: { "content-type": "application/json", ...authHeader },
      body: JSON.stringify({ model, input: prompt }),
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j?.error?.message || `Endpoint error ${r.status}`);
    return JSON.stringify(j.data?.[0]?.embedding ?? []);
  }
  const r = await fetch(`${endpoint}/v1/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", ...authHeader },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: buildPrompt(job.taskType, prompt) }],
    }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j?.error?.message || `Endpoint error ${r.status}`);
  return j.choices?.[0]?.message?.content ?? "";
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

function cmdLogin(flags) {
  const cfg = loadConfig();
  if (!flags.key) {
    err("Provide your provider API key: infernode provider login --key infq_... [--server <url>]");
    process.exit(1);
  }
  cfg.apiKey = String(flags.key);
  cfg.server = String(flags.server || cfg.server || process.env.INFERNODE_SERVER || "http://localhost:5000");
  saveConfig(cfg);
  ok(`Saved API key for ${cfg.server}`);
}

function cmdSetEndpoint(flags) {
  const cfg = loadConfig();
  if (!flags.url || !flags.mode) {
    err("Usage: infernode provider set-endpoint --url <url> --mode <ollama|openai> [--inference-key <k>] [--model <name>]");
    process.exit(1);
  }
  const mode = String(flags.mode).toUpperCase();
  cfg.endpointUrl = String(flags.url);
  cfg.mode = mode === "OLLAMA" ? "OLLAMA" : mode === "OPENAI" || mode === "OPENAI_COMPATIBLE" ? "OPENAI_COMPATIBLE" : "CUSTOM";
  if (flags["inference-key"]) cfg.inferenceKey = String(flags["inference-key"]);
  if (flags.model) cfg.defaultModel = String(flags.model);
  saveConfig(cfg);
  ok(`Endpoint set: ${cfg.endpointUrl} (${cfg.mode})`);
}

async function cmdStatus() {
  const cfg = loadConfig();
  requireConfig(cfg, ["apiKey", "server"]);
  const me = await api(cfg, "GET", "/api/worker/me");
  console.log(`${C.bold}${me.name}${C.reset}  ${me.isActive ? C.green + "ACTIVE" : C.yellow + "INACTIVE"}${C.reset}`);
  info(`mode: ${me.apiMode}  endpoint: ${me.endpointUrl ?? "—"}`);
  info(`reputation: ${me.reputation}  done: ${me.successCount}  failed: ${me.failureCount}`);
}

async function cmdTest() {
  const cfg = loadConfig();
  requireConfig(cfg, ["endpointUrl", "mode"]);
  info(`Testing ${cfg.mode} endpoint at ${cfg.endpointUrl}…`);
  const out = await runInference(cfg, {
    taskType: "TEXT_GENERATION",
    modelName: cfg.defaultModel || "llama3.1:8b",
    input: { prompt: "Reply with the single word: pong" },
  });
  ok(`Inference OK. Sample output: ${C.dim}${out.slice(0, 120)}${C.reset}`);
}

async function cmdWorkerStart(flags) {
  const cfg = loadConfig();
  requireConfig(cfg, ["apiKey", "server", "endpointUrl", "mode"]);
  const interval = Math.max(1, Number(flags.interval) || 3) * 1000;

  const me = await api(cfg, "GET", "/api/worker/me");
  ok(`Authenticated as ${me.name}. Polling ${cfg.server} every ${interval / 1000}s.`);
  info("Press ctrl-c to stop.");

  let running = true;
  process.on("SIGINT", () => {
    running = false;
    console.log("\nStopping…");
    process.exit(0);
  });

  while (running) {
    try {
      const { job, reason } = await api(cfg, "POST", "/api/worker/jobs/next");
      if (reason === "provider_inactive") {
        warn("Provider is inactive on the marketplace. Re-register to activate.");
        await sleep(interval * 3);
        continue;
      }
      if (!job) {
        await sleep(interval);
        continue;
      }
      info(`Claimed job ${job.id.slice(0, 8)} · ${job.taskType} · ${job.modelName}`);
      try {
        const output = await runInference(cfg, job);
        const res = await api(cfg, "POST", `/api/worker/jobs/${job.id}/result`, { output });
        ok(`Submitted ${job.id.slice(0, 8)} → ${res.status}`);
      } catch (e) {
        err(`Job ${job.id.slice(0, 8)} failed: ${e.message}`);
        await api(cfg, "POST", `/api/worker/jobs/${job.id}/result`, {
          output: e.message,
          failed: true,
        }).catch(() => {});
      }
    } catch (e) {
      err(e.message);
      await sleep(interval * 2);
    }
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function printHelp() {
  console.log(`${C.bold}InferNode worker CLI${C.reset}

${C.bold}Provider setup${C.reset}
  infernode provider login --key <API_KEY> [--server <url>]
      Save the API key shown when you register on the Providers page.
  infernode provider set-endpoint --url <url> --mode <ollama|openai> [--inference-key <k>] [--model <name>]
      Point the worker at your inference backend.
  infernode provider status
      Show your provider status from the marketplace.

${C.bold}Worker${C.reset}
  infernode worker test [--model <name>]
      Run one sample inference against your endpoint.
  infernode worker start [--interval <seconds>]
      Poll for jobs, run inference, and submit results (loops until ctrl-c).

Config is stored in ${CONFIG_PATH} (chmod 600).`);
}

// ---------------------------------------------------------------------------
// Dispatch
// ---------------------------------------------------------------------------

async function main() {
  const [, , group, action, ...rest] = process.argv;
  const flags = parseFlags(rest);

  try {
    if (group === "provider" && action === "login") return cmdLogin(flags);
    if (group === "provider" && action === "set-endpoint") return cmdSetEndpoint(flags);
    if (group === "provider" && action === "status") return await cmdStatus();
    if (group === "worker" && action === "test") return await cmdTest();
    if (group === "worker" && action === "start") return await cmdWorkerStart(flags);
    printHelp();
  } catch (e) {
    err(e instanceof Error ? e.message : String(e));
    process.exit(1);
  }
}

main();
