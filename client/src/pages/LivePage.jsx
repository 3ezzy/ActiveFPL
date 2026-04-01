import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import useBootstrap from '../hooks/useBootstrap';
import useFixtures from '../hooks/useFixtures';
import Spinner from '../components/common/Spinner';
import ErrorBanner from '../components/common/ErrorBanner';

const PL_BADGE_URL = 'https://resources.premierleague.com/premierleague/badges/70';

function TeamBadge({ team, size = 24 }) {
  if (!team) return <div className="rounded-full bg-gray-300 dark:bg-fpl-border shrink-0" style={{ width: size, height: size }} />;
  return (
    <img
      src={`${PL_BADGE_URL}/t${team.code}.png`}
      alt={team.short_name}
      className="object-contain shrink-0"
      style={{ width: size, height: size }}
      onError={(e) => { e.target.style.display = 'none'; }}
    />
  );
}

function PlayerJersey({ team, isGkp, size = 20 }) {
  if (!team) return null;
  const shirtType = isGkp ? `shirt_${team.code}_1` : `shirt_${team.code}`;
  return (
    <img
      src={`https://fantasy.premierleague.com/dist/img/shirts/standard/${shirtType}-110.webp`}
      alt={team.short_name}
      className="object-contain shrink-0"
      style={{ width: size, height: size * 1.2 }}
      onError={(e) => { e.target.style.display = 'none'; }}
    />
  );
}

export default function LivePage() {
  const { currentEvent, teamsMap, playersMap, loading: bLoading, error: bError } = useBootstrap();
  const { fixtures, loading: fLoading, error: fError } = useFixtures();
  const { t } = useTranslation();

  const loading = bLoading || fLoading;
  const error = bError || fError;

  const liveFixtures = useMemo(
    () => fixtures.filter((f) => f.event === currentEvent?.id),
    [fixtures, currentEvent]
  );

  // Aggregate BPS from all live/finished fixtures
  const bpsPlayers = useMemo(() => {
    const bpsMap = {};
    liveFixtures.forEach((f) => {
      if (!f.stats) return;
      const bpsStat = f.stats.find((s) => s.identifier === 'bps');
      if (!bpsStat) return;
      [...(bpsStat.h || []), ...(bpsStat.a || [])].forEach(({ element, value }) => {
        if (!bpsMap[element]) bpsMap[element] = 0;
        bpsMap[element] += value;
      });
    });
    return Object.entries(bpsMap)
      .map(([id, bps]) => ({ id: Number(id), bps }))
      .sort((a, b) => b.bps - a.bps)
      .slice(0, 30);
  }, [liveFixtures]);

  // Aggregate goals and assists
  const goalScorers = useMemo(() => {
    const map = {};
    liveFixtures.forEach((f) => {
      if (!f.stats) return;
      const goals = f.stats.find((s) => s.identifier === 'goals_scored');
      const assists = f.stats.find((s) => s.identifier === 'assists');
      if (goals) {
        [...(goals.h || []), ...(goals.a || [])].forEach(({ element, value }) => {
          if (!map[element]) map[element] = { goals: 0, assists: 0 };
          map[element].goals += value;
        });
      }
      if (assists) {
        [...(assists.h || []), ...(assists.a || [])].forEach(({ element, value }) => {
          if (!map[element]) map[element] = { goals: 0, assists: 0 };
          map[element].assists += value;
        });
      }
    });
    return Object.entries(map)
      .map(([id, stats]) => ({ id: Number(id), ...stats }))
      .sort((a, b) => b.goals + b.assists - (a.goals + a.assists));
  }, [liveFixtures]);

  if (loading) return <Spinner />;
  if (error) return <ErrorBanner message={error} />;

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
        {t('live.title', { gw: currentEvent?.id })}
      </h1>

      {/* Live Match Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {liveFixtures.map((f) => {
          const home = teamsMap?.[f.team_h];
          const away = teamsMap?.[f.team_a];
          const isLive = f.started && !f.finished;
          return (
            <div
              key={f.id}
              className={`bg-white dark:bg-fpl-card border rounded-lg p-4 ${
                isLive ? 'border-fpl-green' : 'border-fpl-light-border dark:border-fpl-border'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center justify-center gap-2 flex-1">
                  <TeamBadge team={home} size={24} />
                  <span className="text-gray-900 dark:text-white font-medium">{home?.short_name}</span>
                </div>
                <div className="text-center px-3">
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {f.team_h_score ?? 0} - {f.team_a_score ?? 0}
                  </p>
                  {isLive && (
                    <span className="text-xs text-fpl-green font-semibold animate-pulse">
                      {t('common.live')} {f.minutes}'
                    </span>
                  )}
                  {f.finished && <span className="text-xs text-gray-400 dark:text-gray-500">{t('live.ft')}</span>}
                  {!f.started && (
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {f.kickoff_time
                        ? new Date(f.kickoff_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : t('live.tbd')}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-center gap-2 flex-1">
                  <span className="text-gray-900 dark:text-white font-medium">{away?.short_name}</span>
                  <TeamBadge team={away} size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Goal Involvements */}
        {goalScorers.length > 0 && (
          <div className="bg-white dark:bg-fpl-card border border-fpl-light-border dark:border-fpl-border rounded-lg overflow-hidden">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white px-4 py-3 border-b border-fpl-light-border dark:border-fpl-border">
              {t('live.goalsAndAssists')}
            </h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 dark:text-gray-400 border-b border-fpl-light-border dark:border-fpl-border">
                  <th className="px-4 py-2 text-left">{t('common.player')}</th>
                  <th className="px-4 py-2 text-left">{t('common.team')}</th>
                  <th className="px-4 py-2 text-right">{t('players.goals')}</th>
                  <th className="px-4 py-2 text-right">{t('players.assists')}</th>
                </tr>
              </thead>
              <tbody>
                {goalScorers.slice(0, 15).map((gs) => {
                  const player = playersMap?.[gs.id];
                  const team = teamsMap?.[player?.team];
                  return (
                    <tr key={gs.id} className="border-b border-fpl-light-border/30 dark:border-fpl-border/30">
                      <td className="px-4 py-2 text-gray-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <PlayerJersey team={team} isGkp={player?.element_type === 1} size={20} />
                          <span>{player?.web_name || '?'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1.5">
                          <TeamBadge team={team} size={16} />
                          <span>{team?.short_name || '-'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right text-gray-900 dark:text-white">{gs.goals || '-'}</td>
                      <td className="px-4 py-2 text-right text-gray-900 dark:text-white">{gs.assists || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* BPS Table */}
        {bpsPlayers.length > 0 && (
          <div className="bg-white dark:bg-fpl-card border border-fpl-light-border dark:border-fpl-border rounded-lg overflow-hidden">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white px-4 py-3 border-b border-fpl-light-border dark:border-fpl-border">
              {t('live.bonusPoints')}
            </h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 dark:text-gray-400 border-b border-fpl-light-border dark:border-fpl-border">
                  <th className="px-4 py-2 text-left">{t('common.player')}</th>
                  <th className="px-4 py-2 text-left">{t('common.team')}</th>
                  <th className="px-4 py-2 text-right">{t('players.bps')}</th>
                </tr>
              </thead>
              <tbody>
                {bpsPlayers.slice(0, 15).map((bp) => {
                  const player = playersMap?.[bp.id];
                  const team = teamsMap?.[player?.team];
                  return (
                    <tr key={bp.id} className="border-b border-fpl-light-border/30 dark:border-fpl-border/30">
                      <td className="px-4 py-2 text-gray-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <PlayerJersey team={team} isGkp={player?.element_type === 1} size={20} />
                          <span>{player?.web_name || '?'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1.5">
                          <TeamBadge team={team} size={16} />
                          <span>{team?.short_name || '-'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right text-gray-900 dark:text-white font-medium">{bp.bps}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {liveFixtures.length === 0 && (
        <p className="text-gray-400 dark:text-gray-500 text-center py-12">
          {t('live.noFixtures')}
        </p>
      )}
    </div>
  );
}