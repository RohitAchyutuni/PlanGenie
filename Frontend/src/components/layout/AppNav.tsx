import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Compass, Plus, User, LogOut, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { clearCurrentUser, getCurrentUser } from "@/lib/authApi";

interface AppNavProps {
  onNewChat: () => void;
  onToggleSidebar: () => void;
  hasEmptyThread: boolean;
}

export function AppNav({ onNewChat, onToggleSidebar, hasEmptyThread }: AppNavProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";

  const handleLogoClick = () => {
    navigate(isAuthenticated ? "/app" : "/");
  };

  const handleLogout = () => {
    clearCurrentUser();
    toast({ title: "Logged out successfully" });
    navigate("/login");
  };

  const currentUser = getCurrentUser();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center gap-4 px-4">
        <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="lg:flex">
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2 cursor-pointer" onClick={handleLogoClick}>
          <Compass className="h-5 w-5 text-primary" />
          <span className="font-bold">PlanGenie</span>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            onClick={onNewChat}
            className="transition-opacity"
          >
            <Plus className="h-4 w-4 mr-1" />
            New Trip
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                {currentUser ? currentUser.full_name : "My Account"}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/app/profile")}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
