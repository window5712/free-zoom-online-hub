
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

interface Participant {
  name: string;
  joinTime: string;
  leaveTime: string | null;
}

interface Meeting {
  meetingId: string;
  date: string;
  startTime: string;
  endTime?: string;
  participants: Participant[];
}

const AttendanceSingle = () => {
  const { meetingId } = useParams();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Load meeting data from localStorage
    const storedMeetings = localStorage.getItem("meetingAttendance");
    if (storedMeetings) {
      const meetings = JSON.parse(storedMeetings);
      if (meetingId && meetings[meetingId]) {
        setMeeting(meetings[meetingId]);
      }
    }
  }, [meetingId]);
  
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
                {meeting.participants.map((participant, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{participant.name}</TableCell>
                    <TableCell>{participant.joinTime}</TableCell>
                    <TableCell>{participant.leaveTime || "Still present"}</TableCell>
                    <TableCell>
                      {calculateDuration(participant.joinTime, participant.leaveTime)}
                    </TableCell>
                  </TableRow>
                ))}
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
