/**
 * The conversation contract between Gaia Web and Gaia Cloud.
 *
 * The web client sends plain user turns and renders plain replies. Identity,
 * memory, intent and reasoning all happen server-side: this file declares
 * the envelope, nothing more.
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

export function buildTurnRequest(messages, conversationId) {
  return { method: 'post', path: 'conversation/turn', body: buildTurnBody(messages, conversationId) };
}

/**
 * Build body for streaming turn (same shape as buildTurnRequest but without envelope)
 */
export function buildStreamTurnBody(messages, conversationId) {
  return buildTurnBody(messages, conversationId);
}

export function parseReply(response) {
  const reply = response?.body?.reply;
  if (typeof reply === 'string' && reply.length > 0) {
    return reply;
  }
  throw new Error('Gaia Server returned no reply');
}

// --- Chat history (history/HistorySection.jsx) -----------------------------

export function buildHistoryListRequest() {
  return { method: 'get', path: 'conversations' };
}

export function buildHistoryGetRequest(id) {
  return { method: 'get', path: `conversations/${id}` };
}

export function buildHistoryDeleteRequest(id) {
  return { method: 'delete', path: `conversations/${id}` };
}

export function buildHistoryExportJsonRequest(id) {
  return { method: 'get', path: `conversations/${id}/export/json` };
}

export function buildHistoryExportMarkdownRequest(id) {
  return { method: 'get', path: `conversations/${id}/export/markdown` };
}

export function parseHistoryList(response) {
  const conversations = response?.body?.conversations;
  return Array.isArray(conversations) ? conversations : [];
}

export function parseHistoryConversation(response) {
  const messages = response?.body?.messages;
  if (!Array.isArray(messages)) {
    throw new Error('Gaia Server returned no conversation');
  }
  return { meta: response.body.meta || {}, messages };
}

export function parseHistoryExport(response, format) {
  const body = response?.body;
  if (!body) {
    throw new Error('Gaia Server returned no export data');
  }

  if (format === 'json') {
    const conversation = body.conversation;
    if (!conversation) {
      throw new Error('Gaia Server returned invalid export data');
    }
    return JSON.stringify(body, null, 2);
  }

  if (format === 'markdown') {
    if (typeof body !== 'string') {
      throw new Error('Gaia Server returned invalid markdown export');
    }
    return body;
  }

  throw new Error(`Unknown export format: ${format}`);
}
