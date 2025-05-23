
import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { cn } from "@/lib/utils";
import useMeetingMedia from "@/hooks/useMeetingMedia";
import { useMeetingData } from "@/hooks/useMeetingData";
import { useMeetingUI } from "@/hooks/useMeetingUI";
import { useWebRTC } from "@/hooks/useWebRTC";
import VideoDisplay from "@/components/meeting/VideoDisplay";
import MeetingControls from "@/components/meeting/MeetingControls";
import MeetingSidebar from "@/components/meeting/MeetingSidebar";
import MeetingMobileDialogs from "@/components/meeting/MeetingMobileDialogs";
import MeetingHeader from "@/components/meeting/MeetingHeader";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const MeetingRoom = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const {
    meeting,
    participants,
    messages,
    setMessages,
    leaveAttendance
  } = useMeetingData(meetingId);
  
  const {
    isParticipantListOpen,
    setIsParticipantListOpen,
    isChatOpen,
    setIsChatOpen,
    activeTab,
    setActiveTab,
    handleTabChange
  } = useMeetingUI();
  
  const {
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    localVideoRef,
    screenVideoRef,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    mediaStream,
    retryMediaAccess
  } = useMeetingMedia();

  // Use the WebRTC hook to establish peer connections
  const { participantStreams, connectionStates } = useWebRTC(meetingId, user, mediaStream);

  // Track media connection issues and provide helpful messaging
  useEffect(() => {
    if (mediaStream === null) {
      toast.warning(
        "Media access not available", 
        { 
          description: "Please check your camera and microphone permissions.", 
          duration: 5000,
          action: {
            label: "Retry",
            onClick: retryMediaAccess
          }
        }
      );
    }
  }, [mediaStream, retryMediaAccess]);

  // Track WebRTC connection issues with improved messaging
  useEffect(() => {
    if (mediaStream && participants.length > 0) {
      const connectedCount = Array.from(connectionStates.values()).filter(
        state => state === 'connected'
      ).length;
      
      if (connectedCount === 0 && participants.length > 0) {
        toast.warning(
          "Connection issues detected", 
          { 
            description: "Having trouble connecting to other participants.", 
            duration: 5000,
            action: {
              label: "Retry",
              onClick: retryMediaAccess
            }
          }
        );
      }
    }
  }, [connectionStates, participants.length, mediaStream, retryMediaAccess]);

  // Handle reconnection attempts for browser permission changes
  const handleRetryMedia = () => {
    toast.info("Attempting to reconnect media devices...");
    retryMediaAccess();
  };

  const endCall = async () => {
    await leaveAttendance();
    navigate("/meetings");
  };

  // Show loading state if meeting data is not yet loaded
  if (!meeting) {
    return (
      <Layout className="bg-zoom-gray">
        <div className="container mx-auto px-4 py-6 flex flex-col h-[calc(100vh-4rem)]">
          <div className="flex items-center justify-center h-full">
            <p className="text-lg">Loading meeting...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout className="bg-zoom-gray">
      <div className="container mx-auto px-4 py-6 flex flex-col h-[calc(100vh-4rem)]">
        <MeetingHeader 
          title={meeting.title || `Meeting: ${meetingId}`}
          createdAt={meeting.created_at}
          participantCount={participants.length + 1}
        />

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
              participantStreams={participantStreams}
              connectionStates={connectionStates}
              onRetryMedia={handleRetryMedia}
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

        {/* Control bar with improved media controls */}
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
