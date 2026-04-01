import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import useBootstrap from '../hooks/useBootstrap';
import useFixtures from '../hooks/useFixtures';
import Spinner from '../components/common/Spinner';
import ErrorBanner from '../components/common/ErrorBanner';
import DifficultyBadge from '../components/common/DifficultyBadge';

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
          <div className="flex gap-1 overflow-x-auto pb-2">
            {gameweeks?.map((e) => (
              <button
                key={e.id}
                onClick={() => setSelectedGw(e.id)}
                className={`shrink-0 px-3 py-1.5 text-xs rounded ${
                  e.id === gw
                    ? 'bg-fpl-accent text-fpl-dark font-semibold'
                    : 'bg-white dark:bg-fpl-card border border-fpl-light-border dark:border-fpl-border text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                GW{e.id}
              </button>
            ))}
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
                    <div className="text-center flex-1">
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
                    <div className="text-center flex-1">
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
                  <td className="px-4 py-2 text-gray-900 dark:text-white font-medium">{tm.short_name}</td>
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
