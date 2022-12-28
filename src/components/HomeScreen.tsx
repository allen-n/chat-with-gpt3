import Link from "next/link";
import { useSession } from "next-auth/react";
import { AudioInput } from "../components/AudioInput";
import { SignIn } from "./SignIn";
import { trpc } from "../utils/trpc";

export const HomeScreen = (): JSX.Element => {
  const hello = trpc.example.hello.useQuery({ text: " complete!" });
  const { status: sessionStatus } = useSession();

  const isLoggedIn = (status: string): boolean => {
    return status === "authenticated";
  };

  return (
    <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
      <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
        Chat <span className="text-[hsl(280,100%,70%)]">With</span> GPT3
      </h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
        <div
          className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4
        text-white hover:bg-white/20"
        >
          <h3 className="text-2xl font-bold">Start talking →</h3>
          <div className="text-lg">
            Press record to start talking, press again when you stop, and let
            the machine do the rest.
          </div>
        </div>
        <div
          className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4
        text-white hover:bg-white/20"
        >
          <div>
            {isLoggedIn(sessionStatus) ? (
              <AudioInput />
            ) : (
              "Sorry, you need to sign in for this 👇"
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-2">
        <p className="text-2xl text-white">
          {hello.data ? hello.data.greeting : ""}
        </p>
        <SignIn />
      </div>
    </div>
  );
};
