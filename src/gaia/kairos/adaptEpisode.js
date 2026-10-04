/**
 * Maps a Kairos episode (server shape) to what EpisodeCard renders. Only the
 * fields we actually have: no confidence score, no session — honest absence
 * over a fabricated number. Evidence is left empty here and loaded on demand.
 */
export function adaptKairosEpisode(episode) {
  if (!episode || typeof episode !== 'object') return null;
  const apps = Array.isArray(episode.involved_apps) ? episode.involved_apps : [];
  const primary = episode.primary_app || apps[0] || '';
  return {
    id: episode.id,
    startTime: episode.start_time,
    endTime: episode.end_time,
    title: primary || null,
    interpretation: episode.summary || '',
    epistemicStatus: episode.epistemic_status || 'interpretation',
    context: apps.map((application) => ({ application })),
    sources: Array.isArray(episode.sources) ? episode.sources : [],
    observations: [],
  };
}
