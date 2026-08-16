import { getSupabaseServerClient } from "@/lib/db/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Settings, Mail, User } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Account Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your profile and preferences
          </p>
        </div>
      </div>

      <Card className="border-border bg-card">
        <CardHeader className="border-border border-b pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Settings className="text-primary h-5 w-5" />
            Profile Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <div className="flex items-center gap-6">
            <Avatar className="ring-primary/30 h-20 w-20 ring-1">
              <AvatarFallback className="bg-primary text-2xl font-bold text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">{fullName}</h2>
              <p className="text-muted-foreground flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4" />
                {user.email}
              </p>
            </div>
          </div>

          <div className="border-border grid gap-6 border-t pt-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                <User className="h-4 w-4" />
                Full Name
              </label>
              <div className="border-input bg-background/50 flex h-10 w-full items-center rounded-md border px-3 py-2 text-sm">
                {profile?.full_name || "Not provided"}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                <Mail className="h-4 w-4" />
                Email Address
              </label>
              <div className="border-input bg-background/50 flex h-10 w-full items-center rounded-md border px-3 py-2 text-sm">
                {user.email}
              </div>
            </div>
          </div>
          <div className="pt-4">
            <p className="text-muted-foreground text-xs">
              Note: Currently, profile updates are disabled in this demo
              environment.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
