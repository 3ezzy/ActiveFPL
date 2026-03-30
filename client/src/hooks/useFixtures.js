import { useState, useEffect } from 'react';
import fplClient from '../api/fplClient';

export default function useFixtures() {
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;

    fplClient
      .get('/fixtures')
      .then((res) => {
        if (!ignore) {
          setFixtures(res.data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) {
          setError('Failed to load fixtures.');
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  return { fixtures, loading, error };
}
