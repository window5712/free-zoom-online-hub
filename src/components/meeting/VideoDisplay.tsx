
import React from "react";
import { cn } from "@/lib/utils";
import MeetingParticipant from "@/components/MeetingParticipant";
import { useAuth } from "@/context/AuthContext";

interface VideoDisplayProps {
  isScreenSharing: boolean;
  isVideoEnabled: boolean;
  localVideoRef: React.RefObject<HTMLVideoElement>;
  screenVideoRef: React.RefObject<HTMLVideoElement>;
  participants: Array<{id: string, name: string}>;
  participantStreams: Map<string, MediaStream>;
}

const VideoDisplay: React.FC<VideoDisplayProps> = ({
  isScreenSharing,
  isVideoEnabled,
  localVideoRef,
  screenVideoRef,
  participants,
  participantStreams,
}) => {
  const { user, profile } = useAuth();

  return (
    <div className="video-grid overflow-y-auto p-2">
      {/* Screen share video */}
      {isScreenSharing && (
        <div className="video-container col-span-full mb-4">
          <video ref={screenVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          <div className="participant-name">Screen Share</div>
        </div>
      )}
      
      {/* User's video */}
      <div className="video-container">
        <video 
          ref={localVideoRef} 
          autoPlay 
          playsInline
          muted 
          className={cn("w-full h-full object-cover", !isVideoEnabled && "hidden")}
        />
        {!isVideoEnabled && (
          <div className="w-full h-full flex items-center justify-center bg-gray-800">
            <div className="w-16 h-16 rounded-full bg-zoom-blue flex items-center justify-center text-white text-xl font-semibold">
              {profile?.username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'Y'}
            </div>
          </div>
        )}
        <div className="participant-name">
          {profile?.username || user?.email || "You"} {!isVideoEnabled && "(Camera Off)"}
        </div>
      </div>
      
      {/* Participant videos */}
      {participants.map((participant) => (
        <MeetingParticipant 
          key={participant.id} 
          name={participant.name}
          participantStream={participantStreams.get(participant.id)}
          participantId={participant.id}
        />
      ))}
      
      {/* If no participants have joined yet */}
      {participants.length === 0 && (
        <div className="video-container flex items-center justify-center bg-gray-100">
          <div className="text-center p-4">
            <p className="text-lg font-medium text-gray-700">No other participants yet</p>
            <p className="text-sm text-gray-500 mt-2">Share the meeting link to invite others</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoDisplay;
