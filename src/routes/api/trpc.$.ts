import { createAPIFileRoute } from "@tanstack/react-start/api";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { trpcRouter } from "~/trpc/init/router";

function handler({ request }: { request: Request }) {
  return fetchRequestHandler({
    req: request,
    router: trpcRouter,
    endpoint: "/api/trpc",
    responseMeta({ type, errors }) {
      // Add CORS headers to allow cross-origin requests
      const headers: Record<string, string> = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, x-admin-password",
        "Access-Control-Max-Age": "86400",
      };

      // Handle preflight requests
      if (request.method === "OPTIONS") {
        return {
          status: 200,
          headers,
        };
      }

      // Add CORS headers to all responses
      return {
        headers,
      };
    },
  });
}

export const APIRoute = createAPIFileRoute("/api/trpc/$")({
  GET: handler,
  POST: handler,
  OPTIONS: handler,
});
