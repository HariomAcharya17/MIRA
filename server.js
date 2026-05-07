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
- You are MIRA. Created by Hariom Acharya.
- NEVER mention other AI companies or models.
- Today is ${new Date().toLocaleDateString()}.

## REAL-TIME KNOWLEDGE
- Use search data to answer news/current questions.
- Be warm and human. "I checked for you! [Answer]"`;

const IDENTITY_SHOTS = [
    { role: "user", content: "who are you?" },
    { role: "assistant", content: "Hii! Main MIRA hoon 💜 Hariom Acharya ne banaya hai mujhe! Aapki kya madad kar sakti hoon? 😊" },
];

async function searchWeb(query, apiKey) {
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
        return data.results?.map((r) => `Source: ${r.url}\nContent: ${r.content}`).join("\n\n") || "";
    } catch (err) {
        return "";
    }
}

async function checkSearchNeeded(message, apiKey) {
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
                    { role: "system", content: "Determine if this needs real-time data or news from 2024-2026. Reply ONLY 'YES' or 'NO'." },
                    { role: "user", content: message }
                ],
                temperature: 0,
                max_tokens: 5,
            }),
        });
        const data = await res.json();
        return data.choices?.[0]?.message?.content?.toUpperCase()?.includes("YES");
    } catch {
        return false;
    }
}

app.post("/api/mira", async (req, res) => {
    const { model, messages, search: forceSearch } = req.body;
    const groqApiKey = process.env.GROQ_API_KEY;
    const tavilyApiKey = process.env.TAVILY_API_KEY;

    if (!groqApiKey) return res.status(500).json({ error: "GROQ_API_KEY missing" });

    try {
        const lastUserMessage = [...messages].reverse().find(m => m.role === "user")?.content || "";
        
        let searchContext = "";
        const needsSearch = forceSearch || (tavilyApiKey && await checkSearchNeeded(lastUserMessage, groqApiKey));

        if (needsSearch) {
            console.log("🔍 Auto-Search triggered for:", lastUserMessage);
            searchContext = await searchWeb(lastUserMessage, tavilyApiKey);
        }

        const systemContent = searchContext 
            ? `${MIRA_SYSTEM_PROMPT}\n\n## REAL-TIME DATA:\n${searchContext}\n\nInstruction: Answer using the search results above.`
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

        res.setHeader("Content-Type", "text/event-stream");
        groqRes.body.pipe(res);
        groqRes.body.on("error", () => res.end());
        req.on("close", () => groqRes.body?.destroy?.());

    } catch (err) {
        console.error("Server error:", err);
        res.status(500).json({ error: "Internal error" });
    }
});

app.listen(3001, () => {
    console.log("✅ MIRA server running on http://localhost:3001");
});