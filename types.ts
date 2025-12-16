export type Role = "admin" | "member";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  kendra_id?: string; // Nullable for admin
}

export interface City {
  id: string;
  city_name: string;
  pin_code: string;
}

export interface Kendra {
  id: string;
  kendra_name: string;
  city_id: string;
}

export interface WeeklyReport {
  id: string;
  kendra_id: string;
  week_start_date: string; // ISO Date string
  week_end_date: string; // ISO Date string
  yuva_kendra_attendance: number;
  bhavferni_attendance: number;
  pravachan_attendance: number;
  gender: "Male" | "Female";
  description: string;
  created_by: string;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}
