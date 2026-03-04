import React from 'react';
import { useParams } from 'react-router-dom';
import { AlertTriangle, Clock, MapPin, ThumbsDown, ThumbsUp, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Incident } from '../types';
import { updateIncidentVotes } from '../services/incidents';
import { useQueryClient } from '@tanstack/react-query';

interface IncidentDetailProps {
  incidents: Incident[];
}

export default function IncidentDetail({ incidents }: IncidentDetailProps) {
  const { id } = useParams<{ id: string }>();
  const incident = incidents.find(inc => inc.id === id);
  const queryClient = useQueryClient();
  const [isVoting, setIsVoting] = React.useState(false);

  const handleVote = async (type: 'upvote' | 'downvote') => {
    if (!incident || isVoting) return;

    try {
      setIsVoting(true);
      await updateIncidentVotes(incident.id, type);
      await queryClient.invalidateQueries({ queryKey: ['incidents'] });
    } catch (error) {
      console.error('Error updating votes:', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsVoting(false);
    }
  };

  if (!incident || !incident.location) {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Incident Not Found</h2>
            <Link to="/" className="text-red-600 hover:text-red-700 font-medium">
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const getSeverityColor = (severity: Incident['severity']) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-100 text-red-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'MODERATE': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="inline-flex items-center text-red-600 hover:text-red-700 mb-6">
          <ChevronLeft className="h-5 w-5 mr-1" />
          Back to Incidents
        </Link>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">
                  {incident.type.replace('_', ' ')}
                </h1>
                <div className="flex items-center text-gray-500 mt-2">
                  <Clock className="h-5 w-5 mr-2" />
                  <span>{new Date(incident.created_at).toLocaleString()}</span>
                </div>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(incident.severity)}`}>
              {incident.severity}
            </span>
          </div>

          <div className="mb-8">
            <div className="flex items-center text-gray-600 mb-4">
              <MapPin className="h-5 w-5 mr-2" />
              <span>{incident.location.zone}</span>
            </div>
            {incident.description && (
              <p className="text-gray-700 whitespace-pre-wrap">{incident.description}</p>
            )}
          </div>

          {incident.incident_media && incident.incident_media.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">Media</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {incident.incident_media.map((media, index) => (
                  <div key={index} className="relative aspect-video">
                    {media.type === 'image' ? (
                      <img
                        src={media.url}
                        alt={`Incident media ${index + 1}`}
                        className="rounded-lg object-cover w-full h-full"
                      />
                    ) : (
                      <video
                        src={media.url}
                        controls
                        className="rounded-lg object-cover w-full h-full"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end space-x-6 border-t pt-6">
            <button 
              onClick={() => handleVote('upvote')}
              disabled={isVoting}
              className={`flex items-center text-gray-500 hover:text-green-600 ${
                isVoting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <ThumbsUp className="h-5 w-5 mr-2" />
              <span className="font-medium">{incident.upvotes}</span>
            </button>
            <button 
              onClick={() => handleVote('downvote')}
              disabled={isVoting}
              className={`flex items-center text-gray-500 hover:text-red-600 ${
                isVoting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <ThumbsDown className="h-5 w-5 mr-2" />
              <span className="font-medium">{incident.downvotes}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}