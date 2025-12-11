import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Users,
  Shield,
  LogOut,
  Phone,
  Mail,
  CreditCard,
  LayoutDashboard,
  Car,
  FileWarning,
  Lock,
} from "lucide-react";

export function AppSidebar() {
  const { user, logout } = useAuth();
  const [location, navigate] = useLocation();
  const { setOpenMobile, isMobile } = useSidebar();

  const isAdmin = user?.role === "admin";

  // Fetch user features for non-admin users
  const { data: featuresData } = useQuery<{ success: boolean; features: string[] }>({
    queryKey: ["/api/user/features"],
    enabled: !isAdmin,
  });

  const userFeatures = featuresData?.features || [];

  const allSearchItems = [
    { title: "Mobile Search", searchType: "mobile", icon: Phone },
    { title: "Email Search", searchType: "email", icon: Mail },
    { title: "Aadhar Search", searchType: "aadhar", icon: CreditCard },
    { title: "PAN Search", searchType: "pan", icon: CreditCard },
    { title: "Vehicle Info", searchType: "vehicle-info", icon: Car },
    { title: "Vehicle Challan", searchType: "vehicle-challan", icon: FileWarning },
  ];

  const getUrl = (searchType: string) => 
    isAdmin ? `/admin?search=${searchType}` : `/dashboard?search=${searchType}`;

  // For admin, all features are enabled
  // For users, separate enabled and disabled features
  const enabledItems = isAdmin 
    ? allSearchItems 
    : allSearchItems.filter(item => userFeatures.includes(item.searchType));
  
  const disabledItems = isAdmin 
    ? [] 
    : allSearchItems.filter(item => !userFeatures.includes(item.searchType));

  const adminItems = [
    { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
    { title: "Manage Users", url: "/admin/users", icon: Users },
  ];

  const handleLogout = async () => {
    await logout();
  };

  const handleSearchClick = (url: string, searchType: string) => {
    navigate(url);
    // Dispatch custom event to notify dashboards of search type change
    window.dispatchEvent(new CustomEvent('searchTypeChange', { detail: { searchType } }));
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" data-testid="text-user-name">
              {user?.name || user?.username}
            </p>
            <Badge
              variant={isAdmin ? "default" : "secondary"}
              className="text-xs mt-1"
              data-testid="badge-user-role"
            >
              {isAdmin ? "Admin" : "User"}
            </Badge>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Management</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === item.url}
                    >
                      <Link href={item.url} data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Enabled Features */}
        {enabledItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center gap-2">
              <Search className="w-3 h-3" />
              Search Services
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {enabledItems.map((item) => {
                  const isActive = window.location.search.includes(`search=${item.searchType}`);
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        isActive={isActive}
                        onClick={() => handleSearchClick(getUrl(item.searchType), item.searchType)}
                        data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Disabled Features - shown at bottom */}
        {disabledItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center gap-2 text-muted-foreground/60">
              <Lock className="w-3 h-3" />
              Locked Features
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {disabledItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      disabled
                      className="opacity-50 cursor-not-allowed"
                      data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}-disabled`}
                    >
                      <item.icon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{item.title}</span>
                      <Lock className="w-3 h-3 ml-auto text-muted-foreground/60" />
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2"
          onClick={handleLogout}
          data-testid="button-logout"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
