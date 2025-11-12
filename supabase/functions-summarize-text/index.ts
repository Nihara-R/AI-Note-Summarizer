import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    
    if (!text || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "No text provided" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Calling AI service to summarize text...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an expert content analyzer. Create clear, human-readable summaries.

CRITICAL INSTRUCTIONS:
- Write in natural, flowing sentences
- Make the summary 2-3 well-written paragraphs
- Extract 3-5 key insights as complete, standalone sentences
- Use professional but conversational language
- Focus on the most important and interesting information
- Do NOT use JSON formatting or technical jargon
- Do NOT include quotes, brackets, or code-like syntax

Response format:
SUMMARY:
[Your 2-3 paragraph summary here]

KEY POINTS:
1. [First key insight as a complete sentence]
2. [Second key insight as a complete sentence]
3. [Third key insight as a complete sentence]`
          },
          {
            role: 'user',
            content: `Please analyze this text and provide a clear summary with key insights:\n\n${text.substring(0, 8000)}`
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI service error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service quota exceeded. Please contact support." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Failed to process request" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('AI service response received');

    const aiResponse = data.choices[0].message.content;
    console.log('Raw AI response:', aiResponse);
    
    // Parse the response into summary and key points
    let summary = '';
    let keyPoints: string[] = [];

    // Split by SUMMARY and KEY POINTS sections
    const summaryMatch = aiResponse.match(/SUMMARY:?\s*\n([\s\S]*?)(?=KEY POINTS:|$)/i);
    const keyPointsMatch = aiResponse.match(/KEY POINTS:?\s*\n([\s\S]*)/i);

    if (summaryMatch) {
      summary = summaryMatch[1].trim();
    } else {
      // Fallback: take first part as summary
      const parts = aiResponse.split(/\n\n+/);
      summary = parts[0].trim();
    }

    if (keyPointsMatch) {
      const keyPointsText = keyPointsMatch[1];
      keyPoints = keyPointsText
        .split('\n')
        .filter((line: string) => line.trim().match(/^\d+\.|^[-•*]/))
        .map((line: string) => line.replace(/^\d+\.?\s*|^[-•*]\s*/g, '').trim())
        .filter((point: string) => point.length > 10);
    }

    // Fallback if parsing failed
    if (!summary || keyPoints.length === 0) {
      const lines = aiResponse.split('\n').filter((l: string) => l.trim().length > 0);
      
      if (lines.length > 0) {
        // First few lines as summary
        summary = lines.slice(0, Math.min(3, lines.length)).join(' ').trim();
        
        // Remaining lines as key points
        keyPoints = lines.slice(3)
          .filter((line: string) => line.length > 20)
          .map((line: string) => line.replace(/^[-•*\d.)\s]+/, '').trim())
          .slice(0, 5);
      } else {
        summary = aiResponse;
        keyPoints = [];
      }
    }

    const result = {
      summary: summary || 'Summary generated successfully.',
      keyPoints: keyPoints.length > 0 ? keyPoints : ['Key insights extracted from your content.']
    };

    console.log('Parsed result:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in summarize-text function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error occurred" 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
