import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import useBootstrap from '../hooks/useBootstrap';
import useFixtures from '../hooks/useFixtures';
import Spinner from '../components/common/Spinner';
import ErrorBanner from '../components/common/ErrorBanner';
import DifficultyBadge from '../components/common/DifficultyBadge';

const posLabels = { 1: 'GKP', 2: 'DEF', 3: 'MID', 4: 'FWD' };

export default function DgwOwnershipPage() {
  const { players, teams, teamsMap, currentEvent, loading: bLoading, error: bError } = useBootstrap();
  const { fixtures, loading: fLoading, error: fError } = useFixtures();
  const loading = bLoading || fLoading;
  const error = bError || fError;
  const { t } = useTranslation();

  const dgwInfo = useMemo(() => {
    if (!teams || !fixtures.length || !currentEvent) return { dgwTeams: [], dgwGw: null };
    for (let gw = currentEvent.id; gw <= 38; gw++) {
      const gwFixtures = fixtures.filter((f) => f.event === gw);
      const teamCounts = {};
      gwFixtures.forEach((f) => {
        teamCounts[f.team_h] = (teamCounts[f.team_h] || 0) + 1;
        teamCounts[f.team_a] = (teamCounts[f.team_a] || 0) + 1;
      });
      const dgwTeamIds = Object.entries(teamCounts).filter(([, c]) => c >= 2).map(([id]) => Number(id));
      if (dgwTeamIds.length > 0) {
        return { dgwGw: gw, dgwTeams: dgwTeamIds, gwFixtures };
      }
    }
    return { dgwTeams: [], dgwGw: null, gwFixtures: [] };
  }, [teams, fixtures, currentEvent]);

  const dgwPlayers = useMemo(() => {
    if (!players || dgwInfo.dgwTeams.length === 0) return [];
    return [...players]
      .filter((p) => dgwInfo.dgwTeams.includes(p.team))
      .sort((a, b) => parseFloat(b.selected_by_percent) - parseFloat(a.selected_by_percent));
  }, [players, dgwInfo.dgwTeams]);

  if (loading) return <Spinner />;
  if (error) return <ErrorBanner message={error} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t('dgw.title')}</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t('dgw.subtitle')}</p>
      </div>

      {dgwInfo.dgwGw ? (
        <>
          <div className="bg-white dark:bg-fpl-card border border-fpl-accent/30 rounded-lg p-4">
            <p className="text-fpl-accent font-semibold">{t('dgw.nextDgw', { gw: dgwInfo.dgwGw })}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t('dgw.teamsWithFixtures')} {dgwInfo.dgwTeams.map((id) => teamsMap?.[id]?.short_name).filter(Boolean).join(', ')}
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {dgwInfo.gwFixtures?.map((f) => {
              const home = teamsMap?.[f.team_h];
              const away = teamsMap?.[f.team_a];
              const isDgwHome = dgwInfo.dgwTeams.includes(f.team_h);
              const isDgwAway = dgwInfo.dgwTeams.includes(f.team_a);
              return (
                <div key={f.id} className="bg-white dark:bg-fpl-card border border-fpl-light-border dark:border-fpl-border rounded-lg p-3 flex items-center justify-between">
                  <span className={`font-medium ${isDgwHome ? 'text-fpl-accent' : 'text-gray-900 dark:text-white'}`}>{home?.short_name}</span>
                  <div className="flex gap-1">
                    <DifficultyBadge difficulty={f.team_h_difficulty} />
                    <span className="text-gray-400 dark:text-gray-500">{t('common.vs')}</span>
                    <DifficultyBadge difficulty={f.team_a_difficulty} />
                  </div>
                  <span className={`font-medium ${isDgwAway ? 'text-fpl-accent' : 'text-gray-900 dark:text-white'}`}>{away?.short_name}</span>
                </div>
              );
            })}
          </div>

          <div className="bg-white dark:bg-fpl-card border border-fpl-light-border dark:border-fpl-border rounded-lg overflow-hidden">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase px-4 py-3 border-b border-fpl-light-border dark:border-fpl-border">
              {t('dgw.playersByOwnership')}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 dark:text-gray-400 border-b border-fpl-light-border dark:border-fpl-border">
                    <th className="px-4 py-2 text-left">{t('common.player')}</th>
                    <th className="px-4 py-2 text-left">{t('common.team')}</th>
                    <th className="px-4 py-2">{t('common.pos')}</th>
                    <th className="px-4 py-2 text-right">{t('common.owned')}</th>
                    <th className="px-4 py-2 text-right">{t('common.price')}</th>
                    <th className="px-4 py-2 text-right">{t('common.form')}</th>
                    <th className="px-4 py-2 text-right">{t('common.totalPts')}</th>
                  </tr>
                </thead>
                <tbody>
                  {dgwPlayers.slice(0, 40).map((p) => (
                    <tr key={p.id} className="border-b border-fpl-light-border/30 dark:border-fpl-border/30">
                      <td className="px-4 py-2 text-gray-900 dark:text-white font-medium">{p.web_name}</td>
                      <td className="px-4 py-2 text-gray-500 dark:text-gray-400">{teamsMap?.[p.team]?.short_name}</td>
                      <td className="px-4 py-2 text-center text-gray-500 dark:text-gray-400">{posLabels[p.element_type]}</td>
                      <td className="px-4 py-2 text-right text-fpl-accent">{p.selected_by_percent}%</td>
                      <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-300">£{(p.now_cost / 10).toFixed(1)}</td>
                      <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-300">{p.form}</td>
                      <td className="px-4 py-2 text-right text-gray-900 dark:text-white">{p.total_points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white dark:bg-fpl-card border border-fpl-light-border dark:border-fpl-border rounded-lg p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">{t('dgw.noDgw')}</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{t('dgw.noDgwHint')}</p>
        </div>
      )}
    </div>
  );
}
