
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" }
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
  const [connectionStates, setConnectionStates] = useState<Map<string, string>>(new Map());
  const channelRef = useRef<any>(null);
  
  // Track if we're already connected to a participant to avoid duplicate connections
  const connectedPeersRef = useRef<Set<string>>(new Set());
  
  // Function to create a new peer connection
  const createPeerConnection = useCallback(async (participantId: string, isInitiator: boolean) => {
    try {
      console.log(`Creating peer connection with ${participantId}, initiator: ${isInitiator}`);
      
      if (!localStream) {
        console.error("Local stream not available for peer connection");
        return null;
      }

      if (connectedPeersRef.current.has(participantId)) {
        console.log(`Already connected to ${participantId}, skipping duplicate connection`);
        return null;
      }

      // Create new RTCPeerConnection
      const peerConnection = new RTCPeerConnection(ICE_SERVERS);
      
      // Add connection to tracking set
      connectedPeersRef.current.add(participantId);
      
      // Update connection state when it changes
      peerConnection.onconnectionstatechange = () => {
        console.log(`Connection state with ${participantId}: ${peerConnection.connectionState}`);
        setConnectionStates(prev => {
          const newStates = new Map(prev);
          newStates.set(participantId, peerConnection.connectionState);
          return newStates;
        });
        
        // If connection failed or disconnected, remove from our tracking and try to reconnect
        if (peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'disconnected') {
          console.log(`Connection with ${participantId} ${peerConnection.connectionState}, cleaning up`);
          connectedPeersRef.current.delete(participantId);
          
          // Remove from participantStreams
          setParticipantStreams(prev => {
            const newStreams = new Map(prev);
            newStreams.delete(participantId);
            return newStreams;
          });
        }
      };
      
      // Add local stream tracks to the connection
      localStream.getTracks().forEach(track => {
        console.log(`Adding track to peer connection with ${participantId}:`, track.kind);
        peerConnection.addTrack(track, localStream);
      });

      // Set up ICE candidate handling
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log(`Generated ICE candidate for ${participantId}`);
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
      
      peerConnection.oniceconnectionstatechange = () => {
        console.log(`ICE connection state with ${participantId}: ${peerConnection.iceConnectionState}`);
      };

      // Handle incoming tracks
      peerConnection.ontrack = (event) => {
        console.log(`Received track from ${participantId}:`, event.track.kind);
        const stream = event.streams[0];
        if (stream) {
          console.log(`Setting stream for ${participantId}`);
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
          console.log(`Creating offer for ${participantId}`);
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
          console.error(`Error creating offer for ${participantId}:`, err);
          connectedPeersRef.current.delete(participantId);
          return null;
        }
      }

      return {
        id: participantId,
        connection: peerConnection,
        videoStream: null
      };
    } catch (err) {
      console.error(`Error creating peer connection with ${participantId}:`, err);
      connectedPeersRef.current.delete(participantId);
      return null;
    }
  }, [localStream, user]);

  // Process an SDP offer from a remote peer
  const processOffer = useCallback(async (data: any) => {
    const { sender, sdp } = data;
    console.log(`Received offer from ${sender}`);
    
    try {
      // Find existing connection or create new one
      let peerConn = peerConnections.find(pc => pc.id === sender);
      
      if (!peerConn) {
        const newConn = await createPeerConnection(sender, false);
        if (!newConn) {
          console.error(`Failed to create peer connection for ${sender}`);
          return;
        }
        
        peerConn = newConn;
        setPeerConnections(prev => [...prev, newConn]);
      }

      // Set the remote description using the offer
      await peerConn.connection.setRemoteDescription(new RTCSessionDescription(sdp));
      console.log(`Set remote description for ${sender}`);
      
      // Create and send an answer
      const answer = await peerConn.connection.createAnswer();
      await peerConn.connection.setLocalDescription(answer);
      console.log(`Created and set local answer for ${sender}`);
      
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
      console.log(`Sent answer to ${sender}`);
    } catch (err) {
      console.error(`Error processing offer from ${sender}:`, err);
      connectedPeersRef.current.delete(sender);
    }
  }, [peerConnections, createPeerConnection, user]);

  // Process an SDP answer from a remote peer
  const processAnswer = useCallback(async (data: any) => {
    const { sender, sdp } = data;
    console.log(`Received answer from ${sender}`);
    
    try {
      const peerConn = peerConnections.find(pc => pc.id === sender);
      if (peerConn) {
        await peerConn.connection.setRemoteDescription(new RTCSessionDescription(sdp));
        console.log(`Set remote description (answer) for ${sender}`);
      } else {
        console.warn(`Received answer from ${sender} but no connection exists`);
      }
    } catch (err) {
      console.error(`Error processing answer from ${sender}:`, err);
    }
  }, [peerConnections]);

  // Process an ICE candidate from a remote peer
  const processIceCandidate = useCallback(async (data: any) => {
    const { sender, candidate } = data;
    console.log(`Received ICE candidate from ${sender}`);
    
    try {
      const peerConn = peerConnections.find(pc => pc.id === sender);
      if (peerConn) {
        await peerConn.connection.addIceCandidate(new RTCIceCandidate(candidate));
        console.log(`Added ICE candidate for ${sender}`);
      } else {
        console.warn(`Received ICE candidate from ${sender} but no connection exists`);
      }
    } catch (err) {
      console.error(`Error adding ICE candidate from ${sender}:`, err);
    }
  }, [peerConnections]);

  // Set up realtime channel for WebRTC signaling when meeting and user are available
  useEffect(() => {
    if (!meetingId || !user) {
      console.log("Meeting ID or user not available, skipping WebRTC setup");
      return;
    }
    
    console.log(`Setting up WebRTC channel for meeting ${meetingId}`);
    
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
        console.log("New participants joined:", newPresences);
        
        // Don't try to create connections until we have a local stream
        if (!localStream) {
          console.log("Local stream not ready yet, will connect when stream is available");
          return;
        }
        
        newPresences.forEach(async (presence: any) => {
          if (presence.user_id !== user.id) {
            console.log(`New participant joined: ${presence.user_id}, initiating connection`);
            const newConn = await createPeerConnection(presence.user_id, true);
            if (newConn) {
              setPeerConnections(prev => [...prev, newConn]);
            }
          }
        });
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log("Participants left:", leftPresences);
        leftPresences.forEach((presence: any) => {
          // Close connection when participant leaves
          const leavingId = presence.user_id;
          console.log(`Participant left: ${leavingId}, cleaning up connection`);
          
          setPeerConnections(prev => {
            const conn = prev.find(p => p.id === leavingId);
            if (conn) {
              console.log(`Closing connection with ${leavingId}`);
              conn.connection.close();
              connectedPeersRef.current.delete(leavingId);
            }
            return prev.filter(p => p.id !== leavingId);
          });
          
          setParticipantStreams(prev => {
            const newMap = new Map(prev);
            newMap.delete(leavingId);
            return newMap;
          });
          
          setConnectionStates(prev => {
            const newMap = new Map(prev);
            newMap.delete(leavingId);
            return newMap;
          });
        });
      })
      .subscribe(async (status) => {
        console.log(`Channel subscribe status: ${status}`);
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
          console.log("Tracking presence for", user.id);
          channelRef.current = channel;
        }
      });

    return () => {
      // Clean up all connections when component unmounts
      console.log("Cleaning up WebRTC connections");
      peerConnections.forEach(conn => {
        conn.connection.close();
      });
      setPeerConnections([]);
      setParticipantStreams(new Map());
      setConnectionStates(new Map());
      connectedPeersRef.current.clear();
      
      console.log("Removing Supabase channel");
      supabase.removeChannel(channel);
    };
  }, [meetingId, user, processOffer, processAnswer, processIceCandidate]);

  // Connect to existing participants when local stream becomes available
  useEffect(() => {
    const initializeExistingConnections = async () => {
      if (!channelRef.current || !user) {
        console.log("Channel or user not ready yet");
        return;
      }
      
      console.log("Local stream is now available, connecting to existing participants");
      
      try {
        const presenceState = channelRef.current.presenceState();
        console.log("Current presence state:", presenceState);
        
        const existingParticipants = Object.values(presenceState || {}).flat() as any[];
        
        for (const participant of existingParticipants) {
          if (participant.user_id !== user.id && !connectedPeersRef.current.has(participant.user_id)) {
            console.log(`Connecting to existing participant: ${participant.user_id}`);
            const newConn = await createPeerConnection(participant.user_id, true);
            if (newConn) {
              setPeerConnections(prev => [...prev, newConn]);
            }
          }
        }
      } catch (err) {
        console.error("Error connecting to existing participants:", err);
      }
    };
    
    if (localStream) {
      console.log("Local stream is now available");
      initializeExistingConnections();
    }
  }, [localStream, user, createPeerConnection]);

  // Return the participant streams and connection states
  return { 
    participantStreams,
    connectionStates
  };
};
