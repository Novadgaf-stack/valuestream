import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface AuditSession {
  id: string;
  title: string;
  started_at: string;
  ended_at: string | null;
  total_value: number;
  item_count: number;
}

interface DetectedItem {
  id: string;
  object_name: string;
  value: number;
  confidence: number;
  is_damaged: boolean;
  detected_at: string;
}

interface ValueSnapshot {
  id: string;
  total_value: number;
  item_count: number;
  captured_at: string;
}

const Replay = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [session, setSession] = useState<AuditSession | null>(null);
  const [items, setItems] = useState<DetectedItem[]>([]);
  const [snapshots, setSnapshots] = useState<ValueSnapshot[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && sessionId) {
      fetchSessionData();
    }
  }, [user, sessionId]);

  const fetchSessionData = async () => {
    // Fetch session
    const { data: sessionData, error: sessionError } = await supabase
      .from("audit_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (sessionError || !sessionData) {
      navigate("/dashboard");
      return;
    }
    setSession(sessionData);

    // Fetch items
    const { data: itemsData } = await supabase
      .from("detected_items")
      .select("*")
      .eq("session_id", sessionId)
      .order("detected_at", { ascending: true });
    setItems(itemsData || []);

    // Fetch snapshots
    const { data: snapshotsData } = await supabase
      .from("value_snapshots")
      .select("*")
      .eq("session_id", sessionId)
      .order("captured_at", { ascending: true });
    setSnapshots(snapshotsData || []);

    setLoadingData(false);
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary animate-pulse">Loading session...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Session not found</div>
      </div>
    );
  }

  // Prepare chart data
  const chartData = snapshots.map((s) => ({
    time: format(new Date(s.captured_at), "HH:mm:ss"),
    value: Number(s.total_value),
    items: s.item_count,
  }));

  return (
    <div className="min-h-screen bg-background">
      {/* Background */}
      <div className="absolute inset-0 hud-grid opacity-5" />

      {/* Nav */}
      <nav className="relative z-20 flex items-center justify-between p-6 border-b border-primary/20">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-3 h-3 bg-primary animate-pulse" />
          <span className="text-lg tracking-[0.3em] text-primary text-glow">VALUESTREAM</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/dashboard">
            <Button variant="ghost" className="text-muted-foreground">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Session header */}
        <div className="glass p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl text-foreground mb-1">{session.title}</h1>
              <div className="text-sm text-muted-foreground">
                {format(new Date(session.started_at), "MMMM d, yyyy 'at' h:mm a")}
                {session.ended_at && ` — ${format(new Date(session.ended_at), "h:mm a")}`}
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl text-hud-price text-glow font-mono">
                ${Number(session.total_value).toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">
                {session.item_count} items detected
              </div>
            </div>
          </div>
        </div>

        {/* Value over time chart */}
        <div className="glass p-6 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-2 h-2 bg-hud-price rounded-full" />
            <span className="text-xs tracking-[0.2em] text-primary">VALUE OVER TIME</span>
          </div>

          {chartData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis
                    dataKey="time"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    tickLine={false}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--primary) / 0.3)",
                      borderRadius: "4px",
                    }}
                    labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, "Value"]}
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
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              No timeline data available
            </div>
          )}
        </div>

        {/* Items list */}
        <div className="glass">
          <div className="p-4 border-b border-primary/30">
            <span className="text-xs tracking-[0.2em] text-primary">DETECTED ITEMS</span>
          </div>

          {items.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              No items were recorded in this session
            </div>
          ) : (
            <div className="divide-y divide-primary/10 max-h-96 overflow-y-auto">
              {items.map((item) => (
                <div key={item.id} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-foreground">{item.object_name}</span>
                      {item.is_damaged && (
                        <span className="text-xs px-2 py-0.5 bg-warning/20 text-warning rounded">
                          DAMAGED
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(item.detected_at), "HH:mm:ss")}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg text-hud-price text-glow font-mono">
                      ${Number(item.value).toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {Math.round(Number(item.confidence) * 100)}% confidence
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Replay;
