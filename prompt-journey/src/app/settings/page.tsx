"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { useTheme } from "@/components/providers";
import {
  Settings,
  User,
  Bell,
  Shield,
  Palette,
  Save,
  Loader2,
  Check,
  Trash2,
  Eye,
  EyeOff,
  Moon,
  Sun,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function SettingsPage() {
  const { data: session, status, update } = useSession();
  const { theme, setTheme } = useTheme();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  
  // Profile settings
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  
  // Notification settings
  const [emailComments, setEmailComments] = useState(true);
  const [emailVotes, setEmailVotes] = useState(false);
  const [emailAwards, setEmailAwards] = useState(true);
  
  // Privacy settings
  const [profilePublic, setProfilePublic] = useState(true);
  const [savingPrivacy, setSavingPrivacy] = useState(false);

  // Fetch user profile data
  const { data: userData, mutate } = useSWR(
    session?.user?.id ? `/api/users/${session.user.id}` : null,
    fetcher
  );

  // Load user data when available
  useEffect(() => {
    if (userData) {
      setName(userData.name || "");
      setBio(userData.bio || "");
      setProfilePublic(userData.isPublic !== false);
    }
  }, [userData]);

  // Also load from session initially
  useEffect(() => {
    if (session?.user?.name && !name) {
      setName(session.user.name);
    }
  }, [session, name]);

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

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${session.user?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bio }),
      });
      if (res.ok) {
        setSaved(true);
        await update({ name });
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePrivacy = async () => {
    setSavingPrivacy(true);
    try {
      const res = await fetch(`/api/users/${session.user?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: !profilePublic }),
      });
      if (res.ok) {
        setProfilePublic(!profilePublic);
        mutate();
      }
    } catch (error) {
      console.error("Failed to update privacy:", error);
    } finally {
      setSavingPrivacy(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") return;
    
    setDeleting(true);
    try {
      const res = await fetch(`/api/users/${session.user?.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await signOut({ callbackUrl: "/" });
      } else {
        alert("Failed to delete account. Please try again.");
      }
    } catch (error) {
      console.error("Failed to delete account:", error);
      alert("Failed to delete account. Please try again.");
    } finally {
      setDeleting(false);
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

            <Button onClick={handleSaveProfile} disabled={saving}>
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
                <p className="text-sm font-medium text-zinc-300">Comments on your journeys</p>
                <p className="text-xs text-zinc-500">Get notified when someone comments</p>
              </div>
              <Button 
                variant={emailComments ? "default" : "outline"} 
                size="sm"
                onClick={() => setEmailComments(!emailComments)}
              >
                {emailComments ? "On" : "Off"}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-300">Votes on your content</p>
                <p className="text-xs text-zinc-500">Get notified when you receive votes</p>
              </div>
              <Button 
                variant={emailVotes ? "default" : "outline"} 
                size="sm"
                onClick={() => setEmailVotes(!emailVotes)}
              >
                {emailVotes ? "On" : "Off"}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-300">Awards & achievements</p>
                <p className="text-xs text-zinc-500">Get notified when you win awards</p>
              </div>
              <Button 
                variant={emailAwards ? "default" : "outline"} 
                size="sm"
                onClick={() => setEmailAwards(!emailAwards)}
              >
                {emailAwards ? "On" : "Off"}
              </Button>
            </div>
            <p className="text-xs text-zinc-500 pt-2 border-t border-zinc-800">
              Note: Email notifications will be enabled in a future update
            </p>
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
              <div className="flex items-center gap-3">
                <Moon className="h-5 w-5 text-zinc-400" />
                <div>
                  <p className="text-sm font-medium text-zinc-300">Dark Mode</p>
                  <p className="text-xs text-zinc-500">Easy on the eyes in low light</p>
                </div>
              </div>
              <Button 
                variant={theme === "dark" ? "default" : "outline"} 
                size="sm"
                onClick={() => setTheme("dark")}
              >
                {theme === "dark" && <Check className="h-4 w-4 mr-1" />}
                {theme === "dark" ? "Active" : "Select"}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sun className="h-5 w-5 text-zinc-400" />
                <div>
                  <p className="text-sm font-medium text-zinc-300">Light Mode</p>
                  <p className="text-xs text-zinc-500">Classic bright appearance</p>
                </div>
              </div>
              <Button 
                variant={theme === "light" ? "default" : "outline"} 
                size="sm"
                onClick={() => setTheme("light")}
              >
                {theme === "light" && <Check className="h-4 w-4 mr-1" />}
                {theme === "light" ? "Active" : "Select"}
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
              <div className="flex items-center gap-3">
                {profilePublic ? <Eye className="h-5 w-5 text-zinc-400" /> : <EyeOff className="h-5 w-5 text-zinc-400" />}
                <div>
                  <p className="text-sm font-medium text-zinc-300">Profile visibility</p>
                  <p className="text-xs text-zinc-500">
                    {profilePublic ? "Anyone can view your profile" : "Only you can view your profile"}
                  </p>
                </div>
              </div>
              <Button 
                variant={profilePublic ? "default" : "outline"} 
                size="sm"
                onClick={handleTogglePrivacy}
                disabled={savingPrivacy}
              >
                {savingPrivacy ? <Loader2 className="h-4 w-4 animate-spin" /> : profilePublic ? "Public" : "Private"}
              </Button>
            </div>

            {/* Danger Zone */}
            <div className="pt-4 mt-4 border-t border-zinc-800">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <p className="text-sm font-medium text-red-400">Danger Zone</p>
              </div>
              
              {!showDeleteConfirm ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-300">Delete account</p>
                    <p className="text-xs text-zinc-500">
                      Permanently delete your account and all data
                    </p>
                  </div>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 space-y-3">
                  <p className="text-sm text-red-300">
                    This action cannot be undone. All your journeys, one-shots, comments, and votes will be permanently deleted.
                  </p>
                  <div>
                    <label className="text-xs text-zinc-400 block mb-1">
                      Type DELETE to confirm
                    </label>
                    <Input
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="DELETE"
                      className="bg-zinc-900"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirmText !== "DELETE" || deleting}
                    >
                      {deleting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
                      Delete My Account
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteConfirmText("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
