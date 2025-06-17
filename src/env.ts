import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "production", "test"]),
    NGROK_DOMAIN: z.string(),
  },

  client: {
    // custom boolean logic. more info: https://env.t3.gg/docs/recipes
    VITE_ERUDA_ENABLED: z.string().transform((s) => s !== "false" && s !== "0"),
  },

  clientPrefix: "VITE_",
  runtimeEnv: typeof window === "undefined" ? process.env : import.meta.env,
  emptyStringAsUndefined: true,
});
