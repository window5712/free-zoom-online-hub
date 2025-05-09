
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface MeetingsHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onCreateMeeting: () => void;
}

const MeetingsHeader: React.FC<MeetingsHeaderProps> = ({ 
  searchQuery, 
  setSearchQuery, 
  onCreateMeeting 
}) => {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Your Meetings</h1>
        <p className="text-muted-foreground">
          View your past and upcoming meetings
        </p>
      </div>
      <div className="w-full md:w-auto mt-4 md:mt-0 flex gap-2">
        <Input
          placeholder="Search meetings..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full md:w-[300px]"
        />
        <Button onClick={onCreateMeeting}>New Meeting</Button>
      </div>
    </div>
  );
};

export default MeetingsHeader;
