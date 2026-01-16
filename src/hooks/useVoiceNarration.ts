import { useRef, useCallback, useState, useEffect } from "react";

const STORAGE_KEY = "valuestream_voice_settings";

interface VoiceSettings {
  enabled: boolean;
  voiceId: string;
}

const DEFAULT_VOICE_ID = "CwhRBWXzGAHq8TQ4Fs17"; // Roger - Professional Male

interface UseVoiceNarrationOptions {
  enabled?: boolean;
}

export const useVoiceNarration = ({ enabled = true }: UseVoiceNarrationOptions = {}) => {
  const audioQueue = useRef<string[]>([]);
  const isPlaying = useRef(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Load settings from localStorage
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to load voice settings:", e);
    }
    return { enabled, voiceId: DEFAULT_VOICE_ID };
  });

  // Persist settings
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(voiceSettings));
    } catch (e) {
      console.error("Failed to save voice settings:", e);
    }
  }, [voiceSettings]);

  const playNext = useCallback(async () => {
    if (!voiceSettings.enabled || isPlaying.current || audioQueue.current.length === 0) {
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
          body: JSON.stringify({ 
            text, 
            voiceId: voiceSettings.voiceId 
          }),
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
  }, [voiceSettings.enabled, voiceSettings.voiceId]);

  const speak = useCallback(
    (text: string) => {
      if (!voiceSettings.enabled) return;
      audioQueue.current.push(text);
      if (!isPlaying.current) {
        playNext();
      }
    },
    [voiceSettings.enabled, playNext]
  );

  const announceDetection = useCallback(
    (objectName: string, value: number, isDamaged?: boolean) => {
      if (!voiceSettings.enabled) return;
      
      let announcement = `${objectName}, $${value.toLocaleString()}`;
      if (isDamaged) {
        announcement += ". Shows wear.";
      }
      speak(announcement);
    },
    [speak, voiceSettings.enabled]
  );

  const announceTotalValue = useCallback(
    (totalValue: number, itemCount: number) => {
      if (!voiceSettings.enabled) return;
      speak(`Total: ${itemCount} items, $${totalValue.toLocaleString()}`);
    },
    [speak, voiceSettings.enabled]
  );

  const toggleVoice = useCallback(() => {
    setVoiceSettings((prev) => {
      const newEnabled = !prev.enabled;
      if (!newEnabled) {
        audioQueue.current = [];
      }
      return { ...prev, enabled: newEnabled };
    });
  }, []);

  const setVoiceId = useCallback((voiceId: string) => {
    setVoiceSettings((prev) => ({ ...prev, voiceId }));
  }, []);

  return {
    speak,
    announceDetection,
    announceTotalValue,
    toggleVoice,
    voiceEnabled: voiceSettings.enabled,
    isSpeaking,
    selectedVoice: voiceSettings.voiceId,
    setVoiceId,
  };
};
