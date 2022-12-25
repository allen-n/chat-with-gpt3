import React, { useRef, useState, useEffect } from "react";
import { trpc } from "../utils/trpc";
// import speech, { SpeechClient } from "@google-cloud/speech";

export const AudioInput = (): JSX.Element => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [lastAudioStream, setLastAudioStream] = useState<string | null>(null);

  const playerRef = useRef<HTMLAudioElement>(null);
  const text = trpc.tts.speechToText.useQuery({ audio: lastAudioStream });

  // const [client, setClient] = useState<SpeechClient>(new speech.SpeechClient());

  const recordingTimeSlice = 1000;
  const audioBitRate = 16000;
  const clientConfig = {
    encoding: "WEBM_OPUS" as any,
    sampleRateHertz: audioBitRate,
    languageCode: "en-US",
  };

  const handleMicButtonClick = () => {
    if (isRecording) {
      stopRecoding();
      setIsRecording(false);
    } else {
      record();
      setIsRecording(true);
    }
  };

  const record = () => {
    navigator.mediaDevices
      .getUserMedia({ audio: true, video: false })
      .then((stream) => {
        setStream(stream);
        const options = {
          mimeType: "audio/webm",
          audioBitsPerSecond: audioBitRate,
        };
        const mediaRecorder = new MediaRecorder(stream, options);

        mediaRecorder.ondataavailable = (e) => {
          let chunks = audioChunks;
          chunks.push(e.data);
          console.log(`Pushed ${e.data.size} bytes of audio data.`);
          setAudioChunks(chunks);

          var reader = new FileReader();
          reader.readAsDataURL(e.data);
          reader.onloadend = () => {
            var base64data = reader.result;
            console.log("base64data", base64data);
            setLastAudioStream(base64data?.toString() || null);
          };

          console.log(audioChunks);
          const request = {
            audio: { content: e.data },
            config: clientConfig,
          };

          // client
          //   .recognize(request)
          //   .then((data) => {})
          //   .catch((err) => {});

          //   // Detects speech in the audio file
          // const [response] = await client.recognize(request);
          // const transcription = response.results
          //   .map(result => result.alternatives[0].transcript)
          //   .join('\n');
          // console.log(`Transcription: ${transcription}`);
        };

        mediaRecorder.onstop = (e) => {
          var blob = new Blob(audioChunks, {
            type: "audio/ogg; codecs=opus",
          });
          var blobURL = window.URL.createObjectURL(blob);
          const size = audioChunks.reduce((acc, chunk) => acc + chunk.size, 0);
          console.log(`Audio size: ${size / 1000}kb`);
          setAudioChunks([]);
          if (playerRef.current) playerRef.current.src = blobURL;
        };

        mediaRecorder.start(recordingTimeSlice);
        setMediaRecorder(mediaRecorder);
      });
  };

  const stopRecoding = () => {
    try {
      mediaRecorder?.stop();
      stream?.getTracks().forEach((track: MediaStreamTrack) => {
        track.stop();
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <div
        id="recodingBtn"
        className="w-fit-content m-4 flex h-12 cursor-pointer rounded-full border-0 border-red-100 bg-gray-200 p-2 align-middle transition duration-700 ease-in-out active:border-4 active:border-red-400"
      >
        <button
          className="bg-gray flex border border-solid text-red-500"
          onClick={handleMicButtonClick}
        >
          Record
        </button>
      </div>
      <audio ref={playerRef} id="player" controls></audio>
    </div>
  );
};
