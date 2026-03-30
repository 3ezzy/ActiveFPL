import { useState } from 'react';
import useLeague from '../hooks/useLeague';
import useBootstrap from '../hooks/useBootstrap';
import Spinner from '../components/common/Spinner';
import ErrorBanner from '../components/common/ErrorBanner';
import { useTeam } from '../context/TeamContext';
import useEntry from '../hooks/useEntry';

export default function LeagueStatsPage() {
  const { teamId } = useTeam();
  const { entry } = useEntry(teamId);
  const [leagueId, setLeagueId] = useState('');
  const [input, setInput] = useState('');
  const { league, standings, loading, error } = useLeague(leagueId || null);
  const { teamsMap } = useBootstrap();

  const userLeagues = entry?.leagues?.classic || [];

  const stats = standings.length > 0 ? {
    avgPoints: Math.round(standings.reduce((s, r) => s + r.total, 0) / standings.length),
    maxPoints: Math.max(...standings.map((r) => r.total)),
    minPoints: Math.min(...standings.map((r) => r.total)),
    avgGw: Math.round(standings.reduce((s, r) => s + r.event_total, 0) / standings.length),
    topGw: standings.reduce((best, r) => r.event_total > best.event_total ? r : best, standings[0]),
  } : null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">League Stats</h1>
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

      {stats && league && (
        <>
          <h2 className="text-lg font-semibold text-white">{league.name}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              ['Avg Total', stats.avgPoints],
              ['Highest Total', stats.maxPoints],
              ['Lowest Total', stats.minPoints],
              ['Avg GW', stats.avgGw],
            ].map(([label, val]) => (
              <div key={label} className="bg-fpl-card border border-fpl-border rounded-lg p-4 text-center">
                <p className="text-xs text-gray-400 uppercase">{label}</p>
                <p className="text-2xl font-bold text-white mt-1">{val}</p>
              </div>
            ))}
          </div>

          {stats.topGw && (
            <div className="bg-fpl-card border border-fpl-border rounded-lg p-4">
              <p className="text-xs text-gray-400 uppercase">Best GW Performance</p>
              <p className="text-white font-medium mt-1">{stats.topGw.entry_name} — {stats.topGw.event_total} pts</p>
              <p className="text-sm text-gray-400">{stats.topGw.player_name}</p>
            </div>
          )}

          <div className="bg-fpl-card border border-fpl-border rounded-lg overflow-hidden">
            <h3 className="text-sm font-semibold text-gray-400 uppercase px-4 py-3 border-b border-fpl-border">Points Distribution</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-fpl-border">
                  <th className="px-4 py-2 text-left">Rank</th>
                  <th className="px-4 py-2 text-left">Team</th>
                  <th className="px-4 py-2 text-right">GW Pts</th>
                  <th className="px-4 py-2 text-right">Total</th>
                  <th className="px-4 py-2 text-right">vs Avg</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((s) => (
                  <tr key={s.entry} className="border-b border-fpl-border/30">
                    <td className="px-4 py-2 text-gray-300">{s.rank}</td>
                    <td className="px-4 py-2 text-white">{s.entry_name}</td>
                    <td className="px-4 py-2 text-right text-white">{s.event_total}</td>
                    <td className="px-4 py-2 text-right text-white font-medium">{s.total}</td>
                    <td className={`px-4 py-2 text-right font-medium ${s.total > stats.avgPoints ? 'text-fpl-green' : 'text-fpl-red'}`}>
                      {s.total > stats.avgPoints ? '+' : ''}{s.total - stats.avgPoints}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
