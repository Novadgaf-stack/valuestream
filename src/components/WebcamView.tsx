import { useRef, useCallback, useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Webcam from "react-webcam";
import HudOverlay from "./HudOverlay";
import TotalValueTicker from "./TotalValueTicker";
import TruthLog, { LogEntry } from "./TruthLog";
import BoundingBox, { DetectedObject } from "./BoundingBox";
import AnalyzingIndicator from "./AnalyzingIndicator";
import BackoffWarning from "./BackoffWarning";
import EvidencePanel, { EvidenceItem } from "./EvidencePanel";
import ShareButton from "./ShareButton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useVoiceNarration } from "@/hooks/useVoiceNarration";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";

const ANALYSIS_INTERVAL = 2000;
const BACKOFF_MIN = 10000;
const BACKOFF_MAX = 30000;

const WebcamView = () => {
  const webcamRef = useRef<Webcam>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { announceDetection, toggleVoice, voiceEnabled, isSpeaking } = useVoiceNarration();

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [totalValue, setTotalValue] = useState(0);
  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // Backoff state
  const [pauseUntil, setPauseUntil] = useState<Date | null>(null);
  const [backoffReason, setBackoffReason] = useState("");

  // Session state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionTitle, setSessionTitle] = useState("Untitled Session");

  // Evidence panel
  const [showEvidence, setShowEvidence] = useState(false);
  const [evidenceItems, setEvidenceItems] = useState<EvidenceItem[]>([]);

  // Add log entry helper
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

  // Create session on mount
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
        addLog("system", "Session initialized");
      }
    };

    createSession();

    // End session on unmount
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

  // Crop object from frame
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

  // Capture frame and send to API
  const analyzeFrame = useCallback(async () => {
    if (!webcamRef.current || isAnalyzing || !sessionId) return;

    // Check backoff
    if (pauseUntil && Date.now() < pauseUntil.getTime()) {
      return;
    }

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    setIsAnalyzing(true);
    addLog("system", "Capturing frame for analysis...");

    try {
      const base64Data = imageSrc.split(",")[1];

      const { data, error } = await supabase.functions.invoke("analyze-frame", {
        body: { image: base64Data },
      });

      if (error) {
        console.error("Edge function error:", error);
        addLog("error", `Analysis failed: ${error.message}`);

        // Apply backoff on error
        const backoffTime = BACKOFF_MIN + Math.random() * (BACKOFF_MAX - BACKOFF_MIN);
        setPauseUntil(new Date(Date.now() + backoffTime));
        setBackoffReason("API error - cooling down");
        addLog("system", `Pausing analysis for ${Math.round(backoffTime / 1000)}s`);

        setIsAnalyzing(false);
        return;
      }

      // Check for rate limit in response
      if (data?.error && (data.status === 429 || data.status === 502)) {
        const backoffTime = BACKOFF_MIN + Math.random() * (BACKOFF_MAX - BACKOFF_MIN);
        setPauseUntil(new Date(Date.now() + backoffTime));
        setBackoffReason("Rate limited - backing off");
        addLog("error", "Rate limit reached");
        setIsAnalyzing(false);
        return;
      }

      if (data?.objects && Array.isArray(data.objects)) {
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
        setTotalValue(total);

        // Log, persist items, and announce
        for (const obj of newObjects) {
          addLog("detection", `Detected: ${obj.object}`, obj.value);
          if (obj.isDamaged) {
            addLog("deduction", `Condition: Damaged - Value adjusted`);
          }
          addLog("confidence", `Confidence: ${Math.round(obj.confidence * 100)}%`);
          
          // Voice announcement
          announceDetection(obj.object, obj.value, obj.isDamaged);

          // Save to database
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

          // Crop and add to evidence
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

        // Update session totals
        await supabase
          .from("audit_sessions")
          .update({ total_value: total, item_count: newObjects.length })
          .eq("id", sessionId);

        // Save value snapshot for replay
        await supabase.from("value_snapshots").insert({
          session_id: sessionId,
          total_value: total,
          item_count: newObjects.length,
        });

        addLog("system", `Scene analysis complete. ${newObjects.length} objects found.`);
      } else {
        addLog("system", "No objects detected in frame.");
        setDetectedObjects([]);
      }
    } catch (err) {
      console.error("Analysis error:", err);
      addLog("error", `Analysis error: ${err instanceof Error ? err.message : "Unknown error"}`);

      // Apply backoff
      const backoffTime = BACKOFF_MIN + Math.random() * (BACKOFF_MAX - BACKOFF_MIN);
      setPauseUntil(new Date(Date.now() + backoffTime));
      setBackoffReason("Unexpected error - cooling down");
    }

    setIsAnalyzing(false);
  }, [isAnalyzing, addLog, sessionId, pauseUntil, cropObject]);

  // Set up interval for frame capture
  useEffect(() => {
    if (!hasPermission || !sessionId) return;

    addLog("system", "ValueStream initialized. Starting real-time analysis...");

    const interval = setInterval(() => {
      analyzeFrame();
    }, ANALYSIS_INTERVAL);

    return () => clearInterval(interval);
  }, [analyzeFrame, hasPermission, sessionId, addLog]);

  // Track container size
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
    addLog("system", "Camera access granted.");
  }, [addLog]);

  const handleUserMediaError = useCallback(
    (error: string | DOMException) => {
      setHasPermission(false);
      addLog("error", `Camera access denied: ${error}`);
    },
    [addLog]
  );

  const handleEndSession = async () => {
    if (sessionId) {
      await supabase
        .from("audit_sessions")
        .update({ is_active: false, ended_at: new Date().toISOString() })
        .eq("id", sessionId);
      toast.success("Session saved");
    }
    navigate("/dashboard");
  };

  return (
    <div ref={containerRef} className="relative w-full h-screen bg-background overflow-hidden">
      {/* Hidden canvas for cropping */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Webcam feed */}
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

      {/* Permission denied overlay */}
      {hasPermission === false && (
        <div className="absolute inset-0 flex items-center justify-center bg-background z-50">
          <div className="glass p-8 text-center max-w-md">
            <div className="text-4xl mb-4">📷</div>
            <h2 className="text-xl text-primary mb-2">Camera Access Required</h2>
            <p className="text-muted-foreground text-sm">
              ValueStream needs camera access to analyze your environment in real-time.
              Please enable camera permissions and refresh the page.
            </p>
          </div>
        </div>
      )}

      {/* HUD Overlay */}
      <HudOverlay />

      {/* Backoff warning */}
      <BackoffWarning pauseUntil={pauseUntil} reason={backoffReason} />

      {/* Total Value Ticker */}
      <TotalValueTicker value={totalValue} isAnalyzing={isAnalyzing} />

      {/* Bounding boxes */}
      {detectedObjects.map((item) => (
        <BoundingBox
          key={item.id}
          item={item}
          containerWidth={containerSize.width}
          containerHeight={containerSize.height}
        />
      ))}

      {/* Evidence Panel */}
      {showEvidence && <EvidencePanel items={evidenceItems} onClose={() => setShowEvidence(false)} />}

      {/* Truth Log */}
      <TruthLog entries={logEntries} />

      {/* Analyzing indicator */}
      <AnalyzingIndicator isActive={isAnalyzing} />

      {/* Controls */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-4">
        <div className="glass px-3 py-2">
          <div className="text-xs text-muted-foreground">
            <div>VALUESTREAM v1.0</div>
            <div className="text-primary">Gemini 3 Vision • 2s Interval</div>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className={`border-primary/50 hover:bg-primary/10 ${voiceEnabled ? "text-primary" : "text-muted-foreground"}`}
          onClick={toggleVoice}
        >
          {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="border-primary/50 text-primary hover:bg-primary/10"
          onClick={() => setShowEvidence(!showEvidence)}
        >
          {showEvidence ? "Hide Evidence" : "Show Evidence"}
        </Button>

        {sessionId && (
          <ShareButton
            sessionId={sessionId}
            sessionTitle={sessionTitle}
            totalValue={totalValue}
            itemCount={detectedObjects.length}
          />
        )}

        <Button
          variant="outline"
          size="sm"
          className="border-destructive/50 text-destructive hover:bg-destructive/10"
          onClick={handleEndSession}
        >
          End Session
        </Button>

        <Link to="/dashboard">
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            Dashboard
          </Button>
        </Link>
      </div>

      {/* Session indicator */}
      <div className="absolute top-4 left-4 z-20 glass px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-hud-price rounded-full animate-pulse" />
          <span className="text-xs text-primary tracking-wider">RECORDING</span>
        </div>
        <div className="text-xs text-muted-foreground mt-1">{sessionTitle}</div>
      </div>
    </div>
  );
};

export default WebcamView;
