
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import MeetingChat from "./MeetingChat";
import ParticipantsList from "./ParticipantsList";

interface MeetingMobileDialogsProps {
  isChatOpen: boolean;
  isParticipantListOpen: boolean;
  onChatOpenChange: (open: boolean) => void;
  onParticipantListOpenChange: (open: boolean) => void;
  participants: Array<{id: string, name: string}>;
  meeting: any;
  messages: Array<{sender: string, text: string, time: string}>;
  setMessages: React.Dispatch<React.SetStateAction<Array<{sender: string, text: string, time: string}>>>;
}

const MeetingMobileDialogs: React.FC<MeetingMobileDialogsProps> = ({
  isChatOpen,
  isParticipantListOpen,
  onChatOpenChange,
  onParticipantListOpenChange,
  participants,
  meeting,
  messages,
  setMessages,
}) => {
  return (
    <>
      <Dialog 
        open={isChatOpen && window.innerWidth < 1024} 
        onOpenChange={onChatOpenChange}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Meeting Chat</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            <MeetingChat 
              messages={messages} 
              setMessages={setMessages}
              participants={participants}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog 
        open={isParticipantListOpen && window.innerWidth < 1024} 
        onOpenChange={onParticipantListOpenChange}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Meeting Participants</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            <ParticipantsList 
              participants={participants} 
              meeting={meeting} 
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MeetingMobileDialogs;
