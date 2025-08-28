export interface UserActivityDto {
  id: string;
  title: string;
  category: string;
  color: string;
  assignedForToday: boolean;
  instructions: string[];
  duration: number;
  type: string;
  processId?: string;
  processName?: string;
  startDate?: string;
  status?: string;
}
