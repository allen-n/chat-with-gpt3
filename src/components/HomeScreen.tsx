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
      <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
        Chat <span className="text-[hsl(280,100%,70%)]">With</span> GPT3
      </h1>
      <div id="test-div" className="grid gap-y-4 sm:grid-cols-1 md:grid-cols-2">
        <div>
          <ConversationContainer conversationRows={conversationRows} />
        </div>

        <div className="flex flex-col">
          <ConversationRow
            incomingUserText={currentUserText}
            incomingBotText={currentBotText}
            incomingUserTextComplete={userTextComplete}
          />
          <div className="container relative flex flex-col items-center justify-center gap-2 px-2 py-1 ">
            <AudioInput />
          </div>
          <div className="grid h-10 w-full grid-cols-2 gap-y-4 p-4 text-white">
            <p className="">User text</p>
            <input
              className="w-full rounded-md bg-white/20 text-center text-white  hover:bg-white/10"
              title="userTextInput"
              placeholder="Type test text"
              type="text"
              autoFocus
              onChange={(e) => {
                setCurrentUserText(e.target.value);
                if (e.target.value.charAt(e.target.value.length - 1) === "!") {
                  setUserTextComplete(true);
                } else {
                  setUserTextComplete(false);
                }
              }}
            ></input>
            <p className="">Bot text</p>
            <input
              className="w-full rounded-md bg-white/20 text-center text-white  hover:bg-white/10"
              title="userTextInput"
              placeholder="Type test text"
              type="text"
              autoFocus
              onChange={(e) => {
                setCurrentBotText(e.target.value);
              }}
            ></input>
          </div>
        </div>
      </div>

      {/* Real components */}
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
