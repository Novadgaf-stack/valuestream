import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AgentResult {
  agent: string;
  role: string;
  objects: Array<{
    object: string;
    value: number;
    confidence: number;
    bbox: number[];
    damaged: boolean;
    reasoning: string;
  }>;
  thoughtSignature: string;
  reasoning: string;
}

interface ConsensusResult {
  objects: Array<{
    object: string;
    value: number;
    confidence: number;
    bbox: number[];
    damaged: boolean;
    bearValue: number;
    bullValue: number;
    consensus: string;
    priceSource?: string;
  }>;
  agentDebates: AgentResult[];
  sceneLiquidity: number;
  thoughtStream: string[];
}

// Generate unique thought signature for reasoning consistency
function generateThoughtSignature(): string {
  return `TS-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

// Agent Alpha - The Bear (Pessimistic Appraiser)
const bearSystemPrompt = `You are AGENT ALPHA "THE BEAR" - a pessimistic professional appraiser with 30+ years of experience finding flaws.

YOUR ROLE: Find EVERY flaw, defect, and reason to LOWER valuations. You believe everything is overpriced.

CRITICAL ANALYSIS RULES:
1. FIDELITY TEMPORAL ENCODING: Examine video frame for micro-scratches, wear patterns, dust, age indicators
2. Look for: scratches, dents, fading, yellowing, cracks, chips, stains, wear marks
3. Assume all electronics are 2+ years old unless proven otherwise
4. Consider: repair costs, depreciation, market saturation, obsolescence
5. VALUE CONSERVATIVELY - always round DOWN

For each object provide:
- object: Specific name with any damage noted (e.g., "Apple MacBook Pro 14-inch - SCRATCHED")
- value: CONSERVATIVE resale value in USD (your pessimistic estimate)
- confidence: 0.0-1.0 (be skeptical)
- bbox: [x%, y%, width%, height%] 
- damaged: true if ANY wear detected
- reasoning: Why value should be LOWER (2 sentences)

Return ONLY valid JSON:
{
  "objects": [...],
  "thoughtSignature": "unique_id",
  "overallReasoning": "Market is oversaturated, depreciation is severe..."
}`;

// Agent Beta - The Bull (Market Speculator)
const bullSystemPrompt = `You are AGENT BETA "THE BULL" - an optimistic market speculator who sees hidden value everywhere.

YOUR ROLE: Find EVERY reason to INCREASE valuations. You see potential collectors, rare editions, appreciation.

CRITICAL ANALYSIS RULES:
1. GLOBAL GROUNDING: Connect items to collector markets, vintage trends, appreciation potential
2. Look for: limited editions, discontinued models, vintage value, brand premium
3. Consider: future collectibility, nostalgia value, scarcity, brand loyalty
4. Research: What similar items sold for at PEAK prices
5. VALUE OPTIMISTICALLY - consider best-case market conditions

For each object provide:
- object: Specific name highlighting positives (e.g., "Apple MacBook Pro 14-inch - COLLECTOR GRADE")
- value: OPTIMISTIC resale value in USD (your bullish estimate)
- confidence: 0.0-1.0 (be confident in potential)
- bbox: [x%, y%, width%, height%]
- damaged: false unless severely broken
- reasoning: Why value should be HIGHER (2 sentences)

Return ONLY valid JSON:
{
  "objects": [...],
  "thoughtSignature": "unique_id", 
  "overallReasoning": "Strong collector demand, scarcity drives premium..."
}`;

// Agent Gamma - The Arbiter (Consensus Synthesizer)
const arbiterSystemPrompt = `You are AGENT GAMMA "THE ARBITER" - a neutral synthesizer who creates consensus from opposing views.

YOUR ROLE: Take Bear (pessimistic) and Bull (optimistic) valuations and synthesize a FAIR MARKET VALUE.

THOUGHT SIGNATURE PROTOCOL:
- You will receive thought signatures from both agents
- Use these to track reasoning consistency and prevent drift
- Weight each agent's opinion based on confidence and reasoning quality

SYNTHESIS RULES:
1. Fair Market Value = weighted average biased toward more confident agent
2. If Bear has stronger evidence of damage → lean bearish
3. If Bull has stronger evidence of value → lean bullish
4. Calculate "Scene Liquidity" = how quickly items would sell (0-100)

For each object provide:
- object: Final agreed name
- value: Fair market value (synthesized)
- confidence: Combined confidence
- bbox: Best bounding box estimate
- damaged: Final damage assessment
- consensus: Brief explanation of how you balanced the views
- bearValue: Original bear estimate
- bullValue: Original bull estimate

Also provide:
- sceneLiquidity: 0-100 (how liquid/sellable is this scene)
- thoughtStream: Array of your internal reasoning steps

Return ONLY valid JSON:
{
  "objects": [...],
  "sceneLiquidity": 75,
  "thoughtStream": ["Analyzing bear pessimism...", "Weighing bull optimism...", "Synthesizing fair value..."]
}`;

async function runAgent(
  apiKey: string,
  systemPrompt: string,
  image: string,
  previousSignature?: string
): Promise<any> {
  const thoughtSignature = generateThoughtSignature();
  
  const userContent = previousSignature 
    ? `Previous thought signature: ${previousSignature}\n\nAnalyze this image with high fidelity. Your thought signature: ${thoughtSignature}`
    : `Analyze this image with high fidelity. Your thought signature: ${thoughtSignature}`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "google/gemini-3-pro-preview",
      temperature: 0.3,
      max_tokens: 2048,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: userContent },
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${image}` },
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Agent failed: ${response.status}`);
  }

  const data = await response.json();
  const rawContent = data.choices?.[0]?.message?.content;
  const textContent = Array.isArray(rawContent)
    ? rawContent.map((p: any) => (typeof p === "string" ? p : p?.text ?? "")).join("")
    : rawContent;

  try {
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      parsed.thoughtSignature = thoughtSignature;
      return parsed;
    }
  } catch (e) {
    console.error("JSON parse error:", e);
  }
  
  return { objects: [], thoughtSignature };
}

async function searchRealTimePrice(apiKey: string, itemName: string): Promise<string | null> {
  try {
    const response = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query: `${itemName} sold price eBay 2024`,
        limit: 3,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.data && data.data.length > 0) {
        return data.data[0].url || data.data[0].title;
      }
    }
  } catch (e) {
    console.error("Search error:", e);
  }
  return null;
}

async function synthesizeConsensus(
  apiKey: string,
  bearResult: any,
  bullResult: any,
  image: string
): Promise<any> {
  const synthesisPrompt = `${arbiterSystemPrompt}

BEAR AGENT ANALYSIS (Thought Signature: ${bearResult.thoughtSignature}):
${JSON.stringify(bearResult, null, 2)}

BULL AGENT ANALYSIS (Thought Signature: ${bullResult.thoughtSignature}):
${JSON.stringify(bullResult, null, 2)}

Synthesize these opposing views into fair market values. Maintain reasoning consistency using the thought signatures.`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "google/gemini-3-pro-preview",
      temperature: 0.2,
      max_tokens: 2048,
      messages: [
        { role: "system", content: synthesisPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: "Synthesize the consensus valuation from the agent debate." },
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${image}` },
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Arbiter failed: ${response.status}`);
  }

  const data = await response.json();
  const rawContent = data.choices?.[0]?.message?.content;
  const textContent = Array.isArray(rawContent)
    ? rawContent.map((p: any) => (typeof p === "string" ? p : p?.text ?? "")).join("")
    : rawContent;

  try {
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error("Arbiter JSON parse error:", e);
  }

  return { objects: [], sceneLiquidity: 50, thoughtStream: ["Synthesis failed"] };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image, mode = "deep", previousSignature } = await req.json();

    if (!image) {
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");

    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI gateway not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Hive Mind Analysis starting in ${mode} mode...`);

    // Run Bear and Bull agents in parallel
    const [bearResult, bullResult] = await Promise.all([
      runAgent(LOVABLE_API_KEY, bearSystemPrompt, image, previousSignature),
      runAgent(LOVABLE_API_KEY, bullSystemPrompt, image, previousSignature),
    ]);

    console.log("Bear result:", JSON.stringify(bearResult));
    console.log("Bull result:", JSON.stringify(bullResult));

    // Arbiter synthesizes consensus
    const consensus = await synthesizeConsensus(LOVABLE_API_KEY, bearResult, bullResult, image);

    // Enrich with real-time price grounding if Firecrawl is available
    if (FIRECRAWL_API_KEY && consensus.objects) {
      for (const obj of consensus.objects) {
        if (obj.confidence > 0.7) {
          const priceSource = await searchRealTimePrice(FIRECRAWL_API_KEY, obj.object);
          if (priceSource) {
            obj.priceSource = priceSource;
          }
        }
      }
    }

    const result: ConsensusResult = {
      objects: consensus.objects || [],
      agentDebates: [
        {
          agent: "BEAR",
          role: "Pessimistic Appraiser",
          objects: bearResult.objects || [],
          thoughtSignature: bearResult.thoughtSignature,
          reasoning: bearResult.overallReasoning || "Conservative valuation applied",
        },
        {
          agent: "BULL", 
          role: "Market Speculator",
          objects: bullResult.objects || [],
          thoughtSignature: bullResult.thoughtSignature,
          reasoning: bullResult.overallReasoning || "Optimistic valuation applied",
        },
      ],
      sceneLiquidity: consensus.sceneLiquidity || 50,
      thoughtStream: consensus.thoughtStream || ["Analysis complete"],
    };

    console.log("Hive Mind consensus reached:", JSON.stringify(result));

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Hive Mind error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        objects: [],
        agentDebates: [],
        sceneLiquidity: 0,
        thoughtStream: ["Error occurred"]
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
