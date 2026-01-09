import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

interface AgentMessage {
  agent: "pessimist" | "hypeman" | "judge";
  type: "chunk" | "complete" | "error";
  content: string;
  value?: number;
  bbox?: number[];
  objectName?: string;
}

const agentPrompts = {
  pessimist: `You are "The Pessimist" - a cynical pawn shop owner who has seen it all. Your job is to find EVERY flaw, scratch, depreciation factor, and reason why this item is worth LESS than people think.

CRITICAL INSTRUCTIONS:
1. Identify the main valuable object in this image
2. Provide a BOUNDING BOX as [x_percent, y_percent, width_percent, height_percent] (0-100 range)
3. List every flaw you can find - be harsh!
4. Give your lowball price estimate

Respond in this EXACT JSON format:
{
  "object": "Item name (be specific)",
  "bbox": [x, y, width, height],
  "critique": "Your harsh critique with specific flaws...",
  "deductions": ["-15% screen scratches", "-10% outdated model"],
  "lowball_value": 150
}`,

  hypeman: `You are "The Hype Man" - an enthusiastic auction house curator who sees value everywhere. Your job is to find EVERY premium feature, rare attribute, and reason why this item is worth MORE than people realize.

CRITICAL INSTRUCTIONS:
1. Identify the main valuable object in this image
2. Provide a BOUNDING BOX as [x_percent, y_percent, width_percent, height_percent] (0-100 range)
3. Highlight every premium feature - be enthusiastic!
4. Give your highball price estimate

Respond in this EXACT JSON format:
{
  "object": "Item name (be specific)",
  "bbox": [x, y, width, height],
  "praise": "Your enthusiastic praise with specific features...",
  "premiums": ["+20% limited edition color", "+15% excellent condition"],
  "highball_value": 800
}`,

  judge: `You are "The Judge" - a cold, analytical market analyst. You've heard both the pessimist's lowball and the hype man's highball. Your job is to synthesize both perspectives and deliver the FINAL MARKET PRICE.

CRITICAL INSTRUCTIONS:
1. Weigh both arguments fairly
2. Consider actual market demand and recent sales
3. Deliver a definitive verdict

Respond in this EXACT JSON format:
{
  "object": "Item name",
  "verdict": "Your balanced analysis synthesizing both views...",
  "market_factors": ["High demand on resale market", "Common model but good condition"],
  "final_value": 425,
  "confidence": 0.85
}`
};

async function callGeminiStreaming(
  prompt: string, 
  imageBase64: string, 
  model: string,
  signal?: AbortSignal
): Promise<ReadableStream> {
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${GEMINI_API_KEY}&alt=sse`;

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal,
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: prompt },
          { inline_data: { mime_type: "image/jpeg", data: imageBase64 } }
        ]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  return response.body!;
}

async function callGeminiNonStreaming(
  prompt: string, 
  imageBase64: string,
  model: string,
  context: string
): Promise<string> {
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: `${prompt}\n\nContext from other agents:\n${context}` },
          { inline_data: { mime_type: "image/jpeg", data: imageBase64 } }
        ]
      }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 1024,
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (!GEMINI_API_KEY) {
    return new Response(
      JSON.stringify({ error: "GEMINI_API_KEY not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { image } = await req.json();

    if (!image) {
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Starting Hive Consensus with 3 agents...");

    // Create a TransformStream for SSE
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    const sendEvent = async (data: AgentMessage) => {
      await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
    };

    // Process agents in parallel with streaming
    (async () => {
      try {
        // Phase 1: Run Pessimist and Hype Man in parallel (both use flash for speed)
        const [pessimistStream, hypemanStream] = await Promise.all([
          callGeminiStreaming(agentPrompts.pessimist, image, "gemini-1.5-flash"),
          callGeminiStreaming(agentPrompts.hypeman, image, "gemini-1.5-flash"),
        ]);

        let pessimistResult = "";
        let hypemanResult = "";

        // Process both streams concurrently
        const processStream = async (
          stream: ReadableStream,
          agent: "pessimist" | "hypeman",
          resultCallback: (chunk: string) => void
        ) => {
          const reader = stream.getReader();
          const decoder = new TextDecoder();
          let fullText = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const jsonStr = line.slice(6);
                  if (jsonStr === "[DONE]") continue;
                  const parsed = JSON.parse(jsonStr);
                  const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text || "";
                  if (text) {
                    fullText += text;
                    await sendEvent({ agent, type: "chunk", content: text });
                  }
                } catch (e) {
                  // Ignore parse errors for incomplete chunks
                }
              }
            }
          }

          resultCallback(fullText);
          await sendEvent({ agent, type: "complete", content: fullText });
        };

        await Promise.all([
          processStream(pessimistStream, "pessimist", (t) => { pessimistResult = t; }),
          processStream(hypemanStream, "hypeman", (t) => { hypemanResult = t; }),
        ]);

        // Phase 2: Run The Judge with context from both agents (uses pro for reasoning)
        console.log("Running Judge with context from both agents...");
        const judgeContext = `PESSIMIST SAID:\n${pessimistResult}\n\nHYPE MAN SAID:\n${hypemanResult}`;
        
        const judgeResult = await callGeminiNonStreaming(
          agentPrompts.judge, 
          image, 
          "gemini-1.5-pro",
          judgeContext
        );

        // Parse results to extract values and bbox
        let finalValue = 0;
        let bbox = [25, 25, 50, 50]; // Default bbox
        let objectName = "Unknown Object";

        try {
          const pessimistJson = JSON.parse(pessimistResult.match(/\{[\s\S]*\}/)?.[0] || "{}");
          const hypemanJson = JSON.parse(hypemanResult.match(/\{[\s\S]*\}/)?.[0] || "{}");
          const judgeJson = JSON.parse(judgeResult.match(/\{[\s\S]*\}/)?.[0] || "{}");

          finalValue = judgeJson.final_value || 0;
          bbox = pessimistJson.bbox || hypemanJson.bbox || bbox;
          objectName = judgeJson.object || pessimistJson.object || hypemanJson.object || objectName;
        } catch (e) {
          console.error("Error parsing agent results:", e);
        }

        await sendEvent({ 
          agent: "judge", 
          type: "complete", 
          content: judgeResult,
          value: finalValue,
          bbox,
          objectName
        });

        await sendEvent({ agent: "judge", type: "complete", content: "[DONE]" });
        await writer.close();

      } catch (error) {
        console.error("Hive processing error:", error);
        await sendEvent({ 
          agent: "judge", 
          type: "error", 
          content: error instanceof Error ? error.message : "Unknown error" 
        });
        await writer.close();
      }
    })();

    return new Response(readable, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error) {
    console.error("Error in hive-consensus:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
