import { type NextPage } from "next";
import Script from "next/script";
import { useState, useRef } from "react";
import Head from "next/head";
import { Toaster } from "react-hot-toast";
import { HomeScreen } from "../components/HomeScreen";
import stringhash from "string-hash";
import { trpc } from "../utils/trpc";

const Home: NextPage = () => {
  const [password, setPassword] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const passwordSuccess = trpc.auth.checkPassword.useQuery({ text: password });

  const PasswordInput = (): JSX.Element => {
    return (
      <div className="input">
        <input
          placeholder="Password Please 🙏 "
          type="text"
          className="text-input"
          ref={inputRef}
        />
        <button
          onClick={() => {
            setPassword(stringhash(inputRef.current?.value || "").toString());
          }}
        >
          Submit
        </button>
      </div>
    );
  };

  return (
    <>
      <Head>
        <title>Chat With 🤖</title>
        <meta
          name="description"
          content="Chat with your friendly neighborhood AI"
        />
        <link rel="icon" href="/favicon.ico" />
        <Script src="https://rsms.me/inter/inter.css" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
        {!passwordSuccess.data?.passwordValid && <PasswordInput />}
        {passwordSuccess.data?.passwordValid && <HomeScreen />}
        <Toaster position="bottom-left" />
      </main>
    </>
  );
};

export default Home;
