
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useAttendanceTracking = (meeting: any | null, user: any | null) => {
  const [attendanceRecordId, setAttendanceRecordId] = useState<string | null>(null);

  useEffect(() => {
    if (!meeting || !user) return;

    const recordAttendance = async () => {
      try {
        // Check if user has already joined this meeting
        const { data: existingAttendance, error: existingAttendanceError } = await supabase
          .from("attendance")
          .select("id, leave_time")
          .eq("meeting_id", meeting.id)
          .eq("user_id", user.id)
          .order("join_time", { ascending: false })
          .limit(1);
          
        if (!existingAttendanceError && existingAttendance && existingAttendance.length > 0) {
          // If there's an existing record with leave_time null, use that record
          if (existingAttendance[0].leave_time === null) {
            setAttendanceRecordId(existingAttendance[0].id);
            return;
          }
        }
        
        // Insert new attendance record
        const { data: newAttendance, error: insertError } = await supabase
          .from("attendance")
          .insert([{
            meeting_id: meeting.id,
            user_id: user.id,
            join_time: new Date().toISOString()
          }])
          .select();
          
        if (insertError) {
          console.error("Error recording attendance:", insertError);
        } else if (newAttendance && newAttendance.length > 0) {
          setAttendanceRecordId(newAttendance[0].id);
        }
      } catch (error) {
        console.error("Error tracking attendance:", error);
      }
    };

    recordAttendance();
  }, [meeting, user]);

  const leaveAttendance = async () => {
    if (user && meeting && attendanceRecordId) {
      try {
        await supabase
          .from("attendance")
          .update({
            leave_time: new Date().toISOString()
          })
          .eq("id", attendanceRecordId);
      } catch (error) {
        console.error("Error updating attendance record:", error);
      }
    }
  };

  return { attendanceRecordId, leaveAttendance };
};
