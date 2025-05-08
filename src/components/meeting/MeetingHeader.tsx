
import React from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface MeetingHeaderProps {
  title: string;
  createdAt: string;
  participantCount: number;
}

const MeetingHeader: React.FC<MeetingHeaderProps> = ({ 
  title, 
  createdAt, 
  participantCount 
}) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h1 className="text-lg font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground">
          {new Date(createdAt).toLocaleDateString()} · {participantCount} participants
        </p>
      </div>
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            toast.success("Meeting link copied to clipboard");
          }}
        >
          Copy meeting link
        </Button>
      </div>
    </div>
  );
};

export default MeetingHeader;
