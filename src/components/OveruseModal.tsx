import Image from "next/image";
/**
 * Component source: https://tailwindcomponents.com/component/testimonial-card
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
    <div className="my-20 max-w-md rounded-lg bg-white py-4 px-8 shadow-lg">
      <div className="-mt-16 flex justify-center md:justify-end">
        <Image
          className="h-20 w-20 rounded-full border-2 border-indigo-500 object-cover"
          src="/android-chrome-512x512.png"
          width={512}
          height={512}
          alt="avatar"
        />
      </div>
      <div>
        <h2 className="text-3xl font-semibold text-gray-800">
          You're a power user!
        </h2>
        <p className="mt-2 text-gray-600">
          Hey! You seem to be liking this a lot - you used{" "}
          <span className="text-bold text-indigo-500">${useAmount}</span> of API
          Access! Ask{" "}
          <a
            className="text-indigo-500"
            href="mailto:allennikka+chat-with-gpt3@gmail.com?subject=I%20(might%20want)%20the%20pro%20version%20of%20chat-with-gpt3"
            target="_blank"
            rel="noopener"
          >
            @allen
          </a>{" "}
          for a pro subscription so you can keep using this without bankrupting
          him 🙏
        </p>
      </div>
      <div className="mt-4 flex justify-end">
        <a
          target="_blank"
          rel="noopener"
          href="https://twitter.com/nikka_allen"
          className="text-xl font-medium text-indigo-500"
        >
          -Allen
        </a>
      </div>
    </div>
  );

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
          for a pro subscription so you can keep using this without bankrupting
          him 🙏
        </h1>
        <h2 className="grid-row"></h2>
      </div>
    </div>
  </div>;
};
