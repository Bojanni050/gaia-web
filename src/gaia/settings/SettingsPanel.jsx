/**
 * Settings — this device's behaviour only: notifications, quiet presence,
 * and the local capability surfaces (audio, capture). Nothing cognitive
 * ever appears here.
 *
 * There used to be a "Cloud" section here (server URL + auth token) letting
 * this device point at an arbitrary Gaia Cloud instance. Removed: gaia-api
 * sends no CORS headers, so a direct cross-origin call from the browser can
 * never work anyway — this deployment always talks through its own
 * same-origin nginx proxy (nginx.conf.template's /api/gaia/ block, which
 * injects the Bearer token server-side), so there was never a legitimate
 * value to put there. It was also the source of a real outage: someone
 * entered the backend's direct address, and there was no way to clear it
 * back out again short of wiping localStorage.
 *
 * Saving gives calm feedback: the button keeps its width, settles into a
 * soft "saved" state and quietly returns — never a jump or a flash.
 */
import React, { useEffect, useState } from 'react';
import { audioApi, captureApi } from '../server/api';
import { L } from '../lib/lexicon';

export default function SettingsPanel({ onClose, quiet, onQuietChange }) {
  const [settings, setSettings] = useState({ notificationsEnabled: true });
  const [audio, setAudio] = useState(null);
  const [captureSources, setCaptureSources] = useState([]);
  const [saveState, setSaveState] = useState('idle'); // idle | saving | saved

  useEffect(() => {
    let active = true;
    audioApi.getStatus().then((a) => active && setAudio(a)).catch(() => {});
    captureApi.listSources().then((c) => active && setCaptureSources(c || [])).catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const patch = (part) => setSettings((prev) => ({ ...prev, ...part }));

  const save = () => {
    if (saveState === 'saving') return;
    setSaveState('saving');
    setSaveState('saved');
    setTimeout(() => setSaveState('idle'), 1800);
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <h2>{L.settingsTitle}</h2>

        <section>
          <h3>{L.settingsBehaviour}</h3>
          <label className="field field-toggle">
            <input
              type="checkbox"
              checked={settings.notificationsEnabled ?? true}
              onChange={(e) => patch({ notificationsEnabled: e.target.checked })}
            />
            <span>{L.settingsNotifications}</span>
          </label>
          <label className="field field-toggle">
            <input type="checkbox" checked={quiet} onChange={(e) => onQuietChange(e.target.checked)} />
            <span>{L.settingsQuiet}</span>
          </label>
        </section>

        <section>
          <h3>{L.settingsCapabilities}</h3>
          <p className="capability-line">
            {L.settingsMicrophone}: {audio ? audio.available : '—'}
          </p>
          <p className="capability-line">
            {L.settingsCaptureSources}:{' '}
            {captureSources.length === 0
              ? L.settingsCaptureNone
              : captureSources.map((s) => s.name).join(', ')}
          </p>
        </section>

        <div className="settings-actions">
          <button
            className={`primary save-btn${saveState === 'saved' ? ' saved' : ''}`}
            onClick={save}
            disabled={saveState !== 'idle'}
          >
            <span className="save-label">
              {saveState === 'saving' ? L.settingsSaving : saveState === 'saved' ? L.settingsSaved : L.settingsSave}
            </span>
          </button>
          <button onClick={onClose}>{L.settingsClose}</button>
        </div>
      </div>
    </div>
  );
}
