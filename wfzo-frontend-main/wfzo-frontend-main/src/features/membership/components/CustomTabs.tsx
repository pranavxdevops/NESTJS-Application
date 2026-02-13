// import React, { useState } from "react";

import { useState } from 'react';
//import  { TabId } from '/types/tabs';
import LightPressButton from '@/shared/components/LightPressButton';


interface TabItem<T extends string> {
  id: T;
  label: string;
  icon?: React.ReactNode;
}

interface CustomTabsProps<T extends string> {
  tabs: readonly TabItem<T>[];
  defaultTab?: T;
  onTabChange?: (tabId: T) => void;
  className?: string;
}


export function CustomTabs<T extends string>({
  tabs,
  defaultTab,
  onTabChange,
  className = '',
}: CustomTabsProps<T>) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const handleTabClick = (tabId: T) => {
    setActiveTab(tabId);
    onTabChange?.(tabId);
  };

  return (
    <div className={`flex items-center gap-6 ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
    <div key={tab.id}>
      {isActive ? (
        <LightPressButton>
          <div className="flex items-center gap-2">
            {tab.icon}
            <span>{tab.label}</span>
          </div>
        </LightPressButton>
      ) : (
        <button
          onClick={() => handleTabClick(tab.id)}
          className="font-source text-base text-gray-700 hover:text-wfzo-gold-800 transition-colors"
        >
          <div className="flex items-center gap-2">
            {tab.icon}
            <span>{tab.label}</span>
          </div>
        </button>
      )}
    </div>
  );
      })}
    </div>
  );
}
