export default function EmptyState({ title, description, action }) {
  return (
    <div className="text-center py-12 px-4">
      <div className="text-slate-500 font-medium">{title}</div>
      {description && <div className="text-sm text-slate-400 mt-1">{description}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
