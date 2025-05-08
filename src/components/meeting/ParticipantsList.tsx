
import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/context/AuthContext";

interface ParticipantsListProps {
  participants: Array<{id: string, name: string}>;
  meeting: any;
}

const ParticipantsList: React.FC<ParticipantsListProps> = ({ participants, meeting }) => {
  const { user, profile } = useAuth();

  return (
    <ScrollArea className="h-[calc(100vh-14rem)]">
      <div className="p-4">
        <div className="text-sm font-medium mb-2">
          Participants ({participants.length ? participants.length + 1 : 1})
        </div>
        <div className="space-y-2">
          <div className="py-2 px-3 bg-zinc-100 rounded-sm flex items-center justify-between">
            <span>{profile?.username || user?.email || "You"} (You)</span>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
              {meeting?.created_by === user?.id ? "Host" : "Participant"}
            </span>
          </div>
          {participants.map((participant) => (
            <div key={participant.id} className="py-2 px-3 hover:bg-zinc-50 rounded-sm">
              {participant.name}
            </div>
          ))}
          {!participants.length && (
            <div className="py-2 px-3 text-gray-500 text-sm italic">
              No other participants have joined yet
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  );
};

export default ParticipantsList;
