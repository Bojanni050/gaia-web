/**
 * Calm phrasing for failed turns. The web client never shows HTTP codes,
 * provider names or stack traces - only quiet, human sentences, in the
 * user's own language (via the lexicon).
 */
import { L } from '../lib/lexicon';

export function phraseTurnError(error) {
  const kind = error?.kind;
  const message = String(error?.message || '');

  if (kind === 'communication') {
    if (message.includes('No Gaia Server configured') || message.includes('no Gaia Server')) {
      return L.turnNoServer;
    }
    return L.turnUnreachable;
  }
  if (kind === 'capture') {
    return L.turnCapture;
  }
  return L.turnFallback;
}
