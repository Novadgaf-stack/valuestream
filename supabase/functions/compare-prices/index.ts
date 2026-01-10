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
    const { itemName, estimatedValue } = await req.json();

    if (!itemName) {
      return new Response(
        JSON.stringify({ success: false, error: "Item name is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!apiKey) {
      console.error("FIRECRAWL_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Firecrawl connector not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Searching eBay for:", itemName);

    // Search eBay for the item
    const searchQuery = `${itemName} site:ebay.com sold`;
    
    const response = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: searchQuery,
        limit: 5,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Firecrawl API error:", data);
      return new Response(
        JSON.stringify({ success: false, error: data.error || "Search failed" }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse listings from search results
    const listings = (data.data || []).slice(0, 5).map((result: any) => {
      // Extract price from title or description if possible
      const priceMatch = (result.title + " " + (result.description || "")).match(/\$[\d,]+(?:\.\d{2})?/);
      const price = priceMatch ? parseFloat(priceMatch[0].replace(/[$,]/g, "")) : null;
      
      return {
        title: result.title || "Unknown Item",
        url: result.url || "",
        price: price,
        source: "eBay",
      };
    });

    // Calculate price validation
    const pricesFound = listings.filter((l: any) => l.price !== null).map((l: any) => l.price);
    let validation = null;
    
    if (pricesFound.length > 0) {
      const avgPrice = pricesFound.reduce((a: number, b: number) => a + b, 0) / pricesFound.length;
      const minPrice = Math.min(...pricesFound);
      const maxPrice = Math.max(...pricesFound);
      
      const difference = ((estimatedValue - avgPrice) / avgPrice) * 100;
      
      validation = {
        averagePrice: Math.round(avgPrice),
        minPrice: Math.round(minPrice),
        maxPrice: Math.round(maxPrice),
        estimatedValue: estimatedValue,
        differencePercent: Math.round(difference),
        isAccurate: Math.abs(difference) < 25,
      };
    }

    console.log("Found", listings.length, "listings");

    return new Response(
      JSON.stringify({
        success: true,
        itemName,
        listings,
        validation,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in compare-prices:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
