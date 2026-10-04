/**
 * The web client's bridge to Gaia Cloud API.
 *
 * Unlike the desktop (which goes through Rust/Tauri), the web client
 * talks directly to Gaia Cloud via HTTP/fetch. This module provides
 * the same interface as the desktop's serverApi for consistency.
 */

// Base URL for Gaia Cloud API — fixed to this deployment's own same-origin
// nginx proxy (nginx.conf.template's /api/gaia/ block), which injects the
// Bearer token server-side. This used to be user-configurable via Settings
// (an absolute URL + a manually-entered token), which cannot ever actually
// work from a browser — gaia-api sends no CORS headers, so a direct
// cross-origin call is always blocked, and the token would have to live in
// the browser besides. There is exactly one gaia-api this deployment talks
// to, so there is nothing to configure; the setting was removed rather than
// fixed to be safely clearable.
const apiBaseUrl = '/api/gaia';

function getHeaders() {
  return { 'Content-Type': 'application/json' };
}

/**
 * Generic request wrapper for Gaia Cloud API
 */
async function request(method, path, body = null) {
  if (!apiBaseUrl) {
    throw new Error('No Gaia Server configured');
  }

  const url = `${apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  const options = {
    method,
    headers: getHeaders(),
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.message || `HTTP ${response.status}`);
    error.status = response.status;
    error.kind = 'communication';
    throw error;
  }

  return response.json();
}

// Event listeners for SSE
const eventListeners = new Set();
let eventSource = null;

function setupEventSource() {
  if (!apiBaseUrl || eventSource) return;

  try {
    eventSource = new EventSource(`${apiBaseUrl}/conversations/events`, {
      headers: getHeaders(),
    });

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        eventListeners.forEach((listener) => listener(data));
      } catch (e) {
        console.warn('Failed to parse SSE event:', e);
      }
    };

    eventSource.onerror = () => {
      // Attempt to reconnect
      setTimeout(() => {
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        setupEventSource();
      }, 5000);
    };
  } catch (e) {
    console.warn('Failed to setup SSE:', e);
  }
}

export const serverApi = {
  getStatus: async () => {
    try {
      await request('get', '/health');
      return { status: 'online' };
    } catch (e) {
      return { status: 'offline' };
    }
  },

  request: (requestConfig) => {
    return request(requestConfig.method, requestConfig.path, requestConfig.body);
  },

  getCloudVersion: async () => {
    try {
      const response = await request('get', '/version');
      return response.body || response;
    } catch (e) {
      throw e;
    }
  },

  getDesktopVersion: async () => {
    // For web, return the same as cloud version or a default
    return {
      name: 'Gaia Web',
      version: process.env.REACT_APP_VERSION || '1.0.0',
      build: new Date().toISOString().slice(0, 10),
      commit: null,
    };
  },

  onStatus: (handler) => {
    // For web, we'll use the same mechanism as onServerEvent for now
    return serverApi.onServerEvent((event) => {
      if (event?.topic === 'server.status') {
        handler(event.payload);
      }
    });
  },

  onServerEvent: (handler) => {
    eventListeners.add(handler);
    setupEventSource();
    return () => {
      eventListeners.delete(handler);
    };
  },

  streamTurn: async (body, onDelta) => {
    if (!apiBaseUrl) {
      throw new Error('No Gaia Server configured');
    }

    const url = `${apiBaseUrl}/conversation/turn`;
    const response = await fetch(url, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.message || `HTTP ${response.status}`);
      error.status = response.status;
      error.kind = 'communication';
      throw error;
    }

    // For now, we'll simulate streaming by accumulating the response
    // In a real implementation, this would use SSE or similar
    const fullResponse = await response.json();
    // server.js's own documented contract: POST /conversation/turn ->
    // { reply: string }, flat — not { body: { reply } }. This mismatch
    // meant every send produced an empty fullText, so receivedAny/fullReply
    // in useConversation.js's runTurn were always falsy and every turn
    // failed with "Gaia Server returned no reply" regardless of what Gaia
    // actually answered.
    const fullText = fullResponse.reply || '';
    
    // Split into chunks for simulation
    const chunkSize = 50;
    for (let i = 0; i < fullText.length; i += chunkSize) {
      const chunk = fullText.slice(i, i + chunkSize);
      onDelta({ content: chunk, reasoningContent: '' });
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    return fullText;
  },
};

export const presenceApi = {
  get: async () => {
    // For web, we'll use localStorage for presence state
    const quiet = localStorage.getItem('gaia.presence.quiet') === 'true';
    return { quiet };
  },

  setQuiet: async (quiet) => {
    localStorage.setItem('gaia.presence.quiet', String(quiet));
    return { quiet };
  },

  onChanged: (handler) => {
    // For web, we'll trigger on localStorage changes
    const listener = () => {
      const quiet = localStorage.getItem('gaia.presence.quiet') === 'true';
      handler({ quiet });
    };
    window.addEventListener('storage', listener);
    return () => window.removeEventListener('storage', listener);
  },
};


export const captureApi = {
  listSources: async () => {
    // For web, capture sources are not applicable
    return [];
  },
};

export const audioApi = {
  getStatus: async () => ({
    available: false,
    message: 'Audio not supported in web client',
  }),
};

export const speechApi = {
  async synthesize(text) {
    // For web, we'll use the Web Speech API if available
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      // Note: Web Speech API doesn't return audio bytes
      // For now, we'll just speak and return an empty array
      window.speechSynthesis.speak(utterance);
      return new Uint8Array();
    }
    throw new Error('Speech synthesis not supported');
  },
};

export const libraryApi = {
  listFiles: async () => {
    // libraryRoutes.js mounts under /library and the list route is /files
    // (GET /library/files -> { files: [...] }, a flat response — gaia-api
    // has no {status,body} envelope anywhere; that shape only ever existed
    // on the desktop's Tauri IPC bridge).
    const response = await request('get', '/library/files');
    return response.files || [];
  },

  deleteFile: async (id) => {
    await request('delete', `/library/files/${id}`);
    return { ok: true };
  },

  async pickAndUploadFile() {
    // For web, we'll use a file input dialog
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = false;
      input.onchange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) {
          resolve(null);
          return;
        }

        try {
          const formData = new FormData();
          formData.append('file', file);

          // POST /library/files -> { id, filename, mimeType, size, uploadedAt }
          // directly (libraryRoutes.js) — flat, not { file: {...} }. No
          // Content-Type header here: fetch must set its own multipart
          // boundary for FormData — getHeaders()'s fixed
          // 'application/json' would break multer's parsing entirely.
          const url = `${apiBaseUrl}/library/files`;
          const response = await fetch(url, {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error('Upload failed');
          }

          const result = await response.json();
          resolve(result || { id: Date.now().toString(), filename: file.name });
        } catch (e) {
          resolve(null);
        }
      };
      input.click();
    });
  },

  async downloadFile(id, filename) {
    try {
      // GET /library/files/:id -> raw file bytes (libraryRoutes.js); no
      // separate /download suffix.
      const url = `${apiBaseUrl}/library/files/${id}`;
      const response = await fetch(url, {
        method: 'GET',
      });

      if (!response.ok) {
        return false;
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
      return true;
    } catch (e) {
      return false;
    }
  },
};

export const historyApi = {
  // historyRoutes.js's responses are all flat JSON — { conversations: [...] },
  // { meta, messages } — never a { status, body } envelope. That envelope
  // shape only exists on gaia-desktop's Tauri IPC bridge; request() here
  // already returns the parsed body directly, so response.body was always
  // undefined and every one of these silently fell back to empty.
  list: async () => {
    const response = await request('get', '/conversations');
    return response.conversations || [];
  },

  get: async (id) => {
    const response = await request('get', `/conversations/${id}`);
    return {
      meta: response.meta || {},
      messages: response.messages || [],
    };
  },

  remove: async (id) => {
    await request('delete', `/conversations/${id}`);
    return { ok: true };
  },

  exportJson: async (id) => {
    const response = await request('get', `/conversations/${id}/export/json`);
    return JSON.stringify(response, null, 2);
  },

  exportMarkdown: async (id) => {
    // The server sends this one as text/markdown, not JSON (res.send, not
    // res.json — historyRoutes.js) — request() always calls response.json(),
    // which would throw parsing a Markdown body, so this needs its own
    // fetch.
    const response = await fetch(`${apiBaseUrl}/conversations/${id}/export/markdown`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.text();
  },
};

export const notify = (options) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(options.title || 'Gaia', {
      body: options.body,
      icon: options.icon,
    });
  }
};

/**
 * Cognition review — the derived statements Logos is still weighing and the
 * human verdicts on them (`/cognition/*` on Gaia Cloud). `confirm` is the only
 * path to `confirmed`. gaia-api returns flat JSON, so each method reads the
 * parsed body directly (never a { status, body } envelope).
 */
export const cognitionApi = {
  list: async () => {
    const response = await request('get', '/cognition/hypotheses');
    return response.hypotheses || [];
  },
  test: (id) => request('post', `/cognition/hypotheses/${id}/test`),
  reject: (id, reason) => request('post', `/cognition/hypotheses/${id}/reject`, reason ? { reason } : null),
  reopen: (id, reason) => request('post', `/cognition/hypotheses/${id}/reopen`, { reason }),
  confirm: (id, { supersedes, rationale, statement } = {}) => {
    const body = {};
    if (Array.isArray(supersedes) && supersedes.length > 0) body.supersedes = supersedes;
    if (rationale) body.rationale = rationale;
    if (statement) body.statement = statement;
    return request('post', `/cognition/hypotheses/${id}/confirm`, Object.keys(body).length > 0 ? body : null);
  },
};
