import { Search, X } from 'lucide-react';
import { useState } from 'react';

export default function SearchInput({
  value,
  onChange,
  placeholder = 'Rechercher…',
  className = '',
  ...props
}) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="
          w-full h-9 pl-9 pr-8 text-body-md text-ink-900
          bg-white border border-surface-400 rounded-lg
          placeholder:text-ink-400
          focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
          hover:border-surface-500
          transition-default
        "
        {...props}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-ink-400 hover:text-ink-700 transition-default"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
