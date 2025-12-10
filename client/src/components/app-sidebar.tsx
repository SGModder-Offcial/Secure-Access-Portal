import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/auth-context";
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
} from "lucide-react";

export function AppSidebar() {
  const { user, logout } = useAuth();
  const [location, navigate] = useLocation();
  const { setOpenMobile, isMobile } = useSidebar();

  const isOwner = user?.role === "owner";

  const searchItems = isOwner
    ? [
        { title: "Mobile Search", url: "/owner?search=mobile", searchType: "mobile", icon: Phone },
        { title: "Email Search", url: "/owner?search=email", searchType: "email", icon: Mail },
        { title: "ID Search", url: "/owner?search=id", searchType: "id", icon: CreditCard },
      ]
    : [
        { title: "Mobile Search", url: "/dashboard?search=mobile", searchType: "mobile", icon: Phone },
        { title: "Email Search", url: "/dashboard?search=email", searchType: "email", icon: Mail },
        { title: "ID Search", url: "/dashboard?search=id", searchType: "id", icon: CreditCard },
      ];

  const ownerItems = [
    { title: "Dashboard", url: "/owner", icon: LayoutDashboard },
    { title: "Manage Admins", url: "/owner/admins", icon: Users },
  ];

  const handleLogout = async () => {
    await logout();
  };

  const handleSearchClick = (url: string) => {
    navigate(url);
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
              variant={isOwner ? "default" : "secondary"}
              className="text-xs mt-1"
              data-testid="badge-user-role"
            >
              {isOwner ? "Owner" : "Admin"}
            </Badge>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {isOwner && (
          <SidebarGroup>
            <SidebarGroupLabel>Management</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {ownerItems.map((item) => (
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

        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2">
            <Search className="w-3 h-3" />
            Search Services
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {searchItems.map((item) => {
                const isActive = window.location.search.includes(`search=${item.searchType}`);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => handleSearchClick(item.url)}
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
