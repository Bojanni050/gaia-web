import React from 'react';
import { Plus, Trash2, X, Library, Settings, Info, History } from 'lucide-react';
import HistorySection from '../history/HistorySection';
import { L } from '../lib/lexicon';

/**
 * Sidebar — the desktop's look, ported: brand orb, the italic serif
 * new-conversation button, the thread list with hover-delete, the
 * collapsible History section beneath it, the NL/EN switcher and the quiet
 * foot lines. The settings button is the web's own.
 */
export default function Threads({
  threads,
  activeId,
  lang,
  onSelect,
  onNew,
  onDelete,
  onLangChange,
  onOpenSettings,
  onOpenLibrary,
  onOpenHistoryConversation,
  historyVersion,
  onOpenAbout,
  open = false,
  onClose,
}) {
  return (
    <nav className={`sidebar${open ? ' open' : ''}`} data-testid="sidebar">
      <div className="sidebar-header">
        <div className="brand">
          <span className="brand-mark" />
          <span className="brand-name">Gaia</span>
        </div>
        <button
          className="sidebar-close"
          onClick={onClose}
          aria-label={L.closeMenu}
          data-testid="sidebar-close-btn"
        >
          <X size={18} />
        </button>
      </div>

      <button className="new-thread-btn" onClick={onNew} data-testid="new-conversation-btn">
        <Plus size={16} /> {L.newPage}
      </button>

      <div className="thread-list" data-testid="thread-list">
        {threads.map((t) => (
          <div
            key={t.id}
            className={`thread-item${t.id === activeId ? ' active' : ''}`}
            onClick={() => onSelect(t.id)}
            data-testid="thread-item"
          >
            <span className="thread-title">{t.title || L.untitled}</span>
            <button
              className="thread-delete"
              onClick={(e) => { e.stopPropagation(); onDelete(t.id); }}
              aria-label={L.deleteConversation}
              data-testid="delete-conversation-btn"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <HistorySection onOpenConversation={onOpenHistoryConversation} refreshToken={historyVersion} />

      <div className="sidebar-foot">
        <button className="settings-open-btn" onClick={onOpenLibrary}>
          <Library size={13} /> {L.library}
        </button>
        <button className="settings-open-btn" onClick={onOpenSettings}>
          <Settings size={13} /> {L.settings}
        </button>
        <button className="settings-open-btn" onClick={onOpenAbout}>
          <Info size={13} /> {L.aboutTitle}
        </button>
        <div className="lang-switcher" data-testid="lang-switcher">
          <button 
            className={`lang-btn ${lang === 'nl' ? 'active' : ''}`}
            onClick={() => onLangChange('nl')}
            data-testid="lang-btn-nl"
          >
            NL
          </button>
          <span className="lang-separator">/</span>
          <button 
            className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
            onClick={() => onLangChange('en')}
            data-testid="lang-btn-en"
          >
            EN
          </button>
        </div>
        <span className="foot-line">{L.footLine1}</span>
        <span className="foot-line">{L.footLine2}</span>
      </div>
    </nav>
  );
}
