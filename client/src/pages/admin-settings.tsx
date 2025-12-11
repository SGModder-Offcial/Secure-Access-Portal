import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Shield,
  Settings,
  Phone,
  Mail,
  CreditCard,
  Car,
  FileWarning,
  Globe,
  Loader2,
  Power,
  AlertTriangle,
} from "lucide-react";

const FEATURE_INFO: Record<string, { label: string; icon: React.ReactNode; description: string }> = {
  mobile: { label: "Mobile Search", icon: <Phone className="w-4 h-4" />, description: "Search by mobile number" },
  email: { label: "Email Search", icon: <Mail className="w-4 h-4" />, description: "Search by email address" },
  aadhar: { label: "Aadhar Search", icon: <CreditCard className="w-4 h-4" />, description: "Search by Aadhar number" },
  pan: { label: "PAN Search", icon: <CreditCard className="w-4 h-4" />, description: "Search by PAN card" },
  "vehicle-info": { label: "Vehicle Info", icon: <Car className="w-4 h-4" />, description: "Get vehicle information" },
  "vehicle-challan": { label: "Vehicle Challan", icon: <FileWarning className="w-4 h-4" />, description: "Check vehicle challans" },
  ip: { label: "IP Lookup", icon: <Globe className="w-4 h-4" />, description: "Lookup IP address location" },
};

interface GlobalSettingsData {
  success: boolean;
  settings: {
    _id: string;
    key: string;
    enabledFeatures: string[];
    updatedAt: string;
  };
  allFeatures: string[];
}

export function AdminSettings() {
  const { toast } = useToast();
  const [pendingFeatures, setPendingFeatures] = useState<string[] | null>(null);

  const { data, isLoading, error } = useQuery<GlobalSettingsData>({
    queryKey: ["/api/admin/settings/global"],
    queryFn: async () => {
      const res = await fetch("/api/admin/settings/global", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch settings");
      return res.json();
    },
  });

  const mutation = useMutation({
    mutationFn: async (enabledFeatures: string[]) => {
      const res = await apiRequest("PUT", "/api/admin/settings/global", { enabledFeatures });
      return res.json();
    },
    onSuccess: (result) => {
      if (result.success) {
        toast({ title: "Success", description: "Global settings updated successfully" });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/settings/global"] });
        queryClient.invalidateQueries({ queryKey: ["/api/user/features"] });
        setPendingFeatures(null);
      } else {
        toast({ title: "Error", description: result.error || "Failed to update settings", variant: "destructive" });
      }
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update settings", variant: "destructive" });
    },
  });

  const currentFeatures = pendingFeatures ?? data?.settings?.enabledFeatures ?? [];
  const allFeatures = data?.allFeatures ?? Object.keys(FEATURE_INFO);

  const toggleFeature = (feature: string) => {
    const newFeatures = currentFeatures.includes(feature)
      ? currentFeatures.filter(f => f !== feature)
      : [...currentFeatures, feature];
    setPendingFeatures(newFeatures);
  };

  const saveSettings = () => {
    if (pendingFeatures) {
      mutation.mutate(pendingFeatures);
    }
  };

  const enableAll = () => {
    setPendingFeatures([...allFeatures]);
  };

  const disableAll = () => {
    setPendingFeatures([]);
  };

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  if (isLoading) {
    return (
      <SidebarProvider style={style as React.CSSProperties}>
        <div className="flex h-screen w-full">
          <AppSidebar />
          <div className="flex flex-col flex-1 min-w-0">
            <header className="flex items-center justify-between gap-4 px-4 py-3 glass sticky top-0 z-50">
              <div className="flex items-center gap-3">
                <SidebarTrigger data-testid="button-sidebar-toggle" />
                <Skeleton className="h-6 w-48" />
              </div>
              <ThemeToggle />
            </header>
            <main className="flex-1 overflow-auto p-4 md:p-6">
              <div className="space-y-6 max-w-4xl mx-auto">
                <Skeleton className="h-60 w-full" />
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between gap-4 px-4 py-3 glass sticky top-0 z-50">
            <div className="flex items-center gap-3">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <div>
                <h1 className="text-lg font-semibold" data-testid="text-page-title">Global Settings</h1>
                <p className="text-sm text-muted-foreground">Control features for all users</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="hidden sm:flex items-center gap-1.5">
                <Shield className="w-3 h-3" />
                <span className="text-xs">Admin Access</span>
              </Badge>
              <ThemeToggle />
            </div>
          </header>
          
          <main className="flex-1 overflow-auto p-4 md:p-6">
            <div className="space-y-6 max-w-4xl mx-auto">
              <Card>
                <CardHeader className="flex flex-row items-start justify-between gap-4 flex-wrap">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Power className="w-5 h-5" />
                      Global Feature Control
                    </CardTitle>
                    <CardDescription className="mt-2">
                      Enable or disable features globally for ALL users. When a feature is OFF here, no user can access it regardless of their individual settings.
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button variant="outline" size="sm" onClick={enableAll} data-testid="button-enable-all">
                      Enable All
                    </Button>
                    <Button variant="outline" size="sm" onClick={disableAll} data-testid="button-disable-all">
                      Disable All
                    </Button>
                    {pendingFeatures && (
                      <Button onClick={saveSettings} disabled={mutation.isPending} data-testid="button-save-settings">
                        {mutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        Save Changes
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      If any API is not working, you can turn it OFF here. This will disable that feature for all users until you turn it back ON.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {allFeatures.map((feature) => {
                      const info = FEATURE_INFO[feature] || { label: feature, icon: <Settings className="w-4 h-4" />, description: "" };
                      const isEnabled = currentFeatures.includes(feature);
                      return (
                        <div
                          key={feature}
                          className={`flex items-center justify-between gap-4 p-4 rounded-lg border transition-colors ${
                            isEnabled ? "bg-primary/5 border-primary/20" : "bg-destructive/5 border-destructive/20"
                          }`}
                          data-testid={`feature-row-${feature}`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`p-2 rounded-md ${isEnabled ? "bg-primary/10" : "bg-destructive/10"}`}>
                              {info.icon}
                            </div>
                            <div className="min-w-0">
                              <Label htmlFor={`global-feature-${feature}`} className="font-medium cursor-pointer">
                                {info.label}
                              </Label>
                              <p className="text-xs text-muted-foreground truncate">{info.description}</p>
                            </div>
                          </div>
                          <Switch
                            id={`global-feature-${feature}`}
                            checked={isEnabled}
                            onCheckedChange={() => toggleFeature(feature)}
                            data-testid={`switch-global-${feature}`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Settings className="w-4 h-4" />
                    How it works
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    <strong className="text-foreground">Global Control:</strong> Features turned OFF here will be disabled for ALL users, including those who have the feature enabled in their profile.
                  </p>
                  <p>
                    <strong className="text-foreground">User Control:</strong> Individual user feature settings (in user details page) only work for features that are globally enabled.
                  </p>
                  <p>
                    <strong className="text-foreground">API Issues:</strong> If an API stops working, turn off that feature here. Users won't see it in their sidebar until you turn it back on.
                  </p>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default AdminSettings;
