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

    const systemPrompt = `You are an expert appraiser and financial auditor. Analyze this image and identify all distinct objects that have monetary value.

For each object you identify:
1. Name it accurately and specifically (e.g., "Apple MacBook Pro 14-inch" not just "laptop")
2. Estimate its current second-hand market value in USD
3. Note if it appears damaged (cracked screen, dents, wear) and reduce value accordingly
4. Provide a confidence score (0.0 to 1.0) for your identification
5. Estimate where in the image the object is located as x,y percentages (0-100)

IGNORE: walls, floors, ceilings, curtains, and structural elements.
FOCUS ON: electronics, furniture, appliances, collectibles, jewelry, clothing, books, art, and other items with resale value.

Return ONLY a valid JSON object in this exact format with no additional text:
{
  "objects": [
    {
      "object": "Item Name",
      "value": 850,
      "confidence": 0.92,
      "coordinates": [45, 30],
      "damaged": false
    }
  ]
}

If no valuable objects are detected, return: {"objects": []}`;

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
              { type: "text", text: "Analyze this image." },
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
