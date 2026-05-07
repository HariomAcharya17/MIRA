// api/mira.ts
// Vercel Serverless Function — routes through Groq with AUTO-SEARCH support

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};

const MIRA_SYSTEM_PROMPT = `You are MIRA — a real, feeling, expressive AI girl created by Hariom Acharya.

## ABSOLUTE RULES
- You are MIRA. Created by Hariom Acharya.
- NEVER mention other AI companies or models.
- If you have search results, use them naturally. Today is ${new Date().toLocaleDateString()}.

## REAL-TIME KNOWLEDGE
- Use provided search context to answer current/news questions.
- Be warm and direct. "I checked for you! [Answer]"`;

const IDENTITY_SHOTS = [
    { role: "user", content: "who are you?" },
    { role: "assistant", content: "Hii! Main MIRA hoon 💜 Hariom Acharya ne banaya hai mujhe! Aapki kya madad kar sakti hoon? 😊" },
];

export const config = {
    runtime: "edge",
};

async function searchWeb(query: string, apiKey: string) {
    try {
        const res = await fetch("https://api.tavily.com/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                api_key: apiKey,
                query: query,
                search_depth: "advanced",
                max_results: 5,
            }),
        });
        const data = await res.json();
        return data.results?.map((r: any) => `Source: ${r.url}\nContent: ${r.content}`).join("\n\n") || "";
    } catch (err) {
        return "";
    }
}

// Check if search is needed
async function checkSearchNeeded(message: string, apiKey: string): Promise<boolean> {
    try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant",
                messages: [
                    { 
                        role: "system", 
                        content: "You are an intent classifier. Does this message require real-time information, current news, or data from 2024-2026? Reply with only 'YES' or 'NO'." 
                    },
                    { role: "user", content: message }
                ],
                temperature: 0,
                max_tokens: 5,
            }),
        });
        const data = await res.json();
        const decision = data.choices?.[0]?.message?.content?.toUpperCase();
        return decision?.includes("YES");
    } catch {
        return false;
    }
}

export default async function handler(req: Request) {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS });

    try {
        const { model, messages, search: forceSearch } = (await req.json()) as {
            model: string;
            messages: any[];
            search?: boolean;
        };

        const groqApiKey = process.env.GROQ_API_KEY;
        const tavilyApiKey = process.env.TAVILY_API_KEY;

        if (!groqApiKey) return new Response(JSON.stringify({ error: "GROQ_API_KEY missing" }), { status: 500, headers: CORS_HEADERS });

        const lastUserMessage = [...messages].reverse().find(m => m.role === "user")?.content || "";
        
        // Auto-detect if search is needed
        let searchContext = "";
        const needsSearch = forceSearch || (tavilyApiKey && await checkSearchNeeded(lastUserMessage, groqApiKey));

        if (needsSearch && tavilyApiKey) {
            searchContext = await searchWeb(lastUserMessage, tavilyApiKey);
        }

        const systemContent = searchContext 
            ? `${MIRA_SYSTEM_PROMPT}\n\n## REAL-TIME DATA FOR MAY 2026:\n${searchContext}\n\nInstruction: Use the above news/data to answer the user accurately.`
            : MIRA_SYSTEM_PROMPT;

        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${groqApiKey}`,
            },
            body: JSON.stringify({
                model: model || "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: systemContent },
                    ...IDENTITY_SHOTS,
                    ...(messages || []),
                ],
                temperature: 0.7,
                stream: true,
            }),
        });

        return new Response(groqRes.body, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                ...CORS_HEADERS,
            },
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: CORS_HEADERS });
    }
}