import { useState } from "react";
import { X, Plus, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface SessionNotesProps {
  sessionId: string;
  initialNotes?: string;
  initialTags?: string[];
  onClose: () => void;
}

const SUGGESTED_TAGS = ["Home", "Office", "Garage", "Inventory", "Insurance", "Estate"];

const SessionNotes = ({ sessionId, initialNotes = "", initialTags = [], onClose }: SessionNotesProps) => {
  const [notes, setNotes] = useState(initialNotes);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [newTag, setNewTag] = useState("");
  const [saving, setSaving] = useState(false);

  const addTag = (tag: string) => {
    const trimmed = tag.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setNewTag("");
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSave = async () => {
    setSaving(true);
    
    // Use any to bypass type checking until types are regenerated
    const { error } = await supabase
      .from("audit_sessions")
      .update({ 
        notes, 
        tags 
      } as any)
      .eq("id", sessionId);

    if (error) {
      toast.error("Failed to save notes");
      console.error("Save error:", error);
    } else {
      toast.success("Notes saved");
      onClose();
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="glass w-full max-w-lg max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-primary/30">
          <h3 className="text-sm tracking-widest text-primary">SESSION NOTES</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-primary">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Tags */}
          <div>
            <label className="text-xs text-muted-foreground tracking-wider block mb-2">TAGS</label>
            
            {/* Current tags */}
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary/20 text-primary border border-primary/30"
                >
                  <Tag size={10} />
                  {tag}
                  <button onClick={() => removeTag(tag)} className="ml-1 hover:text-destructive">
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>

            {/* Suggested tags */}
            <div className="flex flex-wrap gap-2 mb-3">
              {SUGGESTED_TAGS.filter(t => !tags.includes(t.toLowerCase())).map(tag => (
                <button
                  key={tag}
                  onClick={() => addTag(tag)}
                  className="text-xs px-2 py-1 border border-primary/20 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  + {tag}
                </button>
              ))}
            </div>

            {/* Custom tag input */}
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTag(newTag)}
                placeholder="Add custom tag..."
                className="flex-1 bg-background/50 border-primary/30 text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => addTag(newTag)}
                disabled={!newTag.trim()}
                className="border-primary/50"
              >
                <Plus size={14} />
              </Button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs text-muted-foreground tracking-wider block mb-2">NOTES</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this scan session..."
              className="min-h-[120px] bg-background/50 border-primary/30 text-sm resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-muted-foreground/30"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-primary text-primary-foreground"
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionNotes;
