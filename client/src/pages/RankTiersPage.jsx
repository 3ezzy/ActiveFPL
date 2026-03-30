import { useMemo } from 'react';
import useBootstrap from '../hooks/useBootstrap';
import Spinner from '../components/common/Spinner';
import ErrorBanner from '../components/common/ErrorBanner';

const tiers = [
  { label: 'Top 1K', max: 1000, color: 'text-fpl-accent' },
  { label: 'Top 10K', max: 10000, color: 'text-fpl-green' },
  { label: 'Top 50K', max: 50000, color: 'text-fpl-green' },
  { label: 'Top 100K', max: 100000, color: 'text-fpl-yellow' },
  { label: 'Top 250K', max: 250000, color: 'text-fpl-yellow' },
  { label: 'Top 500K', max: 500000, color: 'text-gray-300' },
  { label: 'Top 1M', max: 1000000, color: 'text-gray-300' },
];

export default function RankTiersPage() {
  const { gameweeks, currentEvent, loading, error } = useBootstrap();

  const gwData = useMemo(() => {
    if (!gameweeks) return [];
    return gameweeks
      .filter((gw) => gw.finished || gw.is_current)
      .map((gw) => ({
        id: gw.id,
        avg: gw.average_entry_score,
        highest: gw.highest_score,
        mostCaptained: gw.most_captained,
        mostSelected: gw.most_selected,
        transfers: gw.transfers_made,
        chipPlays: gw.chip_plays,
      }));
  }, [gameweeks]);

  if (loading) return <Spinner />;
  if (error) return <ErrorBanner message={error} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Rank Tier Information</h1>
        <p className="text-gray-400 text-sm mt-1">Gameweek averages and scoring benchmarks across the season.</p>
      </div>

      {/* Tier targets */}
      <div className="bg-fpl-card border border-fpl-border rounded-lg p-5">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Rank Tier Targets</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {tiers.map((tier) => (
            <div key={tier.label} className="text-center">
              <p className={`text-lg font-bold ${tier.color}`}>{tier.label}</p>
              <p className="text-xs text-gray-500">Top {new Intl.NumberFormat().format(tier.max)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* GW Averages Table */}
      <div className="bg-fpl-card border border-fpl-border rounded-lg overflow-hidden">
        <h3 className="text-sm font-semibold text-gray-400 uppercase px-4 py-3 border-b border-fpl-border">Gameweek Averages</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-fpl-border">
                <th className="px-4 py-2 text-left">GW</th>
                <th className="px-4 py-2 text-right">Average</th>
                <th className="px-4 py-2 text-right">Highest</th>
                <th className="px-4 py-2 text-right">Transfers Made</th>
              </tr>
            </thead>
            <tbody>
              {gwData.map((gw) => (
                <tr key={gw.id} className={`border-b border-fpl-border/30 ${gw.id === currentEvent?.id ? 'bg-fpl-accent/5' : ''}`}>
                  <td className="px-4 py-2 text-white font-medium">GW {gw.id}</td>
                  <td className="px-4 py-2 text-right text-white">{gw.avg}</td>
                  <td className="px-4 py-2 text-right text-fpl-green">{gw.highest}</td>
                  <td className="px-4 py-2 text-right text-gray-300">{gw.transfers ? new Intl.NumberFormat().format(gw.transfers) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Chip Usage */}
      {gwData.some((gw) => gw.chipPlays?.length > 0) && (
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
                {gwData.flatMap((gw) =>
                  (gw.chipPlays || []).map((chip) => (
                    <tr key={`${gw.id}-${chip.chip_name}`} className="border-b border-fpl-border/30">
                      <td className="px-4 py-2 text-white">GW {gw.id}</td>
                      <td className="px-4 py-2 text-fpl-yellow capitalize">{chip.chip_name.replace('_', ' ')}</td>
                      <td className="px-4 py-2 text-right text-gray-300">{new Intl.NumberFormat().format(chip.num_played)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
