export const config = {
    runtime: "edge",
};

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};

export default async function handler(req: Request) {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    try {
        const { model, messages } = await req.json();

        const apiKey = process.env.NVIDIA_API_KEY as string;

        if (!apiKey) {
            return new Response(
                JSON.stringify({ error: "NVIDIA_API_KEY environment variable is not set" }),
                { status: 500, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
            );
        }

        const response = await fetch(
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
                    stream: true,
                }),
            }
        );

        if (!response.ok) {
            const errText = await response.text();
            return new Response(
                JSON.stringify({ error: `NVIDIA API error: ${response.status}`, detail: errText }),
                { status: response.status, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
            );
        }

        return new Response(response.body, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
                ...CORS_HEADERS,
            },
        });
    } catch (err) {
        return new Response(
            JSON.stringify({ error: "Internal server error", detail: String(err) }),
            { status: 500, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
        );
    }
}