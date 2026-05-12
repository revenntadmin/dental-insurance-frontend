import { forwardRef } from 'react';

const Input = forwardRef(function Input({ label, error, className = '', ...rest }, ref) {
  return (
    <div className={className}>
      {label && <label className="label">{label}</label>}
      <input ref={ref} className="input" {...rest} />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
});

export default Input;
