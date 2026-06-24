import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import logoUrl from "../assets/logo-b64";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SolanaProviders } from "../components/solana/wallet-provider";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center font-mono">
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Error 404</div>
        <h1 className="mt-4 text-5xl font-semibold text-foreground">Route not found</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          The endpoint you requested is not registered in the routing table.
        </p>
        <a
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-elevated"
        >
          ← Return home
        </a>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-destructive">Runtime error</div>
        <h1 className="mt-4 text-xl font-semibold tracking-tight text-foreground">
          Something failed to load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The page crashed unexpectedly. Try again or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
          >
            Retry
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-elevated"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "InferNode — Solana AI Compute Marketplace" },
      {
        name: "description",
        content:
          "Buy AI inference jobs paid in SOL. Independent providers earn by running models on idle GPUs and API endpoints.",
      },
      { property: "og:title", content: "InferNode — Solana AI Compute Marketplace" },
      {
        property: "og:description",
        content:
          "Buy AI inference jobs paid in SOL. Independent providers earn by running models on idle GPUs and API endpoints.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "InferNode — Solana AI Compute Marketplace" },
      { name: "description", content: "InferNode is a Solana-powered marketplace for AI inference compute." },
      { property: "og:description", content: "InferNode is a Solana-powered marketplace for AI inference compute." },
      { name: "twitter:description", content: "InferNode is a Solana-powered marketplace for AI inference compute." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/20eadc2a-9040-4a1e-ba4a-d8fabdd29eb9/id-preview-d6a25bd6--77617343-e489-4e14-8dda-b0077465526e.lovable.app-1782212578147.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/20eadc2a-9040-4a1e-ba4a-d8fabdd29eb9/id-preview-d6a25bd6--77617343-e489-4e14-8dda-b0077465526e.lovable.app-1782212578147.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: logoUrl, type: "image/png" },
      { rel: "apple-touch-icon", href: logoUrl },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <SolanaProviders>
        <Outlet />
      </SolanaProviders>
    </QueryClientProvider>
  );
}
