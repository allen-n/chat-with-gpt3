import { useSession } from "next-auth/react";
import { AudioInput } from "../components/AudioInput";
import { SignIn } from "./SignIn";
import { OveruseModal } from "./OveruseModal";

import { trpc } from "../utils/trpc";

export const HomeScreen = (): JSX.Element => {
  const hello = trpc.example.hello.useQuery({ text: " complete!" });
  const { status: sessionStatus, data: sessionData } = useSession();
  const subscriptionStatus = trpc.billing.getSubscription.useQuery(undefined, {
    enabled: sessionData?.user !== undefined,
    staleTime: 600000, // 10m in ms
    cacheTime: 600000, // 10m in ms
  });
  const apiUsage = trpc.billing.getUsage.useQuery(
    {
      // TODO @allen-n: consider adding date filters on the FE
      req: {},
    },
    {
      enabled: sessionData?.user !== undefined,
      staleTime: 3600000 * 2, // 2 hours in ms
      cacheTime: 3600000 * 2, // 2 hours in ms
    }
  );

  const shouldDisplayOveruseModal = (): boolean => {
    // TODO @allen-n: Make the limit higher than 10c ?

    if (apiUsage.data?.totalBillable && apiUsage.data?.totalBillable > 0.1) {
      if (subscriptionStatus.data?.isSubscribed) {
        return false;
      } else {
        return true;
      }
    }
    return false;
  };

  const isLoggedIn = (status: string): boolean => {
    return status === "authenticated";
  };

  return (
    <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
      <div className="absolute right-5 top-5">
        <SignIn />
      </div>
      <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
        Chat <span className="text-[hsl(280,100%,70%)]">With</span> GPT3
      </h1>
      {shouldDisplayOveruseModal() && (
        <OveruseModal usageAmount={apiUsage.data?.totalBillable || 0} />
      )}
      {!shouldDisplayOveruseModal() && (
        <>
          <div
            id="full-w-div"
            className="flex w-full max-w-3xl flex-col gap-y-4"
          >
            <div
              className="flex  flex-col gap-4 rounded-xl bg-white/10 p-4
      text-white hover:bg-white/20"
            >
              <h3 className="text-center text-2xl font-bold">
                Start talking 💬
              </h3>
              <div className="text-center text-lg">
                Press record ( 🎤 ) to start talking, stop talking for 2
                seconds, and let the machine do the rest.
              </div>
            </div>
            <div className="text-md w-full justify-self-center rounded-xl bg-white/10 p-3 text-center text-white">
              {isLoggedIn(sessionStatus) ? (
                <AudioInput />
              ) : (
                "Sorry, you need to sign in to use this 👆"
              )}
            </div>
          </div>

          <div className="flex flex-col items-center gap-2">
            {/* <p className="text-2xl text-white">
        {hello.data ? hello.data.greeting : ""}
      </p> */}
          </div>
        </>
      )}
    </div>
  );
};
