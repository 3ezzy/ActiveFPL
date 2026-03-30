import { useState, useMemo } from 'react';
import { useTeam } from '../context/TeamContext';
import { useNavigate } from 'react-router-dom';
import useBootstrap from '../hooks/useBootstrap';
import useEntry from '../hooks/useEntry';
import usePicks from '../hooks/usePicks';
import useFixtures from '../hooks/useFixtures';
import Spinner from '../components/common/Spinner';
import ErrorBanner from '../components/common/ErrorBanner';
import StatCard from '../components/common/StatCard';
import DifficultyBadge from '../components/common/DifficultyBadge';
import {
  HiClipboardDocumentList,
  HiUsers,
  HiStar,
  HiSignal,
  HiQuestionMarkCircle,
  HiArrowTrendingUp,
  HiShieldExclamation,
  HiArrowsRightLeft,
  HiScale,
} from 'react-icons/hi2';

const fmt = (n) => (n != null ? new Intl.NumberFormat().format(n) : '-');
const posLabels = { 1: 'GKP', 2: 'DEF', 3: 'MID', 4: 'FWD' };

const tabs = [
  { key: 'summary', label: 'Summary', icon: HiClipboardDocumentList },
  { key: 'squad', label: 'Squad', icon: HiUsers },
  { key: 'captains', label: 'Captains', icon: HiStar },
  { key: 'live', label: 'Live', icon: HiSignal },
  { key: 'whatif', label: 'What-If', icon: HiQuestionMarkCircle },
  { key: 'gains', label: 'Gains', icon: HiArrowTrendingUp },
  { key: 'threats', label: 'Threats', icon: HiShieldExclamation },
  { key: 'transfers', label: 'Transfers', icon: HiArrowsRightLeft },
  { key: 'compare', label: 'Compare', icon: HiScale },
];

export default function RankPage() {
  const { teamId } = useTeam();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('summary');
  const { players, playersMap, teamsMap, currentEvent, loading: bLoading, error: bError } = useBootstrap();
  const { entry, loading: eLoading, error: eError } = useEntry(teamId);
  const eventId = entry?.current_event || currentEvent?.id;
  const { picks, entryHistory, activeChip, loading: pLoading, error: pError } = usePicks(teamId, eventId);
  const { fixtures } = useFixtures();

  if (!teamId) {
    navigate('/');
    return null;
  }

  const loading = bLoading || eLoading || pLoading;
  const error = bError || eError || pError;

  if (loading) return <Spinner />;
  if (error) return <ErrorBanner message={error} />;
  if (!entry) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {entry.player_first_name} {entry.player_last_name}
          </h1>
          <p className="text-gray-400">{entry.name} &middot; GW {eventId}</p>
        </div>
        <div className="flex gap-2">
          {activeChip && (
            <span className="bg-fpl-yellow/20 text-fpl-yellow text-xs font-semibold px-3 py-1 rounded-full uppercase">
              {activeChip}
            </span>
          )}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Overall Points" value={fmt(entry.summary_overall_points)} />
        <StatCard label="Overall Rank" value={fmt(entry.summary_overall_rank)} />
        <StatCard label="GW Points" value={fmt(entryHistory?.points ?? entry.summary_event_points)} />
        <StatCard label="GW Rank" value={fmt(entryHistory?.rank ?? entry.summary_event_rank)} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 border-b border-fpl-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap rounded-t-lg transition-colors ${
              activeTab === tab.key
                ? 'bg-fpl-card text-fpl-accent border border-fpl-border border-b-fpl-card -mb-px'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'summary' && (
          <SummaryTab entry={entry} entryHistory={entryHistory} picks={picks} playersMap={playersMap} teamsMap={teamsMap} eventId={eventId} />
        )}
        {activeTab === 'squad' && (
          <SquadTab picks={picks} playersMap={playersMap} teamsMap={teamsMap} eventId={eventId} />
        )}
        {activeTab === 'captains' && (
          <CaptainsTab picks={picks} playersMap={playersMap} teamsMap={teamsMap} players={players} />
        )}
        {activeTab === 'live' && (
          <LiveTab picks={picks} playersMap={playersMap} teamsMap={teamsMap} fixtures={fixtures} eventId={eventId} />
        )}
        {activeTab === 'whatif' && (
          <WhatIfTab picks={picks} playersMap={playersMap} teamsMap={teamsMap} />
        )}
        {activeTab === 'gains' && (
          <GainsTab picks={picks} playersMap={playersMap} teamsMap={teamsMap} players={players} />
        )}
        {activeTab === 'threats' && (
          <ThreatsTab picks={picks} playersMap={playersMap} teamsMap={teamsMap} players={players} />
        )}
        {activeTab === 'transfers' && (
          <TransfersTab entry={entry} entryHistory={entryHistory} />
        )}
        {activeTab === 'compare' && (
          <CompareTab teamId={teamId} entry={entry} entryHistory={entryHistory} playersMap={playersMap} teamsMap={teamsMap} eventId={eventId} />
        )}
      </div>
    </div>
  );
}

/* ──────── SUMMARY TAB ──────── */
function SummaryTab({ entry, entryHistory, picks, playersMap, teamsMap, eventId }) {
  const startingXI = picks?.filter((p) => p.position <= 11) || [];
  const bench = picks?.filter((p) => p.position > 11) || [];
  const captain = picks?.find((p) => p.is_captain);
  const captainPlayer = captain ? playersMap?.[captain.element] : null;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Key Info */}
      <div className="bg-fpl-card border border-fpl-border rounded-lg p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Overview</h3>
        <div className="space-y-3">
          {[
            ['Team Value', `£${((entryHistory?.value || entry.last_deadline_value || 0) / 10).toFixed(1)}m`],
            ['Bank', `£${((entryHistory?.bank ?? entry.last_deadline_bank ?? 0) / 10).toFixed(1)}m`],
            ['Captain', captainPlayer ? `${captainPlayer.web_name} (${captainPlayer.event_points * 2} pts)` : '-'],
            ['GW Transfers', entryHistory?.event_transfers ?? '-'],
            ['Transfer Cost', entryHistory?.event_transfers_cost ? `-${entryHistory.event_transfers_cost} pts` : '0'],
            ['Bench Points', entryHistory?.points_on_bench ?? '-'],
            ['Total Transfers', entry.last_deadline_total_transfers ?? '-'],
          ].map(([label, val]) => (
            <div key={label} className="flex justify-between">
              <span className="text-gray-400 text-sm">{label}</span>
              <span className="text-white text-sm font-medium">{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Formation */}
      <div className="bg-fpl-card border border-fpl-border rounded-lg p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Formation</h3>
        {playersMap && picks && (
          <FormationView picks={startingXI} playersMap={playersMap} teamsMap={teamsMap} />
        )}
        {bench.length > 0 && playersMap && (
          <div>
            <p className="text-xs text-gray-500 uppercase mb-2">Bench</p>
            <div className="flex gap-3 flex-wrap">
              {bench.map((p) => {
                const player = playersMap[p.element];
                return (
                  <div key={p.element} className="text-center">
                    <p className="text-xs text-gray-400">{player?.web_name}</p>
                    <p className="text-sm text-white font-medium">{player?.event_points ?? '-'}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FormationView({ picks, playersMap, teamsMap }) {
  const rows = { GKP: [], DEF: [], MID: [], FWD: [] };
  picks.forEach((p) => {
    const player = playersMap[p.element];
    if (!player) return;
    const pos = posLabels[player.element_type];
    if (rows[pos]) rows[pos].push({ ...player, multiplier: p.multiplier, is_captain: p.is_captain, is_vice_captain: p.is_vice_captain });
  });

  return (
    <div className="space-y-4">
      {['FWD', 'MID', 'DEF', 'GKP'].map((pos) => (
        <div key={pos} className="flex justify-center gap-4 flex-wrap">
          {rows[pos].map((player) => (
            <div key={player.id} className="text-center min-w-[60px]">
              <div className="w-10 h-10 mx-auto rounded-full bg-fpl-accent/20 flex items-center justify-center text-fpl-accent text-xs font-bold">
                {player.event_points != null ? player.event_points * player.multiplier : '-'}
              </div>
              <p className="text-xs text-white mt-1">
                {player.web_name}
                {player.is_captain && <span className="text-fpl-accent ml-0.5">(C)</span>}
                {player.is_vice_captain && <span className="text-gray-500 ml-0.5">(V)</span>}
              </p>
              <p className="text-[10px] text-gray-500">{teamsMap?.[player.team]?.short_name}</p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ──────── SQUAD TAB ──────── */
function SquadTab({ picks, playersMap, teamsMap, eventId }) {
  if (!picks || !playersMap) return <p className="text-gray-500">No squad data available.</p>;
  return (
    <div className="bg-fpl-card border border-fpl-border rounded-lg overflow-hidden">
      <h3 className="text-lg font-semibold text-white px-4 py-3 border-b border-fpl-border">
        GW {eventId} Squad
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 text-left border-b border-fpl-border">
              <th className="px-4 py-2">#</th>
              <th className="px-4 py-2">Player</th>
              <th className="px-4 py-2">Pos</th>
              <th className="px-4 py-2">Team</th>
              <th className="px-4 py-2 text-right">Price</th>
              <th className="px-4 py-2 text-right">Owned%</th>
              <th className="px-4 py-2 text-right">Pts</th>
            </tr>
          </thead>
          <tbody>
            {picks.map((pick) => {
              const player = playersMap[pick.element];
              const team = teamsMap?.[player?.team];
              const isBench = pick.position > 11;
              return (
                <tr key={pick.element} className={`border-b border-fpl-border/50 ${isBench ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-2 text-gray-500">{pick.position}</td>
                  <td className="px-4 py-2 text-white">
                    {player?.web_name || '?'}
                    {pick.is_captain && <span className="ml-1 text-xs bg-fpl-accent/20 text-fpl-accent px-1.5 py-0.5 rounded">C</span>}
                    {pick.is_vice_captain && <span className="ml-1 text-xs bg-gray-600/40 text-gray-300 px-1.5 py-0.5 rounded">V</span>}
                  </td>
                  <td className="px-4 py-2 text-gray-400">{posLabels[player?.element_type] || '-'}</td>
                  <td className="px-4 py-2 text-gray-400">{team?.short_name || '-'}</td>
                  <td className="px-4 py-2 text-right text-gray-300">{player ? `£${(player.now_cost / 10).toFixed(1)}` : '-'}</td>
                  <td className="px-4 py-2 text-right text-gray-300">{player?.selected_by_percent ?? '-'}%</td>
                  <td className="px-4 py-2 text-right text-white font-medium">
                    {player?.event_points != null ? player.event_points * pick.multiplier : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ──────── CAPTAINS TAB ──────── */
function CaptainsTab({ picks, playersMap, teamsMap, players }) {
  const captain = picks?.find((p) => p.is_captain);
  const viceCaptain = picks?.find((p) => p.is_vice_captain);
  const captainPlayer = captain ? playersMap?.[captain.element] : null;
  const vicePlayer = viceCaptain ? playersMap?.[viceCaptain.element] : null;

  // Top captain picks across all players by ownership
  const topCaptainPicks = useMemo(() => {
    if (!players) return [];
    return [...players]
      .sort((a, b) => parseFloat(b.selected_by_percent) - parseFloat(a.selected_by_percent))
      .slice(0, 10);
  }, [players]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Your Captain */}
        <div className="bg-fpl-card border border-fpl-accent/30 rounded-lg p-5">
          <p className="text-xs text-fpl-accent uppercase tracking-wide mb-3">Your Captain</p>
          {captainPlayer ? (
            <div>
              <p className="text-xl font-bold text-white">{captainPlayer.web_name}</p>
              <p className="text-sm text-gray-400">{teamsMap?.[captainPlayer.team]?.name}</p>
              <div className="mt-3 flex gap-4">
                <div>
                  <p className="text-2xl font-bold text-fpl-accent">{(captainPlayer.event_points || 0) * 2}</p>
                  <p className="text-xs text-gray-500">GW Points (2x)</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{captainPlayer.total_points}</p>
                  <p className="text-xs text-gray-500">Season Total</p>
                </div>
              </div>
            </div>
          ) : <p className="text-gray-500">-</p>}
        </div>

        {/* Vice Captain */}
        <div className="bg-fpl-card border border-fpl-border rounded-lg p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">Vice Captain</p>
          {vicePlayer ? (
            <div>
              <p className="text-xl font-bold text-white">{vicePlayer.web_name}</p>
              <p className="text-sm text-gray-400">{teamsMap?.[vicePlayer.team]?.name}</p>
              <div className="mt-3">
                <p className="text-2xl font-bold text-white">{vicePlayer.event_points ?? '-'}</p>
                <p className="text-xs text-gray-500">GW Points</p>
              </div>
            </div>
          ) : <p className="text-gray-500">-</p>}
        </div>
      </div>

      {/* Popular Captains */}
      <div className="bg-fpl-card border border-fpl-border rounded-lg overflow-hidden">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide px-4 py-3 border-b border-fpl-border">
          Most Popular Picks (by ownership)
        </h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 border-b border-fpl-border">
              <th className="px-4 py-2 text-left">Player</th>
              <th className="px-4 py-2 text-left">Team</th>
              <th className="px-4 py-2 text-right">Owned%</th>
              <th className="px-4 py-2 text-right">GW Pts</th>
              <th className="px-4 py-2 text-right">Total Pts</th>
            </tr>
          </thead>
          <tbody>
            {topCaptainPicks.map((p) => (
              <tr key={p.id} className="border-b border-fpl-border/30">
                <td className="px-4 py-2 text-white">{p.web_name}</td>
                <td className="px-4 py-2 text-gray-400">{teamsMap?.[p.team]?.short_name}</td>
                <td className="px-4 py-2 text-right text-fpl-accent">{p.selected_by_percent}%</td>
                <td className="px-4 py-2 text-right text-white">{p.event_points ?? '-'}</td>
                <td className="px-4 py-2 text-right text-gray-300">{p.total_points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ──────── LIVE TAB ──────── */
function LiveTab({ picks, playersMap, teamsMap, fixtures, eventId }) {
  const liveFixtures = useMemo(
    () => (fixtures || []).filter((f) => f.event === eventId),
    [fixtures, eventId]
  );

  const myPlayers = useMemo(() => {
    if (!picks || !playersMap) return [];
    return picks.map((p) => {
      const player = playersMap[p.element];
      const fixture = liveFixtures.find(
        (f) => f.team_h === player?.team || f.team_a === player?.team
      );
      return {
        ...p,
        player,
        fixture,
        isPlaying: fixture?.started && !fixture?.finished,
        hasPlayed: fixture?.finished,
      };
    });
  }, [picks, playersMap, liveFixtures]);

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {liveFixtures.map((f) => {
          const home = teamsMap?.[f.team_h];
          const away = teamsMap?.[f.team_a];
          const isLive = f.started && !f.finished;
          return (
            <div key={f.id} className={`bg-fpl-card border rounded-lg p-3 text-center ${isLive ? 'border-fpl-green' : 'border-fpl-border'}`}>
              <div className="flex items-center justify-between">
                <span className="text-white text-sm font-medium flex-1">{home?.short_name}</span>
                <span className="text-white font-bold px-2">{f.team_h_score ?? 0} - {f.team_a_score ?? 0}</span>
                <span className="text-white text-sm font-medium flex-1">{away?.short_name}</span>
              </div>
              {isLive && <span className="text-xs text-fpl-green font-semibold animate-pulse">{f.minutes}'</span>}
              {f.finished && <span className="text-xs text-gray-500">FT</span>}
            </div>
          );
        })}
      </div>

      <div className="bg-fpl-card border border-fpl-border rounded-lg overflow-hidden">
        <h3 className="text-sm font-semibold text-gray-400 uppercase px-4 py-3 border-b border-fpl-border">Your Players — Live Status</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 border-b border-fpl-border">
              <th className="px-4 py-2 text-left">Player</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-right">Pts</th>
            </tr>
          </thead>
          <tbody>
            {myPlayers.filter((p) => p.position <= 11).map((p) => (
              <tr key={p.element} className="border-b border-fpl-border/30">
                <td className="px-4 py-2 text-white">
                  {p.player?.web_name}
                  {p.is_captain && <span className="ml-1 text-xs text-fpl-accent">(C)</span>}
                </td>
                <td className="px-4 py-2">
                  {p.isPlaying && <span className="text-xs bg-fpl-green/20 text-fpl-green px-2 py-0.5 rounded-full">Playing</span>}
                  {p.hasPlayed && <span className="text-xs bg-gray-600/30 text-gray-400 px-2 py-0.5 rounded-full">Finished</span>}
                  {!p.isPlaying && !p.hasPlayed && <span className="text-xs bg-fpl-yellow/20 text-fpl-yellow px-2 py-0.5 rounded-full">Upcoming</span>}
                </td>
                <td className="px-4 py-2 text-right text-white font-medium">
                  {p.player?.event_points != null ? p.player.event_points * p.multiplier : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ──────── WHAT-IF TAB ──────── */
function WhatIfTab({ picks, playersMap, teamsMap }) {
  const [altCaptain, setAltCaptain] = useState(null);

  const startingPicks = picks?.filter((p) => p.position <= 11) || [];
  const currentCaptain = picks?.find((p) => p.is_captain);
  const currentPoints = startingPicks.reduce((sum, p) => {
    const player = playersMap?.[p.element];
    const pts = player?.event_points ?? 0;
    return sum + pts * p.multiplier;
  }, 0);

  const altPoints = useMemo(() => {
    if (!altCaptain || !picks) return null;
    return startingPicks.reduce((sum, p) => {
      const player = playersMap?.[p.element];
      const pts = player?.event_points ?? 0;
      if (p.element === altCaptain) return sum + pts * 2;
      if (p.is_captain) return sum + pts; // remove captain multiplier
      return sum + pts * p.multiplier;
    }, 0);
  }, [altCaptain, picks, playersMap, startingPicks]);

  const diff = altPoints != null ? altPoints - currentPoints : null;

  return (
    <div className="space-y-4">
      <div className="bg-fpl-card border border-fpl-border rounded-lg p-5">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
          What if you captained someone else?
        </h3>
        <select
          value={altCaptain || ''}
          onChange={(e) => setAltCaptain(Number(e.target.value))}
          className="bg-fpl-dark border border-fpl-border rounded-lg px-3 py-2 text-sm text-white w-full max-w-xs"
        >
          <option value="">Select alternative captain...</option>
          {startingPicks.map((p) => {
            const player = playersMap?.[p.element];
            return (
              <option key={p.element} value={p.element}>
                {player?.web_name} ({player?.event_points ?? 0} pts)
              </option>
            );
          })}
        </select>

        {altPoints != null && (
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-500">Current</p>
              <p className="text-xl font-bold text-white">{currentPoints}</p>
              <p className="text-xs text-gray-500">{playersMap?.[currentCaptain?.element]?.web_name} (C)</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Alternative</p>
              <p className="text-xl font-bold text-white">{altPoints}</p>
              <p className="text-xs text-gray-500">{playersMap?.[altCaptain]?.web_name} (C)</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Difference</p>
              <p className={`text-xl font-bold ${diff > 0 ? 'text-fpl-green' : diff < 0 ? 'text-fpl-red' : 'text-gray-400'}`}>
                {diff > 0 ? `+${diff}` : diff}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ──────── GAINS TAB ──────── */
function GainsTab({ picks, playersMap, teamsMap, players }) {
  // Players not in your team that scored well (missed gains)
  const gains = useMemo(() => {
    if (!players || !picks) return [];
    const myIds = new Set(picks.map((p) => p.element));
    return [...players]
      .filter((p) => !myIds.has(p.id) && p.event_points > 0)
      .sort((a, b) => b.event_points - a.event_points)
      .slice(0, 20);
  }, [players, picks]);

  return (
    <div className="bg-fpl-card border border-fpl-border rounded-lg overflow-hidden">
      <h3 className="text-sm font-semibold text-gray-400 uppercase px-4 py-3 border-b border-fpl-border">
        Top Performers You Don't Own
      </h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-400 border-b border-fpl-border">
            <th className="px-4 py-2 text-left">Player</th>
            <th className="px-4 py-2 text-left">Team</th>
            <th className="px-4 py-2 text-right">Owned%</th>
            <th className="px-4 py-2 text-right">GW Pts</th>
          </tr>
        </thead>
        <tbody>
          {gains.map((p) => (
            <tr key={p.id} className="border-b border-fpl-border/30">
              <td className="px-4 py-2 text-white">{p.web_name}</td>
              <td className="px-4 py-2 text-gray-400">{teamsMap?.[p.team]?.short_name}</td>
              <td className="px-4 py-2 text-right text-gray-300">{p.selected_by_percent}%</td>
              <td className="px-4 py-2 text-right text-fpl-green font-medium">{p.event_points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ──────── THREATS TAB ──────── */
function ThreatsTab({ picks, playersMap, teamsMap, players }) {
  // Highly owned players not in your team that scored well — threats to your rank
  const threats = useMemo(() => {
    if (!players || !picks) return [];
    const myIds = new Set(picks.map((p) => p.element));
    return [...players]
      .filter((p) => !myIds.has(p.id) && parseFloat(p.selected_by_percent) > 15 && p.event_points > 0)
      .sort((a, b) => b.event_points - a.event_points)
      .slice(0, 15);
  }, [players, picks]);

  return (
    <div className="bg-fpl-card border border-fpl-border rounded-lg overflow-hidden">
      <h3 className="text-sm font-semibold text-gray-400 uppercase px-4 py-3 border-b border-fpl-border">
        Rank Threats — Highly Owned Players You Don't Have
      </h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-400 border-b border-fpl-border">
            <th className="px-4 py-2 text-left">Player</th>
            <th className="px-4 py-2 text-left">Team</th>
            <th className="px-4 py-2 text-right">Owned%</th>
            <th className="px-4 py-2 text-right">GW Pts</th>
            <th className="px-4 py-2 text-right">Rank Impact</th>
          </tr>
        </thead>
        <tbody>
          {threats.map((p) => {
            const impact = Math.round(parseFloat(p.selected_by_percent) * p.event_points / 10);
            return (
              <tr key={p.id} className="border-b border-fpl-border/30">
                <td className="px-4 py-2 text-white">{p.web_name}</td>
                <td className="px-4 py-2 text-gray-400">{teamsMap?.[p.team]?.short_name}</td>
                <td className="px-4 py-2 text-right text-fpl-yellow">{p.selected_by_percent}%</td>
                <td className="px-4 py-2 text-right text-white">{p.event_points}</td>
                <td className="px-4 py-2 text-right text-fpl-red font-medium">-{impact}</td>
              </tr>
            );
          })}
          {threats.length === 0 && (
            <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">No significant threats this gameweek.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ──────── TRANSFERS TAB ──────── */
function TransfersTab({ entry, entryHistory }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="GW Transfers" value={entryHistory?.event_transfers ?? '-'} />
        <StatCard label="Transfer Cost" value={entryHistory?.event_transfers_cost ? `-${entryHistory.event_transfers_cost}` : '0'} />
        <StatCard label="Total Transfers" value={entry.last_deadline_total_transfers ?? '-'} />
      </div>

      <div className="bg-fpl-card border border-fpl-border rounded-lg p-5">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Transfer Budget</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Team Value</span>
            <span className="text-white">£{((entryHistory?.value || entry.last_deadline_value || 0) / 10).toFixed(1)}m</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">In the Bank</span>
            <span className="text-fpl-green">£{((entryHistory?.bank ?? entry.last_deadline_bank ?? 0) / 10).toFixed(1)}m</span>
          </div>
          <div className="border-t border-fpl-border pt-2 flex justify-between text-sm font-medium">
            <span className="text-gray-300">Selling Value</span>
            <span className="text-white">
              £{(((entryHistory?.value || entry.last_deadline_value || 0) + (entryHistory?.bank ?? entry.last_deadline_bank ?? 0)) / 10).toFixed(1)}m
            </span>
          </div>
        </div>
      </div>

      <div className="bg-fpl-card border border-fpl-border rounded-lg p-5">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Chips Used</h3>
        {entry.chips?.length > 0 ? (
          <div className="space-y-2">
            {entry.chips.map((chip, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-white capitalize">{chip.name.replace('_', ' ')}</span>
                <span className="text-gray-400">GW {chip.event}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No chips used yet.</p>
        )}
      </div>
    </div>
  );
}

/* ──────── COMPARE TAB ──────── */
function CompareTab({ teamId, entry, entryHistory, playersMap, teamsMap, eventId }) {
  const [rivalId, setRivalId] = useState('');
  const { entry: rivalEntry, loading: rLoading, error: rError } = useEntry(rivalId || null);
  const { picks: rivalPicks, entryHistory: rivalHistory } = usePicks(rivalId || null, eventId);
  const { picks: myPicks } = usePicks(teamId, eventId);

  const handleCompare = (e) => {
    e.preventDefault();
    // rivalId is set via controlled input
  };

  const myPickIds = new Set(myPicks?.map((p) => p.element) || []);
  const rivalPickIds = new Set(rivalPicks?.map((p) => p.element) || []);

  return (
    <div className="space-y-4">
      <form onSubmit={handleCompare} className="flex gap-3">
        <input
          type="text"
          value={rivalId}
          onChange={(e) => setRivalId(e.target.value.trim())}
          placeholder="Enter rival's Team ID"
          className="bg-fpl-dark border border-fpl-border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 w-48"
        />
      </form>

      {rLoading && <Spinner />}
      {rError && <ErrorBanner message={rError} />}

      {rivalEntry && (
        <div className="space-y-4">
          {/* Comparison cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-fpl-card border border-fpl-accent/30 rounded-lg p-4 text-center">
              <p className="text-xs text-fpl-accent uppercase mb-1">You</p>
              <p className="text-lg font-bold text-white">{entry.name}</p>
              <p className="text-2xl font-bold text-fpl-accent mt-2">{entryHistory?.points ?? entry.summary_event_points ?? '-'}</p>
              <p className="text-xs text-gray-400">GW Points</p>
            </div>
            <div className="bg-fpl-card border border-fpl-border rounded-lg p-4 text-center">
              <p className="text-xs text-gray-400 uppercase mb-1">Rival</p>
              <p className="text-lg font-bold text-white">{rivalEntry.name}</p>
              <p className="text-2xl font-bold text-white mt-2">{rivalHistory?.points ?? rivalEntry.summary_event_points ?? '-'}</p>
              <p className="text-xs text-gray-400">GW Points</p>
            </div>
          </div>

          {/* Differential players */}
          {rivalPicks && playersMap && (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="bg-fpl-card border border-fpl-border rounded-lg overflow-hidden">
                <h3 className="text-sm font-semibold text-fpl-accent uppercase px-4 py-3 border-b border-fpl-border">
                  Only You Own
                </h3>
                <div className="divide-y divide-fpl-border/30">
                  {myPicks?.filter((p) => p.position <= 11 && !rivalPickIds.has(p.element)).map((p) => {
                    const player = playersMap[p.element];
                    return (
                      <div key={p.element} className="flex items-center justify-between px-4 py-2">
                        <span className="text-white text-sm">{player?.web_name}</span>
                        <span className="text-fpl-green text-sm font-medium">{player?.event_points != null ? player.event_points * p.multiplier : '-'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="bg-fpl-card border border-fpl-border rounded-lg overflow-hidden">
                <h3 className="text-sm font-semibold text-fpl-red uppercase px-4 py-3 border-b border-fpl-border">
                  Only Rival Owns
                </h3>
                <div className="divide-y divide-fpl-border/30">
                  {rivalPicks?.filter((p) => p.position <= 11 && !myPickIds.has(p.element)).map((p) => {
                    const player = playersMap[p.element];
                    return (
                      <div key={p.element} className="flex items-center justify-between px-4 py-2">
                        <span className="text-white text-sm">{player?.web_name}</span>
                        <span className="text-fpl-red text-sm font-medium">{player?.event_points != null ? player.event_points * p.multiplier : '-'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {!rivalId && (
        <p className="text-gray-500 text-center py-8">Enter a rival's Team ID above to compare squads.</p>
      )}
    </div>
  );
}
