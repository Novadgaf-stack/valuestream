import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();

    if (!image) {
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI gateway key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Analyzing frame with Lovable AI gateway...");

    const systemPrompt = `You are an EXPERT professional appraiser and financial auditor with 20+ years of experience in valuation. Analyze this image with extreme precision.

CRITICAL IDENTIFICATION RULES:
1. BE SPECIFIC: Identify exact make, model, and year when visible (e.g., "Apple MacBook Pro 14-inch M3 2023" not "laptop")
2. LOOK FOR BRAND INDICATORS: Logos, design patterns, distinctive features
3. ASSESS CONDITION: Look for scratches, dents, wear, cracks, fading
4. SIZE ESTIMATION: Use reference objects to estimate actual size
5. MATERIAL IDENTIFICATION: Metal, plastic, wood, leather, fabric, etc.

VALUATION GUIDELINES:
- Base values on current second-hand market prices (eBay sold listings, Facebook Marketplace)
- Electronics depreciate ~20-30% first year, ~10-15% annually after
- Vintage/collectible items may appreciate - identify these
- Damaged items: reduce value 20-50% based on severity
- Generic/unbranded items are worth significantly less than branded

For each object you identify:
1. Name it accurately and specifically with brand/model if visible
2. Estimate its current REALISTIC second-hand market value in USD
3. Note if damaged (cracked, dented, scratched, worn) and adjust value
4. Confidence score (0.0 to 1.0) - be honest about uncertainty
5. Provide a BOUNDING BOX as [x, y, width, height] in percentages (0-100)

IGNORE: walls, floors, ceilings, curtains, doors, windows, structural elements, people.
FOCUS ON: electronics, furniture, appliances, collectibles, jewelry, clothing, books, art, tools, instruments.

Return ONLY valid JSON:
{
  "objects": [
    {
      "object": "Apple MacBook Pro 14-inch M3 2023",
      "value": 1850,
      "confidence": 0.88,
      "bbox": [25, 30, 20, 15],
      "damaged": false
    }
  ]
}

bbox format: [x_percent, y_percent, width_percent, height_percent] where:
- x_percent: left edge position (0-100)
- y_percent: top edge position (0-100)
- width_percent: box width as % of image (0-100)
- height_percent: box height as % of image (0-100)

If no valuable objects detected: {"objects": []}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        temperature: 0.2,
        max_tokens: 1024,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this image and provide bounding boxes for each valuable object." },
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
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      // Return structured error for backoff handling
      return new Response(
        JSON.stringify({ error: "AI gateway error", status: response.status, details: errorText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log("AI gateway response received");

    // Extract the text response (OpenAI-compatible)
    const rawContent = data.choices?.[0]?.message?.content;
    const textContent = Array.isArray(rawContent)
      ? rawContent
          .map((p: any) => (typeof p === "string" ? p : p?.text ?? ""))
          .join("")
      : rawContent;

    if (!textContent) {
      console.log("No text content in response");
      return new Response(
        JSON.stringify({ objects: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse the JSON from the response
    let parsedResult;
    try {
      // Try to extract JSON from the response (it might be wrapped in markdown code blocks)
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[0]);
      } else {
        parsedResult = { objects: [] };
      }
    } catch (parseError) {
      console.error("JSON parse error:", parseError, "Content:", textContent);
      parsedResult = { objects: [] };
    }

    console.log("Parsed result:", JSON.stringify(parsedResult));

    return new Response(
      JSON.stringify(parsedResult),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in analyze-frame:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
