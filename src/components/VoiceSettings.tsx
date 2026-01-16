import { useState } from "react";
import { X, Volume2, Check, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/hooks/useTheme";
import { toast } from "sonner";

export type VoiceOption = {
  id: string;
  name: string;
  description: string;
  voiceId: string;
};

export const VOICE_OPTIONS: VoiceOption[] = [
  {
    id: "male",
    name: "Professional Male",
    description: "Clear, authoritative voice",
    voiceId: "CwhRBWXzGAHq8TQ4Fs17",
  },
  {
    id: "female",
    name: "Professional Female",
    description: "Warm, confident voice",
    voiceId: "EXAVITQu4vr4xnSDxMaL",
  },
  {
    id: "robotic",
    name: "Digital Assistant",
    description: "Clear, neutral tone",
    voiceId: "onwK4e9ZLuTAKqWW03F9",
  },
];

interface VoiceSettingsProps {
  selectedVoice: string;
  onSelectVoice: (voiceId: string) => void;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  onClose: () => void;
}

export const VoiceSettings = ({
  selectedVoice,
  onSelectVoice,
  voiceEnabled,
  onToggleVoice,
  onClose,
}: VoiceSettingsProps) => {
  const [testingVoice, setTestingVoice] = useState<string | null>(null);
  const { theme, toggleTheme } = useTheme();

  const testVoice = async (voiceId: string) => {
    setTestingVoice(voiceId);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/text-to-speech`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          text: "Sample voice test.",
          voiceId,
        }),
      });

      if (!response.ok) {
        let err: any = null;
        try {
          err = await response.json();
        } catch {
          // ignore
        }

        if (response.status === 402 && err?.code === "quota_exceeded") {
          toast.error("Credits exhausted — using device voice.");
          // Fallback to device voice
          if ("speechSynthesis" in window) {
            window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance("Sample voice test.");
            window.speechSynthesis.speak(u);
          }
        } else {
          toast.error("Voice test failed.");
        }
        return;
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.onended = () => URL.revokeObjectURL(audioUrl);
      await audio.play();
    } catch (err) {
      console.error("Failed to test voice:", err);
      // Fallback to device voice
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance("Sample voice test.");
        window.speechSynthesis.speak(u);
        toast.info("Using device voice");
      } else {
        toast.error("Voice unavailable");
      }
    } finally {
      setTestingVoice(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-card rounded-t-2xl md:rounded-2xl shadow-2xl max-w-md w-full animate-slide-up">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Settings</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-4 space-y-5">
          {/* Theme Toggle */}
          <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl">
            <div className="flex items-center gap-3">
              {theme === "dark" ? (
                <Moon className="w-5 h-5 text-primary" />
              ) : (
                <Sun className="w-5 h-5 text-primary" />
              )}
              <div>
                <div className="font-medium text-foreground">Dark Mode</div>
                <div className="text-sm text-muted-foreground">
                  {theme === "dark" ? "Currently on" : "Currently off"}
                </div>
              </div>
            </div>
            <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
          </div>

          {/* Voice Enable Toggle */}
          <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl">
            <div className="flex items-center gap-3">
              <Volume2 className="w-5 h-5 text-primary" />
              <div>
                <div className="font-medium text-foreground">Voice Announcements</div>
                <div className="text-sm text-muted-foreground">
                  Speak item names and prices
                </div>
              </div>
            </div>
            <Switch checked={voiceEnabled} onCheckedChange={onToggleVoice} />
          </div>

          {/* Voice Options */}
          {voiceEnabled && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-muted-foreground">
                Voice Style
              </label>
              <div className="space-y-2">
                {VOICE_OPTIONS.map((voice) => (
                  <div
                    key={voice.id}
                    className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all cursor-pointer ${
                      selectedVoice === voice.voiceId
                        ? "border-primary bg-primary/5"
                        : "border-transparent bg-secondary/30 hover:bg-secondary/50"
                    }`}
                    onClick={() => onSelectVoice(voice.voiceId)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center ${
                          selectedVoice === voice.voiceId
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {selectedVoice === voice.voiceId ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Volume2 className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{voice.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {voice.description}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={testingVoice !== null}
                      onClick={(e) => {
                        e.stopPropagation();
                        testVoice(voice.voiceId);
                      }}
                    >
                      {testingVoice === voice.voiceId ? "..." : "Test"}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border">
          <Button className="w-full" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VoiceSettings;
