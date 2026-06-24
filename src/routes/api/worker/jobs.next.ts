import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/worker/jobs/next")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { authProviderByKey, claimNextJob, markRunning } = await import(
          "../../../server/core"
        );
        const key = request.headers.get("x-provider-key") ?? "";
        const provider = await authProviderByKey(key);
        if (!provider) return new Response("Unauthorized", { status: 401 });
        if (!provider.isActive) {
          return Response.json({ job: null, reason: "provider_inactive" });
        }
        const job = await claimNextJob(provider.id);
        if (!job) return Response.json({ job: null });
        await markRunning(provider.id, job.id);
        return Response.json({
          job: {
            id: job.id,
            taskType: job.task_type,
            modelName: job.model_name,
            input: job.input_json,
            estimatedTokens: job.estimated_tokens,
          },
        });
      },
    },
  },
});
