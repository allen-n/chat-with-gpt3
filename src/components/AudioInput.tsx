import React, { useRef, useState } from "react";
import toast from "react-hot-toast";

import { getBaseUrl } from "../utils/trpc";
import {
  type SpeechToTextRequest,
  type SpeechToTextResponse,
} from "../pages/api/tts";
import { blobToBase64, base64ToBlob } from "../utils/encoding";

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

          e.data.arrayBuffer().then((buffer) => {
            console.log("buffer", buffer); // TODO allen: check the buffers to decide when  to send transcription requests
          });
          setAudioChunks(chunks);
        };

        mediaRecorder.onstop = (e) => {
          var blob = new Blob(audioChunks, {
            type: "audio/ogg; codecs=opus",
          });
          blobToBase64(blob).then((blobString) => {
            const req: SpeechToTextRequest = {
              b64FileString: blobString,
              index: 0,
            };
            fetch(getBaseUrl() + "/api/tts", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(req),
            })
              .then((res) => {
                res.json().then((resJSON) => {
                  const resp = resJSON as SpeechToTextResponse;
                  if (typeof resp.error !== "undefined") {
                    toast.error(resp.error);
                    console.log("Missing resp.textModelResp", resp);
                  } else if (typeof resp.textModelResp.error !== "undefined") {
                    toast.error(
                      `Sorry, ${resp.textModelResp.error}. Give us ~${
                        resp.textModelResp.estimated_time || "a few "
                      }s to fix it.`
                    );
                  } else {
                    toast.success("Success!");
                    console.log("Response: ", resp);
                    const buff = resp.speechModelResp;
                    if (typeof buff !== "undefined") {
                      const blob = base64ToBlob(buff);
                      var blobURL = window.URL.createObjectURL(blob);
                      if (playerRef.current) {
                        playerRef.current.src = blobURL;
                      } else {
                        console.error("No audio player ref. :(");
                      }
                    } else {
                      console.error("No speech model response. :(");
                    }

                    setTextToSpeechResponse(resp.textModelResp.text);
                  }
                });
              })
              .catch((err) => {
                toast.error("Error: " + err);
              });
          });

          // var blobURL = window.URL.createObjectURL(blob);
          // if (playerRef.current) playerRef.current.src = blobURL;
          const size = audioChunks.reduce((acc, chunk) => acc + chunk.size, 0);
          console.log(`Audio size: ${size / 1000}kb`);
          setAudioChunks([]);
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
