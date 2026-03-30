export default function StatCard({ label, value }) {
  return (
    <div className="bg-fpl-card border border-fpl-border rounded-lg p-4 text-center">
      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
    </div>
  );
}
