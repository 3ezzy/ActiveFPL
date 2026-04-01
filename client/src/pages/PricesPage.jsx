import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

  const [tab, setTab] = useState('all');
  const [view, setView] = useState('risers');
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

  const summary = useMemo(() => {
    if (!players) return null;
    const risers = players.filter((p) => p.cost_change_event > 0);
    const fallers = players.filter((p) => p.cost_change_event < 0);
    const mostIn = [...players].sort((a, b) => b.transfers_in_event - a.transfers_in_event)[0];
    const mostOut = [...players].sort((a, b) => b.transfers_out_event - a.transfers_out_event)[0];
    return { risers: risers.length, fallers: fallers.length, mostIn, mostOut };
  }, [players]);

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

  const myTeamIds = useMemo(() => new Set(picks?.map((p) => p.element) || []), [picks]);

  const filtered = useMemo(() => {
    if (!players) return [];
    let list = [...players];
    if (tab === 'myteam') list = list.filter((p) => myTeamIds.has(p.id));
    if (tab === 'watchlist') list = list.filter((p) => watchlist.includes(p.id));
    if (position !== 'all') list = list.filter((p) => p.element_type === Number(position));
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.web_name.toLowerCase().includes(q));
    }
    if (view === 'risers') list = list.filter((p) => p.cost_change_event > 0);
    if (view === 'fallers') list = list.filter((p) => p.cost_change_event < 0);
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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t('prices.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('prices.subtitle')}</p>
        </div>
        <div className="bg-white dark:bg-fpl-card border border-fpl-accent/30 rounded-xl px-5 py-3 text-center shrink-0">
          <div className="flex items-center gap-2 text-fpl-accent mb-1">
            <HiClock className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">{t('prices.nextPriceChange')}</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white tabular-nums tracking-wider">{countdown}</p>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{t('prices.dailyGmt')}</p>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-fpl-card border border-fpl-light-border dark:border-fpl-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <HiArrowTrendingUp className="w-4 h-4 text-fpl-green" />
              <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">{t('prices.gwRisers')}</span>
            </div>
            <p className="text-2xl font-bold text-fpl-green">{summary.risers}</p>
          </div>
          <div className="bg-white dark:bg-fpl-card border border-fpl-light-border dark:border-fpl-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <HiArrowTrendingDown className="w-4 h-4 text-fpl-red" />
              <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">{t('prices.gwFallers')}</span>
            </div>
            <p className="text-2xl font-bold text-fpl-red">{summary.fallers}</p>
          </div>
          <div className="bg-white dark:bg-fpl-card border border-fpl-light-border dark:border-fpl-border rounded-lg p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-1">{t('prices.mostTransferredIn')}</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white">{summary.mostIn?.web_name}</p>
            <p className="text-xs text-fpl-green">{fmt(summary.mostIn?.transfers_in_event || 0)}</p>
          </div>
          <div className="bg-white dark:bg-fpl-card border border-fpl-light-border dark:border-fpl-border rounded-lg p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-1">{t('prices.mostTransferredOut')}</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white">{summary.mostOut?.web_name}</p>
            <p className="text-xs text-fpl-red">{fmt(summary.mostOut?.transfers_out_event || 0)}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-fpl-light-border dark:border-fpl-border pb-1 overflow-x-auto">
        {[
          { key: 'all', labelKey: 'prices.allPlayers', icon: HiUsers },
          { key: 'myteam', labelKey: 'prices.myTeam', icon: HiStar },
          { key: 'watchlist', labelKey: 'prices.watchlist', icon: HiEye },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
              tab === item.key
                ? 'text-fpl-accent border-b-2 border-fpl-accent -mb-[3px]'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <item.icon className="w-4 h-4" />
            {t(item.labelKey)}
            {item.key === 'watchlist' && watchlist.length > 0 && (
              <span className="bg-fpl-accent/20 text-fpl-accent text-xs px-1.5 py-0.5 rounded-full">{watchlist.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('players.searchPlayer')}
            className="w-full bg-gray-50 dark:bg-fpl-dark border border-fpl-light-border dark:border-fpl-border rounded-lg pl-9 pr-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-fpl-accent"
          />
        </div>

        <div className="flex gap-1">
          {[
            { key: 'all', labelKey: 'prices.all' },
            { key: 'risers', labelKey: 'prices.risers' },
            { key: 'fallers', labelKey: 'prices.fallers' },
          ].map((v) => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                view === v.key ? 'bg-fpl-accent text-fpl-dark font-semibold' : 'bg-white dark:bg-fpl-card border border-fpl-light-border dark:border-fpl-border text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {t(v.labelKey)}
            </button>
          ))}
        </div>

        <select
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          className="bg-gray-50 dark:bg-fpl-dark border border-fpl-light-border dark:border-fpl-border rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
        >
          <option value="all">{t('players.allPositions')}</option>
          {elementTypes?.map((et) => (
            <option key={et.id} value={et.id}>{et.singular_name}</option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-gray-50 dark:bg-fpl-dark border border-fpl-light-border dark:border-fpl-border rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
        >
          <option value="net_transfers">{t('prices.netTransfers')}</option>
          <option value="gw_change">{t('prices.gwChange')}</option>
          <option value="season_change">{t('prices.seasonChange')}</option>
          <option value="price">{t('common.price')}</option>
          <option value="transfers_in">{t('prices.transfersIn')}</option>
          <option value="transfers_out">{t('prices.transfersOut')}</option>
        </select>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-fpl-card border border-fpl-light-border dark:border-fpl-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 dark:text-gray-400 text-left border-b border-fpl-light-border dark:border-fpl-border">
                <th className="px-3 py-2 w-8"></th>
                <th className="px-3 py-2">{t('common.player')}</th>
                <th className="px-3 py-2">{t('common.team')}</th>
                <th className="px-3 py-2">{t('common.pos')}</th>
                <th className="px-3 py-2 text-right">{t('common.price')}</th>
                <th className="px-3 py-2 text-right hidden sm:table-cell">{t('prices.start')}</th>
                <th className="px-3 py-2 text-right">{t('common.gw')}</th>
                <th className="px-3 py-2 text-right hidden sm:table-cell">{t('prices.season')}</th>
                <th className="px-3 py-2 text-right">{t('prices.netTransfers')}</th>
                <th className="px-3 py-2 text-right">{t('prices.target')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const net = p.transfers_in_event - p.transfers_out_event;
                const isWatched = watchlist.includes(p.id);
                const totalOwners = (parseFloat(p.selected_by_percent) / 100) * 11000000;
                const targetPct = totalOwners > 0 ? ((Math.abs(net) / totalOwners) * 100).toFixed(1) : '0.0';

                return (
                  <tr key={p.id} className="border-b border-fpl-light-border/30 dark:border-fpl-border/50 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                    <td className="px-3 py-2">
                      <button
                        onClick={() => toggleWatch(p.id)}
                        className={`transition-colors ${isWatched ? 'text-fpl-yellow' : 'text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400'}`}
                        title={isWatched ? t('prices.removeFromWatchlist') : t('prices.addToWatchlist')}
                      >
                        <HiEye className="w-4 h-4" />
                      </button>
                    </td>
                    <td className="px-3 py-2 text-gray-900 dark:text-white font-medium">{p.web_name}</td>
                    <td className="px-3 py-2 text-gray-500 dark:text-gray-400">{teamsMap?.[p.team]?.short_name}</td>
                    <td className="px-3 py-2 text-gray-500 dark:text-gray-400">{posLabels[p.element_type]}</td>
                    <td className="px-3 py-2 text-right text-gray-900 dark:text-white font-medium">£{(p.now_cost / 10).toFixed(1)}</td>
                    <td className="px-3 py-2 text-right text-gray-400 dark:text-gray-500 hidden sm:table-cell">£{((p.now_cost - p.cost_change_start) / 10).toFixed(1)}</td>
                    <td className={`px-3 py-2 text-right font-medium ${p.cost_change_event > 0 ? 'text-fpl-green' : p.cost_change_event < 0 ? 'text-fpl-red' : 'text-gray-600'}`}>
                      {p.cost_change_event > 0 ? '+' : ''}{(p.cost_change_event / 10).toFixed(1)}
                    </td>
                    <td className={`px-3 py-2 text-right font-medium hidden sm:table-cell ${p.cost_change_start > 0 ? 'text-fpl-green' : p.cost_change_start < 0 ? 'text-fpl-red' : 'text-gray-600'}`}>
                      {p.cost_change_start > 0 ? '+' : ''}{(p.cost_change_start / 10).toFixed(1)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <span className={`font-medium ${net > 0 ? 'text-fpl-green' : net < 0 ? 'text-fpl-red' : 'text-gray-600'}`}>
                        {net > 0 ? '+' : ''}{fmt(net)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 bg-gray-200 dark:bg-fpl-dark rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${net > 0 ? 'bg-fpl-green' : 'bg-fpl-red'}`}
                            style={{ width: `${Math.min(parseFloat(targetPct) * 10, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400 dark:text-gray-500 w-10 text-right">{targetPct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-gray-400 dark:text-gray-500">
                    {tab === 'myteam' && !teamId ? t('prices.noTeamPrices') :
                     tab === 'watchlist' && watchlist.length === 0 ? t('prices.emptyWatchlist') :
                     t('prices.noMatch')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trends: Top Risers & Fallers */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="bg-white dark:bg-fpl-card border border-fpl-light-border dark:border-fpl-border rounded-lg overflow-hidden">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-fpl-green uppercase px-4 py-3 border-b border-fpl-light-border dark:border-fpl-border">
            <HiArrowTrendingUp className="w-4 h-4" /> {t('prices.seasonTopRisers')}
          </h3>
          <table className="w-full text-sm">
            <tbody>
              {topRisers.map((p) => (
                <tr key={p.id} className="border-b border-fpl-light-border/30 dark:border-fpl-border/30">
                  <td className="px-4 py-2 text-gray-900 dark:text-white">{p.web_name}</td>
                  <td className="px-4 py-2 text-gray-500 dark:text-gray-400">{teamsMap?.[p.team]?.short_name}</td>
                  <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-300">£{(p.now_cost / 10).toFixed(1)}</td>
                  <td className="px-4 py-2 text-right text-fpl-green font-medium">+£{(p.cost_change_start / 10).toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-white dark:bg-fpl-card border border-fpl-light-border dark:border-fpl-border rounded-lg overflow-hidden">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-fpl-red uppercase px-4 py-3 border-b border-fpl-light-border dark:border-fpl-border">
            <HiArrowTrendingDown className="w-4 h-4" /> {t('prices.seasonTopFallers')}
          </h3>
          <table className="w-full text-sm">
            <tbody>
              {topFallers.map((p) => (
                <tr key={p.id} className="border-b border-fpl-light-border/30 dark:border-fpl-border/30">
                  <td className="px-4 py-2 text-gray-900 dark:text-white">{p.web_name}</td>
                  <td className="px-4 py-2 text-gray-500 dark:text-gray-400">{teamsMap?.[p.team]?.short_name}</td>
                  <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-300">£{(p.now_cost / 10).toFixed(1)}</td>
                  <td className="px-4 py-2 text-right text-fpl-red font-medium">-£{(Math.abs(p.cost_change_start) / 10).toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Accuracy Metrics */}
      {accuracy && accuracy.total > 0 && (
        <div className="bg-white dark:bg-fpl-card border border-fpl-light-border dark:border-fpl-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">{t('prices.accuracyTitle')}</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-fpl-accent">{accuracy.pct}%</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('prices.predictionMatch')}</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-fpl-green">{accuracy.correct}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('prices.correctDirection')}</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{accuracy.total}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('prices.totalChanges')}</p>
            </div>
          </div>
          <div className="mt-4 w-full h-3 bg-gray-200 dark:bg-fpl-dark rounded-full overflow-hidden">
            <div className="h-full bg-fpl-accent rounded-full transition-all" style={{ width: `${accuracy.pct}%` }} />
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            {t('prices.accuracyDesc')}
          </p>
        </div>
      )}
    </div>
  );
}
