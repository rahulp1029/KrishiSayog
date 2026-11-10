import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Droplets, Wheat, MessageSquareText, Bell } from "lucide-react";

export function MobileBottomNav() {
  const location = useLocation();

  const navItems = [
    {
      label: "Home",
      to: "/dashboard",
      icon: LayoutDashboard,
      isActive: location.pathname === "/dashboard",
    },
    {
      label: "Pump & IoT",
      to: "/dashboard/iot",
      icon: Droplets,
      isActive: location.pathname === "/dashboard/iot",
    },
    {
      label: "AI Crops",
      to: "/dashboard/crops",
      icon: Wheat,
      isActive: location.pathname === "/dashboard/crops",
    },
    {
      label: "AI Chat",
      to: "/chatbot",
      icon: MessageSquareText,
      isActive: location.pathname === "/chatbot",
    },
    {
      label: "Alerts",
      to: "/dashboard/alerts",
      icon: Bell,
      isActive: location.pathname === "/dashboard/alerts",
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/90 backdrop-blur-xl border-t border-border/80 px-2 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              to={item.to}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-200 relative ${
                item.isActive
                  ? "text-primary font-semibold scale-105"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div
                className={`p-1 rounded-lg transition-colors ${
                  item.isActive ? "bg-primary/10 text-primary" : ""
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
              {item.isActive && (
                <span className="absolute bottom-0 w-4 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
