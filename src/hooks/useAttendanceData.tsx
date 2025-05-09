
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Participant {
  id: string;
  name: string;
  joinTime: string;
  leaveTime: string | null;
}

interface Meeting {
  id: string;
  meetingId: string;
  title: string;
  date: string;
  startTime: string;
  endTime?: string;
  participants: Participant[];
}

interface Profile {
  username: string | null;
  full_name: string | null;
}

export const useAttendanceData = (meetingId: string | undefined) => {
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMeetingData = async () => {
      if (!meetingId) return;
      
      setIsLoading(true);
      try {
        // First try to fetch by database ID
        let { data: meetingData, error: meetingError } = await supabase
          .from("meetings")
          .select("*")
          .eq("id", meetingId)
          .single();
        
        // If not found by ID, try to fetch by meeting_id
        if (meetingError || !meetingData) {
          const { data: meetingByMeetingId, error: meetingByMeetingIdError } = await supabase
            .from("meetings")
            .select("*")
            .eq("meeting_id", meetingId)
            .single();
            
          if (meetingByMeetingIdError || !meetingByMeetingId) {
            toast.error("Meeting not found");
            navigate("/meetings");
            return;
          }
          
          meetingData = meetingByMeetingId;
        }
        
        // Fetch attendance records for this meeting
        const { data: attendanceData, error: attendanceError } = await supabase
          .from("attendance")
          .select(`
            id, 
            join_time, 
            leave_time, 
            user_id
          `)
          .eq("meeting_id", meetingData.id);
          
        if (attendanceError) {
          console.error("Error fetching attendance:", attendanceError);
          toast.error("Failed to load attendance data");
          return;
        }
        
        // Get unique user IDs from attendance records
        const userIds = attendanceData.map(record => record.user_id);
        
        // Fetch user profiles separately
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, username, full_name")
          .in("id", userIds);
        
        if (profilesError) {
          console.error("Error fetching profiles:", profilesError);
          toast.error("Failed to load user profiles");
          return;
        }
        
        // Create a user profile lookup map
        const profileMap: Record<string, Profile> = {};
        profilesData?.forEach(profile => {
          profileMap[profile.id] = {
            username: profile.username,
            full_name: profile.full_name
          };
        });
        
        // Format data for display with profile information
        const participants = attendanceData.map(record => {
          const profile = profileMap[record.user_id];
          const displayName = profile 
            ? (profile.username || profile.full_name || "Anonymous User")
            : "Anonymous User";
            
          return {
            id: record.user_id,
            name: displayName,
            joinTime: new Date(record.join_time || "").toLocaleTimeString(),
            leaveTime: record.leave_time ? new Date(record.leave_time).toLocaleTimeString() : null
          };
        });
        
        setMeeting({
          id: meetingData.id,
          meetingId: meetingData.meeting_id,
          title: meetingData.title,
          date: new Date(meetingData.created_at || "").toLocaleDateString(),
          startTime: new Date(meetingData.created_at || "").toLocaleTimeString(),
          endTime: undefined,
          participants
        });
      } catch (error) {
        console.error("Error fetching meeting data:", error);
        toast.error("Failed to load meeting details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMeetingData();
  }, [meetingId, navigate]);

  return { meeting, isLoading };
};
