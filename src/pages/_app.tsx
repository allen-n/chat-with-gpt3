import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { type AppType } from "next/app";
import { useRouter } from "next/router";
import posthog from "posthog-js";
import { useEffect } from "react";

import { trpc } from "../utils/trpc";

import "../styles/globals.css";

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  const router = useRouter();

  useEffect(() => {
    // Init PostHog
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY || "", {
      api_host: "https://app.posthog.com",
      enable_recording_console_log: true,
      loaded: (posthog) => {
        // TODO @allen-n: turn off local capture
        // if (process.env.NODE_ENV === "development") posthog.opt_out_capturing();
        if (session?.user?.id) {
          posthog.identify(session?.user?.id, {
            email: session?.user?.email,
            name: session?.user?.name,
          });
        }
      },
    });

    // Track page views
    const handleRouteChange = () => posthog.capture("$pageview");
    router.events.on("routeChangeComplete", handleRouteChange);

    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, []);

  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
    </SessionProvider>
  );
};

export default trpc.withTRPC(MyApp);
