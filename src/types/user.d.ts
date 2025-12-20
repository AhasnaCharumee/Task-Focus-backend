export interface UserPayload {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin"; // Added role for admin checks
}

export interface SignupInput {
  name: string;
  email: string;
  password: string;
  role?: "user" | "admin"; // optional for signup
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface GoogleAuthInput {
  token: string;
}
