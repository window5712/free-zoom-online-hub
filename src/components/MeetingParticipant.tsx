
import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { MicOff, Wifi, WifiOff } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MeetingParticipantProps {
  name: string;
  isAudioMuted?: boolean;
  className?: string;
  participantStream?: MediaStream;
  participantId?: string;
  connectionState?: string;
}

const MeetingParticipant = ({ 
  name, 
  isAudioMuted = true,
  participantStream,
  participantId,
  connectionState = 'new',
  className 
}: MeetingParticipantProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasVideo = Boolean(participantStream);
  
  // Attach the stream to the video element when it changes
  useEffect(() => {
    if (participantStream && videoRef.current) {
      console.log(`Attaching stream for participant ${participantId || 'unknown'} to video element`);
      videoRef.current.srcObject = participantStream;
      
      // Handle errors in video playback
      const handleVideoError = (e: Event) => {
        console.error(`Video error for participant ${participantId}:`, e);
      };
      
      videoRef.current.addEventListener('error', handleVideoError);
      
      return () => {
        if (videoRef.current) {
          videoRef.current.removeEventListener('error', handleVideoError);
        }
      };
    }
  }, [participantStream, participantId]);

  // Get connection status information
  const isConnected = connectionState === 'connected';
  const isConnecting = connectionState === 'connecting' || connectionState === 'new';
  const isFailed = connectionState === 'failed' || connectionState === 'disconnected';
  
  // Check if video track is enabled
  const videoEnabled = participantStream && 
    participantStream.getVideoTracks().length > 0 && 
    participantStream.getVideoTracks()[0].enabled;

  return (
    <div className={cn(
      "relative rounded-lg overflow-hidden border", 
      isConnected ? "border-green-200" : isConnecting ? "border-yellow-200" : "border-red-200",
      className
    )}>
      <AspectRatio ratio={16 / 9}>
        {hasVideo ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
              data-participant-id={participantId}
            />
            {!videoEnabled && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-70">
                <div className="w-16 h-16 rounded-full bg-zoom-blue flex items-center justify-center text-white text-xl font-semibold">
                  {name.charAt(0).toUpperCase()}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-800">
            <div className="w-16 h-16 rounded-full bg-zoom-blue flex items-center justify-center text-white text-xl font-semibold">
              {name.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
      </AspectRatio>
      
      <div className="participant-info absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 flex justify-between items-center">
        <div className="flex items-center gap-1 text-sm">
          {name}
          {isAudioMuted && <MicOff size={14} className="opacity-80" />}
        </div>
        
        <div className="connection-status flex items-center">
          <TooltipProvider>
            {isFailed && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <WifiOff size={14} className="text-red-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Connection failed</p>
                </TooltipContent>
              </Tooltip>
            )}
            {isConnecting && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Wifi size={14} className="text-yellow-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Connecting...</p>
                </TooltipContent>
              </Tooltip>
            )}
            {isConnected && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Wifi size={14} className="text-green-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Connected</p>
                </TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
};

export default MeetingParticipant;
