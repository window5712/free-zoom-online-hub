
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ParticipantsList from "./ParticipantsList";
import MeetingChat from "./MeetingChat";

interface MeetingSidebarProps {
  isOpen: boolean;
  activeTab: "participants" | "chat";
  setActiveTab: (tab: "participants" | "chat") => void;
  participants: Array<{id: string, name: string}>;
  meeting: any;
  messages: Array<{sender: string, text: string, time: string}>;
  setMessages: React.Dispatch<React.SetStateAction<Array<{sender: string, text: string, time: string}>>>;
  onTabChange: (tab: "participants" | "chat") => void;
}

const MeetingSidebar: React.FC<MeetingSidebarProps> = ({
  isOpen,
  activeTab,
  participants,
  meeting,
  messages,
  setMessages,
  onTabChange,
}) => {
  if (!isOpen) return null;

  return (
    <div className="hidden lg:block w-[300px] bg-white rounded-md overflow-hidden shadow-md border">
      <Tabs defaultValue={activeTab} onValueChange={(value) => onTabChange(value as "participants" | "chat")} className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="participants">
            Participants
          </TabsTrigger>
          <TabsTrigger value="chat">
            Chat
          </TabsTrigger>
        </TabsList>
        <TabsContent value="participants" className="p-0">
          <ParticipantsList 
            participants={participants} 
            meeting={meeting} 
          />
        </TabsContent>
        <TabsContent value="chat" className="p-0 flex flex-col h-[calc(100vh-14rem)]">
          <MeetingChat 
            messages={messages} 
            setMessages={setMessages}
            participants={participants}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MeetingSidebar;
