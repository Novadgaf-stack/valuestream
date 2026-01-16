import { useRef, useCallback, useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Webcam from "react-webcam";
import TotalValueTicker from "./TotalValueTicker";
import TruthLog, { LogEntry } from "./TruthLog";
import BoundingBox, { DetectedObject } from "./BoundingBox";
import EvidencePanel, { EvidenceItem } from "./EvidencePanel";
import ShareButton from "./ShareButton";
import SessionNotes from "./SessionNotes";
import CollaboratorPanel from "./CollaboratorPanel";
import VoiceSettings from "./VoiceSettings";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useVoiceNarration } from "@/hooks/useVoiceNarration";
import { useRealtimeSession } from "@/hooks/useRealtimeSession";
import { Button } from "@/components/ui/button";
import { 
  Camera, 
  Volume2, 
  VolumeX, 
  Users, 
  StickyNote, 
  Settings,
  Package,
  ArrowLeft,
  Loader2,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

const BACKOFF_MIN = 5000;
const BACKOFF_MAX = 15000;

const WebcamView = () => {
  const webcamRef = useRef<Webcam>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    announceDetection, 
    speak,
    toggleVoice, 
    voiceEnabled, 
    selectedVoice, 
    setVoiceId 
  } = useVoiceNarration();

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [totalValue, setTotalValue] = useState(0);
  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const [pauseUntil, setPauseUntil] = useState<Date | null>(null);
  const [backoffReason, setBackoffReason] = useState("");

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionTitle, setSessionTitle] = useState("Untitled Session");

  const [showEvidence, setShowEvidence] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showCollaborators, setShowCollaborators] = useState(false);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [evidenceItems, setEvidenceItems] = useState<EvidenceItem[]>([]);

  const { connectedUsers } = useRealtimeSession(sessionId);

  const addLog = useCallback((type: LogEntry["type"], message: string, value?: number) => {
    const entry: LogEntry = {
      id: crypto.randomUUID(),
      type,
      message,
      timestamp: new Date(),
      value,
    };
    setLogEntries((prev) => [...prev.slice(-50), entry]);
  }, []);

  // Speak single item (for tap-to-speak)
  const speakItem = useCallback((name: string, value: number) => {
    speak(`${name}, $${value.toLocaleString()}`);
  }, [speak]);

  // Handle bounding box tap
  const handleBoundingBoxTap = useCallback((item: DetectedObject) => {
    speakItem(item.object, item.value);
  }, [speakItem]);

  useEffect(() => {
    if (!user) return;

    const createSession = async () => {
      const { data, error } = await supabase
        .from("audit_sessions")
        .insert({
          user_id: user.id,
          title: `Scan ${new Date().toLocaleDateString()}`,
        })
        .select()
        .single();

      if (error) {
        console.error("Failed to create session:", error);
        addLog("error", "Failed to initialize session");
      } else {
        setSessionId(data.id);
        setSessionTitle(data.title);
        addLog("system", "Session started. Tap Scan to analyze.");
      }
    };

    createSession();

    return () => {
      if (sessionId) {
        supabase
          .from("audit_sessions")
          .update({ is_active: false, ended_at: new Date().toISOString() })
          .eq("id", sessionId)
          .then(() => {});
      }
    };
  }, [user, addLog]);

  const cropObject = useCallback(
    (imageSrc: string, obj: DetectedObject): Promise<string> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve("");
            return;
          }

          const x = (obj.x / 100) * img.width;
          const y = (obj.y / 100) * img.height;
          const w = (obj.w / 100) * img.width;
          const h = (obj.h / 100) * img.height;

          canvas.width = Math.max(w, 50);
          canvas.height = Math.max(h, 50);
          ctx.drawImage(img, x, y, w, h, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.7));
        };
        img.src = imageSrc;
      });
    },
    []
  );

  const scanNow = useCallback(async () => {
    if (!webcamRef.current || isAnalyzing || !sessionId) return;

    if (pauseUntil && Date.now() < pauseUntil.getTime()) {
      const remaining = Math.ceil((pauseUntil.getTime() - Date.now()) / 1000);
      toast.error(`Please wait ${remaining}s before scanning again`);
      return;
    }

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      toast.error("Unable to capture image");
      return;
    }

    setIsAnalyzing(true);
    addLog("system", "Analyzing...");

    try {
      const base64Data = imageSrc.split(",")[1];

      const { data, error } = await supabase.functions.invoke("analyze-frame", {
        body: { image: base64Data },
      });

      if (error) {
        console.error("Edge function error:", error);
        addLog("error", `Analysis failed: ${error.message}`);
        toast.error("Analysis failed. Try again.");

        const backoffTime = BACKOFF_MIN + Math.random() * (BACKOFF_MAX - BACKOFF_MIN);
        setPauseUntil(new Date(Date.now() + backoffTime));
        setBackoffReason("Cooling down");

        setIsAnalyzing(false);
        return;
      }

      if (data?.error && (data.status === 429 || data.status === 502)) {
        const backoffTime = BACKOFF_MIN + Math.random() * (BACKOFF_MAX - BACKOFF_MIN);
        setPauseUntil(new Date(Date.now() + backoffTime));
        setBackoffReason("Rate limited");
        addLog("error", "Rate limit reached");
        toast.error("Too many requests. Please wait.");
        setIsAnalyzing(false);
        return;
      }

      if (data?.objects && Array.isArray(data.objects) && data.objects.length > 0) {
        const newObjects: DetectedObject[] = data.objects.map((obj: any, index: number) => ({
          id: crypto.randomUUID(),
          object: obj.object || "Unknown",
          value: obj.value || 0,
          confidence: obj.confidence || 0.5,
          x: obj.bbox?.[0] ?? obj.coordinates?.[0] ?? 20 + (index * 15) % 60,
          y: obj.bbox?.[1] ?? obj.coordinates?.[1] ?? 20 + (index * 10) % 40,
          w: obj.bbox?.[2] ?? 15,
          h: obj.bbox?.[3] ?? 12,
          isDamaged: obj.damaged || false,
        }));

        setDetectedObjects(newObjects);

        const total = newObjects.reduce((sum, obj) => sum + obj.value, 0);
        setTotalValue((prev) => prev + total);

        for (const obj of newObjects) {
          addLog("detection", `${obj.object}`, obj.value);
          if (obj.isDamaged) {
            addLog("deduction", `Condition: Worn/Damaged`);
          }

          await supabase.from("detected_items").insert({
            session_id: sessionId,
            object_name: obj.object,
            value: obj.value,
            confidence: obj.confidence,
            bbox_x: obj.x,
            bbox_y: obj.y,
            bbox_w: obj.w,
            bbox_h: obj.h,
            is_damaged: obj.isDamaged || false,
          });

          const snapshot = await cropObject(imageSrc, obj);
          setEvidenceItems((prev) => {
            const existing = prev.find((e) => e.objectName === obj.object);
            if (existing) {
              return prev.map((e) =>
                e.objectName === obj.object
                  ? {
                      ...e,
                      value: obj.value,
                      confidence: obj.confidence,
                      confidenceHistory: [...e.confidenceHistory.slice(-9), obj.confidence],
                    }
                  : e
              );
            }
            return [
              ...prev,
              {
                id: obj.id,
                objectName: obj.object,
                value: obj.value,
                confidence: obj.confidence,
                snapshotData: snapshot,
                detectedAt: new Date(),
                confidenceHistory: [obj.confidence],
              },
            ];
          });
        }

        const newTotal = totalValue + total;
        await supabase
          .from("audit_sessions")
          .update({ 
            total_value: newTotal, 
            item_count: evidenceItems.length + newObjects.length 
          })
          .eq("id", sessionId);

        await supabase.from("value_snapshots").insert({
          session_id: sessionId,
          total_value: newTotal,
          item_count: evidenceItems.length + newObjects.length,
        });

        toast.success(`Found ${newObjects.length} item${newObjects.length > 1 ? 's' : ''}`);
        addLog("system", `Found ${newObjects.length} item${newObjects.length > 1 ? 's' : ''}`);
      } else {
        toast.info("No items detected. Try pointing at specific objects.");
        addLog("system", "No items detected in frame.");
        setDetectedObjects([]);
      }
    } catch (err) {
      console.error("Analysis error:", err);
      addLog("error", `Error: ${err instanceof Error ? err.message : "Unknown"}`);
      toast.error("Something went wrong. Try again.");

      const backoffTime = BACKOFF_MIN + Math.random() * (BACKOFF_MAX - BACKOFF_MIN);
      setPauseUntil(new Date(Date.now() + backoffTime));
      setBackoffReason("Error recovery");
    }

    setIsAnalyzing(false);
  }, [isAnalyzing, addLog, sessionId, pauseUntil, cropObject, totalValue, evidenceItems.length]);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const handleUserMedia = useCallback(() => {
    setHasPermission(true);
    addLog("system", "Camera ready.");
  }, [addLog]);

  const handleUserMediaError = useCallback(
    (error: string | DOMException) => {
      setHasPermission(false);
      addLog("error", `Camera denied: ${error}`);
    },
    [addLog]
  );

  const handleEndSession = async () => {
    if (sessionId) {
      await supabase
        .from("audit_sessions")
        .update({ 
          is_active: false, 
          ended_at: new Date().toISOString(),
          total_value: totalValue,
          item_count: evidenceItems.length
        })
        .eq("id", sessionId);
      toast.success("Session saved");
    }
    navigate("/dashboard");
  };

  const canScan = hasPermission && !isAnalyzing && !(pauseUntil && Date.now() < pauseUntil.getTime());

  return (
    <div ref={containerRef} className="relative w-full h-screen bg-background overflow-hidden">
      <canvas ref={canvasRef} className="hidden" />

      <Webcam
        ref={webcamRef}
        audio={false}
        screenshotFormat="image/jpeg"
        screenshotQuality={0.8}
        className="absolute inset-0 w-full h-full object-cover"
        videoConstraints={{
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        }}
        onUserMedia={handleUserMedia}
        onUserMediaError={handleUserMediaError}
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />

      {/* Permission denied */}
      {hasPermission === false && (
        <div className="absolute inset-0 flex items-center justify-center bg-background z-50 p-4">
          <div className="glass-premium rounded-2xl p-8 text-center max-w-md animate-fade-in">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Camera className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Camera Access Required</h2>
            <p className="text-muted-foreground text-sm mb-6">
              To scan and identify items, we need access to your camera.
            </p>
            <Button onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </div>
        </div>
      )}

      {/* Top Header */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4">
        <div className="flex items-center justify-between">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon" className="glass-premium rounded-full">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            <div className="glass-premium px-3 py-1.5 rounded-full flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isAnalyzing ? 'bg-primary animate-pulse' : 'bg-green-500'}`} />
              <span className="text-sm font-medium text-foreground">
                {isAnalyzing ? 'Scanning...' : 'Ready'}
              </span>
            </div>

            <Button 
              variant="ghost" 
              size="icon" 
              className="glass-premium rounded-full"
              onClick={toggleVoice}
            >
              {voiceEnabled ? (
                <Volume2 className="w-5 h-5 text-primary" />
              ) : (
                <VolumeX className="w-5 h-5 text-muted-foreground" />
              )}
            </Button>

            <Button 
              variant="ghost" 
              size="icon" 
              className="glass-premium rounded-full"
              onClick={() => setShowVoiceSettings(true)}
            >
              <Settings className="w-5 h-5 text-foreground" />
            </Button>
          </div>
        </div>
      </div>

      {/* Total Value */}
      <TotalValueTicker value={totalValue} isAnalyzing={isAnalyzing} />

      {/* Bounding boxes - tap to speak */}
      {detectedObjects.map((item) => (
        <BoundingBox
          key={item.id}
          item={item}
          containerWidth={containerSize.width}
          containerHeight={containerSize.height}
          onTap={handleBoundingBoxTap}
        />
      ))}

      {/* Backoff Warning */}
      {pauseUntil && Date.now() < pauseUntil.getTime() && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-30">
          <div className="glass-premium bg-amber-500/10 border-amber-500/30 px-4 py-2 rounded-full flex items-center gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-amber-600 dark:text-amber-400">{backoffReason}</span>
          </div>
        </div>
      )}

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-4 pb-8">
        <div className="max-w-lg mx-auto">
          {/* Main Scan Button */}
          <div className="flex items-center justify-center mb-4">
            <button
              onClick={scanNow}
              disabled={!canScan}
              className={`
                w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all
                ${canScan 
                  ? 'bg-primary hover:bg-primary/90 active:scale-95 scan-button-pulse' 
                  : 'bg-muted cursor-not-allowed'
                }
              `}
            >
              {isAnalyzing ? (
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              ) : (
                <Camera className="w-8 h-8 text-white" />
              )}
            </button>
          </div>

          {/* Secondary Controls */}
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              className="glass-premium border-0"
              onClick={() => setShowEvidence(true)}
            >
              <Package className="w-4 h-4 mr-2" />
              Items ({evidenceItems.length})
            </Button>

            <Button
              variant="secondary"
              size="sm"
              className="glass-premium border-0"
              onClick={() => setShowNotes(true)}
            >
              <StickyNote className="w-4 h-4 mr-2" />
              Notes
            </Button>

            {sessionId && (
              <ShareButton
                sessionId={sessionId}
                sessionTitle={sessionTitle}
                totalValue={totalValue}
                itemCount={evidenceItems.length}
              />
            )}

            <Button
              variant="secondary"
              size="sm"
              className="glass-premium border-0"
              onClick={() => setShowCollaborators(true)}
            >
              <Users className="w-4 h-4" />
              {connectedUsers.length > 1 && (
                <span className="ml-1">{connectedUsers.length}</span>
              )}
            </Button>
          </div>

          {/* End Session */}
          <div className="flex justify-center mt-4">
            <Button
              variant="outline"
              size="sm"
              className="glass-premium text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={handleEndSession}
            >
              End Session
            </Button>
          </div>
        </div>
      </div>

      {/* Truth Log - Desktop */}
      <div className="hidden lg:block absolute left-4 top-24 bottom-32 w-80 z-10">
        <TruthLog entries={logEntries} />
      </div>

      {/* Evidence Panel Modal */}
      {showEvidence && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end md:items-center justify-center">
          <div className="bg-card w-full max-w-2xl max-h-[80vh] rounded-t-2xl md:rounded-2xl overflow-hidden animate-slide-up">
            <EvidencePanel 
              items={evidenceItems} 
              onClose={() => setShowEvidence(false)}
              onSpeakItem={speakItem}
            />
          </div>
        </div>
      )}

      {/* Session Notes Modal */}
      {showNotes && sessionId && (
        <SessionNotes
          sessionId={sessionId}
          onClose={() => setShowNotes(false)}
        />
      )}

      {/* Collaborator Panel Modal */}
      {showCollaborators && sessionId && (
        <CollaboratorPanel
          sessionId={sessionId}
          isOwner={true}
          onClose={() => setShowCollaborators(false)}
        />
      )}

      {/* Voice Settings Modal */}
      {showVoiceSettings && (
        <VoiceSettings
          selectedVoice={selectedVoice}
          onSelectVoice={setVoiceId}
          voiceEnabled={voiceEnabled}
          onToggleVoice={toggleVoice}
          onClose={() => setShowVoiceSettings(false)}
        />
      )}
    </div>
  );
};

export default WebcamView;
