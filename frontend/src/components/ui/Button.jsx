import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

const variants = {
  primary:   'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 shadow-sm',
  secondary: 'bg-surface-200 text-ink-700 hover:bg-surface-300 active:bg-surface-400',
  outline:   'border border-surface-400 text-ink-700 hover:bg-surface-100 active:bg-surface-200',
  ghost:     'text-ink-500 hover:bg-surface-100 hover:text-ink-700',
  danger:    'bg-danger-500 text-white hover:bg-danger-600 active:bg-danger-700 shadow-sm',
  success:   'bg-success-500 text-white hover:bg-success-600 active:bg-success-700 shadow-sm',
};

const sizes = {
  xs: 'h-7 px-2.5 text-body-sm gap-1',
  sm: 'h-8 px-3 text-body-sm gap-1.5',
  md: 'h-9 px-4 text-body-md gap-2',
  lg: 'h-10 px-5 text-body-lg gap-2',
};

const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  iconRight: IconRight,
  className = '',
  ...props
}, ref) => {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center font-medium rounded-lg
        transition-default select-none
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      {children}
      {IconRight && !loading && <IconRight className="w-4 h-4 shrink-0" />}
    </button>
  );
});

Button.displayName = 'Button';
export default Button;
