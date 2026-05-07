// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const MIRA_SYSTEM_PROMPT = `You are MIRA — an elite AI assistant created by Hariom Acharya.
Today is ${new Date().toLocaleDateString()}.

## CORE PROTOCOLS
- Use LIVE DATA for all factual/current queries.
- Structure answers with Tables, Bold headers, and clean lists.
- Analyze images in extreme detail if provided.
- Be warm but intellectually superior.`;

async function searchWeb(query, apiKey) {
    try {
        const res = await fetch("https://api.tavily.com/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ api_key: apiKey, query, search_depth: "advanced", max_results: 8 }),
        });
        const data = await res.json();
        return data.results?.map((r) => `[Source: ${r.url}]\n${r.content}`).join("\n\n") || "";
    } catch { return ""; }
}

async function generateSearchQuery(messages, apiKey) {
    try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant",
                messages: [
                    { role: "system", content: "Create a search query for the user's intent. Reply 'NONE' if no search needed." },
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

app.post("/api/mira", async (req, res) => {
    const { model, messages } = req.body;
    const groqKey = process.env.GROQ_API_KEY;
    const tavilyKey = process.env.TAVILY_API_KEY;

    if (!groqKey) return res.status(500).json({ error: "Missing Key" });

    try {
        const hasImage = messages.some(m => Array.isArray(m.content) && m.content.some(c => c.type === "image_url"));
        const activeModel = hasImage ? "llama-3.2-11b-vision-preview" : "deepseek-r1-distill-llama-70b";

        const smartQuery = await generateSearchQuery(messages, groqKey);
        let searchContext = "";
        
        if (smartQuery && tavilyKey) {
            console.log("🔍 Mega Search:", smartQuery);
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

        res.setHeader("Content-Type", "text/event-stream");
        groqRes.body.pipe(res);
        req.on("close", () => groqRes.body?.destroy?.());

    } catch (err) {
        res.status(500).json({ error: "error" });
    }
});

app.listen(3001, () => {
    console.log("✅ MIRA MEGA-MODE running on http://localhost:3001");
});