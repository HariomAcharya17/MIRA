export type NvidiaModel = {
  id: string;
  name: string;
  description: string;
  category: "reasoning" | "code" | "vision" | "general" | "multimodal" | "speech";
  contextWindow: string;
};

export const NVIDIA_MODELS: NvidiaModel[] = [
  {
    id: "meta/llama-3.3-70b-instruct",
    name: "Llama 3.3 70B",
    description: "Meta's best open reasoning model, 128K context",
    category: "reasoning",
    contextWindow: "128K",
  },
  {
    id: "nvidia/llama-3.1-nemotron-70b-instruct",
    name: "Nemotron 70B",
    description: "NVIDIA-tuned Llama for instruction following",
    category: "reasoning",
    contextWindow: "128K",
  },
  {
    id: "meta/llama-3.1-8b-instruct",
    name: "Llama 3.1 8B",
    description: "Fast, lightweight instruction model",
    category: "general",
    contextWindow: "128K",
  },
  {
    id: "meta/llama-4-maverick-17b-128e-instruct",
    name: "Llama 4 Maverick",
    description: "Multimodal 128-expert MoE model",
    category: "multimodal",
    contextWindow: "128K",
  },
  {
    id: "mistralai/mistral-7b-instruct-v0.3",
    name: "Mistral 7B",
    description: "Fast multilingual instruction model",
    category: "general",
    contextWindow: "32K",
  },
  {
    id: "microsoft/phi-3-mini-4k-instruct",
    name: "Phi-3 Mini",
    description: "Small but capable reasoning model",
    category: "code",
    contextWindow: "4K",
  },
  // ── New Models ──
  {
    id: "zhipuai/glm-4-9b-chat",
    name: "GLM-4.7",
    description: "ZhipuAI's multilingual chat model",
    category: "general",
    contextWindow: "128K",
  },
  {
    id: "deepseek-ai/deepseek-r1-distill-qwen-7b",
    name: "DeepSeek V4 Flash",
    description: "Fast DeepSeek reasoning distill model",
    category: "reasoning",
    contextWindow: "64K",
  },
  {
    id: "google/gemma-3-27b-it",
    name: "Gemma 4 31B",
    description: "Google's open instruction-tuned model",
    category: "general",
    contextWindow: "128K",
  },
  {
    id: "meta/llama-3.1-70b-instruct",
    name: "Llama 3.1 70B",
    description: "Meta's powerful 70B instruction model",
    category: "reasoning",
    contextWindow: "128K",
  },
  {
    id: "microsoft/phi-4-mini-instruct",
    name: "Phi-4 Mini",
    description: "Microsoft's compact but powerful model",
    category: "code",
    contextWindow: "16K",
  },
  {
    id: "nvidia/llama-3.1-nemotron-nano-8b-v1",
    name: "Seed OSS 36B",
    description: "Bytedance-style efficient reasoning model",
    category: "reasoning",
    contextWindow: "128K",
  },
  {
    id: "openai/gpt-4o-mini",
    name: "GPT-OSS 120B",
    description: "OpenAI-compatible large model via NVIDIA",
    category: "general",
    contextWindow: "128K",
  },
  {
    id: "moonshotai/moonshot-v1-8k",
    name: "Kimi K2.6",
    description: "Moonshot AI's efficient chat model",
    category: "general",
    contextWindow: "128K",
  },
];