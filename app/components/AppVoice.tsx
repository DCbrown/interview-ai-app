"use client";

import React, { useEffect } from "react";

interface AppVoiceProps {
  text: string;
}

const AppVoice = ({ text }: AppVoiceProps) => {
  useEffect(() => {
    const generateSpeech = async () => {
      try {
        const response = await fetch("/api/openai-gpt", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text,
            type: "speech",
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to generate speech");
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);

        const audioElement = document.getElementById(
          "speech-audio"
        ) as HTMLAudioElement;
        audioElement.src = audioUrl;
      } catch (error) {
        console.error("Error generating speech:", error);
      }
    };

    if (text) {
      generateSpeech();
    }
  }, [text]);

  return (
    <div>
      <audio id="speech-audio" controls />
    </div>
  );
};

export default AppVoice;
