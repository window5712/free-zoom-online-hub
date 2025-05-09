
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { calculateDuration } from "@/utils/attendanceUtils";

interface Participant {
  id: string;
  name: string;
  joinTime: string;
  leaveTime: string | null;
}

interface AttendanceTableProps {
  participants: Participant[];
}

const AttendanceTable: React.FC<AttendanceTableProps> = ({ participants }) => {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Join Time</TableHead>
            <TableHead>Leave Time</TableHead>
            <TableHead>Duration</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {participants.length > 0 ? (
            participants.map((participant, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{participant.name}</TableCell>
                <TableCell>{participant.joinTime}</TableCell>
                <TableCell>{participant.leaveTime || "Still present"}</TableCell>
                <TableCell>
                  {calculateDuration(participant.joinTime, participant.leaveTime)}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-4">
                No attendance records found for this meeting
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default AttendanceTable;
