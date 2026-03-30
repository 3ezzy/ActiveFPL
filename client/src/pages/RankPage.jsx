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
const PL_BADGE_URL = 'https://resources.premierleague.com/premierleague/badges/70';

/* ─── Reusable: Team Badge ─── */
function TeamBadge({ team, size = 24 }) {
  if (!team) return <div className="rounded-full bg-fpl-border shrink-0" style={{ width: size, height: size }} />;
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
function PlayerJersey({ team, isGkp, size = 28 }) {
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
function SummaryTab({ entry, entryHistory, picks, playersMap, teamsMap }) {
  const startingXI = picks?.filter((p) => p.position <= 11) || [];
  const bench = picks?.filter((p) => p.position > 11) || [];
  const captain = picks?.find((p) => p.is_captain);
  const captainPlayer = captain ? playersMap?.[captain.element] : null;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Key Info */}
      <div className="bg-fpl-card border border-fpl-border rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Overview</h3>
        <div className="space-y-3">
          {[
            ['Team Value', `\u00A3${((entryHistory?.value || entry.last_deadline_value || 0) / 10).toFixed(1)}m`],
            ['Bank', `\u00A3${((entryHistory?.bank ?? entry.last_deadline_bank ?? 0) / 10).toFixed(1)}m`],
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
      <div className="bg-fpl-card border border-fpl-border rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Formation</h3>
        {playersMap && picks && (
          <FormationView picks={startingXI} playersMap={playersMap} teamsMap={teamsMap} />
        )}
        {bench.length > 0 && playersMap && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1 bg-fpl-border" />
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">Bench</span>
              <div className="h-px flex-1 bg-fpl-border" />
            </div>
            <div className="flex gap-4 flex-wrap justify-center">
              {bench.map((p) => {
                const player = playersMap[p.element];
                const team = teamsMap?.[player?.team];
                const isGkp = player?.element_type === 1;
                const pts = player?.event_points ?? 0;
                return (
                  <div key={p.element} className="text-center opacity-60">
                    <PlayerJersey team={team} isGkp={isGkp} size={24} />
                    <p className="text-[11px] text-gray-400 mt-0.5">{player?.web_name}</p>
                    <p className="text-xs text-white font-medium">{pts}</p>
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

/* ─── Formation: pitch-style layout with jerseys ─── */
function FormationView({ picks, playersMap, teamsMap }) {
  const rows = { GKP: [], DEF: [], MID: [], FWD: [] };
  picks.forEach((p) => {
    const player = playersMap[p.element];
    if (!player) return;
    const pos = posLabels[player.element_type];
    if (rows[pos]) rows[pos].push({ ...player, multiplier: p.multiplier, is_captain: p.is_captain, is_vice_captain: p.is_vice_captain });
  });

  return (
    <div className="relative bg-gradient-to-b from-green-900/20 via-green-800/10 to-green-900/20 rounded-xl p-4 space-y-5 border border-green-900/30">
      {/* Pitch lines */}
      <div className="absolute inset-x-6 top-1/2 h-px bg-white/5" />
      <div className="absolute inset-x-[30%] top-[15%] bottom-[15%] border border-white/5 rounded-lg" />

      {['FWD', 'MID', 'DEF', 'GKP'].map((pos) => (
        <div key={pos} className="relative flex justify-center gap-3 sm:gap-5 flex-wrap">
          {rows[pos].map((player) => {
            const team = teamsMap?.[player.team];
            const isGkp = player.element_type === 1;
            const pts = player.event_points != null ? player.event_points * player.multiplier : 0;
            const ptsColor = pts >= 10 ? 'text-fpl-green' : pts >= 5 ? 'text-fpl-accent' : pts > 0 ? 'text-white' : 'text-gray-400';
            const ptsBg = pts >= 10 ? 'bg-fpl-green/20' : pts >= 5 ? 'bg-fpl-accent/20' : pts > 0 ? 'bg-white/10' : 'bg-fpl-card';

            return (
              <div key={player.id} className="text-center w-[68px] group">
                {/* Jersey */}
                <div className="relative mx-auto w-10 h-12 flex items-center justify-center">
                  <PlayerJersey team={team} isGkp={isGkp} size={36} />
                  {/* Captain / VC badge */}
                  {player.is_captain && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-fpl-accent text-fpl-dark text-[9px] font-black flex items-center justify-center shadow-lg">C</span>
                  )}
                  {player.is_vice_captain && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gray-600 text-white text-[9px] font-black flex items-center justify-center">V</span>
                  )}
                </div>
                {/* Points pill */}
                <div className={`mx-auto mt-1 w-8 h-5 rounded-md flex items-center justify-center text-[11px] font-bold ${ptsBg} ${ptsColor}`}>
                  {pts}
                </div>
                {/* Name */}
                <p className="text-[10px] text-white font-medium mt-0.5 truncate leading-tight">{player.web_name}</p>
                <p className="text-[9px] text-gray-500">{team?.short_name}</p>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/* ──────── SQUAD TAB ──────── */
function SquadTab({ picks, playersMap, teamsMap, eventId }) {
  if (!picks || !playersMap) return <p className="text-gray-500">No squad data available.</p>;
  return (
    <div className="bg-fpl-card border border-fpl-border rounded-xl overflow-hidden">
      <h3 className="text-lg font-semibold text-white px-4 py-3 border-b border-fpl-border">
        GW {eventId} Squad
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 text-left border-b border-fpl-border text-xs uppercase tracking-wider">
              <th className="px-4 py-2.5">#</th>
              <th className="px-4 py-2.5">Player</th>
              <th className="px-4 py-2.5">Pos</th>
              <th className="px-4 py-2.5">Team</th>
              <th className="px-4 py-2.5 text-right">Price</th>
              <th className="px-4 py-2.5 text-right">Owned%</th>
              <th className="px-4 py-2.5 text-right">Pts</th>
            </tr>
          </thead>
          <tbody>
            {picks.map((pick) => {
              const player = playersMap[pick.element];
              const team = teamsMap?.[player?.team];
              const isBench = pick.position > 11;
              const isGkp = player?.element_type === 1;
              const pts = player?.event_points != null ? player.event_points * pick.multiplier : 0;
              return (
                <tr key={pick.element} className={`border-b border-fpl-border/50 transition-colors hover:bg-white/[0.02] ${isBench ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-2.5 text-gray-500">{pick.position}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <PlayerJersey team={team} isGkp={isGkp} size={22} />
                      <span className="text-white font-medium">{player?.web_name || '?'}</span>
                      {pick.is_captain && (
                        <span className="text-[10px] bg-fpl-accent/20 text-fpl-accent px-1.5 py-0.5 rounded font-bold">C</span>
                      )}
                      {pick.is_vice_captain && (
                        <span className="text-[10px] bg-gray-600/40 text-gray-300 px-1.5 py-0.5 rounded font-bold">V</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-gray-400">{posLabels[player?.element_type] || '-'}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <TeamBadge team={team} size={18} />
                      <span className="text-gray-400">{team?.short_name || '-'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right text-gray-300">{player ? `\u00A3${(player.now_cost / 10).toFixed(1)}` : '-'}</td>
                  <td className="px-4 py-2.5 text-right text-gray-300">{player?.selected_by_percent ?? '-'}%</td>
                  <td className="px-4 py-2.5 text-right">
                    <span className={`font-semibold ${pts >= 10 ? 'text-fpl-green' : pts >= 5 ? 'text-fpl-accent' : pts > 0 ? 'text-white' : 'text-gray-400'}`}>
                      {pts}
                    </span>
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
  const captainTeam = captainPlayer ? teamsMap?.[captainPlayer.team] : null;
  const viceTeam = vicePlayer ? teamsMap?.[vicePlayer.team] : null;

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
        <div className="bg-fpl-card border border-fpl-accent/30 rounded-xl p-5">
          <p className="text-xs text-fpl-accent uppercase tracking-wide mb-4">Your Captain</p>
          {captainPlayer ? (
            <div className="flex items-start gap-4">
              <div className="relative shrink-0">
                <PlayerJersey team={captainTeam} isGkp={captainPlayer.element_type === 1} size={52} />
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-fpl-accent text-fpl-dark text-[10px] font-black flex items-center justify-center shadow-lg">C</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <TeamBadge team={captainTeam} size={20} />
                  <p className="text-xl font-bold text-white truncate">{captainPlayer.web_name}</p>
                </div>
                <p className="text-sm text-gray-400">{captainTeam?.name}</p>
                <div className="mt-3 flex gap-6">
                  <div>
                    <p className="text-2xl font-bold text-fpl-accent">{(captainPlayer.event_points || 0) * 2}</p>
                    <p className="text-[10px] text-gray-500 uppercase">GW Points (2x)</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{captainPlayer.total_points}</p>
                    <p className="text-[10px] text-gray-500 uppercase">Season Total</p>
                  </div>
                </div>
              </div>
            </div>
          ) : <p className="text-gray-500">-</p>}
        </div>

        {/* Vice Captain */}
        <div className="bg-fpl-card border border-fpl-border rounded-xl p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-4">Vice Captain</p>
          {vicePlayer ? (
            <div className="flex items-start gap-4">
              <div className="relative shrink-0">
                <PlayerJersey team={viceTeam} isGkp={vicePlayer.element_type === 1} size={52} />
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gray-600 text-white text-[10px] font-black flex items-center justify-center">V</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <TeamBadge team={viceTeam} size={20} />
                  <p className="text-xl font-bold text-white truncate">{vicePlayer.web_name}</p>
                </div>
                <p className="text-sm text-gray-400">{viceTeam?.name}</p>
                <div className="mt-3">
                  <p className="text-2xl font-bold text-white">{vicePlayer.event_points ?? '-'}</p>
                  <p className="text-[10px] text-gray-500 uppercase">GW Points</p>
                </div>
              </div>
            </div>
          ) : <p className="text-gray-500">-</p>}
        </div>
      </div>

      {/* Popular Captains */}
      <div className="bg-fpl-card border border-fpl-border rounded-xl overflow-hidden">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide px-4 py-3 border-b border-fpl-border">
          Most Popular Picks (by ownership)
        </h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 border-b border-fpl-border text-xs uppercase tracking-wider">
              <th className="px-4 py-2.5 text-left">Player</th>
              <th className="px-4 py-2.5 text-left">Team</th>
              <th className="px-4 py-2.5 text-right">Owned%</th>
              <th className="px-4 py-2.5 text-right">GW Pts</th>
              <th className="px-4 py-2.5 text-right">Total Pts</th>
            </tr>
          </thead>
          <tbody>
            {topCaptainPicks.map((p) => {
              const team = teamsMap?.[p.team];
              return (
                <tr key={p.id} className="border-b border-fpl-border/30 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <PlayerJersey team={team} isGkp={p.element_type === 1} size={22} />
                      <span className="text-white font-medium">{p.web_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <TeamBadge team={team} size={18} />
                      <span className="text-gray-400">{team?.short_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right text-fpl-accent font-medium">{p.selected_by_percent}%</td>
                  <td className="px-4 py-2.5 text-right text-white font-medium">{p.event_points ?? '-'}</td>
                  <td className="px-4 py-2.5 text-right text-gray-300">{p.total_points}</td>
                </tr>
              );
            })}
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
      {/* Match cards with team logos */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {liveFixtures.map((f) => {
          const home = teamsMap?.[f.team_h];
          const away = teamsMap?.[f.team_a];
          const isLive = f.started && !f.finished;
          return (
            <div key={f.id} className={`bg-fpl-card border rounded-xl p-4 ${isLive ? 'border-fpl-green/50 shadow-lg shadow-fpl-green/5' : 'border-fpl-border'}`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <TeamBadge team={home} size={28} />
                  <span className="text-white text-sm font-semibold truncate">{home?.short_name}</span>
                </div>
                <div className="text-center px-3">
                  <span className="text-white font-bold text-lg">{f.team_h_score ?? 0} - {f.team_a_score ?? 0}</span>
                  {isLive && <p className="text-[10px] text-fpl-green font-semibold animate-pulse">{f.minutes}'</p>}
                  {f.finished && <p className="text-[10px] text-gray-500">FT</p>}
                  {!f.started && <p className="text-[10px] text-gray-500">-</p>}
                </div>
                <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                  <span className="text-white text-sm font-semibold truncate">{away?.short_name}</span>
                  <TeamBadge team={away} size={28} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Your Players with jerseys */}
      <div className="bg-fpl-card border border-fpl-border rounded-xl overflow-hidden">
        <h3 className="text-sm font-semibold text-gray-400 uppercase px-4 py-3 border-b border-fpl-border">Your Players — Live Status</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 border-b border-fpl-border text-xs uppercase tracking-wider">
              <th className="px-4 py-2.5 text-left">Player</th>
              <th className="px-4 py-2.5 text-left">Match</th>
              <th className="px-4 py-2.5 text-center">Status</th>
              <th className="px-4 py-2.5 text-right">Pts</th>
            </tr>
          </thead>
          <tbody>
            {myPlayers.filter((p) => p.position <= 11).map((p) => {
              const team = teamsMap?.[p.player?.team];
              const isGkp = p.player?.element_type === 1;
              const pts = p.player?.event_points != null ? p.player.event_points * p.multiplier : 0;
              const fixture = p.fixture;
              const homeTeam = fixture ? teamsMap?.[fixture.team_h] : null;
              const awayTeam = fixture ? teamsMap?.[fixture.team_a] : null;

              return (
                <tr key={p.element} className="border-b border-fpl-border/30 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <PlayerJersey team={team} isGkp={isGkp} size={22} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-white font-medium truncate">{p.player?.web_name}</span>
                          {p.is_captain && <span className="text-[9px] bg-fpl-accent/20 text-fpl-accent px-1 rounded font-bold">C</span>}
                        </div>
                        <p className="text-[10px] text-gray-500">{posLabels[p.player?.element_type]}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    {fixture ? (
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <TeamBadge team={homeTeam} size={16} />
                        <span>{homeTeam?.short_name}</span>
                        <span className="text-white font-medium">{fixture.team_h_score ?? 0}-{fixture.team_a_score ?? 0}</span>
                        <span>{awayTeam?.short_name}</span>
                        <TeamBadge team={awayTeam} size={16} />
                      </div>
                    ) : (
                      <span className="text-gray-500 text-xs">-</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {p.isPlaying && <span className="text-[10px] bg-fpl-green/20 text-fpl-green px-2 py-0.5 rounded-full font-medium">Playing</span>}
                    {p.hasPlayed && <span className="text-[10px] bg-gray-600/30 text-gray-400 px-2 py-0.5 rounded-full">Finished</span>}
                    {!p.isPlaying && !p.hasPlayed && <span className="text-[10px] bg-fpl-yellow/20 text-fpl-yellow px-2 py-0.5 rounded-full">Upcoming</span>}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span className={`font-bold ${pts >= 10 ? 'text-fpl-green' : pts >= 5 ? 'text-fpl-accent' : pts > 0 ? 'text-white' : 'text-gray-400'}`}>
                      {pts}
                    </span>
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
      if (p.is_captain) return sum + pts;
      return sum + pts * p.multiplier;
    }, 0);
  }, [altCaptain, picks, playersMap, startingPicks]);

  const diff = altPoints != null ? altPoints - currentPoints : null;
  const altPlayer = altCaptain ? playersMap?.[altCaptain] : null;
  const altTeam = altPlayer ? teamsMap?.[altPlayer.team] : null;
  const currentCaptainPlayer = currentCaptain ? playersMap?.[currentCaptain.element] : null;
  const currentCaptainTeam = currentCaptainPlayer ? teamsMap?.[currentCaptainPlayer.team] : null;

  return (
    <div className="space-y-4">
      <div className="bg-fpl-card border border-fpl-border rounded-xl p-5">
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
          <div className="mt-5 grid grid-cols-3 gap-4">
            <div className="bg-fpl-dark/50 rounded-xl p-4 text-center">
              <div className="flex justify-center gap-2 items-center mb-2">
                <PlayerJersey team={currentCaptainTeam} isGkp={currentCaptainPlayer?.element_type === 1} size={28} />
                <TeamBadge team={currentCaptainTeam} size={18} />
              </div>
              <p className="text-xs text-gray-500 mb-1">Current</p>
              <p className="text-xl font-bold text-white">{currentPoints}</p>
              <p className="text-xs text-gray-400 mt-0.5">{currentCaptainPlayer?.web_name} (C)</p>
            </div>
            <div className="bg-fpl-dark/50 rounded-xl p-4 text-center">
              <div className="flex justify-center gap-2 items-center mb-2">
                <PlayerJersey team={altTeam} isGkp={altPlayer?.element_type === 1} size={28} />
                <TeamBadge team={altTeam} size={18} />
              </div>
              <p className="text-xs text-gray-500 mb-1">Alternative</p>
              <p className="text-xl font-bold text-white">{altPoints}</p>
              <p className="text-xs text-gray-400 mt-0.5">{altPlayer?.web_name} (C)</p>
            </div>
            <div className="bg-fpl-dark/50 rounded-xl p-4 text-center flex flex-col justify-center">
              <p className="text-xs text-gray-500 mb-1">Difference</p>
              <p className={`text-2xl font-bold ${diff > 0 ? 'text-fpl-green' : diff < 0 ? 'text-fpl-red' : 'text-gray-400'}`}>
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
  const gains = useMemo(() => {
    if (!players || !picks) return [];
    const myIds = new Set(picks.map((p) => p.element));
    return [...players]
      .filter((p) => !myIds.has(p.id) && p.event_points > 0)
      .sort((a, b) => b.event_points - a.event_points)
      .slice(0, 20);
  }, [players, picks]);

  return (
    <div className="bg-fpl-card border border-fpl-border rounded-xl overflow-hidden">
      <h3 className="text-sm font-semibold text-gray-400 uppercase px-4 py-3 border-b border-fpl-border">
        Top Performers You Don't Own
      </h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-400 border-b border-fpl-border text-xs uppercase tracking-wider">
            <th className="px-4 py-2.5 text-left">Player</th>
            <th className="px-4 py-2.5 text-left">Team</th>
            <th className="px-4 py-2.5 text-right">Owned%</th>
            <th className="px-4 py-2.5 text-right">GW Pts</th>
          </tr>
        </thead>
        <tbody>
          {gains.map((p) => {
            const team = teamsMap?.[p.team];
            return (
              <tr key={p.id} className="border-b border-fpl-border/30 hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <PlayerJersey team={team} isGkp={p.element_type === 1} size={22} />
                    <div className="min-w-0">
                      <span className="text-white font-medium">{p.web_name}</span>
                      <p className="text-[10px] text-gray-500">{posLabels[p.element_type]}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <TeamBadge team={team} size={18} />
                    <span className="text-gray-400">{team?.short_name}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-right text-gray-300">{p.selected_by_percent}%</td>
                <td className="px-4 py-2.5 text-right">
                  <span className="text-fpl-green font-bold">{p.event_points}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ──────── THREATS TAB ──────── */
function ThreatsTab({ picks, playersMap, teamsMap, players }) {
  const threats = useMemo(() => {
    if (!players || !picks) return [];
    const myIds = new Set(picks.map((p) => p.element));
    return [...players]
      .filter((p) => !myIds.has(p.id) && parseFloat(p.selected_by_percent) > 15 && p.event_points > 0)
      .sort((a, b) => b.event_points - a.event_points)
      .slice(0, 15);
  }, [players, picks]);

  return (
    <div className="bg-fpl-card border border-fpl-border rounded-xl overflow-hidden">
      <h3 className="text-sm font-semibold text-gray-400 uppercase px-4 py-3 border-b border-fpl-border">
        Rank Threats — Highly Owned Players You Don't Have
      </h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-400 border-b border-fpl-border text-xs uppercase tracking-wider">
            <th className="px-4 py-2.5 text-left">Player</th>
            <th className="px-4 py-2.5 text-left">Team</th>
            <th className="px-4 py-2.5 text-right">Owned%</th>
            <th className="px-4 py-2.5 text-right">GW Pts</th>
            <th className="px-4 py-2.5 text-right">Rank Impact</th>
          </tr>
        </thead>
        <tbody>
          {threats.map((p) => {
            const team = teamsMap?.[p.team];
            const impact = Math.round(parseFloat(p.selected_by_percent) * p.event_points / 10);
            return (
              <tr key={p.id} className="border-b border-fpl-border/30 hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <PlayerJersey team={team} isGkp={p.element_type === 1} size={22} />
                    <div className="min-w-0">
                      <span className="text-white font-medium">{p.web_name}</span>
                      <p className="text-[10px] text-gray-500">{posLabels[p.element_type]}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <TeamBadge team={team} size={18} />
                    <span className="text-gray-400">{team?.short_name}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-right text-fpl-yellow font-medium">{p.selected_by_percent}%</td>
                <td className="px-4 py-2.5 text-right text-white font-medium">{p.event_points}</td>
                <td className="px-4 py-2.5 text-right">
                  <span className="text-fpl-red font-bold bg-fpl-red/10 px-2 py-0.5 rounded-full text-xs">-{impact}</span>
                </td>
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

      <div className="bg-fpl-card border border-fpl-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Transfer Budget</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Team Value</span>
            <span className="text-white">{'\u00A3'}{((entryHistory?.value || entry.last_deadline_value || 0) / 10).toFixed(1)}m</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">In the Bank</span>
            <span className="text-fpl-green">{'\u00A3'}{((entryHistory?.bank ?? entry.last_deadline_bank ?? 0) / 10).toFixed(1)}m</span>
          </div>
          <div className="border-t border-fpl-border pt-2 flex justify-between text-sm font-medium">
            <span className="text-gray-300">Selling Value</span>
            <span className="text-white">
              {'\u00A3'}{(((entryHistory?.value || entry.last_deadline_value || 0) + (entryHistory?.bank ?? entry.last_deadline_bank ?? 0)) / 10).toFixed(1)}m
            </span>
          </div>
        </div>
      </div>

      <div className="bg-fpl-card border border-fpl-border rounded-xl p-5">
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
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-fpl-card border border-fpl-accent/30 rounded-xl p-4 text-center">
              <p className="text-xs text-fpl-accent uppercase mb-1">You</p>
              <p className="text-lg font-bold text-white">{entry.name}</p>
              <p className="text-2xl font-bold text-fpl-accent mt-2">{entryHistory?.points ?? entry.summary_event_points ?? '-'}</p>
              <p className="text-xs text-gray-400">GW Points</p>
            </div>
            <div className="bg-fpl-card border border-fpl-border rounded-xl p-4 text-center">
              <p className="text-xs text-gray-400 uppercase mb-1">Rival</p>
              <p className="text-lg font-bold text-white">{rivalEntry.name}</p>
              <p className="text-2xl font-bold text-white mt-2">{rivalHistory?.points ?? rivalEntry.summary_event_points ?? '-'}</p>
              <p className="text-xs text-gray-400">GW Points</p>
            </div>
          </div>

          {rivalPicks && playersMap && (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="bg-fpl-card border border-fpl-border rounded-xl overflow-hidden">
                <h3 className="text-sm font-semibold text-fpl-accent uppercase px-4 py-3 border-b border-fpl-border">
                  Only You Own
                </h3>
                <div className="divide-y divide-fpl-border/30">
                  {myPicks?.filter((p) => p.position <= 11 && !rivalPickIds.has(p.element)).map((p) => {
                    const player = playersMap[p.element];
                    const team = teamsMap?.[player?.team];
                    const pts = player?.event_points != null ? player.event_points * p.multiplier : 0;
                    return (
                      <div key={p.element} className="flex items-center justify-between px-4 py-2.5 hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-center gap-2.5">
                          <PlayerJersey team={team} isGkp={player?.element_type === 1} size={22} />
                          <span className="text-white text-sm font-medium">{player?.web_name}</span>
                          <TeamBadge team={team} size={16} />
                          <span className="text-[10px] text-gray-500">{team?.short_name}</span>
                        </div>
                        <span className={`text-sm font-bold ${pts > 0 ? 'text-fpl-green' : 'text-gray-400'}`}>{pts}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="bg-fpl-card border border-fpl-border rounded-xl overflow-hidden">
                <h3 className="text-sm font-semibold text-fpl-red uppercase px-4 py-3 border-b border-fpl-border">
                  Only Rival Owns
                </h3>
                <div className="divide-y divide-fpl-border/30">
                  {rivalPicks?.filter((p) => p.position <= 11 && !myPickIds.has(p.element)).map((p) => {
                    const player = playersMap[p.element];
                    const team = teamsMap?.[player?.team];
                    const pts = player?.event_points != null ? player.event_points * p.multiplier : 0;
                    return (
                      <div key={p.element} className="flex items-center justify-between px-4 py-2.5 hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-center gap-2.5">
                          <PlayerJersey team={team} isGkp={player?.element_type === 1} size={22} />
                          <span className="text-white text-sm font-medium">{player?.web_name}</span>
                          <TeamBadge team={team} size={16} />
                          <span className="text-[10px] text-gray-500">{team?.short_name}</span>
                        </div>
                        <span className={`text-sm font-bold ${pts > 0 ? 'text-fpl-red' : 'text-gray-400'}`}>{pts}</span>
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