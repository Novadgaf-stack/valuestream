import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { toast } from "sonner";

interface AuditSession {
  id: string;
  title: string;
  started_at: string;
  ended_at: string | null;
  total_value: number;
  item_count: number;
  is_active: boolean;
}

const Dashboard = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<AuditSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchSessions();
    }
  }, [user]);

  const fetchSessions = async () => {
    const { data, error } = await supabase
      .from("audit_sessions")
      .select("*")
      .order("started_at", { ascending: false });

    if (error) {
      console.error("Error fetching sessions:", error);
      toast.error("Failed to load sessions");
    } else {
      setSessions(data || []);
    }
    setLoadingSessions(false);
  };

  const handleDeleteSession = async (sessionId: string) => {
    const { error } = await supabase
      .from("audit_sessions")
      .delete()
      .eq("id", sessionId);

    if (error) {
      toast.error("Failed to delete session");
    } else {
      toast.success("Session deleted");
      setSessions(sessions.filter((s) => s.id !== sessionId));
    }
  };

  const handleExportSession = async (session: AuditSession) => {
    // Fetch items for this session
    const { data: items } = await supabase
      .from("detected_items")
      .select("*")
      .eq("session_id", session.id);

    const exportData = {
      session: {
        title: session.title,
        started_at: session.started_at,
        ended_at: session.ended_at,
        total_value: session.total_value,
        item_count: session.item_count,
      },
      items: items || [],
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `valuestream-${session.title.replace(/\s+/g, "-")}-${format(new Date(session.started_at), "yyyy-MM-dd")}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export downloaded");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const totalValue = sessions.reduce((sum, s) => sum + Number(s.total_value), 0);
  const totalItems = sessions.reduce((sum, s) => sum + s.item_count, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary animate-pulse">Loading...</div>
      </div>
    );
  }

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
          <Link to="/scanner">
            <Button className="bg-primary text-primary-foreground tracking-wider">
              NEW SCAN
            </Button>
          </Link>
          <Button variant="ghost" onClick={handleSignOut} className="text-muted-foreground">
            Sign Out
          </Button>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl text-foreground mb-2">MY AUDITS</h1>
          <p className="text-muted-foreground">
            Welcome back, <span className="text-primary">{user?.email}</span>
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-12">
          <div className="glass p-6">
            <div className="text-xs tracking-wider text-muted-foreground mb-2">TOTAL SESSIONS</div>
            <div className="text-3xl text-primary text-glow font-mono">{sessions.length}</div>
          </div>
          <div className="glass p-6">
            <div className="text-xs tracking-wider text-muted-foreground mb-2">TOTAL VALUE SCANNED</div>
            <div className="text-3xl text-hud-price text-glow font-mono">${totalValue.toLocaleString()}</div>
          </div>
          <div className="glass p-6">
            <div className="text-xs tracking-wider text-muted-foreground mb-2">ITEMS DETECTED</div>
            <div className="text-3xl text-foreground font-mono">{totalItems.toLocaleString()}</div>
          </div>
        </div>

        {/* Sessions list */}
        <div className="glass">
          <div className="p-4 border-b border-primary/30 flex items-center justify-between">
            <span className="text-xs tracking-[0.2em] text-primary">SESSION HISTORY</span>
            <span className="text-xs text-muted-foreground">{sessions.length} records</span>
          </div>

          {loadingSessions ? (
            <div className="p-12 text-center text-muted-foreground animate-pulse">
              Loading sessions...
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-muted-foreground mb-4">No audit sessions yet</div>
              <Link to="/scanner">
                <Button className="bg-primary text-primary-foreground">START YOUR FIRST SCAN</Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-primary/10">
              {sessions.map((session) => (
                <div key={session.id} className="p-4 flex items-center justify-between hover:bg-primary/5 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-foreground">{session.title}</span>
                      {session.is_active && (
                        <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded">ACTIVE</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(session.started_at), "MMM d, yyyy 'at' h:mm a")}
                      {session.ended_at && ` — ${format(new Date(session.ended_at), "h:mm a")}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <div className="text-lg text-hud-price text-glow font-mono">
                        ${Number(session.total_value).toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {session.item_count} items
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link to={`/replay/${session.id}`}>
                        <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10">
                          Replay
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:bg-primary/10"
                        onClick={() => handleExportSession(session)}
                      >
                        Export
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteSession(session.id)}
                      >
                        Delete
                      </Button>
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

export default Dashboard;
