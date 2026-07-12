import { getSupabaseServerClient } from "@/lib/db/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Settings, Mail, User } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const fullName = profile?.full_name || user.email?.split("@")[0] || "User";
  const initials = fullName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Account <span className="gradient-text">Settings</span>
          </h1>
          <p className="mt-1 text-muted-foreground">
            Manage your profile and preferences
          </p>
        </div>
      </div>

      <Card className="border-white/10 bg-white/[0.02]">
        <CardHeader className="border-b border-white/5 pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Settings className="h-5 w-5 text-violet-400" />
            Profile Details
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20 ring-1 ring-violet-500/30">
              <AvatarFallback className="bg-gradient-to-br from-violet-600 to-blue-600 text-2xl font-bold text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">{fullName}</h2>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {user.email}
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 pt-4 border-t border-white/5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4" />
                Full Name
              </label>
              <div className="flex h-10 w-full items-center rounded-md border border-input bg-background/50 px-3 py-2 text-sm">
                {profile?.full_name || "Not provided"}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address
              </label>
              <div className="flex h-10 w-full items-center rounded-md border border-input bg-background/50 px-3 py-2 text-sm">
                {user.email}
              </div>
            </div>
          </div>
          <div className="pt-4">
             <p className="text-xs text-muted-foreground">
               Note: Currently, profile updates are disabled in this demo environment.
             </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
