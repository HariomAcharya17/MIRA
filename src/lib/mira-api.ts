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
    id: "deepseek-r1-distill-llama-70b",
    name: "DeepSeek R1 (Reasoning)",
    description: "DeepSeek's 70B reasoning model — deep thinking and analytical power",
    category: "reasoning",
    contextWindow: "128K",
    badge: "REASONING",
  },
  {
    id: "llama-3.3-70b-versatile",
    name: "MIRA ULTRA (Llama 3.3)",
    description: "Meta's newest 70B powerhouse — incredibly smart, versatile, and fast",
    category: "reasoning",
    contextWindow: "128K",
    badge: "ULTRA",
  },
  {
    id: "llama-3.1-8b-instant",
    name: "Llama 3.1 8B",
    description: "Ultra-fast, lightweight, instant responses",
    category: "general",
    contextWindow: "128K",
    badge: "INSTANT",
  },
  {
    id: "llama-3.2-11b-vision-preview",
    name: "Llama 3.2 11B Vision",
    description: "Meta's multimodal vision model — understands images and visual data",
    category: "vision",
    contextWindow: "128K",
    badge: "VISION",
  },
  {
    id: "llama-3.2-3b-preview",
    name: "Llama 3.2 3B",
    description: "Super lightweight, fast assistant for general chat",
    category: "general",
    contextWindow: "128K",
    badge: "FREE",
  },
];