import { supabase } from '../lib/supabase';
import type { Incident, IncidentCreate } from '../types';

export async function fetchIncidents(): Promise<Incident[]> {
  const { data, error } = await supabase
    .from('incidents')
    .select(`
      id,
      type,
      description,
      location_lat,
      location_lng,
      location_zone,
      severity,
      verified,
      upvotes,
      downvotes,
      anonymous,
      created_at,
      incident_media (
        id,
        url,
        type
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch incidents: ${error.message}`);
  
  // Transform the database records to match our frontend Incident type
  return (data || []).map(record => ({
    id: record.id,
    type: record.type,
    description: record.description,
    location: {
      lat: record.location_lat,
      lng: record.location_lng,
      zone: record.location_zone
    },
    created_at: record.created_at,
    severity: record.severity,
    verified: record.verified,
    upvotes: record.upvotes,
    downvotes: record.downvotes,
    anonymous: record.anonymous,
    incident_media: record.incident_media
  }));
}

export async function fetchIncidentById(id: string): Promise<Incident | null> {
  const { data, error } = await supabase
    .from('incidents')
    .select(`
      id,
      type,
      description,
      location_lat,
      location_lng,
      location_zone,
      severity,
      verified,
      upvotes,
      downvotes,
      anonymous,
      created_at,
      incident_media (
        id,
        url,
        type
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw new Error(`Failed to fetch incident: ${error.message}`);
  
  if (!data) return null;

  // Transform the database record to match our frontend Incident type
  return {
    id: data.id,
    type: data.type,
    description: data.description,
    location: {
      lat: data.location_lat,
      lng: data.location_lng,
      zone: data.location_zone
    },
    created_at: data.created_at,
    severity: data.severity,
    verified: data.verified,
    upvotes: data.upvotes,
    downvotes: data.downvotes,
    anonymous: data.anonymous,
    incident_media: data.incident_media
  };
}

export async function createIncident(incident: IncidentCreate): Promise<Incident> {
  try {
    // Create the incident record first
    const { data: incidentData, error: incidentError } = await supabase
      .from('incidents')
      .insert([{
        type: incident.type,
        description: incident.description,
        location_lat: incident.location.lat,
        location_lng: incident.location.lng,
        location_zone: incident.location.zone,
        severity: incident.severity,
        anonymous: incident.anonymous,
        verified: false,
        upvotes: 0,
        downvotes: 0,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (incidentError || !incidentData) {
      throw new Error(`Failed to create incident: ${incidentError?.message || 'Unknown error'}`);
    }

    // Handle media uploads if any
    if (incident.media?.length) {
      const mediaPromises = incident.media.map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${incidentData.id}/${crypto.randomUUID()}.${fileExt}`;

        // Upload the file
        const { error: uploadError } = await supabase.storage
          .from('incident-media')
          .upload(fileName, file);

        if (uploadError) {
          throw new Error(`Failed to upload media: ${uploadError.message}`);
        }

        // Get the public URL
        const { data: mediaUrl } = supabase.storage
          .from('incident-media')
          .getPublicUrl(fileName);

        // Create media record
        const { error: mediaError } = await supabase
          .from('incident_media')
          .insert([{
            incident_id: incidentData.id,
            url: mediaUrl.publicUrl,
            type: file.type.startsWith('image/') ? 'image' : 'video'
          }]);

        if (mediaError) {
          throw new Error(`Failed to create media record: ${mediaError.message}`);
        }
      });

      await Promise.all(mediaPromises);
    }

    // Fetch the complete incident with media
    const { data: finalIncident, error: fetchError } = await supabase
      .from('incidents')
      .select(`
        id,
        type,
        description,
        location_lat,
        location_lng,
        location_zone,
        severity,
        verified,
        upvotes,
        downvotes,
        anonymous,
        created_at,
        incident_media (
          id,
          url,
          type
        )
      `)
      .eq('id', incidentData.id)
      .single();

    if (fetchError || !finalIncident) {
      throw new Error(`Failed to fetch final incident: ${fetchError?.message || 'Unknown error'}`);
    }

    // Transform the database record to match our frontend Incident type
    return {
      id: finalIncident.id,
      type: finalIncident.type,
      description: finalIncident.description,
      location: {
        lat: finalIncident.location_lat,
        lng: finalIncident.location_lng,
        zone: finalIncident.location_zone
      },
      created_at: finalIncident.created_at,
      severity: finalIncident.severity,
      verified: finalIncident.verified,
      upvotes: finalIncident.upvotes,
      downvotes: finalIncident.downvotes,
      anonymous: finalIncident.anonymous,
      incident_media: finalIncident.incident_media
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error creating incident: ${error.message}`);
    }
    throw new Error('An unknown error occurred while creating the incident');
  }
}

export async function updateIncidentVotes(
  id: string,
  type: 'upvote' | 'downvote'
): Promise<void> {
  const column = type === 'upvote' ? 'upvotes' : 'downvotes';
  
  // First, get the current vote count
  const { data: currentIncident, error: fetchError } = await supabase
    .from('incidents')
    .select(column)
    .eq('id', id)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch current votes: ${fetchError.message}`);
  }

  const currentVotes = currentIncident?.[column] || 0;
  
  // Update with the incremented value
  const { error: updateError } = await supabase
    .from('incidents')
    .update({ [column]: currentVotes + 1 })
    .eq('id', id);

  if (updateError) {
    throw new Error(`Failed to update votes: ${updateError.message}`);
  }
}