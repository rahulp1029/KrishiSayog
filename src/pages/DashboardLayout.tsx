import { Outlet, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { Bell, LogOut, Mail, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useRef, useEffect } from "react";

const pageTitles: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/soil": "Soil Data",
  "/dashboard/crops": "Crop Recommendations",
  "/dashboard/weather": "Weather Forecast",
  "/dashboard/alerts": "Alerts",
  "/dashboard/settings": "Settings",
  "/dashboard/marketplace": "Marketplace",
  "/dashboard/iot": "IoT Control Panel",
  "/dashboard/schemes": "Government Schemes",
};

export default function DashboardLayout() {
  const location = useLocation();
  const title = pageTitles[location.pathname] || "Dashboard";
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Compute initials from name or email
  const getInitials = () => {
    if (user?.name) {
      return user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center justify-between border-b px-4 bg-card/80 backdrop-blur-sm sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="mr-2" />
              <div className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground">
                <span>Dashboard</span>
                {title !== "Overview" && (
                  <>
                    <span>/</span>
                    <span className="text-foreground font-medium">{title}</span>
                  </>
                )}
              </div>
              <h2 className="font-semibold text-lg sm:hidden">{title}</h2>
            </div>
            <div className="flex items-center gap-2">
              <button className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-primary transition-colors relative">
                <Bell className="h-4 w-4" />
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-accent" />
              </button>

              {/* User Avatar with Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown((prev) => !prev)}
                  className="h-8 w-8 rounded-full hero-gradient flex items-center justify-center text-xs font-bold text-primary-foreground overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-transform hover:scale-105"
                  title={user?.email || "User"}
                >
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name || "User avatar"}
                      className="h-full w-full rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    getInitials()
                  )}
                </button>

                {/* Dropdown Menu */}
                {showDropdown && (
                  <div className="absolute right-0 top-10 w-72 bg-card border rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full hero-gradient flex items-center justify-center text-sm font-bold text-primary-foreground overflow-hidden shrink-0">
                          {user?.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.name || "User avatar"}
                              className="h-full w-full rounded-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            getInitials()
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">
                            {user?.name || "User"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                            <Mail className="h-3 w-3 shrink-0" />
                            {user?.email || "No email"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-1">
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 bg-background overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
