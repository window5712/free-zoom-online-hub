
/**
 * Calculate duration between join time and leave time
 */
export const calculateDuration = (joinTime: string, leaveTime: string | null) => {
  if (!leaveTime) return "Still present";
  
  const join = new Date(`1970-01-01T${joinTime}`);
  const leave = new Date(`1970-01-01T${leaveTime}`);
  
  // Handle case where meeting goes past midnight
  if (leave < join) {
    leave.setDate(leave.getDate() + 1);
  }
  
  const diffMs = leave.getTime() - join.getTime();
  const diffMins = Math.floor(diffMs / 1000 / 60);
  
  if (diffMins < 60) {
    return `${diffMins} min${diffMins !== 1 ? 's' : ''}`;
  }
  
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  return `${hours} hr${hours !== 1 ? 's' : ''} ${mins} min${mins !== 1 ? 's' : ''}`;
};

/**
 * Export attendance data to CSV
 */
export const exportToCSV = (meeting: {
  meetingId: string;
  date: string;
  startTime: string;
  endTime?: string;
  participants: Array<{
    name: string;
    joinTime: string;
    leaveTime: string | null;
  }>;
}) => {
  if (!meeting) return;
  
  const headers = ["Name", "Join Time", "Leave Time", "Duration"];
  const rows = meeting.participants.map(p => [
    p.name,
    p.joinTime,
    p.leaveTime || "Still present",
    calculateDuration(p.joinTime, p.leaveTime)
  ]);
  
  const csvContent = [
    `Meeting ID: ${meeting.meetingId}`,
    `Date: ${meeting.date}`,
    `Start Time: ${meeting.startTime}`,
    `End Time: ${meeting.endTime || "Ongoing"}`,
    "",
    headers.join(","),
    ...rows.map(r => r.map(cell => `"${cell}"`).join(","))
  ].join("\n");
  
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `meeting-attendance-${meeting.meetingId}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
