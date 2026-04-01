import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import useBootstrap from '../hooks/useBootstrap';
import Spinner from '../components/common/Spinner';
import ErrorBanner from '../components/common/ErrorBanner';

function getChipDescriptions(t) {
  return {
    bboost: { name: t('chips.benchBoost'), desc: t('chips.benchBoostDesc') },
    '3xc': { name: t('chips.tripleCaptain'), desc: t('chips.tripleCaptainDesc') },
    freehit: { name: t('chips.freeHit'), desc: t('chips.freeHitDesc') },
    wildcard: { name: t('chips.wildcard'), desc: t('chips.wildcardDesc') },
  };
}

export default function ChipsTemplatesPage() {
  const { gameweeks, players, teamsMap, loading, error } = useBootstrap();
  const { t } = useTranslation();
  const chipDescriptions = getChipDescriptions(t);

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

  const chipTotals = useMemo(() => {
    const map = {};
    chipUsage.forEach(({ chip, count }) => {
      map[chip] = (map[chip] || 0) + count;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [chipUsage]);

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
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t('chips.title')}</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t('chips.subtitle')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(chipDescriptions).map(([key, { name, desc }]) => {
          const total = chipTotals.find(([k]) => k === key)?.[1] || 0;
          return (
            <div key={key} className="bg-white dark:bg-fpl-card border border-fpl-light-border dark:border-fpl-border rounded-lg p-4">
              <p className="text-fpl-accent font-semibold">{name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{desc}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white mt-3">{new Intl.NumberFormat().format(total)}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{t('chips.totalUses')}</p>
            </div>
          );
        })}
      </div>

      {chipUsage.length > 0 && (
        <div className="bg-white dark:bg-fpl-card border border-fpl-light-border dark:border-fpl-border rounded-lg overflow-hidden">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase px-4 py-3 border-b border-fpl-light-border dark:border-fpl-border">{t('chips.chipUsageByGw')}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 dark:text-gray-400 border-b border-fpl-light-border dark:border-fpl-border">
                  <th className="px-4 py-2 text-left">{t('common.gw')}</th>
                  <th className="px-4 py-2 text-left">{t('common.chip')}</th>
                  <th className="px-4 py-2 text-right">{t('rankTiers.managers')}</th>
                </tr>
              </thead>
              <tbody>
                {chipUsage.map((c) => (
                  <tr key={`${c.gw}-${c.chip}`} className="border-b border-fpl-light-border/30 dark:border-fpl-border/30">
                    <td className="px-4 py-2 text-gray-900 dark:text-white">GW {c.gw}</td>
                    <td className="px-4 py-2 text-fpl-yellow capitalize">{chipDescriptions[c.chip]?.name || c.chip}</td>
                    <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-300">{new Intl.NumberFormat().format(c.count)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-fpl-card border border-fpl-light-border dark:border-fpl-border rounded-lg overflow-hidden">
        <h3 className="text-sm font-semibold text-fpl-accent uppercase px-4 py-3 border-b border-fpl-light-border dark:border-fpl-border">{t('chips.templateTeam')}</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 dark:text-gray-400 border-b border-fpl-light-border dark:border-fpl-border">
              <th className="px-4 py-2 text-left">{t('common.player')}</th>
              <th className="px-4 py-2 text-left">{t('common.team')}</th>
              <th className="px-4 py-2 text-right">{t('common.owned')}</th>
              <th className="px-4 py-2 text-right">{t('common.price')}</th>
              <th className="px-4 py-2 text-right">{t('common.points')}</th>
            </tr>
          </thead>
          <tbody>
            {template.map((p) => (
              <tr key={p.id} className="border-b border-fpl-light-border/30 dark:border-fpl-border/30">
                <td className="px-4 py-2 text-gray-900 dark:text-white font-medium">{p.web_name}</td>
                <td className="px-4 py-2 text-gray-500 dark:text-gray-400">{teamsMap?.[p.team]?.short_name}</td>
                <td className="px-4 py-2 text-right text-fpl-accent">{p.selected_by_percent}%</td>
                <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-300">£{(p.now_cost / 10).toFixed(1)}</td>
                <td className="px-4 py-2 text-right text-gray-900 dark:text-white">{p.total_points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
