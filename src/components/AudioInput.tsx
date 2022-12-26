import React, { useRef, useState } from "react";
import toast from "react-hot-toast";

import { getBaseUrl } from "../utils/trpc";
import {
  type SpeechToTextRequest,
  type SpeechToTextResponse,
} from "../pages/api/tts";
import { SpeechToTextQueryResp } from "../utils/tts";

export const AudioInput = (): JSX.Element => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [textToSpeechResponse, setTextToSpeechResponse] = useState<string>("");
  const [currentBuffer, setCurrentBuffer] = useState<string | null>(null);

  const playerRef = useRef<HTMLAudioElement>(null);

  const recordingTimeSlice = 2000;
  const audioBitRate = 16000;

  const blobToBase64 = (blob: Blob): Promise<string> => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    return new Promise((resolve) => {
      reader.onloadend = () => {
        const res = reader.result ? reader.result?.toString() : "";
        resolve(res);
      };
    });
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
          const req: SpeechToTextRequest = {
            file: e.data,
            index: chunks.length - 1,
          };
          e.data.arrayBuffer().then((buffer) => {
            console.log("buffer", buffer);
          });

          // fetch(getBaseUrl() + "/api/tts", {
          //   method: "POST",
          //   headers: {
          //     "Content-Type": "audio/webm",
          //   },
          //   body: e.data,
          // }).then((res) => {
          //   console.log("res", res);
          // });
          setAudioChunks(chunks);
        };

        mediaRecorder.onstop = (e) => {
          var blob = new Blob(audioChunks, {
            type: "audio/ogg; codecs=opus",
          });
          const b64 = blobToBase64(blob).then((blobString) => {
            // console.log("blobString", blobString);
            const req = {
              file: blobString,
              index: 0,
            };
            fetch(getBaseUrl() + "/api/tts", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(req),
            }).then((res) => {
              res.json().then((resJSON) => console.log("resJson", resJSON));
            });
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
