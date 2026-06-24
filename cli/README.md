# InferNode Worker CLI

Polls the InferNode marketplace for inference jobs, runs them against your own
model endpoint (Ollama or any OpenAI-compatible server), and submits the
results. Single file, **no dependencies** — just Node 18+ or Bun.

## Install

```bash
# Run directly
node cli/infernode.mjs --help

# Or install globally as `infernode`
chmod +x cli/infernode.mjs
ln -s "$(pwd)/cli/infernode.mjs" /usr/local/bin/infernode
infernode --help
```

## Quick start

```bash
# 1. Register on the Providers page in the web app, copy the API key it shows.
infernode provider login --key infq_xxxxx --server https://your-domain.com

# 2. Point the worker at your inference backend
#    Ollama (local):
infernode provider set-endpoint --url http://localhost:11434 --mode ollama --model llama3.1:8b
#    OpenAI-compatible:
infernode provider set-endpoint --url https://api.openai.com --mode openai \
  --inference-key sk-xxxx --model gpt-4o-mini

# 3. Verify
infernode provider status     # marketplace view of your provider
infernode worker test         # one sample inference against your endpoint

# 4. Run
infernode worker start --interval 3
```

## Commands

| Command | Description |
|---|---|
| `provider login --key <k> [--server <url>]` | Save your API key + marketplace URL. |
| `provider set-endpoint --url <u> --mode <ollama\|openai> [--inference-key <k>] [--model <m>]` | Configure the inference backend. |
| `provider status` | Show provider status from the marketplace (`GET /api/worker/me`). |
| `worker test [--model <m>]` | Run one inference to confirm the endpoint works. |
| `worker start [--interval <s>]` | Poll → run → submit loop until ctrl-c. |

## How it works

- `worker start` POSTs `/api/worker/jobs/next` with header `x-provider-key`.
- A claimed job returns `{ id, taskType, modelName, input, estimatedTokens }`.
- The CLI builds a task-appropriate prompt, calls your endpoint, and POSTs the
  output to `/api/worker/jobs/<id>/result`. Failures are reported with
  `{ failed: true }` so the marketplace can reassign or mark the job failed.

Config lives in `~/.infernode/config.json` (chmod 600). The marketplace API key
and any inference key are stored locally only.
