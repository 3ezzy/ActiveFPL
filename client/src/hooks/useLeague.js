import { useState, useEffect } from 'react';
import fplClient from '../api/fplClient';

export default function useLeague(leagueId, page = 1) {
  const [league, setLeague] = useState(null);
  const [standings, setStandings] = useState([]);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!leagueId) return;
    let ignore = false;
    setLoading(true);
    setError(null);

    fplClient
      .get(`/leagues/${leagueId}/standings?page=${page}`)
      .then((res) => {
        if (!ignore) {
          setLeague(res.data.league);
          setStandings(res.data.standings?.results || []);
          setHasNext(res.data.standings?.has_next || false);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) {
          setError('Failed to load league standings.');
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [leagueId, page]);

  return { league, standings, hasNext, loading, error };
}
