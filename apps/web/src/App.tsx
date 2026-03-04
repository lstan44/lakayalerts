import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from '@tanstack/react-query';
import Header from './components/Header';
import IncidentList from './components/IncidentList';
import IncidentMap from './components/IncidentMap';
import ReportButton from './components/ReportButton';
import ReportIncidentModal from './components/ReportIncidentModal';
import ViewToggle from './components/ViewToggle';
import IncidentDetail from './components/IncidentDetail';
import { fetchIncidents, createIncident } from './services/incidents';
import type { Incident, IncidentCreate } from './types';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // Consider data stale after 1 minute
      refetchInterval: 1000 * 30, // Refetch every 30 seconds
    },
  },
});

function AppContent() {
  const [view, setView] = useState<'list' | 'map'>('map');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const queryClient = useQueryClient();

  const { data: incidents = [], isLoading, error } = useQuery({
    queryKey: ['incidents'],
    queryFn: fetchIncidents,
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          // Default to Haiti coordinates if geolocation fails
          setUserLocation({
            lat: 18.9712,
            lng: -72.2852
          });
        }
      );
    }
  }, []);

  const sortedIncidents = React.useMemo(() => {
    if (!userLocation || !incidents.length) return incidents;

    return [...incidents].sort((a, b) => {
      if (!a.location || !b.location) return 0;
      
      // Calculate distances using Haversine formula
      const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
          Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
      };

      const distA = getDistance(
        userLocation.lat,
        userLocation.lng,
        a.location.lat,
        a.location.lng
      );
      const distB = getDistance(
        userLocation.lat,
        userLocation.lng,
        b.location.lat,
        b.location.lng
      );

      return distA - distB;
    });
  }, [incidents, userLocation]);

  const handleSubmitReport = async (newIncident: Omit<IncidentCreate, 'id' | 'verified' | 'upvotes' | 'downvotes'>) => {
    try {
      await createIncident(newIncident);
      await queryClient.invalidateQueries({ queryKey: ['incidents'] });
      setIsReportModalOpen(false);
    } catch (error) {
      throw error; // Re-throw to be handled by the modal
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Incidents</h2>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Header />
        
        <Routes>
          <Route
            path="/"
            element={
              <main className="max-w-4xl mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Recent Incidents</h2>
                    <p className="mt-1 text-sm text-gray-600">Stay informed about incidents in your area</p>
                  </div>
                  <ViewToggle view={view} onViewChange={setView} />
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
                  </div>
                ) : (
                  view === 'list' ? (
                    <IncidentList incidents={sortedIncidents} />
                  ) : (
                    <IncidentMap 
                      incidents={sortedIncidents} 
                      userLocation={userLocation}
                    />
                  )
                )}
              </main>
            }
          />
          <Route
            path="/incident/:id"
            element={<IncidentDetail incidents={incidents} />}
          />
        </Routes>

        <ReportButton onClick={() => setIsReportModalOpen(true)} />
        
        <ReportIncidentModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          onSubmit={handleSubmitReport}
        />
      </div>
    </Router>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}