import { useRef, useCallback, useState, useEffect } from "react";
import { toast } from "sonner";

const STORAGE_KEY = "valuestream_voice_settings";

type TtsMode = "remote" | "local";

interface VoiceSettings {
  enabled: boolean;
  voiceId: string;
}

const DEFAULT_VOICE_ID = "CwhRBWXzGAHq8TQ4Fs17"; // Roger - Professional Male

interface UseVoiceNarrationOptions {
  enabled?: boolean;
}

const isWebSpeechAvailable = () =>
  typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;

const getLocalVoiceStyle = (voiceId: string) => {
  // Map our selectable voices to a simple style profile for Web Speech fallback.
  // (Browser voice selection is OS-dependent, so we control pitch/rate instead.)
  switch (voiceId) {
    case "EXAVITQu4vr4xnSDxMaL": // Sarah
      return { rate: 1.02, pitch: 1.15 };
    case "onwK4e9ZLuTAKqWW03F9": // Daniel (used as "digital assistant")
      return { rate: 1.08, pitch: 0.9 };
    default: // Roger
      return { rate: 1.0, pitch: 0.95 };
  }
};

export const useVoiceNarration = ({ enabled = true }: UseVoiceNarrationOptions = {}) => {
  const audioQueue = useRef<string[]>([]);
  const isPlaying = useRef(false);
  const playNextRef = useRef<(() => void) | null>(null);
  const ttsMode = useRef<TtsMode>("remote");
  const hasShownQuotaToast = useRef(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Load settings from localStorage
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
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

  const playWithWebSpeech = useCallback(
    (text: string) => {
      if (!isWebSpeechAvailable()) {
        // Nothing else we can do.
        isPlaying.current = false;
        setIsSpeaking(false);
        return;
      }

      try {
        // Cancel any existing utterances for snappier UX.
        window.speechSynthesis.cancel();

        const u = new SpeechSynthesisUtterance(text);
        const style = getLocalVoiceStyle(voiceSettings.voiceId);
        u.rate = style.rate;
        u.pitch = style.pitch;
        u.volume = 1;

        u.onend = () => {
          isPlaying.current = false;
          playNextRef.current?.();
        };

        u.onerror = () => {
          isPlaying.current = false;
          playNextRef.current?.();
        };

        window.speechSynthesis.speak(u);
      } catch (e) {
        console.error("Web Speech TTS failed:", e);
        isPlaying.current = false;
        playNextRef.current?.();
      }
    },
    // playNext is declared below but safe here due to function hoisting via useCallback dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [voiceSettings.voiceId]
  );

  const playNext = useCallback(async () => {
    if (!voiceSettings.enabled || isPlaying.current || audioQueue.current.length === 0) {
      setIsSpeaking(false);
      return;
    }

    isPlaying.current = true;
    setIsSpeaking(true);

    const rawText = audioQueue.current.shift()!;
    const text = rawText.slice(0, 220); // keep prompts short to reduce cost

    // If we already know remote TTS is unavailable (quota), go local immediately.
    if (ttsMode.current === "local") {
      playWithWebSpeech(text);
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/text-to-speech`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ text, voiceId: voiceSettings.voiceId }),
      });

      if (!response.ok) {
        // Try to detect quota exceeded so we can stop calling the server.
        let errJson: any = null;
        try {
          errJson = await response.json();
        } catch {
          // ignore
        }

        if (response.status === 402 && errJson?.code === "quota_exceeded") {
          ttsMode.current = "local";
          if (!hasShownQuotaToast.current) {
            hasShownQuotaToast.current = true;
            toast.error("Voice credits exhausted — using device voice instead.");
          }
        }

        // Fallback to device voice for this utterance.
        playWithWebSpeech(text);
        return;
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        isPlaying.current = false;
        playNextRef.current?.();
      };

      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        isPlaying.current = false;
        playNextRef.current?.();
      };

      await audio.play();
    } catch (err) {
      console.error("TTS error:", err);
      // Network or unexpected error  fallback
      playWithWebSpeech(text);
    }
  }, [voiceSettings.enabled, voiceSettings.voiceId, playWithWebSpeech]);

  // Allow callbacks (audio/web-speech) to continue the queue without a forward-reference.
  playNextRef.current = () => {
    playNext();
  };

  const speak = useCallback(
    (text: string) => {
      if (!voiceSettings.enabled) return;
      audioQueue.current.push(text);
      if (!isPlaying.current) playNext();
    },
    [voiceSettings.enabled, playNext]
  );

  const announceDetection = useCallback(
    (objectName: string, value: number, isDamaged?: boolean) => {
      if (!voiceSettings.enabled) return;

      let announcement = `${objectName}, $${value.toLocaleString()}`;
      if (isDamaged) announcement += ". Shows wear.";
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
        if (isWebSpeechAvailable()) window.speechSynthesis.cancel();
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

