import { useState, useMemo } from 'react';
import useBootstrap from '../hooks/useBootstrap';
import Spinner from '../components/common/Spinner';
import ErrorBanner from '../components/common/ErrorBanner';

const posLabels = { 1: 'GKP', 2: 'DEF', 3: 'MID', 4: 'FWD' };

export default function OwnershipCombinationsPage() {
  const { players, teamsMap, elementTypes, loading, error } = useBootstrap();
  const [position, setPosition] = useState('all');
  const [minOwnership, setMinOwnership] = useState(5);

  const owned = useMemo(() => {
    if (!players) return [];
    let list = [...players].filter((p) => parseFloat(p.selected_by_percent) >= minOwnership);
    if (position !== 'all') list = list.filter((p) => p.element_type === Number(position));
    return list.sort((a, b) => parseFloat(b.selected_by_percent) - parseFloat(a.selected_by_percent));
  }, [players, position, minOwnership]);

  // Ownership by position
  const posBuckets = useMemo(() => {
    if (!players) return {};
    const buckets = { 1: [], 2: [], 3: [], 4: [] };
    players.forEach((p) => {
      if (parseFloat(p.selected_by_percent) >= 10) {
        buckets[p.element_type]?.push(p);
      }
    });
    Object.values(buckets).forEach((arr) => arr.sort((a, b) => parseFloat(b.selected_by_percent) - parseFloat(a.selected_by_percent)));
    return buckets;
  }, [players]);

  if (loading) return <Spinner />;
  if (error) return <ErrorBanner message={error} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Ownership Combinations</h1>
        <p className="text-gray-400 text-sm mt-1">Most commonly owned players by position and ownership threshold.</p>
      </div>

      {/* By Position Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(posBuckets).map(([posId, arr]) => (
          <div key={posId} className="bg-fpl-card border border-fpl-border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-fpl-accent mb-2">{posLabels[posId]} (10%+ owned)</h3>
            <div className="space-y-1">
              {arr.slice(0, 5).map((p) => (
                <div key={p.id} className="flex justify-between text-sm">
                  <span className="text-white">{p.web_name}</span>
                  <span className="text-gray-400">{p.selected_by_percent}%</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={position} onChange={(e) => setPosition(e.target.value)} className="bg-fpl-dark border border-fpl-border rounded-lg px-3 py-2 text-sm text-white">
          <option value="all">All Positions</option>
          {elementTypes?.map((et) => (<option key={et.id} value={et.id}>{et.singular_name}</option>))}
        </select>
        <select value={minOwnership} onChange={(e) => setMinOwnership(Number(e.target.value))} className="bg-fpl-dark border border-fpl-border rounded-lg px-3 py-2 text-sm text-white">
          <option value={1}>1%+ owned</option>
          <option value={5}>5%+ owned</option>
          <option value={10}>10%+ owned</option>
          <option value={20}>20%+ owned</option>
          <option value={30}>30%+ owned</option>
        </select>
      </div>

      {/* Full Table */}
      <div className="bg-fpl-card border border-fpl-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-fpl-border">
                <th className="px-4 py-2 text-left">Player</th>
                <th className="px-4 py-2 text-left">Team</th>
                <th className="px-4 py-2">Pos</th>
                <th className="px-4 py-2 text-right">Owned%</th>
                <th className="px-4 py-2 text-right">Price</th>
                <th className="px-4 py-2 text-right">Points</th>
                <th className="px-4 py-2 text-right">Form</th>
              </tr>
            </thead>
            <tbody>
              {owned.slice(0, 50).map((p) => (
                <tr key={p.id} className="border-b border-fpl-border/30">
                  <td className="px-4 py-2 text-white font-medium">{p.web_name}</td>
                  <td className="px-4 py-2 text-gray-400">{teamsMap?.[p.team]?.short_name}</td>
                  <td className="px-4 py-2 text-center text-gray-400">{posLabels[p.element_type]}</td>
                  <td className="px-4 py-2 text-right text-fpl-accent font-medium">{p.selected_by_percent}%</td>
                  <td className="px-4 py-2 text-right text-gray-300">£{(p.now_cost / 10).toFixed(1)}</td>
                  <td className="px-4 py-2 text-right text-white">{p.total_points}</td>
                  <td className="px-4 py-2 text-right text-gray-300">{p.form}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
