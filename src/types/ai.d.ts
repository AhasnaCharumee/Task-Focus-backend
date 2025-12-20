export interface FocusPlanRequest {
  userId: string;
  taskIds: string[];
}

export interface FocusPlanResponse {
  focusSummary: string;
  recommendedOrder: string[];
}

export interface MotivationResponse {
  quote: string;
  message: string;
}
