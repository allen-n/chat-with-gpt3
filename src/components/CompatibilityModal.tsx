import Image from "next/image";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
/**
 * Component source: https://tailwindcomponents.com/component/testimonial-card
 * @returns JSX.Element
 */

export const CompatibilityModal = (): JSX.Element => {
  const [micPermissionState, setMicPermissionState] = useState<boolean>(false);
  const [modalText, setModalText] = useState<string>(
    "We need access to the mic for this! Please allow it after clicking below 👇"
  );

  const promptMicPermissions = async () => {
    try {
      navigator.mediaDevices
        .getUserMedia({ audio: true, video: false })
        .then((stream) => {
          // Set up media stream

          const options = {
            mimeType: "audio/webm",
          };
          const mediaRecorder = new MediaRecorder(stream, options);
          stream.getTracks().forEach(function (track) {
            track.stop();
          });
        })
        .catch((err) => {
          if (err.name == "NotAllowedError") {
            toast.error(
              "Sorry, we couldn't access your mic. If you revoked access, please grant it back!"
            );
          }
          if (err.name === "NotSupportedError") {
            setModalText(
              "Sorry, it looks like you're using an unsupported browser (probably safari), which doesn't allow native audio recording. Please try again in a different browser or on a different device!"
            );
          }

          console.error(err.name);
        });
    } catch (error) {
      toast.error("Sorry, we encountered an error");
      console.error(error);
    }
  };

  const checkMicPermissions = async () => {
    navigator.permissions
      .query(
        // { name: 'camera' }
        // @ts-ignore // This still works in chrome, but typescript doesn't like it
        { name: "microphone" }
        // { name: 'geolocation' }
        // { name: 'notifications' }
        // { name: 'midi', sysex: false }
        // { name: 'midi', sysex: true }
        // { name: 'push', userVisibleOnly: true }
        // { name: 'push' } // without userVisibleOnly isn't supported in chrome M45, yet
      )
      .then(function (permissionStatus) {
        setMicPermissionState(permissionStatus.state === "granted");
        // console.log(permissionStatus.state); // granted, denied, prompt

        return (permissionStatus.onchange = function () {
          setMicPermissionState(permissionStatus.state === "granted");
        });
      });
  };
  useEffect(() => {
    checkMicPermissions();
  }, []);

  return !micPermissionState ? (
    <div
      className="my-20 max-w-md rounded-lg bg-white py-4 px-8 shadow-lg"
      role="dialog"
    >
      <div className="-mt-16 flex justify-center md:justify-end">
        <Image
          className="h-20 w-20 rounded-full border-2 border-indigo-500 object-cover"
          src="/android-chrome-512x512.png"
          width={512}
          height={512}
          alt="avatar"
        />
      </div>
      <div>
        <h2 className="text-3xl font-semibold text-gray-800">
          Before we get started...
        </h2>
        <p className="mt-2 text-gray-600">{modalText}</p>
      </div>
      <div className="mt-4 flex justify-center">
        <button
          className=" rounded-md bg-indigo-500 px-3 py-1 text-white hover:bg-indigo-400"
          onClick={promptMicPermissions}
        >
          Enable Mic
        </button>
      </div>
      <div className="mt-4 flex justify-end">
        <a
          target="_blank"
          rel="noopener"
          href="https://twitter.com/nikka_allen"
          className="text-xl font-medium text-indigo-500"
        >
          -Allen
        </a>
      </div>
    </div>
  ) : (
    <></>
  );
};
