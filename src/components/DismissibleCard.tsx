import { ReactElement, useState } from "react";

export type DismissibleCardProps = {
  title: ReactElement;
  body: ReactElement;
  tooltip?: string;
  dismissible: boolean;
};
export const DismissibleCard = (props: DismissibleCardProps): JSX.Element => {
  const [visible, setVisible] = useState(true);

  const removeElement = () => {
    setVisible((prev) => !prev);
  };

  return (
    <button
      title={props.tooltip}
      disabled={!props.dismissible}
      onClick={removeElement}
    >
      {visible && (
        <div className="flex  flex-col gap-4 rounded-xl bg-white/10 p-4 text-white hover:bg-white/20">
          <h3 className="text-center text-2xl font-bold">{props.title}</h3>
          <div className="text-center text-lg">{props.body}</div>
        </div>
      )}
    </button>
  );
};
