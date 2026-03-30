import { useState, useEffect, useMemo } from 'react';
import useBootstrap from '../hooks/useBootstrap';
import useEntry from '../hooks/useEntry';
import usePicks from '../hooks/usePicks';
import { useTeam } from '../context/TeamContext';
import Spinner from '../components/common/Spinner';
import ErrorBanner from '../components/common/ErrorBanner';
import StatCard from '../components/common/StatCard';
import {
  HiArrowTrendingUp,
  HiArrowTrendingDown,
  HiClock,
  HiMagnifyingGlass,
  HiStar,
  HiUsers,
  HiEye,
} from 'react-icons/hi2';

const posLabels = { 1: 'GKP', 2: 'DEF', 3: 'MID', 4: 'FWD' };
const fmt = (n) => new Intl.NumberFormat().format(n);

/* ─── Countdown Hook ─── */
function useCountdown() {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calc = () => {
      const now = new Date();
      const target = new Date(now);
      // Price changes happen ~01:30 GMT daily
      target.setUTCHours(1, 30, 0, 0);
      if (now >= target) target.setUTCDate(target.getUTCDate() + 1);
      const diff = target - now;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, []);

  return timeLeft;
}

/* ─── Watchlist helpers ─── */
function getWatchlist() {
  try { return JSON.parse(localStorage.getItem('fpl_watchlist') || '[]'); } catch { return []; }
}
function saveWatchlist(ids) {
  localStorage.setItem('fpl_watchlist', JSON.stringify(ids));
}

export default function PricesPage() {
  const { teamId } = useTeam();
  const { players, teamsMap, elementTypes, currentEvent, loading, error } = useBootstrap();
  const { entry } = useEntry(teamId);
  const eventId = entry?.current_event || currentEvent?.id;
  const { picks } = usePicks(teamId, eventId);
  const countdown = useCountdown();

  const [tab, setTab] = useState('all'); // 'all' | 'myteam' | 'watchlist'
  const [view, setView] = useState('risers'); // 'risers' | 'fallers' | 'all'
  const [position, setPosition] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('net_transfers');
  const [watchlist, setWatchlist] = useState(getWatchlist);

  const toggleWatch = (id) => {
    setWatchlist((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      saveWatchlist(next);
      return next;
    });
  };

  /* ─── Summary stats ─── */
  const summary = useMemo(() => {
    if (!players) return null;
    const risers = players.filter((p) => p.cost_change_event > 0);
    const fallers = players.filter((p) => p.cost_change_event < 0);
    const mostIn = [...players].sort((a, b) => b.transfers_in_event - a.transfers_in_event)[0];
    const mostOut = [...players].sort((a, b) => b.transfers_out_event - a.transfers_out_event)[0];
    return { risers: risers.length, fallers: fallers.length, mostIn, mostOut };
  }, [players]);

  /* ─── Accuracy metrics ─── */
  const accuracy = useMemo(() => {
    if (!players) return null;
    let correct = 0, total = 0;
    players.forEach((p) => {
      const net = p.transfers_in_event - p.transfers_out_event;
      if (p.cost_change_event !== 0) {
        total++;
        if ((net > 0 && p.cost_change_event > 0) || (net < 0 && p.cost_change_event < 0)) correct++;
      }
    });
    return { correct, total, pct: total > 0 ? Math.round((correct / total) * 100) : 0 };
  }, [players]);

  /* ─── Filtered + sorted list ─── */
  const myTeamIds = useMemo(() => new Set(picks?.map((p) => p.element) || []), [picks]);

  const filtered = useMemo(() => {
    if (!players) return [];
    let list = [...players];

    // Tab filter
    if (tab === 'myteam') list = list.filter((p) => myTeamIds.has(p.id));
    if (tab === 'watchlist') list = list.filter((p) => watchlist.includes(p.id));

    // Position filter
    if (position !== 'all') list = list.filter((p) => p.element_type === Number(position));

    // Search
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.web_name.toLowerCase().includes(q));
    }

    // View filter
    if (view === 'risers') list = list.filter((p) => p.cost_change_event > 0);
    if (view === 'fallers') list = list.filter((p) => p.cost_change_event < 0);

    // Sort
    const sorters = {
      net_transfers: (a, b) => Math.abs(b.transfers_in_event - b.transfers_out_event) - Math.abs(a.transfers_in_event - a.transfers_out_event),
      gw_change: (a, b) => Math.abs(b.cost_change_event) - Math.abs(a.cost_change_event),
      season_change: (a, b) => Math.abs(b.cost_change_start) - Math.abs(a.cost_change_start),
      price: (a, b) => b.now_cost - a.now_cost,
      transfers_in: (a, b) => b.transfers_in_event - a.transfers_in_event,
      transfers_out: (a, b) => b.transfers_out_event - a.transfers_out_event,
    };
    list.sort(sorters[sortBy] || sorters.net_transfers);

    return list.slice(0, 100);
  }, [players, tab, view, position, search, sortBy, myTeamIds, watchlist]);

  /* ─── Top movers ─── */
  const topRisers = useMemo(() => {
    if (!players) return [];
    return [...players].sort((a, b) => b.cost_change_start - a.cost_change_start).slice(0, 5);
  }, [players]);

  const topFallers = useMemo(() => {
    if (!players) return [];
    return [...players].sort((a, b) => a.cost_change_start - b.cost_change_start).slice(0, 5);
  }, [players]);

  if (loading) return <Spinner />;
  if (error) return <ErrorBanner message={error} />;

  return (
    <div className="space-y-6">
      {/* Header + Countdown */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Price Changes</h1>
          <p className="text-sm text-gray-400 mt-1">Track FPL player price movements, transfer trends, and predictions.</p>
        </div>
        <div className="bg-fpl-card border border-fpl-accent/30 rounded-xl px-5 py-3 text-center shrink-0">
          <div className="flex items-center gap-2 text-fpl-accent mb-1">
            <HiClock className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">Next Price Change</span>
          </div>
          <p className="text-3xl font-bold text-white tabular-nums tracking-wider">{countdown}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">~01:30 GMT Daily</p>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-fpl-card border border-fpl-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <HiArrowTrendingUp className="w-4 h-4 text-fpl-green" />
              <span className="text-xs text-gray-400 uppercase">GW Risers</span>
            </div>
            <p className="text-2xl font-bold text-fpl-green">{summary.risers}</p>
          </div>
          <div className="bg-fpl-card border border-fpl-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <HiArrowTrendingDown className="w-4 h-4 text-fpl-red" />
              <span className="text-xs text-gray-400 uppercase">GW Fallers</span>
            </div>
            <p className="text-2xl font-bold text-fpl-red">{summary.fallers}</p>
          </div>
          <div className="bg-fpl-card border border-fpl-border rounded-lg p-4">
            <p className="text-xs text-gray-400 uppercase mb-1">Most Transferred In</p>
            <p className="text-sm font-bold text-white">{summary.mostIn?.web_name}</p>
            <p className="text-xs text-fpl-green">{fmt(summary.mostIn?.transfers_in_event || 0)}</p>
          </div>
          <div className="bg-fpl-card border border-fpl-border rounded-lg p-4">
            <p className="text-xs text-gray-400 uppercase mb-1">Most Transferred Out</p>
            <p className="text-sm font-bold text-white">{summary.mostOut?.web_name}</p>
            <p className="text-xs text-fpl-red">{fmt(summary.mostOut?.transfers_out_event || 0)}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-fpl-border pb-1 overflow-x-auto">
        {[
          { key: 'all', label: 'All Players', icon: HiUsers },
          { key: 'myteam', label: 'My Team', icon: HiStar },
          { key: 'watchlist', label: 'Watchlist', icon: HiEye },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
              tab === t.key
                ? 'text-fpl-accent border-b-2 border-fpl-accent -mb-[3px]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
            {t.key === 'watchlist' && watchlist.length > 0 && (
              <span className="bg-fpl-accent/20 text-fpl-accent text-xs px-1.5 py-0.5 rounded-full">{watchlist.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search player..."
            className="w-full bg-fpl-dark border border-fpl-border rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-fpl-accent"
          />
        </div>

        {/* View buttons */}
        <div className="flex gap-1">
          {[
            { key: 'all', label: 'All' },
            { key: 'risers', label: 'Risers' },
            { key: 'fallers', label: 'Fallers' },
          ].map((v) => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                view === v.key ? 'bg-fpl-accent text-fpl-dark font-semibold' : 'bg-fpl-card border border-fpl-border text-gray-300 hover:text-white'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        <select
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          className="bg-fpl-dark border border-fpl-border rounded-lg px-3 py-2 text-sm text-white"
        >
          <option value="all">All Positions</option>
          {elementTypes?.map((et) => (
            <option key={et.id} value={et.id}>{et.singular_name}</option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-fpl-dark border border-fpl-border rounded-lg px-3 py-2 text-sm text-white"
        >
          <option value="net_transfers">Net Transfers</option>
          <option value="gw_change">GW Change</option>
          <option value="season_change">Season Change</option>
          <option value="price">Price</option>
          <option value="transfers_in">Transfers In</option>
          <option value="transfers_out">Transfers Out</option>
        </select>
      </div>

      {/* Main Table */}
      <div className="bg-fpl-card border border-fpl-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-left border-b border-fpl-border">
                <th className="px-3 py-2 w-8"></th>
                <th className="px-3 py-2">Player</th>
                <th className="px-3 py-2">Team</th>
                <th className="px-3 py-2">Pos</th>
                <th className="px-3 py-2 text-right">Price</th>
                <th className="px-3 py-2 text-right">Start</th>
                <th className="px-3 py-2 text-right">GW</th>
                <th className="px-3 py-2 text-right">Season</th>
                <th className="px-3 py-2 text-right">Net Transfers</th>
                <th className="px-3 py-2 text-right">Target</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const net = p.transfers_in_event - p.transfers_out_event;
                const isWatched = watchlist.includes(p.id);
                // Target % — net transfers as % of total ownership (approximation)
                const totalOwners = (parseFloat(p.selected_by_percent) / 100) * 11000000; // ~11M players
                const targetPct = totalOwners > 0 ? ((Math.abs(net) / totalOwners) * 100).toFixed(1) : '0.0';

                return (
                  <tr key={p.id} className="border-b border-fpl-border/50 hover:bg-white/5 transition-colors">
                    <td className="px-3 py-2">
                      <button
                        onClick={() => toggleWatch(p.id)}
                        className={`transition-colors ${isWatched ? 'text-fpl-yellow' : 'text-gray-600 hover:text-gray-400'}`}
                        title={isWatched ? 'Remove from watchlist' : 'Add to watchlist'}
                      >
                        <HiEye className="w-4 h-4" />
                      </button>
                    </td>
                    <td className="px-3 py-2 text-white font-medium">{p.web_name}</td>
                    <td className="px-3 py-2 text-gray-400">{teamsMap?.[p.team]?.short_name}</td>
                    <td className="px-3 py-2 text-gray-400">{posLabels[p.element_type]}</td>
                    <td className="px-3 py-2 text-right text-white font-medium">£{(p.now_cost / 10).toFixed(1)}</td>
                    <td className="px-3 py-2 text-right text-gray-500">£{((p.now_cost - p.cost_change_start) / 10).toFixed(1)}</td>
                    <td className={`px-3 py-2 text-right font-medium ${p.cost_change_event > 0 ? 'text-fpl-green' : p.cost_change_event < 0 ? 'text-fpl-red' : 'text-gray-600'}`}>
                      {p.cost_change_event > 0 ? '+' : ''}{(p.cost_change_event / 10).toFixed(1)}
                    </td>
                    <td className={`px-3 py-2 text-right font-medium ${p.cost_change_start > 0 ? 'text-fpl-green' : p.cost_change_start < 0 ? 'text-fpl-red' : 'text-gray-600'}`}>
                      {p.cost_change_start > 0 ? '+' : ''}{(p.cost_change_start / 10).toFixed(1)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <span className={`font-medium ${net > 0 ? 'text-fpl-green' : net < 0 ? 'text-fpl-red' : 'text-gray-600'}`}>
                        {net > 0 ? '+' : ''}{fmt(net)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 bg-fpl-dark rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${net > 0 ? 'bg-fpl-green' : 'bg-fpl-red'}`}
                            style={{ width: `${Math.min(parseFloat(targetPct) * 10, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-10 text-right">{targetPct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-gray-500">
                    {tab === 'myteam' && !teamId ? 'Enter your Team ID on the home page to see your players.' :
                     tab === 'watchlist' && watchlist.length === 0 ? 'Your watchlist is empty. Click the eye icon to add players.' :
                     'No players match your filters.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trends: Top Risers & Fallers */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="bg-fpl-card border border-fpl-border rounded-lg overflow-hidden">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-fpl-green uppercase px-4 py-3 border-b border-fpl-border">
            <HiArrowTrendingUp className="w-4 h-4" /> Season Top Risers
          </h3>
          <table className="w-full text-sm">
            <tbody>
              {topRisers.map((p) => (
                <tr key={p.id} className="border-b border-fpl-border/30">
                  <td className="px-4 py-2 text-white">{p.web_name}</td>
                  <td className="px-4 py-2 text-gray-400">{teamsMap?.[p.team]?.short_name}</td>
                  <td className="px-4 py-2 text-right text-gray-300">£{(p.now_cost / 10).toFixed(1)}</td>
                  <td className="px-4 py-2 text-right text-fpl-green font-medium">+£{(p.cost_change_start / 10).toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-fpl-card border border-fpl-border rounded-lg overflow-hidden">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-fpl-red uppercase px-4 py-3 border-b border-fpl-border">
            <HiArrowTrendingDown className="w-4 h-4" /> Season Top Fallers
          </h3>
          <table className="w-full text-sm">
            <tbody>
              {topFallers.map((p) => (
                <tr key={p.id} className="border-b border-fpl-border/30">
                  <td className="px-4 py-2 text-white">{p.web_name}</td>
                  <td className="px-4 py-2 text-gray-400">{teamsMap?.[p.team]?.short_name}</td>
                  <td className="px-4 py-2 text-right text-gray-300">£{(p.now_cost / 10).toFixed(1)}</td>
                  <td className="px-4 py-2 text-right text-fpl-red font-medium">-£{(Math.abs(p.cost_change_start) / 10).toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Accuracy Metrics */}
      {accuracy && accuracy.total > 0 && (
        <div className="bg-fpl-card border border-fpl-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Price Change Accuracy (Transfer Pressure vs Actual)</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-fpl-accent">{accuracy.pct}%</p>
              <p className="text-xs text-gray-500 mt-1">Prediction Match</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-fpl-green">{accuracy.correct}</p>
              <p className="text-xs text-gray-500 mt-1">Correct Direction</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">{accuracy.total}</p>
              <p className="text-xs text-gray-500 mt-1">Total Changes</p>
            </div>
          </div>
          <div className="mt-4 w-full h-3 bg-fpl-dark rounded-full overflow-hidden">
            <div className="h-full bg-fpl-accent rounded-full transition-all" style={{ width: `${accuracy.pct}%` }} />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Measures how often the direction of net transfers (in vs out) correctly predicted the actual price change direction this gameweek.
          </p>
        </div>
      )}
    </div>
  );
}
