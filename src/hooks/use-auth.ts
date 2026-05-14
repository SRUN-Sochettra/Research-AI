"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/db/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types/database";

interface AuthState {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    isLoading: true,
    error: null,
  });
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  const fetchProfile = useCallback(
    async (userId: string) => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        return null;
      }
      return data;
    },
    [supabase]
  );

  useEffect(() => {
    const getSession = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error || !user) {
          setState({ user: null, profile: null, isLoading: false, error: null });
          return;
        }

        const profile = await fetchProfile(user.id);
        setState({ user, profile, isLoading: false, error: null });
      } catch (err) {
        setState({
          user: null,
          profile: null,
          isLoading: false,
          error: err instanceof Error ? err.message : "Failed to get session",
        });
      }
    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const profile = await fetchProfile(session.user.id);
        setState({
          user: session.user,
          profile,
          isLoading: false,
          error: null,
        });
      } else if (event === "SIGNED_OUT") {
        setState({ user: null, profile: null, isLoading: false, error: null });
        router.push("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, router, fetchProfile]);

  const signInWithEmail = async (email: string, password: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message,
      }));
      return { error: error.message };
    }

    router.push("/documents");
    return { error: null };
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    fullName: string
  ) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message,
      }));
      return { error: error.message };
    }

    return { error: null };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setState((prev) => ({ ...prev, error: error.message }));
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return {
    ...state,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
  };
}