"use client";

import React, { useEffect } from "react";
import OpenAI from "openai";

interface AppVoiceProps {
  text: string;
}

const openai = new OpenAI({
  apiKey:
    "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",
  dangerouslyAllowBrowser: true,
});

const AppVoice = ({ text }: AppVoiceProps) => {
  useEffect(() => {
    const generateSpeech = async () => {
      try {
        const mp3 = await openai.audio.speech.create({
          model: "tts-1",
          voice: "onyx",
          input: text,
        });

        // Convert the response to audio blob
        const audioBlob = new Blob([await mp3.arrayBuffer()], {
          type: "audio/mp3",
        });
        const audioUrl = URL.createObjectURL(audioBlob);

        // Find or create audio element
        const audioElement = document.getElementById(
          "speech-audio"
        ) as HTMLAudioElement;
        audioElement.src = audioUrl;
      } catch (error) {
        console.error("Error generating speech:", error);
      }
    };

    generateSpeech();
  }, [text]);

  return (
    <div>
      <audio id="speech-audio" controls />
    </div>
  );
};

export default AppVoice;
