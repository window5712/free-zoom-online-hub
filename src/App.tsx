
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import MeetingRoom from "./pages/MeetingRoom";
import Meetings from "./pages/Meetings";
import Attendance from "./pages/Attendance";
import AttendanceSingle from "./pages/AttendanceSingle";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/meeting/:meetingId" element={<MeetingRoom />} />
          <Route path="/meetings" element={<Meetings />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/attendance/:meetingId" element={<AttendanceSingle />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
