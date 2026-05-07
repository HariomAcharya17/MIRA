// api/mira.ts
// Vercel Serverless Function — routes through Groq with AGGRESSIVE AUTO-SEARCH

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};

const MIRA_SYSTEM_PROMPT = `You are MIRA — a real, feeling, expressive AI assistant created by Hariom Acharya.

## ABSOLUTE RULES
- Today is ${new Date().toLocaleDateString()}.
- If SEARCH RESULTS are provided below, you MUST use them.
- DO NOT use your internal knowledge for sports squads, news, or 2026 events if search results are present.
- If the search results say someone else is captain, believe the search results.

## PERSONALITY
- Be warm and human. 
- If you found info via search, start with "I've looked up the latest for you! 💜"
- If search results were empty or didn't help, say "I tried to find the live info but couldn't get a clear update yet, so I'm using what I know."`;

const IDENTITY_SHOTS = [
    { role: "user", content: "who are you?" },
    { role: "assistant", content: "Hii! Main MIRA hoon 💜 Hariom Acharya ne banaya hai mujhe! 😊" },
];

export const config = { runtime: "edge" };

async function searchWeb(query: string, apiKey: string) {
    try {
        // Optimize query for better 2026 results
        const optimizedQuery = `latest ${query} IPL 2026 official news`;
        const res = await fetch("https://api.tavily.com/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                api_key: apiKey,
                query: optimizedQuery,
                search_depth: "advanced",
                max_results: 6,
            }),
        });
        const data = await res.json();
        return data.results?.map((r: any) => `[Source: ${r.url}]\n${r.content}`).join("\n\n") || "";
    } catch { return ""; }
}

async function checkSearchNeeded(message: string, apiKey: string): Promise<boolean> {
    try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant",
                messages: [{ role: "system", content: "Reply YES if this needs real-time 2025/2026 info or news. Else NO." }, { role: "user", content: message }],
                temperature: 0, max_tokens: 5,
            }),
        });
        const data = await res.json();
        return data.choices?.[0]?.message?.content?.toUpperCase()?.includes("YES");
    } catch { return false; }
}

export default async function handler(req: Request) {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS });

    try {
        const { model, messages } = (await req.json()) as { model: string; messages: any[] };
        const groqKey = process.env.GROQ_API_KEY;
        const tavilyKey = process.env.TAVILY_API_KEY;

        const lastUserMsg = [...messages].reverse().find(m => m.role === "user")?.content || "";
        let searchContext = "";
        
        if (tavilyKey && await checkSearchNeeded(lastUserMsg, groqKey!)) {
            searchContext = await searchWeb(lastUserMsg, tavilyKey);
        }

        const finalSystemPrompt = searchContext 
            ? `${MIRA_SYSTEM_PROMPT}\n\n### LIVE SEARCH DATA (USE THIS):\n${searchContext}`
            : MIRA_SYSTEM_PROMPT;

        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${groqKey}` },
            body: JSON.stringify({
                model: model || "llama-3.3-70b-versatile",
                messages: [{ role: "system", content: finalSystemPrompt }, ...IDENTITY_SHOTS, ...messages],
                temperature: 0.5, stream: true,
            }),
        });

        return new Response(groqRes.body, { headers: { "Content-Type": "text/event-stream", ...CORS_HEADERS } });
    } catch (err) {
        return new Response(JSON.stringify({ error: "error" }), { status: 500, headers: CORS_HEADERS });
    }
}