
import React, { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Participant, Message } from "@/hooks/useMeetingData";

interface MeetingChatProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  participants: Participant[];
}

const MeetingChat: React.FC<MeetingChatProps> = ({ messages, setMessages, participants }) => {
  const [newMessage, setNewMessage] = useState("");
  const { user, profile } = useAuth();

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const message = {
      sender: profile?.username || user?.email || "You",
      text: newMessage,
      time
    };
    
    setMessages([...messages, message]);
    setNewMessage("");
  };
  
  return (
    <>
      <ScrollArea className="flex-grow p-4">
        <div className="space-y-3">
          {messages.length === 0 ? (
            <p className="text-center text-zinc-400 my-8 text-sm">
              No messages yet. Start a conversation!
            </p>
          ) : (
            messages.map((message, idx) => (
              <div key={idx} className={cn(
                "p-3 rounded-lg max-w-[80%]",
                message.sender === (profile?.username || user?.email || "You")
                  ? "bg-zoom-blue text-white ml-auto" 
                  : "bg-zinc-100"
              )}>
                <div className="flex justify-between items-baseline mb-1">
                  <span className="font-medium text-xs">
                    {message.sender === (profile?.username || user?.email || "You") ? "You" : message.sender}
                  </span>
                  <span className="text-xs opacity-70">{message.time}</span>
                </div>
                <p className="text-sm">{message.text}</p>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
      <div className="p-4 border-t">
        <form onSubmit={sendMessage} className="flex items-center gap-2">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-grow"
          />
          <Button type="submit" size="sm">Send</Button>
        </form>
      </div>
    </>
  );
};

export default MeetingChat;
