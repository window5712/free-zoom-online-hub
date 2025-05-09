
import { useState, useEffect } from "react";
import { Participant } from "@/types/meetingTypes";
import { supabase } from "@/integrations/supabase/client";

export const useMeetingParticipants = (meeting: any | null, user: any | null) => {
  const [participants, setParticipants] = useState<Participant[]>([]);

  // Setup real-time listener for meeting participants
  useEffect(() => {
    if (!meeting || !user) return;
    
    // Fetch current participants
    const fetchParticipants = async () => {
      try {
        // First fetch profiles to get user information
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, username, full_name");
          
        if (profilesError) throw profilesError;
        
        // Then fetch attendance records
        const { data: attendanceData, error: attendanceError } = await supabase
          .from("attendance")
          .select("user_id, leave_time")
          .eq("meeting_id", meeting.id)
          .is("leave_time", null); // Only active participants (not left)
          
        if (attendanceError) throw attendanceError;
        
        // Match attendance with profiles and filter out current user
        const activeParticipants = attendanceData
          .filter(p => p.user_id !== user?.id) // Don't include current user
          .map(attendance => {
            const profile = profilesData.find(p => p.id === attendance.user_id);
            return {
              id: attendance.user_id,
              name: profile ? (profile.username || profile.full_name || "Anonymous User") : "Anonymous User"
            };
          });
          
        setParticipants(activeParticipants);
      } catch (error) {
        console.error("Error fetching participants:", error);
      }
    };
    
    fetchParticipants();
    
    // Set up realtime subscription for attendance changes
    const channel = supabase
      .channel('public:attendance')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'attendance',
        filter: `meeting_id=eq.${meeting.id}`
      }, () => {
        // When attendance changes, refresh participants
        fetchParticipants();
      })
      .subscribe();
      
    return () => {
      // Clean up the subscription
      supabase.removeChannel(channel);
    };
  }, [meeting, user]);

  return { participants };
};
