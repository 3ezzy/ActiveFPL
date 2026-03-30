import { useState, useMemo } from 'react';
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
        <h1 className="text-2xl font-bold text-white mb-2">Transfer Planner</h1>
        <p className="text-gray-500">Enter your Team ID on the home page to plan transfers.</p>
      </div>
    );
  }
  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white">Transfer Planner</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">GWs ahead:</span>
          {[3, 5, 8].map((n) => (
            <button key={n} onClick={() => setPlanGws(n)} className={`px-3 py-1 text-sm rounded ${planGws === n ? 'bg-fpl-accent text-fpl-dark' : 'bg-fpl-card border border-fpl-border text-gray-300'}`}>{n}</button>
          ))}
        </div>
      </div>
      <div className="bg-fpl-card border border-fpl-border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-fpl-border">
              <th className="px-4 py-2 text-left text-gray-400 sticky left-0 bg-fpl-card z-10">Player</th>
              <th className="px-3 py-2 text-center text-gray-400">Pos</th>
              <th className="px-3 py-2 text-right text-gray-400">Price</th>
              {gwRange.map((gw) => (<th key={gw} className="px-3 py-2 text-center text-gray-400">GW{gw}</th>))}
            </tr>
          </thead>
          <tbody>
            {squadFixtures.map(({ pick, player, upcoming }) => {
              if (!player) return null;
              return (
                <tr key={pick.element} className={`border-b border-fpl-border/30 ${pick.position > 11 ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-2 text-white font-medium sticky left-0 bg-fpl-card z-10">{player.web_name}{pick.is_captain && <span className="ml-1 text-xs text-fpl-accent">(C)</span>}</td>
                  <td className="px-3 py-2 text-center text-gray-400">{posLabels[player.element_type]}</td>
                  <td className="px-3 py-2 text-right text-gray-300">£{(player.now_cost / 10).toFixed(1)}</td>
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