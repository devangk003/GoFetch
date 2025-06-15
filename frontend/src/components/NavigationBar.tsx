import React from 'react';
import { cn } from '@/lib/utils';
import { Map, TrendingUp, Calendar, Settings2 } from 'lucide-react'; // Added Settings2 for a potential settings/theme toggle
import { SearchBar } from './SearchBar';
import { ThemeToggle } from './ThemeToggle'; // Assuming you have a ThemeToggle component

type ViewType = 'map' | 'trends' | 'predictions';

interface NavigationBarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearch?: (query: string) => void;
  isSearchLoading?: boolean;
  searchError?: Error | null;
  searchInterpretation?: string;
  showSearch?: boolean;
}

export const NavigationBar: React.FC<NavigationBarProps> = ({
  currentView,
  onViewChange,
  searchValue = '',
  onSearchChange = () => {},
  onSearch = () => {},
  isSearchLoading = false,
  searchError = null,
  searchInterpretation = '',
  showSearch = false,
}) => {
  const navItems = [
    { id: 'map' as ViewType, label: 'Map', icon: Map },
    { id: 'trends' as ViewType, label: 'Trends', icon: TrendingUp },
    { id: 'predictions' as ViewType, label: 'Predictions', icon: Calendar },
  ];

  return (
    // Apply glass-effect and remove redundant classes for background, blur, and border
    <div className="flex w-full items-center justify-between gap-4 p-2 glass-effect sticky top-0 z-[1000]">
      {/* Search Bar on the left - takes up available space */}
      {showSearch && (
        <div className="flex-grow min-w-[300px] sm:min-w-[400px] md:max-w-2xl lg:max-w-3xl">
          <SearchBar
            value={searchValue}
            onChange={onSearchChange}
            onSearch={onSearch}
            isLoading={isSearchLoading}
            error={searchError}
            interpretation={searchInterpretation}
            className="w-full" // SearchBar will take full width of its container
          />
        </div>
      )}

      {/* Navigation items and Theme Toggle on the right */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Removed glass-effect, added subtle background and border for the nav group */}
        <nav className="flex bg-foreground/5 dark:bg-background/5 backdrop-blur-sm rounded-full p-1 border border-foreground/10 dark:border-background/10">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={cn(
                  'flex items-center space-x-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full transition-all duration-300 ease-in-out text-xs sm:text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-opacity-75',
                  currentView === item.id
                    ? 'bg-primary/80 text-primary-foreground shadow-md' // Active state can retain stronger styling
                    : 'text-foreground/70 hover:bg-foreground/10 dark:hover:bg-background/10 hover:text-foreground' // Inactive state
                )}
              >
                <Icon size={16} className="sm:mr-1.5" />
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            );
          })}
        </nav>
        {/* Apply glass-effect styling directly to ThemeToggle */}
        <ThemeToggle />
      </div>
    </div>
  );
};
