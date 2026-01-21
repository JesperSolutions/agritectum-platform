import React from 'react';
import { cn } from '../../../lib/utils';

export interface FilterTab {
  value: string;
  label: string;
}

interface FilterTabsProps {
  tabs: FilterTab[];
  activeTab: string;
  onTabChange: (value: string) => void;
  className?: string;
}

/**
 * Standardized filter tabs component matching reference design
 * Active state: bg-slate-700 text-white
 * Inactive state: bg-slate-100 text-slate-700 hover:bg-slate-200
 */
const FilterTabs: React.FC<FilterTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className = '',
}) => {
  return (
    <div className={cn('flex space-x-2', className)}>
      {tabs.map(tab => (
        <button
          key={tab.value}
          onClick={() => onTabChange(tab.value)}
          className={cn(
            'px-4 py-2 rounded-md text-sm font-medium transition-colors',
            activeTab === tab.value
              ? 'bg-slate-700 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default FilterTabs;
