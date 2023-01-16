import React, { useRef, useState, useEffect } from "react";
import {
  ConversationContainer,
  type ConversationContainerProps,
} from "./ConversationContainer";
import { ConversationRowProps } from "./ConversationRow";
import toast from "react-hot-toast";

import { getBaseUrl } from "../utils/trpc";
import { trpc } from "../utils/trpc";
import {
  type SpeechToTextRequest,
  type SpeechToTextResponse,
} from "../pages/api/tts";
import { blobToBase64, base64ToBlob } from "../utils/encoding";

export const AudioInput = (): JSX.Element => {
  // Media state hooks
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [audioChunkString, setAudioChunkString] = useState<string>("");
  const [currentUserText, setCurrentUserText] = useState<string>("");

  // tRPC query hooks
  const userASR = trpc.speech.asr.useMutation({
    onError: (err) => toast.error(`"Error: ${err}`),
    onSuccess: (data) => {
      console.log("data", data);
      if (data.text) {
        setCurrentUserText(data.text);
        // setAudioChunkString(""); // Reset the current chunk to be converted
      }
      console.log("currentUserText", currentUserText);
    },
  });

  // const userASR = trpc.speech.asr.useMutation(
  //   {
  //     req: {
  //       returnType: "speechToText",
  //       index: audioChunks.length,
  //       b64FileString: audioChunkString,
  //     }
  //   },
  //   {
  //     enabled: audioChunkString !== "",
  //     onError: (err) => toast.error(`"Error: ${err}`),
  //     onSuccess: (data) => {
  //       console.log("data", data);
  //       if (data.text) {
  //         setCurrentUserText(data.text);
  //         // setAudioChunkString(""); // Reset the current chunk to be converted
  //       }
  //       console.log("currentUserText", currentUserText);
  //     },
  //   }
  // );

  // API Call state hooks
  const [textToSpeechResponse, setTextToSpeechResponse] = useState<string>("");
  const [fullResponse, setFullResponse] = useState<SpeechToTextResponse>();

  // UI State Hooks
  const [conversationRows, setConversationRows] =
    useState<ConversationContainerProps>();
  const [currentConversationRow, setCurrentConversationRow] =
    useState<ConversationRowProps>();

  // UI Effect hooks

  useEffect(() => {
    if (fullResponse) {
      console.log("FULL RESP: ", fullResponse);
      const convoRow: ConversationRowProps = {
        incomingUserText:
          fullResponse?.textModelResp.text || "Houston, we had a problem",
        incomingBotText:
          fullResponse?.llmTextResp || "Houston, we had a problem",
        incomingUserTextComplete: true,
      };
      if (conversationRows) {
        let rows = conversationRows.conversationRows;
        rows.push(convoRow);
        setConversationRows(conversationRows);
      } else {
        let rows: ConversationContainerProps = { conversationRows: [convoRow] };
        setConversationRows(rows);
      }
      setTextToSpeechResponse("");
    }
  }, [fullResponse]);

  useEffect(() => {
    if (isRecording) {
      const convoRow: ConversationRowProps = {
        incomingUserTextComplete: false,
      };
      if (conversationRows) {
        let rows = conversationRows.conversationRows;
        rows.push(convoRow);
        setConversationRows(conversationRows);
      } else {
        let rows: ConversationContainerProps = { conversationRows: [convoRow] };
        setConversationRows(rows);
      }
    }
  }, [isRecording]);

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
    setFullResponse(undefined);
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

        mediaRecorder.ondataavailable = async (e) => {
          let chunks = audioChunks;

          chunks.push(e.data);
          console.debug(`Pushed ${e.data.size} bytes of audio data.`);

          // TODO allen: check the buffers to decide when  to send transcription requests
          // e.data.arrayBuffer().then((buffer) => {
          //   const b = new Uint8Array(buffer);

          //   const len = b.length;
          //   let total = 0;
          //   let i = 0;
          //   let rms = 0;
          //   while (i < len) {
          //     total += Math.abs(b[i++] || 0);
          //   }
          //   rms = Math.sqrt(total / len);
          //   console.log("buffer rms = ", rms);
          // });
          const blob = new Blob(chunks, {
            type: "audio/ogg; codecs=opus",
          });
          const b64string = await blobToBase64(blob);
          setAudioChunkString(b64string);
          setAudioChunks(chunks);

          const test = userASR.mutate({
            req: {
              returnType: "speechToText",
              index: b64string.length,
              b64FileString: b64string,
            },
          });
        };

        mediaRecorder.onstop = (e) => {
          console.log("Media recorder stopped");
          // const blob = new Blob(audioChunks, {
          //   type: "audio/ogg; codecs=opus",
          // });

          // blobToBase64(blob).then((blobString) => {
          //   const req: SpeechToTextRequest = {
          //     b64FileString: blobString,
          //     index: 0,
          //   };
          //   fetch(getBaseUrl() + "/api/tts", {
          //     method: "POST",
          //     headers: {
          //       "Content-Type": "application/json",
          //     },
          //     body: JSON.stringify(req),
          //   })
          //     .then((res) => {
          //       res.json().then((resJSON) => {
          //         const resp = resJSON as SpeechToTextResponse;
          //         if (typeof resp.error !== "undefined") {
          //           toast.error(resp.error);
          //           console.log("Missing resp.textModelResp", resp);
          //         } else if (typeof resp.textModelResp.error !== "undefined") {
          //           toast.error(
          //             `Sorry, ${resp.textModelResp.error}. Give us ~${
          //               resp.textModelResp.estimated_time || "a few "
          //             }s to fix it.`
          //           );
          //         } else {
          //           toast.success("Success!");

          //           const buff = resp.speechModelResp;
          //           if (typeof buff !== "undefined" && buff !== null) {
          //             const blob = base64ToBlob(buff);
          //             var blobURL = window.URL.createObjectURL(blob);
          //             if (playerRef.current) {
          //               playerRef.current.src = blobURL;
          //             } else {
          //               console.error("No audio player ref. :(");
          //             }
          //           } else {
          //             console.error("No speech model response. :(");
          //           }
          //           setTextToSpeechResponse(resp.textModelResp.text);
          //           setFullResponse(resp);
          //         }
          //       });
          //     })
          //     .catch((err) => {
          //       toast.error("Error: " + err);
          //     });
          // });

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

  const btnStyle = `hover:animate-bottom-bounce rounded-full mx-1 bg-white/10 px-10 py-3 font-semibold text-${
    isRecording ? "red-300" : "white"
  } no-underline transition hover:bg-white/20`;

  const audioPlayerStyle = `my-2 h-10 w-full ${
    textToSpeechResponse ? "" : "hidden" //todo fixme allen
  }`;

  return (
    <>
      {conversationRows && (
        <>
          {<ConversationContainer {...conversationRows} />}
          <div className="px-4">
            <div className="hidden"></div>
            <audio
              ref={playerRef}
              id="player"
              controls
              className={audioPlayerStyle}
            ></audio>
          </div>
        </>
      )}
      <div className="items-left flex w-full flex-col justify-center p-4">
        <div id="recodingBtn" className="py-1 text-center">
          <div className="hidden text-red-300" />
          <button className={btnStyle} onClick={handleMicButtonClick}>
            Record
          </button>
          {textToSpeechResponse && (
            <button
              className="mx-1 rounded-full bg-white/10 px-10 py-3 font-semibold text-white hover:animate-bottom-bounce"
              onClick={handleClearButtonClick}
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </>
  );
};
