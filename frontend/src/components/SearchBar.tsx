import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, Loader2, LightbulbIcon, XCircle, ArrowRight, ChevronDown, Sparkles } from 'lucide-react';
// import { suggestedQueries, queryCategories } from '@/lib/searchSuggestions'; // Keep static for fallback or merge
import { cn } from '@/lib/utils';
import { fetchAiSearchSuggestions, AiSuggestion } from '@/lib/api'; // Import the new fetch function and type
import geminiLogo from '@/assets/geminilogo.png';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => void;
  isLoading?: boolean;
  error?: Error | null;
  interpretation?: string;
  className?: string;
}

interface SuggestionCategory {
  name: string;
  examples: AiSuggestion[];
}

export const SearchBar: React.FC<SearchBarProps> = ({ 
  value, 
  onChange, 
  onSearch, 
  isLoading = false,
  error = null,
  interpretation = '',
  className = ''
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadAiSuggestions = async () => {
      setIsLoadingSuggestions(true);
      try {
        const suggestions = await fetchAiSearchSuggestions();
        setAiSuggestions(suggestions);
        // Automatically expand the first category if suggestions are loaded
        if (suggestions.length > 0) {
          setExpandedCategory('AI Generated Suggestions');
        }
      } catch (err) {
        console.error("Failed to load AI suggestions", err);
        // Potentially set some static fallback suggestions here
      }
      setIsLoadingSuggestions(false);
    };

    if (isFocused && isExpanded && aiSuggestions.length === 0 && !isLoadingSuggestions) { // check !isLoadingSuggestions to prevent multiple calls
      loadAiSuggestions();
    }
  }, [isFocused, isExpanded, aiSuggestions.length, isLoadingSuggestions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localValue.trim()) {
      onSearch(localValue);
      setIsFocused(false);
      setIsExpanded(false);
    }
  };

  const handleSuggestionClick = (suggestionQuery: string) => {
    setLocalValue(suggestionQuery);
    onChange(suggestionQuery);
    onSearch(suggestionQuery);
    setIsFocused(false);
    setIsExpanded(false);
  };

  const handleCategoryToggle = (categoryName: string) => {
    setExpandedCategory(expandedCategory === categoryName ? null : categoryName);
  };

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current && 
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsFocused(false);
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const suggestionCategories: SuggestionCategory[] = useMemo(() => {
    if (aiSuggestions.length > 0) {
      return [{ name: 'AI Generated Suggestions', examples: aiSuggestions }];
    }
    return []; // Or return static fallback categories from searchSuggestions.ts
  }, [aiSuggestions]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isExpanded) return;

    const allFlattenedSuggestions = suggestionCategories.reduce((acc, category) => acc.concat(category.examples.map(ex => ex.query)), [] as string[]);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestion(prev => 
        prev < allFlattenedSuggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestion(prev => 
        prev > 0 ? prev - 1 : allFlattenedSuggestions.length - 1
      );
    } else if (e.key === 'Enter' && activeSuggestion >= 0 && activeSuggestion < allFlattenedSuggestions.length) {
      e.preventDefault();
      handleSuggestionClick(allFlattenedSuggestions[activeSuggestion]);
    } 
    // Otherwise allow Enter to trigger form submission (handleSubmit)
  };

  return (
    <div className={cn("relative w-full", className)} ref={suggestionsRef}>
      <form onSubmit={handleSubmit} className="relative flex items-center group">
        <div className="absolute left-0 pl-3 flex items-center pointer-events-none z-10">
          <div className="w-8 h-8 flex items-center justify-center bg-white/30 backdrop-blur-sm rounded-full transition-colors duration-200 group-focus-within:bg-white/40">
            <img src={geminiLogo} alt="AI" className="w-5 h-5" />
          </div>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={localValue}
          onChange={(e) => {
            setLocalValue(e.target.value);
            onChange(e.target.value);
            setActiveSuggestion(-1); // reset active suggestion on typing
            setIsExpanded(e.target.value.trim() !== '' || aiSuggestions.length > 0);
          }}
          onFocus={() => {
            setIsFocused(true);
            setActiveSuggestion(-1); // reset active suggestion on focus
            setIsExpanded(true); // always expand suggestions on focus
          }}
          onKeyDown={handleKeyDown}
          placeholder="Ask AI for NYC air quality insights... (e.g., 'PM2.5 in Brooklyn')"
          className={cn(
            "w-full pl-12 pr-10 py-2.5 rounded-full border transition-all duration-300 ease-in-out",
            "bg-background/70 backdrop-blur-sm",
            "text-foreground placeholder-muted-foreground",
            "border-border focus:border-primary focus:ring-2 focus:ring-primary/50 focus:outline-none",
            "shadow-sm hover:shadow-md focus:shadow-lg",
            isFocused ? "ring-2 ring-primary/50 border-primary" : "border-border"
          )}
        />
        <div className="absolute right-0 pr-3 flex items-center">
          {isLoading ? (
            <Loader2 size={20} className="animate-spin text-muted-foreground" />
          ) : localValue ? (
            <button
              type="button"
              onClick={() => {
                setLocalValue('');
                onChange('');
                setIsExpanded(false);
                inputRef.current?.focus();
              }}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full"
              aria-label="Clear search"
            >
              <XCircle size={18} />
            </button>
          ) : (
            <Search size={20} className="text-muted-foreground" />
          )}
        </div>
      </form>

      {isExpanded && (localValue.trim() !== '' || suggestionCategories.length > 0 || isLoadingSuggestions) && (
        <div 
          className={cn(
            "absolute mt-2 w-full rounded-lg border border-border bg-background shadow-xl z-[1000] overflow-hidden",
            "transition-all duration-300 ease-in-out",
            isExpanded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
          )}
        >
          <div className="max-h-[calc(100vh-200px)] overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-muted-foreground/50 scrollbar-track-transparent">
            {interpretation && (
              <div className="px-3 py-2 text-sm text-muted-foreground border-b border-border mb-1">
                <LightbulbIcon className="inline-block mr-2 h-4 w-4 text-yellow-500" />
                {interpretation}
              </div>
            )}
            
            {isLoadingSuggestions && (
              <div className="flex items-center justify-center p-4 text-muted-foreground">
                <Loader2 size={16} className="animate-spin mr-2" />
                <span>Loading AI suggestions...</span>
              </div>
            )}

            {!isLoadingSuggestions && suggestionCategories.map((category) => (
              <div key={category.name} className="mb-1 last:mb-0">
                <button 
                  onClick={() => handleCategoryToggle(category.name)}
                  className="w-full flex justify-between items-center px-3 py-2 text-left text-sm font-semibold text-foreground hover:bg-muted/50 rounded-md transition-colors"
                >
                  <span className="flex items-center">
                    {category.name === 'AI Generated Suggestions' && <Sparkles className="mr-2 h-4 w-4 text-blue-500" />}
                    {category.name}
                  </span>
                  <ChevronDown 
                    size={16} 
                    className={cn("transition-transform duration-200", expandedCategory === category.name ? "rotate-180" : "")}
                  />
                </button>
                {expandedCategory === category.name && (
                  <div className="pl-3 pt-1 space-y-0.5">
                    {category.examples.map((suggestion, index) => {
                      const flatSuggestionIndex = suggestionCategories
                        .slice(0, suggestionCategories.indexOf(category))
                        .reduce((acc, cat) => acc + cat.examples.length, 0) + index;

                      return (
                        <button
                          key={suggestion.id} 
                          onClick={() => handleSuggestionClick(suggestion.query)}
                          className={cn(
                            "w-full text-left px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors flex items-center",
                            activeSuggestion === flatSuggestionIndex ? "bg-muted/60 text-foreground" : ""
                          )}
                          onMouseEnter={() => setActiveSuggestion(flatSuggestionIndex)}
                        >
                          <ArrowRight size={12} className="mr-2 opacity-70" />
                          {suggestion.query}
                        </button>
                      );
                    })}
                    {category.examples.length === 0 && !isLoadingSuggestions && (
                        <p className="px-3 py-1.5 text-sm text-muted-foreground">(No AI suggestions available at the moment)</p>
                    )}
                  </div>
                )}
              </div>
            ))}
            {!isLoadingSuggestions && suggestionCategories.length === 0 && (
                 <p className="px-3 py-2 text-sm text-muted-foreground">(No suggestions available. Type to search.)</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
