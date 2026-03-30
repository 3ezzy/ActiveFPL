import { useState, useEffect } from 'react';
import fplClient from '../api/fplClient';

export default function usePicks(teamId, eventId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!teamId || !eventId) return;
    let ignore = false;
    setLoading(true);
    setError(null);

    fplClient
      .get(`/entry/${teamId}/event/${eventId}/picks`)
      .then((res) => {
        if (!ignore) {
          setData(res.data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) {
          setError('Failed to load picks.');
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [teamId, eventId]);

  return { picks: data?.picks, entryHistory: data?.entry_history, activeChip: data?.active_chip, loading, error };
}
