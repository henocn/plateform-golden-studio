import React from "react";

export default function Checkbox({ checked, onChange, label, ...props }) {
  return (
    <label className="inline-flex items-center cursor-pointer gap-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="form-checkbox h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
        {...props}
      />
      {label && <span className="text-sm text-ink-700">{label}</span>}
    </label>
  );
}
