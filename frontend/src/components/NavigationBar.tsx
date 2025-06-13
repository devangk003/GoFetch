
import React from 'react';
import { cn } from '@/lib/utils';
import { Map, TrendingUp, Calendar } from 'lucide-react';

type ViewType = 'map' | 'trends' | 'predictions';

interface NavigationBarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export const NavigationBar: React.FC<NavigationBarProps> = ({
  currentView,
  onViewChange,
}) => {
  const navItems = [
    { id: 'map' as ViewType, label: 'Map', icon: Map },
    { id: 'trends' as ViewType, label: 'Trends', icon: TrendingUp },
    { id: 'predictions' as ViewType, label: 'Predictions', icon: Calendar },
  ];

  return (
    <nav className="hidden md:flex bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-full p-1 border border-gray-200/50 dark:border-gray-700/50">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={cn(
              'flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200',
              currentView === item.id
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50'
            )}
          >
            <Icon size={16} />
            <span className="text-sm font-medium">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
