export default function ConfidenceIndicator({ score }) {
  if (score == null) return null;
  const pct = Math.round(score * 100);
  const cls =
    score >= 0.85 ? 'bg-emerald-100 text-emerald-700' :
    score >= 0.60 ? 'bg-amber-100 text-amber-700' :
    'bg-red-100 text-red-700';
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${cls}`}>
      {pct}%
    </span>
  );
}
