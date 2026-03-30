import { useState, useEffect, useMemo } from 'react';
import { useTeam } from '../context/TeamContext';
import useEntry from '../hooks/useEntry';
import useLeague from '../hooks/useLeague';
import useBootstrap from '../hooks/useBootstrap';
import fplClient from '../api/fplClient';
import Spinner from '../components/common/Spinner';
import ErrorBanner from '../components/common/ErrorBanner';
import {
  HiChevronDown,
  HiChevronUp,
  HiArrowUp,
  HiArrowDown,
  HiMinus,
  HiArrowsUpDown,
} from 'react-icons/hi2';

const posLabels = { 1: 'GKP', 2: 'DEF', 3: 'MID', 4: 'FWD' };
const fmt = (n) => (n != null ? new Intl.NumberFormat().format(n) : '-');

const chipLabels = {
  wildcard: { label: 'WC', color: 'bg-purple-500/20 text-purple-400' },
  freehit: { label: 'FH', color: 'bg-blue-500/20 text-blue-400' },
  bboost: { label: 'BB', color: 'bg-green-500/20 text-green-400' },
  '3xc': { label: 'TC', color: 'bg-orange-500/20 text-orange-400' },
};

/* ─── Jersey image component ─── */
function PlayerJersey({ team, isGkp, size = 28 }) {
  if (!team) return null;
  const shirtType = isGkp ? `shirt_${team.code}_1` : `shirt_${team.code}`;
  return (
    <img
      src={`https://fantasy.premierleague.com/dist/img/shirts/standard/${shirtType}-110.webp`}
      alt={team.short_name}
      className="object-contain shrink-0"
      style={{ width: size, height: size * 1.2 }}
      onError={(e) => {
        e.target.style.display = 'none';
      }}
    />
  );
}

/* ─── Autosub logic ─── */
// FPL autosub rules: if a starting XI player has 0 minutes, replace with the
// first valid bench player (in bench order). Must maintain valid formation:
// min 1 GKP, min 3 DEF, min 2 MID, min 1 FWD.
function computeAutosubs(allPicks, playersMap) {
  if (!allPicks || !playersMap) return { finalXI: [], finalBench: [], subs: [] };

  const starting = allPicks.filter((p) => p.position <= 11).map((p) => ({ ...p }));
  const bench = allPicks.filter((p) => p.position > 11).map((p) => ({ ...p }));
  const subs = [];

  const getPos = (pick) => playersMap[pick.element]?.element_type;
  const didPlay = (pick) => {
    const pl = playersMap[pick.element];
    return pl && (pl.minutes > 0 || pl.event_points > 0);
  };

  // Count positions in a lineup
  const countPos = (lineup) => {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0 };
    lineup.forEach((p) => { counts[getPos(p)] = (counts[getPos(p)] || 0) + 1; });
    return counts;
  };

  // Check if formation is valid after removing outIdx and adding sub
  const isValidFormation = (lineup, sub) => {
    const counts = countPos(lineup);
    const subPos = getPos(sub);
    counts[subPos] = (counts[subPos] || 0) + 1;
    return counts[1] >= 1 && counts[2] >= 3 && counts[3] >= 2 && counts[4] >= 1;
  };

  // Process each starting player who didn't play
  for (let i = 0; i < starting.length; i++) {
    if (didPlay(starting[i])) continue;

    // Try bench players in order
    for (let j = 0; j < bench.length; j++) {
      if (!didPlay(bench[j])) continue; // bench player must have played

      // Check if subbing out starting[i] and in bench[j] keeps formation valid
      const testLineup = starting.filter((_, idx) => idx !== i);
      if (isValidFormation(testLineup, bench[j])) {
        subs.push({ out: starting[i].element, in: bench[j].element });
        starting[i] = bench.splice(j, 1)[0];
        break;
      }
    }
  }

  return { finalXI: starting, finalBench: bench, subs };
}

// Calculate GW points for a lineup
function calcLineupPoints(picks, playersMap) {
  let total = 0;
  picks.forEach((p) => {
    const player = playersMap?.[p.element];
    if (player) {
      total += (player.event_points || 0) * (p.multiplier || 1);
    }
  });
  return total;
}

export default function LeaguePage() {
  const { teamId } = useTeam();
  const { entry } = useEntry(teamId);
  const [leagueId, setLeagueId] = useState('');
  const [activeLeague, setActiveLeague] = useState(null);
  const [manualInput, setManualInput] = useState('');

  const userLeagues = entry?.leagues?.classic || [];

  const handleSelectLeague = (id) => {
    setActiveLeague(id);
    setLeagueId(String(id));
  };

  const handleManualSearch = (e) => {
    e.preventDefault();
    if (manualInput.trim() && /^\d+$/.test(manualInput.trim())) {
      setActiveLeague(Number(manualInput.trim()));
      setLeagueId(manualInput.trim());
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-white">Live Leagues</h1>

      <div className="flex flex-wrap gap-3">
        {userLeagues.length > 0 && (
          <select
            value={activeLeague || ''}
            onChange={(e) => handleSelectLeague(Number(e.target.value))}
            className="bg-fpl-dark border border-fpl-border rounded-lg px-3 py-2 text-sm text-white"
          >
            <option value="">Select a league...</option>
            {userLeagues.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        )}

        <form onSubmit={handleManualSearch} className="flex gap-2">
          <input
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="League ID"
            className="bg-fpl-dark border border-fpl-border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 w-32"
          />
          <button
            type="submit"
            className="bg-fpl-accent hover:bg-fpl-accent/80 text-fpl-dark font-semibold px-4 py-2 rounded-lg text-sm"
          >
            Search
          </button>
        </form>
      </div>

      {leagueId && <LiveLeagueStandings leagueId={leagueId} userEntry={entry?.id} />}

      {!leagueId && !teamId && (
        <p className="text-gray-500 text-center py-12">
          Enter your Team ID on the home page to see your leagues, or search by League ID above.
        </p>
      )}
    </div>
  );
}

/* ─── Fetch all manager picks for a league ─── */
function useManagerPicks(standings, eventId) {
  const [picksMap, setPicksMap] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!standings.length || !eventId) return;
    let cancelled = false;
    setLoading(true);

    const fetchAll = async () => {
      const results = {};
      for (let i = 0; i < standings.length; i += 5) {
        const batch = standings.slice(i, i + 5);
        const promises = batch.map(async (s) => {
          try {
            const res = await fplClient.get(`/entry/${s.entry}/event/${eventId}/picks`);
            results[s.entry] = res.data;
          } catch {
            results[s.entry] = null;
          }
        });
        await Promise.all(promises);
      }
      if (!cancelled) {
        setPicksMap(results);
        setLoading(false);
      }
    };
    fetchAll();

    return () => { cancelled = true; };
  }, [standings, eventId]);

  return { picksMap, loading };
}

function LiveLeagueStandings({ leagueId, userEntry }) {
  const [page, setPage] = useState(1);
  const [autoSubs, setAutoSubs] = useState(false);
  const { league, standings, hasNext, loading: lLoading, error } = useLeague(leagueId, page);
  const { playersMap, teamsMap, currentEvent, loading: bLoading } = useBootstrap();
  const eventId = currentEvent?.id;
  const { picksMap, loading: pLoading } = useManagerPicks(standings, eventId);
  const [expandedId, setExpandedId] = useState(null);

  const loading = lLoading || bLoading;

  // Compute autosub-adjusted standings
  const adjustedStandings = useMemo(() => {
    if (!autoSubs || !playersMap || !Object.keys(picksMap).length) return standings;

    return standings
      .map((s) => {
        const picks = picksMap[s.entry];
        if (!picks?.picks) return { ...s, _autosubGw: s.event_total, _autosubTotal: s.total, _subs: [] };

        const { finalXI, subs } = computeAutosubs(picks.picks, playersMap);
        const autoGw = calcLineupPoints(finalXI, playersMap) - (picks.entry_history?.event_transfers_cost || 0);
        const diff = autoGw - s.event_total;

        return {
          ...s,
          _autosubGw: autoGw,
          _autosubTotal: s.total + diff,
          _subs: subs,
        };
      })
      .sort((a, b) => b._autosubTotal - a._autosubTotal)
      .map((s, idx) => ({ ...s, _autosubRank: idx + 1 }));
  }, [autoSubs, standings, picksMap, playersMap]);

  if (loading) return <Spinner />;
  if (error) return <ErrorBanner message={error} />;
  if (!league) return null;

  const displayStandings = autoSubs ? adjustedStandings : standings;
  const userRow = displayStandings.find((s) => s.entry === userEntry);
  const userTotal = autoSubs ? userRow?._autosubTotal : userRow?.total;

  return (
    <div className="space-y-4">
      <div className="bg-fpl-card border border-fpl-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-fpl-border flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">{league.name}</h2>
          <div className="flex items-center gap-3">
            {pLoading && <span className="text-xs text-fpl-accent animate-pulse">Loading picks...</span>}
            <button
              onClick={() => setAutoSubs((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                autoSubs
                  ? 'bg-fpl-accent/20 text-fpl-accent border border-fpl-accent/40'
                  : 'bg-fpl-dark border border-fpl-border text-gray-400 hover:text-white'
              }`}
              title="Toggle autosubs to recalculate standings based on bench players who would be subbed in"
            >
              <HiArrowsUpDown className="w-3.5 h-3.5" />
              Autosubs {autoSubs ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-left border-b border-fpl-border text-xs uppercase tracking-wider">
                <th className="px-3 py-2 w-6"></th>
                <th className="px-3 py-2">Rank</th>
                <th className="px-3 py-2">Team</th>
                <th className="px-3 py-2 hidden sm:table-cell">Manager</th>
                <th className="px-3 py-2 text-center">Chip</th>
                <th className="px-3 py-2 text-center" title="Captain">Cap</th>
                <th className="px-3 py-2 text-center" title="Transfers Made">TM</th>
                <th className="px-3 py-2 text-center" title="Played">Played</th>
                <th className="px-3 py-2 text-center" title="Yet to Play">YTP</th>
                <th className="px-3 py-2 text-right">GW</th>
                <th className="px-3 py-2 text-right">Total</th>
                {userTotal != null && <th className="px-3 py-2 text-right">Gap</th>}
              </tr>
            </thead>
            <tbody>
              {displayStandings.map((s) => {
                const isUser = s.entry === userEntry;
                const gwPts = autoSubs ? s._autosubGw : s.event_total;
                const totalPts = autoSubs ? s._autosubTotal : s.total;
                const displayRank = autoSubs ? s._autosubRank : s.rank;
                const gap = userTotal != null ? totalPts - userTotal : null;
                const picks = picksMap[s.entry];
                const isExpanded = expandedId === s.entry;

                // Derive stats from picks
                const activePicks = picks?.picks?.filter((p) => p.position <= 11) || [];
                const captain = picks?.picks?.find((p) => p.is_captain);
                const captainPlayer = captain ? playersMap?.[captain.element] : null;
                const activeChip = picks?.active_chip;
                const transfers = picks?.entry_history?.event_transfers ?? '-';

                // Count played / yet to play
                let played = 0;
                let yetToPlay = 0;
                activePicks.forEach((p) => {
                  const player = playersMap?.[p.element];
                  if (player) {
                    if (player.minutes > 0 || player.event_points > 0) played++;
                    else yetToPlay++;
                  }
                });

                const chipInfo = activeChip ? chipLabels[activeChip] : null;

                // Rank movement
                const rankDiff = autoSubs
                  ? s.rank - s._autosubRank
                  : s.last_rank ? s.last_rank - s.rank : 0;

                return (
                  <>
                    <tr
                      key={s.entry}
                      className={`border-b border-fpl-border/50 cursor-pointer transition-colors hover:bg-white/[0.03] ${
                        isUser ? 'bg-fpl-accent/10' : ''
                      } ${isExpanded ? 'bg-white/[0.02]' : ''}`}
                      onClick={() => setExpandedId(isExpanded ? null : s.entry)}
                    >
                      <td className="px-3 py-2.5 text-center">
                        {isExpanded
                          ? <HiChevronUp className="w-3.5 h-3.5 text-gray-500 mx-auto" />
                          : <HiChevronDown className="w-3.5 h-3.5 text-gray-500 mx-auto" />
                        }
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-white font-medium">{displayRank}</span>
                          {rankDiff > 0 && <HiArrowUp className="w-3 h-3 text-fpl-green" />}
                          {rankDiff < 0 && <HiArrowDown className="w-3 h-3 text-fpl-red" />}
                          {rankDiff === 0 && (autoSubs || s.last_rank) && <HiMinus className="w-3 h-3 text-gray-600" />}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-white font-medium max-w-[140px] truncate">{s.entry_name}</td>
                      <td className="px-3 py-2.5 text-gray-400 hidden sm:table-cell max-w-[120px] truncate">{s.player_name}</td>
                      <td className="px-3 py-2.5 text-center">
                        {chipInfo ? (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${chipInfo.color}`}>
                            {chipInfo.label}
                          </span>
                        ) : (
                          <span className="text-gray-600">-</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {captainPlayer ? (
                          <span className="text-xs text-fpl-accent font-medium">{captainPlayer.web_name}</span>
                        ) : (
                          <span className="text-gray-600">-</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-center text-gray-300">{transfers}</td>
                      <td className="px-3 py-2.5 text-center">
                        <span className="text-fpl-green text-xs font-medium">{played}</span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className="text-fpl-yellow text-xs font-medium">{yetToPlay}</span>
                      </td>
                      <td className="px-3 py-2.5 text-right text-white font-semibold">
                        {gwPts}
                        {autoSubs && gwPts !== s.event_total && (
                          <span className="text-[10px] ml-1 text-fpl-accent">({gwPts > s.event_total ? '+' : ''}{gwPts - s.event_total})</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right text-white font-medium">{fmt(totalPts)}</td>
                      {userTotal != null && (
                        <td className={`px-3 py-2.5 text-right font-medium ${
                          gap > 0 ? 'text-fpl-green' : gap < 0 ? 'text-fpl-red' : 'text-gray-400'
                        }`}>
                          {gap > 0 ? `+${gap}` : gap === 0 ? '-' : gap}
                        </td>
                      )}
                    </tr>

                    {/* Expanded Player Row */}
                    {isExpanded && (
                      <tr key={`${s.entry}-expand`}>
                        <td colSpan={userTotal != null ? 12 : 11} className="px-0 py-0">
                          <ManagerDetail
                            picks={picks}
                            playersMap={playersMap}
                            teamsMap={teamsMap}
                            autoSubs={autoSubs}
                            autoSubsList={autoSubs ? s._subs : []}
                          />
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>

        {(hasNext || page > 1) && (
          <div className="flex justify-center gap-2 py-3 border-t border-fpl-border">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm rounded bg-fpl-dark border border-fpl-border text-gray-300 disabled:opacity-30"
            >
              Prev
            </button>
            <span className="text-sm text-gray-400 py-1.5">Page {page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasNext}
              className="px-3 py-1.5 text-sm rounded bg-fpl-dark border border-fpl-border text-gray-300 disabled:opacity-30"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Expanded manager detail: players with points & ownership arrows ─── */
function ManagerDetail({ picks, playersMap, teamsMap, autoSubs, autoSubsList }) {
  if (!picks || !picks.picks || !playersMap) {
    return (
      <div className="bg-fpl-dark/50 border-t border-fpl-border px-4 py-4 text-center text-sm text-gray-500">
        Loading squad data...
      </div>
    );
  }

  const { entry_history } = picks;

  // Apply autosubs if enabled
  let startingXI, bench;
  if (autoSubs) {
    const { finalXI, finalBench } = computeAutosubs(picks.picks, playersMap);
    startingXI = finalXI;
    bench = finalBench;
  } else {
    startingXI = picks.picks.filter((p) => p.position <= 11);
    bench = picks.picks.filter((p) => p.position > 11);
  }

  // Build a set of subbed-in and subbed-out player IDs for highlighting
  const subbedIn = new Set((autoSubsList || []).map((s) => s.in));
  const subbedOut = new Set((autoSubsList || []).map((s) => s.out));

  return (
    <div className="bg-fpl-dark/40 border-t border-fpl-border">
      {/* Entry history summary bar */}
      {entry_history && (
        <div className="flex flex-wrap gap-x-6 gap-y-1 px-4 py-2 border-b border-fpl-border/50 text-xs text-gray-400">
          <span>Points: <strong className="text-white">{entry_history.points}</strong></span>
          <span>Transfers: <strong className="text-white">{entry_history.event_transfers}</strong></span>
          <span>Cost: <strong className={entry_history.event_transfers_cost > 0 ? 'text-fpl-red' : 'text-white'}>
            {entry_history.event_transfers_cost > 0 ? `-${entry_history.event_transfers_cost}` : '0'}
          </strong></span>
          <span>Bench Pts: <strong className="text-white">{entry_history.points_on_bench}</strong></span>
          <span>Value: <strong className="text-white">{'\u00A3'}{((entry_history.value || 0) / 10).toFixed(1)}m</strong></span>
        </div>
      )}

      {/* Autosub indicator */}
      {autoSubs && autoSubsList?.length > 0 && (
        <div className="px-4 py-1.5 border-b border-fpl-border/50 flex flex-wrap gap-2">
          {autoSubsList.map((sub, i) => {
            const inPlayer = playersMap[sub.in];
            const outPlayer = playersMap[sub.out];
            return (
              <span key={i} className="text-[10px] bg-fpl-accent/10 text-fpl-accent px-2 py-0.5 rounded-full">
                <HiArrowUp className="w-2.5 h-2.5 inline text-fpl-green" /> {inPlayer?.web_name}
                {' '}
                <HiArrowDown className="w-2.5 h-2.5 inline text-fpl-red" /> {outPlayer?.web_name}
              </span>
            );
          })}
        </div>
      )}

      {/* Starting XI */}
      <div className="px-4 py-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
          {startingXI.map((pick) => (
            <PlayerArrow
              key={pick.element}
              pick={pick}
              playersMap={playersMap}
              teamsMap={teamsMap}
              isSubbedIn={subbedIn.has(pick.element)}
            />
          ))}
        </div>

        {/* Bench */}
        {bench.length > 0 && (
          <>
            <div className="flex items-center gap-2 mt-2 mb-1">
              <div className="h-px flex-1 bg-fpl-border" />
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">Bench</span>
              <div className="h-px flex-1 bg-fpl-border" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
              {bench.map((pick) => (
                <PlayerArrow
                  key={pick.element}
                  pick={pick}
                  playersMap={playersMap}
                  teamsMap={teamsMap}
                  isBench
                  isSubbedOut={subbedOut.has(pick.element)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Player arrow indicator with jersey ─── */
function PlayerArrow({ pick, playersMap, teamsMap, isBench, isSubbedIn, isSubbedOut }) {
  const player = playersMap?.[pick.element];
  if (!player) return null;

  const team = teamsMap?.[player.team];
  const pts = player.event_points != null ? player.event_points * pick.multiplier : 0;
  const hasPlayed = player.minutes > 0 || player.event_points > 0;
  const ownership = player.selected_by_percent;
  const isGkp = player.element_type === 1;

  // Points color
  let ptsColor = 'text-gray-400';
  if (pts >= 10) ptsColor = 'text-fpl-green';
  else if (pts >= 5) ptsColor = 'text-fpl-accent';
  else if (pts > 0) ptsColor = 'text-white';
  else if (pts < 0) ptsColor = 'text-fpl-red';

  // Highlight autosub players
  let borderHighlight = '';
  if (isSubbedIn) borderHighlight = 'ring-1 ring-fpl-green/50 bg-fpl-green/5';
  if (isSubbedOut) borderHighlight = 'ring-1 ring-fpl-red/50 bg-fpl-red/5';

  return (
    <div className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors hover:bg-white/5 ${isBench ? 'opacity-60' : ''} ${borderHighlight}`}>
      {/* Jersey */}
      <PlayerJersey team={team} isGkp={isGkp} size={24} />

      {/* Points indicator */}
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
        hasPlayed
          ? pts >= 5 ? 'bg-fpl-green/20' : pts > 0 ? 'bg-fpl-card' : 'bg-fpl-red/10'
          : 'bg-fpl-card border border-fpl-border'
      } ${ptsColor}`}>
        {pts}
      </div>

      {/* Player info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-white text-xs font-medium truncate">{player.web_name}</span>
          {pick.is_captain && (
            <span className="text-[10px] bg-fpl-accent/20 text-fpl-accent px-1 py-0 rounded font-bold shrink-0">C</span>
          )}
          {pick.is_vice_captain && (
            <span className="text-[10px] bg-gray-600/40 text-gray-400 px-1 py-0 rounded font-bold shrink-0">V</span>
          )}
          {isSubbedIn && (
            <span className="text-[10px] bg-fpl-green/20 text-fpl-green px-1 py-0 rounded font-bold shrink-0">IN</span>
          )}
          {isSubbedOut && (
            <span className="text-[10px] bg-fpl-red/20 text-fpl-red px-1 py-0 rounded font-bold shrink-0">OUT</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
          <span>{team?.short_name}</span>
          <span>&middot;</span>
          <span>{posLabels[player.element_type]}</span>
        </div>
      </div>

      {/* Ownership */}
      <div className="text-right shrink-0">
        <p className="text-xs text-gray-400">{ownership}%</p>
        {hasPlayed ? (
          <HiArrowUp className={`w-3 h-3 inline ${pts > 0 ? 'text-fpl-green' : 'text-fpl-red'}`} />
        ) : (
          <span className="text-[10px] text-fpl-yellow">pending</span>
        )}
      </div>
    </div>
  );
}