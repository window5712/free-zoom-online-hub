
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export interface Meeting {
  id: string;
  meeting_id: string;
  title: string;
  description?: string;
  created_by: string;
  is_private: boolean;
  scheduled_time?: string;
  created_at: string;
  participant_count?: number;
}

export const useMeetingsList = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Redirect if not authenticated
    if (!user) {
      toast.error("Please sign in to view your meetings");
      navigate("/auth");
      return;
    }
    
    // Fetch meetings from database
    const fetchMeetings = async () => {
      try {
        setLoading(true);
        
        // Fetch both meetings created by the user and meetings they've attended
        const { data: createdMeetings, error: createdError } = await supabase
          .from("meetings")
          .select(`
            id, 
            meeting_id, 
            title, 
            description, 
            created_by, 
            is_private, 
            scheduled_time, 
            created_at
          `)
          .eq("created_by", user.id)
          .order("created_at", { ascending: false });
          
        if (createdError) throw createdError;
        
        // Now get all meeting IDs where the user participated (via attendance records)
        const { data: attendedRecords, error: attendedError } = await supabase
          .from("attendance")
          .select("meeting_id")
          .eq("user_id", user.id);
          
        if (attendedError) throw attendedError;
        
        // Get unique meeting IDs from attendance records
        const attendedMeetingIds = [...new Set(attendedRecords.map(r => r.meeting_id))];
        
        // If the user has attended meetings, fetch their details
        let attendedMeetings: any[] = [];
        if (attendedMeetingIds.length > 0) {
          const { data: attendedMeetingsData, error: attendedMeetingsError } = await supabase
            .from("meetings")
            .select(`
              id, 
              meeting_id, 
              title, 
              description, 
              created_by, 
              is_private, 
              scheduled_time, 
              created_at
            `)
            .in("id", attendedMeetingIds)
            .order("created_at", { ascending: false });
            
          if (attendedMeetingsError) throw attendedMeetingsError;
          attendedMeetings = attendedMeetingsData || [];
        }
        
        // Combine both lists, ensuring no duplicates (meetings created by user that they also attended)
        const combinedMeetings = [...createdMeetings];
        attendedMeetings.forEach(meeting => {
          if (!combinedMeetings.some(m => m.id === meeting.id)) {
            combinedMeetings.push(meeting);
          }
        });
        
        // Fetch attendance records for each meeting to get participant count
        if (combinedMeetings.length > 0) {
          const meetingsWithParticipantCount = await Promise.all(combinedMeetings.map(async (meeting) => {
            const { count } = await supabase
              .from("attendance")
              .select("*", { count: "exact", head: true })
              .eq("meeting_id", meeting.id);
              
            return {
              ...meeting,
              participant_count: count || 0
            };
          }));
          
          setMeetings(meetingsWithParticipantCount);
        } else {
          setMeetings([]);
        }
      } catch (error) {
        console.error("Error fetching meetings:", error);
        toast.error("Failed to load meetings");
      } finally {
        setLoading(false);
      }
    };
    
    fetchMeetings();
  }, [user, navigate]);

  // Filter meetings based on search query
  const filteredMeetings = meetings.filter(meeting => 
    meeting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    meeting.meeting_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return {
    meetings,
    filteredMeetings,
    searchQuery,
    setSearchQuery,
    loading,
    user
  };
};
