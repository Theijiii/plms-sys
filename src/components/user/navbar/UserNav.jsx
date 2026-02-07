import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react'; // or whichever icon library you use

const UserNav = ({ items, collapsed }) => {
  const [expandedItem, setExpandedItem] = useState(new Set());

  // Define color palette
  const palette = {
    primary: '#4CAF50',   // Green
    secondary: '#4A90E2', // Blue
    accent: '#FDA811',    // Yellow/Orange
    background: '#FBFBFB' // Light background
  };

  const toggleExpanded = (item) => {
    const newExpanded = new Set(expandedItem);
    if (newExpanded.has(item.id)) {
      newExpanded.delete(item.id);
    } else {
      newExpanded.add(item.id);
    }
    setExpandedItem(newExpanded);
  };

  return (
    <nav
      className="flex flex-col p-4 transition-all duration-200 dark:bg-slate-900"
      style={{ backgroundColor: palette.background }}
    >
      {items.map((item) => {
        const isActive = expandedItem.has(item.id);

        return (
          <button
            key={item.id}
            onClick={() => toggleExpanded(item)}
            className={`
              w-full flex justify-between items-center p-3 mb-2 rounded-xl border shadow-sm transition-all duration-200
              ${isActive
                ? 'font-semibold'
                : 'hover:opacity-90'
              }
            `}
            style={{
              backgroundColor: isActive ? `${palette.secondary}20` : 'transparent',
              color: isActive ? palette.secondary : '#9aa5b1',
              borderColor: isActive ? palette.secondary : '#9aa5b166',
            }}
          >
            <div className="flex items-center space-x-3">
              <item.icon
                className="w-5 h-5 transition-colors duration-200"
                style={{ color: isActive ? palette.secondary : '#9aa5b1' }}
              />
              {!collapsed && (
                <span className="text-sm font-medium">
                  {item.label}
                </span>
              )}
            </div>

            {!collapsed && item.subItems && (
              <ChevronDown
                className="w-4 h-4 transition-transform duration-200"
                style={{
                  transform: expandedItem.has(item.id) ? 'rotate(180deg)' : 'rotate(0deg)',
                  color: isActive ? palette.secondary : '#9aa5b1',
                }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
};

export default UserNav;
