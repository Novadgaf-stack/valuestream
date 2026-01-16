import { useState, useEffect } from "react";
import { X, Volume2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    voiceId: "CwhRBWXzGAHq8TQ4Fs17", // Roger
  },
  {
    id: "female",
    name: "Professional Female",
    description: "Warm, confident voice",
    voiceId: "EXAVITQu4vr4xnSDxMaL", // Sarah
  },
  {
    id: "robotic",
    name: "Digital Assistant",
    description: "Clear, neutral tone",
    voiceId: "onwK4e9ZLuTAKqWW03F9", // Daniel
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

  const testVoice = async (voiceId: string) => {
    setTestingVoice(voiceId);
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
            text: "This is a sample of the selected voice.",
            voiceId,
          }),
        }
      );

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.onended = () => URL.revokeObjectURL(audioUrl);
        await audio.play();
      }
    } catch (err) {
      console.error("Failed to test voice:", err);
    } finally {
      setTestingVoice(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-xl shadow-2xl max-w-md w-full animate-fade-in">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Voice Settings</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          {/* Voice Enable Toggle */}
          <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
            <div>
              <div className="font-medium text-foreground">Voice Announcements</div>
              <div className="text-sm text-muted-foreground">
                Announce detected items and prices
              </div>
            </div>
            <Button
              variant={voiceEnabled ? "default" : "outline"}
              size="sm"
              onClick={onToggleVoice}
            >
              {voiceEnabled ? "On" : "Off"}
            </Button>
          </div>

          {/* Voice Options */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Select Voice
            </label>
            {VOICE_OPTIONS.map((voice) => (
              <div
                key={voice.id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                  selectedVoice === voice.voiceId
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => onSelectVoice(voice.voiceId)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      selectedVoice === voice.voiceId
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
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
                  {testingVoice === voice.voiceId ? "Playing..." : "Test"}
                </Button>
              </div>
            ))}
          </div>
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
