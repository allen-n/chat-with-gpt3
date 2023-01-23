import { type NextPage } from "next";
import Script from "next/script";
import { useSession } from "next-auth/react";
import { useState, useRef } from "react";
import Head from "next/head";
import { Toaster, toast } from "react-hot-toast";
import { HomeScreen } from "../components/HomeScreen";
import stringhash from "string-hash";
import { trpc } from "../utils/trpc";

const Home: NextPage = () => {
  const { status: sessionStatus } = useSession();

  const isLoggedIn = (status: string): boolean => {
    return status === "authenticated";
  };
  const [password, setPassword] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const passwordSuccess = trpc.auth.checkPassword.useQuery({ text: password });
  // TODO allen re-enable

  /**
   * Component source: https://tailwindcomponents.com/component/login-page-16
   * @returns JSX.Element
   */
  const PasswordInput = (): JSX.Element => {
    return (
      <div className="mx-auto my-36 flex h-auto w-[350px] flex-col rounded-md border-2 bg-white py-10 text-black shadow-xl">
        <div className="mx-8 mt-7 mb-1 flex flex-row justify-start space-x-2">
          <div className="h-7 w-3 bg-[#CC66FF]"></div>
          <div className=" text-center font-sans text-xl font-bold">
            <h1>
              Ask{" "}
              <a
                className="text-[#5007b9]"
                href="https://twitter.com/nikka_allen"
                target="_blank"
                rel="noopener"
              >
                @allen
              </a>{" "}
              for the code
            </h1>
          </div>
        </div>
        <div className="flex flex-col items-center">
          <form
            action="none"
            onSubmit={(e) => {
              e.preventDefault();
              setPassword(stringhash(inputRef.current?.value || "").toString());
            }}
          >
            <input
              className="my-2 w-72 border p-2"
              type="password"
              placeholder="Password Please 🙏"
              ref={inputRef}
            />
          </form>
        </div>
        <div className="my-2 flex justify-center">
          <button
            className="w-72 border bg-[#CC66FF] p-2 font-sans"
            onClick={() => {
              setPassword(stringhash(inputRef.current?.value || "").toString());
            }}
          >
            Login
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <Head>
        <title>Chat With 🤖</title>

        <meta property="og:title" content="Voice Chat with GPT-3" />
        <meta
          property="og:description"
          content="Chat with your friendly neighborhood AI, with just your voice!"
        />
        <meta
          property="og:image"
          content="https://xuhpdfsfmyeayusstakp.supabase.co/storage/v1/object/public/public-images/android-chrome-512x512.png"
        />

        <meta
          property="description"
          name="description"
          content="Chat with your friendly neighborhood AI, with just your voice!"
        />
        <meta
          property="twitter:card"
          name="twitter:card"
          content="summary"
        ></meta>
        <meta
          property="twitter:site"
          name="twitter:site"
          content="@nikka_allen"
        ></meta>
        <meta
          property="twitter:title"
          name="twitter:title"
          content="Voice Chat with GPT-3 🗣️ 🤖"
        ></meta>
        <meta
          property="twitter:description"
          name="twitter:description"
          content="Chat with your friendly neighborhood AI, with just your voice!"
        ></meta>
        <meta
          property="twitter:image"
          name="twitter:image"
          content="https://xuhpdfsfmyeayusstakp.supabase.co/storage/v1/object/public/public-images/android-chrome-512x512.png"
        ></meta>

        <link rel="icon" href="/favicon.ico" />
        <Script src="https://rsms.me/inter/inter.css" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center overflow-y-hidden bg-gradient-to-b from-[#2e026d] to-[#15162c]">
        {/* TODO allen fixme before pushing to prod - model loader works, maybe hide behind auth? */}
        {/* <HomeScreen /> */}
        {!passwordSuccess.data?.passwordValid && !isLoggedIn(sessionStatus) && (
          <PasswordInput />
        )}
        {(passwordSuccess.data?.passwordValid || isLoggedIn(sessionStatus)) && (
          <HomeScreen />
        )}
        <Toaster position="bottom-left" />
      </main>
    </>
  );
};

export default Home;
