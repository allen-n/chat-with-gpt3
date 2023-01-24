import { type NextPage } from "next";
import Script from "next/script";
import Head from "next/head";
import { Toaster } from "react-hot-toast";
import { HomeScreen } from "../components/HomeScreen";

const Home: NextPage = () => {
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
      <main className="relative z-0 flex min-h-screen flex-col items-center justify-center overflow-y-hidden bg-gradient-to-b from-[#2e026d] to-[#15162c]">
        <HomeScreen />
        <Toaster position="bottom-left" />
      </main>
    </>
  );
};

export default Home;
