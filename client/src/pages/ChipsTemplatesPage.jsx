import { useMemo } from 'react';
import useBootstrap from '../hooks/useBootstrap';
import Spinner from '../components/common/Spinner';
import ErrorBanner from '../components/common/ErrorBanner';

const chipDescriptions = {
  bboost: { name: 'Bench Boost', desc: 'Points scored by bench players count towards GW total.' },
  '3xc': { name: 'Triple Captain', desc: 'Captain scores 3x points instead of 2x.' },
  freehit: { name: 'Free Hit', desc: 'Make unlimited transfers for one gameweek only.' },
  wildcard: { name: 'Wildcard', desc: 'Make unlimited permanent transfers. Available twice per season.' },
};

export default function ChipsTemplatesPage() {
  const { gameweeks, players, teamsMap, loading, error } = useBootstrap();

  const chipUsage = useMemo(() => {
    if (!gameweeks) return [];
    const all = [];
    gameweeks.forEach((gw) => {
      (gw.chip_plays || []).forEach((chip) => {
        all.push({ gw: gw.id, chip: chip.chip_name, count: chip.num_played });
      });
    });
    return all;
  }, [gameweeks]);

  // Aggregate by chip
  const chipTotals = useMemo(() => {
    const map = {};
    chipUsage.forEach(({ chip, count }) => {
      map[chip] = (map[chip] || 0) + count;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [chipUsage]);

  // Template teams — most selected players form the "template"
  const template = useMemo(() => {
    if (!players) return [];
    return [...players]
      .sort((a, b) => parseFloat(b.selected_by_percent) - parseFloat(a.selected_by_percent))
      .slice(0, 15);
  }, [players]);

  if (loading) return <Spinner />;
  if (error) return <ErrorBanner message={error} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Chips & Templates</h1>
        <p className="text-gray-400 text-sm mt-1">Chip usage trends and the most popular team template.</p>
      </div>

      {/* Chip Descriptions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(chipDescriptions).map(([key, { name, desc }]) => {
          const total = chipTotals.find(([k]) => k === key)?.[1] || 0;
          return (
            <div key={key} className="bg-fpl-card border border-fpl-border rounded-lg p-4">
              <p className="text-fpl-accent font-semibold">{name}</p>
              <p className="text-xs text-gray-400 mt-1">{desc}</p>
              <p className="text-xl font-bold text-white mt-3">{new Intl.NumberFormat().format(total)}</p>
              <p className="text-xs text-gray-500">total uses</p>
            </div>
          );
        })}
      </div>

      {/* Chip Usage by GW */}
      {chipUsage.length > 0 && (
        <div className="bg-fpl-card border border-fpl-border rounded-lg overflow-hidden">
          <h3 className="text-sm font-semibold text-gray-400 uppercase px-4 py-3 border-b border-fpl-border">Chip Usage by Gameweek</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-fpl-border">
                  <th className="px-4 py-2 text-left">GW</th>
                  <th className="px-4 py-2 text-left">Chip</th>
                  <th className="px-4 py-2 text-right">Managers</th>
                </tr>
              </thead>
              <tbody>
                {chipUsage.map((c) => (
                  <tr key={`${c.gw}-${c.chip}`} className="border-b border-fpl-border/30">
                    <td className="px-4 py-2 text-white">GW {c.gw}</td>
                    <td className="px-4 py-2 text-fpl-yellow capitalize">{chipDescriptions[c.chip]?.name || c.chip}</td>
                    <td className="px-4 py-2 text-right text-gray-300">{new Intl.NumberFormat().format(c.count)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Template Team */}
      <div className="bg-fpl-card border border-fpl-border rounded-lg overflow-hidden">
        <h3 className="text-sm font-semibold text-fpl-accent uppercase px-4 py-3 border-b border-fpl-border">Template Team (Most Selected)</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 border-b border-fpl-border">
              <th className="px-4 py-2 text-left">Player</th>
              <th className="px-4 py-2 text-left">Team</th>
              <th className="px-4 py-2 text-right">Owned%</th>
              <th className="px-4 py-2 text-right">Price</th>
              <th className="px-4 py-2 text-right">Points</th>
            </tr>
          </thead>
          <tbody>
            {template.map((p) => (
              <tr key={p.id} className="border-b border-fpl-border/30">
                <td className="px-4 py-2 text-white font-medium">{p.web_name}</td>
                <td className="px-4 py-2 text-gray-400">{teamsMap?.[p.team]?.short_name}</td>
                <td className="px-4 py-2 text-right text-fpl-accent">{p.selected_by_percent}%</td>
                <td className="px-4 py-2 text-right text-gray-300">£{(p.now_cost / 10).toFixed(1)}</td>
                <td className="px-4 py-2 text-right text-white">{p.total_points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
