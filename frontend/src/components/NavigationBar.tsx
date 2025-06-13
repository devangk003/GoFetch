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
    // Changed to flex, items-center, and justify-between for layout
    <div className="flex w-full items-center justify-between gap-4 p-2 bg-background/80 backdrop-blur-sm border-b border-border sticky top-0 z-[1000]">
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
        <nav className="flex bg-muted/60 dark:bg-muted/60 backdrop-blur-md rounded-full p-1 border border-border/50">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={cn(
                  'flex items-center space-x-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full transition-all duration-200 text-xs sm:text-sm font-medium',
                  currentView === item.id
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-foreground'
                )}
              >
                <Icon size={16} className="sm:mr-1.5" />
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            );
          })}
        </nav>
        <ThemeToggle />
        {/* You could add other icons/buttons here as well */}
        {/* <button className="p-2 rounded-full hover:bg-muted/80">
          <Settings2 size={18} className="text-muted-foreground" />
        </button> */}
      </div>
    </div>
  );
};
