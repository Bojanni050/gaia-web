import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import Sidebar from './sidebar/Threads';
import Conversation from './conversation/Conversation';
import SettingsPanel from './settings/SettingsPanel';
import LibraryPanel from './library/LibraryPanel';
import AboutPanel from './settings/AboutPanel';
import { serverApi, presenceApi } from './server/api';
import { useConversation } from './state/useConversation';
import { useServerStatus } from './state/useServerStatus';
import { L } from './lib/lexicon';

/**
 * The web shell — the desktop's grid, the web's calm. Presence here is the
 * orb's breath (quiet / listening / thinking), plus the health whisper when
 * Gaia's server is beyond reach. Never a status dashboard.
 */
export default function GaiaDesktop() {
  const status = useServerStatus(serverApi);
  const [quiet, setQuietState] = useState(false);
  // App.css already ships the full mobile drawer design (.mobile-menu-btn,
  // .sidebar-backdrop, .sidebar.open's slide-in transform under the
  // max-width:900px breakpoint) and Threads.jsx already accepts open/onClose
  // — none of it was ever wired up here, so below 900px the sidebar sat
  // permanently translateX(-100%), i.e. invisible, with no way to open it.
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [lang, setLang] = useState(localStorage.getItem('gaia.lang') || 'nl');
  const conversation = useConversation(serverApi);

  useEffect(() => {
    presenceApi.get().catch(() => {});
  }, []);

  // Bumped on every 'conversation.history.changed' server event (pushed via
  // ServerLink::spawn_event_bridge, backed by gaia-api's SSE endpoint) so
  // HistorySection can refresh its already-loaded list live — e.g. gaia-desktop
  // just saved a conversation this web app should now be able to see.
  // Deliberately does not touch the active thread: switching what's on
  // screen out from under someone is not what "keep history in sync" means.
  const [historyVersion, setHistoryVersion] = useState(0);
  useEffect(() => {
    // server/api.js's web onServerEvent returns the unsubscribe function
    // synchronously (a plain in-process listener set) — unlike gaia-desktop's
    // Tauri IPC version this was ported from, which is async and returns a
    // Promise<unlisten>. No .then() needed here.
    const unlisten = serverApi.onServerEvent((event) => {
      if (event?.topic === 'conversation.history.changed') {
        setHistoryVersion((v) => v + 1);
      }
    });
    return () => { if (unlisten) unlisten(); };
  }, []);

  const handleLangChange = useCallback((next) => {
    localStorage.setItem('gaia.lang', next);
    setLang(next);
  }, []);

  const handleQuiet = useCallback((next) => {
    setQuietState(next);
    presenceApi.setQuiet(next).catch(() => {});
  }, []);

  // The orb rests quiet by default; Gaia is present, not performative.
  const presenceState = 'quiet';
  const whisper =
    status === 'offline' ? L.healthWhisper : null;

  return (
    <div className="gaia-shell">
      <button
        className="mobile-menu-btn"
        onClick={() => setSidebarOpen(true)}
        aria-label={L.openMenu}
        data-testid="mobile-menu-btn"
      >
        <Menu size={20} />
      </button>
      <div
        className={`sidebar-backdrop${sidebarOpen ? ' open' : ''}`}
        onClick={() => setSidebarOpen(false)}
        data-testid="sidebar-backdrop"
      />
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        threads={conversation.threads}
        activeId={conversation.activeId}
        lang={lang}
        onSelect={(id) => { conversation.openThread(id); setSidebarOpen(false); }}
        onNew={() => { conversation.newThread(); setSidebarOpen(false); }}
        onDelete={conversation.deleteThread}
        onLangChange={handleLangChange}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenLibrary={() => setLibraryOpen(true)}
        onOpenHistoryConversation={(id, messages) => { conversation.hydrateThread(id, messages); setSidebarOpen(false); }}
        onOpenAbout={() => setAboutOpen(true)}
        historyVersion={historyVersion}
      />

      <main className="gaia-main">
        <Conversation
          messages={conversation.active?.messages ?? []}
          // useConversation.js has no separate "live streaming message"
          // concept — the assistant message is created on the first delta
          // and grown in place inside `messages` itself. So the thinking
          // indicator (stream.active && !stream.content) is only needed
          // for the gap between "sent" and "first delta arrived"; once
          // `streaming` flips true the growing message already renders via
          // `messages`, so stream.active must flip false at the same time
          // or MessageView would render it twice.
          stream={{
            active: conversation.busy && !conversation.streaming,
            content: null,
            presence: 'thinking',
            messageId: null,
          }}
          health={{ status: status === 'offline' ? 'unreachable' : 'ok' }}
          presenceState={presenceState}
          whisper={whisper}
          onSend={conversation.send}
          onRetry={conversation.retry}
          // useConversation.js does not implement edit/delete/regenerate/stop
          // yet — MessageView/Composer still render these controls, so they
          // need a safe no-op rather than crashing on click. Wiring real
          // behavior for these is a separate, larger change.
          onEdit={() => {}}
          onDelete={() => {}}
          onRegenerate={() => {}}
          onStop={() => {}}
        />
      </main>

      {settingsOpen && (
        <SettingsPanel
          onClose={() => setSettingsOpen(false)}
          quiet={quiet}
          onQuietChange={handleQuiet}
        />
      )}

      {libraryOpen && <LibraryPanel onClose={() => setLibraryOpen(false)} />}
      
      {aboutOpen && (
        <AboutPanel onClose={() => setAboutOpen(false)} />
      )}
    </div>
  );
}
