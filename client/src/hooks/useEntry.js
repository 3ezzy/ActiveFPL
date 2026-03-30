import { useState, useEffect } from 'react';
import fplClient from '../api/fplClient';

export default function useEntry(teamId) {
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!teamId) return;
    let ignore = false;
    setLoading(true);
    setError(null);

    fplClient
      .get(`/entry/${teamId}`)
      .then((res) => {
        if (!ignore) {
          setEntry(res.data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(
            err.response?.status === 404
              ? 'Team not found. Check your Team ID.'
              : 'Failed to load team data.'
          );
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [teamId]);

  return { entry, loading, error };
}
