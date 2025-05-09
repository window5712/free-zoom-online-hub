
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const createNewMeeting = async (userId: string | undefined) => {
  if (!userId) {
    toast.error("You must be signed in to create a meeting");
    return null;
  }
  
  try {
    // Create a random meeting ID
    const meetingId = Math.random().toString(36).substring(2, 12);
    
    // Insert meeting into database
    const { data, error } = await supabase
      .from("meetings")
      .insert([
        {
          meeting_id: meetingId,
          title: "New Meeting",
          created_by: userId,
          description: "A ZoomFree meeting"
        }
      ])
      .select();
      
    if (error) throw error;
    
    toast.success("Meeting created successfully");
    return meetingId;
  } catch (error) {
    console.error("Error creating meeting:", error);
    toast.error("Failed to create meeting");
    return null;
  }
};
