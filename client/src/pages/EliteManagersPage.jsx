import { useMemo } from 'react';
import useBootstrap from '../hooks/useBootstrap';
import Spinner from '../components/common/Spinner';
import ErrorBanner from '../components/common/ErrorBanner';

const posLabels = { 1: 'GKP', 2: 'DEF', 3: 'MID', 4: 'FWD' };

export default function EliteManagersPage() {
  const { players, teamsMap, currentEvent, loading, error } = useBootstrap();

  // Dream team — top scorers by position
  const dreamTeam = useMemo(() => {
    if (!players) return [];
    return [...players].filter((p) => p.in_dreamteam).sort((a, b) => b.total_points - a.total_points);
  }, [players]);

  // Top performers this GW
  const gwTop = useMemo(() => {
    if (!players) return [];
    return [...players].sort((a, b) => (b.event_points || 0) - (a.event_points || 0)).slice(0, 15);
  }, [players]);

  // Most transferred in
  const mostIn = useMemo(() => {
    if (!players) return [];
    return [...players].sort((a, b) => b.transfers_in_event - a.transfers_in_event).slice(0, 10);
  }, [players]);

  if (loading) return <Spinner />;
  if (error) return <ErrorBanner message={error} />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Elite Managers Insights</h1>
      <p className="text-gray-400 text-sm">Top-performing players and transfer trends across all managers.</p>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Dream Team */}
        <div className="bg-fpl-card border border-fpl-border rounded-lg overflow-hidden">
          <h3 className="text-sm font-semibold text-fpl-accent uppercase px-4 py-3 border-b border-fpl-border">Season Dream Team</h3>
          <table className="w-full text-sm">
            <tbody>
              {dreamTeam.map((p) => (
                <tr key={p.id} className="border-b border-fpl-border/30">
                  <td className="px-4 py-2 text-white font-medium">{p.web_name}</td>
                  <td className="px-4 py-2 text-gray-400">{teamsMap?.[p.team]?.short_name}</td>
                  <td className="px-4 py-2 text-gray-400">{posLabels[p.element_type]}</td>
                  <td className="px-4 py-2 text-right text-fpl-accent font-medium">{p.total_points} pts</td>
                </tr>
              ))}
              {dreamTeam.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-500">No dream team data available.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* GW Top */}
        <div className="bg-fpl-card border border-fpl-border rounded-lg overflow-hidden">
          <h3 className="text-sm font-semibold text-fpl-green uppercase px-4 py-3 border-b border-fpl-border">GW {currentEvent?.id} Top Scorers</h3>
          <table className="w-full text-sm">
            <tbody>
              {gwTop.map((p) => (
                <tr key={p.id} className="border-b border-fpl-border/30">
                  <td className="px-4 py-2 text-white">{p.web_name}</td>
                  <td className="px-4 py-2 text-gray-400">{teamsMap?.[p.team]?.short_name}</td>
                  <td className="px-4 py-2 text-right text-fpl-green font-medium">{p.event_points} pts</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Most Transferred In */}
      <div className="bg-fpl-card border border-fpl-border rounded-lg overflow-hidden">
        <h3 className="text-sm font-semibold text-gray-400 uppercase px-4 py-3 border-b border-fpl-border">Most Transferred In This GW</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 border-b border-fpl-border">
              <th className="px-4 py-2 text-left">Player</th>
              <th className="px-4 py-2 text-left">Team</th>
              <th className="px-4 py-2 text-right">Transfers In</th>
              <th className="px-4 py-2 text-right">Price</th>
              <th className="px-4 py-2 text-right">Form</th>
            </tr>
          </thead>
          <tbody>
            {mostIn.map((p) => (
              <tr key={p.id} className="border-b border-fpl-border/30">
                <td className="px-4 py-2 text-white">{p.web_name}</td>
                <td className="px-4 py-2 text-gray-400">{teamsMap?.[p.team]?.short_name}</td>
                <td className="px-4 py-2 text-right text-fpl-accent">{new Intl.NumberFormat().format(p.transfers_in_event)}</td>
                <td className="px-4 py-2 text-right text-gray-300">£{(p.now_cost / 10).toFixed(1)}</td>
                <td className="px-4 py-2 text-right text-gray-300">{p.form}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
