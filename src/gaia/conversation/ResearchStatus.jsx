import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PresenceOrb } from '../../components/Presence';
import { L } from '../lib/lexicon';

/**
 * What is happening in the background, said plainly.
 *
 * Two things live here, and they are deliberately different in weight. Work in
 * progress is a quiet line: it is not a conversation turn and must not read
 * like one — it only answers "is she still on it?". A run that parked on a
 * command is a QUESTION, and it gets the weight of one: the command itself,
 * what Hermes says it does, and the decisions the server will actually accept.
 * Nothing is approved on the person's behalf, and the buttons come from the
 * job's own `choices` rather than a list this component invented.
 *
 * The findings themselves are never rendered here: the server writes them into
 * the conversation as an ordinary message, which is where they belong.
 */
export default function ResearchStatus({
  running = [],
  awaiting = [],
  finished = [],
  activeConversationId = null,
  onAnswer,
  onOpen,
}) {
  const [answering, setAnswering] = useState(null);
  const [failed, setFailed] = useState(false);

  const elsewhere = finished.filter((job) => job.conversationId && job.conversationId !== activeConversationId);
  if (running.length === 0 && awaiting.length === 0 && elsewhere.length === 0) return null;

  const answer = async (job, choice) => {
    setAnswering(job.id);
    setFailed(false);
    try {
      await onAnswer(job.id, choice);
    } catch (_) {
      setFailed(true);
    } finally {
      setAnswering(null);
    }
  };

  return (
    <div className="research-status" data-testid="research-status">
      {running.length > 0 && (
        <div className="research-quiet" role="status" data-testid="research-running">
          <PresenceOrb state="quiet" size={18} />
          <span>
            {running.length === 1
              ? L.researchRunningOne
              : L.researchRunningMany.replace('{count}', String(running.length))}
          </span>
        </div>
      )}

      {elsewhere.map((job) => (
        <button
          key={job.id}
          type="button"
          className="research-elsewhere"
          data-testid="research-elsewhere"
          onClick={() => onOpen && onOpen(job.conversationId)}
        >
          {L.researchElsewhere}
        </button>
      ))}

      {awaiting.map((job) => {
        const choices = job.approval && Array.isArray(job.approval.choices) && job.approval.choices.length > 0
          ? job.approval.choices
          : ['once', 'deny'];
        return (
          <motion.div
            key={job.id}
            className="research-question"
            data-testid="research-question"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="research-question-title">{L.researchQuestionTitle}</p>
            {job.approval && job.approval.description && (
              <p className="research-question-why">{job.approval.description}</p>
            )}
            {job.approval && job.approval.command && (
              <pre className="research-command">{job.approval.command}</pre>
            )}
            <div className="research-choices">
              {choices.map((choice) => (
                <button
                  key={choice}
                  type="button"
                  className="research-choice"
                  disabled={answering === job.id}
                  onClick={() => answer(job, choice)}
                >
                  {L[`researchChoice_${choice}`] || choice}
                </button>
              ))}
            </div>
            {failed && <p className="research-error" role="alert">{L.researchAnswerFailed}</p>}
          </motion.div>
        );
      })}
    </div>
  );
}
