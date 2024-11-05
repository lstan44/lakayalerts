import React, { useState, useEffect } from 'react';
import { X, Loader2, MapPin, Upload } from 'lucide-react';
import type { IncidentCreate } from '../types';
import { createIncident } from '../services/incidents';

interface ReportIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (incident: Omit<IncidentCreate, 'id' | 'verified' | 'upvotes' | 'downvotes'>) => Promise<void>;
}

const INCIDENT_TYPES = [
  { value: 'GANG_ACTIVITY', label: 'Gang Activity' },
  { value: 'SEXUAL_VIOLENCE', label: 'Sexual Violence' },
  { value: 'CIVIL_UNREST', label: 'Civil Unrest' },
  { value: 'KIDNAPPING', label: 'Kidnapping' },
  { value: 'ROBBERY', label: 'Robbery' },
  { value: 'NATURAL_DISASTER', label: 'Natural Disaster' },
  { value: 'ROAD_CLOSURE', label: 'Road Closure' }
] as const;

const SEVERITY_LEVELS = [
  { value: 'CRITICAL', label: 'Critical' },
  { value: 'HIGH', label: 'High' },
  { value: 'MODERATE', label: 'Moderate' },
  { value: 'LOW', label: 'Low' }
] as const;

export default function ReportIncidentModal({ isOpen, onClose, onSubmit }: ReportIncidentModalProps) {
  const [location, setLocation] = useState<{ lat: number; lng: number; zone: string } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  
  const [formData, setFormData] = useState({
    type: '',
    description: '',
    severity: '',
    anonymous: false,
    media: [] as File[]
  });

  useEffect(() => {
    if (isOpen) {
      getLocation();
    }
  }, [isOpen]);

  const getLocation = async () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    setIsLoadingLocation(true);
    setLocationError('');

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${position.coords.latitude}&lon=${position.coords.longitude}&format=json`
      );
      const data = await response.json();

      setLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        zone: data.address.suburb || data.address.neighbourhood || data.address.city_district || 'Unknown Area'
      });
    } catch (error) {
      setLocationError('Unable to retrieve your location');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({
      ...prev,
      media: [...prev.media, ...files]
    }));
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      media: prev.media.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location) return;

    setIsSubmitting(true);
    setError('');

    try {
      const incidentData: IncidentCreate = {
        type: formData.type as IncidentCreate['type'],
        description: formData.description,
        severity: formData.severity as IncidentCreate['severity'],
        location: location,
        anonymous: formData.anonymous,
        media: formData.media
      };

      await onSubmit(incidentData);
      onClose();
      
      // Reset form
      setFormData({
        type: '',
        description: '',
        severity: '',
        anonymous: false,
        media: []
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create incident');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Report Incident</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Incident Type *
            </label>
            <select
              required
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
            >
              <option value="">Select type</option>
              {INCIDENT_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
              placeholder="Provide details about the incident..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Severity Level *
            </label>
            <select
              required
              value={formData.severity}
              onChange={(e) => setFormData(prev => ({ ...prev, severity: e.target.value }))}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
            >
              <option value="">Select severity</option>
              {SEVERITY_LEVELS.map(level => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Media Files
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label htmlFor="media-upload" className="relative cursor-pointer rounded-md font-medium text-red-600 hover:text-red-500">
                    <span>Upload files</span>
                    <input
                      id="media-upload"
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      className="sr-only"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500">
                  PNG, JPG, GIF, MP4 up to 10MB
                </p>
              </div>
            </div>
            {formData.media.length > 0 && (
              <div className="mt-2 space-y-2">
                {formData.media.map((file, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-600 hover:text-red-500"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2 text-sm">
            <MapPin className="h-4 w-4 text-gray-500" />
            {isLoadingLocation ? (
              <div className="flex items-center text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Getting location...
              </div>
            ) : location ? (
              <span className="text-green-600">Location detected: {location.zone}</span>
            ) : (
              <span className="text-red-600">{locationError || 'Location not available'}</span>
            )}
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="anonymous"
              checked={formData.anonymous}
              onChange={(e) => setFormData(prev => ({ ...prev, anonymous: e.target.checked }))}
              className="rounded border-gray-300 text-red-600 focus:ring-red-500"
            />
            <label htmlFor="anonymous" className="ml-2 text-sm text-gray-700">
              Report anonymously
            </label>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={!location || isLoadingLocation || isSubmitting}
              className="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Submitting...
                </div>
              ) : (
                'Submit Report'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}