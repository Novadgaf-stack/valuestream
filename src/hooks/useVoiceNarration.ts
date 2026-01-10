import { useRef, useCallback, useState } from "react";

interface UseVoiceNarrationOptions {
  enabled?: boolean;
}

export const useVoiceNarration = ({ enabled = true }: UseVoiceNarrationOptions = {}) => {
  const audioQueue = useRef<string[]>([]);
  const isPlaying = useRef(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(enabled);

  const playNext = useCallback(async () => {
    if (!voiceEnabled || isPlaying.current || audioQueue.current.length === 0) {
      setIsSpeaking(false);
      return;
    }

    isPlaying.current = true;
    setIsSpeaking(true);

    const text = audioQueue.current.shift()!;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/text-to-speech`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text }),
        }
      );

      if (!response.ok) {
        throw new Error("TTS failed");
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        isPlaying.current = false;
        playNext();
      };

      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        isPlaying.current = false;
        playNext();
      };

      await audio.play();
    } catch (err) {
      console.error("TTS error:", err);
      isPlaying.current = false;
      playNext();
    }
  }, [voiceEnabled]);

  const speak = useCallback(
    (text: string) => {
      if (!voiceEnabled) return;
      audioQueue.current.push(text);
      if (!isPlaying.current) {
        playNext();
      }
    },
    [voiceEnabled, playNext]
  );

  const announceDetection = useCallback(
    (objectName: string, value: number, isDamaged?: boolean) => {
      if (!voiceEnabled) return;
      
      let announcement = `Detected: ${objectName}. Estimated value: $${value.toLocaleString()}`;
      if (isDamaged) {
        announcement += ". Item shows damage.";
      }
      speak(announcement);
    },
    [speak, voiceEnabled]
  );

  const announceTotalValue = useCallback(
    (totalValue: number, itemCount: number) => {
      if (!voiceEnabled) return;
      speak(`Scan complete. ${itemCount} items worth $${totalValue.toLocaleString()}`);
    },
    [speak, voiceEnabled]
  );

  const toggleVoice = useCallback(() => {
    setVoiceEnabled((prev) => !prev);
    if (voiceEnabled) {
      audioQueue.current = [];
    }
  }, [voiceEnabled]);

  return {
    speak,
    announceDetection,
    announceTotalValue,
    toggleVoice,
    voiceEnabled,
    isSpeaking,
  };
};
