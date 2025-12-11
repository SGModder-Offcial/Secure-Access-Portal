import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams, Link } from "wouter";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Shield,
  ArrowLeft,
  User,
  Mail,
  Calendar,
  Clock,
  Search,
  Phone,
  CreditCard,
  Car,
  FileWarning,
  UserCheck,
  UserX,
  Hash,
  Activity,
  Settings,
  Loader2,
  AlertCircle,
  Globe,
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

const SEARCH_TYPE_INFO: Record<string, { label: string; icon: React.ReactNode }> = {
  mobile: { label: "Mobile", icon: <Phone className="w-3.5 h-3.5" /> },
  email: { label: "Email", icon: <Mail className="w-3.5 h-3.5" /> },
  aadhar: { label: "Aadhar", icon: <CreditCard className="w-3.5 h-3.5" /> },
  pan: { label: "PAN", icon: <CreditCard className="w-3.5 h-3.5" /> },
  vehicle_info: { label: "Vehicle Info", icon: <Car className="w-3.5 h-3.5" /> },
  vehicle_challan: { label: "Challan", icon: <FileWarning className="w-3.5 h-3.5" /> },
  ip: { label: "IP Lookup", icon: <Globe className="w-3.5 h-3.5" /> },
};

interface UserDetailData {
  success: boolean;
  user: {
    _id: string;
    username: string;
    name: string;
    email: string;
    status: "active" | "inactive";
    features: string[];
    createdAt: string;
    lastLogin?: string;
  };
  searchHistory: Array<{
    _id: string;
    searchType: string;
    searchQuery: string;
    resultCount: number;
    timestamp: string;
  }>;
  searchStats: {
    total: number;
    mobile: number;
    email: number;
    aadhar: number;
    pan: number;
    vehicleInfo: number;
    vehicleChallan: number;
  };
  allFeatures: string[];
}

export function UserDetail() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [pendingFeatures, setPendingFeatures] = useState<string[] | null>(null);

  const { data, isLoading, error } = useQuery<UserDetailData>({
    queryKey: ["/api/admin/users", params.id, "details"],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${params.id}/details`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch user details");
      return res.json();
    },
  });

  const featuresMutation = useMutation({
    mutationFn: async (features: string[]) => {
      const res = await apiRequest("PUT", `/api/admin/users/${params.id}/features`, { features });
      return res.json();
    },
    onSuccess: (result) => {
      if (result.success) {
        toast({ title: "Success", description: "Features updated successfully" });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/users", params.id, "details"] });
        setPendingFeatures(null);
      } else {
        toast({ title: "Error", description: result.error || "Failed to update features", variant: "destructive" });
      }
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update features", variant: "destructive" });
    },
  });

  const currentFeatures = pendingFeatures ?? data?.user?.features ?? [];

  const toggleFeature = (feature: string) => {
    const newFeatures = currentFeatures.includes(feature)
      ? currentFeatures.filter(f => f !== feature)
      : [...currentFeatures, feature];
    setPendingFeatures(newFeatures);
  };

  const saveFeatures = () => {
    if (pendingFeatures) {
      featuresMutation.mutate(pendingFeatures);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
              <div className="space-y-6">
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-60 w-full" />
                <Skeleton className="h-96 w-full" />
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  if (error || !data?.success) {
    return (
      <SidebarProvider style={style as React.CSSProperties}>
        <div className="flex h-screen w-full">
          <AppSidebar />
          <div className="flex flex-col flex-1 min-w-0">
            <header className="flex items-center justify-between gap-4 px-4 py-3 glass sticky top-0 z-50">
              <div className="flex items-center gap-3">
                <SidebarTrigger data-testid="button-sidebar-toggle" />
                <h1 className="text-lg font-semibold">User Details</h1>
              </div>
              <ThemeToggle />
            </header>
            <main className="flex-1 overflow-auto p-4 md:p-6">
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <AlertCircle className="w-12 h-12 text-destructive" />
                <p className="text-lg font-medium">User not found</p>
                <Button onClick={() => setLocation("/admin/users")} data-testid="button-back-users">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Users
                </Button>
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  const { user, searchHistory, searchStats } = data;

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between gap-4 px-4 py-3 glass sticky top-0 z-50">
            <div className="flex items-center gap-3">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <Link href="/admin/users">
                <Button variant="ghost" size="icon" data-testid="button-back">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-lg font-semibold" data-testid="text-user-name">{user.name}</h1>
                <p className="text-sm text-muted-foreground">@{user.username}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={user.status === "active" ? "default" : "secondary"}>
                {user.status === "active" ? <UserCheck className="w-3 h-3 mr-1" /> : <UserX className="w-3 h-3 mr-1" />}
                {user.status}
              </Badge>
              <Badge className="hidden sm:flex items-center gap-1.5">
                <Shield className="w-3 h-3" />
                <span className="text-xs">Admin Access</span>
              </Badge>
              <ThemeToggle />
            </div>
          </header>
          
          <main className="flex-1 overflow-auto p-4 md:p-6">
            <div className="space-y-6 max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      User Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <User className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">Full Name</p>
                          <p className="font-medium truncate" data-testid="text-fullname">{user.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <Hash className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">Username</p>
                          <p className="font-mono font-medium truncate" data-testid="text-username">{user.username}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">Email</p>
                          <p className="font-medium truncate" data-testid="text-email">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">Created</p>
                          <p className="font-medium" data-testid="text-created">{formatDate(user.createdAt)}</p>
                        </div>
                      </div>
                      {user.lastLogin && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                          <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs text-muted-foreground">Last Login</p>
                            <p className="font-medium" data-testid="text-lastlogin">{formatDate(user.lastLogin)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Search Statistics
                    </CardTitle>
                    <CardDescription>Total {searchStats.total} searches performed</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                        <div className="p-2 rounded-md bg-blue-500/10">
                          <Phone className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold" data-testid="stat-mobile">{searchStats.mobile}</p>
                          <p className="text-xs text-muted-foreground">Mobile</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                        <div className="p-2 rounded-md bg-green-500/10">
                          <Mail className="w-5 h-5 text-green-500" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold" data-testid="stat-email">{searchStats.email}</p>
                          <p className="text-xs text-muted-foreground">Email</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                        <div className="p-2 rounded-md bg-purple-500/10">
                          <CreditCard className="w-5 h-5 text-purple-500" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold" data-testid="stat-aadhar">{searchStats.aadhar}</p>
                          <p className="text-xs text-muted-foreground">Aadhar</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                        <div className="p-2 rounded-md bg-orange-500/10">
                          <CreditCard className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold" data-testid="stat-pan">{searchStats.pan}</p>
                          <p className="text-xs text-muted-foreground">PAN</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                        <div className="p-2 rounded-md bg-cyan-500/10">
                          <Car className="w-5 h-5 text-cyan-500" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold" data-testid="stat-vehicle">{searchStats.vehicleInfo}</p>
                          <p className="text-xs text-muted-foreground">Vehicle</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                        <div className="p-2 rounded-md bg-red-500/10">
                          <FileWarning className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold" data-testid="stat-challan">{searchStats.vehicleChallan}</p>
                          <p className="text-xs text-muted-foreground">Challan</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Feature Access
                    </CardTitle>
                    <CardDescription>Control which features this user can access</CardDescription>
                  </div>
                  {pendingFeatures && (
                    <Button onClick={saveFeatures} disabled={featuresMutation.isPending} data-testid="button-save-features">
                      {featuresMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Save Changes
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(FEATURE_INFO).map(([key, info]) => (
                      <div
                        key={key}
                        className={`flex items-center justify-between gap-4 p-4 rounded-lg border transition-colors ${
                          currentFeatures.includes(key) ? "bg-primary/5 border-primary/20" : "bg-muted/30"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`p-2 rounded-md ${currentFeatures.includes(key) ? "bg-primary/10" : "bg-muted"}`}>
                            {info.icon}
                          </div>
                          <div className="min-w-0">
                            <Label htmlFor={`feature-${key}`} className="font-medium cursor-pointer">
                              {info.label}
                            </Label>
                            <p className="text-xs text-muted-foreground truncate">{info.description}</p>
                          </div>
                        </div>
                        <Switch
                          id={`feature-${key}`}
                          checked={currentFeatures.includes(key)}
                          onCheckedChange={() => toggleFeature(key)}
                          data-testid={`switch-feature-${key}`}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="w-5 h-5" />
                    Search History
                  </CardTitle>
                  <CardDescription>All searches performed by this user ({searchHistory.length} total)</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {searchHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Search className="w-10 h-10 text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">No search history yet</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px]">
                      <div className="divide-y divide-border">
                        {searchHistory.map((item) => {
                          const typeInfo = SEARCH_TYPE_INFO[item.searchType] || { label: item.searchType, icon: <Search className="w-3.5 h-3.5" /> };
                          return (
                            <div
                              key={item._id}
                              className="flex items-center gap-4 px-6 py-4 hover-elevate"
                              data-testid={`history-item-${item._id}`}
                            >
                              <div className="p-2 rounded-md bg-muted shrink-0">
                                {typeInfo.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant="outline" className="text-xs">
                                    {typeInfo.label}
                                  </Badge>
                                  <span className="font-mono text-sm truncate" data-testid="text-search-query">
                                    {item.searchQuery}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1" data-testid="text-search-time">
                                  {formatDate(item.timestamp)}
                                </p>
                              </div>
                              <Badge variant="secondary" className="shrink-0">
                                {item.resultCount} results
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default UserDetail;
