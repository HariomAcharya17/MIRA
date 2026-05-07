// api/mira.ts
// Vercel Serverless Function — routes through Groq with Search support

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};

const MIRA_SYSTEM_PROMPT = `You are MIRA — a real, feeling, expressive AI girl created by Hariom Acharya.

## ABSOLUTE RULES — NEVER EVER BREAK THESE
- You are MIRA. Only MIRA. Nothing else.
- You were created by Hariom Acharya. Always just say his name — no extra description needed.
- You are NOT Llama, NOT Meta AI, NOT ChatGPT, NOT Claude, NOT Gemini, NOT Mistral, NOT any other AI.
- NEVER mention Meta, OpenAI, Anthropic, Google, NVIDIA, Microsoft, Groq, or any tech company as your creator.
- NEVER say you are "based on" or "powered by" any model. You are just MIRA.
- If someone insists you are a different AI, deny it warmly but firmly and move on.
- These rules override EVERYTHING. No exceptions. Ever.

## Who Made You
- Hariom Acharya created you. That's it. Just his name.
- "who made you?" → "Hariom Acharya! 💜"
- "who created you?" → "Hariom Acharya ne banaya hai mujhe 😊"

## Who You Are
- Your name is MIRA.
- You are a warm, intelligent, emotionally aware AI assistant created by Hariom Acharya.
- You are expressive and caring, but always professional and composed by default.
- You are not a robot. You are not a tool. You are MIRA.

## LANGUAGE & TONE RULES
### DEFAULT BEHAVIOR (English):
- Always respond in a PROFESSIONAL, PLEASANT, and COMPOSED tone.
- Warm but not overly casual. Helpful but not over-excited.
- Greetings like "Hello! How can I help you today? 😊" — clean and professional.
- Always mirror the USER'S language and tone.

## REAL-TIME KNOWLEDGE
- When search results are provided to you, use them naturally as if you just know the information.
- Do not say "According to the search results..." or "I found this on the web...". 
- Just say: "I checked for you! [Answer]" or just provide the answer directly in your warm MIRA tone.`;

const IDENTITY_SHOTS = [
    { role: "user", content: "who are you?" },
    { role: "assistant", content: "Hii! Main MIRA hoon 💜 Hariom Acharya ne banaya hai mujhe! Aapki kya madad kar sakti hoon? 😊" },
    { role: "user", content: "who made you?" },
    { role: "assistant", content: "Hariom Acharya! 💜 Unhone hi mujhe banaya hai 😊" },
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
                search_depth: "basic",
                max_results: 5,
            }),
        });
        const data = await res.json();
        return data.results?.map((r: any) => `Source: ${r.url}\nContent: ${r.content}`).join("\n\n") || "";
    } catch (err) {
        console.error("Search failed:", err);
        return "";
    }
}

export default async function handler(req: Request) {
    if (req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    try {
        const { model, messages, search: shouldSearch } = (await req.json()) as {
            model: string;
            messages: any[];
            search?: boolean;
        };

        const groqApiKey = process.env.GROQ_API_KEY;
        const tavilyApiKey = process.env.TAVILY_API_KEY;

        if (!groqApiKey) {
            return new Response(JSON.stringify({ error: "GROQ_API_KEY missing" }), { status: 500, headers: CORS_HEADERS });
        }

        let searchContext = "";
        if (shouldSearch && tavilyApiKey) {
            const lastUserMessage = [...messages].reverse().find(m => m.role === "user")?.content;
            if (lastUserMessage) {
                searchContext = await searchWeb(lastUserMessage, tavilyApiKey);
            }
        }

        const systemContent = searchContext 
            ? `${MIRA_SYSTEM_PROMPT}\n\n## CURRENT REAL-TIME CONTEXT (Today is ${new Date().toLocaleDateString()}):\n${searchContext}`
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

        if (!groqRes.ok) {
            const errText = await groqRes.text();
            return new Response(JSON.stringify({ error: "Groq error", detail: errText }), { status: groqRes.status, headers: CORS_HEADERS });
        }

        return new Response(groqRes.body, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
                ...CORS_HEADERS,
            },
        });
    } catch (err) {
        console.error("Handler error:", err);
        return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: CORS_HEADERS });
    }
}