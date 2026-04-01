import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import useBootstrap from '../hooks/useBootstrap';
import useFixtures from '../hooks/useFixtures';
import Spinner from '../components/common/Spinner';
import ErrorBanner from '../components/common/ErrorBanner';
import DifficultyBadge from '../components/common/DifficultyBadge';

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

export default function FixturesPage() {
  const { teams, teamsMap, currentEvent, gameweeks, loading: bLoading, error: bError } = useBootstrap();
  const { fixtures, loading: fLoading, error: fError } = useFixtures();
  const [selectedGw, setSelectedGw] = useState(null);
  const [view, setView] = useState('gw');
  const { t } = useTranslation();

  const gw = selectedGw ?? currentEvent?.id ?? 1;
  const loading = bLoading || fLoading;
  const error = bError || fError;

  const gwFixtures = useMemo(
    () => fixtures.filter((f) => f.event === gw),
    [fixtures, gw]
  );

  const fdrData = useMemo(() => {
    if (!teams || !fixtures.length) return { teamRows: [], gwCols: [] };
    const startGw = currentEvent?.id ?? 1;
    const gwCols = [];
    for (let i = startGw; i < startGw + 6 && i <= 38; i++) gwCols.push(i);

    const teamRows = teams.map((tm) => {
      const cells = gwCols.map((gwNum) => {
        const match = fixtures.find(
          (f) => f.event === gwNum && (f.team_h === tm.id || f.team_a === tm.id)
        );
        if (!match) return { opp: '-', diff: 3, home: true };
        const isHome = match.team_h === tm.id;
        const oppId = isHome ? match.team_a : match.team_h;
        const diff = isHome ? match.team_h_difficulty : match.team_a_difficulty;
        return {
          opp: teamsMap?.[oppId]?.short_name || '?',
          diff,
          home: isHome,
        };
      });
      return { team: tm, cells };
    });
    return { teamRows, gwCols };
  }, [teams, fixtures, teamsMap, currentEvent]);

  if (loading) return <Spinner />;
  if (error) return <ErrorBanner message={error} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t('fixtures.title')}</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setView('gw')}
            className={`px-3 py-1.5 text-sm rounded ${
              view === 'gw' ? 'bg-fpl-accent text-fpl-dark' : 'bg-white dark:bg-fpl-card border border-fpl-light-border dark:border-fpl-border text-gray-600 dark:text-gray-300'
            }`}
          >
            {t('fixtures.gameweek')}
          </button>
          <button
            onClick={() => setView('fdr')}
            className={`px-3 py-1.5 text-sm rounded ${
              view === 'fdr' ? 'bg-fpl-accent text-fpl-dark' : 'bg-white dark:bg-fpl-card border border-fpl-light-border dark:border-fpl-border text-gray-600 dark:text-gray-300'
            }`}
          >
            {t('fixtures.fdrGrid')}
          </button>
        </div>
      </div>

      {view === 'gw' && (
        <>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setSelectedGw(Math.max(1, gw - 1))}
              disabled={gw <= 1}
              className="p-2 rounded-lg bg-white dark:bg-fpl-card border border-fpl-light-border dark:border-fpl-border text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Previous gameweek"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>

            <select
              value={gw}
              onChange={(e) => setSelectedGw(Number(e.target.value))}
              className="bg-white dark:bg-fpl-card border border-fpl-light-border dark:border-fpl-border rounded-lg px-4 py-2 text-sm font-semibold text-gray-900 dark:text-white text-center appearance-none cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors min-w-[120px]"
            >
              {gameweeks?.map((e) => (
                <option key={e.id} value={e.id}>
                  {t('common.gw')} {e.id}{e.is_current ? ` \u2022 ${t('common.live')}` : ''}
                </option>
              ))}
            </select>

            <button
              onClick={() => setSelectedGw(Math.min(gameweeks?.length || 38, gw + 1))}
              disabled={gw >= (gameweeks?.length || 38)}
              className="p-2 rounded-lg bg-white dark:bg-fpl-card border border-fpl-light-border dark:border-fpl-border text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Next gameweek"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {gwFixtures.map((f) => {
              const home = teamsMap?.[f.team_h];
              const away = teamsMap?.[f.team_a];
              const finished = f.finished;
              const started = f.started;
              return (
                <div
                  key={f.id}
                  className="bg-white dark:bg-fpl-card border border-fpl-light-border dark:border-fpl-border rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col items-center gap-1 flex-1">
                      <TeamBadge team={home} size={28} />
                      <p className="text-gray-900 dark:text-white font-medium">{home?.short_name}</p>
                      <DifficultyBadge difficulty={f.team_h_difficulty} />
                    </div>
                    <div className="text-center px-4">
                      {finished || started ? (
                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                          {f.team_h_score ?? '-'} - {f.team_a_score ?? '-'}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {f.kickoff_time
                            ? new Date(f.kickoff_time).toLocaleString([], {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : t('fixtures.tbd')}
                        </p>
                      )}
                      {started && !finished && (
                        <span className="text-xs text-fpl-green font-semibold animate-pulse">
                          {t('common.live')}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col items-center gap-1 flex-1">
                      <TeamBadge team={away} size={28} />
                      <p className="text-gray-900 dark:text-white font-medium">{away?.short_name}</p>
                      <DifficultyBadge difficulty={f.team_a_difficulty} />
                    </div>
                  </div>
                </div>
              );
            })}
            {gwFixtures.length === 0 && (
              <p className="text-gray-400 dark:text-gray-500 col-span-full text-center py-8">{t('fixtures.noFixtures')}</p>
            )}
          </div>
        </>
      )}

      {view === 'fdr' && (
        <div className="bg-white dark:bg-fpl-card border border-fpl-light-border dark:border-fpl-border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-fpl-light-border dark:border-fpl-border">
                <th className="px-4 py-2 text-left text-gray-500 dark:text-gray-400">{t('common.team')}</th>
                {fdrData.gwCols.map((g) => (
                  <th key={g} className="px-3 py-2 text-center text-gray-500 dark:text-gray-400">GW{g}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fdrData.teamRows.map(({ team: tm, cells }) => (
                <tr key={tm.id} className="border-b border-fpl-light-border/30 dark:border-fpl-border/30">
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <TeamBadge team={tm} size={18} />
                      <span className="text-gray-900 dark:text-white font-medium">{tm.short_name}</span>
                    </div>
                  </td>
                  {cells.map((c, i) => (
                    <td key={i} className="px-1 py-1 text-center">
                      <DifficultyBadge
                        difficulty={c.diff}
                        label={`${c.opp} (${c.home ? 'H' : 'A'})`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
