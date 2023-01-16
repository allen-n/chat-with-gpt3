import { useRef, useEffect } from "react";
import { ConversationRow, type ConversationRowProps } from "./ConversationRow";

export const ConversationContainer = (
  conversationRows: Array<ConversationRowProps>
): JSX.Element => {
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [containerRef, conversationRows]);
  console.log("conversationRows inner update", conversationRows);
  return (
    <div className="container relative flex w-full flex-col items-center justify-center gap-12 px-2 py-2">
      <div
        className="flex max-h-[50vh] w-full snap-y snap-proximity  flex-col gap-0 overflow-y-scroll rounded-xl bg-white/10 p-4
      text-white"
        ref={containerRef}
      >
        {conversationRows &&
          conversationRows.map((conversationRow, idx): JSX.Element => {
            // This compound key will force a re-render when any of the props change
            const key =
              idx +
              (conversationRow.incomingUserText || "") +
              (conversationRow.incomingBotText || "") +
              (conversationRow.incomingUserTextComplete || false);
            return (
              <div key={idx} className="snap-center snap-always">
                <ConversationRow {...conversationRow} key={key} />
              </div>
            );
          })}
      </div>
    </div>
  );
};
