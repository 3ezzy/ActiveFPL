import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import useBootstrap from '../hooks/useBootstrap';
import usePlayerDetail from '../hooks/usePlayerDetail';
import { useTheme } from '../context/ThemeContext';
import { getChartTheme } from '../utils/chartTheme';
import Spinner from '../components/common/Spinner';
import ErrorBanner from '../components/common/ErrorBanner';
import DifficultyBadge from '../components/common/DifficultyBadge';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const PAGE_SIZE = 25;
const posLabels = { 1: 'GKP', 2: 'DEF', 3: 'MID', 4: 'FWD' };
const PL_BADGE_URL = 'https://resources.premierleague.com/premierleague/badges/70';

/* ─── Reusable: Team Badge ─── */
function TeamBadge({ team, size = 20 }) {
  if (!team) return <div className="rounded-full bg-gray-200 dark:bg-fpl-border shrink-0" style={{ width: size, height: size }} />;
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

/* ─── Reusable: Player Jersey ─── */
function PlayerJersey({ team, isGkp, size = 24 }) {
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

export default function PlayersPage() {
  const { players, teams, teamsMap, elementTypes, loading, error } = useBootstrap();
  const [position, setPosition] = useState('all');
  const [team, setTeam] = useState('all');
  const [sortBy, setSortBy] = useState('total_points');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const { t } = useTranslation();

  const filtered = useMemo(() => {
    if (!players) return [];
    let list = [...players];
    if (position !== 'all') list = list.filter((p) => p.element_type === Number(position));
    if (team !== 'all') list = list.filter((p) => p.team === Number(team));
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.web_name.toLowerCase().includes(q));
    }
    list.sort((a, b) => (b[sortBy] ?? 0) - (a[sortBy] ?? 0));
    return list;
  }, [players, position, team, sortBy, search]);

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (loading) return <Spinner />;
  if (error) return <ErrorBanner message={error} />;

  return (
    <div className="space-y-4">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t('players.title')}</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={position}
          onChange={(e) => { setPosition(e.target.value); setPage(0); }}
          className="bg-gray-50 dark:bg-fpl-dark border border-fpl-light-border dark:border-fpl-border rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
        >
          <option value="all">{t('players.allPositions')}</option>
          {elementTypes?.map((et) => (
            <option key={et.id} value={et.id}>{et.singular_name}</option>
          ))}
        </select>

        <select
          value={team}
          onChange={(e) => { setTeam(e.target.value); setPage(0); }}
          className="bg-gray-50 dark:bg-fpl-dark border border-fpl-light-border dark:border-fpl-border rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
        >
          <option value="all">{t('players.allTeams')}</option>
          {teams?.sort((a, b) => a.name.localeCompare(b.name)).map((tm) => (
            <option key={tm.id} value={tm.id}>{tm.name}</option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => { setSortBy(e.target.value); setPage(0); }}
          className="bg-gray-50 dark:bg-fpl-dark border border-fpl-light-border dark:border-fpl-border rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
        >
          <option value="total_points">{t('players.totalPoints')}</option>
          <option value="now_cost">{t('players.price')}</option>
          <option value="form">{t('players.form')}</option>
          <option value="goals_scored">{t('players.goals')}</option>
          <option value="assists">{t('players.assists')}</option>
          <option value="ict_index">{t('players.ictIndex')}</option>
        </select>

        <input
          type="text"
          placeholder={t('players.searchPlayer')}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          className="bg-gray-50 dark:bg-fpl-dark border border-fpl-light-border dark:border-fpl-border rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 flex-1 min-w-[150px]"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-fpl-card border border-fpl-light-border dark:border-fpl-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 dark:text-gray-400 text-left border-b border-fpl-light-border dark:border-fpl-border text-xs uppercase tracking-wider">
                <th className="px-4 py-2.5">{t('common.player')}</th>
                <th className="px-4 py-2.5">{t('common.team')}</th>
                <th className="px-4 py-2.5">{t('common.pos')}</th>
                <th className="px-4 py-2.5 text-right">{t('common.price')}</th>
                <th className="px-4 py-2.5 text-right">{t('common.form')}</th>
                <th className="px-4 py-2.5 text-right">{t('common.pts')}</th>
                <th className="px-4 py-2.5 text-right hidden sm:table-cell">{t('players.goals')}</th>
                <th className="px-4 py-2.5 text-right hidden sm:table-cell">{t('players.assists')}</th>
                <th className="px-4 py-2.5 text-right hidden sm:table-cell">{t('players.ictIndex')}</th>
              </tr>
            </thead>
            <tbody>
              {pageData.map((p) => {
                const pTeam = teamsMap?.[p.team];
                return (
                  <tr
                    key={p.id}
                    className="border-b border-fpl-light-border/50 dark:border-fpl-border/50 hover:bg-gray-50 dark:hover:bg-white/[0.03] cursor-pointer transition-colors"
                    onClick={() => setSelectedPlayer(p.id)}
                  >
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <PlayerJersey team={pTeam} isGkp={p.element_type === 1} size={22} />
                        <span className="text-gray-900 dark:text-white font-medium">{p.web_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <TeamBadge team={pTeam} size={18} />
                        <span className="text-gray-500 dark:text-gray-400">{pTeam?.short_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400">{posLabels[p.element_type]}</td>
                    <td className="px-4 py-2.5 text-right text-gray-900 dark:text-white">{(p.now_cost / 10).toFixed(1)}</td>
                    <td className="px-4 py-2.5 text-right text-gray-900 dark:text-white">{p.form}</td>
                    <td className="px-4 py-2.5 text-right text-gray-900 dark:text-white font-medium">{p.total_points}</td>
                    <td className="px-4 py-2.5 text-right text-gray-900 dark:text-white hidden sm:table-cell">{p.goals_scored}</td>
                    <td className="px-4 py-2.5 text-right text-gray-900 dark:text-white hidden sm:table-cell">{p.assists}</td>
                    <td className="px-4 py-2.5 text-right text-gray-900 dark:text-white hidden sm:table-cell">{p.ict_index}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 text-sm rounded bg-white dark:bg-fpl-card border border-fpl-light-border dark:border-fpl-border text-gray-600 dark:text-gray-300 disabled:opacity-30"
          >
            {t('players.prev')}
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {page + 1} / {pageCount}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={page >= pageCount - 1}
            className="px-3 py-1.5 text-sm rounded bg-white dark:bg-fpl-card border border-fpl-light-border dark:border-fpl-border text-gray-600 dark:text-gray-300 disabled:opacity-30"
          >
            {t('players.next')}
          </button>
        </div>
      )}

      {/* Player Detail Modal */}
      {selectedPlayer && (
        <PlayerDetailModal
          playerId={selectedPlayer}
          playersMap={players ? Object.fromEntries(players.map((p) => [p.id, p])) : {}}
          teamsMap={teamsMap}
          onClose={() => setSelectedPlayer(null)}
          t={t}
        />
      )}
    </div>
  );
}

function PlayerDetailModal({ playerId, playersMap, teamsMap, onClose, t }) {
  const player = playersMap[playerId];
  const { history, fixtures, loading, error } = usePlayerDetail(playerId);
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const chart = getChartTheme(isDark);

  if (!player) return null;

  const team = teamsMap?.[player.team];
  const isGkp = player.element_type === 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-fpl-card border border-fpl-light-border dark:border-fpl-border rounded-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-fpl-light-border dark:border-fpl-border">
          <div className="flex items-center gap-4">
            <PlayerJersey team={team} isGkp={isGkp} size={40} />
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{player.first_name} {player.second_name}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <TeamBadge team={team} size={16} />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {team?.name} &middot; {posLabels[player.element_type]} &middot;
                  {'\u00A3'}{(player.now_cost / 10).toFixed(1)}m &middot;
                  {player.selected_by_percent}% {t('players.owned')}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 dark:hover:text-white text-2xl">&times;</button>
        </div>

        <div className="p-6 space-y-6">
          {/* Season stats */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 text-center">
            {[
              [t('players.points'), player.total_points],
              [t('players.goals'), player.goals_scored],
              [t('players.assists'), player.assists],
              [t('players.minutes'), player.minutes],
              [t('players.form'), player.form],
            ].map(([label, val]) => (
              <div key={label} className="bg-gray-50 dark:bg-fpl-dark rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{val}</p>
              </div>
            ))}
          </div>

          {loading && <Spinner />}
          {error && <ErrorBanner message={error} />}

          {/* Points Chart */}
          {history.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">{t('players.pointsPerGw')}</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={history}>
                  <XAxis dataKey="round" tick={{ fill: chart.tickFill, fontSize: 11 }} />
                  <YAxis tick={{ fill: chart.tickFill, fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: chart.tooltipBg, border: `1px solid ${chart.tooltipBorder}`, borderRadius: 8 }}
                    labelStyle={{ color: chart.tickFill }}
                  />
                  <Line type="monotone" dataKey="total_points" stroke={chart.lineStroke} strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Match History */}
          {history.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">{t('players.matchHistory')}</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-500 dark:text-gray-400 border-b border-fpl-light-border dark:border-fpl-border">
                      <th className="px-2 py-1 text-left">{t('players.gw')}</th>
                      <th className="px-2 py-1 text-left">{t('players.opponent')}</th>
                      <th className="px-2 py-1 text-right">{t('common.pts')}</th>
                      <th className="px-2 py-1 text-right">{t('players.min')}</th>
                      <th className="px-2 py-1 text-right">{t('players.goals')}</th>
                      <th className="px-2 py-1 text-right">{t('players.assists')}</th>
                      <th className="px-2 py-1 text-right">{t('players.bps')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.slice().reverse().map((h) => {
                      const oppTeam = teamsMap?.[h.opponent_team];
                      return (
                        <tr key={h.round} className="border-b border-fpl-light-border/30 dark:border-fpl-border/30">
                          <td className="px-2 py-1.5 text-gray-600 dark:text-gray-300">{h.round}</td>
                          <td className="px-2 py-1.5">
                            <div className="flex items-center gap-1.5">
                              <TeamBadge team={oppTeam} size={14} />
                              <span className="text-gray-600 dark:text-gray-300">{oppTeam?.short_name || h.opponent_team}</span>
                            </div>
                          </td>
                          <td className="px-2 py-1.5 text-right text-gray-900 dark:text-white font-medium">{h.total_points}</td>
                          <td className="px-2 py-1.5 text-right text-gray-600 dark:text-gray-300">{h.minutes}</td>
                          <td className="px-2 py-1.5 text-right text-gray-600 dark:text-gray-300">{h.goals_scored}</td>
                          <td className="px-2 py-1.5 text-right text-gray-600 dark:text-gray-300">{h.assists}</td>
                          <td className="px-2 py-1.5 text-right text-gray-600 dark:text-gray-300">{h.bps}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Upcoming Fixtures */}
          {fixtures.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">{t('players.upcomingFixtures')}</h3>
              <div className="flex flex-wrap gap-2">
                {fixtures.slice(0, 6).map((f) => {
                  const isHome = f.is_home;
                  const oppId = isHome ? f.team_a : f.team_h;
                  const diff = f.difficulty;
                  return (
                    <DifficultyBadge
                      key={f.id}
                      difficulty={diff}
                      label={`${teamsMap?.[oppId]?.short_name || '?'} (${isHome ? 'H' : 'A'})`}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
