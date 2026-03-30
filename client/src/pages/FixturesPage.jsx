import { useState, useMemo } from 'react';
import useBootstrap from '../hooks/useBootstrap';
import useFixtures from '../hooks/useFixtures';
import Spinner from '../components/common/Spinner';
import ErrorBanner from '../components/common/ErrorBanner';
import DifficultyBadge from '../components/common/DifficultyBadge';

export default function FixturesPage() {
  const { teams, teamsMap, currentEvent, gameweeks, loading: bLoading, error: bError } = useBootstrap();
  const { fixtures, loading: fLoading, error: fError } = useFixtures();
  const [selectedGw, setSelectedGw] = useState(null);
  const [view, setView] = useState('gw'); // 'gw' or 'fdr'

  const gw = selectedGw ?? currentEvent?.id ?? 1;
  const loading = bLoading || fLoading;
  const error = bError || fError;

  const gwFixtures = useMemo(
    () => fixtures.filter((f) => f.event === gw),
    [fixtures, gw]
  );

  // FDR Grid: teams as rows, next 5 GWs as columns
  const fdrData = useMemo(() => {
    if (!teams || !fixtures.length) return { teamRows: [], gwCols: [] };
    const startGw = currentEvent?.id ?? 1;
    const gwCols = [];
    for (let i = startGw; i < startGw + 6 && i <= 38; i++) gwCols.push(i);

    const teamRows = teams.map((t) => {
      const cells = gwCols.map((gwNum) => {
        const match = fixtures.find(
          (f) => f.event === gwNum && (f.team_h === t.id || f.team_a === t.id)
        );
        if (!match) return { opp: '-', diff: 3, home: true };
        const isHome = match.team_h === t.id;
        const oppId = isHome ? match.team_a : match.team_h;
        const diff = isHome ? match.team_h_difficulty : match.team_a_difficulty;
        return {
          opp: teamsMap?.[oppId]?.short_name || '?',
          diff,
          home: isHome,
        };
      });
      return { team: t, cells };
    });
    return { teamRows, gwCols };
  }, [teams, fixtures, teamsMap, currentEvent]);

  if (loading) return <Spinner />;
  if (error) return <ErrorBanner message={error} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white">Fixtures</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setView('gw')}
            className={`px-3 py-1.5 text-sm rounded ${
              view === 'gw' ? 'bg-fpl-accent text-fpl-dark' : 'bg-fpl-card border border-fpl-border text-gray-300'
            }`}
          >
            Gameweek
          </button>
          <button
            onClick={() => setView('fdr')}
            className={`px-3 py-1.5 text-sm rounded ${
              view === 'fdr' ? 'bg-fpl-accent text-fpl-dark' : 'bg-fpl-card border border-fpl-border text-gray-300'
            }`}
          >
            FDR Grid
          </button>
        </div>
      </div>

      {/* GW Selector */}
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
                    : 'bg-fpl-card border border-fpl-border text-gray-400 hover:text-white'
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
                  className="bg-fpl-card border border-fpl-border rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-center flex-1">
                      <p className="text-white font-medium">{home?.short_name}</p>
                      <DifficultyBadge difficulty={f.team_h_difficulty} />
                    </div>
                    <div className="text-center px-4">
                      {finished || started ? (
                        <p className="text-xl font-bold text-white">
                          {f.team_h_score ?? '-'} - {f.team_a_score ?? '-'}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400">
                          {f.kickoff_time
                            ? new Date(f.kickoff_time).toLocaleString([], {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'TBD'}
                        </p>
                      )}
                      {started && !finished && (
                        <span className="text-xs text-fpl-green font-semibold animate-pulse">
                          LIVE
                        </span>
                      )}
                    </div>
                    <div className="text-center flex-1">
                      <p className="text-white font-medium">{away?.short_name}</p>
                      <DifficultyBadge difficulty={f.team_a_difficulty} />
                    </div>
                  </div>
                </div>
              );
            })}
            {gwFixtures.length === 0 && (
              <p className="text-gray-500 col-span-full text-center py-8">No fixtures for this gameweek.</p>
            )}
          </div>
        </>
      )}

      {/* FDR Grid */}
      {view === 'fdr' && (
        <div className="bg-fpl-card border border-fpl-border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-fpl-border">
                <th className="px-4 py-2 text-left text-gray-400">Team</th>
                {fdrData.gwCols.map((g) => (
                  <th key={g} className="px-3 py-2 text-center text-gray-400">GW{g}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fdrData.teamRows.map(({ team: t, cells }) => (
                <tr key={t.id} className="border-b border-fpl-border/30">
                  <td className="px-4 py-2 text-white font-medium">{t.short_name}</td>
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
