import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ReportButtonProps {
  onClick: () => void;
}

export default function ReportButton({ onClick }: ReportButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 bg-red-600 text-white rounded-full p-4 shadow-lg hover:bg-red-700 transition-colors"
    >
      <div className="flex items-center">
        <AlertCircle className="h-6 w-6 mr-2" />
        <span className="font-medium">Report Incident</span>
      </div>
    </button>
  );
}