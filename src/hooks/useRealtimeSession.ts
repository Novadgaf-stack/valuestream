import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DetectedItem {
  id: string;
  object_name: string;
  value: number;
  confidence: number;
  bbox_x: number;
  bbox_y: number;
  bbox_w: number;
  bbox_h: number;
  is_damaged: boolean;
  detected_at: string;
}

interface ValueSnapshot {
  id: string;
  total_value: number;
  item_count: number;
  captured_at: string;
}

export const useRealtimeSession = (sessionId: string | null) => {
  const [realtimeItems, setRealtimeItems] = useState<DetectedItem[]>([]);
  const [latestSnapshot, setLatestSnapshot] = useState<ValueSnapshot | null>(null);
  const [connectedUsers, setConnectedUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!sessionId) return;

    // Subscribe to detected_items changes
    const itemsChannel = supabase
      .channel(`items:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "detected_items",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const newItem = payload.new as DetectedItem;
          setRealtimeItems((prev) => {
            // Avoid duplicates
            if (prev.find((item) => item.id === newItem.id)) {
              return prev;
            }
            return [...prev, newItem];
          });
          
          // Show toast for collaborators
          toast.info(`New item detected: ${newItem.object_name}`, {
            description: `$${newItem.value.toLocaleString()}`,
          });
        }
      )
      .subscribe();

    // Subscribe to value_snapshots changes
    const snapshotsChannel = supabase
      .channel(`snapshots:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "value_snapshots",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          setLatestSnapshot(payload.new as ValueSnapshot);
        }
      )
      .subscribe();

    // Presence for connected users
    const presenceChannel = supabase.channel(`presence:${sessionId}`);

    presenceChannel
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState();
        const users: string[] = [];
        Object.values(state).forEach((presences: any) => {
          presences.forEach((presence: any) => {
            if (presence.email) {
              users.push(presence.email);
            }
          });
        });
        setConnectedUsers(users);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          const { data } = await supabase.auth.getUser();
          if (data.user) {
            await presenceChannel.track({
              user_id: data.user.id,
              email: data.user.email,
              online_at: new Date().toISOString(),
            });
          }
        }
      });

    return () => {
      supabase.removeChannel(itemsChannel);
      supabase.removeChannel(snapshotsChannel);
      supabase.removeChannel(presenceChannel);
    };
  }, [sessionId]);

  const clearItems = useCallback(() => {
    setRealtimeItems([]);
  }, []);

  return {
    realtimeItems,
    latestSnapshot,
    connectedUsers,
    clearItems,
  };
};
