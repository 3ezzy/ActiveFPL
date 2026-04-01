import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import useBootstrap from '../hooks/useBootstrap';
import Spinner from '../components/common/Spinner';
import ErrorBanner from '../components/common/ErrorBanner';

const posLabels = { 1: 'GKP', 2: 'DEF', 3: 'MID', 4: 'FWD' };

export default function EliteManagersPage() {
  const { players, teamsMap, currentEvent, loading, error } = useBootstrap();
  const { t } = useTranslation();

  const dreamTeam = useMemo(() => {
    if (!players) return [];
    return [...players].filter((p) => p.in_dreamteam).sort((a, b) => b.total_points - a.total_points);
  }, [players]);

  const gwTop = useMemo(() => {
    if (!players) return [];
    return [...players].sort((a, b) => (b.event_points || 0) - (a.event_points || 0)).slice(0, 15);
  }, [players]);

  const mostIn = useMemo(() => {
    if (!players) return [];
    return [...players].sort((a, b) => b.transfers_in_event - a.transfers_in_event).slice(0, 10);
  }, [players]);

  if (loading) return <Spinner />;
  if (error) return <ErrorBanner message={error} />;

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t('elite.title')}</h1>
      <p className="text-gray-500 dark:text-gray-400 text-sm">{t('elite.subtitle')}</p>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white dark:bg-fpl-card border border-fpl-light-border dark:border-fpl-border rounded-lg overflow-hidden">
          <h3 className="text-sm font-semibold text-fpl-accent uppercase px-4 py-3 border-b border-fpl-light-border dark:border-fpl-border">{t('elite.dreamTeam')}</h3>
          <table className="w-full text-sm">
            <tbody>
              {dreamTeam.map((p) => (
                <tr key={p.id} className="border-b border-fpl-light-border/30 dark:border-fpl-border/30">
                  <td className="px-4 py-2 text-gray-900 dark:text-white font-medium">{p.web_name}</td>
                  <td className="px-4 py-2 text-gray-500 dark:text-gray-400">{teamsMap?.[p.team]?.short_name}</td>
                  <td className="px-4 py-2 text-gray-500 dark:text-gray-400">{posLabels[p.element_type]}</td>
                  <td className="px-4 py-2 text-right text-fpl-accent font-medium">{p.total_points} pts</td>
                </tr>
              ))}
              {dreamTeam.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400 dark:text-gray-500">{t('elite.noDreamTeam')}</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-white dark:bg-fpl-card border border-fpl-light-border dark:border-fpl-border rounded-lg overflow-hidden">
          <h3 className="text-sm font-semibold text-fpl-green uppercase px-4 py-3 border-b border-fpl-light-border dark:border-fpl-border">{t('elite.topScorers')} GW {currentEvent?.id}</h3>
          <table className="w-full text-sm">
            <tbody>
              {gwTop.map((p) => (
                <tr key={p.id} className="border-b border-fpl-light-border/30 dark:border-fpl-border/30">
                  <td className="px-4 py-2 text-gray-900 dark:text-white">{p.web_name}</td>
                  <td className="px-4 py-2 text-gray-500 dark:text-gray-400">{teamsMap?.[p.team]?.short_name}</td>
                  <td className="px-4 py-2 text-right text-fpl-green font-medium">{p.event_points} pts</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white dark:bg-fpl-card border border-fpl-light-border dark:border-fpl-border rounded-lg overflow-hidden">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase px-4 py-3 border-b border-fpl-light-border dark:border-fpl-border">{t('elite.mostTransferredIn')}</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 dark:text-gray-400 border-b border-fpl-light-border dark:border-fpl-border">
              <th className="px-4 py-2 text-left">{t('common.player')}</th>
              <th className="px-4 py-2 text-left">{t('common.team')}</th>
              <th className="px-4 py-2 text-right">{t('elite.transfersIn')}</th>
              <th className="px-4 py-2 text-right">{t('common.price')}</th>
              <th className="px-4 py-2 text-right">{t('common.form')}</th>
            </tr>
          </thead>
          <tbody>
            {mostIn.map((p) => (
              <tr key={p.id} className="border-b border-fpl-light-border/30 dark:border-fpl-border/30">
                <td className="px-4 py-2 text-gray-900 dark:text-white">{p.web_name}</td>
                <td className="px-4 py-2 text-gray-500 dark:text-gray-400">{teamsMap?.[p.team]?.short_name}</td>
                <td className="px-4 py-2 text-right text-fpl-accent">{new Intl.NumberFormat().format(p.transfers_in_event)}</td>
                <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-300">£{(p.now_cost / 10).toFixed(1)}</td>
                <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-300">{p.form}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
