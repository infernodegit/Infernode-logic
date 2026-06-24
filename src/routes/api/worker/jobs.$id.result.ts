import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/worker/jobs/$id/result")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const { authProviderByKey, submitJobResult } = await import(
          "../../../server/core"
        );
        const key = request.headers.get("x-provider-key") ?? "";
        const provider = await authProviderByKey(key);
        if (!provider) return new Response("Unauthorized", { status: 401 });

        let body: { output?: string; failed?: boolean };
        try {
          body = await request.json();
        } catch {
          return new Response("Invalid JSON body", { status: 400 });
        }
        if (typeof body.output !== "string") {
          return new Response("Missing 'output' string", { status: 400 });
        }
        try {
          const updated = await submitJobResult(
            provider.id,
            params.id,
            body.output,
            Boolean(body.failed),
          );
          return Response.json({
            id: updated.id,
            status: updated.status,
            resultHash: updated.resultHash,
          });
        } catch (err) {
          return new Response(err instanceof Error ? err.message : "Error", {
            status: 400,
          });
        }
      },
    },
  },
});
