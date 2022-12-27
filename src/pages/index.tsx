import { type NextPage } from "next";
import Head from "next/head";
import { Toaster } from "react-hot-toast";
import { HomeScreen } from "../components/HomeScreen";

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>Chat With 🤖</title>
        <meta
          name="description"
          content="Chat with your friendly neighborhood AI"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
        <HomeScreen />
        <Toaster position="bottom-left" />
      </main>
    </>
  );
};

export default Home;
