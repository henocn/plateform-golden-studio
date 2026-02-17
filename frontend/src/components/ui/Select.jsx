import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

const Select = forwardRef(({
  label,
  error,
  options = [],
  placeholder = 'Sélectionner…',
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
        <select
          ref={ref}
          className={`
            w-full h-9 px-3 pr-8 text-body-md text-ink-900
            bg-white border rounded-lg appearance-none
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
        >
          <option value="">{placeholder}</option>
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" />
      </div>
      {error && <p className="text-body-sm text-danger-500">{error}</p>}
    </div>
  );
});

Select.displayName = 'Select';
export default Select;
