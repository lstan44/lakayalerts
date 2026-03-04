import React from 'react';
import { Bell, Menu, Shield } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-red-700 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Shield className="h-8 w-8" />
            <span className="ml-2 text-xl font-bold">LakayAlert</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-full hover:bg-red-600 transition-colors">
              <Bell className="h-6 w-6" />
            </button>
            <button className="p-2 rounded-full hover:bg-red-600 transition-colors">
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}