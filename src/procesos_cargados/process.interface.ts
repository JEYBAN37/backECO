export interface Process {
  id: string;
  groupId: string;
  processName: string;
  pausePlans: any[];
  startDate: string;
  createdAt: string;
  updatedAt: string;
  status: boolean;
  color?: string;
}
