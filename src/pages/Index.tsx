
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Layout from "@/components/Layout";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Video, Users, Calendar } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [meetingCode, setMeetingCode] = React.useState("");
  const [userName, setUserName] = React.useState("");
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const handleJoinMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Please sign in to join a meeting");
      navigate("/auth");
      return;
    }
    
    if (!meetingCode.trim()) {
      toast.error("Please enter a meeting code");
      return;
    }
    
    try {
      // Check if meeting exists
      const { data: meeting, error } = await supabase
        .from("meetings")
        .select("*")
        .eq("meeting_id", meetingCode)
        .single();
        
      if (error || !meeting) {
        toast.error("Meeting not found");
        return;
      }
      
      // Navigate to meeting room
      navigate(`/meeting/${meetingCode}`);
    } catch (error) {
      console.error("Error joining meeting:", error);
      toast.error("Failed to join meeting");
    }
  };

  const handleCreateMeeting = async () => {
    if (!user) {
      toast.error("Please sign in to create a meeting");
      navigate("/auth");
      return;
    }
    
    try {
      // Create a random meeting ID
      const meetingId = Math.random().toString(36).substring(2, 12);
      
      // Insert meeting into database
      const { data, error } = await supabase
        .from("meetings")
        .insert([
          {
            meeting_id: meetingId,
            title: `${profile?.username || user.email}'s Meeting`,
            created_by: user.id,
            description: "A ZoomFree meeting"
          }
        ])
        .select();
        
      if (error) throw error;
      
      toast.success("Meeting created successfully");
      navigate(`/meeting/${meetingId}`);
    } catch (error) {
      console.error("Error creating meeting:", error);
      toast.error("Failed to create meeting");
    }
  };

  React.useEffect(() => {
    if (profile) {
      setUserName(profile.full_name || profile.username || user?.email || "");
    }
  }, [profile, user]);

  return (
    <Layout>
      <div className="container px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-12">
          <div className="flex flex-col justify-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Free Video Conferencing for Everyone
            </h1>
            <p className="text-xl text-muted-foreground">
              Connect with anyone, anywhere, with our reliable and secure video platform. No limits, no subscriptions.
            </p>
            <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
              <form onSubmit={handleJoinMeeting} className="flex w-full flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
                {!user && (
                  <Button 
                    onClick={() => navigate("/auth")} 
                    variant="default" 
                    className="sm:w-auto"
                    type="button"
                  >
                    Sign In to Get Started
                  </Button>
                )}
                
                {user && (
                  <>
                    <Input
                      placeholder="Enter meeting code"
                      value={meetingCode}
                      onChange={(e) => setMeetingCode(e.target.value)}
                      className="flex-1"
                      required
                    />
                    <Button type="submit" className="bg-zoom-blue hover:bg-zoom-darkBlue">Join Meeting</Button>
                  </>
                )}
              </form>
            </div>
            
            {user && (
              <>
                <div className="flex items-center">
                  <div className="h-px flex-1 bg-border"></div>
                  <span className="px-2 text-muted-foreground">or</span>
                  <div className="h-px flex-1 bg-border"></div>
                </div>
                <Button onClick={handleCreateMeeting} variant="secondary" className="w-full sm:w-auto">
                  Create New Meeting
                </Button>
              </>
            )}
          </div>
          <div className="flex items-center justify-center">
            <img
              alt="Video conferencing illustration"
              className="w-full max-w-md rounded-lg shadow-xl"
              src="https://images.unsplash.com/photo-1516387938699-a93567ec168e?q=80&w=1000&auto=format&fit=crop"
              style={{
                aspectRatio: "4/3",
                objectFit: "cover",
              }}
            />
          </div>
        </div>

        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center mb-8">Why Choose ZoomFree?</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center gap-4">
                <Video size={24} className="text-zoom-blue" />
                <div>
                  <CardTitle>Crystal Clear Video</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Enjoy high-quality video conferencing with no compromises on clarity or connection stability.
                </CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center gap-4">
                <Users size={24} className="text-zoom-blue" />
                <div>
                  <CardTitle>Attendance Tracking</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Track participant attendance for meetings with our built-in attendance management system.
                </CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center gap-4">
                <Calendar size={24} className="text-zoom-blue" />
                <div>
                  <CardTitle>Unlimited Meetings</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Host as many meetings as you want with no time limits. It's completely free.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
