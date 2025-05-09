
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useAttendanceData } from "@/hooks/useAttendanceData";
import AttendanceHeader from "@/components/attendance/AttendanceHeader";
import AttendanceTable from "@/components/attendance/AttendanceTable";

const AttendanceSingle = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const { meeting, isLoading } = useAttendanceData(meetingId);

  const handleBack = () => {
    navigate("/meetings");
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
          <Button onClick={() => navigate("/meetings")}>Back to Meetings</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <AttendanceHeader meeting={meeting} onBack={handleBack} />
        <div className="bg-white rounded-md shadow mb-4">
          <AttendanceTable participants={meeting.participants} />
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
