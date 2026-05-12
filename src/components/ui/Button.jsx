export default function Button({ variant = 'primary', className = '', children, ...rest }) {
  const cls =
    variant === 'primary' ? 'btn-primary' :
    variant === 'danger' ? 'btn-danger' :
    'btn-secondary';
  return (
    <button className={`${cls} ${className}`} {...rest}>
      {children}
    </button>
  );
}
