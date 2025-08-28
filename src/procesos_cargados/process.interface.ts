export interface Process {
  id: string;
  groupId: string;
  processName: string;
  pausePlans: any[];
  startDate: string;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'scheduled' | 'inactive' | 'pending';
  color?: string;
}
