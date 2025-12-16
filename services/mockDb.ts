import { createClient } from "@supabase/supabase-js";
import { supabase, supabaseUrl, supabaseAnonKey } from "./supabaseClient";
import { City, Kendra, User, WeeklyReport } from "../types";

// This service now acts as the adapter for Supabase
// We keep the name 'db' to avoid breaking existing imports in pages

class DatabaseService {
  // --- Auth Helper ---
  async login(email: string, password?: string): Promise<User | null> {
    // In a real app, AuthContext handles the sign-in.
    // This method is kept for compatibility if needed, but mainly used to fetch profile.

    // Check if session exists
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) return profile as User;
    }
    return null;
  }

  // --- Cities ---
  async getCities(): Promise<City[]> {
    const { data, error } = await supabase
      .from("cities")
      .select("*")
      .order("city_name");
    if (error) console.error("Error fetching cities:", error);
    return data || [];
  }

  async addCity(city: Omit<City, "id">): Promise<City> {
    const { data, error } = await supabase
      .from("cities")
      .insert([city])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updateCity(city: City): Promise<City> {
    const { data, error } = await supabase
      .from("cities")
      .update({ city_name: city.city_name, pin_code: city.pin_code })
      .eq("id", city.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteCity(id: string): Promise<void> {
    const { error } = await supabase.from("cities").delete().eq("id", id);
    if (error) throw error;
  }

  // --- Kendras ---
  async getKendras(): Promise<Kendra[]> {
    const { data, error } = await supabase
      .from("kendras")
      .select("*")
      .order("kendra_name");
    if (error) console.error("Error fetching kendras:", error);
    return data || [];
  }

  async addKendra(kendra: Omit<Kendra, "id">): Promise<Kendra> {
    const { data, error } = await supabase
      .from("kendras")
      .insert([kendra])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updateKendra(kendra: Kendra): Promise<Kendra> {
    const { data, error } = await supabase
      .from("kendras")
      .update({ kendra_name: kendra.kendra_name, city_id: kendra.city_id })
      .eq("id", kendra.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteKendra(id: string): Promise<void> {
    const { error } = await supabase.from("kendras").delete().eq("id", id);
    if (error) throw error;
  }

  // --- Users (Profiles) ---
  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("name");
    if (error) console.error("Error fetching users:", error);
    return data || [];
  }

  async addUser(user: Omit<User, "id">, password?: string): Promise<User> {
    // 1. Create the user in Supabase Auth
    // We use a temporary client so we don't mess up the current Admin session.
    // This allows us to "SignUp" a new user without logging the Admin out.

    if (!password) {
      throw new Error("Password is required to create a new user.");
    }

    const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false, // Don't save this session to local storage
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    const { data: authData, error: authError } = await tempClient.auth.signUp({
      email: user.email,
      password: password,
      options: {
        data: {
          name: user.name,
          role: user.role,
          kendra_id: user.kendra_id,
        },
      },
    });

    if (authError) {
      console.error("Error creating Auth user:", authError);
      throw new Error(authError.message);
    }

    if (!authData.user) {
      throw new Error("User creation failed: No user data returned.");
    }

    // 2. Create the user profile in the 'profiles' table using the Admin client (this.supabase)
    // // We use the ID returned from the Auth creation
    // const { data, error } = await supabase
    //   .from("profiles")
    //   .insert([
    //     {
    //       id: authData.user.id, // Link to Auth ID
    //       name: user.name,
    //       email: user.email,
    //       role: user.role,
    //       kendra_id: user.kendra_id,
    //     },
    //   ])
    //   .select()
    //   .single();

    // if (error) {
    //   console.error("Error creating Profile record:", error);
    //   // Optional: Cleanup auth user if profile creation fails?
    //   // For now, we just throw error.
    //   throw error;
    // }

    return authData.user as any;
  }

  async updateUser(user: User): Promise<User> {
    const { data, error } = await supabase
      .from("profiles")
      .update({
        name: user.name,
        role: user.role,
        kendra_id: user.kendra_id,
        email: user.email,
      })
      .eq("id", user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteUser(id: string): Promise<void> {
    // Note: This only deletes the Profile.
    // To delete the Auth User, you must use the Service Role key in a backend/edge function.
    // Client-side, we can only remove the profile data.
    const { error } = await supabase.from("profiles").delete().eq("id", id);
    if (error) throw error;
  }

  // --- Reports ---
  async getReports(): Promise<WeeklyReport[]> {
    const { data, error } = await supabase
      .from("weekly_reports")
      .select("*")
      .order("week_start_date", { ascending: false });

    if (error) console.error("Error fetching reports:", error);
    return data || [];
  }

  async addReport(
    report: Omit<WeeklyReport, "id" | "created_at">
  ): Promise<WeeklyReport> {
    // Check for duplicate report: Same Kendra, Same Week Start, Same Gender
    const { data: existing } = await supabase
      .from("weekly_reports")
      .select("id")
      .eq("kendra_id", report.kendra_id)
      .eq("week_start_date", report.week_start_date)
      .eq("gender", report.gender)
      .maybeSingle();

    if (existing) {
      throw new Error(
        `A ${report.gender} report for this week already exists for this Kendra.`
      );
    }

    const { data, error } = await supabase
      .from("weekly_reports")
      .insert([report])
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

export const db = new DatabaseService();
