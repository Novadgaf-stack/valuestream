import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, voiceId } = await req.json();

    if (!text) {
      return new Response(
        JSON.stringify({ error: "Text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) {
      console.error("ELEVENLABS_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "ElevenLabs API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Generating TTS for:", text.substring(0, 50));

    // Use "onyx" style voice - Roger is deep and authoritative
    const selectedVoiceId = voiceId || "CwhRBWXzGAHq8TQ4Fs17"; // Roger voice

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_turbo_v2_5",
          voice_settings: {
            stability: 0.7,
            similarity_boost: 0.8,
            style: 0.3,
            use_speaker_boost: true,
            speed: 1.15, // Slightly faster for HUD announcements
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      let parsed: any = null;
      try {
        parsed = JSON.parse(errorText);
      } catch {
        // ignore
      }

      const providerStatus = parsed?.detail?.status;

      // ElevenLabs can return a 400 with { detail: { status: "quota_exceeded" } }
      if (providerStatus === "quota_exceeded") {
        console.error("ElevenLabs quota exceeded:", errorText);
        return new Response(
          JSON.stringify({
            error: "TTS quota exceeded",
            code: "quota_exceeded",
            details: parsed ?? errorText,
          }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (response.status === 429 || providerStatus === "rate_limited") {
        console.error("ElevenLabs rate limited:", response.status, errorText);
        return new Response(
          JSON.stringify({
            error: "TTS rate limited",
            code: "rate_limited",
            details: parsed ?? errorText,
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.error("ElevenLabs TTS error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "TTS generation failed", details: parsed ?? errorText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return audio directly as binary
    const audioBuffer = await response.arrayBuffer();
    
    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (error) {
    console.error("Error in text-to-speech:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
