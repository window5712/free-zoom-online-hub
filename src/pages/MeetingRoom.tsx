
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { cn } from "@/lib/utils";
import useMeetingMedia from "@/hooks/useMeetingMedia";
import { useMeetingData } from "@/hooks/useMeetingData";
import { useMeetingUI } from "@/hooks/useMeetingUI";
import VideoDisplay from "@/components/meeting/VideoDisplay";
import MeetingControls from "@/components/meeting/MeetingControls";
import MeetingSidebar from "@/components/meeting/MeetingSidebar";
import MeetingMobileDialogs from "@/components/meeting/MeetingMobileDialogs";
import MeetingHeader from "@/components/meeting/MeetingHeader";

const MeetingRoom = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  
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
    toggleScreenShare
  } = useMeetingMedia();

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
            <p>Loading meeting...</p>
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
