export default function LoadingState({ label = 'Loading…' }) {
  return (
    <div className="py-10 text-center text-sm text-slate-500">{label}</div>
  );
}

export function ErrorState({ error }) {
  return (
    <div className="py-10 text-center text-sm text-red-600">
      {error?.response?.data?.message || error?.message || 'Something went wrong'}
    </div>
  );
}
