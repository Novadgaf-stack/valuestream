import { useRef, useCallback, useEffect, useState } from "react";
import Webcam from "react-webcam";
import HudOverlay from "./HudOverlay";
import TotalValueTicker from "./TotalValueTicker";
import TruthLog, { LogEntry } from "./TruthLog";
import BoundingBox, { DetectedObject } from "./BoundingBox";
import AnalyzingIndicator from "./AnalyzingIndicator";
import { supabase } from "@/integrations/supabase/client";

const WebcamView = () => {
  const webcamRef = useRef<Webcam>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [totalValue, setTotalValue] = useState(0);
  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // Add log entry helper
  const addLog = useCallback((type: LogEntry["type"], message: string, value?: number) => {
    const entry: LogEntry = {
      id: crypto.randomUUID(),
      type,
      message,
      timestamp: new Date(),
      value,
    };
    setLogEntries((prev) => [...prev.slice(-50), entry]); // Keep last 50 entries
  }, []);

  // Capture frame and send to Gemini
  const analyzeFrame = useCallback(async () => {
    if (!webcamRef.current || isAnalyzing) return;

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    setIsAnalyzing(true);
    addLog("system", "Capturing frame for analysis...");

    try {
      // Extract base64 data (remove data URL prefix)
      const base64Data = imageSrc.split(",")[1];

      const { data, error } = await supabase.functions.invoke("analyze-frame", {
        body: { image: base64Data },
      });

      if (error) {
        console.error("Edge function error:", error);
        addLog("error", `Analysis failed: ${error.message}`);
        setIsAnalyzing(false);
        return;
      }

      if (data?.objects && Array.isArray(data.objects)) {
        const newObjects: DetectedObject[] = data.objects.map((obj: any, index: number) => ({
          id: crypto.randomUUID(),
          object: obj.object || "Unknown",
          value: obj.value || 0,
          confidence: obj.confidence || 0.5,
          x: obj.coordinates?.[0] || 20 + (index * 20) % 60,
          y: obj.coordinates?.[1] || 30 + (index * 15) % 40,
          isDamaged: obj.damaged || false,
        }));

        setDetectedObjects(newObjects);

        // Calculate total value
        const total = newObjects.reduce((sum, obj) => sum + obj.value, 0);
        setTotalValue(total);

        // Log each detection
        newObjects.forEach((obj) => {
          addLog("detection", `Detected: ${obj.object}`, obj.value);
          if (obj.isDamaged) {
            addLog("deduction", `Condition: Damaged - Value adjusted`);
          }
          addLog("confidence", `Confidence: ${Math.round(obj.confidence * 100)}%`);
        });

        addLog("system", `Scene analysis complete. ${newObjects.length} objects found.`);
      } else {
        addLog("system", "No objects detected in frame.");
        setDetectedObjects([]);
      }
    } catch (err) {
      console.error("Analysis error:", err);
      addLog("error", `Analysis error: ${err instanceof Error ? err.message : "Unknown error"}`);
    }

    setIsAnalyzing(false);
  }, [isAnalyzing, addLog]);

  // Set up interval for frame capture
  useEffect(() => {
    if (!hasPermission) return;

    addLog("system", "ValueStream initialized. Starting real-time analysis...");
    
    const interval = setInterval(() => {
      analyzeFrame();
    }, 2000); // Capture every 2 seconds

    return () => clearInterval(interval);
  }, [analyzeFrame, hasPermission, addLog]);

  // Track container size for bounding box positioning
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

  // Handle webcam permission
  const handleUserMedia = useCallback(() => {
    setHasPermission(true);
    addLog("system", "Camera access granted.");
  }, [addLog]);

  const handleUserMediaError = useCallback((error: string | DOMException) => {
    setHasPermission(false);
    addLog("error", `Camera access denied: ${error}`);
  }, [addLog]);

  return (
    <div ref={containerRef} className="relative w-full h-screen bg-background overflow-hidden">
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

      {/* Total Value Ticker */}
      <TotalValueTicker value={totalValue} isAnalyzing={isAnalyzing} />

      {/* Bounding boxes for detected objects */}
      {detectedObjects.map((item) => (
        <BoundingBox
          key={item.id}
          item={item}
          containerWidth={containerSize.width}
          containerHeight={containerSize.height}
        />
      ))}

      {/* Truth Log */}
      <TruthLog entries={logEntries} />

      {/* Analyzing indicator */}
      <AnalyzingIndicator isActive={isAnalyzing} />

      {/* System info */}
      <div className="absolute bottom-4 left-4 z-20 glass px-3 py-2">
        <div className="text-xs text-muted-foreground">
          <div>VALUESTREAM v1.0</div>
          <div className="text-primary">Gemini 3 Vision • 2s Interval</div>
        </div>
      </div>
    </div>
  );
};

export default WebcamView;
