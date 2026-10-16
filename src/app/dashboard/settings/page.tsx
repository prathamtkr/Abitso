"use client";

import { useState, useEffect } from "react";
import { 
  User, 
  Palette, 
  Bell, 
  Shield, 
  Sun,
  Moon,
  Save,
  CheckCircle2,
  Upload as UploadIcon,
  Trash2,
  Download,
  RefreshCw,
  Camera,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { trpc } from "@/app/_trpc/client";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { cn } from "@/lib/utils";


interface UserSettings {
  displayName?: string;
  email?: string;
  imageUrl?: string;
  theme?: "light" | "dark" | "system";
  fontSize?: number;
  autoSave?: boolean;
  defaultZoom?: number;
  defaultHighlightColor?: string;
  emailNotifications?: boolean;
  processingAlerts?: boolean;
  weeklyDigest?: boolean;
  browserNotifications?: boolean;
  analyticsOptOut?: boolean;
  shareUsageData?: boolean;
  publicProfile?: boolean;
}

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const { toast } = useToast();
  const { user } = useKindeBrowserClient();

  // Get settings from database
  const { data: dbSettings, isLoading, refetch } = trpc.getUserSettings.useQuery();
  const utils = trpc.useUtils();

  // Update settings mutation
  const updateSettingsMutation = trpc.updateUserSettings.useMutation({
    onSuccess: (updatedUser) => {
      console.log("✅ Settings saved:", updatedUser);
      
      // Refresh all data
      utils.getUserSettings.invalidate();
      utils.authCallback.invalidate();
      
      if (updatedUser) {
        setSettings(updatedUser as UserSettings);
      }
      
      setHasChanges(false);
      setSaveSuccess(true);
      setIsSaving(false);
      
      // Apply changes immediately
      if (updatedUser.fontSize) applyFontSize(updatedUser.fontSize);
      if (updatedUser.theme) applyTheme(updatedUser.theme);
      
      toast({
        title: "✅ Settings saved!",
        description: "Your preferences have been updated successfully.",
        duration: 3000,
      });
      
      setTimeout(() => setSaveSuccess(false), 2000);
    },
    onError: (error) => {
      console.error("❌ Save error:", error);
      setIsSaving(false);
      toast({
        title: "❌ Error saving settings",
        description: error.message || "Failed to save. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    }
  });

  // Local settings state
  const [settings, setSettings] = useState<UserSettings>({
    displayName: "",
    theme: "light",
    fontSize: 16,
    emailNotifications: true,
    processingAlerts: true,
    weeklyDigest: false,
    browserNotifications: true,
    analyticsOptOut: false,
    shareUsageData: true,
    publicProfile: false,
  });

  // Load settings when data arrives
  useEffect(() => {
    if (dbSettings) {
      setSettings(dbSettings as UserSettings);
      setHasChanges(false);
      
      // Apply current settings
      if (dbSettings.fontSize) applyFontSize(dbSettings.fontSize);
      if (dbSettings.theme) applyTheme(dbSettings.theme as "light" | "dark" | "system");
    } else if (user && !isLoading) {
      // Set initial values from user
      setSettings(prev => ({
        ...prev,
        displayName: user.given_name && user.family_name 
          ? `${user.given_name} ${user.family_name}` 
          : user.given_name || user.email || "",
        email: user.email || "",
        imageUrl: user.picture || "",
      }));
    }
  }, [dbSettings, user, isLoading]);

  const settingsTabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy", icon: Shield },
  ];

  const handleSave = async () => {
    console.log("💾 Saving settings:", settings);
    setIsSaving(true);
    updateSettingsMutation.mutate(settings);
  };

  const updateSetting = (key: string, value: any) => {
    console.log(`🔧 Updating ${key}:`, value);
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
    
    
    if (key === "fontSize") applyFontSize(value);
    else if (key === "theme") applyTheme(value);
  };

  // Updated resetToDefaults function 
  const resetToDefaults = () => {
    const defaults = { 
      theme: "light" as const, 
      fontSize: 16 
    };
    setSettings(prev => ({ ...prev, ...defaults }));
    setHasChanges(true);
    
    applyFontSize(defaults.fontSize);
    applyTheme(defaults.theme);
    
    toast({
      title: "🔄 Settings reset to defaults",
      description: "Appearance settings restored to default values.",
      duration: 3000,
    });
  };

  const applyFontSize = (fontSize: number) => {
    // global effect
    document.documentElement.style.setProperty('--font-size-base', `${fontSize}px`);
    
    // immediate effect
    document.body.style.fontSize = `${fontSize}px`;
    
    // Apply to dashboard elements specifically
    const dashboardElements = document.querySelectorAll('.dashboard-content, .dashboard-card, .file-card');
    dashboardElements.forEach((element) => {
      (element as HTMLElement).style.fontSize = `${fontSize}px`;
    });
    
    localStorage.setItem('lexinote-font-size', fontSize.toString());
  };

  const applyTheme = (theme: "light" | "dark" | "system") => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle(
      "dark",
      theme === "dark" || (theme === "system" && prefersDark)
    );
    localStorage.setItem("abitso-theme", theme);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPG, PNG, GIF, WebP).",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 5MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageDataUrl = e.target?.result as string;
        updateSetting("imageUrl", imageDataUrl);
        toast({
          title: "✅ Profile picture updated",
          description: "Don't forget to save your changes!",
          duration: 3000,
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({
        title: "❌ Upload failed",
        description: "Failed to upload profile picture.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const handleExportData = async () => {
    try {
      const userData = { user, settings, exportDate: new Date().toISOString() };
      const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `abitso-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Data exported",
        description: "Your data has been downloaded successfully.",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export data.",
        variant: "destructive",
      });
    }
  };


  useEffect(() => {
    const savedFontSize = localStorage.getItem('lexinote-font-size');
    
    if (savedFontSize) {
      applyFontSize(parseInt(savedFontSize));
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFA] p-8 flex items-center justify-center text-slate-900">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-teal-700 border-t-transparent rounded-full animate-spin" />
          <span>Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFA] p-4 text-slate-900 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
                Settings
              </h1>
              <p className="text-gray-600 mt-2">Customize your experience and preferences</p>
            </div>
            
            {(hasChanges || isSaving || saveSuccess) && (
              <Button
                onClick={handleSave}
                disabled={isSaving || saveSuccess}
                className={cn(
                  "rounded-[10px] transition-all duration-200 shadow-sm",
                  saveSuccess 
                    ? "bg-teal-800 hover:bg-teal-800" 
                    : "bg-teal-700 hover:bg-teal-800",
                  isSaving && "opacity-70 cursor-not-allowed"
                )}
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Saving...
                  </>
                ) : saveSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-5 lg:flex-row lg:gap-8">
          {/* Sidebar */}
          <div className="w-full space-y-2 lg:w-72">
            <Card className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
              {settingsTabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left",
                      isActive
                        ? "bg-teal-50 text-teal-900 shadow-sm"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                      isActive ? "bg-teal-100" : "bg-slate-100"
                    )}>
                      <tab.icon className={cn(
                        "w-4 h-4",
                        isActive ? "text-teal-800" : "text-slate-600"
                      )} />
                    </div>
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </Card>
          </div>

          {/* Content */}
          <div className="flex-1">
            {activeTab === "profile" && (
              <ProfileSettings 
                settings={settings} 
                updateSetting={updateSetting}
                onImageUpload={handleImageUpload}
                isUploading={isUploading}
                user={user}
              />
            )}
            {activeTab === "appearance" && (
              <AppearanceSettings 
                settings={settings} 
                updateSetting={updateSetting}
                onReset={resetToDefaults}
              />
            )}
            {activeTab === "notifications" && (
              <NotificationSettings settings={settings} updateSetting={updateSetting} />
            )}
            {activeTab === "privacy" && (
              <PrivacySettings 
                settings={settings} 
                updateSetting={updateSetting}
                onExportData={handleExportData}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Profile Settings Component with Photo Upload Only
const ProfileSettings = ({ settings, updateSetting, onImageUpload, isUploading, user }: any) => {
  const [isHovering, setIsHovering] = useState(false);
  const { toast } = useToast();

  const getInitials = (name: string) => {
    return name?.split(" ").map((word: string) => word[0]).join("").toUpperCase().slice(0, 2) || "U";
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPG, PNG, GIF, WebP).",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 5MB.",
        variant: "destructive",
      });
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageDataUrl = e.target?.result as string;
        updateSetting("imageUrl", imageDataUrl);
        toast({
          title: "✅ Profile picture updated",
          description: "Your photo has been uploaded successfully!",
          duration: 3000,
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({
        title: "❌ Upload failed",
        description: "Failed to upload profile picture. Please try again.",
        variant: "destructive",
      });
    } finally {
      event.target.value = '';
    }
  };

  const removePhoto = () => {
    updateSetting("imageUrl", "");
    toast({
      title: "📷 Photo removed",
      description: "Your profile picture has been removed.",
      duration: 3000,
    });
  };

  return (
    <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5 text-teal-700" />
          Profile Information
        </CardTitle>
        <CardDescription>
          Update your personal information and profile picture.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={settings.displayName || ""}
              onChange={(e) => updateSetting("displayName", e.target.value)}
              className="bg-white"
              placeholder="Enter your display name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={user?.email || settings.email || ""}
              className="bg-slate-50"
              disabled
              placeholder="Email from authentication"
            />
            <p className="text-sm text-gray-500">Email is managed by your authentication provider</p>
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-4">
          <h4 className="font-semibold flex items-center gap-2">
            <Camera className="w-4 h-4" />
            Profile Picture
          </h4>
          
          <div className="flex items-center gap-6">
            {/* Current Picture Display */}
            <div 
              className="relative group cursor-pointer"
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
              onClick={() => document.getElementById('photo-upload')?.click()}
            >
              <Avatar className="w-24 h-24 ring-2 ring-slate-200 transition-all duration-200 group-hover:ring-teal-300">
                {settings.imageUrl || user?.picture ? (
                  <AvatarImage 
                    src={settings.imageUrl || user?.picture} 
                    alt="Profile picture"
                    className="object-cover"
                  />
                ) : (
                  <AvatarFallback className="bg-teal-700 text-white font-semibold text-2xl">
                    {getInitials(settings.displayName || user?.given_name + " " + user?.family_name || "User")}
                  </AvatarFallback>
                )}
              </Avatar>
              
              {/* Hover Overlay */}
              <div className={cn(
                "absolute inset-0 bg-black/50 rounded-full flex items-center justify-center transition-opacity duration-200",
                isHovering ? "opacity-100" : "opacity-0"
              )}>
                <Camera className="w-6 h-6 text-white" />
              </div>
              
              {/* Upload indicator */}
              {isUploading && (
                <div className="absolute inset-0 bg-teal-700/50 rounded-full flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Upload Controls */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={isUploading}
                  onClick={() => document.getElementById('photo-upload')?.click()}
                  className="border-slate-200 bg-white hover:bg-teal-50 hover:text-teal-800"
                >
                  {isUploading ? (
                    <>
                      <div className="w-3 h-3 border-2 border-teal-700 border-t-transparent rounded-full animate-spin mr-2" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <UploadIcon className="w-3 h-3 mr-2" />
                      Upload Photo
                    </>
                  )}
                </Button>
                
                {(settings.imageUrl || user?.picture) && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={removePhoto}
                    className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3 mr-2" />
                    Remove
                  </Button>
                )}
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-gray-600">
                  📸 Click on the picture or upload button to change your photo
                </p>
                <p className="text-xs text-gray-500">
                  Supported: JPG, PNG, GIF, WebP • Max size: 5MB
                </p>
              </div>
            </div>
          </div>

          {/* Hidden File Input */}
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
            id="photo-upload"
          />
        </div>

        <Separator />

        <div className="space-y-4">
          <h4 className="font-semibold">Account Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="font-medium text-gray-700">Account Created</Label>
              <p className="text-gray-600">{new Date().toLocaleDateString()}</p>
            </div>
            <div>
              <Label className="font-medium text-gray-700">User ID</Label>
              <p className="text-gray-600 font-mono text-xs">{user?.id || "Loading..."}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Appearance Settings Component 
const AppearanceSettings = ({ settings, updateSetting, onReset }: any) => (
  <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
    <CardHeader>
      <CardTitle className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-teal-700" />
          Appearance & Theme
        </div>
        <Button
          onClick={onReset}
          variant="outline"
          size="sm"
          className="border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        >
          <RefreshCw className="w-3 h-3 mr-2" />
          Reset to Defaults
        </Button>
      </CardTitle>
      <CardDescription>
        Customize how the application looks and feels.
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="space-y-3">
        <Label>Theme</Label>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { value: "light", label: "Light", description: "Clean and bright", Icon: Sun },
            { value: "dark", label: "Dark", description: "Easy on the eyes", Icon: Moon },
            { value: "system", label: "System", description: "Follow device setting", Icon: Palette },
          ].map(({ value, label, description, Icon }) => {
            const isSelected = (settings.theme || "light") === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => updateSetting("theme", value)}
                aria-pressed={isSelected}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-4 text-left transition-colors",
                  isSelected
                    ? "border-teal-700 bg-teal-50 text-teal-900 ring-1 ring-teal-700"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                )}
              >
                <Icon className={cn("h-5 w-5 shrink-0", isSelected ? "text-teal-700" : "text-slate-500")} />
                <span>
                  <span className="block text-sm font-semibold">{label}</span>
                  <span className="mt-0.5 block text-xs text-slate-500">{description}</span>
                </span>
              </button>
            );
          })}
        </div>
        <p className="text-sm text-slate-500">Your theme preference applies throughout Abitso.</p>
      </div>

      <Separator />

      <div className="space-y-3">
        <Label>Font Size: {settings.fontSize || 16}px</Label>
        <Slider
          value={[settings.fontSize || 16]}
          onValueChange={(value) => updateSetting("fontSize", value[0])}
          min={12}
          max={24}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-slate-500">
          <span>12px (Small)</span>
          <span>16px (Default)</span>
          <span>24px (Large)</span>
        </div>
        <div className="rounded-xl border border-teal-100 bg-teal-50 p-3">
          <p className="text-sm text-teal-900">
            <strong>Font size:</strong> Adjusts text throughout the dashboard and settings.
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
);

// Notification Settings Component
const NotificationSettings = ({ settings, updateSetting }: any) => (
  <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Bell className="w-5 h-5 text-teal-700" />
        Notifications
      </CardTitle>
      <CardDescription>
        Manage how and when you receive notifications.
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="space-y-4">
        {[
          {
            key: "emailNotifications",
            title: "Email notifications",
            description: "Receive email updates about your account and documents"
          },
          {
            key: "processingAlerts",
            title: "Processing alerts",
            description: "Get notified when document processing is complete"
          },
          {
            key: "weeklyDigest",
            title: "Weekly digest",
            description: "Receive a weekly summary of your activity"
          },
          {
            key: "browserNotifications",
            title: "Browser notifications",
            description: "Show notifications in your browser"
          },
        ].map((notification) => (
          <div key={notification.key} className="flex items-center justify-between py-2">
            <div>
              <Label className="text-base">{notification.title}</Label>
              <p className="text-sm text-gray-500">{notification.description}</p>
            </div>
            <Switch
              checked={settings[notification.key] || false}
              onCheckedChange={(checked) => updateSetting(notification.key, checked)}
            />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

// Privacy Settings Component
const PrivacySettings = ({ settings, updateSetting, onExportData }: any) => (
  <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Shield className="w-5 h-5 text-teal-700" />
        Privacy & Security
      </CardTitle>
      <CardDescription>
        Control your privacy settings and data management.
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      {/* Data Export */}
      <div className="space-y-4">
        <Label className="text-lg font-medium">Data Export</Label>
        <div className="flex items-center justify-between p-4 rounded-xl border border-teal-100 bg-teal-50">
          <div>
            <h4 className="font-semibold text-teal-900">Export Your Data</h4>
            <p className="text-teal-800 text-sm">Download all your documents and settings</p>
          </div>
          <Button
            onClick={onExportData}
            className="bg-teal-700 hover:bg-teal-800"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      <Separator />

      {/* Privacy Settings */}
      <div className="space-y-4">
        {[
          {
            key: "publicProfile",
            title: "Public Profile",
            description: "Make your profile visible to other users"
          },
          {
            key: "shareUsageData",
            title: "Share Usage Data",
            description: "Help improve the service by sharing anonymous usage statistics"
          },
          {
            key: "analyticsOptOut",
            title: "Opt out of Analytics",
            description: "Prevent anonymous usage data collection"
          },
        ].map((setting) => (
          <div key={setting.key} className="flex items-center justify-between py-2">
            <div>
              <Label className="text-base">{setting.title}</Label>
              <p className="text-sm text-gray-500">{setting.description}</p>
            </div>
            <Switch
              checked={settings[setting.key] || false}
              onCheckedChange={(checked) => updateSetting(setting.key, checked)}
            />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export default SettingsPage;