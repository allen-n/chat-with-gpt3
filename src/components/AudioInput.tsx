import React, { useRef, useState, useEffect } from "react";
import {
  ConversationContainer,
  type ConversationContainerProps,
} from "./ConversationContainer";
import { ConversationRowProps } from "./ConversationRow";
import toast from "react-hot-toast";

import { trpc } from "../utils/trpc";
import { blobToBase64, base64ToBlob, getAudioRMS } from "../utils/encoding";
import { SpeechToTextResponse } from "../server/trpc/router/speech";

export const AudioInput = (): JSX.Element => {
  // Constants
  const recordingTimeSlice = 2000;
  const audioBitRate = 16000;
  const loudnessThreshold = 0.05;
  const maxSilentTicks = 10;

  // Media state hooks
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [currentUserText, setCurrentUserText] = useState<string>("");

  // API Call state hooks
  const [textToSpeechResponse, setTextToSpeechResponse] = useState<string>("");
  const [fullResponse, setFullResponse] = useState<SpeechToTextResponse>();

  // UI State Hooks
  const [conversationRows, setConversationRows] =
    useState<ConversationContainerProps>();
  const [shouldSendCompletionRequest, setShouldSendCompletionRequest] =
    useState<boolean>(false);
  const [ticksWithoutSpeech, setTicksWithoutSpeech] = useState<number>(0);

  // tRPC query hooks
  const userASRQuery = trpc.speech.asr.useMutation({
    onError: (err) => {
      toast.error("Sorry, we had a problem 😬");
      console.error(err);
    },
    onSuccess: (data) => {
      if (data.text) {
        setCurrentUserText(data.text);
      }
    },
  });

  const modelSpeechQuery = trpc.speech.completionSpeech.useMutation({
    onError: (err) => {
      toast.error("Sorry, we had a problem 😬");
      console.error(err);
    },
    onSuccess: (data) => {
      if (data?.error) {
        toast.error("Sorry, we had a problem 😬");
        console.error(data.error);
      }
      if (data?.llmTextResp && data.speechModelResp) {
        setFullResponse(data);
      }
    },
  });

  // UI Effect hooks
  useEffect(() => {
    if (fullResponse) {
      const convoRow: ConversationRowProps = {
        incomingUserText:
          fullResponse?.textModelResp.text || "Houston, we had a problem",
        incomingBotText:
          fullResponse?.llmTextResp || "Houston, we had a problem",
        incomingUserTextComplete: true,
      };
      if (conversationRows) {
        let rows = conversationRows.conversationRows;
        let newRows = rows.filter((row) => !row.incomingUserTextComplete);
        conversationRows.conversationRows = newRows;
        newRows.push(convoRow);
        setConversationRows(conversationRows);
      } else {
        let rows: ConversationContainerProps = { conversationRows: [convoRow] };
        setConversationRows(rows);
      }
      const buff = fullResponse.speechModelResp;
      if (typeof buff !== "undefined" && buff !== null) {
        const blob = base64ToBlob(buff);
        var blobURL = window.URL.createObjectURL(blob);
        if (playerRef.current) {
          playerRef.current.src = blobURL;
          playerRef.current.play();
        } else {
          console.error("No audio player ref. :(");
        }
      }
    }
  }, [fullResponse]);

  useEffect(() => {
    if (currentUserText) {
      const convoRow: ConversationRowProps = {
        incomingUserTextComplete: false,
        incomingUserText: currentUserText,
      };
      if (conversationRows) {
        let rows = conversationRows.conversationRows;
        rows[rows.length - 1] = convoRow;
        setConversationRows(conversationRows);
      } else {
        let rows: ConversationContainerProps = { conversationRows: [convoRow] };
        setConversationRows(rows);
      }
    }
  }, [currentUserText]);

  useEffect(() => {
    if (userASRQuery.isSuccess && shouldSendCompletionRequest) {
      modelSpeechQuery.mutate({
        resp: {
          textModelResp: {
            text: currentUserText,
          },
        },
      });
      setShouldSendCompletionRequest(false);
    }
  }, [userASRQuery.status]);

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

  useEffect(() => {
    // If we have enough ticks without speech, stop recording (using the same interface as the record button)
    if (ticksWithoutSpeech > maxSilentTicks && isRecording) {
      toast.success("End of speech detected!");
      handleMicButtonClick();
      setTicksWithoutSpeech(0);
    }
  }, [ticksWithoutSpeech]);

  // Ref hooks
  const playerRef = useRef<HTMLAudioElement>(null);

  const handleMicButtonClick = () => {
    if (isRecording) {
      stopRecoding();
      setIsRecording(false);
      setTextToSpeechResponse(currentUserText);
    } else {
      // Clear state for new data
      setTextToSpeechResponse("");
      setFullResponse(undefined);
      // Start recording
      setIsRecording(true);
      record();
    }
  };

  const handleClearButtonClick = () => {
    setFullResponse(undefined);
    setConversationRows(undefined);
  };

  const record = () => {
    navigator.mediaDevices
      .getUserMedia({ audio: true, video: false })
      .then((stream) => {
        // Set up media stream
        setStream(stream);
        const options = {
          mimeType: "audio/webm",
          audioBitsPerSecond: audioBitRate,
        };
        const mediaRecorder = new MediaRecorder(stream, options);

        // Gets the volume level of the stream in realtime
        const audioContext = new AudioContext();
        const mediaStreamAudioSourceNode =
          audioContext.createMediaStreamSource(stream);
        const analyserNode = audioContext.createAnalyser();
        mediaStreamAudioSourceNode.connect(analyserNode);
        const pcmData = new Float32Array(analyserNode.fftSize);

        // Check stream at regular intervals to see how loud it is (i.e. is someone talking?)
        const intervalID = setInterval(() => {
          analyserNode.getFloatTimeDomainData(pcmData);
          let sumSquares = 0.0;
          for (const amplitude of pcmData) {
            sumSquares += amplitude * amplitude;
          }
          const loudness = Math.sqrt(sumSquares / pcmData.length);
          if (loudness <= loudnessThreshold) {
            setTicksWithoutSpeech((currentTicks) => currentTicks + 1);
          } else {
            setTicksWithoutSpeech(0);
          }
        }, 200);

        // Callback on the `recordingTimeSlice` interval
        mediaRecorder.ondataavailable = async (e) => {
          let chunks = audioChunks;
          chunks.push(e.data);
          console.debug(`Pushed ${e.data.size} bytes of audio data.`);
          const rms = await getAudioRMS(e);
          const blob = new Blob(chunks, {
            type: "audio/ogg; codecs=opus",
          });
          const b64string = await blobToBase64(blob);
          setAudioChunks(chunks);

          // userASRQuery.mutate({
          //   req: {
          //     returnType: "speechToText",
          //     index: b64string.length,
          //     b64FileString: b64string,
          //   },
          // });
        };

        // Callback when the stream is stopped
        mediaRecorder.onstop = async (e) => {
          clearInterval(intervalID); // Stop checking the volume

          console.log("Media recorder stopped");
          const blob = new Blob(audioChunks, {
            type: "audio/ogg; codecs=opus",
          });
          const b64string = await blobToBase64(blob);

          // userASRQuery.mutate({
          //   req: {
          //     returnType: "speechToText",
          //     index: b64string.length,
          //     b64FileString: b64string,
          //   },
          // });
          // setShouldSendCompletionRequest(true);

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
              className="my-2 h-10 w-full"
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
          {fullResponse && (
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
