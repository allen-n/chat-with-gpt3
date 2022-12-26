import React, { useRef, useState } from "react";
import toast from "react-hot-toast";

import { speechToTextQuery } from "../utils/tts";

export const AudioInput = (): JSX.Element => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [textToSpeechResponse, setTextToSpeechResponse] = useState<string>("");

  const playerRef = useRef<HTMLAudioElement>(null);

  const recordingTimeSlice = 2000;
  const audioBitRate = 16000;

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
          // convert text to audio realtime
          // speechToTextQuery(e.data)
          //   .then((res) => {
          //     setTextToSpeechResponse(textToSpeechResponse + " " + res.text);
          //   })
          //   .catch((err) => {
          //     toast.error(
          //       "Error while converting audio to text. Please try again in a sec!"
          //     );
          //     console.error(err);
          //   });
        };

        mediaRecorder.onstop = (e) => {
          var blob = new Blob(audioChunks, {
            type: "audio/ogg; codecs=opus",
          });
          // Convert audio to text after full audio
          speechToTextQuery(blob)
            .then((res) => {
              console.log("res", res);
              setTextToSpeechResponse(res.text);
            })
            .catch((err) => {
              toast.error(
                "Error while converting audio to text. Please try again in a sec!"
              );
              console.error(err);
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
      <div className="justify-center p-5 text-center align-middle text-xl text-white">
        <p>{textToSpeechResponse}</p>
      </div>
    </div>
  );
};
