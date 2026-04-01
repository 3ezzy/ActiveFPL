import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import useBootstrap from '../hooks/useBootstrap';
import Spinner from '../components/common/Spinner';
import ErrorBanner from '../components/common/ErrorBanner';

const posLabels = { 1: 'GKP', 2: 'DEF', 3: 'MID', 4: 'FWD' };

export default function EffectiveOwnershipPage() {
  const { players, teamsMap, currentEvent, loading, error } = useBootstrap();
  const { t } = useTranslation();

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
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t('eo.title')}</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t('eo.subtitle', { gw: currentEvent?.id })}</p>
      </div>

      <div className="bg-white dark:bg-fpl-card border border-fpl-light-border dark:border-fpl-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 dark:text-gray-400 border-b border-fpl-light-border dark:border-fpl-border">
                <th className="px-4 py-2 text-left">#</th>
                <th className="px-4 py-2 text-left">{t('common.player')}</th>
                <th className="px-4 py-2 text-left">{t('common.team')}</th>
                <th className="px-4 py-2">{t('common.pos')}</th>
                <th className="px-4 py-2 text-right">{t('common.owned')}</th>
                <th className="px-4 py-2 text-right">{t('common.gwPts')}</th>
                <th className="px-4 py-2 text-right">{t('eo.eoImpact')}</th>
              </tr>
            </thead>
            <tbody>
              {eoData.map((p, i) => (
                <tr key={p.id} className="border-b border-fpl-light-border/30 dark:border-fpl-border/30 hover:bg-gray-100 dark:hover:bg-white/5">
                  <td className="px-4 py-2 text-gray-400 dark:text-gray-500">{i + 1}</td>
                  <td className="px-4 py-2 text-gray-900 dark:text-white font-medium">{p.web_name}</td>
                  <td className="px-4 py-2 text-gray-500 dark:text-gray-400">{teamsMap?.[p.team]?.short_name}</td>
                  <td className="px-4 py-2 text-center text-gray-500 dark:text-gray-400">{posLabels[p.element_type]}</td>
                  <td className="px-4 py-2 text-right text-fpl-accent">{p.eo}%</td>
                  <td className="px-4 py-2 text-right text-gray-900 dark:text-white">{p.event_points}</td>
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
