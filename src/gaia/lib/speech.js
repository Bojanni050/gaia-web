/**
 * Plays back audio bytes already synthesized server-side (serverApi's
 * speechApi.synthesize → Gaia Cloud's `/speech`).
 *
 * For web client, we use the Web Speech API if available, otherwise
 * we fall back to Audio element playback for WAV/MP3 bytes.
 *
 * Deliberately not a second audio engine: the browser already has one
 * (the native `Audio` element), so this is just the thinnest possible
 * wrapper around it — turn bytes into a Blob, play it, release the object
 * URL when done. No mixing, no queuing, no device selection; those are
 * exactly the kind of concerns a "build it later if actually needed"
 * engine would own, and V1 doesn't need one.
 */

/**
 * @param {Uint8Array} bytes
 * @param {string} [mimeType]
 * @returns {Promise<void>} resolves once playback finishes (or rejects if it fails to start)
 */
export function playSpeech(bytes, mimeType = 'audio/wav') {
  // Try Web Speech API first for text
  if (typeof bytes === 'string') {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(bytes);
      return new Promise((resolve, reject) => {
        utterance.onend = () => resolve();
        utterance.onerror = () => reject(new Error('speech synthesis failed'));
        window.speechSynthesis.speak(utterance);
      });
    }
  }

  // For audio bytes, use Audio element
  const blob = new Blob([bytes], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);

  const cleanup = () => URL.revokeObjectURL(url);

  return new Promise((resolve, reject) => {
    audio.addEventListener('ended', () => {
      cleanup();
      resolve();
    });
    audio.addEventListener('error', () => {
      cleanup();
      reject(new Error('audio playback failed'));
    });
    audio.play().catch((error) => {
      cleanup();
      reject(error);
    });
  });
}
