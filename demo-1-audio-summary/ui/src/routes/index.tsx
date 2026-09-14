import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";

/* ============================================================
 * INTEGRATION CONFIGURATION
 * Public URLs live in the untracked .env.local file.
 * ============================================================ */
const WEBHOOK_PRINCIPAL = (import.meta.env.VITE_DEMO1_TRANSCRIBE_URL ?? "").trim();
const WEBHOOK_DOWNLOAD = (import.meta.env.VITE_DEMO1_DOWNLOAD_URL ?? "").trim();
const AUDIO_FIELD_NAME = "file";
const REQUEST_TIMEOUT_MS = 120000;
/* ============================================================ */

/* Visual direction:
 * The paper-and-ink palette recalls meeting records and working documents;
 * terracotta gives the product a distinct signature, while IBM Plex Sans
 * preserves precision and readability.
 */

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Audio to Minutes — Transcribe audio and summarize meetings" },
      {
        name: "description",
        content:
          "Record an in-person meeting for a structured recap and action list, or upload audio for a full transcription.",
      },
      {
        property: "og:title",
        content: "Audio to Minutes — Transcribe audio and summarize meetings",
      },
      {
        property: "og:description",
        content:
          "Record an in-person conversation or upload an audio file for organized text.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  component: Index,
});

/* ---------- validation constants ---------- */
const MAX_BYTES = 25 * 1024 * 1024;
const MIME_EXT: Record<string, string> = {
  "audio/webm": ".webm",
  "audio/ogg": ".ogg",
  "audio/mp4": ".m4a",
  "audio/x-m4a": ".m4a",
  "audio/mpeg": ".mp3",
  "audio/wav": ".wav",
  "audio/x-wav": ".wav",
};
const EXT_FALLBACK = [".webm", ".mp3", ".wav", ".m4a", ".ogg"];

const MSG = {
  vazio: "Select or record audio before continuing.",
  formato: "Use a valid audio file: WEBM, MP3, WAV, M4A, or OGG.",
  tamanho: "The audio exceeds the 25 MB limit. Choose a smaller file.",
  timeout: "The request took longer than expected. Please try again.",
  rede: "We could not connect to the service. Check your connection and try again.",
  http: "We could not process this audio. Review the file and try again.",
  contrato: "We received an unexpected response. Please try again shortly.",
  naoConfig: "The integration is not configured yet. Set the n8n webhooks and audio field.",
};

function baseMime(m: string) {
  return ((m || "").split(";")[0] ?? "").trim().toLowerCase();
}
function extFor(mime: string) {
  return MIME_EXT[baseMime(mime)] ?? null;
}
function isConfigured() {
  const ok = (v: string) =>
    typeof v === "string" && v.length > 0 && !/COLE|SUA_URL|PLACEHOLDER|<|>/i.test(v);
  return (
    ok(WEBHOOK_PRINCIPAL) &&
    ok(WEBHOOK_DOWNLOAD) &&
    ok(AUDIO_FIELD_NAME) &&
    /^https?:\/\//i.test(WEBHOOK_PRINCIPAL) &&
    /^https?:\/\//i.test(WEBHOOK_DOWNLOAD)
  );
}
function humanSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
function sanitizeId(id: string) {
  return id.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 60) || "reuniao";
}
function fmtTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
function downloadText(text: string, filename: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function escapeHtml(text: string) {
  return text.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char] ?? char,
  );
}

function printText(title: string, text: string) {
  // Use an in-page temporary document so a secondary window never retains focus.
  const frame = document.createElement("iframe");
  frame.title = `Print — ${title}`;
  frame.setAttribute("aria-hidden", "true");
  Object.assign(frame.style, {
    position: "fixed",
    right: "0",
    bottom: "0",
    width: "0",
    height: "0",
    border: "0",
  });
  document.body.appendChild(frame);

  const printWindow = frame.contentWindow;
  const printDocument = frame.contentDocument;
  if (!printWindow || !printDocument) {
    frame.remove();
    return false;
  }

  // Remove the document after printing or cancelling and return control to the page.
  const cleanup = () => {
    window.clearTimeout(cleanupTimer);
    frame.remove();
    window.focus();
  };
  printWindow.addEventListener("afterprint", cleanup, { once: true });

  printDocument.open();
  printDocument.write(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>body{font:16px/1.6 Arial,sans-serif;max-width:820px;margin:40px auto;padding:0 24px;color:#1f2933}pre{white-space:pre-wrap;font:inherit}</style>
</head><body><h1>${escapeHtml(title)}</h1><pre>${escapeHtml(text)}</pre></body></html>`);
  printDocument.close();

  const cleanupTimer = window.setTimeout(cleanup, 60000);
  window.requestAnimationFrame(() => {
    printWindow.focus();
    printWindow.print();
  });
  return true;
}

/** Multipart POST with a timeout; the caller validates the returned JSON. */
async function postAudio(
  payload: Blob | File,
  filename: string | null,
  mode: "reuniao" | "arquivo",
) {
  const form = new FormData();
  if (filename) form.append(AUDIO_FIELD_NAME, payload, filename);
  else form.append(AUDIO_FIELD_NAME, payload);
  form.append("mode", mode);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(WEBHOOK_PRINCIPAL, { method: "POST", body: form, signal: controller.signal });
  } catch (e) {
    clearTimeout(timer);
    throw new Error((e as Error)?.name === "AbortError" ? MSG.timeout : MSG.rede);
  }
  clearTimeout(timer);
  if (!res.ok) throw new Error(MSG.http);
  try {
    return await res.json();
  } catch {
    throw new Error(MSG.contrato);
  }
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

/* ---------- estilos ---------- */
const C = {
  paper: "#F7F4EE",
  surface: "#FFFFFF",
  ink: "#1F2933",
  ink2: "#5F6872",
  rule: "#D8D3C8",
  control: "#737B83",
  accent: "#9A3412",
  accentSoft: "#FBEFEA",
  danger: "#8A1C1C",
};
const font = '"IBM Plex Sans", "Segoe UI", sans-serif';

const S = {
  page: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    background: C.paper,
    color: C.ink,
    fontFamily: font,
    fontSize: 16,
    lineHeight: 1.55,
    padding: "clamp(32px, 6vh, 80px) 24px",
    boxSizing: "border-box",
    overflowX: "hidden",
  },
  wrap: {
    width: "100%",
    maxWidth: 1200,
    margin: "0 auto",
    paddingInline: 32,
    boxSizing: "border-box",
  },
  header: { padding: "40px 0 24px" },
  brand: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: "0.18em",
    fontVariant: "small-caps",
    textTransform: "lowercase",
    color: C.accent,
  },
  h1: {
    fontSize: "clamp(2rem, 4vw, 3rem)",
    fontWeight: 700,
    margin: "16px 0 0",
    lineHeight: 1.1,
    color: C.ink,
  },
  sub: { color: C.ink2, margin: "12px 0 0", fontSize: 17, lineHeight: 1.6, maxWidth: "60ch" },
  rule: { border: 0, borderTop: `1px solid ${C.rule}`, margin: "0 0 24px" },
  grid: { display: "grid", gap: 24, gridTemplateColumns: "1fr 1fr", alignItems: "stretch" },
  panel: {
    background: C.surface,
    border: `1px solid ${C.rule}`,
    borderRadius: 12,
    padding: 24,
    display: "flex",
    flexDirection: "column",
    gap: 18,
    minWidth: 0,
    height: "100%",
    boxSizing: "border-box",
    boxShadow: "0 1px 2px rgba(31, 41, 51, 0.04), 0 2px 6px rgba(31, 41, 51, 0.04)",
  },
  h2: { fontSize: 22, fontWeight: 600, margin: 0, lineHeight: 1.25 },
  h3: { fontSize: 16, fontWeight: 600, margin: 0, lineHeight: 1.35 },
  text: { color: C.ink2, margin: 0, fontSize: 15, lineHeight: 1.6 },
  out: {
    border: `1px solid ${C.rule}`,
    borderRadius: 10,
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 16,
    minWidth: 0,
    minHeight: 260,
    flex: 1,
    background: C.surface,
  },
  btn: {
    fontFamily: font,
    fontSize: 15,
    fontWeight: 600,
    minHeight: 48,
    padding: "14px 24px",
    borderRadius: 10,
    cursor: "pointer",
    background: C.accent,
    color: "#FFFFFF",
    border: `1px solid ${C.accent}`,
    transition: "background-color 120ms ease, border-color 120ms ease, transform 80ms ease",
  },
  btn2: {
    fontFamily: font,
    fontSize: 15,
    fontWeight: 500,
    minHeight: 44,
    padding: "12px 20px",
    borderRadius: 10,
    cursor: "pointer",
    background: C.surface,
    color: C.ink,
    border: `1px solid ${C.control}`,
    transition: "background-color 120ms ease, border-color 120ms ease, transform 80ms ease",
  },
  err: {
    border: `1px solid ${C.danger}`,
    background: "#FDF3F3",
    color: C.danger,
    borderRadius: 8,
    padding: "12px 14px",
    fontSize: 15,
    fontWeight: 500,
    lineHeight: 1.5,
  },
  list: {
    margin: 0,
    paddingLeft: 22,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    overflowWrap: "anywhere",
  },
  ta: {
    width: "100%",
    boxSizing: "border-box",
    minHeight: 240,
    resize: "vertical",
    overflow: "auto",
    fontFamily: font,
    fontSize: 15,
    lineHeight: 1.65,
    color: C.ink,
    background: C.surface,
    border: `1px solid ${C.control}`,
    borderRadius: 8,
    padding: 14,
  },
  label: { fontSize: 14, fontWeight: 600, display: "block", marginBottom: 8 },
  timer: { fontVariantNumeric: "tabular-nums", fontSize: 24, fontWeight: 700 },
  chip: {
    fontSize: 14,
    fontWeight: 500,
    color: C.ink,
    background: C.accentSoft,
    border: `1px solid ${C.rule}`,
    borderRadius: 6,
    padding: "10px 12px",
    overflowWrap: "anywhere",
  },
  scrollBox: {
    maxHeight: 340,
    overflowY: "auto",
    paddingRight: 8,
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  hint: { color: C.ink2, fontSize: ".85rem", margin: 0 },
  ghost: {
    fontFamily: font,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
    borderRadius: 8,
    background: "transparent",
    border: "1px solid transparent",
    color: C.ink2,
    cursor: "pointer",
    fontSize: 20,
    lineHeight: 1,
  },
  callout: {
    background: C.accentSoft,
    borderLeft: `3px solid ${C.accent}`,
    borderRadius: 8,
    padding: "14px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  badge: {
    alignSelf: "flex-start",
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.04em",
    color: C.accent,
    background: C.surface,
    border: `1px solid ${C.rule}`,
    borderRadius: 999,
    padding: "3px 10px",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(31, 41, 51, 0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    zIndex: 50,
  },
  modal: {
    width: "100vw",
    maxWidth: "none",
    height: "100dvh",
    maxHeight: "100dvh",
    boxSizing: "border-box",
    overflowY: "auto",
    background: C.surface,
    border: "none",
    borderRadius: 0,
    padding: 28,
    display: "flex",
    flexDirection: "column",
    gap: 20,
    boxShadow: "none",
  },
  spinner: {
    width: 16,
    height: 16,
    borderRadius: "50%",
    border: `2px solid ${C.rule}`,
    borderTopColor: C.accent,
    animation: "aa-spin 700ms linear infinite",
    flex: "0 0 auto",
  },
} satisfies Record<string, React.CSSProperties>;

function capFirst(t: string) {
  const s = t.trim();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function Icon({ name }: { name: "mic" | "stop" | "upload" | "download" | "copy" | "print" }) {
  const p = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    focusable: "false" as unknown as boolean,
  };
  if (name === "mic")
    return (
      <svg {...p}>
        <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z" />
        <path d="M5 11a7 7 0 0 0 14 0" />
        <path d="M12 18v3" />
      </svg>
    );
  if (name === "stop")
    return (
      <svg {...p}>
        <rect x="6" y="6" width="12" height="12" rx="2" />
      </svg>
    );
  if (name === "upload")
    return (
      <svg {...p}>
        <path d="M12 16V4" />
        <path d="m7 9 5-5 5 5" />
        <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
      </svg>
    );
  if (name === "copy")
    return (
      <svg {...p}>
        <rect x="8" y="8" width="11" height="11" rx="2" />
        <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
      </svg>
    );
  if (name === "print")
    return (
      <svg {...p}>
        <path d="M6 9V3h12v6" />
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <rect x="6" y="14" width="12" height="7" />
      </svg>
    );
  return (
    <svg {...p}>
      <path d="M12 4v12" />
      <path d="m7 11 5 5 5-5" />
      <path d="M4 20h16" />
    </svg>
  );
}

type Status = "empty" | "loading" | "success" | "error";

function Index() {
  const configured = isConfigured();

  /* ================= PANEL 1 — MEETING ================= */
  const [recState, setRecState] = useState<"idle" | "recording">("idle");
  const [seconds, setSeconds] = useState(0);
  const [mStatus, setMStatus] = useState<Status>("empty");
  const [mError, setMError] = useState<string | null>(null);
  const [mResumo, setMResumo] = useState<string[]>([]);
  const [mAcoes, setMAcoes] = useState<string[]>([]);
  const [mDecisoes, setMDecisoes] = useState<string[]>([]);
  const [mInsight, setMInsight] = useState("");
  const [ataOpen, setAtaOpen] = useState(false);
  const [mId, setMId] = useState<string | null>(null);
  const [dlLoading, setDlLoading] = useState(false);
  const [dlError, setDlError] = useState<string | null>(null);
  const [canRetryMeeting, setCanRetryMeeting] = useState(false);
  const [copiedDocument, setCopiedDocument] = useState<"ata" | "arquivo" | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const meetingBlobRef = useRef<Blob | null>(null);
  const meetingNameRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const revokeUrl = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  };

  const stopTracks = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      stopTracks();
      revokeUrl();
    };
  }, []);

  const sendMeeting = useCallback(async () => {
    const blob = meetingBlobRef.current;
    const name = meetingNameRef.current;
    if (!blob || !name) {
      setMStatus("error");
      setMError(MSG.vazio);
      setCanRetryMeeting(false);
      return;
    }
    setMStatus("loading");
    setMError(null);
    try {
      const data = await postAudio(blob, name, "reuniao");
      const id = (data as { id?: unknown })?.id;
      const resumo = (data as { resumo?: unknown })?.resumo;
      const acoes = (data as { acoes?: unknown })?.acoes;
      const decisoes = (data as { decisoes?: unknown })?.decisoes;
      const insight = (data as { insight?: unknown })?.insight;
      if (
        typeof id !== "string" ||
        id.trim() === "" ||
        !isStringArray(resumo) ||
        !isStringArray(acoes)
      ) {
        throw new Error(MSG.contrato);
      }
      setMId(id);
      setMResumo(resumo);
      setMAcoes(acoes);
      setMDecisoes(isStringArray(decisoes) ? decisoes : []);
      setMInsight(typeof insight === "string" ? insight : "");
      setMStatus("success");
      setCanRetryMeeting(true);
    } catch (e) {
      setMError((e as Error).message || MSG.contrato);
      setMStatus("error");
      setCanRetryMeeting(true);
    }
  }, []);

  const startRecording = async () => {
    setMError(null);
    setDlError(null);
    setMResumo([]);
    setMAcoes([]);
    setMDecisoes([]);
    setMInsight("");
    setAtaOpen(false);
    setMId(null);
    setMStatus("empty");
    setCanRetryMeeting(false);
    meetingBlobRef.current = null;
    meetingNameRef.current = null;
    revokeUrl();

    if (!configured) {
      setMStatus("error");
      setMError(MSG.naoConfig);
      return;
    }
    if (typeof window === "undefined" || !window.isSecureContext) {
      setMStatus("error");
      setMError(
        "Recording requires a secure HTTPS connection. Open this page over HTTPS and try again.",
      );
      return;
    }
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setMStatus("error");
      setMError(
        "This browser cannot record audio. Use another browser or upload a file in the adjacent panel.",
      );
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setMStatus("error");
      setMError(
        "We could not access the microphone. Allow access in your browser and try again.",
      );
      return;
    }
    streamRef.current = stream;
    chunksRef.current = [];

    const candidates = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg",
      "audio/mp4",
      "audio/mpeg",
      "audio/wav",
    ];
    let chosen: string | undefined;
    for (const c of candidates) {
      if (typeof MediaRecorder.isTypeSupported === "function" && MediaRecorder.isTypeSupported(c)) {
        chosen = c;
        break;
      }
    }

    let recorder: MediaRecorder;
    try {
      recorder = chosen
        ? new MediaRecorder(stream, { mimeType: chosen })
        : new MediaRecorder(stream);
    } catch {
      stopTracks();
      setMStatus("error");
      setMError(
        "We could not start recording in this browser. Try again or upload a file.",
      );
      return;
    }
    recorderRef.current = recorder;

    recorder.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data);
    };
    recorder.onstop = () => {
      stopTracks();
      const realMime = recorder.mimeType || (chunksRef.current[0] as Blob | undefined)?.type || "";
      const blob = realMime
        ? new Blob(chunksRef.current, { type: realMime })
        : new Blob(chunksRef.current);
      chunksRef.current = [];
      const effectiveMime = realMime || blob.type;
      revokeUrl();
      objectUrlRef.current = URL.createObjectURL(blob);

      if (blob.size === 0) {
        setMStatus("error");
        setMError(MSG.vazio);
        setCanRetryMeeting(false);
        return;
      }
      const ext = extFor(effectiveMime);
      if (!ext) {
        setMStatus("error");
        setMError(MSG.formato);
        setCanRetryMeeting(false);
        return;
      }
      if (blob.size > MAX_BYTES) {
        setMStatus("error");
        setMError(MSG.tamanho);
        setCanRetryMeeting(false);
        return;
      }
      meetingBlobRef.current = blob;
      meetingNameRef.current = `meeting${ext}`;
      void sendMeeting();
    };

    recorder.start();
    setSeconds(0);
    setRecState("recording");
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRecState("idle");
    try {
      recorderRef.current?.stop();
    } catch {
      stopTracks();
    }
  };

  const downloadMeetingTranscript = async () => {
    if (!mId) return;
    if (!configured) {
      setDlError(MSG.naoConfig);
      return;
    }
    setDlLoading(true);
    setDlError(null);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      let res: Response;
      try {
        res = await fetch(`${WEBHOOK_DOWNLOAD}?id=${encodeURIComponent(mId)}`, {
          method: "GET",
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });
      } catch (e) {
        throw new Error((e as Error)?.name === "AbortError" ? MSG.timeout : MSG.rede);
      }
      if (!res.ok) throw new Error(MSG.http);
      let data: unknown;
      try {
        data = await res.json();
      } catch {
        throw new Error(MSG.contrato);
      }
      const t = (data as { transcricao?: unknown })?.transcricao;
      if (typeof t !== "string") throw new Error(MSG.contrato);
      downloadText(t, `transcricao-reuniao-${sanitizeId(mId)}.txt`);
    } catch (e) {
      setDlError((e as Error).message || MSG.contrato);
    } finally {
      clearTimeout(timer);
      setDlLoading(false);
    }
  };

  const resetMeeting = () => {
    setMStatus("empty");
    setMError(null);
    setDlError(null);
    setMResumo([]);
    setMAcoes([]);
    setMDecisoes([]);
    setMInsight("");
    setAtaOpen(false);
    setMId(null);
    setSeconds(0);
    setCanRetryMeeting(false);
    meetingBlobRef.current = null;
    meetingNameRef.current = null;
    revokeUrl();
  };

  /* ================= PANEL 2 — FILE ================= */
  const [file, setFile] = useState<File | null>(null);
  const [fStatus, setFStatus] = useState<Status>("empty");
  const [fError, setFError] = useState<string | null>(null);
  const [transcricao, setTranscricao] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const validateFile = (f: File): string | null => {
    if (f.size === 0) return MSG.vazio;
    const mime = baseMime(f.type);
    if (mime) {
      if (!mime.startsWith("audio/")) return MSG.formato;
    } else {
      const lower = f.name.toLowerCase();
      if (!EXT_FALLBACK.some((e) => lower.endsWith(e))) return MSG.formato;
    }
    if (f.size > MAX_BYTES) return MSG.tamanho;
    return null;
  };

  const acceptFile = (f: File | null | undefined) => {
    setTranscricao("");
    setFError(null);
    setFStatus("empty");
    if (!f) {
      setFile(null);
      return;
    }
    const problem = validateFile(f);
    if (problem) {
      setFile(null);
      setFStatus("error");
      setFError(problem);
      return;
    }
    setFile(f);
  };

  const sendFile = useCallback(
    async (f: File) => {
      if (!configured) {
        setFStatus("error");
        setFError(MSG.naoConfig);
        return;
      }
      const problem = validateFile(f);
      if (problem) {
        setFStatus("error");
        setFError(problem);
        return;
      }
      setFStatus("loading");
      setFError(null);
      try {
        const data = await postAudio(f, f.name, "arquivo");
        const t = (data as { transcricao?: unknown })?.transcricao;
        if (typeof t !== "string") throw new Error(MSG.contrato);
        setTranscricao(t);
        setFStatus("success");
      } catch (e) {
        setFError((e as Error).message || MSG.contrato);
        setFStatus("error");
      }
    },
    [configured],
  );

  const resetFile = () => {
    setFile(null);
    setTranscricao("");
    setFError(null);
    setFStatus("empty");
    if (inputRef.current) inputRef.current.value = "";
  };

  const dropZoneKey = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
      e.preventDefault();
      inputRef.current?.click();
    }
  };

  const meetingBusy = mStatus === "loading";

  useEffect(() => {
    if (!ataOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAtaOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [ataOpen]);

  const buildAtaText = () => {
    const lines: string[] = ["# Meeting minutes", ""];
    lines.push("## Summary", "");
    lines.push(
      ...(mResumo.length
        ? mResumo.map((t) => `- ${capFirst(t)}`)
        : ["- No topics were identified."]),
    );
    if (mDecisoes.length) {
      lines.push("", "## Decisions", "", ...mDecisoes.map((t) => `- ${capFirst(t)}`));
    }
    lines.push("", "## Actions", "");
    lines.push(
      ...(mAcoes.length ? mAcoes.map((t) => `- ${capFirst(t)}`) : ["- No actions were identified."]),
    );
    if (mInsight.trim()) {
      lines.push(
        "",
        "## Assistant recommendation (for review and approval)",
        "",
        capFirst(mInsight),
      );
    }
    return `${lines.join("\n")}\n`;
  };

  const copyDocument = async (kind: "ata" | "arquivo", text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedDocument(kind);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopiedDocument(null), 1800);
    } catch {
      if (kind === "ata") setDlError("We could not copy the document.");
      else setFError("We could not copy the document.");
    }
  };

  const ataSections = (
    <>
      <div>
        <h4 style={{ ...S.h3, marginBottom: 10 }}>Summary</h4>
        {mResumo.length > 0 ? (
          <ul style={S.list}>
            {mResumo.map((t, i) => (
              <li key={`r-${i}`}>{capFirst(t)}</li>
            ))}
          </ul>
        ) : (
          <p style={S.text}>No topics were identified in this meeting.</p>
        )}
      </div>

      {mDecisoes.length > 0 && (
        <div>
          <h4 style={{ ...S.h3, marginBottom: 10 }}>Decisions</h4>
          <ul style={S.list}>
            {mDecisoes.map((t, i) => (
              <li key={`d-${i}`}>{capFirst(t)}</li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h4 style={{ ...S.h3, marginBottom: 10 }}>Actions</h4>
        {mAcoes.length > 0 ? (
          <ul style={S.list}>
            {mAcoes.map((t, i) => (
              <li key={`a-${i}`}>{capFirst(t)}</li>
            ))}
          </ul>
        ) : (
          <p style={S.text}>No actions were identified in this meeting.</p>
        )}
      </div>

      {mInsight.trim() && (
        <div>
          <h4 style={{ ...S.h3, marginBottom: 10 }}>Assistant recommendation</h4>
          <div style={S.callout}>
            <p style={{ margin: 0, display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span aria-hidden="true">💡</span>
              <span>{capFirst(mInsight)}</span>
            </p>
            <span style={S.badge}>para análise e aprovação</span>
          </div>
        </div>
      )}
    </>
  );
  const fileBusy = fStatus === "loading";

  return (
    <div style={S.page}>
      <style>{`
        button:focus-visible, [tabindex]:focus-visible, textarea:focus-visible, input:focus-visible {
          outline: 3px solid ${C.accent};
          outline-offset: 2px;
        }
        .aa-primary:hover:not(:disabled) { background: #7F2A0E; border-color: #7F2A0E; }
        .aa-primary:active:not(:disabled) { background: #6B240C; border-color: #6B240C; transform: translateY(1px); }
        .aa-secondary:hover:not(:disabled) { background: ${C.accentSoft}; border-color: ${C.accent}; }
        .aa-secondary:active:not(:disabled) { background: #F4E4DC; transform: translateY(1px); }
        button:disabled { opacity: .55; cursor: not-allowed; }
        .aa-upload {
          background: ${C.paper};
          border: 2px dashed ${C.control};
          transition: background-color 120ms ease, border-color 120ms ease;
        }
        .aa-upload:hover { background: ${C.accentSoft}; border-color: ${C.accent}; }
        .aa-upload:focus-visible { background: ${C.accentSoft}; border-color: ${C.accent}; }
        .aa-upload.dragging { background: ${C.accentSoft}; border: 2px solid ${C.accent}; }
        .aa-ghost:hover { background: ${C.accentSoft}; color: ${C.accent}; border-color: ${C.rule}; }
        @keyframes aa-spin { to { transform: rotate(360deg); } }
        @media (max-width: 900px) { .aa-grid { grid-template-columns: 1fr !important; } }
      `}</style>

      <div style={S.wrap}>
        <header style={S.header}>
          <div style={S.brand}>
            <span style={{ display: "inline-flex", width: 16, height: 16 }} aria-hidden="true">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z" />
                <path d="M5 11a7 7 0 0 0 14 0" />
                <path d="M12 18v3" />
              </svg>
            </span>
            Audio to Minutes
          </div>
          <h1 style={S.h1}>From meeting to minutes — and from audio to text.</h1>
          <p style={S.sub}>Record an in-person conversation or upload an audio file.</p>
        </header>

        <hr style={S.rule} />

        <main className="aa-grid" style={S.grid}>
          {/* ---------------- PANEL 1 ---------------- */}
          <section style={S.panel} aria-labelledby="t-reuniao">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <h2 id="t-reuniao" style={S.h2}>
                Summarize a meeting
              </h2>
              <p style={S.text}>
                Use this device's microphone to record an in-person meeting.
              </p>
              <p style={S.hint}>(record up to 90 minutes)</p>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 14 }}>
              {recState === "idle" ? (
                <button
                  type="button"
                  className="aa-primary"
                  style={{ ...S.btn, display: "inline-flex", alignItems: "center", gap: 8 }}
                  onClick={startRecording}
                  disabled={meetingBusy}
                >
                  <Icon name="mic" />
                  Start recording
                </button>
              ) : (
                <>
                  <span style={{ fontWeight: 600 }}>Recording</span>
                  <span style={S.timer} aria-hidden="true">
                    {fmtTime(seconds)}
                  </span>
                  <button
                    type="button"
                    className="aa-secondary"
                    style={{ ...S.btn2, display: "inline-flex", alignItems: "center", gap: 8 }}
                    onClick={stopRecording}
                    disabled={meetingBusy}
                  >
                    <Icon name="stop" />
                    Stop recording
                  </button>
                </>
              )}

              {meetingBusy && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    color: C.ink2,
                    fontSize: 14,
                  }}
                >
                  <span style={S.spinner} aria-hidden="true" />
                  Processing…
                </span>
              )}
            </div>

            <div style={S.out}>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <h3 style={S.h3}>Meeting minutes</h3>
                {mStatus === "success" && (
                  <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                    {copiedDocument === "ata" && (
                      <span
                        aria-live="polite"
                        style={{ color: C.ink2, fontSize: 13, marginRight: 4 }}
                      >
                        Copied
                      </span>
                    )}
                    <button
                      type="button"
                      className="aa-ghost"
                      style={S.ghost}
                      onClick={() => void copyDocument("ata", buildAtaText())}
                      aria-label="Copy meeting minutes"
                      title="Copy"
                    >
                      <Icon name="copy" />
                    </button>
                    <button
                      type="button"
                      className="aa-ghost"
                      style={S.ghost}
                      onClick={() => downloadText(buildAtaText(), "meeting-minutes.md")}
                      aria-label="Download meeting minutes"
                      title="Download"
                    >
                      <Icon name="download" />
                    </button>
                    <button
                      type="button"
                      className="aa-ghost"
                      style={S.ghost}
                      onClick={() => printText("Meeting minutes", buildAtaText())}
                      aria-label="Print meeting minutes"
                      title="Print"
                    >
                      <Icon name="print" />
                    </button>
                    <button
                      type="button"
                      className="aa-ghost"
                      style={S.ghost}
                      onClick={() => setAtaOpen(true)}
                      aria-label="Expand meeting minutes"
                      title="Expand"
                    >
                      ⤢
                    </button>
                  </div>
                )}
              </div>

              <div aria-live="polite">
                {mStatus === "empty" && <p style={S.text}>Your meeting minutes will appear here after recording.</p>}
                {mStatus === "loading" && (
                  <p style={S.text}>Transcribing and organizing the meeting…</p>
                )}
              </div>

              {mStatus === "error" && mError && (
                <div role="alert" style={S.err}>
                  <strong>Error:</strong> {mError}
                </div>
              )}

              {mStatus === "error" && canRetryMeeting && (
                <div>
                  <button
                    type="button"
                    className="aa-primary"
                    style={S.btn}
                    onClick={() => void sendMeeting()}
                    disabled={meetingBusy}
                  >
                    Try again
                  </button>
                </div>
              )}

              {mStatus === "success" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  <div style={S.scrollBox}>{ataSections}</div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
                    <button
                      type="button"
                      className="aa-primary"
                      style={{ ...S.btn, display: "inline-flex", alignItems: "center", gap: 8 }}
                      onClick={() => void downloadMeetingTranscript()}
                      disabled={dlLoading}
                    >
                      <Icon name="download" />
                      Download full transcript
                    </button>
                    <button
                      type="button"
                      className="aa-secondary"
                      style={{ ...S.btn2, display: "inline-flex", alignItems: "center", gap: 8 }}
                      onClick={() => downloadText(buildAtaText(), "meeting-minutes.md")}
                    >
                      <Icon name="download" />
                      Download meeting minutes
                    </button>
                    <button
                      type="button"
                      className="aa-secondary"
                      style={S.btn2}
                      onClick={resetMeeting}
                    >
                      Start over
                    </button>
                  </div>

                  <div aria-live="polite">
                    {dlLoading && <p style={S.text}>Preparing transcript…</p>}
                  </div>

                  {dlError && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <div role="alert" style={S.err}>
                        <strong>Error:</strong> {dlError}
                      </div>
                      <div>
                        <button
                          type="button"
                          className="aa-secondary"
                          style={S.btn2}
                          onClick={() => void downloadMeetingTranscript()}
                          disabled={dlLoading}
                        >
                          Try download again
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {ataOpen && mStatus === "success" && (
              <div
                style={S.overlay}
                role="dialog"
                aria-modal="true"
                aria-label="Meeting minutes"
                onClick={() => setAtaOpen(false)}
              >
                <div style={S.modal} onClick={(e) => e.stopPropagation()}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
                    <h3 style={{ ...S.h2 }}>Meeting minutes</h3>
                    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <button
                        type="button"
                        className="aa-ghost"
                        style={S.ghost}
                        onClick={() => void copyDocument("ata", buildAtaText())}
                        aria-label="Copy meeting minutes"
                        title="Copy"
                      >
                        <Icon name="copy" />
                      </button>
                      <button
                        type="button"
                        className="aa-ghost"
                        style={S.ghost}
                        onClick={() => downloadText(buildAtaText(), "meeting-minutes.md")}
                        aria-label="Download meeting minutes"
                        title="Download"
                      >
                        <Icon name="download" />
                      </button>
                      <button
                        type="button"
                        className="aa-ghost"
                        style={S.ghost}
                        onClick={() => printText("Meeting minutes", buildAtaText())}
                        aria-label="Print meeting minutes"
                        title="Print"
                      >
                        <Icon name="print" />
                      </button>
                      <button
                        type="button"
                        className="aa-ghost"
                        style={S.ghost}
                        onClick={() => setAtaOpen(false)}
                        aria-label="Close"
                        title="Close"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    {ataSections}
                  </div>
                  <div>
                    <button
                      type="button"
                      className="aa-secondary"
                      style={S.btn2}
                      onClick={() => setAtaOpen(false)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* ---------------- PANEL 2 ---------------- */}
          <section style={S.panel} aria-labelledby="t-arquivo">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <h2 id="t-arquivo" style={S.h2}>
                Transcribe a file
              </h2>
              <p style={S.text}>Upload audio to receive the full text.</p>
            </div>

            <div>
              <label htmlFor="aa-file" style={S.label}>
                Audio file
              </label>
              <input
                id="aa-file"
                ref={inputRef}
                type="file"
                accept="audio/*,.webm,.mp3,.wav,.m4a,.ogg"
                onChange={(e) => acceptFile(e.target.files?.[0] ?? null)}
                style={{
                  position: "absolute",
                  width: 1,
                  height: 1,
                  opacity: 0,
                  pointerEvents: "none",
                }}
              />
              <button
                type="button"
                className={`aa-upload${dragging ? " dragging" : ""}`}
                onClick={() => inputRef.current?.click()}
                onKeyDown={dropZoneKey}
                onDragEnter={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setDragging(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  acceptFile(e.dataTransfer.files?.[0] ?? null);
                }}
                style={{
                  width: "100%",
                  minHeight: 140,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  fontFamily: font,
                  fontSize: 15,
                  fontWeight: 500,
                  color: C.ink,
                  borderRadius: 10,
                  cursor: "pointer",
                  padding: 24,
                }}
              >
                <Icon name="upload" />
                Drag audio here or choose a file
              </button>
            </div>

            {file && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <p style={S.chip}>
                  Selected file: {file.name} — {humanSize(file.size)}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  <button
                    type="button"
                    className="aa-primary"
                    style={S.btn}
                    onClick={() => void sendFile(file)}
                    disabled={fileBusy}
                  >
                    Transcribe file
                  </button>
                  {fStatus === "success" && (
                    <button
                      type="button"
                      className="aa-secondary"
                      style={S.btn2}
                      onClick={resetFile}
                    >
                      Start over
                    </button>
                  )}
                </div>
              </div>
            )}

            <div style={S.out}>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <h3 style={S.h3}>File transcript</h3>
                {fStatus === "success" && (
                  <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                    {copiedDocument === "arquivo" && (
                      <span
                        aria-live="polite"
                        style={{ color: C.ink2, fontSize: 13, marginRight: 4 }}
                      >
                        Copied
                      </span>
                    )}
                    <button
                      type="button"
                      className="aa-ghost"
                      style={S.ghost}
                      onClick={() => void copyDocument("arquivo", transcricao)}
                      aria-label="Copy file transcript"
                      title="Copy"
                    >
                      <Icon name="copy" />
                    </button>
                    <button
                      type="button"
                      className="aa-ghost"
                      style={S.ghost}
                      onClick={() => downloadText(transcricao, "file-transcript.txt")}
                      aria-label="Download file transcript"
                      title="Download"
                    >
                      <Icon name="download" />
                    </button>
                    <button
                      type="button"
                      className="aa-ghost"
                      style={S.ghost}
                      onClick={() => printText("File transcript", transcricao)}
                      aria-label="Print file transcript"
                      title="Print"
                    >
                      <Icon name="print" />
                    </button>
                  </div>
                )}
              </div>

              <div aria-live="polite">
                {fStatus === "empty" && !file && (
                  <p style={S.text}>The full text will appear here after upload.</p>
                )}
                {fStatus === "empty" && file && (
                  <p style={S.text}>The full text will appear here after upload.</p>
                )}
                {fStatus === "loading" && <p style={S.text}>Transcribing the file…</p>}
              </div>

              {fStatus === "error" && fError && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div role="alert" style={S.err}>
                    <strong>Error:</strong> {fError}
                  </div>
                  {file && (
                    <div>
                      <button
                        type="button"
                        className="aa-primary"
                        style={S.btn}
                        onClick={() => void sendFile(file)}
                        disabled={fileBusy}
                      >
                        Try again
                      </button>
                    </div>
                  )}
                </div>
              )}

              {fStatus === "success" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <label htmlFor="aa-transcricao" style={S.label}>
                      Full transcript
                    </label>
                    <textarea id="aa-transcricao" readOnly value={transcricao} style={S.ta} />
                  </div>
                  <div>
                    <button
                      type="button"
                      className="aa-primary"
                      style={{ ...S.btn, display: "inline-flex", alignItems: "center", gap: 8 }}
                      onClick={() => downloadText(transcricao, "file-transcript.txt")}
                    >
                      <Icon name="download" />
                      Download transcript
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
