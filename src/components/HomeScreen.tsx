import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { AudioInput } from "../components/AudioInput";
import { SignIn } from "./SignIn";
import { ConversationRow, ConversationRowProps } from "./ConversationRow";
import { ConversationContainer } from "./ConversationContainer";

import { trpc } from "../utils/trpc";

export const HomeScreen = (): JSX.Element => {
  const hello = trpc.example.hello.useQuery({ text: " complete!" });
  const { status: sessionStatus } = useSession();

  const isLoggedIn = (status: string): boolean => {
    return status === "authenticated";
  };

  const [currentUserText, setCurrentUserText] = useState<string>("");
  const [currentBotText, setCurrentBotText] = useState<string>("");
  const [conversationRows, setConversationRows] = useState<
    Array<ConversationRowProps>
  >([{}]);
  const [userTextComplete, setUserTextComplete] = useState<boolean>(false);

  useEffect(() => {
    let rows: ConversationRowProps[] = [];
    for (let index = 0; index < 6; index++) {
      rows.push({
        incomingUserText: currentUserText,
        incomingBotText: currentBotText,
        incomingUserTextComplete: userTextComplete,
      });
    }
    setConversationRows(rows);
  }, [currentBotText, currentUserText]);

  return (
    <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
      <div className="fixed right-5 top-5">
        <SignIn />
      </div>

      <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
        Chat <span className="text-[hsl(280,100%,70%)]">With</span> GPT3
      </h1>
      <div id="full-w-div" className="flex w-full max-w-3xl flex-col gap-y-4">
        <div
          className="flex  flex-col gap-4 rounded-xl bg-white/10 p-4
        text-white hover:bg-white/20"
        >
          <h3 className="text-center text-2xl font-bold">Start talking 💬</h3>
          <div className="text-center text-lg">
            Press record ( 🎤 ) to start talking, stop talking for 2 seconds,
            and let the machine do the rest.
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
    </div>
  );
};
