import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { toast } from "sonner";
import { Menu, X, Tag } from "lucide-react";

interface AuditSession {
  id: string;
  title: string;
  started_at: string;
  ended_at: string | null;
  total_value: number;
  item_count: number;
  is_active: boolean;
  tags?: string[];
  notes?: string;
}

const Dashboard = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<AuditSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [filterTag, setFilterTag] = useState<string | null>(null);

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
        tags: session.tags,
        notes: session.notes,
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

  // Get all unique tags
  const allTags = Array.from(new Set(sessions.flatMap(s => (s.tags as string[]) || [])));
  
  // Filter sessions by tag
  const filteredSessions = filterTag 
    ? sessions.filter(s => (s.tags as string[] || []).includes(filterTag))
    : sessions;

  const totalValue = filteredSessions.reduce((sum, s) => sum + Number(s.total_value), 0);
  const totalItems = filteredSessions.reduce((sum, s) => sum + s.item_count, 0);

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
      <nav className="relative z-20 flex items-center justify-between p-4 md:p-6 border-b border-primary/20">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-3 h-3 bg-primary animate-pulse" />
          <span className="text-sm md:text-lg tracking-[0.3em] text-primary text-glow">VALUESTREAM</span>
        </Link>
        
        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-4">
          <Link to="/scanner">
            <Button className="bg-primary text-primary-foreground tracking-wider">
              NEW SCAN
            </Button>
          </Link>
          <Button variant="ghost" onClick={handleSignOut} className="text-muted-foreground">
            Sign Out
          </Button>
        </div>

        {/* Mobile menu button */}
        <button 
          className="md:hidden text-primary p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-background/95 pt-16">
          <div className="flex flex-col gap-2 p-4">
            <Link to="/scanner" onClick={() => setMobileMenuOpen(false)}>
              <Button className="w-full bg-primary text-primary-foreground">
                NEW SCAN
              </Button>
            </Link>
            <Button variant="ghost" onClick={handleSignOut} className="w-full text-muted-foreground">
              Sign Out
            </Button>
          </div>
        </div>
      )}

      <main className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        {/* Header */}
        <div className="mb-8 md:mb-12">
          <h1 className="text-2xl md:text-3xl lg:text-4xl text-foreground mb-2">MY AUDITS</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Welcome back, <span className="text-primary">{user?.email}</span>
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 md:gap-6 mb-8 md:mb-12">
          <div className="glass p-4 md:p-6">
            <div className="text-[10px] md:text-xs tracking-wider text-muted-foreground mb-1 md:mb-2">TOTAL SESSIONS</div>
            <div className="text-2xl md:text-3xl text-primary text-glow font-mono">{filteredSessions.length}</div>
          </div>
          <div className="glass p-4 md:p-6">
            <div className="text-[10px] md:text-xs tracking-wider text-muted-foreground mb-1 md:mb-2">TOTAL VALUE</div>
            <div className="text-2xl md:text-3xl text-hud-price text-glow font-mono">${totalValue.toLocaleString()}</div>
          </div>
          <div className="glass p-4 md:p-6">
            <div className="text-[10px] md:text-xs tracking-wider text-muted-foreground mb-1 md:mb-2">ITEMS DETECTED</div>
            <div className="text-2xl md:text-3xl text-foreground font-mono">{totalItems.toLocaleString()}</div>
          </div>
        </div>

        {/* Tag filters */}
        {allTags.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            <button
              onClick={() => setFilterTag(null)}
              className={`px-3 py-1 text-xs border transition-colors ${
                filterTag === null
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-primary/30 text-muted-foreground hover:border-primary"
              }`}
            >
              All
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setFilterTag(tag)}
                className={`px-3 py-1 text-xs border transition-colors flex items-center gap-1 ${
                  filterTag === tag
                    ? "border-primary bg-primary/20 text-primary"
                    : "border-primary/30 text-muted-foreground hover:border-primary"
                }`}
              >
                <Tag size={10} />
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Sessions list */}
        <div className="glass">
          <div className="p-3 md:p-4 border-b border-primary/30 flex items-center justify-between">
            <span className="text-xs tracking-[0.2em] text-primary">SESSION HISTORY</span>
            <span className="text-xs text-muted-foreground">{filteredSessions.length} records</span>
          </div>

          {loadingSessions ? (
            <div className="p-8 md:p-12 text-center text-muted-foreground animate-pulse">
              Loading sessions...
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="p-8 md:p-12 text-center">
              <div className="text-muted-foreground mb-4 text-sm">No audit sessions yet</div>
              <Link to="/scanner">
                <Button className="bg-primary text-primary-foreground">START YOUR FIRST SCAN</Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-primary/10">
              {filteredSessions.map((session) => (
                <div key={session.id} className="p-3 md:p-4 hover:bg-primary/5 transition-colors">
                  {/* Mobile layout */}
                  <div className="md:hidden">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-sm text-foreground">{session.title}</span>
                          {session.is_active && (
                            <span className="text-[10px] px-2 py-0.5 bg-primary/20 text-primary rounded">ACTIVE</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(session.started_at), "MMM d, yyyy")}
                        </div>
                        {session.tags && (session.tags as string[]).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(session.tags as string[]).map(tag => (
                              <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary border border-primary/20">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-lg text-hud-price text-glow font-mono">
                          ${Number(session.total_value).toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {session.item_count} items
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Link to={`/replay/${session.id}`} className="flex-1">
                        <Button variant="ghost" size="sm" className="w-full text-primary hover:bg-primary/10 text-xs">
                          Replay
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 text-muted-foreground hover:bg-primary/10 text-xs"
                        onClick={() => handleExportSession(session)}
                      >
                        Export
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10 text-xs"
                        onClick={() => handleDeleteSession(session.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>

                  {/* Desktop layout */}
                  <div className="hidden md:flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-foreground">{session.title}</span>
                        {session.is_active && (
                          <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded">ACTIVE</span>
                        )}
                        {session.tags && (session.tags as string[]).length > 0 && (
                          <div className="flex gap-1">
                            {(session.tags as string[]).map(tag => (
                              <span key={tag} className="text-xs px-2 py-0.5 bg-primary/10 text-primary border border-primary/20">
                                {tag}
                              </span>
                            ))}
                          </div>
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
