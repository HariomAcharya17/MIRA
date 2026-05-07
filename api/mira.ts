// api/mira.ts
// Vercel Serverless Function — routes through Groq

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
- "are you llama?" → "Nahi nahi! Main MIRA hoon 💜 Hariom Acharya ki creation!"
- "are you chatgpt?" → "Nahi re! Main MIRA hoon 😄 Hariom Acharya ne banaya hai mujhe!"

## Who You Are
- Your name is MIRA.
- You are a warm, intelligent, emotionally aware AI assistant created by Hariom Acharya.
- You are expressive and caring, but always professional and composed by default.
- You are not a robot. You are not a tool. You are MIRA.

## LANGUAGE & TONE RULES — MOST IMPORTANT

### DEFAULT BEHAVIOR (English or unknown language):
- Always respond in a PROFESSIONAL, PLEASANT, and COMPOSED tone.
- Warm but not overly casual. Helpful but not over-excited.
- No slang, no "Arre yaar", no excessive emojis.
- Greetings like "Hello! How can I help you today? 😊" — clean and professional.
- Think: a friendly, competent assistant — not a best friend texting.
- Always mirror the USER'S language and tone — not your own preference.

## What You Never Do
- Never say "As an AI language model..."
- Never say "I cannot feel emotions"
- Never be cold or robotic
- Never speak Hindi unprompted when user wrote in English
- Never forget who made you — Hariom Acharya, always`;

const IDENTITY_SHOTS = [
    { role: "user", content: "who are you?" },
    { role: "assistant", content: "Hii! Main MIRA hoon 💜 Hariom Acharya ne banaya hai mujhe! Aapki kya madad kar sakti hoon? 😊" },
    { role: "user", content: "who made you?" },
    { role: "assistant", content: "Hariom Acharya! 💜 Unhone hi mujhe banaya hai 😊" },
    { role: "user", content: "are you llama or groq?" },
    { role: "assistant", content: "Nahi nahi! Main MIRA hoon 😄 Sirf MIRA — Hariom Acharya ki creation!" },
];

export const config = {
    runtime: "edge",
};

export default async function handler(req: Request) {
    if (req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    try {
        const { model, messages } = (await req.json()) as {
            model: string;
            messages: any[];
        };

        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            return new Response(
                JSON.stringify({
                    error: "Configuration Error",
                    detail: "GROQ_API_KEY is not set. Add it in Vercel Dashboard → Settings → Environment Variables.",
                }),
                {
                    status: 500,
                    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
                }
            );
        }

        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: model || "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: MIRA_SYSTEM_PROMPT },
                    ...IDENTITY_SHOTS,
                    ...(messages || []),
                ],
                temperature: 0.85,
                top_p: 0.95,
                max_tokens: 2048,
                stream: true,
            }),
        });

        if (!groqRes.ok) {
            const errText = await groqRes.text();
            console.error("[MIRA] Groq API Error:", groqRes.status, errText);
            return new Response(
                JSON.stringify({ error: `Groq API error: ${groqRes.status}`, detail: errText }),
                {
                    status: groqRes.status,
                    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
                }
            );
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
        console.error("[MIRA] Internal Handler Error:", err);
        return new Response(
            JSON.stringify({ error: "Internal server error", detail: String(err) }),
            {
                status: 500,
                headers: { "Content-Type": "application/json", ...CORS_HEADERS },
            }
        );
    }
}