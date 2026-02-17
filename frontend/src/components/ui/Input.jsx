import { forwardRef } from 'react';

const Input = forwardRef(({
  label,
  error,
  hint,
  icon: Icon,
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  return (
    <div className={`space-y-1 ${containerClassName}`}>
      {label && (
        <label className="block text-label text-ink-700">
          {label}
          {props.required && <span className="text-danger-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="w-4 h-4 text-ink-400" />
          </div>
        )}
        <input
          ref={ref}
          className={`
            w-full h-9 px-3 text-body-md text-ink-900
            bg-white border rounded-lg
            placeholder:text-ink-400
            transition-default
            ${Icon ? 'pl-9' : ''}
            ${error
              ? 'border-danger-500 focus:ring-danger-500/20 focus:border-danger-500'
              : 'border-surface-400 focus:ring-primary-500/20 focus:border-primary-400 hover:border-surface-500'
            }
            focus:outline-none focus:ring-2
            disabled:bg-surface-200 disabled:cursor-not-allowed
            ${className}
          `}
          {...props}
        />
      </div>
      {error && <p className="text-body-sm text-danger-500">{error}</p>}
      {hint && !error && <p className="text-body-sm text-ink-400">{hint}</p>}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
