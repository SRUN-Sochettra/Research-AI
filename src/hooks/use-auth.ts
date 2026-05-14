// src/hooks/use-auth.ts
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/db/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types/database";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const supabaseRef = useRef(getSupabaseBrowserClient());

  useEffect(() => {
    const supabase = supabaseRef.current;

    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user ?? null);

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
  }, []); // ← empty: supabaseRef.current never changes identity

  // ─── Sign Up ──────────────────────────────────────────────────────────────
  const signUpWithEmail = useCallback(
    async (
      email: string,
      password: string,
      fullName: string
    ): Promise<{ error: string | null }> => {
      const supabase = supabaseRef.current;
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
    [] // ← empty: supabaseRef is stable, .current never changes
  );

  // ─── Sign In with Email ───────────────────────────────────────────────────
  const signInWithEmail = useCallback(
    async (
      email: string,
      password: string
    ): Promise<{ error: string | null }> => {
      const supabase = supabaseRef.current;
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) return { error: error.message };

      router.push("/documents");
      router.refresh();
      return { error: null };
    },
    [router]
  );

  // ─── Sign In with Google ──────────────────────────────────────────────────
  const signInWithGoogle = useCallback(async () => {
    const supabase = supabaseRef.current;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error("Google sign in error:", error.message);
    }
  }, []); // ← empty: supabaseRef is stable

  // ─── Sign Out ─────────────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    const supabase = supabaseRef.current;
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }, [router]);

  return {
    user,
    profile,
    loading,
    isLoading: loading,
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    signOut,
  };
}