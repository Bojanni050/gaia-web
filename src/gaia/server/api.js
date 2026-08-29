/**
 * The web client's bridge to Gaia Cloud API.
 *
 * Unlike the desktop (which goes through Rust/Tauri), the web client
 * talks directly to Gaia Cloud via HTTP/fetch. This module provides
 * the same interface as the desktop's serverApi for consistency.
 */

// Base URL for Gaia Cloud API - can be configured via settings
let apiBaseUrl = localStorage.getItem('gaia.serverUrl') || '';

export function setApiBaseUrl(url) {
  apiBaseUrl = url;
  localStorage.setItem('gaia.serverUrl', url);
}

export function getApiBaseUrl() {
  return apiBaseUrl;
}

// Authentication token
let authToken = localStorage.getItem('gaia.authToken') || '';

export function setAuthToken(token) {
  authToken = token;
  localStorage.setItem('gaia.authToken', token);
}

export function getAuthToken() {
  return authToken;
}

function getHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  return headers;
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
  getConfig: () => ({
    serverUrl: apiBaseUrl,
    authToken: authToken,
  }),

  applyConfig: (config) => {
    if (config.serverUrl) setApiBaseUrl(config.serverUrl);
    if (config.authToken) setAuthToken(config.authToken);
    // Reconnect SSE if URL changed
    if (config.serverUrl) {
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
      setupEventSource();
    }
    return Promise.resolve();
  },

  getStatus: async () => {
    if (!apiBaseUrl) {
      return { status: 'notConfigured' };
    }
    try {
      await request('get', '/health');
      return { status: 'online' };
    } catch (e) {
      return { status: 'offline' };
    }
  },

  testConnection: async () => {
    if (!apiBaseUrl) {
      throw new Error('No server URL configured');
    }
    await request('get', '/health');
    return { ok: true };
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
    const fullText = fullResponse.body?.reply || '';
    
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

export const settingsApi = {
  get: async () => ({
    serverUrl: apiBaseUrl,
    authToken: authToken,
  }),

  save: async (newSettings) => {
    if (newSettings.serverUrl) setApiBaseUrl(newSettings.serverUrl);
    if (newSettings.authToken) setAuthToken(newSettings.authToken);
    return { ok: true };
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
    if (!apiBaseUrl) {
      throw new Error('No Gaia Server configured');
    }
    const response = await request('get', '/library');
    return response.body?.files || [];
  },

  deleteFile: async (id) => {
    if (!apiBaseUrl) {
      throw new Error('No Gaia Server configured');
    }
    await request('delete', `/library/${id}`);
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

          const url = `${apiBaseUrl}/library/upload`;
          const response = await fetch(url, {
            method: 'POST',
            headers: getHeaders(),
            body: formData,
          });

          if (!response.ok) {
            throw new Error('Upload failed');
          }

          const result = await response.json();
          resolve(result.body?.file || { id: Date.now().toString(), filename: file.name });
        } catch (e) {
          resolve(null);
        }
      };
      input.click();
    });
  },

  async downloadFile(id, filename) {
    if (!apiBaseUrl) {
      throw new Error('No Gaia Server configured');
    }

    try {
      const url = `${apiBaseUrl}/library/${id}/download`;
      const response = await fetch(url, {
        method: 'GET',
        headers: getHeaders(),
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
  list: async () => {
    if (!apiBaseUrl) {
      throw new Error('No Gaia Server configured');
    }
    const response = await request('get', '/conversations');
    return response.body?.conversations || [];
  },

  get: async (id) => {
    if (!apiBaseUrl) {
      throw new Error('No Gaia Server configured');
    }
    const response = await request('get', `/conversations/${id}`);
    return {
      meta: response.body?.meta || {},
      messages: response.body?.messages || [],
    };
  },

  remove: async (id) => {
    if (!apiBaseUrl) {
      throw new Error('No Gaia Server configured');
    }
    await request('delete', `/conversations/${id}`);
    return { ok: true };
  },

  exportJson: async (id) => {
    if (!apiBaseUrl) {
      throw new Error('No Gaia Server configured');
    }
    const response = await request('get', `/conversations/${id}/export/json`);
    return JSON.stringify(response.body || {}, null, 2);
  },

  exportMarkdown: async (id) => {
    if (!apiBaseUrl) {
      throw new Error('No Gaia Server configured');
    }
    const response = await request('get', `/conversations/${id}/export/markdown`);
    return response.body || '';
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
