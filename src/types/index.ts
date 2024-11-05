export interface Incident {
  id: string;
  type: 'GANG_ACTIVITY' | 'SEXUAL_VIOLENCE' | 'CIVIL_UNREST' | 'KIDNAPPING' | 'ROBBERY' | 'NATURAL_DISASTER' | 'ROAD_CLOSURE';
  description?: string;
  location: {
    lat: number;
    lng: number;
    zone: string;
  };
  created_at: string;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  verified: boolean;
  upvotes: number;
  downvotes: number;
  incident_media?: {
    id: string;
    url: string;
    type: 'image' | 'video';
  }[];
  anonymous: boolean;
}

export interface IncidentCreate {
  type: Incident['type'];
  description?: string;
  location: {
    lat: number;
    lng: number;
    zone: string;
  };
  severity: Incident['severity'];
  anonymous: boolean;
  media?: File[];
}

export interface User {
  id: string;
  phoneNumber?: string;
  trustScore: number;
  isAnonymous: boolean;
  createdAt: Date;
  preferences: {
    radius: number;
    notificationTypes: Incident['type'][];
    language: 'ht' | 'fr';
  };
}