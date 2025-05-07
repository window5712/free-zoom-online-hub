
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Video, Calendar, Clock, User } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Meeting {
  meetingId: string;
  date: string;
  startTime: string;
  endTime?: string;
  participants: Array<{
    name: string;
    joinTime: string;
    leaveTime?: string;
  }>;
}

const Meetings = () => {
  const [meetings, setMeetings] = useState<Record<string, Meeting>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  
  useEffect(() => {
    // Load meetings from localStorage
    const storedMeetings = localStorage.getItem("meetingAttendance");
    if (storedMeetings) {
      setMeetings(JSON.parse(storedMeetings));
    }
  }, []);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  const filteredMeetings = Object.values(meetings).filter(meeting => 
    meeting.meetingId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleJoinMeeting = (meetingId: string) => {
    navigate(`/meeting/${meetingId}`);
  };

  const handleViewAttendance = (meetingId: string) => {
    navigate(`/attendance/${meetingId}`);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Your Meetings</h1>
            <p className="text-muted-foreground">
              View your past and upcoming meetings
            </p>
          </div>
          <div className="w-full md:w-auto mt-4 md:mt-0">
            <Input
              placeholder="Search meetings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-[300px]"
            />
          </div>
        </div>

        {filteredMeetings.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMeetings.map((meeting) => (
              <Card key={meeting.meetingId}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium">
                    Meeting {meeting.meetingId}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm">
                      <Calendar size={16} className="mr-2 text-muted-foreground" />
                      <span>{formatDate(meeting.date)}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Clock size={16} className="mr-2 text-muted-foreground" />
                      <span>
                        {meeting.startTime} - {meeting.endTime || "Ongoing"}
                      </span>
                    </div>
                    <div className="flex items-center text-sm">
                      <User size={16} className="mr-2 text-muted-foreground" />
                      <span>{meeting.participants.length} participants</span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button 
                      onClick={() => handleJoinMeeting(meeting.meetingId)}
                      className="flex-1"
                      variant="default"
                    >
                      <Video size={16} className="mr-2" />
                      Join Again
                    </Button>
                    <Button 
                      onClick={() => handleViewAttendance(meeting.meetingId)}
                      className="flex-1"
                      variant="outline"
                    >
                      View Attendance
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="mb-4 rounded-full bg-zinc-100 p-3 w-12 h-12 flex items-center justify-center mx-auto">
              <Video className="h-6 w-6 text-zinc-500" />
            </div>
            <h3 className="text-lg font-medium mb-1">No meetings found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? "Try a different search term" : "You haven't joined any meetings yet"}
            </p>
            <Button onClick={() => navigate("/")} variant="default">
              Create a New Meeting
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Meetings;
