import { signIn, signOut, useSession } from "next-auth/react";

import { trpc } from "../utils/trpc";

export const SignIn: React.FC = () => {
  const { data: sessionData } = useSession();

  const { data: secretMessage } = trpc.auth.getSecretMessage.useQuery(
    undefined, // no input
    { enabled: sessionData?.user !== undefined }
  );

  return (
    // <div className="flex flex-col items-center justify-center gap-4">
    <div className="text-s text-align-center flex-col items-center justify-center">
      <button
        className="rounded-full bg-white/10 px-5 py-1 font-semibold text-white no-underline transition hover:animate-bottom-bounce hover:bg-white/20"
        onClick={sessionData ? () => signOut() : () => signIn()}
      >
        {sessionData ? "Sign out" : "Sign in"}
      </button>
      <p className="text-center text-xs text-white">
        {sessionData && <span>Logged in as {sessionData.user?.name}</span>}
        {secretMessage && <span> - {secretMessage}</span>}
      </p>
    </div>
  );
};
