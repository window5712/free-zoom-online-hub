
import React from "react";
import { cn } from "@/lib/utils";
import { MicOff } from "lucide-react";

interface MeetingParticipantProps {
  name: string;
  isAudioMuted?: boolean;
  className?: string;
  participantStream?: MediaStream;
  participantId?: string;
}

const MeetingParticipant = ({ 
  name, 
  isAudioMuted = true,
  participantStream,
  participantId,
  className 
}: MeetingParticipantProps) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const hasVideo = Boolean(participantStream);
  
  // Attach the stream to the video element when it changes
  React.useEffect(() => {
    if (participantStream && videoRef.current) {
      videoRef.current.srcObject = participantStream;
    }
  }, [participantStream]);

  return (
    <div className={cn("video-container", className)}>
      {hasVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
          data-participant-id={participantId}
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
