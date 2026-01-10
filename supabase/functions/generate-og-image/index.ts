import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: "Session ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch session data
    const { data: session, error: sessionError } = await supabase
      .from("audit_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ error: "Session not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch top items
    const { data: items } = await supabase
      .from("detected_items")
      .select("object_name, value")
      .eq("session_id", sessionId)
      .order("value", { ascending: false })
      .limit(3);

    // Generate SVG-based OG image
    const totalValue = session.total_value || 0;
    const itemCount = session.item_count || 0;
    const topItems = items?.map((i) => i.object_name).join(", ") || "No items";

    const svgImage = `
      <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#000000"/>
            <stop offset="100%" style="stop-color:#001a1a"/>
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        <!-- Background -->
        <rect width="1200" height="630" fill="url(#bg)"/>
        
        <!-- Grid pattern -->
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#00f3ff" stroke-width="0.5" opacity="0.1"/>
        </pattern>
        <rect width="1200" height="630" fill="url(#grid)"/>
        
        <!-- Border -->
        <rect x="20" y="20" width="1160" height="590" fill="none" stroke="#00f3ff" stroke-width="2" opacity="0.5"/>
        
        <!-- Corners -->
        <path d="M 20 60 L 20 20 L 60 20" fill="none" stroke="#00f3ff" stroke-width="3"/>
        <path d="M 1140 20 L 1180 20 L 1180 60" fill="none" stroke="#00f3ff" stroke-width="3"/>
        <path d="M 1180 570 L 1180 610 L 1140 610" fill="none" stroke="#00f3ff" stroke-width="3"/>
        <path d="M 60 610 L 20 610 L 20 570" fill="none" stroke="#00f3ff" stroke-width="3"/>
        
        <!-- ValueStream logo -->
        <text x="60" y="80" font-family="monospace" font-size="24" fill="#00f3ff" filter="url(#glow)">VALUESTREAM</text>
        <text x="60" y="105" font-family="monospace" font-size="14" fill="#00f3ff" opacity="0.7">REAL-TIME REALITY AUDITOR</text>
        
        <!-- Total Value -->
        <text x="600" y="280" font-family="monospace" font-size="120" fill="#00ff7f" filter="url(#glow)" text-anchor="middle">$${totalValue.toLocaleString()}</text>
        <text x="600" y="340" font-family="monospace" font-size="24" fill="#00f3ff" text-anchor="middle" opacity="0.8">TOTAL ASSET VALUE</text>
        
        <!-- Stats -->
        <text x="200" y="450" font-family="monospace" font-size="48" fill="#00f3ff" text-anchor="middle">${itemCount}</text>
        <text x="200" y="490" font-family="monospace" font-size="18" fill="#00f3ff" text-anchor="middle" opacity="0.7">ITEMS DETECTED</text>
        
        <text x="600" y="450" font-family="monospace" font-size="20" fill="#00f3ff" text-anchor="middle" opacity="0.8">${session.title}</text>
        
        <text x="1000" y="450" font-family="monospace" font-size="48" fill="#ff9900" text-anchor="middle">AI</text>
        <text x="1000" y="490" font-family="monospace" font-size="18" fill="#ff9900" text-anchor="middle" opacity="0.7">VERIFIED</text>
        
        <!-- Top items -->
        <text x="60" y="580" font-family="monospace" font-size="14" fill="#00f3ff" opacity="0.6">TOP: ${topItems.substring(0, 80)}</text>
        
        <!-- Scan lines effect -->
        <rect x="0" y="0" width="1200" height="2" fill="#00f3ff" opacity="0.1">
          <animate attributeName="y" from="0" to="630" dur="3s" repeatCount="indefinite"/>
        </rect>
      </svg>
    `;

    // Return as PNG by encoding SVG as data URL
    const base64Svg = btoa(unescape(encodeURIComponent(svgImage)));
    
    return new Response(
      JSON.stringify({
        success: true,
        imageData: `data:image/svg+xml;base64,${base64Svg}`,
        session: {
          id: session.id,
          title: session.title,
          totalValue,
          itemCount,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating OG image:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
