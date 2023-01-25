import { signIn, signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { ApiUsage } from "./ApiUsage";
import { trpc } from "../utils/trpc";
import { useDetectClickOutside } from "react-detect-click-outside";
import { posthog } from "posthog-js";

export const SignIn: React.FC = () => {
  const { data: sessionData } = useSession();
  const [shouldBeOpen, setShouldBeOpen] = useState<boolean>(false);
  const { data: secretMessage } = trpc.auth.getSecretMessage.useQuery(
    undefined, // no input
    { enabled: sessionData?.user !== undefined }
  );

  const settingsButtonString =
    sessionData?.user === undefined ? "👋 Get Started!" : "⚙️ Settings";
  const ref = useDetectClickOutside({
    onTriggered: (e: Event) => {
      if ((e.target as HTMLElement).innerHTML !== settingsButtonString) {
        posthog.capture("User Settings Closed", { closeType: "Click Outside" });
        setShouldBeOpen(false);
      }
    },
  });
  return (
    // <div className="flex flex-col items-center justify-center gap-4">
    <div className="text-s w-xs z-50" ref={ref}>
      {shouldBeOpen ? (
        <div className="grid gap-1 rounded-md bg-white/5 p-2">
          <p className="text-center  text-white">
            {sessionData && <span>Logged in as {sessionData.user?.name}</span>}
            {secretMessage && <span> - {secretMessage}</span>}
          </p>
          <ApiUsage />
          <button
            className="rounded-md bg-white/10 p-1  font-semibold text-white no-underline transition hover:animate-bottom-bounce hover:bg-white/20"
            onClick={
              sessionData
                ? () => {
                    posthog.capture("User Signed Out");
                    return signOut();
                  }
                : () => {
                    posthog.capture("User Signed In");
                    return signIn();
                  }
            }
          >
            {sessionData ? "Sign out" : "Sign in"}
          </button>
          <button
            className="rounded-md bg-white/10 p-1  font-semibold text-white no-underline transition hover:animate-bottom-bounce hover:bg-white/20"
            onClick={() => {
              posthog.capture("User Settings Closed", {
                closeType: "Button Clicked",
              });
              setShouldBeOpen(false);
            }}
          >
            Close
          </button>
        </div>
      ) : (
        <button
          className="rounded-md bg-white/10 p-1 px-2  font-semibold text-white no-underline transition hover:animate-bottom-bounce hover:bg-white/20"
          onClick={() => {
            setShouldBeOpen(true);
            posthog.capture("User Settings Opened");
          }}
        >
          {settingsButtonString}
        </button>
      )}
    </div>
  );
};
