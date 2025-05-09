
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download } from "lucide-react";
import { exportToCSV } from "@/utils/attendanceUtils";

interface Meeting {
  id: string;
  meetingId: string;
  title: string;
  date: string;
  startTime: string;
  endTime?: string;
  participants: Array<{
    id: string;
    name: string;
    joinTime: string;
    leaveTime: string | null;
  }>;
}

interface AttendanceHeaderProps {
  meeting: Meeting;
  onBack: () => void;
}

const AttendanceHeader: React.FC<AttendanceHeaderProps> = ({ meeting, onBack }) => {
  return (
    <>
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          className="mr-4 p-2" 
          onClick={onBack}
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
          <Button variant="outline" size="sm" onClick={() => exportToCSV(meeting)}>
            <Download size={16} className="mr-2" />
            Export to CSV
          </Button>
        </div>
      </div>
    </>
  );
};

export default AttendanceHeader;
