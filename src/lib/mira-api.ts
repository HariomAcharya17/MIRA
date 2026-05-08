// src/lib/mira-api.ts
// All models route through Groq (free tier — no credit card needed).
// Get your free key at: https://console.groq.com

export type MiraModel = {
  id: string;
  name: string;
  description: string;
  category: "reasoning" | "code" | "vision" | "general" | "multimodal" | "speech";
  contextWindow: string;
  badge?: string;
};

export const MIRA_MODELS: MiraModel[] = [
  {
    id: "gemini-2.0-flash-exp",
    name: "Gemini 2.0 Flash",
    description: "Next-gen speed and intelligence — the new standard",
    category: "general",
    contextWindow: "1M",
    badge: "LATEST",
  },
  {
    id: "gemini-1.5-pro",
    name: "Gemini 1.5 Pro",
    description: "Ultra-powerful reasoning and massive context",
    category: "reasoning",
    contextWindow: "2M",
    badge: "PRO",
  },
  {
    id: "gemini-1.5-flash",
    name: "Gemini 1.5 Flash",
    description: "Fast, optimized, and highly capable",
    category: "general",
    contextWindow: "1M",
    badge: "FAST",
  },
];