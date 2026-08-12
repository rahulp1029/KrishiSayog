import { Link, useLocation } from "react-router-dom";
import { Sprout, LayoutDashboard, Layers, Brain, Bug, Cloud, TrendingUp, MessageCircle, Bell, Settings, ShoppingBag, Cpu, FileText } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Soil Data", url: "/dashboard/soil", icon: Layers },
  { title: "Crop Recommendations", url: "/dashboard/crops", icon: Brain },
  { title: "Disease Detection", url: "/disease-detection", icon: Bug },
  { title: "Weather Forecast", url: "/dashboard/weather", icon: Cloud },
  { title: "IoT Control", url: "/dashboard/iot", icon: Cpu },
  { title: "Market Prices", url: "/market-insights", icon: TrendingUp },
  { title: "Marketplace", url: "/dashboard/marketplace", icon: ShoppingBag },
  { title: "AI Chatbot", url: "/chatbot", icon: MessageCircle },
  { title: "Alerts", url: "/dashboard/alerts", icon: Bell },
  { title: "Govt Schemes", url: "/dashboard/schemes", icon: FileText },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

export function DashboardSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="p-4 flex items-center gap-2">
          <Sprout className="h-6 w-6 shrink-0" />
          {!collapsed && <span className="font-bold text-lg">KrishiSayog</span>}
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
