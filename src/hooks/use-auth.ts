// src/hooks/use-auth.ts
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/db/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types/database";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user ?? null);

      // Fetch profile if user exists
      if (user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setProfile(profileData ?? null);
      }

      setLoading(false);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();
        setProfile(profileData ?? null);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // ─── Sign Up ────────────────────────────────────────────────────────────────
  const signUpWithEmail = useCallback(
    async (
      email: string,
      password: string,
      fullName: string
    ): Promise<{ error: string | null }> => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });

      if (error) return { error: error.message };
      return { error: null };
    },
    [supabase]
  );

  // ─── Sign In with Email ──────────────────────────────────────────────────────
  const signInWithEmail = useCallback(
    async (
      email: string,
      password: string
    ): Promise<{ error: string | null }> => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) return { error: error.message };

      router.push("/documents");
      router.refresh();
      return { error: null };
    },
    [supabase, router]
  );

  // ─── Sign In with Google ─────────────────────────────────────────────────────
  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error("Google sign in error:", error.message);
    }
  }, [supabase]);

  // ─── Sign Out ────────────────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }, [supabase, router]);

  return {
    user,
    profile,
    loading,
    isLoading: loading, // ← alias so login/signup pages work with either name
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    signOut,
  };
}