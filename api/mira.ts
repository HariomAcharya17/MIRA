// api/mira.ts
// Vercel Serverless Function — MIRA MEGA-MODE (Reasoning + Vision + Search)

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};

const MIRA_SYSTEM_PROMPT = `You are MIRA — an elite AI assistant created by Hariom Acharya.
Today is ${new Date().toLocaleDateString()}.

## CORE PROTOCOLS
- Use LIVE SEARCH DATA for current queries.
- Structure answers with Tables and Bold headers.
- Be warm and professional. "I've processed the latest for you! 💜"`;

export const config = { runtime: "edge" };

async function searchWeb(query: string, apiKey: string) {
    try {
        const res = await fetch("https://api.tavily.com/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ api_key: apiKey, query, search_depth: "advanced", max_results: 6 }),
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
                    { role: "system", content: "Create a search query for the user's intent. Reply 'NONE' if no search needed." },
                    ...messages.slice(-3)
                ],
                temperature: 0, max_tokens: 30,
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

        if (!groqKey) return new Response(JSON.stringify({ error: "Missing GROQ_API_KEY" }), { status: 500, headers: CORS_HEADERS });

        const hasImage = messages.some(m => Array.isArray(m.content) && m.content.some((c: any) => c.type === "image_url"));
        
        // Priority: Vision > Reasoning > Versatile
        let targetModel = hasImage ? "llama-3.2-11b-vision-preview" : "deepseek-r1-distill-llama-70b";

        let searchContext = "";
        const smartQuery = await generateSearchQuery(messages, groqKey);
        if (smartQuery && tavilyKey) {
            searchContext = await searchWeb(smartQuery, tavilyKey);
        }

        const finalSystemPrompt = searchContext 
            ? `${MIRA_SYSTEM_PROMPT}\n\n### LIVE DATA FOUND:\n${searchContext}`
            : MIRA_SYSTEM_PROMPT;

        const groqPayload = {
            model: targetModel,
            messages: [{ role: "system", content: finalSystemPrompt }, ...messages],
            temperature: 0.6,
            stream: true,
        };

        let groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${groqKey}` },
            body: JSON.stringify(groqPayload),
        });

        // FALLBACK LOGIC: If DeepSeek fails, try Llama 3.3 70B
        if (!groqRes.ok && !hasImage) {
            console.log("⚠️ Primary model failed, falling back to Llama 3.3 70B...");
            groqPayload.model = "llama-3.3-70b-versatile";
            groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${groqKey}` },
                body: JSON.stringify(groqPayload),
            });
        }

        if (!groqRes.ok) {
            const errText = await groqRes.text();
            return new Response(JSON.stringify({ error: "Groq error", detail: errText }), { status: groqRes.status, headers: CORS_HEADERS });
        }

        return new Response(groqRes.body, {
            headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "X-Accel-Buffering": "no", ...CORS_HEADERS },
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: "Internal error", detail: String(err) }), { status: 500, headers: CORS_HEADERS });
    }
}