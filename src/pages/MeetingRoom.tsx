
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import useMeetingMedia from "@/hooks/useMeetingMedia";
import VideoDisplay from "@/components/meeting/VideoDisplay";
import MeetingControls from "@/components/meeting/MeetingControls";
import MeetingSidebar from "@/components/meeting/MeetingSidebar";
import MeetingMobileDialogs from "@/components/meeting/MeetingMobileDialogs";

const MeetingRoom = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [isParticipantListOpen, setIsParticipantListOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"participants" | "chat">("participants");
  const [messages, setMessages] = useState<Array<{sender: string, text: string, time: string}>>([]);
  const [participants, setParticipants] = useState<Array<{id: string, name: string}>>([]);
  const [meeting, setMeeting] = useState<any>(null);
  
  const {
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    localVideoRef,
    screenVideoRef,
    toggleAudio,
    toggleVideo,
    toggleScreenShare
  } = useMeetingMedia();
  
  // Check authentication and fetch meeting
  useEffect(() => {
    if (!user) {
      toast.error("Please sign in to join the meeting");
      navigate("/auth");
      return;
    }
    
    const fetchMeeting = async () => {
      try {
        const { data, error } = await supabase
          .from("meetings")
          .select("*")
          .eq("meeting_id", meetingId)
          .single();
          
        if (error || !data) {
          toast.error("Meeting not found");
          navigate("/");
          return;
        }
        
        setMeeting(data);
        
        // Insert attendance record
        await supabase
          .from("attendance")
          .insert([{
            meeting_id: data.id,
            user_id: user.id,
            join_time: new Date().toISOString()
          }])
          .select();
          
      } catch (error) {
        console.error("Error fetching meeting:", error);
        toast.error("Error loading meeting details");
      }
    };
    
    fetchMeeting();
  }, [meetingId, user, navigate]);

  // Setup real-time listener for meeting participants
  useEffect(() => {
    if (!meeting) return;
    
    // Fetch current participants
    const fetchParticipants = async () => {
      try {
        const { data, error } = await supabase
          .from("attendance")
          .select("user_id, leave_time, profiles:user_id(username, full_name)")
          .eq("meeting_id", meeting.id)
          .is("leave_time", null); // Only active participants (not left)
          
        if (error) throw error;
        
        // Filter out current user and map to format needed by components
        const activeParticipants = data
          .filter(p => p.user_id !== user?.id) // Don't include current user
          .map(p => ({
            id: p.user_id,
            name: p.profiles.username || p.profiles.full_name || "Anonymous User"
          }));
          
        setParticipants(activeParticipants);
      } catch (error) {
        console.error("Error fetching participants:", error);
      }
    };
    
    fetchParticipants();
    
    // Set up realtime subscription for attendance changes
    const channel = supabase
      .channel('public:attendance')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'attendance',
        filter: `meeting_id=eq.${meeting.id}`
      }, () => {
        // When attendance changes, refresh participants
        fetchParticipants();
      })
      .subscribe();
      
    // Record leave time when leaving the meeting
    return () => {
      if (user && meeting) {
        const updateAttendance = async () => {
          try {
            await supabase
              .from("attendance")
              .update({
                leave_time: new Date().toISOString()
              })
              .eq("meeting_id", meeting.id)
              .eq("user_id", user.id)
              .is("leave_time", null);
          } catch (error) {
            console.error("Error updating attendance record:", error);
          }
        };
        
        updateAttendance();
      }
      
      // Clean up the subscription
      supabase.removeChannel(channel);
    };
  }, [meeting, user]);

  const handleTabChange = (tab: "participants" | "chat") => {
    setActiveTab(tab);
    if (tab === "participants") {
      setIsParticipantListOpen(true);
      setIsChatOpen(false);
    } else {
      setIsChatOpen(true);
      setIsParticipantListOpen(false);
    }
  };

  const endCall = () => {
    // Update attendance record when ending the call
    if (user && meeting) {
      const updateAttendance = async () => {
        try {
          await supabase
            .from("attendance")
            .update({
              leave_time: new Date().toISOString()
            })
            .eq("meeting_id", meeting.id)
            .eq("user_id", user.id)
            .is("leave_time", null);
        } catch (error) {
          console.error("Error updating attendance record:", error);
        }
      };
      
      updateAttendance();
    }
    
    navigate("/meetings");
  };

  if (!user || !meeting) {
    return (
      <Layout className="bg-zoom-gray">
        <div className="container mx-auto px-4 py-6 flex flex-col h-[calc(100vh-4rem)]">
          <div className="flex items-center justify-center h-full">
            <p>Loading meeting...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout className="bg-zoom-gray">
      <div className="container mx-auto px-4 py-6 flex flex-col h-[calc(100vh-4rem)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-semibold">{meeting.title || `Meeting: ${meetingId}`}</h1>
            <p className="text-sm text-muted-foreground">
              {new Date(meeting.created_at).toLocaleDateString()} · {participants.length + 1} participants
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success("Meeting link copied to clipboard");
              }}
            >
              Copy meeting link
            </Button>
          </div>
        </div>

        <div className="flex-grow flex gap-4 overflow-hidden">
          {/* Main content: video grid */}
          <div className={cn(
            "flex-grow overflow-y-auto",
            (isParticipantListOpen || isChatOpen) ? "lg:pr-[320px]" : ""
          )}>
            <VideoDisplay 
              isScreenSharing={isScreenSharing}
              isVideoEnabled={isVideoEnabled}
              localVideoRef={localVideoRef}
              screenVideoRef={screenVideoRef}
              participants={participants}
            />
          </div>

          {/* Side panels (participants list and chat) */}
          <MeetingSidebar 
            isOpen={isParticipantListOpen || isChatOpen}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            participants={participants}
            meeting={meeting}
            messages={messages}
            setMessages={setMessages}
            onTabChange={handleTabChange}
          />
        </div>

        {/* Mobile dialogs */}
        <MeetingMobileDialogs 
          isChatOpen={isChatOpen}
          isParticipantListOpen={isParticipantListOpen}
          onChatOpenChange={(open) => setIsChatOpen(open)}
          onParticipantListOpenChange={(open) => setIsParticipantListOpen(open)}
          participants={participants}
          meeting={meeting}
          messages={messages}
          setMessages={setMessages}
        />

        {/* Control bar */}
        <MeetingControls 
          isAudioEnabled={isAudioEnabled}
          isVideoEnabled={isVideoEnabled}
          isScreenSharing={isScreenSharing}
          isParticipantListOpen={isParticipantListOpen}
          isChatOpen={isChatOpen}
          toggleAudio={toggleAudio}
          toggleVideo={toggleVideo}
          toggleScreenShare={toggleScreenShare}
          toggleParticipantList={setIsParticipantListOpen}
          toggleChat={setIsChatOpen}
          endCall={endCall}
        />
      </div>
    </Layout>
  );
};

export default MeetingRoom;
