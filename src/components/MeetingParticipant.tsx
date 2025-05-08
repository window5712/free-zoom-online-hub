
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { MicOff } from "lucide-react";

interface MeetingParticipantProps {
  name: string;
  isAudioMuted?: boolean;
  className?: string;
}

const MeetingParticipant = ({ 
  name, 
  isAudioMuted = true, // Default to muted for now
  className 
}: MeetingParticipantProps) => {
  const [hasVideo, setHasVideo] = useState(false); // Default to no video
  
  return (
    <div className={cn("video-container", className)}>
      {hasVideo ? (
        <img
          src={`https://i.pravatar.cc/300?u=${name}`}
          alt={`${name}'s video`}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-800">
          <div className="w-16 h-16 rounded-full bg-zoom-blue flex items-center justify-center text-white text-xl font-semibold">
            {name.charAt(0).toUpperCase()}
          </div>
        </div>
      )}
      <div className="participant-name flex items-center gap-1">
        {name}
        {isAudioMuted && <MicOff size={14} className="opacity-80" />}
      </div>
    </div>
  );
};

export default MeetingParticipant;
