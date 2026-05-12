import { forwardRef } from 'react';

const Select = forwardRef(function Select({ label, error, className = '', children, ...rest }, ref) {
  return (
    <div className={className}>
      {label && <label className="label">{label}</label>}
      <select ref={ref} className="input" {...rest}>{children}</select>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
});

export default Select;
