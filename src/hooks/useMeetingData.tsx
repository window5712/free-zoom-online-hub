
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useMeetingInfo } from "./useMeetingInfo";
import { useMeetingParticipants } from "./useMeetingParticipants";
import { useAttendanceTracking } from "./useAttendanceTracking";
import { Message } from "@/types/meetingTypes";

export const useMeetingData = (meetingId: string | undefined) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Use sub-hooks
  const { meeting } = useMeetingInfo(meetingId, user);
  const { participants } = useMeetingParticipants(meeting, user);
  const { leaveAttendance } = useAttendanceTracking(meeting, user);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      leaveAttendance();
    };
  }, [meeting, user]);

  return {
    meeting,
    participants,
    messages,
    setMessages,
    leaveAttendance
  };
};

// Import the missing useEffect
import { useEffect } from "react";
