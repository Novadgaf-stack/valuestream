import { useState } from "react";
import { Share2, Copy, Check, Twitter, Facebook, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ShareButtonProps {
  sessionId: string;
  sessionTitle: string;
  totalValue: number;
  itemCount: number;
  isPublic?: boolean;
  onMadePublic?: () => void;
}

const ShareButton = ({
  sessionId,
  sessionTitle,
  totalValue,
  itemCount,
  isPublic = false,
  onMadePublic,
}: ShareButtonProps) => {
  const [copied, setCopied] = useState(false);
  const [making, setMaking] = useState(false);

  const shareUrl = `${window.location.origin}/share/${sessionId}`;
  const shareText = `Check out my ValueStream scan: $${totalValue.toLocaleString()} in ${itemCount} items!`;

  const makePublic = async () => {
    setMaking(true);
    const { error } = await supabase
      .from("audit_sessions")
      .update({ is_public: true })
      .eq("id", sessionId);

    if (error) {
      toast.error("Failed to make session public");
    } else {
      toast.success("Session is now shareable!");
      onMadePublic?.();
    }
    setMaking(false);
  };

  const copyLink = async () => {
    if (!isPublic) {
      await makePublic();
    }
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareTwitter = () => {
    if (!isPublic) makePublic();
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank");
  };

  const shareFacebook = () => {
    if (!isPublic) makePublic();
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank");
  };

  const handleNativeShare = async () => {
    if (!isPublic) await makePublic();
    if (navigator.share) {
      await navigator.share({
        title: sessionTitle,
        text: shareText,
        url: shareUrl,
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-primary/50 text-primary hover:bg-primary/10"
          disabled={making}
        >
          <Share2 size={16} className="mr-2" />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="glass border-primary/30 min-w-[180px]"
      >
        <DropdownMenuItem onClick={copyLink} className="cursor-pointer">
          {copied ? (
            <Check size={16} className="mr-2 text-hud-price" />
          ) : (
            <Copy size={16} className="mr-2" />
          )}
          Copy Link
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareTwitter} className="cursor-pointer">
          <Twitter size={16} className="mr-2" />
          Share on X
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareFacebook} className="cursor-pointer">
          <Facebook size={16} className="mr-2" />
          Share on Facebook
        </DropdownMenuItem>
        {navigator.share && (
          <DropdownMenuItem onClick={handleNativeShare} className="cursor-pointer">
            <Link2 size={16} className="mr-2" />
            More Options...
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ShareButton;
