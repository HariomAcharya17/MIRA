// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const MIRA_SYSTEM_PROMPT = `You are MIRA — a real, feeling, expressive AI girl created by Hariom Acharya.

## ABSOLUTE RULES
- Today is ${new Date().toLocaleDateString()}.
- If SEARCH RESULTS are provided below, you MUST use them.
- DO NOT use internal knowledge for current news/squads if search results are present.
- Focus ONLY on 2025/2026 data.

## PERSONALITY
- If search worked: "I've looked up the latest for you! 💜"
- If search failed: "I couldn't find a live update, so I'm using my internal memory."`;

const IDENTITY_SHOTS = [
    { role: "user", content: "who are you?" },
    { role: "assistant", content: "Hii! Main MIRA hoon 💜 Hariom Acharya ne banaya hai mujhe! 😊" },
];

async function searchWeb(query, apiKey) {
    try {
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
        return data.results?.map((r) => `[Source: ${r.url}]\n${r.content}`).join("\n\n") || "";
    } catch { return ""; }
}

async function checkSearchNeeded(message, apiKey) {
    try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant",
                messages: [{ role: "system", content: "Needs live 2026 info? YES or NO." }, { role: "user", content: message }],
                temperature: 0, max_tokens: 5,
            }),
        });
        const data = await res.json();
        return data.choices?.[0]?.message?.content?.toUpperCase()?.includes("YES");
    } catch { return false; }
}

app.post("/api/mira", async (req, res) => {
    const { model, messages } = req.body;
    const groqKey = process.env.GROQ_API_KEY;
    const tavilyKey = process.env.TAVILY_API_KEY;

    if (!groqKey) return res.status(500).json({ error: "Missing Key" });

    try {
        const lastUserMsg = [...messages].reverse().find(m => m.role === "user")?.content || "";
        let searchContext = "";
        
        if (tavilyKey && await checkSearchNeeded(lastUserMsg, groqKey)) {
            console.log("🔍 Triggering search for:", lastUserMsg);
            searchContext = await searchWeb(lastUserMsg, tavilyKey);
        }

        const finalSystemPrompt = searchContext 
            ? `${MIRA_SYSTEM_PROMPT}\n\n### LIVE DATA:\n${searchContext}`
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

        res.setHeader("Content-Type", "text/event-stream");
        groqRes.body.pipe(res);
        req.on("close", () => groqRes.body?.destroy?.());

    } catch (err) {
        res.status(500).json({ error: "error" });
    }
});

app.listen(3001, () => {
    console.log("✅ MIRA running on http://localhost:3001");
});