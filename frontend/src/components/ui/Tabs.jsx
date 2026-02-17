import { useState } from 'react';

export default function Tabs({
  tabs,
  activeTab,
  onChange,
  className = '',
}) {
  return (
    <div className={`border-b border-surface-200 ${className}`}>
      <nav className="flex gap-0 -mb-px">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`
              px-4 py-2.5 text-body-md font-medium border-b-2 transition-default whitespace-nowrap
              ${activeTab === tab.id
                ? 'border-primary-500 text-primary-500'
                : 'border-transparent text-ink-400 hover:text-ink-700 hover:border-surface-400'
              }
            `}
          >
            {tab.icon && <tab.icon className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />}
            {tab.label}
            {tab.count !== undefined && (
              <span className={`
                ml-1.5 px-1.5 py-0.5 text-[0.625rem] font-semibold rounded-full
                ${activeTab === tab.id
                  ? 'bg-primary-100 text-primary-600'
                  : 'bg-surface-200 text-ink-500'
                }
              `}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
