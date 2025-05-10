
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Participant } from "@/types/meetingTypes";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" }
  ]
};

export interface PeerConnection {
  id: string;
  connection: RTCPeerConnection;
  videoStream: MediaStream | null;
}

export const useWebRTC = (
  meetingId: string | undefined, 
  user: any | null, 
  localStream: MediaStream | null
) => {
  const [peerConnections, setPeerConnections] = useState<PeerConnection[]>([]);
  const [participantStreams, setParticipantStreams] = useState<Map<string, MediaStream>>(new Map());
  const channelRef = useRef<any>(null);

  // Function to create a new peer connection
  const createPeerConnection = async (participantId: string, isInitiator: boolean) => {
    try {
      if (!localStream) {
        console.error("Local stream not available");
        return null;
      }

      // Create new RTCPeerConnection
      const peerConnection = new RTCPeerConnection(ICE_SERVERS);
      
      // Add local stream tracks to the connection
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });

      // Set up ICE candidate handling
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          // Send ICE candidate through Supabase realtime
          channelRef.current?.send({
            type: 'broadcast',
            event: 'ice-candidate',
            payload: {
              sender: user?.id,
              recipient: participantId,
              candidate: event.candidate,
            },
          });
        }
      };

      // Handle incoming tracks
      peerConnection.ontrack = (event) => {
        const stream = event.streams[0];
        if (stream) {
          setParticipantStreams(prev => {
            const newMap = new Map(prev);
            newMap.set(participantId, stream);
            return newMap;
          });
        }
      };

      // If this peer is initiating the connection
      if (isInitiator) {
        try {
          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);
          
          // Send offer to remote peer through Supabase realtime
          channelRef.current?.send({
            type: 'broadcast',
            event: 'offer',
            payload: {
              sender: user?.id,
              recipient: participantId,
              sdp: peerConnection.localDescription,
            },
          });
        } catch (err) {
          console.error("Error creating offer:", err);
        }
      }

      return {
        id: participantId,
        connection: peerConnection,
        videoStream: null
      };
    } catch (err) {
      console.error("Error creating peer connection:", err);
      return null;
    }
  };

  // Process an SDP offer from a remote peer
  const processOffer = async (data: any) => {
    const { sender, sdp } = data;
    
    // Find existing connection or create new one
    let peerConn = peerConnections.find(pc => pc.id === sender);
    
    if (!peerConn) {
      const newConn = await createPeerConnection(sender, false);
      if (!newConn) return;
      
      peerConn = newConn;
      setPeerConnections(prev => [...prev, newConn]);
    }

    try {
      await peerConn.connection.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await peerConn.connection.createAnswer();
      await peerConn.connection.setLocalDescription(answer);
      
      // Send answer back to the peer that sent the offer
      channelRef.current?.send({
        type: 'broadcast',
        event: 'answer',
        payload: {
          sender: user?.id,
          recipient: sender,
          sdp: peerConn.connection.localDescription,
        },
      });
    } catch (err) {
      console.error("Error processing offer:", err);
    }
  };

  // Process an SDP answer from a remote peer
  const processAnswer = async (data: any) => {
    const { sender, sdp } = data;
    
    const peerConn = peerConnections.find(pc => pc.id === sender);
    if (peerConn) {
      try {
        await peerConn.connection.setRemoteDescription(new RTCSessionDescription(sdp));
      } catch (err) {
        console.error("Error processing answer:", err);
      }
    }
  };

  // Process an ICE candidate from a remote peer
  const processIceCandidate = async (data: any) => {
    const { sender, candidate } = data;
    
    const peerConn = peerConnections.find(pc => pc.id === sender);
    if (peerConn) {
      try {
        await peerConn.connection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("Error adding ICE candidate:", err);
      }
    }
  };

  // Set up realtime channel for WebRTC signaling when meeting and user are available
  useEffect(() => {
    if (!meetingId || !user || !localStream) return;

    // Subscribe to meeting signaling channel
    const channel = supabase
      .channel(`webrtc-${meetingId}`)
      .on('broadcast', { event: 'offer' }, (payload) => {
        if (payload.payload.recipient === user.id) {
          processOffer(payload.payload);
        }
      })
      .on('broadcast', { event: 'answer' }, (payload) => {
        if (payload.payload.recipient === user.id) {
          processAnswer(payload.payload);
        }
      })
      .on('broadcast', { event: 'ice-candidate' }, (payload) => {
        if (payload.payload.recipient === user.id) {
          processIceCandidate(payload.payload);
        }
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        newPresences.forEach(async (presence: any) => {
          if (presence.user_id !== user.id) {
            // New participant joined, initiate connection
            const newConn = await createPeerConnection(presence.user_id, true);
            if (newConn) {
              setPeerConnections(prev => [...prev, newConn]);
            }
          }
        });
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        leftPresences.forEach((presence: any) => {
          // Close connection when participant leaves
          const leavingId = presence.user_id;
          setPeerConnections(prev => {
            const conn = prev.find(p => p.id === leavingId);
            if (conn) {
              conn.connection.close();
            }
            return prev.filter(p => p.id !== leavingId);
          });
          
          setParticipantStreams(prev => {
            const newMap = new Map(prev);
            newMap.delete(leavingId);
            return newMap;
          });
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
          channelRef.current = channel;
        }
      });

    return () => {
      // Clean up all connections when component unmounts
      peerConnections.forEach(conn => {
        conn.connection.close();
      });
      setPeerConnections([]);
      setParticipantStreams(new Map());
      
      supabase.removeChannel(channel);
    };
  }, [meetingId, user, localStream]);

  // Connect to existing participants when joining
  useEffect(() => {
    const initializeExistingConnections = async () => {
      if (channelRef.current && user) {
        const presenceState = channelRef.current.presenceState();
        const existingParticipants = Object.values(presenceState).flat() as any[];
        
        for (const participant of existingParticipants) {
          if (participant.user_id !== user.id) {
            const newConn = await createPeerConnection(participant.user_id, true);
            if (newConn) {
              setPeerConnections(prev => [...prev, newConn]);
            }
          }
        }
      }
    };
    
    if (localStream) {
      initializeExistingConnections();
    }
  }, [localStream, user]);

  return { participantStreams };
};
