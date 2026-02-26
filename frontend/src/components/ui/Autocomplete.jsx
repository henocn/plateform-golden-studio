import { useState, useRef, useEffect } from 'react';

export default function Autocomplete({ label, value, onChange, options = [], placeholder = 'Sélectionner…', className = '', containerClassName = '', getOptionLabel = o => o?.label ?? '', getOptionValue = o => o?.value ?? '' }) {
  const [inputValue, setInputValue] = useState('');
  const [show, setShow] = useState(false);
  const ref = useRef();

  useEffect(() => {
    if (show) {
      const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setShow(false); };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }
  }, [show]);

  const safeOptions = Array.isArray(options) ? options : [];
  const filtered = safeOptions.filter(opt => (getOptionLabel(opt) || '').toLowerCase().includes((inputValue || '').toLowerCase()));
  const selected = safeOptions.find(o => getOptionValue(o) === value);

  useEffect(() => {
    setInputValue(selected ? getOptionLabel(selected) : '');
  }, [value, options]);

  return (
    <div className={`space-y-1 ${containerClassName}`} ref={ref}>
      {label && <label className="block text-label text-ink-700">{label}</label>}
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={e => {
            setInputValue(e.target.value);
            setShow(true);
            if (e.target.value === '') {
              onChange(''); // Réinitialise la sélection projet si champ vidé
            }
          }}
          onFocus={() => setShow(true)}
          placeholder={placeholder}
          className={`w-full h-9 px-3 text-body-md text-ink-900 bg-white border border-surface-400 rounded-lg placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 hover:border-surface-500 transition-default ${className}`}
        />
        {show && filtered.length > 0 && (
          <div className="absolute z-10 left-0 right-0 bg-white border border-surface-300 rounded-lg mt-1 shadow-lg max-h-56 overflow-auto">
            {filtered.map(opt => (
              <div
                key={getOptionValue(opt)}
                className={`px-3 py-2 cursor-pointer hover:bg-surface-100 ${value === getOptionValue(opt) ? 'bg-surface-200' : ''}`}
                onMouseDown={() => { onChange(getOptionValue(opt)); setInputValue(getOptionLabel(opt)); setShow(false); }}
              >
                {getOptionLabel(opt)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
