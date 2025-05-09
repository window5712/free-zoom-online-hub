
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { MeetingData } from "@/types/meetingTypes";

export const useMeetingInfo = (meetingId: string | undefined, user: any | null) => {
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState<MeetingData | null>(null);

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
        // First try to find by meeting_id
        const { data, error } = await supabase
          .from("meetings")
          .select("*")
          .eq("meeting_id", meetingId)
          .single();
          
        if (error || !data) {
          toast.error("Meeting not found");
          navigate("/meetings");
          return;
        }
        
        setMeeting(data);
      } catch (error) {
        console.error("Error fetching meeting:", error);
        toast.error("Error loading meeting details");
      }
    };
    
    fetchMeeting();
  }, [meetingId, user, navigate]);

  return { meeting };
};
