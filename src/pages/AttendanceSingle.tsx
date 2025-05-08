
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

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

const AttendanceSingle = () => {
  const { meetingId } = useParams();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();
  
  useEffect(() => {
    const fetchMeetingData = async () => {
      if (!meetingId) return;
      
      setIsLoading(true);
      try {
        // Fetch meeting information
        const { data: meetingData, error: meetingError } = await supabase
          .from("meetings")
          .select("*")
          .eq("id", meetingId)
          .single();
        
        if (meetingError || !meetingData) {
          toast.error("Meeting not found");
          navigate("/attendance");
          return;
        }
        
        // Fetch attendance records for this meeting
        const { data: attendanceData, error: attendanceError } = await supabase
          .from("attendance")
          .select(`
            id, 
            join_time, 
            leave_time, 
            user_id,
            profiles:user_id (username, full_name)
          `)
          .eq("meeting_id", meetingId);
          
        if (attendanceError) {
          console.error("Error fetching attendance:", attendanceError);
          toast.error("Failed to load attendance data");
          return;
        }
        
        // Format data for display
        const participants = attendanceData.map(record => ({
          id: record.user_id,
          name: record.profiles?.username || record.profiles?.full_name || "Anonymous User",
          joinTime: new Date(record.join_time).toLocaleTimeString(),
          leaveTime: record.leave_time ? new Date(record.leave_time).toLocaleTimeString() : null
        }));
        
        setMeeting({
          id: meetingData.id,
          meetingId: meetingData.meeting_id,
          title: meetingData.title,
          date: new Date(meetingData.created_at).toLocaleDateString(),
          startTime: new Date(meetingData.created_at).toLocaleTimeString(),
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
  
  const calculateDuration = (joinTime: string, leaveTime: string | null) => {
    if (!leaveTime) return "Still present";
    
    const join = new Date(`1970-01-01T${joinTime}`);
    const leave = new Date(`1970-01-01T${leaveTime}`);
    
    // Handle case where meeting goes past midnight
    if (leave < join) {
      leave.setDate(leave.getDate() + 1);
    }
    
    const diffMs = leave.getTime() - join.getTime();
    const diffMins = Math.floor(diffMs / 1000 / 60);
    
    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? 's' : ''}`;
    }
    
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours} hr${hours !== 1 ? 's' : ''} ${mins} min${mins !== 1 ? 's' : ''}`;
  };

  const exportToCSV = () => {
    if (!meeting) return;
    
    const headers = ["Name", "Join Time", "Leave Time", "Duration"];
    const rows = meeting.participants.map(p => [
      p.name,
      p.joinTime,
      p.leaveTime || "Still present",
      calculateDuration(p.joinTime, p.leaveTime)
    ]);
    
    const csvContent = [
      `Meeting ID: ${meeting.meetingId}`,
      `Date: ${meeting.date}`,
      `Start Time: ${meeting.startTime}`,
      `End Time: ${meeting.endTime || "Ongoing"}`,
      "",
      headers.join(","),
      ...rows.map(r => r.map(cell => `"${cell}"`).join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `meeting-attendance-${meeting.meetingId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Loading meeting data...</h1>
        </div>
      </Layout>
    );
  }

  if (!meeting) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Meeting not found</h1>
          <Button onClick={() => navigate("/attendance")}>Back to Attendance</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            className="mr-4 p-2" 
            onClick={handleBack}
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Meeting Attendance</h1>
            <p className="text-muted-foreground">Meeting ID: {meeting.meetingId}</p>
          </div>
        </div>

        <div className="bg-white rounded-md shadow mb-4">
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="font-semibold">Attendance Record</h2>
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download size={16} className="mr-2" />
              Export to CSV
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Join Time</TableHead>
                  <TableHead>Leave Time</TableHead>
                  <TableHead>Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {meeting.participants.length > 0 ? (
                  meeting.participants.map((participant, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{participant.name}</TableCell>
                      <TableCell>{participant.joinTime}</TableCell>
                      <TableCell>{participant.leaveTime || "Still present"}</TableCell>
                      <TableCell>
                        {calculateDuration(participant.joinTime, participant.leaveTime)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4">
                      No attendance records found for this meeting
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="text-center mt-8">
          <Button onClick={() => navigate(`/meeting/${meeting.meetingId}`)}>
            Rejoin Meeting
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default AttendanceSingle;
