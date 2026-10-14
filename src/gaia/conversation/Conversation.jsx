import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import MessageView from './MessageView';
import Composer from './Composer';
import { Presence, PresenceOrb } from '../../components/Presence';
import { getGreeting } from '../lib/greeting';
import { L } from '../lib/lexicon';

/**
 * How close to the tail still counts as "at the bottom" (px). Small enough that
 * the person's own scrolling away is noticed, large enough to absorb rounding
 * and line-height leftovers.
 */
const NEAR_BOTTOM = 40;

export default function Conversation({
  messages,
  stream,
  health,
  conversationId,
  onSend,
  onStop,
  onEdit,
  onDelete,
  onRegenerate,
  onRetry
}) {
  const scrollRef = useRef(null);
  // Whether the view follows the thread's tail. Only the person's own scrolling
  // turns this off — never our own jump to the bottom (see handleScroll).
  const followRef = useRef(true);
  // The height the view was last pinned to. Content that arrived since is not
  // the person's doing and must not read as "scrolled away": a streaming reply
  // grows by tens of pixels between one jump and the next, and counting that as
  // a scroll is exactly what used to stop the view halfway through an answer.
  const pinnedHeightRef = useRef(0);
  const prevLenRef = useRef(messages.length);
  
  const greeting = useMemo(() => getGreeting(), []);
  const [hasDraft, setHasDraft] = useState(false);

  // Opening another conversation shows its newest turn.
  useLayoutEffect(() => {
    followRef.current = true;
    pinnedHeightRef.current = 0;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [conversationId]);

  // Laid out in the same frame as the text it is reacting to (useLayoutEffect,
  // not useEffect): jumping after the browser painted the new text is what makes
  // a growing reply look like it is one step ahead of the view. The jump is
  // instant rather than smooth for the same reason — an animation that takes
  // 300 ms cannot keep up with deltas arriving every few milliseconds, so it
  // would chase the reply and never arrive. `messages` changes identity on every
  // delta (useConversation grows the reply in place), so this runs per delta.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    
    // A new message always brings the tail into view (someone who sent it is
    // done reading the older part); a reply merely growing only follows while
    // the person is still at the tail.
    if (messages.length > prevLenRef.current) followRef.current = true;
    prevLenRef.current = messages.length;
    if (!followRef.current) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'auto' });
    pinnedHeightRef.current = el.scrollHeight;
  }, [messages, stream.content]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distance <= NEAR_BOTTOM) {
      followRef.current = true;
      return;
    }
    // Our own jump fires a scroll event too, and by the time that event is
    // handled the reply may already have grown the thread again — so its growth
    // shows up in `distance` although nobody touched the scrollbar. Only the
    // movement beyond that growth is the person's own, and only that decides
    // whether following stops.
    const growth = Math.max(0, el.scrollHeight - pinnedHeightRef.current);
    if (distance - growth > NEAR_BOTTOM) followRef.current = false;
  };

  const empty = messages.length === 0 && !stream.active;
  const presenceState = stream.active
    ? stream.presence
    : (hasDraft ? 'listening' : 'quiet');

  return (
    <section className="conversation" data-testid="conversation">
      <div 
        className="conversation-scroll" 
        ref={scrollRef} 
        onScroll={handleScroll}
        data-testid="conversation-scroll"
      >
        <div className="conversation-column">
          {empty ? (
            <div className="welcome" data-testid="welcome">
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.4, ease: 'easeOut' }}
              >
                <PresenceOrb state="quiet" size={72} />
              </motion.div>
              <motion.h1
                className="welcome-title"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.0, delay: 0.7, ease: 'easeOut' }}
              >
                {greeting.title}
              </motion.h1>
            </div>
          ) : (
            <>
              {messages.map((m) => (
                <MessageView 
                  key={m.id} 
                  message={m} 
                  streaming={false} 
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onRegenerate={onRegenerate}
                  onRetry={onRetry}
                />
              ))}
              {stream.active && stream.content && (
                <MessageView
                  key={stream.messageId || 'streaming'}
                  message={{ id: stream.messageId || 'streaming', role: 'assistant', content: stream.content }}
                  streaming
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onRegenerate={onRegenerate}
                  onRetry={onRetry}
                />
              )}
              {stream.active && !stream.content && (
                <div className="thinking-row" data-testid="thinking-indicator">
                  <Presence isThinking={true} type="general" state={stream.presence} size={26} />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {health && health.status === 'unreachable' && (
        <div className="health-whisper" data-testid="health-whisper" role="status">
          <PresenceOrb state="quiet" size={18} />
          <span>{L.healthWhisper}</span>
        </div>
      )}

      <div className="composer-dock">
        <div className="conversation-column">
          <div className="dock-presence">
            <PresenceOrb state={presenceState} size={22} />
          </div>
          <Composer
            onSend={onSend}
            onStop={onStop}
            streaming={stream.active}
            onDraftChange={setHasDraft}
          />
        </div>
      </div>
    </section>
  );
}
