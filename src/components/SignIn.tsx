import { signIn, signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { ApiUsage } from "./ApiUsage";
import { trpc } from "../utils/trpc";
import { useDetectClickOutside } from "react-detect-click-outside";

export const SignIn: React.FC = () => {
  const { data: sessionData } = useSession();
  const [shouldBeOpen, setShouldBeOpen] = useState<boolean>(false);
  const { data: secretMessage } = trpc.auth.getSecretMessage.useQuery(
    undefined, // no input
    { enabled: sessionData?.user !== undefined }
  );

  const settingsButtonString =
    sessionData?.user === undefined ? "🔑 Sign In" : "⚙️ Settings";
  const ref = useDetectClickOutside({
    onTriggered: (e: Event) => {
      if ((e.target as HTMLElement).innerHTML !== settingsButtonString) {
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
            onClick={sessionData ? () => signOut() : () => signIn()}
          >
            {sessionData ? "Sign out" : "Sign in"}
          </button>
          <button
            className="rounded-md bg-white/10 p-1  font-semibold text-white no-underline transition hover:animate-bottom-bounce hover:bg-white/20"
            onClick={() => {
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
            console.log("OPENING", shouldBeOpen);
          }}
        >
          {settingsButtonString}
        </button>
      )}
    </div>
  );
};
