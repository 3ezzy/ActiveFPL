import { useState, useEffect } from 'react';
import fplClient from '../api/fplClient';

export default function usePlayerDetail(playerId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!playerId) return;
    let ignore = false;
    setLoading(true);
    setError(null);

    fplClient
      .get(`/element-summary/${playerId}`)
      .then((res) => {
        if (!ignore) {
          setData(res.data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) {
          setError('Failed to load player details.');
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [playerId]);

  return {
    history: data?.history || [],
    fixtures: data?.fixtures || [],
    historyPast: data?.history_past || [],
    loading,
    error,
  };
}
