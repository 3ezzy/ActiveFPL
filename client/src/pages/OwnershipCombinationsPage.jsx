import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import useBootstrap from '../hooks/useBootstrap';
import Spinner from '../components/common/Spinner';
import ErrorBanner from '../components/common/ErrorBanner';

const posLabels = { 1: 'GKP', 2: 'DEF', 3: 'MID', 4: 'FWD' };

export default function OwnershipCombinationsPage() {
  const { players, teamsMap, elementTypes, loading, error } = useBootstrap();
  const [position, setPosition] = useState('all');
  const [minOwnership, setMinOwnership] = useState(5);
  const { t } = useTranslation();

  const owned = useMemo(() => {
    if (!players) return [];
    let list = [...players].filter((p) => parseFloat(p.selected_by_percent) >= minOwnership);
    if (position !== 'all') list = list.filter((p) => p.element_type === Number(position));
    return list.sort((a, b) => parseFloat(b.selected_by_percent) - parseFloat(a.selected_by_percent));
  }, [players, position, minOwnership]);

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
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t('ownership.title')}</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t('ownership.subtitle')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(posBuckets).map(([posId, arr]) => (
          <div key={posId} className="bg-white dark:bg-fpl-card border border-fpl-light-border dark:border-fpl-border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-fpl-accent mb-2">{posLabels[posId]} ({t('ownership.ownedThreshold', { pct: 10 })})</h3>
            <div className="space-y-1">
              {arr.slice(0, 5).map((p) => (
                <div key={p.id} className="flex justify-between text-sm">
                  <span className="text-gray-900 dark:text-white">{p.web_name}</span>
                  <span className="text-gray-500 dark:text-gray-400">{p.selected_by_percent}%</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <select value={position} onChange={(e) => setPosition(e.target.value)} className="bg-gray-50 dark:bg-fpl-dark border border-fpl-light-border dark:border-fpl-border rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white">
          <option value="all">{t('players.allPositions')}</option>
          {elementTypes?.map((et) => (<option key={et.id} value={et.id}>{et.singular_name}</option>))}
        </select>
        <select value={minOwnership} onChange={(e) => setMinOwnership(Number(e.target.value))} className="bg-gray-50 dark:bg-fpl-dark border border-fpl-light-border dark:border-fpl-border rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white">
          <option value={1}>{t('ownership.ownedThreshold', { pct: 1 })}</option>
          <option value={5}>{t('ownership.ownedThreshold', { pct: 5 })}</option>
          <option value={10}>{t('ownership.ownedThreshold', { pct: 10 })}</option>
          <option value={20}>{t('ownership.ownedThreshold', { pct: 20 })}</option>
          <option value={30}>{t('ownership.ownedThreshold', { pct: 30 })}</option>
        </select>
      </div>

      <div className="bg-white dark:bg-fpl-card border border-fpl-light-border dark:border-fpl-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 dark:text-gray-400 border-b border-fpl-light-border dark:border-fpl-border">
                <th className="px-4 py-2 text-left">{t('common.player')}</th>
                <th className="px-4 py-2 text-left">{t('common.team')}</th>
                <th className="px-4 py-2">{t('common.pos')}</th>
                <th className="px-4 py-2 text-right">{t('common.owned')}</th>
                <th className="px-4 py-2 text-right">{t('common.price')}</th>
                <th className="px-4 py-2 text-right">{t('common.points')}</th>
                <th className="px-4 py-2 text-right">{t('common.form')}</th>
              </tr>
            </thead>
            <tbody>
              {owned.slice(0, 50).map((p) => (
                <tr key={p.id} className="border-b border-fpl-light-border/30 dark:border-fpl-border/30">
                  <td className="px-4 py-2 text-gray-900 dark:text-white font-medium">{p.web_name}</td>
                  <td className="px-4 py-2 text-gray-500 dark:text-gray-400">{teamsMap?.[p.team]?.short_name}</td>
                  <td className="px-4 py-2 text-center text-gray-500 dark:text-gray-400">{posLabels[p.element_type]}</td>
                  <td className="px-4 py-2 text-right text-fpl-accent font-medium">{p.selected_by_percent}%</td>
                  <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-300">£{(p.now_cost / 10).toFixed(1)}</td>
                  <td className="px-4 py-2 text-right text-gray-900 dark:text-white">{p.total_points}</td>
                  <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-300">{p.form}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
