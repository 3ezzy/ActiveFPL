import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useTeam } from '../context/TeamContext';
import useBootstrap from '../hooks/useBootstrap';
import useEntry from '../hooks/useEntry';
import usePicks from '../hooks/usePicks';
import useFixtures from '../hooks/useFixtures';
import Spinner from '../components/common/Spinner';
import DifficultyBadge from '../components/common/DifficultyBadge';

const posLabels = { 1: 'GKP', 2: 'DEF', 3: 'MID', 4: 'FWD' };

export default function PlannerPage() {
  const { teamId } = useTeam();
  const { playersMap, teamsMap, currentEvent, loading: bLoading } = useBootstrap();
  const { entry } = useEntry(teamId);
  const eventId = entry?.current_event || currentEvent?.id;
  const { picks, loading: pLoading } = usePicks(teamId, eventId);
  const { fixtures, loading: fLoading } = useFixtures();
  const [planGws, setPlanGws] = useState(5);
  const { t } = useTranslation();

  const loading = bLoading || pLoading || fLoading;

  const gwRange = useMemo(() => {
    if (!currentEvent) return [];
    const arr = [];
    for (let i = currentEvent.id + 1; i <= Math.min(currentEvent.id + planGws, 38); i++) arr.push(i);
    return arr;
  }, [currentEvent, planGws]);

  const squadFixtures = useMemo(() => {
    if (!picks || !playersMap || !fixtures.length || !currentEvent) return [];
    return picks.map((pick) => {
      const player = playersMap[pick.element];
      if (!player) return { pick, player: null, upcoming: [] };
      const upcoming = gwRange.map((gw) => {
        const match = fixtures.find((f) => f.event === gw && (f.team_h === player.team || f.team_a === player.team));
        if (!match) return { gw, opp: '-', diff: 3, home: true };
        const isHome = match.team_h === player.team;
        return { gw, opp: teamsMap?.[isHome ? match.team_a : match.team_h]?.short_name || '?', diff: isHome ? match.team_h_difficulty : match.team_a_difficulty, home: isHome };
      });
      return { pick, player, upcoming };
    });
  }, [picks, playersMap, fixtures, teamsMap, currentEvent, gwRange]);

  if (!teamId) {
    return (
      <div className="text-center py-16">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('planner.title')}</h1>
        <p className="text-gray-400 dark:text-gray-500">{t('planner.noTeam')}</p>
      </div>
    );
  }
  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t('planner.title')}</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">{t('planner.gwsAhead')}</span>
          {[3, 5, 8].map((n) => (
            <button key={n} onClick={() => setPlanGws(n)} className={`px-3 py-1 text-sm rounded ${planGws === n ? 'bg-fpl-accent text-fpl-dark' : 'bg-white dark:bg-fpl-card border border-fpl-light-border dark:border-fpl-border text-gray-600 dark:text-gray-300'}`}>{n}</button>
          ))}
        </div>
      </div>
      <div className="bg-white dark:bg-fpl-card border border-fpl-light-border dark:border-fpl-border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-fpl-light-border dark:border-fpl-border">
              <th className="px-4 py-2 text-left text-gray-500 dark:text-gray-400 sticky left-0 bg-white dark:bg-fpl-card z-10">{t('common.player')}</th>
              <th className="px-3 py-2 text-center text-gray-500 dark:text-gray-400">{t('common.pos')}</th>
              <th className="px-3 py-2 text-right text-gray-500 dark:text-gray-400">{t('common.price')}</th>
              {gwRange.map((gw) => (<th key={gw} className="px-3 py-2 text-center text-gray-500 dark:text-gray-400">GW{gw}</th>))}
            </tr>
          </thead>
          <tbody>
            {squadFixtures.map(({ pick, player, upcoming }) => {
              if (!player) return null;
              return (
                <tr key={pick.element} className={`border-b border-fpl-light-border/30 dark:border-fpl-border/30 ${pick.position > 11 ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-2 text-gray-900 dark:text-white font-medium sticky left-0 bg-white dark:bg-fpl-card z-10">{player.web_name}{pick.is_captain && <span className="ml-1 text-xs text-fpl-accent">(C)</span>}</td>
                  <td className="px-3 py-2 text-center text-gray-500 dark:text-gray-400">{posLabels[player.element_type]}</td>
                  <td className="px-3 py-2 text-right text-gray-600 dark:text-gray-300">£{(player.now_cost / 10).toFixed(1)}</td>
                  {upcoming.map((f) => (<td key={f.gw} className="px-1 py-1 text-center"><DifficultyBadge difficulty={f.diff} label={`${f.opp} (${f.home ? 'H' : 'A'})`} /></td>))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
