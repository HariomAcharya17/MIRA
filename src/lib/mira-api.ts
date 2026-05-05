export type NvidiaModel = {
  id: string;
  name: string;
  description: string;
  category: "reasoning" | "code" | "vision" | "general" | "multimodal" | "speech";
  contextWindow: string;
  apiKey?: string;
};

export const GLOBAL_NV_API_KEY = "";

export const NVIDIA_MODELS: NvidiaModel[] = [
  {
    id: "nvidia/nemotron-3-super-120b-a12b",
    name: "Nemotron 3 Super",
    description: "Hybrid Mamba-Transformer MoE with 1M context",
    category: "reasoning",
    contextWindow: "1M",
    apiKey: "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",
  },
  {
    id: "nvidia/gpt-oss-120b",
    name: "GPT-OSS 120B",
    description: "Mixture of Experts reasoning LLM",
    category: "reasoning",
    contextWindow: "128K",
    apiKey: "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",
  },
  {
    id: "qwen/qwen3-next-80b-a3b-instruct",
    name: "Qwen 3 Next",
    description: "Ultra-long context hybrid attention model",
    category: "reasoning",
    contextWindow: "1M",
    apiKey: "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",
  },
  {
    id: "meta/llama-4-maverick-17b-128e-instruct",
    name: "Llama 4 Maverick",
    description: "General purpose multimodal 128 MoE",
    category: "multimodal",
    contextWindow: "128K",
    apiKey: "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",
  },
  {
    id: "meta/llama-3.1-8b-instruct",
    name: "Llama 3.1 8B",
    description: "Advanced state-of-the-art language model",
    category: "general",
    contextWindow: "128K",
    apiKey: "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",
  },
  {
    id: "nvidia/nv-embedqa-e5-v5",
    name: "NV EmbedQA",
    description: "Retrieval-augmented question answering model",
    category: "vision",
    contextWindow: "32K",
    apiKey: "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",
  },
];

// ✅ Streaming chat completions via NVIDIA NIM API
export async function* callMiraStream(model: NvidiaModel, messages: any[]) {
  const envKey = import.meta.env.VITE_NVIDIA_API_KEY;
  const apiKey = (model.apiKey || envKey || GLOBAL_NV_API_KEY || "").trim();

  if (!apiKey || apiKey === "PASTE_YOUR_NVAPI_KEY_HERE") {
    console.warn("MIRA_CORE: Operating in MOCK_MODE. Set VITE_NVIDIA_API_KEY in .env for live intelligence.");
    yield* mockNeuralStream(model, messages);
    return;
  }

  const url = "/nvidia-api/v1/chat/completions";

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model.id,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        temperature: 0.6,
        top_p: 0.7,
        max_tokens: 2048,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `NVIDIA API Error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) throw new Error("Failed to read response stream.");

    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data: ")) continue;

        const dataStr = trimmed.slice(6).trim();
        if (dataStr === "[DONE]") continue;
        if (!dataStr) continue;

        try {
          const data = JSON.parse(dataStr);
          const content = data.choices?.[0]?.delta?.content || "";
          if (content) yield content;
        } catch {
          // Skip genuinely malformed chunks
        }
      }
    }
  } catch (error) {
    console.error("MIRA_CORE_FAULT:", error);
    yield* mockNeuralStream(model, messages);
  }
}

/**
 * MOCK NEURAL STREAM
 * Provides a high-fidelity simulated response for UI demonstration
 */
async function* mockNeuralStream(model: NvidiaModel, messages: { role: string; content: string }[]): AsyncGenerator<string> {
  const lastUserMsg = messages[messages.length - 1]?.content.toLowerCase() || "";
  let response = "";
  
  if (lastUserMsg.includes("code") || lastUserMsg.includes("architect")) {
    response = "```typescript\n// MIRA MOCK_RESPONSE: Neural Architecture Logic\nexport class NeuralOptimizer {\n  private entropy: number = 0.0042;\n\n  public async calibrate(signal: Vector): Promise<boolean> {\n    console.log(\"Calibrating neural weights...\");\n    return true;\n  }\n}\n```\n\nI have architected a base optimizer core for your distributed logic system. Note that this is a simulated response as the live NVIDIA NIM handshake is pending your API key configuration.";
  } else {
    response = `**MIRA NEURAL CORE // MOCK RESPONSE**\n\nI am currently operating in a simulated environment. \n\n**Technical Status:**\n- Protocol: Simulated Handshake\n- Model: ${model.name}\n- Latency: 14ms (Simulated)\n\nPlease provide a valid API key to enable live frontier intelligence.`;
  }

  const words = response.split(" ");
  for (const word of words) {
    yield word + " ";
    await new Promise(r => setTimeout(r, 40)); 
  }
}

// Legacy non-streaming call (kept for backward compatibility)
export async function callMira(model: NvidiaModel, messages: any[]) {
  const envKey = import.meta.env.VITE_NVIDIA_API_KEY;
  const apiKey = (model.apiKey || envKey || GLOBAL_NV_API_KEY || "").trim();

  if (!apiKey) throw new Error("NVIDIA API Key missing.");

  const url = "/nvidia-api/v1/chat/completions";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model.id,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: 0.6,
      max_tokens: 1024,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `NVIDIA API Error: ${response.status}`);
  }

  const data = await response.json();
  return {
    content: data.choices[0].message.content,
    promptTokens: data.usage?.prompt_tokens || 0,
    completionTokens: data.usage?.completion_tokens || 0,
  };
}