import { forwardRef } from 'react';

const Textarea = forwardRef(({
  label,
  error,
  hint,
  className = '',
  containerClassName = '',
  rows = 3,
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
      <textarea
        ref={ref}
        rows={rows}
        className={`
          w-full px-3 py-2 text-body-md text-ink-900
          bg-white border rounded-lg resize-y
          placeholder:text-ink-400
          transition-default
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
      {error && <p className="text-body-sm text-danger-500">{error}</p>}
      {hint && !error && <p className="text-body-sm text-ink-400">{hint}</p>}
    </div>
  );
});

Textarea.displayName = 'Textarea';
export default Textarea;
