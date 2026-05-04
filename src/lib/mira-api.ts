// NVIDIA model catalog — placeholder responses until API key is wired.
export type NvidiaModel = {
  id: string;
  name: string;
  description: string;
  category: "reasoning" | "code" | "vision" | "image" | "general";
  contextWindow: string;
};

export const NVIDIA_MODELS: NvidiaModel[] = [
  {
    id: "meta/llama-3.1-405b-instruct",
    name: "Llama 3.1 405B",
    description: "Frontier general-purpose reasoning",
    category: "reasoning",
    contextWindow: "128K",
  },
  {
    id: "meta/llama-3.1-70b-instruct",
    name: "Llama 3.1 70B",
    description: "Balanced speed and capability",
    category: "general",
    contextWindow: "128K",
  },
  {
    id: "nvidia/llama-3.1-nemotron-70b-instruct",
    name: "Nemotron 70B",
    description: "NVIDIA-tuned for instruction following",
    category: "reasoning",
    contextWindow: "128K",
  },
  {
    id: "deepseek-ai/deepseek-coder-6.7b-instruct",
    name: "DeepSeek Coder",
    description: "Specialized for code & ML engineering",
    category: "code",
    contextWindow: "16K",
  },
  {
    id: "qwen/qwen2.5-coder-32b-instruct",
    name: "Qwen 2.5 Coder 32B",
    description: "Top-tier code generation",
    category: "code",
    contextWindow: "32K",
  },
  {
    id: "microsoft/phi-3-vision-128k-instruct",
    name: "Phi-3 Vision",
    description: "Multimodal vision + text",
    category: "vision",
    contextWindow: "128K",
  },
  {
    id: "stabilityai/sdxl-turbo",
    name: "SDXL Turbo",
    description: "Fast image generation",
    category: "image",
    contextWindow: "—",
  },
  {
    id: "google/gemma-2-27b-it",
    name: "Gemma 2 27B",
    description: "Open-weight efficient model",
    category: "general",
    contextWindow: "8K",
  },
];

// Stub completion. When NVIDIA key is added, replace this with a real fetch
// to https://integrate.api.nvidia.com/v1/chat/completions (OpenAI-compatible).
export type ChatTurn = { role: "user" | "assistant"; content: string };

export async function callMira(
  model: NvidiaModel,
  messages: ChatTurn[],
  attachments: { name: string; size: number }[] = []
): Promise<{ content: string; promptTokens: number; completionTokens: number }> {
  // Simulate latency
  await new Promise((r) => setTimeout(r, 600 + Math.random() * 600));

  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const fileNote =
    attachments.length > 0
      ? `\n\n_Attached:_ ${attachments.map((a) => `\`${a.name}\` (${(a.size / 1024).toFixed(1)} KB)`).join(", ")}`
      : "";

  let content = "";
  if (model.category === "code") {
    content = `Here's a clean implementation using **${model.name}**.

\`\`\`python
import torch
import torch.nn as nn

class TransformerBlock(nn.Module):
    """A single transformer block with multi-head attention and FFN."""
    def __init__(self, d_model: int, n_heads: int, d_ff: int, dropout: float = 0.1):
        super().__init__()
        self.attn = nn.MultiheadAttention(d_model, n_heads, dropout=dropout, batch_first=True)
        self.ffn = nn.Sequential(
            nn.Linear(d_model, d_ff),
            nn.GELU(),
            nn.Linear(d_ff, d_model),
        )
        self.norm1 = nn.LayerNorm(d_model)
        self.norm2 = nn.LayerNorm(d_model)
        self.dropout = nn.Dropout(dropout)

    def forward(self, x: torch.Tensor, mask=None) -> torch.Tensor:
        attn_out, _ = self.attn(x, x, x, attn_mask=mask)
        x = self.norm1(x + self.dropout(attn_out))
        x = self.norm2(x + self.dropout(self.ffn(x)))
        return x
\`\`\`

This block is the core of modern LLMs. Add positional encodings and stack ~32 of these for a production model.${fileNote}

> ⚠️ This is a simulated response. Add your **NVIDIA_API_KEY** to enable live inference.`;
  } else if (model.category === "image") {
    content = `🎨 **Image generation** via \`${model.name}\` would render your prompt: "${lastUser.slice(0, 120)}"

When the NVIDIA key is configured, generated images will appear inline and be available in the **Downloads** page.${fileNote}`;
  } else if (model.category === "vision") {
    content = `Analyzing input with **${model.name}** (multimodal).${fileNote}

I'd describe the visual content, extract entities, and answer questions about it. Live inference requires the NVIDIA key.`;
  } else {
    content = `**${model.name}** — high-fidelity reasoning response.

Your prompt: _"${lastUser.slice(0, 200)}"_

In production this routes through NVIDIA's hosted inference. Capabilities include:
1. Long-context reasoning (${model.contextWindow})
2. Tool use and structured output
3. Streaming responses

> 💡 Add **NVIDIA_API_KEY** to activate live responses.${fileNote}`;
  }

  // Rough token estimate: ~4 chars per token
  const promptTokens = Math.ceil(messages.reduce((n, m) => n + m.content.length, 0) / 4);
  const completionTokens = Math.ceil(content.length / 4);
  return { content, promptTokens, completionTokens };
}
