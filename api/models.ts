// GET /api/models — live chat models from Groq and NVIDIA (cached ~10 min).
import { checkEnvOnce } from "./_lib/env";
import { corsHeaders, json } from "./_lib/http";
import { listModels, PROVIDERS } from "./_lib/providers";

export const config = { runtime: "edge" };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(req) });
  if (req.method !== "GET") return json(req, { error: "Method not allowed" }, 405);
  checkEnvOnce();
  const [groq, nvidia] = await Promise.all([listModels("groq"), listModels("nvidia")]);
  return json(
    req,
    {
      providers: {
        groq: { label: PROVIDERS.groq.label, ...groq.status },
        nvidia: { label: PROVIDERS.nvidia.label, ...nvidia.status },
      },
      models: [...groq.models, ...nvidia.models],
    },
    200,
    { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1800" },
  );
}
