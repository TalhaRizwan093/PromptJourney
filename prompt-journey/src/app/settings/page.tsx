"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  Settings,
  User,
  Bell,
  Shield,
  Palette,
  Save,
  Loader2,
  Check,
} from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState(session?.user?.name || "");
  const [bio, setBio] = useState("");

  if (status === "loading") {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl text-center">
        <Settings className="h-16 w-16 text-zinc-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-zinc-100 mb-2">Settings</h1>
        <p className="text-zinc-400 mb-6">Please sign in to access settings</p>
        <Link href="/login">
          <Button>Sign In</Button>
        </Link>
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${session.user?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bio }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-100 flex items-center gap-3">
          <Settings className="h-8 w-8 text-violet-400" />
          Settings
        </h1>
        <p className="text-zinc-400 mt-2">Manage your account preferences</p>
      </div>

      <div className="space-y-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-violet-400" />
              Profile
            </CardTitle>
            <CardDescription>Update your profile information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={session.user?.image || undefined} />
                <AvatarFallback name={session.user?.name} className="text-2xl" />
              </Avatar>
              <div>
                <p className="text-sm text-zinc-400">Profile Picture</p>
                <p className="text-xs text-zinc-500 mt-1">
                  Profile pictures are linked to your authentication provider
                </p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-300 block mb-2">
                Display Name
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-300 block mb-2">
                Email
              </label>
              <Input
                value={session.user?.email || ""}
                disabled
                className="opacity-50"
              />
              <p className="text-xs text-zinc-500 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-300 block mb-2">
                Bio
              </label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell others about yourself..."
                rows={3}
              />
            </div>

            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : saved ? (
                <Check className="h-4 w-4 mr-2 text-emerald-400" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {saved ? "Saved!" : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-violet-400" />
              Notifications
            </CardTitle>
            <CardDescription>Configure your notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-300">Email notifications</p>
                <p className="text-xs text-zinc-500">Get notified about comments and votes</p>
              </div>
              <Button variant="outline" size="sm" disabled>
                Coming Soon
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Appearance Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-violet-400" />
              Appearance
            </CardTitle>
            <CardDescription>Customize how PromptJourney looks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-300">Theme</p>
                <p className="text-xs text-zinc-500">Dark mode is the default</p>
              </div>
              <Button variant="outline" size="sm" disabled>
                Dark
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-violet-400" />
              Privacy & Security
            </CardTitle>
            <CardDescription>Manage your privacy settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-300">Profile visibility</p>
                <p className="text-xs text-zinc-500">Your profile is public</p>
              </div>
              <Button variant="outline" size="sm" disabled>
                Public
              </Button>
            </div>
            <div className="pt-4 border-t border-zinc-800">
              <p className="text-sm font-medium text-red-400">Danger Zone</p>
              <p className="text-xs text-zinc-500 mt-1 mb-3">
                Permanently delete your account and all data
              </p>
              <Button variant="destructive" size="sm" disabled>
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
