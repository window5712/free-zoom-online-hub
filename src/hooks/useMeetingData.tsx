
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export interface Participant {
  id: string;
  name: string;
}

export interface Message {
  sender: string;
  text: string;
  time: string;
}

export const useMeetingData = (meetingId: string | undefined) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [meeting, setMeeting] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  // Check authentication and fetch meeting
  useEffect(() => {
    if (!user) {
      toast.error("Please sign in to join the meeting");
      navigate("/auth");
      return;
    }
    
    const fetchMeeting = async () => {
      if (!meetingId) return;

      try {
        const { data, error } = await supabase
          .from("meetings")
          .select("*")
          .eq("meeting_id", meetingId)
          .single();
          
        if (error || !data) {
          toast.error("Meeting not found");
          navigate("/");
          return;
        }
        
        setMeeting(data);
        
        // Insert attendance record
        await supabase
          .from("attendance")
          .insert([{
            meeting_id: data.id,
            user_id: user.id,
            join_time: new Date().toISOString()
          }])
          .select();
          
      } catch (error) {
        console.error("Error fetching meeting:", error);
        toast.error("Error loading meeting details");
      }
    };
    
    fetchMeeting();
  }, [meetingId, user, navigate]);

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
      
    // Record leave time when leaving the meeting
    return () => {
      if (user && meeting) {
        const updateAttendance = async () => {
          try {
            await supabase
              .from("attendance")
              .update({
                leave_time: new Date().toISOString()
              })
              .eq("meeting_id", meeting.id)
              .eq("user_id", user.id)
              .is("leave_time", null);
          } catch (error) {
            console.error("Error updating attendance record:", error);
          }
        };
        
        updateAttendance();
      }
      
      // Clean up the subscription
      supabase.removeChannel(channel);
    };
  }, [meeting, user]);

  return {
    meeting,
    participants,
    messages,
    setMessages,
    leaveAttendance: async () => {
      if (!user || !meeting) return;
      
      try {
        await supabase
          .from("attendance")
          .update({
            leave_time: new Date().toISOString()
          })
          .eq("meeting_id", meeting.id)
          .eq("user_id", user.id)
          .is("leave_time", null);
      } catch (error) {
        console.error("Error updating attendance record:", error);
      }
    }
  };
};
