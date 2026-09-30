/**
 * Documentation-only configuration map for platforms that do not expose Vite
 * environment variables directly. This React app reads the same placeholders
 * from .env.local; do not import this file into production code.
 */
export const demo1Config = {
  transcribeWebhookUrl: "https://YOUR-N8N-HOST/webhook/demo1-transcribe",
  downloadWebhookUrl: "https://YOUR-N8N-HOST/webhook/demo1-download",
  audioFieldName: "file",
};
