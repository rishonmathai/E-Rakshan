export function getVoiceLang(language = "English") {
  if (language === "Hindi") return "hi-IN";
  if (language === "Marathi") return "mr-IN";
  return "en-IN";
}

export function speak(text, language = "English") {
  if (!("speechSynthesis" in window)) {
    return false;
  }

  if (!text || !text.trim()) {
    return false;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  utterance.lang = getVoiceLang(language);
  utterance.rate = 0.95;
  utterance.pitch = 1;

  const setVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    const targetLang = utterance.lang.toLowerCase();

    const voice =
      voices.find(
        (v) => v.lang?.toLowerCase() === targetLang
      ) ||
      voices.find(
        (v) =>
          v.lang?.toLowerCase().startsWith(targetLang.slice(0, 2))
      );

    if (voice) {
      utterance.voice = voice;
    }
  };

  setVoice();

  // Some browsers load voices asynchronously.
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = setVoice;
  }

  window.speechSynthesis.speak(utterance);

  return true;
}

export function stopSpeaking() {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

async function requestMicPermission() {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error(
      "Microphone access is unavailable. Open the app on localhost or HTTPS and allow microphone access."
    );
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: true,
  });

  stream.getTracks().forEach((track) => track.stop());
}

export async function listenOnce(language = "English") {
  await requestMicPermission();

  return new Promise((resolve, reject) => {
    const Recognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!Recognition) {
      reject(
        new Error(
          "Voice recognition is not supported by this browser. Try Google Chrome, or use the SAI text command box."
        )
      );
      return;
    }

    const recognition = new Recognition();

    let settled = false;

    recognition.lang = getVoiceLang(language);
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.maxAlternatives = 5;

    const fail = (message) => {
      if (settled) return;

      settled = true;

      try {
        recognition.stop();
      } catch (error) {
        // Recognition was already stopped.
      }

      reject(new Error(message));
    };

    recognition.onstart = () => {
      console.log("SAI voice recognition started");
    };

    recognition.onresult = (event) => {
      const text =
        event.results?.[0]?.[0]?.transcript?.trim();

      if (text) {
        settled = true;
        resolve(text);
      } else {
        fail(
          "I could not hear a command. Please try again."
        );
      }
    };

    recognition.onerror = (event) => {
      const messages = {
        "not-allowed":
          "Microphone permission was blocked. Click the lock/site icon beside localhost and allow Microphone, then reload.",

        "service-not-allowed":
          "Browser speech recognition service is blocked. Try Google Chrome or enable speech recognition.",

        "audio-capture":
          "No working microphone was detected. Please check your microphone.",

        network:
          "Speech recognition needs an internet connection.",

        "no-speech":
          "I did not hear anything. Please speak again.",

        aborted:
          "Voice recognition was stopped. Please try again.",

        "language-not-supported":
          "This language is not supported by your browser's speech recognition.",
      };

      fail(
        messages[event.error] ||
          `Voice recognition failed: ${event.error || "Unknown error"}`
      );
    };

    recognition.onend = () => {
      if (!settled) {
        fail(
          "No voice command was detected. Please tap the SAI button and speak again."
        );
      }
    };

    try {
      recognition.start();
    } catch (error) {
      fail(
        "Microphone is already active. Wait a moment and try again."
      );
    }
  });
}