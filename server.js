import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("MIRA Backend running 🚀");
});

app.post("/api/mira", async (req, res) => {
    console.log("▶ API HIT — model:", req.body?.model);

    try {
        const { model, messages } = req.body;

        const apiKey = process.env.NVIDIA_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: "NVIDIA_API_KEY is not set" });
        }

        const nvidiaRes = await fetch(
            "https://integrate.api.nvidia.com/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model,
                    messages,
                    temperature: 0.6,
                    top_p: 0.7,
                    max_tokens: 2048,
                    stream: true,          // ← MUST be true for SSE streaming
                }),
            }
        );

        if (!nvidiaRes.ok) {
            const errText = await nvidiaRes.text();
            console.error("NVIDIA error:", nvidiaRes.status, errText);
            return res.status(nvidiaRes.status).json({ error: errText });
        }

        // Set SSE headers and pipe the NVIDIA stream straight to the client
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("X-Accel-Buffering", "no");

        nvidiaRes.body.pipe(res);

        nvidiaRes.body.on("error", (err) => {
            console.error("Stream error:", err);
            res.end();
        });

        req.on("close", () => {
            nvidiaRes.body.destroy();
        });

    } catch (err) {
        console.error("Server error:", err);
        if (!res.headersSent) {
            res.status(500).json({ error: String(err) });
        }
    }
});

app.listen(3001, () => {
    console.log("Server running on http://localhost:3001");
});