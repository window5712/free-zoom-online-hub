
import { useRef, useState, useEffect } from "react";
import { toast } from "sonner";

const useMeetingMedia = () => {
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  // Setup camera access
  useEffect(() => {
    let mounted = true;
    
    const initializeMediaDevices = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          // Stop any existing streams first to prevent duplicate streams
          if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
          }
          
          // Request access to media devices with both video and audio
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: true, 
            audio: true 
          });
          
          if (!mounted) {
            stream.getTracks().forEach(track => track.stop());
            return;
          }
          
          setMediaStream(stream);
          
          // Associate the stream with the video element
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
          const audioOnlyStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          if (!mounted) {
            audioOnlyStream.getTracks().forEach(track => track.stop());
            return;
          }
          
          setMediaStream(audioOnlyStream);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = audioOnlyStream;
          }
          setIsVideoEnabled(false);
          toast.info("Continuing with audio only");
        } catch (audioErr) {
          console.error("Could not get audio-only access:", audioErr);
        }
      }
    };

    initializeMediaDevices();

    // Clean up on unmount
    return () => {
      mounted = false;
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const toggleAudio = () => {
    if (mediaStream) {
      const audioTracks = mediaStream.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !isAudioEnabled;
      });
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  const toggleVideo = () => {
    if (mediaStream) {
      const videoTracks = mediaStream.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = !isVideoEnabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const toggleScreenShare = () => {
    if (!isScreenSharing) {
      // Start screen sharing
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
      // Stop screen sharing
      if (screenVideoRef.current && screenVideoRef.current.srcObject) {
        const tracks = (screenVideoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
        screenVideoRef.current.srcObject = null;
      }
      setIsScreenSharing(false);
    }
  };

  // Ensure we clean up media resources properly
  useEffect(() => {
    return () => {
      // Stop all media streams on unmount
      if (localVideoRef.current && localVideoRef.current.srcObject) {
        const tracks = (localVideoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
      if (screenVideoRef.current && screenVideoRef.current.srcObject) {
        const tracks = (screenVideoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  return {
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    localVideoRef,
    screenVideoRef,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    mediaStream
  };
};

export default useMeetingMedia;
