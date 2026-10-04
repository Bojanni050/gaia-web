/**
 * The conversation contract between Gaia Web and Gaia Cloud.
 *
 * The web client sends plain user turns and renders plain replies. Identity,
 * memory, intent and reasoning all happen server-side: this file declares
 * the turn body, nothing more.
 */

/**
 * Build request body for a turn
 * @param {Array} messages - Array of {role, content} objects
 * @param {string} [conversationId] - Optional conversation ID for persistence
 */
function buildTurnBody(messages, conversationId) {
  const body = {
    messages: messages.map(({ role, content }) => ({ role, content })),
  };
  if (conversationId) body.conversationId = conversationId;

  // Attachments belong to the last user message
  const last = messages[messages.length - 1];
  if (last && last.role === 'user' && Array.isArray(last.attachmentIds) && last.attachmentIds.length > 0) {
    body.attachmentIds = last.attachmentIds;
  }
  return body;
}

/**
 * Build body for a streaming turn: POST /conversation/turn's flat JSON
 * body ({ messages, conversationId?, attachmentIds? }) — gaia-api has no
 * {status,body} envelope, so there is nothing to wrap or parse here.
 */
export function buildStreamTurnBody(messages, conversationId) {
  return buildTurnBody(messages, conversationId);
}

// --- cognition review (gaia/cognition/ReviewSection.jsx) --------------------
// The human Absolute Override. The web client talks to gaia-api's flat JSON
// directly (no {status,body} envelope), so these builders describe the request
// only; the API module reads the parsed body.

/** The derived statements awaiting the person's judgement. */
export function buildCognitionListRequest() {
  return { method: 'get', path: '/cognition/hypotheses' };
}

export function buildCognitionTestRequest(id) {
  return { method: 'post', path: `/cognition/hypotheses/${id}/test` };
}

export function buildCognitionRejectRequest(id, reason) {
  const request = { method: 'post', path: `/cognition/hypotheses/${id}/reject` };
  if (reason) request.body = { reason };
  return request;
}

/**
 * `confirm` is the only path to `confirmed`. `supersedes` names older,
 * contradicting statements this replaces (the server marks them rejected as
 * `consolidatie`).
 */
export function buildCognitionConfirmRequest(id, { supersedes, rationale } = {}) {
  const request = { method: 'post', path: `/cognition/hypotheses/${id}/confirm` };
  const body = {};
  if (Array.isArray(supersedes) && supersedes.length > 0) body.supersedes = supersedes;
  if (rationale) body.rationale = rationale;
  if (Object.keys(body).length > 0) request.body = body;
  return request;
}
