export interface UserStats {
  activities_done: number;
  total_activities: number;
  total_time: number;
}

export interface UserStatsResponse {
  status: boolean;
  message: string;
  data: UserStats;
}
