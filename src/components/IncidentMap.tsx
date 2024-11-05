import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import { useNavigate } from 'react-router-dom';
import type { Incident } from '../types';
import 'leaflet/dist/leaflet.css';

interface IncidentMapProps {
  incidents: Incident[];
  userLocation: { lat: number; lng: number } | null;
}

// Component to update map center when user location changes
function MapCenterUpdater({ position }: { position: [number, number] }) {
  const map = useMap();
  React.useEffect(() => {
    map.setView(position, map.getZoom());
  }, [map, position]);
  return null;
}

export default function IncidentMap({ incidents, userLocation }: IncidentMapProps) {
  const navigate = useNavigate();
  // Default center (Haiti)
  const defaultCenter: [number, number] = [18.9712, -72.2852];
  const center: [number, number] = userLocation 
    ? [userLocation.lat, userLocation.lng]
    : defaultCenter;
  
  const customIcon = new Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  const userLocationIcon = new Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
    className: 'user-location-marker' // Add custom styling for user location marker
  });

  const handleMarkerClick = (incidentId: string) => {
    navigate(`/incident/${incidentId}`);
  };

  // Filter out incidents with invalid location data
  const validIncidents = incidents.filter(incident => 
    incident.location && 
    typeof incident.location.lat === 'number' && 
    typeof incident.location.lng === 'number' &&
    !isNaN(incident.location.lat) && 
    !isNaN(incident.location.lng)
  );

  return (
    <div className="h-[calc(100vh-16rem)] w-full rounded-lg overflow-hidden shadow-md">
      <MapContainer
        center={center}
        zoom={13}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {userLocation && (
          <>
            <Marker
              position={[userLocation.lat, userLocation.lng]}
              icon={userLocationIcon}
            >
              <Popup>
                <div className="text-center">
                  <strong>Your Location</strong>
                </div>
              </Popup>
            </Marker>
            <MapCenterUpdater position={[userLocation.lat, userLocation.lng]} />
          </>
        )}

        {validIncidents.map((incident) => (
          <Marker
            key={incident.id}
            position={[incident.location.lat, incident.location.lng]}
            icon={customIcon}
            eventHandlers={{
              click: () => handleMarkerClick(incident.id)
            }}
          >
            <Popup>
              <div 
                className="p-2 cursor-pointer hover:bg-gray-50"
                onClick={() => handleMarkerClick(incident.id)}
              >
                <h3 className="font-semibold text-lg">{incident.type.replace('_', ' ')}</h3>
                <p className="text-sm text-gray-600">{incident.description}</p>
                <div className="mt-2 text-sm text-gray-500">
                  {incident.location.zone}
                </div>
                <div className="mt-2 text-sm text-red-600 hover:text-red-700">
                  Click to view details
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}