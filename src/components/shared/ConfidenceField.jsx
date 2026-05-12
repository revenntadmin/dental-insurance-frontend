import ConfidenceIndicator from './ConfidenceIndicator.jsx';

/**
 * Renders a labeled input plus the AI confidence score for that field.
 * Coordinator can edit; low confidence is highlighted.
 */
export default function ConfidenceField({ label, value, onChange, confidence, name, type = 'text' }) {
  const borderCls =
    confidence == null ? 'border-slate-300' :
    confidence >= 0.85 ? 'border-emerald-400' :
    confidence >= 0.60 ? 'border-amber-400' :
    'border-red-400';

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="label mb-0">{label}</label>
        <ConfidenceIndicator score={confidence} />
      </div>
      <input
        type={type}
        name={name}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className={`input ${borderCls}`}
      />
    </div>
  );
}
