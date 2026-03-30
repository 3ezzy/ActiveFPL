import { useState, useEffect } from 'react';
import fplClient from '../api/fplClient';

let cachedData = null;

export default function useBootstrap() {
  const [data, setData] = useState(cachedData);
  const [loading, setLoading] = useState(!cachedData);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (cachedData) return;
    let ignore = false;

    fplClient
      .get('/bootstrap')
      .then((res) => {
        if (ignore) return;
        const raw = res.data;
        const teamsMap = {};
        raw.teams.forEach((t) => (teamsMap[t.id] = t));
        const playersMap = {};
        raw.elements.forEach((p) => (playersMap[p.id] = p));
        const currentEvent = raw.events.find((e) => e.is_current) || raw.events[0];

        cachedData = {
          players: raw.elements,
          teams: raw.teams,
          gameweeks: raw.events,
          elementTypes: raw.element_types,
          currentEvent,
          teamsMap,
          playersMap,
        };
        setData(cachedData);
        setLoading(false);
      })
      .catch((err) => {
        if (ignore) return;
        setError('Failed to load FPL data.');
        setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  return { ...data, loading, error };
}
