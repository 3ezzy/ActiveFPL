export default function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div className="bg-fpl-red/10 border border-fpl-red/30 text-fpl-red rounded-lg px-4 py-3 text-sm">
      {message}
    </div>
  );
}
