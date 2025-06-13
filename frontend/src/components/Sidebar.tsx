import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void; 
  onToggle: () => void; 
  data: SearchResultData[] | null;
  className?: string;
  topOffset?: number;
}

export interface SearchResultData {
  name: string;
  pollutant?: string;
  value?: number | string;
  date?: string;
  timePeriod?: string;
  areaType?: string;
  indicatorId?: number | string;
  imageUrl?: string; 
  latitude?: number;
  longitude?: number;
  zoom?: number;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onClose, 
  onToggle, 
  data, 
  className, 
  topOffset = 0 
}) => {
  const sidebarNominalHeightVh = 65;
  // Calculate the 'bottom' offset for the toggle button to be centered on a 65vh sidebar
  // (65vh / 2) = 32.5vh. The button has 'transform -translate-y-1/2'
  const toggleButtonBottomOffset = `${sidebarNominalHeightVh / 2}vh`;

  // Group data by location name
  const groupedData = (data || []).reduce<Record<string, SearchResultData[]>>((acc, item) => {
    const loc = item.name;
    if (!acc[loc]) acc[loc] = [];
    acc[loc].push(item);
    return acc;
  }, {});

  return (
    <>
      {/* Toggle button positioned on the edge */}
      <Button
        variant="outline"
        size="icon"
        onClick={onToggle}
        className={`fixed transform -translate-y-1/2 z-[1002] transition-all duration-300 ease-in-out ${
          isOpen ? 'left-[calc(20rem-2.5rem)] sm:left-[calc(24rem-2.5rem)]' : 'left-2' // Adjust based on sidebar width
        }`}
        // Position it vertically centered on the sidebar's visible part (assuming 65vh height from bottom)
        style={{ 
          bottom: toggleButtonBottomOffset, 
          top: 'auto' // Override previous top positioning
        }}
        aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
      >
        {isOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
      </Button>

      {/* Sidebar content */}
      <div
        className={`fixed left-0 w-80 sm:w-96 bg-background shadow-lg z-[1001] p-4 transform transition-transform duration-300 ease-in-out flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          ${className}`}
        style={{
          top: `${topOffset}px`,    // Margin below navbar
          bottom: '0px'             // Fill down to bottom
        }}
      >
        {/* Global close button half outside top-right corner */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute -top-3 -right-3 bg-background rounded-full p-1 shadow-md z-[1003]"
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </Button>
        {data && data.length > 0 ? (
          <div className="overflow-y-auto space-y-6 pb-4 scrollbar-thin scrollbar-thumb-muted-foreground/50 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/80 flex-1">
            {Object.entries(groupedData).map(([location, entries]) => (
              <div key={location} className="space-y-2">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 px-4">{location}</h2>
                <div className="space-y-3 px-4">
                  {entries.map((entry, idx) => (
                    <Card key={idx} className="bg-background/50 rounded-md shadow">
                      <CardHeader className="pt-4 px-3">
                        <CardTitle className="text-sm font-semibold">{entry.pollutant}</CardTitle>
                      </CardHeader>
                      <CardContent className="px-3 pb-3 space-y-1 text-sm">
                        <p><strong>Value:</strong> {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}</p>
                        {entry.date && <p><strong>Date:</strong> {entry.date}</p>}
                        {entry.timePeriod && <p><strong>Period:</strong> {entry.timePeriod}</p>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          isOpen && (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">No location selected.</p>
            </div>
          )
        )}
      </div>
    </>
  );
};

export default Sidebar;
