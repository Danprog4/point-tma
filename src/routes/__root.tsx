import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import {
  backButton,
  init,
  mockTelegramEnv,
  requestFullscreen,
  swipeBehavior,
  viewport,
} from "@telegram-apps/sdk";
import { TRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { useEffect } from "react";
import { Toaster } from "sonner";
import { AuthProvider } from "~/components/AuthProvider";
import { Navbar } from "~/components/Navbar";
import appCss from "~/lib/styles/app.css?url";
import { loadYMapsScript } from "~/lib/ymaps";
import { useTRPC } from "~/trpc/init/react";
import { TRPCRouter } from "~/trpc/init/router";

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
  trpc: TRPCOptionsProxy<TRPCRouter>;
}>()({
  ssr: false,
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, maximum-scale=1",
      },
      {
        title: "React TanStarter",
      },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
    scripts: [
      {
        src: `https://api-maps.yandex.ru/v3/?apikey=${import.meta.env.VITE_YANDEX_MAPS_API_KEY}&lang=ru_RU`,
        async: true,
      },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  useEffect(() => {
    try {
      console.log("🗺️ Root: calling loadYMapsScript()");
      loadYMapsScript();
      const existing = document.getElementById(
        "ymaps3-script",
      ) as HTMLScriptElement | null;
      console.log("🗺️ Root: script in DOM after call?", {
        exists: !!existing,
        src: existing?.src,
      });
      const allYandexScripts = Array.from(
        document.querySelectorAll('script[src*="api-maps.yandex.ru"]'),
      ) as HTMLScriptElement[];
      console.log(
        "🗺️ Root: yandex scripts in DOM",
        allYandexScripts.map((s) => ({ id: s.id, src: s.src })),
      );
    } catch (e) {
      console.error("🗺️ Root: loadYMapsScript error", e);
    }
    const themeParams = {
      accent_text_color: "#6ab2f2",
      bg_color: "#17212b",
      button_color: "#5288c1",
      button_text_color: "#ffffff",
      destructive_text_color: "#ec3942",
      header_bg_color: "#17212b",
      hint_color: "#708499",
      link_color: "#6ab3f3",
      secondary_bg_color: "#232e3c",
      section_bg_color: "#17212b",
      section_header_text_color: "#6ab3f3",
      subtitle_text_color: "#708499",
      text_color: "#f5f5f5",
    } as const;

    if (import.meta.env.DEV) {
      mockTelegramEnv({
        launchParams: {
          tgWebAppPlatform: "web",
          tgWebAppVersion: "8.0.0",
          tgWebAppData: import.meta.env.VITE_MOCK_INIT_DATA,
          tgWebAppThemeParams: themeParams,
          tgWebAppStartParam: "ref=3",
        },
      });
    }

    init();

    backButton.mount();

    if (swipeBehavior.mount.isAvailable()) {
      swipeBehavior.mount();
      swipeBehavior.isMounted();
      swipeBehavior.disableVertical();
      swipeBehavior.isVerticalEnabled();
    }

    if (viewport.expand.isAvailable()) {
      viewport.expand();
    }

    // if (viewport.expand.isAvailable()) {
    //   viewport.expand();
    // }

    if (requestFullscreen.isAvailable()) {
      requestFullscreen();
    }

    viewport.mount().then(() => viewport.requestFullscreen());

    // dev-only debugging can be enabled with ENV if needed
  }, []);

  return (
    <RootDocument>
      <AuthProvider>
        <div>
          <Outlet />
        </div>
        <Navbar />
      </AuthProvider>
    </RootDocument>
  );
}

const isDev = import.meta.env.DEV;
const isErudaEnabled = import.meta.env.VITE_ERUDA_ENABLED === "true";

function RootDocument({ children }: { readonly children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  useEffect(() => {
    if (isDev) {
      import("eruda").then((eruda) => {
        eruda.default.init();
      });
    }
  }, []);

  return (
    // suppress since we're updating the "dark" class in a custom script below
    <html suppressHydrationWarning>
      <head>
        <HeadContent />
        <script
          src={`https://api-maps.yandex.ru/v3/?apikey=${import.meta.env.VITE_YANDEX_MAPS_API_KEY}&lang=ru_RU`}
        ></script>
      </head>
      <body>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              backgroundColor: "#9924FF",
              color: "#fff",
              borderRadius: "16px",
              border: "1px solid white",
              marginTop: "96px",
            },
          }}
        />
        <Scripts />
      </body>
    </html>
  );
}
