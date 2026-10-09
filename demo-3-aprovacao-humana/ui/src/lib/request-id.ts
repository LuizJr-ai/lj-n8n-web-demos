/**
 * Purpose: give each SUBMISSION — not each click — a stable identity, so the same message
 * sent twice becomes one case in the queue instead of two.
 *
 * Why this exists: the send button is disabled while the request is in flight, but that does
 * not cover the real duplicate: the answer gets lost on the way back, the person sees nothing
 * happen and sends again. Without an identity carried by the submission itself, the server has
 * no way to tell a retry from a genuinely new message.
 *
 * The rule: the id is created on the first attempt, REUSED by every retry of that same
 * submission, and only dropped once the server has confirmed the case was stored.
 */

/** Creates an opaque id. Falls back when the browser has no crypto.randomUUID. */
export function novoRequestId(): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  // Fallback: good enough to tell two submissions apart; this is not a security token.
  return `r-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Decides which id the next attempt must carry.
 * `atual` is what the form is already holding (null when there is no attempt in progress).
 */
export function idParaTentativa(atual: string | null): string {
  return atual ?? novoRequestId();
}
