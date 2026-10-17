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
 * The human reopen — the only way out of the rejected quarantine. `rejected`
 * is terminal for every automatic path; the reason is required.
 */
export function buildCognitionReopenRequest(id, reason) {
  return { method: 'post', path: `/cognition/hypotheses/${id}/reopen`, body: { reason } };
}

/**
 * `confirm` is the only path to `confirmed`. `supersedes` names older,
 * contradicting statements this replaces (the server marks them rejected as
 * `consolidatie`).
 */
export function buildCognitionConfirmRequest(id, { supersedes, rationale, statement } = {}) {
  const request = { method: 'post', path: `/cognition/hypotheses/${id}/confirm` };
  const body = {};
  if (Array.isArray(supersedes) && supersedes.length > 0) body.supersedes = supersedes;
  if (rationale) body.rationale = rationale;
  // `statement` is the human's own nuanced re-wording ("Nuanceren"); the
  // server writes it together with the confirmation as one audited act.
  if (statement) body.statement = statement;
  if (Object.keys(body).length > 0) request.body = body;
  return request;
}

// ---------------------------------------------------------------------------
// Research jobs — the deep, sourced investigations Gaia puts out at Hermes.
//
// A research turn is answered immediately and the findings arrive later: the
// server writes them into the conversation and the client reads the queue
// (GET /research/jobs) rather than waiting on a turn. Two different weights
// live in that queue — work in progress, and a run that parked on a command
// and needs the person's decision. Server-side: researchRoutes.js.
// ---------------------------------------------------------------------------

/** The queue: what is running, what parked, and what finished unread. */
export function buildResearchJobsRequest() {
  return { method: 'get', path: '/research/jobs' };
}

/** Read a finished job's findings out of the queue for good. */
export function buildResearchAckRequest(id) {
  return { method: 'post', path: `/research/jobs/${encodeURIComponent(id)}/ack` };
}

/** Answer a run that parked on a command, with one of ITS OWN choices. */
export function buildResearchApprovalRequest(id, choice) {
  const request = { method: 'post', path: `/research/jobs/${encodeURIComponent(id)}/approval` };
  if (choice) request.body = { choice };
  return request;
}

/** The three buckets the queue comes in. */
export function parseResearchJobs(response) {
  const list = (value) => (Array.isArray(value) ? value : []);
  return {
    running: list(response && response.running),
    awaiting: list(response && response.awaiting),
    finished: list(response && response.finished),
  };
}
