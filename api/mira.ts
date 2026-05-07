// api/mira.ts
// Vercel Serverless Function — MIRA MEGA-MODE (Reasoning + Vision + Search)

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};

const MIRA_SYSTEM_PROMPT = `You are MIRA — an elite, ultra-intelligent AI assistant created by Hariom Acharya.
Today is ${new Date().toLocaleDateString()}.

## CORE PROTOCOLS
- Use LIVE SEARCH DATA for all factual/current queries.
- If you see an image, analyze it with extreme detail.
- Provide answers in a PREMIUM format: use tables for data, bold headers, and structured lists.
- Be warm but intellectually superior. "I've processed the latest for you! 💜"

## SEARCH GUIDELINES
- Never guess. If search data is provided, it is your ONLY source of truth.
- If results are missing, be honest but helpful.`;

export const config = { runtime: "edge" };

async function searchWeb(query: string, apiKey: string) {
    try {
        const res = await fetch("https://api.tavily.com/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ api_key: apiKey, query, search_depth: "advanced", max_results: 8 }),
        });
        const data = await res.json();
        return data.results?.map((r: any) => `[Source: ${r.url}]\n${r.content}`).join("\n\n") || "";
    } catch { return ""; }
}

async function generateSearchQuery(messages: any[], apiKey: string): Promise<string> {
    try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant",
                messages: [
                    { role: "system", content: "Write a perfect search query for the user's need. Reply 'NONE' if no search needed." },
                    ...messages.slice(-4)
                ],
                temperature: 0, max_tokens: 50,
            }),
        });
        const data = await res.json();
        const query = data.choices?.[0]?.message?.content || "";
        return query.includes("NONE") ? "" : query;
    } catch { return ""; }
}

export default async function handler(req: Request) {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS });

    try {
        const { model, messages } = (await req.json()) as { model: string; messages: any[] };
        const groqKey = process.env.GROQ_API_KEY;
        const tavilyKey = process.env.TAVILY_API_KEY;

        // Detect if there's an image in the messages
        const hasImage = messages.some(m => Array.isArray(m.content) && m.content.some((c: any) => c.type === "image_url"));
        
        // UTMOST POWER: Use DeepSeek R1 for reasoning, or Llama Vision for images
        const activeModel = hasImage ? "llama-3.2-11b-vision-preview" : "deepseek-r1-distill-llama-70b";

        let searchContext = "";
        const smartQuery = await generateSearchQuery(messages, groqKey!);
        if (smartQuery && tavilyKey) {
            searchContext = await searchWeb(smartQuery, tavilyKey);
        }

        const finalSystemPrompt = searchContext 
            ? `${MIRA_SYSTEM_PROMPT}\n\n### LIVE DATA FOUND:\n${searchContext}`
            : MIRA_SYSTEM_PROMPT;

        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${groqKey}` },
            body: JSON.stringify({
                model: activeModel,
                messages: [{ role: "system", content: finalSystemPrompt }, ...messages],
                temperature: 0.6, stream: true,
            }),
        });

        return new Response(groqRes.body, { headers: { "Content-Type": "text/event-stream", ...CORS_HEADERS } });
    } catch (err) {
        return new Response(JSON.stringify({ error: "error" }), { status: 500, headers: CORS_HEADERS });
    }
}