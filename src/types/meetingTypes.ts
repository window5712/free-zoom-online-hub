
export interface Participant {
  id: string;
  name: string;
}

export interface Message {
  sender: string;
  text: string;
  time: string;
}

export interface MeetingData {
  id: string;
  meeting_id: string;
  title: string;
  description?: string;
  created_at: string;
  created_by: string;
  is_private?: boolean;
  password?: string;
  scheduled_time?: string;
}
