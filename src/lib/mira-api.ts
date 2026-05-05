export type NvidiaModel = {
  id: string;
  name: string;
  description: string;
  category: "reasoning" | "code" | "vision" | "general" | "multimodal" | "speech";
  contextWindow: string;
};

// All model IDs below are verified valid on https://integrate.api.nvidia.com
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
];