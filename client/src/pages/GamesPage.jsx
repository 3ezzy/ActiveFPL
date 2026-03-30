import { useState, useMemo } from 'react';
import useBootstrap from '../hooks/useBootstrap';
import useFixtures from '../hooks/useFixtures';
import Spinner from '../components/common/Spinner';
import ErrorBanner from '../components/common/ErrorBanner';
import { HiChevronDown, HiChevronUp } from 'react-icons/hi2';

const PL_BADGE_URL = 'https://resources.premierleague.com/premierleague/badges/70';

// Team badge from PL CDN — maps team code to badge image
function TeamBadge({ team, size = 40 }) {
  if (!team) return <div className="rounded-full bg-fpl-border" style={{ width: size, height: size }} />;
  return (
    <img
      src={`${PL_BADGE_URL}/t${team.code}.png`}
      alt={team.short_name}
      className="object-contain"
      style={{ width: size, height: size }}
      onError={(e) => { e.target.style.display = 'none'; }}
    />
  );
}

// Team jersey / kit SVG representation
function TeamJersey({ team, size = 36 }) {
  if (!team) return null;
  // Use PL shirt image
  return (
    <img
      src={`https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${team.code}-110.webp`}
      alt={team.short_name}
      className="object-contain"
      style={{ width: size, height: size * 1.2 }}
      onError={(e) => {
        // Fallback to badge if shirt not available
        e.target.src = `${PL_BADGE_URL}/t${team.code}.png`;
        e.target.style.height = `${size}px`;
      }}
    />
  );
}

// Stat icon label for match events
function StatEvent({ type, players, playersMap, teamsMap, side }) {
  const icons = {
    goals_scored: '\u26BD',
    assists: '\uD83C\uDFA5',
    own_goals: '\uD83D\uDFE5 OG',
    yellow_cards: '\uD83D\uDFE8',
    red_cards: '\uD83D\uDFE5',
    saves: '\uD83E\uDDE4',
    penalties_saved: '\uD83E\uDDE4 PEN',
    penalties_missed: '\u274C PEN',
    bonus: '\u2B50',
  };

  if (!players || players.length === 0) return null;

  return (
    <div className="space-y-0.5">
      {players.map((p, i) => {
        const player = playersMap?.[p.element];
        return (
          <div key={`${p.element}-${i}`} className={`flex items-center gap-1.5 text-xs ${side === 'right' ? 'flex-row-reverse text-right' : ''}`}>
            <span>{icons[type] || ''}</span>
            <span className="text-gray-300">{player?.web_name || `#${p.element}`}</span>
            {p.value > 1 && <span className="text-gray-500">x{p.value}</span>}
          </div>
        );
      })}
    </div>
  );
}

export default function GamesPage() {
  const { teamsMap, playersMap, currentEvent, gameweeks, loading: bLoading, error: bError } = useBootstrap();
  const { fixtures, loading: fLoading, error: fError } = useFixtures();
  const [selectedGw, setSelectedGw] = useState(null);
  const loading = bLoading || fLoading;
  const error = bError || fError;

  const gw = selectedGw ?? currentEvent?.id ?? 1;

  const gwFixtures = useMemo(
    () => fixtures.filter((f) => f.event === gw).sort((a, b) => {
      // Sort: live first, then by kickoff time
      if (a.started && !a.finished && !(b.started && !b.finished)) return -1;
      if (b.started && !b.finished && !(a.started && !a.finished)) return 1;
      return new Date(a.kickoff_time || 0) - new Date(b.kickoff_time || 0);
    }),
    [fixtures, gw]
  );

  const gwInfo = gameweeks?.find((e) => e.id === gw);

  if (loading) return <Spinner />;
  if (error) return <ErrorBanner message={error} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Games</h1>
          {gwInfo && (
            <p className="text-sm text-gray-400 mt-1">
              Gameweek {gw} &middot; Avg: {gwInfo.average_entry_score ?? '-'} pts
              {gwInfo.highest_score ? ` \u00B7 Highest: ${gwInfo.highest_score}` : ''}
            </p>
          )}
        </div>
      </div>

      {/* GW Selector */}
      <div className="flex gap-1 overflow-x-auto pb-2">
        {gameweeks?.map((e) => (
          <button
            key={e.id}
            onClick={() => setSelectedGw(e.id)}
            className={`shrink-0 px-3 py-1.5 text-xs rounded-lg transition-colors ${
              e.id === gw
                ? 'bg-fpl-accent text-fpl-dark font-semibold'
                : e.is_current
                ? 'bg-fpl-accent/20 text-fpl-accent border border-fpl-accent/30'
                : 'bg-fpl-card border border-fpl-border text-gray-400 hover:text-white'
            }`}
          >
            GW{e.id}
          </button>
        ))}
      </div>

      {/* Match Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {gwFixtures.map((f) => (
          <MatchCard key={f.id} fixture={f} teamsMap={teamsMap} playersMap={playersMap} />
        ))}
        {gwFixtures.length === 0 && (
          <div className="bg-fpl-card border border-fpl-border rounded-xl p-12 text-center">
            <p className="text-gray-500">No fixtures scheduled for Gameweek {gw}.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function MatchCard({ fixture: f, teamsMap, playersMap }) {
  const [expanded, setExpanded] = useState(false);
  const home = teamsMap?.[f.team_h];
  const away = teamsMap?.[f.team_a];
  const isLive = f.started && !f.finished;
  const isFinished = f.finished;
  const hasStats = f.stats && f.stats.length > 0;

  // Parse stats into home/away
  const statTypes = ['goals_scored', 'assists', 'own_goals', 'yellow_cards', 'red_cards', 'saves', 'bonus', 'bps'];

  return (
    <div className={`bg-fpl-card border rounded-xl overflow-hidden transition-colors ${
      isLive ? 'border-fpl-green shadow-lg shadow-fpl-green/5' : 'border-fpl-border'
    }`}>
      {/* Main Match Row */}
      <div
        className="px-4 sm:px-6 py-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Status bar */}
        <div className="flex items-center justify-center mb-3">
          {isLive && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-fpl-green">
              <span className="w-2 h-2 bg-fpl-green rounded-full animate-pulse" />
              LIVE {f.minutes && `${f.minutes}'`}
            </span>
          )}
          {isFinished && <span className="text-xs font-medium text-gray-500">Full Time</span>}
          {!f.started && (
            <span className="text-xs text-gray-400">
              {f.kickoff_time
                ? new Date(f.kickoff_time).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                : 'TBD'}
            </span>
          )}
        </div>

        {/* Teams and Score */}
        <div className="flex items-center justify-between gap-2">
          {/* Home Team */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <TeamBadge team={home} size={44} />
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm sm:text-base truncate">{home?.name || 'TBD'}</p>
              <p className="text-xs text-gray-500 hidden sm:block">{home?.short_name}</p>
            </div>
          </div>

          {/* Score */}
          <div className="flex items-center gap-3 shrink-0 px-2 sm:px-6">
            {f.started || isFinished ? (
              <>
                <div className="flex items-center gap-2">
                  <TeamJersey team={home} size={28} />
                  <span className={`text-3xl sm:text-4xl font-bold tabular-nums ${isLive ? 'text-fpl-green' : 'text-white'}`}>
                    {f.team_h_score ?? 0}
                  </span>
                </div>
                <span className="text-gray-600 text-xl font-light">-</span>
                <div className="flex items-center gap-2">
                  <span className={`text-3xl sm:text-4xl font-bold tabular-nums ${isLive ? 'text-fpl-green' : 'text-white'}`}>
                    {f.team_a_score ?? 0}
                  </span>
                  <TeamJersey team={away} size={28} />
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <TeamJersey team={home} size={28} />
                <span className="text-gray-500 text-lg font-medium">vs</span>
                <TeamJersey team={away} size={28} />
              </div>
            )}
          </div>

          {/* Away Team */}
          <div className="flex items-center gap-3 flex-1 min-w-0 justify-end">
            <div className="min-w-0 text-right">
              <p className="text-white font-semibold text-sm sm:text-base truncate">{away?.name || 'TBD'}</p>
              <p className="text-xs text-gray-500 hidden sm:block">{away?.short_name}</p>
            </div>
            <TeamBadge team={away} size={44} />
          </div>
        </div>

        {/* Quick Goal Scorers */}
        {hasStats && (f.started || isFinished) && (
          <div className="flex justify-between mt-3 px-2">
            <div className="flex-1 space-y-0.5">
              {f.stats.find((s) => s.identifier === 'goals_scored')?.h?.map((g, i) => {
                const player = playersMap?.[g.element];
                return (
                  <p key={i} className="text-xs text-gray-400">
                    <span className="mr-1">\u26BD</span> {player?.web_name || '?'}{g.value > 1 ? ` x${g.value}` : ''}
                  </p>
                );
              })}
            </div>
            <div className="flex-1 space-y-0.5 text-right">
              {f.stats.find((s) => s.identifier === 'goals_scored')?.a?.map((g, i) => {
                const player = playersMap?.[g.element];
                return (
                  <p key={i} className="text-xs text-gray-400">
                    {player?.web_name || '?'}{g.value > 1 ? ` x${g.value}` : ''} <span className="ml-1">\u26BD</span>
                  </p>
                );
              })}
            </div>
          </div>
        )}

        {/* Expand Indicator */}
        {hasStats && (
          <div className="flex justify-center mt-2">
            {expanded
              ? <HiChevronUp className="w-4 h-4 text-gray-500" />
              : <HiChevronDown className="w-4 h-4 text-gray-500" />
            }
          </div>
        )}
      </div>

      {/* Expanded Stats Panel */}
      {expanded && hasStats && (
        <div className="border-t border-fpl-border bg-fpl-dark/50 px-4 sm:px-6 py-4">
          <div className="grid grid-cols-[1fr_auto_1fr] gap-x-4 gap-y-3">
            {/* Header */}
            <p className="text-xs font-semibold text-fpl-accent">{home?.short_name}</p>
            <p className="text-xs font-semibold text-gray-500 text-center">Stat</p>
            <p className="text-xs font-semibold text-fpl-accent text-right">{away?.short_name}</p>

            {/* Stat Rows */}
            {statTypes.map((statType) => {
              const stat = f.stats.find((s) => s.identifier === statType);
              if (!stat) return null;
              const homeEvents = stat.h || [];
              const awayEvents = stat.a || [];
              if (homeEvents.length === 0 && awayEvents.length === 0) return null;

              const label = statType
                .replace(/_/g, ' ')
                .replace(/\b\w/g, (c) => c.toUpperCase());

              return (
                <div key={statType} className="contents">
                  <div>
                    <StatEvent type={statType} players={homeEvents} playersMap={playersMap} teamsMap={teamsMap} side="left" />
                  </div>
                  <div className="text-center self-start">
                    <span className="text-[10px] uppercase tracking-wider text-gray-500 leading-4">{label}</span>
                  </div>
                  <div>
                    <StatEvent type={statType} players={awayEvents} playersMap={playersMap} teamsMap={teamsMap} side="right" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* BPS Summary */}
          {(() => {
            const bpsStat = f.stats.find((s) => s.identifier === 'bps');
            if (!bpsStat) return null;
            const allBps = [...(bpsStat.h || []), ...(bpsStat.a || [])]
              .sort((a, b) => b.value - a.value)
              .slice(0, 5);
            if (allBps.length === 0) return null;

            return (
              <div className="mt-4 pt-4 border-t border-fpl-border">
                <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Bonus Points System (BPS)</p>
                <div className="flex flex-wrap gap-3">
                  {allBps.map((b, i) => {
                    const player = playersMap?.[b.element];
                    const team = teamsMap?.[player?.team];
                    const isTop3 = i < 3;
                    return (
                      <div key={b.element} className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg ${
                        isTop3 ? 'bg-fpl-accent/10 border border-fpl-accent/20' : 'bg-fpl-card border border-fpl-border'
                      }`}>
                        <span className={`font-bold ${isTop3 ? 'text-fpl-accent' : 'text-gray-400'}`}>
                          {i === 0 ? '\u2B50 3' : i === 1 ? '\u2B50 2' : i === 2 ? '\u2B50 1' : ''}
                        </span>
                        <span className="text-white">{player?.web_name || '?'}</span>
                        <span className="text-gray-500 text-xs">{team?.short_name}</span>
                        <span className="text-gray-400 text-xs font-medium">{b.value} BPS</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* FPL Points Summary */}
          {(() => {
            const goalStat = f.stats.find((s) => s.identifier === 'goals_scored');
            const assistStat = f.stats.find((s) => s.identifier === 'assists');
            const allInvolved = [
              ...(goalStat?.h || []).map((g) => ({ ...g, type: 'goal' })),
              ...(goalStat?.a || []).map((g) => ({ ...g, type: 'goal' })),
              ...(assistStat?.h || []).map((g) => ({ ...g, type: 'assist' })),
              ...(assistStat?.a || []).map((g) => ({ ...g, type: 'assist' })),
            ];
            if (allInvolved.length === 0) return null;

            // Group by player
            const playerStats = {};
            allInvolved.forEach(({ element, value, type }) => {
              if (!playerStats[element]) playerStats[element] = { goals: 0, assists: 0 };
              if (type === 'goal') playerStats[element].goals += value;
              if (type === 'assist') playerStats[element].assists += value;
            });

            return (
              <div className="mt-4 pt-4 border-t border-fpl-border">
                <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Goal Involvements</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(playerStats).map(([id, stats]) => {
                    const player = playersMap?.[Number(id)];
                    const team = teamsMap?.[player?.team];
                    return (
                      <div key={id} className="flex items-center gap-2 bg-fpl-card border border-fpl-border rounded-lg px-3 py-2">
                        <TeamJersey team={team} size={20} />
                        <div className="min-w-0">
                          <p className="text-sm text-white font-medium truncate">{player?.web_name || '?'}</p>
                          <p className="text-xs text-gray-400">
                            {stats.goals > 0 && <span className="text-fpl-green">{stats.goals}G</span>}
                            {stats.goals > 0 && stats.assists > 0 && ' '}
                            {stats.assists > 0 && <span className="text-fpl-accent">{stats.assists}A</span>}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}