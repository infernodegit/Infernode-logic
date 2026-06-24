import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/worker/me")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { authProviderByKey } = await import("../../../server/core");
        const key = request.headers.get("x-provider-key") ?? "";
        const provider = await authProviderByKey(key);
        if (!provider) {
          return new Response("Unauthorized", { status: 401 });
        }
        return Response.json({
          id: provider.id,
          name: provider.name,
          apiMode: provider.apiMode,
          endpointUrl: provider.endpointUrl,
          reputation: provider.reputation,
          successCount: provider.successCount,
          failureCount: provider.failureCount,
          isActive: provider.isActive,
        });
      },
    },
  },
});
