/**
 * Version information hook for Gaia Web.
 *
 * Manages both Web and Cloud build metadata, fetching Cloud version
 * from the server during initialization and caching it for the session.
 */
import { useEffect, useState, useCallback } from 'react';
import { serverApi } from '../server/api';

export function useVersionInfo() {
  const [webVersion, setWebVersion] = useState(null);
  const [cloudVersion, setCloudVersion] = useState(null);
  const [cloudStatus, setCloudStatus] = useState('loading'); // loading | connected | unavailable
  const [loading, setLoading] = useState(true);

  // Fetch Web build metadata
  const fetchWebVersion = useCallback(async () => {
    try {
      const webMeta = await serverApi.getDesktopVersion();
      setWebVersion(webMeta);
    } catch (error) {
      console.warn('[version] Failed to get Web version:', error);
      // Fallback for development
      setWebVersion({
        name: 'Gaia Web',
        version: process.env.REACT_APP_VERSION || '1.0.0',
        build: new Date().toISOString().slice(0, 16).replace('T', '').replace(/-/g, '').replace(':', '') + '-dev',
        commit: null
      });
    }
  }, []);

  // Fetch Cloud version from server
  const fetchCloudVersion = useCallback(async () => {
    try {
      const cloudMeta = await serverApi.getCloudVersion();
      setCloudVersion(cloudMeta);
      setCloudStatus('connected');
    } catch (error) {
      console.warn('[version] Failed to get Cloud version:', error.message);
      setCloudStatus('unavailable');
      setCloudVersion(null);
    }
  }, []);

  // Initial load
  useEffect(() => {
    let active = true;
    
    const load = async () => {
      await fetchWebVersion();
      await fetchCloudVersion();
      if (active) setLoading(false);
    };
    
    load();

    return () => {
      active = false;
    };
  }, [fetchWebVersion, fetchCloudVersion]);

  // Refresh both versions
  const refresh = useCallback(async () => {
    setLoading(true);
    await fetchWebVersion();
    await fetchCloudVersion();
    setLoading(false);
  }, [fetchWebVersion, fetchCloudVersion]);

  return {
    webVersion,
    cloudVersion,
    cloudStatus,
    loading,
    refresh,
    // Convenience getters
    get webBuild() {
      return webVersion?.build || 'unknown';
    },
    get webVersionString() {
      return webVersion ? `${webVersion.version} \u00b7 build ${webVersion.build}` : 'unknown';
    },
    get cloudBuild() {
      return cloudVersion?.build || null;
    },
    get cloudVersionString() {
      return cloudVersion ? `${cloudVersion.version} \u00b7 build ${cloudVersion.build}` : null;
    },
    // Check if builds match
    get buildsMatch() {
      return webVersion?.build && cloudVersion?.build && 
             webVersion.build === cloudVersion.build;
    },
    // Format for display
    formatVersionLabel: (prefix) => {
      if (prefix === 'cloud') {
        if (cloudStatus === 'unavailable') return 'unavailable';
        if (cloudStatus === 'loading') return 'loading...';
        return cloudVersionString || 'unknown';
      }
      return webVersionString || 'unknown';
    }
  };
}
