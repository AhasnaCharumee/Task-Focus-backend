export interface AnalyticsData {
  date: string;
  totalTasks: number;
  completedTasks: number;
  focusHours: number;
}

export interface AnalyticsSummary {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  weeklyTrend: number[];
}
