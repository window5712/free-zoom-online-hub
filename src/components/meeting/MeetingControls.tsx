
import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Mic, MicOff, Video, VideoOff, Phone, Users, MessageSquare, ScreenShare, ScreenShareOff } from "lucide-react";

interface MeetingControlsProps {
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  isParticipantListOpen: boolean;
  isChatOpen: boolean;
  toggleAudio: () => void;
  toggleVideo: () => void;
  toggleScreenShare: () => void;
  toggleParticipantList: (value: boolean) => void;
  toggleChat: (value: boolean) => void;
  endCall: () => void;
}

const MeetingControls: React.FC<MeetingControlsProps> = ({
  isAudioEnabled,
  isVideoEnabled,
  isScreenSharing,
  isParticipantListOpen,
  isChatOpen,
  toggleAudio,
  toggleVideo,
  toggleScreenShare,
  toggleParticipantList,
  toggleChat,
  endCall,
}) => {
  return (
    <div className="px-4 py-4 mt-4 bg-white rounded-lg shadow-md flex items-center justify-center gap-2 md:gap-4">
      <Button
        variant={isAudioEnabled ? "default" : "destructive"}
        size="icon"
        className="rounded-full w-12 h-12"
        onClick={toggleAudio}
      >
        {isAudioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
      </Button>
      <Button
        variant={isVideoEnabled ? "default" : "destructive"}
        size="icon"
        className="rounded-full w-12 h-12"
        onClick={toggleVideo}
      >
        {isVideoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
      </Button>
      <Button
        variant={isScreenSharing ? "secondary" : "default"}
        size="icon"
        className="rounded-full w-12 h-12"
        onClick={toggleScreenShare}
      >
        {isScreenSharing ? <ScreenShareOff size={20} /> : <ScreenShare size={20} />}
      </Button>
      <Button
        variant="outline"
        size="icon"
        className={cn(
          "rounded-full w-12 h-12",
          isParticipantListOpen && "bg-zinc-100"
        )}
        onClick={() => {
          toggleParticipantList(!isParticipantListOpen);
          toggleChat(false);
        }}
      >
        <Users size={20} />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className={cn(
          "rounded-full w-12 h-12",
          isChatOpen && "bg-zinc-100"
        )}
        onClick={() => {
          toggleChat(!isChatOpen);
          toggleParticipantList(false);
        }}
      >
        <MessageSquare size={20} />
      </Button>
      <Button
        variant="destructive"
        size="icon"
        className="rounded-full w-12 h-12"
        onClick={endCall}
      >
        <Phone size={20} className="rotate-135" />
      </Button>
    </div>
  );
};

export default MeetingControls;
