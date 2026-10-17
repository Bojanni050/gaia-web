import React, { useRef, useState } from 'react';
import { Copy, Check, Edit3, Trash2, RotateCw, File, Image, Undo2 } from 'lucide-react';
import Markdown from './Markdown';
import { parseSegments } from '../lib/artifactParser';
import { L } from '../lib/lexicon';

function Attachments({ items }) {
  if (!items || !items.length) return null;

  return (
    <div className="message-attachments" data-testid="message-attachments">
      {items.map((item) => {
        const isImg = item.type?.startsWith('image/');
        if (isImg) {
          return (
            <img
              key={item.id}
              src={item.url}
              alt={item.name}
              className="message-attachment-image"
              onClick={() => window.open(item.url, '_blank')}
              data-testid="attachment-image"
            />
          );
        }

        return (
          <a
            key={item.id}
            href={item.url}
            download={item.name}
            className="message-attachment-card"
            data-testid="attachment-file"
          >
            <File size={16} />
            <span>{item.name}</span>
          </a>
        );
      })}
    </div>
  );
}

function AssistantBody({ content, reasoning, streaming }) {
  let cleanContent = content;
  let displayReasoning = reasoning;

  if (!displayReasoning && content && content.includes('<think>')) {
    const thinkStart = content.indexOf('<think>');
    const thinkEnd = content.indexOf('</think>');
    if (thinkEnd === -1) {
      displayReasoning = content.slice(thinkStart + 7);
      cleanContent = content.slice(0, thinkStart);
    } else {
      displayReasoning = content.slice(thinkStart + 7, thinkEnd);
      cleanContent = content.slice(0, thinkStart) + content.slice(thinkEnd + 8);
    }
  }

  const segments = parseSegments(cleanContent);
  return (
    <>
      {displayReasoning && (
        // Closed from the first token: the thought process is something to
        // look into, not a panel that unfolds above the answer while the
        // answer is still being written.
        <details className="thought-process" data-testid="thought-process">
          <summary className="thought-process-title">{L.thoughtProcess}</summary>
          <div className="thought-process-body">
            <Markdown>{displayReasoning}</Markdown>
          </div>
        </details>
      )}
      {segments.map((seg, i) => {
        const isLast = i === segments.length - 1;
        const val = seg.kind === 'text' ? seg.value : (seg.value || '');
        if (isLast && streaming) {
          return (
            <React.Fragment key={i}>
              <Markdown>{val}</Markdown>
              <span className="streaming-cursor" data-testid="streaming-cursor" />
            </React.Fragment>
          );
        }
        return (
          <Markdown key={i}>{val}</Markdown>
        );
      })}
    </>
  );
}

export default function MessageView({ message, streaming, onEdit, onDelete, onRegenerate, onRetry, onRetract }) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);
  // Taking a memory back: the person's own route to something Gaia said that
  // turned out not to be true. They point at the sentence in her reply, and
  // that sentence is what the server matches against memory — see
  // server/api.js's memoryApi and Gaia Cloud's POST /memory/retract.
  const [retractOpen, setRetractOpen] = useState(false);
  const [quote, setQuote] = useState('');
  const [correction, setCorrection] = useState('');
  const [answer, setAnswer] = useState(null);
  const [working, setWorking] = useState(false);
  const bodyRef = useRef(null);

  const copy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const handleSaveEdit = () => {
    const trimmed = editText.trim();
    if (!trimmed) return;
    onEdit(message.id, trimmed);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditText(message.content);
    setIsEditing(false);
  };

  // Opens the panel with whatever sentence they had selected in her reply, so
  // the common case is one click and one press of the button.
  const openRetract = () => {
    const selection = typeof window !== 'undefined' && window.getSelection ? window.getSelection() : null;
    const anchor = selection && selection.anchorNode;
    const inside = anchor && bodyRef.current && bodyRef.current.contains(anchor.nodeType === 3 ? anchor.parentNode : anchor);
    const selected = inside && selection.toString ? selection.toString().replace(/\s+/g, ' ').trim() : '';
    setQuote(selected);
    setAnswer(null);
    setRetractOpen(true);
  };

  const sendRetraction = async (text) => {
    const sentence = String(text != null ? text : quote).replace(/\s+/g, ' ').trim();
    // What is true instead is their own words too: collapsed like the quote, so
    // a stray newline never becomes part of what she is asked to keep.
    const truer = String(correction || '').replace(/\s+/g, ' ').trim();
    if (!sentence || working) return;
    setWorking(true);
    try {
      const result = await onRetract(sentence, truer);
      setAnswer(result);
      setRetractOpen(false);
    } catch (_) {
      setAnswer({ status: 'failed', message: L.retractFailed });
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className={`message ${isUser ? 'user' : 'assistant'}`} data-testid={`message-${message.role}`}>
      <div className="msg-inner">
        {!isUser && <div className="msg-author">Gaia</div>}
        <div className="msg-body" ref={bodyRef}>
          {isUser ? (
            isEditing ? (
              <div className="edit-textarea-wrap" data-testid="edit-textarea-wrap">
                <textarea
                  className="edit-textarea"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  data-testid="edit-textarea"
                />
                <div className="edit-actions">
                  <button className="edit-btn cancel" onClick={handleCancelEdit} data-testid="edit-cancel-btn">
                    {L.cancel}
                  </button>
                  <button className="edit-btn save" onClick={handleSaveEdit} data-testid="edit-save-btn">
                    {L.saveRegenerate}
                  </button>
                </div>
              </div>
            ) : (
              <p className="user-text" data-testid="user-text">{message.content}</p>
            )
          ) : (
            <AssistantBody content={message.content} reasoning={message.reasoning} streaming={streaming} />
          )}
          <Attachments items={message.attachments} />
        </div>

        {!streaming && !isEditing && (
          <div className="msg-actions" data-testid="message-actions">
            {message.content && (
              <button className="msg-action" onClick={copy} data-testid="message-copy-btn" aria-label="Copy">
                {copied ? <Check size={13} /> : <Copy size={13} />}
              </button>
            )}
            {isUser ? (
              <>
                <button className="msg-action" onClick={() => setIsEditing(true)} data-testid="message-edit-btn" aria-label="Edit">
                  <Edit3 size={13} />
                </button>
                <button className="msg-action" onClick={() => onDelete(message.id)} data-testid="message-delete-btn" aria-label="Delete">
                  <Trash2 size={13} />
                </button>
              </>
            ) : (
              <>
                {message.error ? (
                  <button className="msg-action" onClick={() => onRetry(message.id)} data-testid="message-retry-btn" aria-label="Retry">
                    <RotateCw size={13} />
                    <span>{L.retry}</span>
                  </button>
                ) : (
                  <button className="msg-action" onClick={() => onRegenerate(message.id)} data-testid="message-regenerate-btn" aria-label="Regenerate">
                    <RotateCw size={13} />
                  </button>
                )}
                <button className="msg-action" onClick={() => onDelete(message.id)} data-testid="message-delete-btn" aria-label="Delete">
                  <Trash2 size={13} />
                </button>
                {onRetract && (
                  <button
                    className="msg-action"
                    onClick={openRetract}
                    // Keeping the selection is what makes one click enough:
                    // mousedown would clear it before the click lands.
                    onMouseDown={(e) => e.preventDefault()}
                    data-testid="message-retract-btn"
                    aria-label={L.retract}
                  >
                    <Undo2 size={13} />
                    <span>{L.retract}</span>
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {retractOpen && (
          <div className="retract-panel" data-testid="message-retract-panel">
            <p className="retract-hint">{L.retractHint}</p>
            <label className="retract-field">
              <span>{L.retractQuoteLabel}</span>
              <input
                value={quote}
                onChange={(e) => setQuote(e.target.value)}
                data-testid="retract-quote-input"
              />
            </label>
            <label className="retract-field">
              <span>{L.retractCorrectionLabel}</span>
              <input
                value={correction}
                onChange={(e) => setCorrection(e.target.value)}
                data-testid="retract-correction-input"
              />
            </label>
            <div className="retract-actions">
              <button
                className="msg-action"
                onClick={() => sendRetraction()}
                disabled={working || !quote.trim()}
                data-testid="retract-send"
              >
                {working ? L.retractWorking : L.retractSend}
              </button>
              <button className="msg-action" onClick={() => setRetractOpen(false)} data-testid="retract-cancel">
                {L.retractCancel}
              </button>
            </div>
          </div>
        )}

        {answer && (
          <div className="retract-answer" role="status" data-testid="retract-answer">
            <p>{answer.message}</p>
            {answer.status === 'ambiguous' && Array.isArray(answer.candidates) && (
              <div className="retract-candidates">
                <span>{L.retractPick}</span>
                {answer.candidates.map((candidate, index) => (
                  <button
                    key={`${candidate.bank}-${candidate.id}-${index}`}
                    className="msg-action"
                    onClick={() => sendRetraction(candidate.text)}
                    disabled={working}
                    data-testid="retract-candidate"
                  >
                    {candidate.text}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
