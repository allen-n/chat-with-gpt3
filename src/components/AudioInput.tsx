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

  const handleClearButtonClick = () => {
    setTextToSpeechResponse("");
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
          console.debug(`Pushed ${e.data.size} bytes of audio data.`);

          // // TODO allen: check the buffers to decide when  to send transcription requests
          // e.data.arrayBuffer().then((buffer) => {
          //   console.log("buffer", buffer);
          // });
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
  const btnStyle = `rounded-full mx-1 bg-white/10 px-10 py-3 font-semibold text-${
    isRecording ? "red-300" : "white"
  } no-underline transition hover:bg-white/20`;

  const audioPlayerStyle = `my-2 h-10 w-[100%] ${
    textToSpeechResponse ? "" : "hidden"
  }`;

  return (
    <div className="items-left flex flex-col justify-center">
      <div id="recodingBtn" className="py-1 text-center">
        <div className="hidden text-red-300" />
        <button className={btnStyle} onClick={handleMicButtonClick}>
          Record
        </button>
        {textToSpeechResponse && (
          <button className={btnStyle} onClick={handleClearButtonClick}>
            Clear
          </button>
        )}
      </div>

      <div className="my-2 text-xl">
        <p className="pb-2">{textToSpeechResponse && "You Asked:"}</p>
        <p className="pb-5">{textToSpeechResponse}</p>
        <p className="pb-2">
          {textToSpeechResponse && "And GPT3 Said ... 👇 "}
        </p>
      </div>
      <div className="hidden"></div>
      <audio
        ref={playerRef}
        id="player"
        controls
        className={audioPlayerStyle}
      ></audio>
    </div>
  );
};
