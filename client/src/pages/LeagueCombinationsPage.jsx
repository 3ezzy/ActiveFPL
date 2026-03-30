import { useState, useMemo } from 'react';
import useLeague from '../hooks/useLeague';
import useBootstrap from '../hooks/useBootstrap';
import Spinner from '../components/common/Spinner';
import ErrorBanner from '../components/common/ErrorBanner';
import { useTeam } from '../context/TeamContext';
import useEntry from '../hooks/useEntry';

export default function LeagueCombinationsPage() {
  const { teamId } = useTeam();
  const { entry } = useEntry(teamId);
  const [leagueId, setLeagueId] = useState('');
  const [input, setInput] = useState('');
  const { league, standings, loading, error } = useLeague(leagueId || null);

  const userLeagues = entry?.leagues?.classic || [];

  // Analyze how many points separate each position
  const combinations = useMemo(() => {
    if (standings.length < 2) return [];
    const sorted = [...standings].sort((a, b) => b.total - a.total);
    return sorted.map((s, i) => ({
      ...s,
      gap: i > 0 ? sorted[i - 1].total - s.total : 0,
      gapToFirst: sorted[0].total - s.total,
    }));
  }, [standings]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">League Combinations</h1>
      <p className="text-gray-400 text-sm">Analyze points gaps and positional battles in your league.</p>

      <div className="flex flex-wrap gap-3">
        {userLeagues.length > 0 && (
          <select value={leagueId} onChange={(e) => setLeagueId(e.target.value)} className="bg-fpl-dark border border-fpl-border rounded-lg px-3 py-2 text-sm text-white">
            <option value="">Select a league...</option>
            {userLeagues.map((l) => (<option key={l.id} value={l.id}>{l.name}</option>))}
          </select>
        )}
        <form onSubmit={(e) => { e.preventDefault(); setLeagueId(input.trim()); }} className="flex gap-2">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="League ID" className="bg-fpl-dark border border-fpl-border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 w-32" />
          <button type="submit" className="bg-fpl-accent hover:bg-fpl-accent/80 text-fpl-dark font-semibold px-4 py-2 rounded-lg text-sm">Go</button>
        </form>
      </div>

      {loading && <Spinner />}
      {error && <ErrorBanner message={error} />}

      {league && combinations.length > 0 && (
        <div className="bg-fpl-card border border-fpl-border rounded-lg overflow-hidden">
          <h2 className="text-lg font-semibold text-white px-4 py-3 border-b border-fpl-border">{league.name}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-fpl-border">
                  <th className="px-4 py-2 text-left">Rank</th>
                  <th className="px-4 py-2 text-left">Team</th>
                  <th className="px-4 py-2 text-right">Total</th>
                  <th className="px-4 py-2 text-right">Gap Above</th>
                  <th className="px-4 py-2 text-right">Gap to 1st</th>
                  <th className="px-4 py-2 text-right">GW Pts</th>
                </tr>
              </thead>
              <tbody>
                {combinations.map((s) => (
                  <tr key={s.entry} className="border-b border-fpl-border/30">
                    <td className="px-4 py-2 text-gray-300">{s.rank}</td>
                    <td className="px-4 py-2 text-white font-medium">{s.entry_name}</td>
                    <td className="px-4 py-2 text-right text-white">{s.total}</td>
                    <td className={`px-4 py-2 text-right font-medium ${s.gap > 0 ? 'text-fpl-red' : 'text-fpl-green'}`}>
                      {s.gap > 0 ? `-${s.gap}` : '-'}
                    </td>
                    <td className={`px-4 py-2 text-right font-medium ${s.gapToFirst > 0 ? 'text-fpl-red' : 'text-fpl-green'}`}>
                      {s.gapToFirst > 0 ? `-${s.gapToFirst}` : 'Leader'}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-300">{s.event_total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
