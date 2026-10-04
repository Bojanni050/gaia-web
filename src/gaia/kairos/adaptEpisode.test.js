import { adaptKairosEpisode } from './adaptEpisode';

describe('adaptKairosEpisode', () => {
  it('maps the Kairos server shape into the card shape', () => {
    const adapted = adaptKairosEpisode({
      id: 'kei_1',
      start_time: '2026-10-03T10:15:00Z',
      end_time: '2026-10-03T10:42:00Z',
      summary: 'Bojan bekeek de inbox.',
      primary_app: 'Outlook',
      involved_apps: ['Outlook', 'Excel'],
      epistemic_status: 'interpretation',
      sources: ['chronicle:ingest:o1'],
    });
    expect(adapted.title).toBe('Outlook');
    expect(adapted.interpretation).toBe('Bojan bekeek de inbox.');
    expect(adapted.epistemicStatus).toBe('interpretation');
    expect(adapted.context).toEqual([{ application: 'Outlook' }, { application: 'Excel' }]);
    expect(adapted.observations).toEqual([]);
  });

  it('never fabricates a title or app that was not present', () => {
    const adapted = adaptKairosEpisode({ id: 'k', involved_apps: [] });
    expect(adapted.title).toBeNull();
    expect(adapted.interpretation).toBe('');
    expect(adapted.context).toEqual([]);
  });

  it('returns null for a non-object', () => {
    expect(adaptKairosEpisode(null)).toBeNull();
    expect(adaptKairosEpisode(undefined)).toBeNull();
  });
});
