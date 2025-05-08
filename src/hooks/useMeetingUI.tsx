
import { useState } from "react";

export const useMeetingUI = () => {
  const [isParticipantListOpen, setIsParticipantListOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"participants" | "chat">("participants");

  const handleTabChange = (tab: "participants" | "chat") => {
    setActiveTab(tab);
    if (tab === "participants") {
      setIsParticipantListOpen(true);
      setIsChatOpen(false);
    } else {
      setIsChatOpen(true);
      setIsParticipantListOpen(false);
    }
  };

  return {
    isParticipantListOpen,
    setIsParticipantListOpen,
    isChatOpen,
    setIsChatOpen,
    activeTab,
    setActiveTab,
    handleTabChange
  };
};
