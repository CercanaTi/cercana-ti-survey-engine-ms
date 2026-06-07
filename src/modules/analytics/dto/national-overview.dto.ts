export interface RegionalOverview {
  nodeId: string;
  name: string;
  avgScore: number;
  completionRate: number;
}

export interface NationalOverviewDto {
  totalTeachers: number;
  totalCompleted: number;
  nationalAvgScore: number;
  completionRate: number;
  byRegional: RegionalOverview[];
  distributionNational: Record<string, number>;
}
