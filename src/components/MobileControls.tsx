import { useState } from "react";
import { 
  Menu, X, Volume2, VolumeX, Eye, EyeOff, 
  Share2, Users, StickyNote, Square, Home, Settings
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MobileControlsProps {
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  showEvidence: boolean;
  onToggleEvidence: () => void;
  onShare: () => void;
  onCollaborators: () => void;
  onNotes: () => void;
  onEndSession: () => void;
  sessionTitle: string;
  connectedUsers: number;
}

const MobileControls = ({
  voiceEnabled,
  onToggleVoice,
  showEvidence,
  onToggleEvidence,
  onShare,
  onCollaborators,
  onNotes,
  onEndSession,
  sessionTitle,
  connectedUsers,
}: MobileControlsProps) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="fixed top-0 left-0 right-0 z-30 md:hidden glass border-b border-primary/30">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-hud-price rounded-full animate-pulse" />
            <span className="text-xs text-primary tracking-wider truncate max-w-[140px]">
              {sessionTitle}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {connectedUsers > 1 && (
              <div className="flex items-center gap-1 text-xs text-hud-price">
                <Users size={12} />
                <span>{connectedUsers}</span>
              </div>
            )}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 text-primary"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-background/90 backdrop-blur-md" onClick={() => setMenuOpen(false)} />
          <div className="absolute top-14 right-0 w-64 glass border-l border-primary/30 h-[calc(100%-56px)]">
            <div className="p-4 space-y-2">
              <MobileMenuItem
                icon={voiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                label={voiceEnabled ? "Voice On" : "Voice Off"}
                onClick={() => { onToggleVoice(); }}
                active={voiceEnabled}
              />
              
              <MobileMenuItem
                icon={showEvidence ? <EyeOff size={18} /> : <Eye size={18} />}
                label={showEvidence ? "Hide Evidence" : "Show Evidence"}
                onClick={() => { onToggleEvidence(); setMenuOpen(false); }}
              />
              
              <MobileMenuItem
                icon={<Share2 size={18} />}
                label="Share Session"
                onClick={() => { onShare(); setMenuOpen(false); }}
              />
              
              <MobileMenuItem
                icon={<Users size={18} />}
                label="Collaborators"
                onClick={() => { onCollaborators(); setMenuOpen(false); }}
                badge={connectedUsers > 1 ? connectedUsers : undefined}
              />
              
              <MobileMenuItem
                icon={<StickyNote size={18} />}
                label="Session Notes"
                onClick={() => { onNotes(); setMenuOpen(false); }}
              />
              
              <div className="border-t border-primary/20 my-4" />
              
              <Link to="/dashboard" onClick={() => setMenuOpen(false)}>
                <MobileMenuItem
                  icon={<Home size={18} />}
                  label="Dashboard"
                  onClick={() => {}}
                />
              </Link>
              
              <MobileMenuItem
                icon={<Square size={18} />}
                label="End Session"
                onClick={() => { onEndSession(); setMenuOpen(false); }}
                variant="destructive"
              />
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Quick Actions */}
      <div className="fixed bottom-0 left-0 right-0 z-30 md:hidden glass border-t border-primary/30">
        <div className="grid grid-cols-4 gap-1 p-2">
          <QuickAction
            icon={voiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            label="Voice"
            onClick={onToggleVoice}
            active={voiceEnabled}
          />
          <QuickAction
            icon={<Eye size={18} />}
            label="Evidence"
            onClick={onToggleEvidence}
            active={showEvidence}
          />
          <QuickAction
            icon={<Share2 size={18} />}
            label="Share"
            onClick={onShare}
          />
          <QuickAction
            icon={<Square size={18} />}
            label="End"
            onClick={onEndSession}
            variant="destructive"
          />
        </div>
      </div>
    </>
  );
};

interface MobileMenuItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  badge?: number;
  variant?: "default" | "destructive";
}

const MobileMenuItem = ({ icon, label, onClick, active, badge, variant = "default" }: MobileMenuItemProps) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors",
      variant === "destructive" 
        ? "text-destructive hover:bg-destructive/10" 
        : active 
          ? "text-primary bg-primary/10" 
          : "text-muted-foreground hover:text-primary hover:bg-primary/5"
    )}
  >
    {icon}
    <span className="flex-1 text-left">{label}</span>
    {badge && (
      <span className="text-xs bg-hud-price/20 text-hud-price px-2 py-0.5 rounded">
        {badge}
      </span>
    )}
  </button>
);

interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  variant?: "default" | "destructive";
}

const QuickAction = ({ icon, label, onClick, active, variant = "default" }: QuickActionProps) => (
  <button
    onClick={onClick}
    className={cn(
      "flex flex-col items-center justify-center py-2 gap-1 transition-colors",
      variant === "destructive"
        ? "text-destructive"
        : active
          ? "text-primary"
          : "text-muted-foreground"
    )}
  >
    {icon}
    <span className="text-[10px]">{label}</span>
  </button>
);

export default MobileControls;
