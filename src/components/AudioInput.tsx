import { posthog } from "posthog-js";
import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { base64ToBlob, blobToBase64, getAudioRMS } from "../utils/encoding";
import { type SpeechToTextResponse } from "../utils/speech";
import { trpc } from "../utils/trpc";
import {
  ConversationContainer,
  ConversationContainerProps,
} from "./ConversationContainer";
import { ConversationRowProps } from "./ConversationRow";

export const AudioInput = (): JSX.Element => {
  // Constants
  const recordingTimeSlice = 2000;
  const audioBitRate = 16000;
  const loudnessThreshold = 0.05;
  const maxSilentTicks = 16; // total number of ticks to wait for speech
  const ticksWIthoutSpeechInterval = 200; // ms to wait between ticks checking for speech

  // Media state hooks
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [currentUserText, setCurrentUserText] = useState<string>("");
  const [userTextComplete, setUserTextComplete] = useState<boolean>(false);

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
        console.debug("Setting user text to: ", data.text);
        setCurrentUserText(data.text);
        posthog.capture("ASR Generated", { length: data.text.length });
      }
    },
  });

  const modelSpeechQuery = trpc.speech.completionSpeech.useMutation({
    onError: (err) => {
      toast.error("Sorry, we had a problem 😬");
      console.warn(err);
    },
    onSuccess: (data) => {
      if (data?.error) {
        toast.error("Sorry, we had a problem 😬");
        console.error(data.error);
      }
      if (data?.llmTextResp && data.speechModelResp) {
        setFullResponse(data);
        posthog.capture("LLM Response Generated", {
          length: data.llmTextResp.length,
        });
      }
    },
  });

  // UI Effect hooks

  // Clear audio chunks after user text is complete
  useEffect(() => {
    if (userTextComplete && userASRQuery.isSuccess) {
      // TODO @allen-n: determine a better way to do this, need to do it to clear the audio chunks without corrupting the query
      setTimeout(() => {
        audioChunks.length = 0;
        setAudioChunks(audioChunks);
      }, 3000);
    }
  }, [userTextComplete, userASRQuery.status]);

  // Update the full response text in the conversation item
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
        const rows = [...conversationRows.rows];
        rows[rows.length - 1] = convoRow;
        setConversationRows({ rows: rows });
      } else {
        let rows: ConversationRowProps[] = [convoRow];
        setConversationRows({ rows: rows });
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
      } else {
        console.error("No audio buffer. :(", buff);
      }
    }
  }, [fullResponse]);

  // Update the conversation item with the user text
  useEffect(() => {
    if (currentUserText) {
      if (conversationRows) {
        const rows = [...conversationRows.rows];
        rows[rows.length - 1] = {
          incomingUserText: currentUserText,
          incomingUserTextComplete: userTextComplete,
        };

        setConversationRows({ rows: rows });
      } else {
        const convoRow: ConversationRowProps = {
          incomingUserText: currentUserText,
          incomingUserTextComplete: userTextComplete,
        };
        let rows: ConversationRowProps[] = [convoRow];

        setConversationRows({ rows: rows });
      }
    }
  }, [currentUserText, userTextComplete]);

  // Send the completion request when the user text is complete
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

  // If we have enough ticks without speech, stop recording (using the same interface as the record button)
  useEffect(() => {
    if (ticksWithoutSpeech > maxSilentTicks && isRecording) {
      toast.success("End of speech detected!");
      posthog.capture("End Of Speech Detected", {
        userTextLength: currentUserText.length,
        conversationLength: conversationRows?.rows.length,
        audioLengthMs: audioChunks.length * recordingTimeSlice,
      });
      handleMicButtonClick();
      setTicksWithoutSpeech(0);
    }
  }, [ticksWithoutSpeech]);

  // Ref hooks
  const playerRef = useRef<HTMLAudioElement>(null);

  // Utility functions
  const clearEmptyConversationRows = () => {
    if (conversationRows) {
      const rows = [...conversationRows.rows];
      const newRows = rows.filter((row) => row.incomingUserTextComplete);

      setConversationRows({ rows: newRows });
    }
  };

  const addNewConversationRow = () => {
    if (conversationRows) {
      const rows = [...conversationRows.rows];
      rows.push({ incomingUserText: "", incomingUserTextComplete: false });

      setConversationRows({ rows: rows });
    } else {
      let rows: ConversationRowProps[] = [
        { incomingUserText: "", incomingUserTextComplete: false },
      ];

      setConversationRows({ rows: rows });
    }
  };

  const handleMicButtonClick = () => {
    if (isRecording) {
      posthog.capture("Voice Input Recording Stopped", {
        userTextLength: currentUserText.length,
        conversationLength: conversationRows?.rows.length,
        audioLengthMs: audioChunks.length * recordingTimeSlice,
      });
      stopRecoding();
      setIsRecording(false);
      setTextToSpeechResponse(currentUserText);
    } else {
      // Clear state for new data
      posthog.capture("Voice Input Recording Started", {
        userTextLength: currentUserText.length,
        conversationLength: conversationRows?.rows.length,
      });
      clearEmptyConversationRows();
      setCurrentUserText("");
      setTextToSpeechResponse("");
      setUserTextComplete(false);
      setFullResponse(undefined);
      setAudioChunks([]);

      // Start recording
      setIsRecording(true);
      addNewConversationRow();
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
        }, ticksWIthoutSpeechInterval);

        // Callback on the `recordingTimeSlice` interval
        mediaRecorder.ondataavailable = async (e) => {
          let chunks = audioChunks;
          chunks.push(e.data);
          const rms = await getAudioRMS(e);
          console.debug(
            `Pushed ${e.data.size} bytes of audio data. RMS=${rms}`
          );

          setAudioChunks(chunks);

          // NOTE: Disabling as-you-speak ASR for now
          // if (chunks.length > 1) {
          //   const blob = new Blob(chunks, {
          //     type: "audio/ogg; codecs=opus",
          //   });
          //   const b64string = await blobToBase64(blob);
          //   const duration = await getBlobDuration(blob);
          //   userASRQuery.mutate({
          //     req: {
          //       returnType: "speechToText",
          //       b64FileString: b64string,
          //     },
          //   });
          // }
        };

        // Callback when the stream is stopped
        mediaRecorder.onstop = async (e) => {
          clearInterval(intervalID); // Stop checking the volume
          // If we actually have audio, try to run
          if (audioChunks.length > 1) {
            setUserTextComplete(true); // Show loading indicator for robot text
            const blob = new Blob(audioChunks, {
              type: "audio/ogg; codecs=opus",
            });
            const size = audioChunks.reduce(
              (acc, chunk) => acc + chunk.size,
              0
            );
            console.debug(`Audio size: ${size / 1000}kb`);
            const b64string = await blobToBase64(blob);

            userASRQuery.mutate({
              req: {
                returnType: "speechToText",
                b64FileString: b64string,
              },
            });
            setShouldSendCompletionRequest(true);
          }
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

  const recordBtnText = isRecording ? "🗣️ Stop" : "🎤 Record";

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
            {recordBtnText}
          </button>
          {fullResponse && (
            <button
              className="mx-1 rounded-full bg-white/10 px-10 py-3 font-semibold text-white hover:animate-bottom-bounce"
              onClick={handleClearButtonClick}
            >
              ❌ Clear
            </button>
          )}
        </div>
      </div>
    </>
  );
};
