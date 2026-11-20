// Legacy endpoint kept for older clients. Same behaviour as /api/chat;
// requests without a provider default to Groq and an available model.
export { default } from "./chat";
export const config = { runtime: "edge" };
