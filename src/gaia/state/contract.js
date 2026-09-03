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
