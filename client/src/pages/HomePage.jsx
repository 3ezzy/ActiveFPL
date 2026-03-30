import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTeam } from '../context/TeamContext';

export default function HomePage() {
  const { teamId, setTeamId } = useTeam();
  const [input, setInput] = useState(teamId || '');
  const navigate = useNavigate();

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
        <h1 className="text-5xl font-bold text-fpl-accent mb-4">ActiveFPL</h1>
        <p className="text-gray-400 text-lg max-w-md">
          Track your live FPL rank, analyze players, monitor leagues and rivals — all in real-time.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-fpl-card border border-fpl-border rounded-xl p-8 w-full max-w-md"
      >
        <label className="block text-sm text-gray-400 mb-2">
          Enter your FPL Team ID to get started
        </label>
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. 123456"
            className="flex-1 bg-fpl-dark border border-fpl-border rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-fpl-accent"
          />
          <button
            type="submit"
            className="bg-fpl-accent hover:bg-fpl-accent/80 text-fpl-dark font-semibold px-6 py-2.5 rounded-lg transition-colors"
          >
            Go
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Find your ID in the FPL app under Points → URL contains your team ID
        </p>
      </form>
    </div>
  );
}
