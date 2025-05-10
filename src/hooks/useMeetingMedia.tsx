
import { useRef, useState, useEffect } from "react";
import { toast } from "sonner";

const useMeetingMedia = () => {
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const streamAttempted = useRef(false);

  // Setup camera access
  useEffect(() => {
    let mounted = true;
    
    const initializeMediaDevices = async () => {
      // Avoid repeated attempts if already tried
      if (streamAttempted.current) return;
      streamAttempted.current = true;
      
      try {
        console.log("Initializing media devices...");
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          // Stop any existing streams first to prevent duplicate streams
          if (mediaStream) {
            console.log("Stopping existing media stream tracks");
            mediaStream.getTracks().forEach(track => track.stop());
          }
          
          // Request access to media devices with both video and audio
          console.log("Requesting camera and microphone access...");
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: true, 
            audio: true 
          });
          
          if (!mounted) {
            console.log("Component unmounted, stopping newly created stream");
            stream.getTracks().forEach(track => track.stop());
            return;
          }
          
          console.log("Media stream created successfully:", stream.id);
          console.log("Audio tracks:", stream.getAudioTracks().length);
          console.log("Video tracks:", stream.getVideoTracks().length);
          
          setMediaStream(stream);
          
          // Associate the stream with the video element
          if (localVideoRef.current) {
            console.log("Setting stream to local video ref");
            localVideoRef.current.srcObject = stream;
            
            // Ensure tracks are enabled based on state
            stream.getVideoTracks().forEach(track => {
              track.enabled = isVideoEnabled;
            });
            
            stream.getAudioTracks().forEach(track => {
              track.enabled = isAudioEnabled;
            });
          }
        }
      } catch (err: any) {
        console.error("Error accessing media devices:", err);
        
        // Provide more specific error messages
        if (err.name === "NotAllowedError") {
          toast.error("Camera and microphone access denied. Please allow access in your browser settings.");
        } else if (err.name === "NotFoundError") {
          toast.error("No camera or microphone found. Please connect devices and try again.");
        } else {
          toast.error("Unable to access camera and microphone: " + (err.message || "Unknown error"));
        }
        
        // Try to get at least audio if video fails
        try {
          console.log("Attempting audio-only fallback...");
          const audioOnlyStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          if (!mounted) {
            audioOnlyStream.getTracks().forEach(track => track.stop());
            return;
          }
          
          console.log("Audio-only stream created successfully");
          setMediaStream(audioOnlyStream);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = audioOnlyStream;
          }
          setIsVideoEnabled(false);
          toast.info("Continuing with audio only");
        } catch (audioErr) {
          console.error("Could not get audio-only access:", audioErr);
          toast.error("Failed to access microphone. Please check your device settings.");
        }
      }
    };

    initializeMediaDevices();

    // Clean up on unmount
    return () => {
      mounted = false;
      if (mediaStream) {
        console.log("Cleaning up media stream");
        mediaStream.getTracks().forEach(track => {
          console.log(`Stopping track: ${track.kind}, enabled: ${track.enabled}`);
          track.stop();
        });
      }
      if (screenStream) {
        console.log("Cleaning up screen sharing stream");
        screenStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Handle audio toggle
  const toggleAudio = () => {
    console.log("Toggling audio:", !isAudioEnabled);
    if (mediaStream) {
      const audioTracks = mediaStream.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !isAudioEnabled;
        console.log(`Audio track ${track.id} enabled: ${track.enabled}`);
      });
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  // Handle video toggle
  const toggleVideo = () => {
    console.log("Toggling video:", !isVideoEnabled);
    if (mediaStream) {
      const videoTracks = mediaStream.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = !isVideoEnabled;
        console.log(`Video track ${track.id} enabled: ${track.enabled}`);
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  // Handle screen sharing
  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      // Start screen sharing
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        try {
          console.log("Requesting screen sharing access...");
          const stream = await navigator.mediaDevices.getDisplayMedia({ 
            video: true,
            audio: false
          });
          
          console.log("Screen sharing stream created successfully");
          setScreenStream(stream);
          
          if (screenVideoRef.current) {
            screenVideoRef.current.srcObject = stream;
            setIsScreenSharing(true);
            
            // Listen for when user stops screen sharing
            const track = stream.getVideoTracks()[0];
            track.onended = () => {
              console.log("Screen sharing stopped by user");
              setIsScreenSharing(false);
              setScreenStream(null);
              if (screenVideoRef.current) {
                screenVideoRef.current.srcObject = null;
              }
            };
          }
        } catch (err) {
          console.error("Error sharing screen:", err);
          toast.error("Unable to share screen");
        }
      }
    } else {
      // Stop screen sharing
      console.log("Stopping screen sharing");
      if (screenStream) {
        screenStream.getTracks().forEach(track => {
          track.stop();
        });
        setScreenStream(null);
      }
      
      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = null;
      }
      setIsScreenSharing(false);
    }
  };

  // Re-attempt media access if initial attempt failed
  const retryMediaAccess = async () => {
    console.log("Retrying media access...");
    streamAttempted.current = false;
    
    // Stop any existing streams
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }
    
    // Re-initialize media devices
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      setMediaStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        
        // Ensure tracks are enabled based on state
        stream.getVideoTracks().forEach(track => {
          track.enabled = isVideoEnabled;
        });
        
        stream.getAudioTracks().forEach(track => {
          track.enabled = isAudioEnabled;
        });
      }
      
      toast.success("Media access restored");
    } catch (err) {
      console.error("Error retrying media access:", err);
      toast.error("Failed to restore media access. Please check permissions.");
    }
  };

  return {
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    localVideoRef,
    screenVideoRef,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    mediaStream,
    retryMediaAccess
  };
};

export default useMeetingMedia;
