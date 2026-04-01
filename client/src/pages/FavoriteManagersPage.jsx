import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import useEntry from '../hooks/useEntry';
import Spinner from '../components/common/Spinner';
import ErrorBanner from '../components/common/ErrorBanner';
import StatCard from '../components/common/StatCard';

const fmt = (n) => (n != null ? new Intl.NumberFormat().format(n) : '-');

export default function FavoriteManagersPage() {
  const [ids, setIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('fpl_favorites') || '[]'); } catch { return []; }
  });
  const [input, setInput] = useState('');
  const { t } = useTranslation();

  const addManager = (e) => {
    e.preventDefault();
    const id = input.trim();
    if (id && /^\d+$/.test(id) && !ids.includes(id)) {
      const next = [...ids, id];
      setIds(next);
      localStorage.setItem('fpl_favorites', JSON.stringify(next));
      setInput('');
    }
  };

  const removeManager = (id) => {
    const next = ids.filter((i) => i !== id);
    setIds(next);
    localStorage.setItem('fpl_favorites', JSON.stringify(next));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t('favorites.title')}</h1>
      <p className="text-gray-500 dark:text-gray-400 text-sm">{t('favorites.subtitle')}</p>

      <form onSubmit={addManager} className="flex gap-3">
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder={t('favorites.teamId')} className="bg-gray-50 dark:bg-fpl-dark border border-fpl-light-border dark:border-fpl-border rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 w-40" />
        <button type="submit" className="bg-fpl-accent hover:bg-fpl-accent/80 text-fpl-dark font-semibold px-4 py-2 rounded-lg text-sm">{t('favorites.add')}</button>
      </form>

      {ids.length === 0 && <p className="text-gray-400 dark:text-gray-500 text-center py-12">{t('favorites.empty')}</p>}

      <div className="space-y-4">
        {ids.map((id) => (<ManagerCard key={id} teamId={id} onRemove={() => removeManager(id)} t={t} />))}
      </div>
    </div>
  );
}

function ManagerCard({ teamId, onRemove, t }) {
  const { entry, loading, error } = useEntry(teamId);

  if (loading) return <Spinner />;
  if (error) return <ErrorBanner message={error} />;
  if (!entry) return null;

  return (
    <div className="bg-white dark:bg-fpl-card border border-fpl-light-border dark:border-fpl-border rounded-lg p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-lg font-bold text-gray-900 dark:text-white">{entry.player_first_name} {entry.player_last_name}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{entry.name}</p>
        </div>
        <button onClick={onRemove} className="text-gray-400 dark:text-gray-500 hover:text-fpl-red text-sm">{t('favorites.remove')}</button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label={t('favorites.overallPts')} value={fmt(entry.summary_overall_points)} />
        <StatCard label={t('favorites.overallRank')} value={fmt(entry.summary_overall_rank)} />
        <StatCard label={t('favorites.gwPts')} value={fmt(entry.summary_event_points)} />
        <StatCard label={t('favorites.gwRank')} value={fmt(entry.summary_event_rank)} />
      </div>
    </div>
  );
}
