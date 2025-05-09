
import React from "react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import { useNavigate } from "react-router-dom";
import { useMeetingsList } from "@/hooks/useMeetingsList";
import MeetingCard from "@/components/meetings/MeetingCard";
import MeetingsHeader from "@/components/meetings/MeetingsHeader";
import EmptyMeetings from "@/components/meetings/EmptyMeetings";
import { createNewMeeting } from "@/utils/meetingsUtils";

const Meetings = () => {
  const navigate = useNavigate();
  const { 
    filteredMeetings, 
    searchQuery, 
    setSearchQuery, 
    loading, 
    user 
  } = useMeetingsList();
  
  const handleCreateMeeting = async () => {
    const meetingId = await createNewMeeting(user?.id);
    if (meetingId) {
      navigate(`/meeting/${meetingId}`);
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
        <MeetingsHeader 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onCreateMeeting={handleCreateMeeting}
        />

        {loading ? (
          <div className="flex justify-center py-12">
            <p>Loading your meetings...</p>
          </div>
        ) : filteredMeetings.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMeetings.map((meeting) => (
              <MeetingCard key={meeting.id} meeting={meeting} />
            ))}
          </div>
        ) : (
          <EmptyMeetings 
            searchQuery={searchQuery} 
            onCreateMeeting={handleCreateMeeting} 
          />
        )}
      </div>
    </Layout>
  );
};

export default Meetings;
