export interface UpdateProfileInput {
  name?: string;
  email?: string;
  password?: string;
}

export interface ProfileResponse {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}
