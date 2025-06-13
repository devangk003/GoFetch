
import React from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ value, onChange }) => {
  return (
    <div className="relative">
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
        <div className="flex items-center px-4 py-3">
          <Search className="text-gray-400 dark:text-gray-500 mr-3" size={20} />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Ask about air quality... (e.g., 'AQI in Mumbai last week')"
            className="flex-1 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none text-sm"
          />
          {value && (
            <button
              onClick={() => onChange('')}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-2"
            >
              ×
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
