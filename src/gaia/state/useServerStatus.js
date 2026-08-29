/**
 * Connection status of the Gaia Cloud link for web client.
 * Pure reachability - never a claim about Gaia's inner state.
 */
import { useEffect, useState } from 'react';
import { serverApi } from '../server/api';

export function useServerStatus() {
  const [status, setStatus] = useState('connecting');

  useEffect(() => {
    let active = true;
    let intervalId;

    const checkStatus = async () => {
      try {
        const result = await serverApi.getStatus();
        if (active) setStatus(result?.status || 'notConfigured');
      } catch (e) {
        if (active) setStatus('notConfigured');
      }
    };

    // Initial check
    checkStatus();

    // Periodic check
    intervalId = setInterval(checkStatus, 30000);

    // Listen for server events
    const unlisten = serverApi.onServerEvent((event) => {
      if (event?.topic === 'server.status') {
        setStatus(event.payload?.status || event.payload || 'unknown');
      }
    });

    return () => {
      active = false;
      if (intervalId) clearInterval(intervalId);
      if (unlisten) unlisten();
    };
  }, []);

  return status;
}
