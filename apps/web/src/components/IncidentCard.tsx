import React from 'react';
import { AlertTriangle, Clock, MapPin, ThumbsDown, ThumbsUp, Image as ImageIcon } from 'lucide-react';
import type { Incident } from '../types';
import { Link } from 'react-router-dom';
import { updateIncidentVotes } from '../services/incidents';
import { useQueryClient } from '@tanstack/react-query';

interface IncidentCardProps {
  incident: Incident;
}

export default function IncidentCard({ incident }: IncidentCardProps) {
  const queryClient = useQueryClient();
  const [isVoting, setIsVoting] = React.useState(false);

  const handleVote = async (e: React.MouseEvent, type: 'upvote' | 'downvote') => {
    e.preventDefault();
    if (isVoting) return;

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

  const getSeverityColor = (severity: Incident['severity']) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-100 text-red-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'MODERATE': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!incident.location) {
    return null;
  }

  return (
    <Link to={`/incident/${incident.id}`} className="block">
      <div className="bg-white rounded-lg shadow-md p-4 mb-4 hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5" />
            <div className="ml-3">
              <h3 className="text-lg font-semibold">{incident.type.replace('_', ' ')}</h3>
              <div className="flex items-center text-sm text-gray-500 mt-1">
                <Clock className="h-4 w-4 mr-1" />
                <span>{new Date(incident.created_at).toLocaleString()}</span>
              </div>
            </div>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(incident.severity)}`}>
            {incident.severity}
          </span>
        </div>

        {incident.description && (
          <p className="mt-3 text-gray-600">{incident.description}</p>
        )}

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-500">
            <MapPin className="h-4 w-4 mr-1" />
            <span>{incident.location.zone}</span>
            {incident.incident_media && incident.incident_media.length > 0 && (
              <div className="flex items-center ml-4">
                <ImageIcon className="h-4 w-4 mr-1" />
                <span>{incident.incident_media.length}</span>
              </div>
            )}
          </div>
          
          <div className="flex space-x-4">
            <button 
              onClick={(e) => handleVote(e, 'upvote')}
              disabled={isVoting}
              className={`flex items-center text-gray-500 hover:text-green-600 ${
                isVoting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <ThumbsUp className="h-4 w-4 mr-1" />
              <span>{incident.upvotes}</span>
            </button>
            <button
              onClick={(e) => handleVote(e, 'downvote')}
              disabled={isVoting}
              className={`flex items-center text-gray-500 hover:text-red-600 ${
                isVoting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <ThumbsDown className="h-4 w-4 mr-1" />
              <span>{incident.downvotes}</span>
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}