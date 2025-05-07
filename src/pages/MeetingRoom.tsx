
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import { Mic, MicOff, Video, VideoOff, Phone, Users, MessageSquare, ScreenShare, ScreenShareOff } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import MeetingParticipant from "@/components/MeetingParticipant";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

const MeetingRoom = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isParticipantListOpen, setIsParticipantListOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{sender: string, text: string, time: string}>>([]);
  const [newMessage, setNewMessage] = useState("");
  const [participants, setParticipants] = useState<Array<{id: string, name: string}>>([]);
  const [meeting, setMeeting] = useState<any>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  
  // Check authentication and fetch meeting
  useEffect(() => {
    if (!user) {
      toast.error("Please sign in to join the meeting");
      navigate("/auth");
      return;
    }
    
    const fetchMeeting = async () => {
      try {
        const { data, error } = await supabase
          .from("meetings")
          .select("*")
          .eq("meeting_id", meetingId)
          .single();
          
        if (error || !data) {
          toast.error("Meeting not found");
          navigate("/");
          return;
        }
        
        setMeeting(data);
        
        // Insert attendance record
        await supabase
          .from("attendance")
          .insert([{
            meeting_id: data.id,
            user_id: user.id,
            join_time: new Date().toISOString()
          }])
          .select();
          
      } catch (error) {
        console.error("Error fetching meeting:", error);
        toast.error("Error loading meeting details");
      }
    };
    
    fetchMeeting();
  }, [meetingId, user, navigate]);

  // Mock participants for demo
  useEffect(() => {
    if (!user) return;
    
    const mockParticipants = [
      { id: "user-1", name: "Alex Johnson" },
      { id: "user-2", name: "Sarah Miller" },
      { id: "user-3", name: "Dave Wilson" },
    ];
    setParticipants([...mockParticipants]);

    // Setup camera access
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.error("Error accessing media devices:", err);
          toast.error("Unable to access camera and microphone");
        });
    }

    // Clean up on unmount
    return () => {
      // Record leave time when leaving the meeting
      if (user && meeting) {
        const updateAttendance = async () => {
          try {
            await supabase
              .from("attendance")
              .update({
                leave_time: new Date().toISOString()
              })
              .eq("meeting_id", meeting.id)
              .eq("user_id", user.id)
              .is("leave_time", null);
          } catch (error) {
            console.error("Error updating attendance record:", error);
          }
        };
        
        updateAttendance();
      }

      // Stop all media streams
      if (localVideoRef.current && localVideoRef.current.srcObject) {
        const tracks = (localVideoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
      if (screenVideoRef.current && screenVideoRef.current.srcObject) {
        const tracks = (screenVideoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [user, meeting]);

  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled);
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      const audioTracks = (localVideoRef.current.srcObject as MediaStream)
        .getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !isAudioEnabled;
      });
    }
  };

  const toggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled);
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      const videoTracks = (localVideoRef.current.srcObject as MediaStream)
        .getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = !isVideoEnabled;
      });
    }
  };

  const toggleScreenShare = () => {
    if (!isScreenSharing) {
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        navigator.mediaDevices
          .getDisplayMedia({ video: true })
          .then((stream) => {
            if (screenVideoRef.current) {
              screenVideoRef.current.srcObject = stream;
              setIsScreenSharing(true);
              
              // Listen for when user stops screen sharing
              const track = stream.getVideoTracks()[0];
              track.onended = () => {
                setIsScreenSharing(false);
                if (screenVideoRef.current) {
                  screenVideoRef.current.srcObject = null;
                }
              };
            }
          })
          .catch((err) => {
            console.error("Error sharing screen:", err);
            toast.error("Unable to share screen");
          });
      }
    } else {
      if (screenVideoRef.current && screenVideoRef.current.srcObject) {
        const tracks = (screenVideoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
        screenVideoRef.current.srcObject = null;
      }
      setIsScreenSharing(false);
    }
  };

  const endCall = () => {
    // Update attendance record when ending the call
    if (user && meeting) {
      const updateAttendance = async () => {
        try {
          await supabase
            .from("attendance")
            .update({
              leave_time: new Date().toISOString()
            })
            .eq("meeting_id", meeting.id)
            .eq("user_id", user.id)
            .is("leave_time", null);
        } catch (error) {
          console.error("Error updating attendance record:", error);
        }
      };
      
      updateAttendance();
    }
    
    navigate("/meetings");
  };

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
    
    // Mock response from another participant
    setTimeout(() => {
      const randomParticipant = participants[Math.floor(Math.random() * participants.length)];
      const responseTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const mockResponses = [
        "I agree with that point.",
        "Could you explain more?",
        "That's an interesting perspective.",
        "Let's move to the next topic.",
        "I have a question about that."
      ];
      const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
      
      setMessages(prevMessages => [...prevMessages, {
        sender: randomParticipant.name,
        text: randomResponse,
        time: responseTime
      }]);
    }, 2000 + Math.random() * 3000);
  };

  if (!user || !meeting) {
    return (
      <Layout className="bg-zoom-gray">
        <div className="container mx-auto px-4 py-6 flex flex-col h-[calc(100vh-4rem)]">
          <div className="flex items-center justify-center h-full">
            <p>Loading meeting...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout className="bg-zoom-gray">
      <div className="container mx-auto px-4 py-6 flex flex-col h-[calc(100vh-4rem)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-semibold">{meeting.title || `Meeting: ${meetingId}`}</h1>
            <p className="text-sm text-muted-foreground">
              {new Date(meeting.created_at).toLocaleDateString()} · {participants.length + 1} participants
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

        <div className="flex-grow flex gap-4 overflow-hidden">
          {/* Main content: video grid */}
          <div className={cn(
            "flex-grow video-grid overflow-y-auto p-2",
            (isParticipantListOpen || isChatOpen) ? "lg:pr-[320px]" : ""
          )}>
            {/* Screen share video */}
            {isScreenSharing && (
              <div className="video-container col-span-full mb-4">
                <video ref={screenVideoRef} autoPlay muted className="w-full h-full object-cover" />
                <div className="participant-name">Screen Share</div>
              </div>
            )}
            
            {/* Your video */}
            <div className="video-container">
              <video 
                ref={localVideoRef} 
                autoPlay 
                muted 
                className={cn("w-full h-full object-cover", !isVideoEnabled && "hidden")}
              />
              {!isVideoEnabled && (
                <div className="w-full h-full flex items-center justify-center bg-gray-800">
                  <div className="w-16 h-16 rounded-full bg-zoom-blue flex items-center justify-center text-white text-xl font-semibold">
                    {profile?.username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'Y'}
                  </div>
                </div>
              )}
              <div className="participant-name">
                {profile?.username || user?.email || "You"} {!isAudioEnabled && "(Muted)"}
              </div>
            </div>
            
            {/* Participant videos */}
            {participants.map((participant) => (
              <MeetingParticipant 
                key={participant.id} 
                name={participant.name} 
              />
            ))}
          </div>

          {/* Side panels (participants list and chat) */}
          {(isParticipantListOpen || isChatOpen) && (
            <div className="hidden lg:block w-[300px] bg-white rounded-md overflow-hidden shadow-md border">
              <Tabs defaultValue="participants" className="w-full">
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger 
                    value="participants" 
                    onClick={() => {
                      setIsParticipantListOpen(true);
                      setIsChatOpen(false);
                    }}
                  >
                    Participants
                  </TabsTrigger>
                  <TabsTrigger 
                    value="chat" 
                    onClick={() => {
                      setIsChatOpen(true);
                      setIsParticipantListOpen(false);
                    }}
                  >
                    Chat
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="participants" className="p-0">
                  <ScrollArea className="h-[calc(100vh-14rem)]">
                    <div className="p-4">
                      <div className="text-sm font-medium mb-2">
                        Participants ({participants.length + 1})
                      </div>
                      <div className="space-y-2">
                        <div className="py-2 px-3 bg-zinc-100 rounded-sm flex items-center justify-between">
                          <span>{profile?.username || user?.email || "You"} (You)</span>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                            {meeting.created_by === user.id ? "Host" : "Participant"}
                          </span>
                        </div>
                        {participants.map((participant) => (
                          <div key={participant.id} className="py-2 px-3 hover:bg-zinc-50 rounded-sm">
                            {participant.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="chat" className="p-0 flex flex-col h-[calc(100vh-14rem)]">
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
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>

        {/* Mobile dialog for participants/chat */}
        <Dialog 
          open={isChatOpen && window.innerWidth < 1024} 
          onOpenChange={(open) => {
            if (!open) setIsChatOpen(false);
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Meeting Chat</DialogTitle>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto p-4">
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
            </div>
            <form onSubmit={sendMessage} className="flex items-center gap-2">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-grow"
              />
              <Button type="submit" size="sm">Send</Button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog 
          open={isParticipantListOpen && window.innerWidth < 1024} 
          onOpenChange={(open) => {
            if (!open) setIsParticipantListOpen(false);
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Meeting Participants</DialogTitle>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto p-4">
              <div className="text-sm font-medium mb-2">
                Participants ({participants.length + 1})
              </div>
              <div className="space-y-2">
                <div className="py-2 px-3 bg-zinc-100 rounded-sm flex items-center justify-between">
                  <span>{profile?.username || user?.email || "You"} (You)</span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                    {meeting.created_by === user.id ? "Host" : "Participant"}
                  </span>
                </div>
                {participants.map((participant) => (
                  <div key={participant.id} className="py-2 px-3 hover:bg-zinc-50 rounded-sm">
                    {participant.name}
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Control bar */}
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
              setIsParticipantListOpen(!isParticipantListOpen);
              setIsChatOpen(false);
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
              setIsChatOpen(!isChatOpen);
              setIsParticipantListOpen(false);
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
      </div>
    </Layout>
  );
};

export default MeetingRoom;
