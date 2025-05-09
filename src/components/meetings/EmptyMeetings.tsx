
import React from "react";
import { Button } from "@/components/ui/button";
import { Video } from "lucide-react";

interface EmptyMeetingsProps {
  searchQuery: string;
  onCreateMeeting: () => void;
}

const EmptyMeetings: React.FC<EmptyMeetingsProps> = ({ searchQuery, onCreateMeeting }) => {
  return (
    <div className="text-center py-12">
      <div className="mb-4 rounded-full bg-zinc-100 p-3 w-12 h-12 flex items-center justify-center mx-auto">
        <Video className="h-6 w-6 text-zinc-500" />
      </div>
      <h3 className="text-lg font-medium mb-1">No meetings found</h3>
      <p className="text-muted-foreground mb-4">
        {searchQuery ? "Try a different search term" : "You haven't created any meetings yet"}
      </p>
      <Button onClick={onCreateMeeting} variant="default">
        Create a New Meeting
      </Button>
    </div>
  );
};

export default EmptyMeetings;
