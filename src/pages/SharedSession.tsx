import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Share2, ArrowLeft, ExternalLink } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface Session {
  id: string;
  title: string;
  total_value: number;
  item_count: number;
  started_at: string;
  ended_at: string | null;
}

interface DetectedItem {
  id: string;
  object_name: string;
  value: number;
  confidence: number;
  is_damaged: boolean;
  detected_at: string;
}

interface Snapshot {
  id: string;
  total_value: number;
  item_count: number;
  captured_at: string;
}

const SharedSession = () => {
  const { sessionId } = useParams();
  const [session, setSession] = useState<Session | null>(null);
  const [items, setItems] = useState<DetectedItem[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      if (!sessionId) return;

      const { data: sessionData, error: sessionError } = await supabase
        .from("audit_sessions")
        .select("*")
        .eq("id", sessionId)
        .eq("is_public", true)
        .single();

      if (sessionError || !sessionData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setSession(sessionData);

      // Fetch items and snapshots
      const [itemsRes, snapshotsRes] = await Promise.all([
        supabase
          .from("detected_items")
          .select("*")
          .eq("session_id", sessionId)
          .order("detected_at", { ascending: true }),
        supabase
          .from("value_snapshots")
          .select("*")
          .eq("session_id", sessionId)
          .order("captured_at", { ascending: true }),
      ]);

      setItems(itemsRes.data || []);
      setSnapshots(snapshotsRes.data || []);
      setLoading(false);
    };

    fetchSession();
  }, [sessionId]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({
        title: session?.title || "ValueStream Scan",
        text: `Check out my scan: $${session?.total_value?.toLocaleString()} in ${session?.item_count} items!`,
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary animate-pulse text-glow">Loading shared session...</div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
        <div className="glass p-8 text-center max-w-md">
          <h1 className="text-2xl text-primary mb-4 text-glow">Session Not Found</h1>
          <p className="text-muted-foreground mb-6">
            This session doesn't exist or is not publicly shared.
          </p>
          <Link to="/">
            <Button variant="outline" className="border-primary text-primary">
              Go Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const chartData = snapshots.map((s) => ({
    time: new Date(s.captured_at).toLocaleTimeString(),
    value: s.total_value,
    items: s.item_count,
  }));

  return (
    <div className="min-h-screen bg-background hud-grid">
      {/* Header */}
      <header className="glass border-b border-primary/30 p-4">
        <div className="container mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-primary hover:text-primary/80">
            <ArrowLeft size={20} />
            <span className="text-sm">ValueStream</span>
          </Link>
          <Button
            onClick={handleShare}
            variant="outline"
            size="sm"
            className="border-primary/50 text-primary"
          >
            <Share2 size={16} className="mr-2" />
            Share
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Session Header */}
        <div className="glass p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl text-primary text-glow mb-2">{session?.title}</h1>
              <p className="text-muted-foreground text-sm">
                {new Date(session?.started_at || "").toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl text-hud-price text-glow font-mono">
                ${session?.total_value?.toLocaleString()}
              </div>
              <div className="text-muted-foreground text-sm">
                {session?.item_count} items detected
              </div>
            </div>
          </div>
        </div>

        {/* Value Chart */}
        {chartData.length > 1 && (
          <div className="glass p-6 mb-6">
            <h2 className="text-sm tracking-[0.2em] text-primary mb-4">VALUE OVER TIME</h2>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis
                    dataKey="time"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--primary) / 0.3)",
                      borderRadius: "4px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--hud-price))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Items List */}
        <div className="glass p-6">
          <h2 className="text-sm tracking-[0.2em] text-primary mb-4">DETECTED ITEMS</h2>
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 border border-primary/10 hover:bg-primary/5"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      item.is_damaged ? "bg-warning" : "bg-hud-price"
                    }`}
                  />
                  <div>
                    <div className="text-foreground">{item.object_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {Math.round(item.confidence * 100)}% confidence
                      {item.is_damaged && " • Damaged"}
                    </div>
                  </div>
                </div>
                <div className="text-hud-price font-mono text-lg">
                  ${item.value.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <Link to="/auth">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <ExternalLink size={16} className="mr-2" />
              Start Your Own Scan
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default SharedSession;
