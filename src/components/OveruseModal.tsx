/**
 * Component source: https://tailwindcomponents.com/component/login-page-16
 * @returns JSX.Element
 */
export type OveruseModalProps = {
  usageAmount: number | null;
};

export const OveruseModal = ({
  usageAmount,
}: OveruseModalProps): JSX.Element => {
  const useAmount = (usageAmount || 0).toPrecision(2);
  return (
    <div className="mx-auto my-36 flex h-auto w-[50%] flex-col rounded-md border-2 bg-white py-10 text-black shadow-xl">
      <div className="mx-8 mt-7 mb-1 flex flex-row justify-start space-x-2">
        <div className="h-7 w-3 bg-[#CC66FF]"></div>
        <div className=" grid grid-cols-1 text-center font-sans text-xl font-bold">
          <h1 className="grid-row">
            Hey! You seem to be liking this a lot - you used ${useAmount} of API
            Access! Ask{" "}
            <a
              className="text-[#5007b9]"
              href="mailto:allennikka@gmail.com?subject=I%20(might%20want)%20the%20pro%20version%20of%20chat-with-gpt3"
              target="_blank"
              rel="noopener"
            >
              @allen
            </a>{" "}
            for a pro subscription so you can keep using this without
            bankrupting him 🙏
          </h1>
          <h2 className="grid-row"></h2>
        </div>
      </div>
    </div>
  );
};
