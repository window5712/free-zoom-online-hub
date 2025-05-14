
import React from "react";
import { cn } from "@/lib/utils";
import MeetingParticipant from "@/components/MeetingParticipant";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface VideoDisplayProps {
  isScreenSharing: boolean;
  isVideoEnabled: boolean;
  localVideoRef: React.RefObject<HTMLVideoElement>;
  screenVideoRef: React.RefObject<HTMLVideoElement>;
  participants: Array<{id: string, name: string}>;
  participantStreams: Map<string, MediaStream>;
  connectionStates?: Map<string, string>;
  onRetryMedia?: () => void;
}

const VideoDisplay: React.FC<VideoDisplayProps> = ({
  isScreenSharing,
  isVideoEnabled,
  localVideoRef,
  screenVideoRef,
  participants,
  participantStreams,
  connectionStates = new Map(),
  onRetryMedia,
}) => {
  const { user, profile } = useAuth();

  // Calculate grid columns based on number of participants
  const totalParticipants = participants.length + 1; // +1 for the current user
  const gridColsClass = totalParticipants <= 1 
    ? "grid-cols-1" 
    : totalParticipants <= 4 
      ? "grid-cols-2" 
      : "grid-cols-3";

  // Count online and connecting participants
  const onlineParticipants = Array.from(connectionStates.values()).filter(
    state => state === 'connected'
  ).length;

  return (
    <div className="flex flex-col h-full">
      {/* Screen share video */}
      {isScreenSharing && (
        <div className="video-container w-full mb-4 border border-gray-300 rounded-lg overflow-hidden">
          <AspectRatio ratio={16 / 9}>
            <video 
              ref={screenVideoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover" 
            />
          </AspectRatio>
          <div className="absolute bottom-0 left-0 bg-black bg-opacity-50 text-white px-2 py-1 text-sm">
            Screen Share
          </div>
        </div>
      )}
      
      {/* Video grid */}
      <div className={cn(
        "grid gap-4 flex-grow", 
        isScreenSharing ? "h-1/3" : "h-full",
        gridColsClass
      )}>
        {/* User's video */}
        <MeetingParticipant
          name={profile?.username || user?.email || "You"}
          isAudioMuted={false} // We don't show our own mute status
          participantStream={localVideoRef.current?.srcObject as MediaStream}
          className="relative"
          connectionState="connected" // Always show our own video as connected
        />
        
        {/* Participant videos */}
        {participants.map((participant) => (
          <MeetingParticipant 
            key={participant.id} 
            name={participant.name}
            participantStream={participantStreams.get(participant.id)}
            participantId={participant.id}
            connectionState={connectionStates.get(participant.id) || 'new'}
          />
        ))}
      </div>
      
      {/* If no participants have joined yet */}
      {participants.length === 0 && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="text-center p-4 bg-white bg-opacity-80 rounded-lg shadow-lg">
            <p className="text-lg font-medium text-gray-700">No other participants yet</p>
            <p className="text-sm text-gray-500 mt-2">Share the meeting link to invite others</p>
          </div>
        </div>
      )}
      
      {/* Connection status indicator */}
      {participants.length > 0 && (
        <div className="absolute top-4 left-4 z-10">
          <div className={cn(
            "text-sm px-3 py-1 rounded-full",
            onlineParticipants === participants.length 
              ? "bg-green-100 text-green-800 border border-green-200" 
              : "bg-yellow-100 text-yellow-800 border border-yellow-200"
          )}>
            {onlineParticipants} of {participants.length} connected
          </div>
        </div>
      )}
      
      {/* Connection retry button */}
      {onRetryMedia && (
        <div className="absolute top-4 right-4 z-10">
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={onRetryMedia}
            className="flex items-center gap-2"
          >
            <RefreshCcw size={14} />
            <span>Retry Connection</span>
          </Button>
        </div>
      )}
    </div>
  );
};

export default VideoDisplay;
