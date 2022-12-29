import { useState } from "react";

export type ConversationRowProps = {
  incomingUserText?: string;
  incomingBotText?: string;
  incomingUserTextComplete?: boolean;
};

const LoadingSpinner = (): JSX.Element => {
  return (
    <>
      <svg
        className="mx-2 h-5 w-5 animate-spin text-white"
        viewBox="0 0 24 24"
        fill="none"
        xmlnsXlink="http://www.w3.org/2000/svg"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
    </>
  );
};

export const ConversationRow = ({
  incomingUserText,
  incomingBotText,
  incomingUserTextComplete = false,
}: ConversationRowProps): JSX.Element => {
  const placeholder = "Placeholder";
  const [currentWords, setCurrentWords] = useState<Array<string>>([
    placeholder,
  ]);

  return (
    <div className="container relative flex flex-col items-center justify-center gap-12 px-2 py-1 ">
      <div
        className="flex w-full flex-col gap-2 rounded-xl bg-white/10 p-4
      text-white"
      >
        <div className="flex justify-end">
          <div className="ml-8 w-fit max-w-xs rounded-md bg-[#1d2d99] py-1 px-2">
            {incomingUserText && incomingUserText}
            {!incomingUserText && <LoadingSpinner />}
          </div>
        </div>
        {incomingUserTextComplete && (
          <div className="flex flex-row items-center justify-start">
            <div className="ml-2 mr-8 w-fit max-w-xs rounded-md bg-[#198814] py-1 px-2">
              {incomingBotText && incomingBotText}
              {!incomingBotText && <LoadingSpinner />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
