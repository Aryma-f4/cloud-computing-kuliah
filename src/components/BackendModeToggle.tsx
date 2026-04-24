'use client';

import { useState, useEffect } from 'react';
import { BackendUtils } from '@/src/lib/api';

export default function BackendModeToggle() {
  const [currentMode, setCurrentMode] = useState<'firebase' | 'spreadsheet'>('spreadsheet');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const storedMode = BackendUtils.getStoredMode();
    const envMode = BackendUtils.getCurrentMode();
    setCurrentMode((storedMode || envMode) as 'firebase' | 'spreadsheet');
  }, []);

  const handleModeChange = (mode: 'firebase' | 'spreadsheet') => {
    BackendUtils.switchMode(mode);
    setCurrentMode(mode);
    
    // Reload page to apply new configuration
    if (confirm(`Switch to ${mode} backend? This will reload the page.`)) {
      window.location.reload();
    }
  };

  if (!isClient) {
    return null; // Don't render on server to avoid hydration mismatch
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg border p-3">
        <div className="flex items-center space-x-3">
          <div className="text-sm font-medium text-gray-700">
            Backend: <span className={`font-bold ${currentMode === 'firebase' ? 'text-blue-600' : 'text-green-600'}`}>
              {currentMode === 'firebase' ? 'Firebase' : 'Spreadsheet'}
            </span>
          </div>
          
          <div className="flex space-x-1">
            <button
              onClick={() => handleModeChange('spreadsheet')}
              className={`px-2 py-1 text-xs rounded ${
                currentMode === 'spreadsheet'
                  ? 'bg-green-100 text-green-800 border border-green-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="Use Google Spreadsheet backend"
            >
              CSV
            </button>
            
            <button
              onClick={() => handleModeChange('firebase')}
              className={`px-2 py-1 text-xs rounded ${
                currentMode === 'firebase'
                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="Use Firebase Firestore backend"
            >
              Firebase
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}