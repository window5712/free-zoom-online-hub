
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Video, Calendar, Clock, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface Meeting {
  id: string;
  meeting_id: string;
  title: string;
  description?: string;
  created_by: string;
  is_private: boolean;
  scheduled_time?: string;
  created_at: string;
  participant_count?: number;
}

const Meetings = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Redirect if not authenticated
    if (!user) {
      toast.error("Please sign in to view your meetings");
      navigate("/auth");
      return;
    }
    
    // Fetch meetings from database
    const fetchMeetings = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from("meetings")
          .select(`
            id, 
            meeting_id, 
            title, 
            description, 
            created_by, 
            is_private, 
            scheduled_time, 
            created_at
          `)
          .eq("created_by", user.id)
          .order("created_at", { ascending: false });
          
        if (error) throw error;
        
        // Fetch attendance records for each meeting to get participant count
        if (data) {
          const meetingsWithParticipantCount = await Promise.all(data.map(async (meeting) => {
            const { count } = await supabase
              .from("attendance")
              .select("*", { count: "exact", head: true })
              .eq("meeting_id", meeting.id);
              
            return {
              ...meeting,
              participant_count: count || 0
            };
          }));
          
          setMeetings(meetingsWithParticipantCount);
        }
      } catch (error) {
        console.error("Error fetching meetings:", error);
        toast.error("Failed to load meetings");
      } finally {
        setLoading(false);
      }
    };
    
    fetchMeetings();
  }, [user, navigate]);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  const filteredMeetings = meetings.filter(meeting => 
    meeting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    meeting.meeting_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleJoinMeeting = (meetingId: string) => {
    navigate(`/meeting/${meetingId}`);
  };

  const handleViewAttendance = (meetingId: string) => {
    navigate(`/attendance/${meetingId}`);
  };
  
  const handleCreateMeeting = async () => {
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
            created_by: user?.id,
            description: "A ZoomFree meeting"
          }
        ])
        .select();
        
      if (error) throw error;
      
      toast.success("Meeting created successfully");
      navigate(`/meeting/${meetingId}`);
    } catch (error) {
      console.error("Error creating meeting:", error);
      toast.error("Failed to create meeting");
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <p>Please sign in to view your meetings</p>
          <Button onClick={() => navigate("/auth")} className="mt-4">Sign In</Button>
        </div>
      </Layout>
    );
  }

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
          <div className="w-full md:w-auto mt-4 md:mt-0 flex gap-2">
            <Input
              placeholder="Search meetings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-[300px]"
            />
            <Button onClick={handleCreateMeeting}>New Meeting</Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <p>Loading your meetings...</p>
          </div>
        ) : filteredMeetings.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMeetings.map((meeting) => (
              <Card key={meeting.id}>
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
                      onClick={() => handleJoinMeeting(meeting.meeting_id)}
                      className="flex-1"
                      variant="default"
                    >
                      <Video size={16} className="mr-2" />
                      Join Again
                    </Button>
                    <Button 
                      onClick={() => handleViewAttendance(meeting.id)}
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
              {searchQuery ? "Try a different search term" : "You haven't created any meetings yet"}
            </p>
            <Button onClick={handleCreateMeeting} variant="default">
              Create a New Meeting
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Meetings;
