import { useMemo } from 'react';
import useBootstrap from '../hooks/useBootstrap';
import Spinner from '../components/common/Spinner';
import ErrorBanner from '../components/common/ErrorBanner';

const posLabels = { 1: 'GKP', 2: 'DEF', 3: 'MID', 4: 'FWD' };

export default function EffectiveOwnershipPage() {
  const { players, teamsMap, currentEvent, loading, error } = useBootstrap();

  // EO approximation: ownership% * event_points gives impact score
  const eoData = useMemo(() => {
    if (!players) return [];
    return [...players]
      .filter((p) => parseFloat(p.selected_by_percent) > 1 && p.event_points > 0)
      .map((p) => ({
        ...p,
        eo: parseFloat(p.selected_by_percent),
        impact: (parseFloat(p.selected_by_percent) * p.event_points / 100).toFixed(2),
      }))
      .sort((a, b) => b.eo * b.event_points - a.eo * a.event_points)
      .slice(0, 40);
  }, [players]);

  if (loading) return <Spinner />;
  if (error) return <ErrorBanner message={error} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Effective Ownership</h1>
        <p className="text-gray-400 text-sm mt-1">Players with the highest impact on rank movement based on ownership and points scored in GW {currentEvent?.id}.</p>
      </div>

      <div className="bg-fpl-card border border-fpl-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-fpl-border">
                <th className="px-4 py-2 text-left">#</th>
                <th className="px-4 py-2 text-left">Player</th>
                <th className="px-4 py-2 text-left">Team</th>
                <th className="px-4 py-2">Pos</th>
                <th className="px-4 py-2 text-right">Owned%</th>
                <th className="px-4 py-2 text-right">GW Pts</th>
                <th className="px-4 py-2 text-right">EO Impact</th>
              </tr>
            </thead>
            <tbody>
              {eoData.map((p, i) => (
                <tr key={p.id} className="border-b border-fpl-border/30 hover:bg-white/5">
                  <td className="px-4 py-2 text-gray-500">{i + 1}</td>
                  <td className="px-4 py-2 text-white font-medium">{p.web_name}</td>
                  <td className="px-4 py-2 text-gray-400">{teamsMap?.[p.team]?.short_name}</td>
                  <td className="px-4 py-2 text-center text-gray-400">{posLabels[p.element_type]}</td>
                  <td className="px-4 py-2 text-right text-fpl-accent">{p.eo}%</td>
                  <td className="px-4 py-2 text-right text-white">{p.event_points}</td>
                  <td className="px-4 py-2 text-right text-fpl-yellow font-medium">{p.impact}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
