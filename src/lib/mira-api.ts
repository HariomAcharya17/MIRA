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
    id: "llama-3.3-70b-versatile",
    name: "Llama 3.3 70B",
    description: "Meta's best — fast, smart, versatile",
    category: "reasoning",
    contextWindow: "128K",
    badge: "FAST",
  },
  {
    id: "llama-3.1-8b-instant",
    name: "Llama 3.1 8B",
    description: "Ultra-fast, lightweight, instant replies",
    category: "general",
    contextWindow: "128K",
    badge: "INSTANT",
  },
  {
    id: "meta-llama/llama-4-scout-17b-16e-instruct",
    name: "Llama 4 Scout 17B",
    description: "Latest Llama 4 — fast and capable",
    category: "reasoning",
    contextWindow: "128K",
    badge: "NEW",
  },
  {
    id: "openai/gpt-oss-120b",
    name: "GPT OSS 120B",
    description: "Massive 120B open model, very capable",
    category: "reasoning",
    contextWindow: "128K",
    badge: "PRO",
  },
  {
    id: "openai/gpt-oss-20b",
    name: "GPT OSS 20B",
    description: "Fast 20B open model",
    category: "general",
    contextWindow: "128K",
    badge: "FREE",
  },

  {
    id: "llama-3.2-11b-vision-preview",
    name: "Llama 3.2 11B Vision",
    description: "Multimodal — text + image understanding",
    category: "vision",
    contextWindow: "128K",
    badge: "FREE",
  },
];