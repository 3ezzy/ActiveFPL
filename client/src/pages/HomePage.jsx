import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTeam } from '../context/TeamContext';

export default function HomePage() {
  const { teamId, setTeamId } = useTeam();
  const [input, setInput] = useState(teamId || '');
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = (e) => {
    e.preventDefault();
    const id = input.trim();
    if (id && /^\d+$/.test(id)) {
      setTeamId(id);
      navigate('/rank');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8">
      <div className="text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-fpl-accent mb-4">{t('home.title')}</h1>
        <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg max-w-md">
          {t('home.tagline')}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-fpl-card border border-fpl-light-border dark:border-fpl-border rounded-xl p-6 sm:p-8 w-full max-w-md"
      >
        <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">
          {t('home.teamIdLabel')}
        </label>
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('home.placeholder')}
            className="flex-1 bg-gray-50 dark:bg-fpl-dark border border-fpl-light-border dark:border-fpl-border rounded-lg px-4 py-2.5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-fpl-accent"
          />
          <button
            type="submit"
            className="bg-fpl-accent hover:bg-fpl-accent/80 text-fpl-dark font-semibold px-6 py-2.5 rounded-lg transition-colors"
          >
            {t('home.go')}
          </button>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
          {t('home.findIdHint')}
        </p>
      </form>
    </div>
  );
}