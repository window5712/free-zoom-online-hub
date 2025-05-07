
import React, { useRef } from "react";
import { cn } from "@/lib/utils";
import MeetingParticipant from "@/components/MeetingParticipant";
import { useAuth } from "@/context/AuthContext";

interface VideoDisplayProps {
  isScreenSharing: boolean;
  isVideoEnabled: boolean;
  localVideoRef: React.RefObject<HTMLVideoElement>;
  screenVideoRef: React.RefObject<HTMLVideoElement>;
  participants: Array<{id: string, name: string}>;
}

const VideoDisplay: React.FC<VideoDisplayProps> = ({
  isScreenSharing,
  isVideoEnabled,
  localVideoRef,
  screenVideoRef,
  participants,
}) => {
  const { user, profile } = useAuth();

  return (
    <div className="video-grid overflow-y-auto p-2">
      {/* Screen share video */}
      {isScreenSharing && (
        <div className="video-container col-span-full mb-4">
          <video ref={screenVideoRef} autoPlay muted className="w-full h-full object-cover" />
          <div className="participant-name">Screen Share</div>
        </div>
      )}
      
      {/* User's video */}
      <div className="video-container">
        <video 
          ref={localVideoRef} 
          autoPlay 
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
        />
      ))}
    </div>
  );
};

export default VideoDisplay;
