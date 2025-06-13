import React, { useState } from 'react';
import { MapView } from '../components/MapView';
import { TrendsView } from '../components/TrendsView';
import { PredictionsView } from '../components/PredictionsView';
import { NavigationBar } from '../components/NavigationBar';
import { SearchBar } from '../components/SearchBar';
import { ThemeToggle } from '../components/ThemeToggle';

type ViewType = 'map' | 'trends' | 'predictions';

const Index = () => {
  const [currentView, setCurrentView] = useState<ViewType>('map');
  const [searchQuery, setSearchQuery] = useState('');

  const renderCurrentView = () => {
    switch (currentView) {
      case 'trends':
        return <TrendsView />;
      case 'predictions':
        return <PredictionsView />;
      default:
        return <MapView searchQuery={searchQuery} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900 transition-colors duration-300">
      {/* Header */}
      <header className="relative z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              AirVue
            </h1>
            <NavigationBar currentView={currentView} onViewChange={setCurrentView} />
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Search Bar - Only show on map view */}
      {currentView === 'map' && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-md px-4">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>
      )}

      {/* Main Content */}
      <main className="relative">
        {renderCurrentView()}
      </main>
    </div>
  );
};

export default Index;
