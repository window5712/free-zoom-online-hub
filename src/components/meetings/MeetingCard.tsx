
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Video, Calendar, Clock, User } from "lucide-react";
import { Meeting } from "@/hooks/useMeetingsList";
import { useNavigate } from "react-router-dom";

interface MeetingCardProps {
  meeting: Meeting;
}

const MeetingCard: React.FC<MeetingCardProps> = ({ meeting }) => {
  const navigate = useNavigate();
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleJoinMeeting = () => {
    navigate(`/meeting/${meeting.meeting_id}`);
  };

  const handleViewAttendance = () => {
    navigate(`/attendance/${meeting.id}`);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">
          {meeting.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm">
            <Calendar size={16} className="mr-2 text-muted-foreground" />
            <span>{formatDate(meeting.created_at)}</span>
          </div>
          <div className="flex items-center text-sm">
            <Clock size={16} className="mr-2 text-muted-foreground" />
            <span>
              {meeting.scheduled_time 
                ? new Date(meeting.scheduled_time).toLocaleTimeString() 
                : new Date(meeting.created_at).toLocaleTimeString()}
            </span>
          </div>
          <div className="flex items-center text-sm">
            <User size={16} className="mr-2 text-muted-foreground" />
            <span>{meeting.participant_count || 0} participants</span>
          </div>
          <div className="flex items-center text-sm">
            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
              ID: {meeting.meeting_id}
            </span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            onClick={handleJoinMeeting}
            className="flex-1"
            variant="default"
          >
            <Video size={16} className="mr-2" />
            Join Again
          </Button>
          <Button 
            onClick={handleViewAttendance}
            className="flex-1"
            variant="outline"
          >
            View Attendance
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MeetingCard;
