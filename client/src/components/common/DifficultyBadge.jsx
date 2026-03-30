const colors = {
  1: 'bg-green-800',
  2: 'bg-green-500',
  3: 'bg-gray-500',
  4: 'bg-orange-500',
  5: 'bg-red-600',
};

export default function DifficultyBadge({ difficulty, label }) {
  return (
    <span
      className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-medium text-white min-w-[2rem] ${
        colors[difficulty] || 'bg-gray-600'
      }`}
    >
      {label || difficulty}
    </span>
  );
}
