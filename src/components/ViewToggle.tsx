import React from 'react';
import { List, Map } from 'lucide-react';

interface ViewToggleProps {
  view: 'list' | 'map';
  onViewChange: (view: 'list' | 'map') => void;
}

export default function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-1 inline-flex">
      <button
        onClick={() => onViewChange('list')}
        className={`flex items-center px-3 py-2 rounded ${
          view === 'list'
            ? 'bg-red-100 text-red-700'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        <List className="h-5 w-5 mr-2" />
        <span className="font-medium">List</span>
      </button>
      <button
        onClick={() => onViewChange('map')}
        className={`flex items-center px-3 py-2 rounded ${
          view === 'map'
            ? 'bg-red-100 text-red-700'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        <Map className="h-5 w-5 mr-2" />
        <span className="font-medium">Map</span>
      </button>
    </div>
  );
}