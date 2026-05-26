import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Settings,
  MapPin,
  Shield,
  Save,
  AlertTriangle,
  Info,
  Globe,
  Bell,
  BellOff
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

export default function SettingsTab() {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    searchRadius: "30",
    lowRiskThreshold: "0.29",
    moderateRiskThreshold: "0.49",
    highRiskThreshold: "0.74",
    notificationsEnabled: true
  });

  // Load saved settings on mount
  useEffect(() => {
    const saved = localStorage.getItem('systemSettings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
    
    // Load notification preference from user session
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    if (storedUser.notifications_enabled !== undefined) {
      setSettings(prev => ({ ...prev, notificationsEnabled: storedUser.notifications_enabled }));
    }
  }, []);

  const handleSave = async () => {
    localStorage.setItem('systemSettings', JSON.stringify(settings));
    
    // Sync with backend
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    if (storedUser.email) {
      try {
        const response = await fetch("http://127.0.0.1:8000/users/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: storedUser.email,
            notifications_enabled: settings.notificationsEnabled
          })
        });
        
        if (response.ok) {
          // Update local user session
          storedUser.notifications_enabled = settings.notificationsEnabled;
          localStorage.setItem("user", JSON.stringify(storedUser));
        }
      } catch (error) {
        console.error("Failed to sync settings with backend", error);
      }
    }

    toast({
      title: "Settings Saved",
      description: "Preferences and notification settings updated successfully.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-medical-success">
            {settings.notificationsEnabled ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
            Automated Notifications
          </CardTitle>
          <CardDescription>
            Manage your scheduled health alerts and reminders
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="space-y-0.5">
              <Label className="text-base font-bold">Email Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Receive alerts based on your Daily Fitness & Health Schedule
              </p>
            </div>
            <Switch
              checked={settings.notificationsEnabled}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, notificationsEnabled: checked }))}
            />
          </div>
          <Alert className="bg-emerald-50/50 border-emerald-100">
            <Info className="h-4 w-4 text-emerald-600" />
            <AlertDescription className="text-xs text-emerald-700">
              When enabled, NutriVision will send you an email at the start of each activity in your latest health schedule (e.g., 06:00, 07:30, etc.).
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Search Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-medical-info">
            <MapPin className="h-5 w-5" />
            Mapping Preferences
          </CardTitle>
          <CardDescription>
            Configure how the system discovers nearby medical assistance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-md">
            <Label htmlFor="searchRadius" className="font-bold text-gray-700">Hospital Search Radius (km)</Label>
            <div className="flex items-center gap-4 mt-2">
              <Input
                id="searchRadius"
                type="number"
                min="1"
                max="50"
                value={settings.searchRadius}
                onChange={(e) => setSettings(prev => ({ ...prev, searchRadius: e.target.value }))}
                className="w-32 font-bold"
              />
              <span className="text-sm text-muted-foreground">Default: 30km for comprehensive search</span>
            </div>
          </div>
          <Alert className="bg-blue-50/50 border-blue-100">
            <Info className="h-4 w-4 text-medical-info" />
            <AlertDescription className="text-xs text-blue-700">
              The search radius directly impacts the Overpass API query used in the New Assessment tab.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Clinical Risk Thresholds */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-medical-warning">
            <Shield className="h-5 w-5" />
            Clinical Risk Thresholds
          </CardTitle>
          <CardDescription>
            Define the numerical boundaries for malnutrition risk classification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert variant="destructive" className="bg-medical-danger/5 border-medical-danger/10">
            <AlertTriangle className="h-4 w-4 text-medical-danger" />
            <AlertDescription className="text-xs font-medium text-medical-danger">
              WARNING: These values define how patients are categorized. Changes should only be made based on official clinical guidelines.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="font-bold">Low Risk Entry</Label>
              <Input
                type="number"
                step="0.01"
                value={settings.lowRiskThreshold}
                onChange={(e) => setSettings(prev => ({ ...prev, lowRiskThreshold: e.target.value }))}
                className="font-bold"
              />
              <div className="text-[10px] text-muted-foreground uppercase font-bold">Safe Zone: 0.00 - {settings.lowRiskThreshold}</div>
            </div>

            <div className="space-y-2">
              <Label className="font-bold">Moderate Risk Entry</Label>
              <Input
                type="number"
                step="0.01"
                value={settings.moderateRiskThreshold}
                onChange={(e) => setSettings(prev => ({ ...prev, moderateRiskThreshold: e.target.value }))}
                className="font-bold"
              />
              <div className="text-[10px] text-muted-foreground uppercase font-bold">Watch Zone: {settings.moderateRiskThreshold}</div>
            </div>

            <div className="space-y-2">
              <Label className="font-bold">High Risk Entry</Label>
              <Input
                type="number"
                step="0.01"
                value={settings.highRiskThreshold}
                onChange={(e) => setSettings(prev => ({ ...prev, highRiskThreshold: e.target.value }))}
                className="font-bold"
              />
              <div className="text-[10px] text-muted-foreground uppercase font-bold">Danger Zone: &gt; {settings.highRiskThreshold}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} className="px-8 bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 text-white font-bold h-12 shadow-lg shadow-blue-200">
          <Save className="mr-2 h-5 w-5" />
          APPLY CONFIGURATION
        </Button>
      </div>

      <Separator />

      {/* System Information */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-muted-foreground py-4">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-widest">NutriInsight v2.1.0 • Stable Build</span>
        </div>
        <div className="text-[10px] font-medium">
          Integrated with OpenStreetMap & OSRM Routing Engine
        </div>
      </div>
    </div>
  );
}