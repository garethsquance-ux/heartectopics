import { useNavigate, useLocation } from "react-router-dom";
import { Users, BookOpen, BookHeart } from "lucide-react";
import { Button } from "@/components/ui/button";

const DesktopNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Users, label: "Community", path: "/community" },
    { icon: BookHeart, label: "Success Stories", path: "/success-stories" },
    { icon: BookOpen, label: "Founder's Story", path: "/founder-story" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="hidden md:flex items-center gap-2">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.path);
        
        return (
          <Button
            key={item.path}
            variant={active ? "secondary" : "ghost"}
            size="sm"
            onClick={() => navigate(item.path)}
            className="gap-2"
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Button>
        );
      })}
    </nav>
  );
};

export default DesktopNavigation;
