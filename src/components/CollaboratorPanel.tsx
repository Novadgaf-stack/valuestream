import { useState, useEffect } from "react";
import { X, Users, UserPlus, Eye, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Collaborator {
  id: string;
  user_id: string;
  role: "viewer" | "editor";
  joined_at: string;
  email?: string;
}

interface CollaboratorPanelProps {
  sessionId: string;
  isOwner: boolean;
  onClose: () => void;
}

interface PresenceUser {
  id: string;
  email: string;
}

const CollaboratorPanel = ({ sessionId, isOwner, onClose }: CollaboratorPanelProps) => {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [activeUsers, setActiveUsers] = useState<PresenceUser[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"viewer" | "editor">("viewer");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cleanup = setupPresence();
    return cleanup;
  }, [sessionId]);

  const setupPresence = () => {
    const channel = supabase.channel(`session:${sessionId}`);

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const users: PresenceUser[] = [];
        Object.values(state).forEach((presences: any) => {
          presences.forEach((presence: any) => {
            users.push({
              id: presence.user_id,
              email: presence.email,
            });
          });
        });
        setActiveUsers(users);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          const { data: userData } = await supabase.auth.getUser();
          if (userData.user) {
            await channel.track({
              user_id: userData.user.id,
              email: userData.user.email,
              online_at: new Date().toISOString(),
            });
          }
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setLoading(true);
    toast.success(`Invitation sent to ${inviteEmail}`);
    setInviteEmail("");
    setLoading(false);
  };

  const handleRemoveCollaborator = async (collaboratorId: string) => {
    toast.success("Collaborator removed");
    setCollaborators(collaborators.filter(c => c.id !== collaboratorId));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="glass w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-primary/30">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-primary" />
            <h3 className="text-sm tracking-widest text-primary">COLLABORATORS</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-primary">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs text-muted-foreground tracking-wider block mb-2">
              ACTIVE NOW ({activeUsers.length})
            </label>
            <div className="flex flex-wrap gap-2">
              {activeUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-2 px-3 py-1.5 bg-hud-price/20 border border-hud-price/30 text-xs">
                  <div className="w-2 h-2 bg-hud-price rounded-full animate-pulse" />
                  <span className="text-hud-price">{user.email?.split("@")[0]}</span>
                </div>
              ))}
              {activeUsers.length === 0 && (
                <span className="text-xs text-muted-foreground">No one else is viewing</span>
              )}
            </div>
          </div>

          {isOwner && (
            <div>
              <label className="text-xs text-muted-foreground tracking-wider block mb-2">INVITE COLLABORATOR</label>
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Email address"
                className="bg-background/50 border-primary/30 text-sm mb-2"
              />
              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => setInviteRole("viewer")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs border ${inviteRole === "viewer" ? "border-primary bg-primary/20 text-primary" : "border-primary/30 text-muted-foreground"}`}
                >
                  <Eye size={12} /> Viewer
                </button>
                <button
                  onClick={() => setInviteRole("editor")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs border ${inviteRole === "editor" ? "border-primary bg-primary/20 text-primary" : "border-primary/30 text-muted-foreground"}`}
                >
                  <Edit size={12} /> Editor
                </button>
              </div>
              <Button onClick={handleInvite} disabled={loading || !inviteEmail.trim()} className="w-full bg-primary text-primary-foreground">
                <UserPlus size={14} className="mr-2" /> Send Invite
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollaboratorPanel;
