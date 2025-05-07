
import React from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

const Layout = ({ children, className }: LayoutProps) => {
  const { user, profile, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className={cn("min-h-screen flex flex-col", className)}>
      <header className="border-b shadow-sm bg-white">
        <div className="container flex h-16 items-center px-4 md:px-6">
          <a href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-zoom-blue">ZoomFree</span>
          </a>
          <nav className="ml-auto flex gap-2">
            <a
              href="/"
              className="text-sm font-medium px-4 py-2 hover:text-zoom-blue transition-colors"
            >
              Home
            </a>
            <a
              href="/meetings"
              className="text-sm font-medium px-4 py-2 hover:text-zoom-blue transition-colors"
            >
              Meetings
            </a>
            <a
              href="/attendance"
              className="text-sm font-medium px-4 py-2 hover:text-zoom-blue transition-colors"
            >
              Attendance
            </a>
            {isAdmin && (
              <a
                href="/admin"
                className="text-sm font-medium px-4 py-2 hover:text-zoom-blue transition-colors"
              >
                Admin
              </a>
            )}
          </nav>

          <div className="ml-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={profile?.avatar_url} alt={profile?.username || user.email} />
                      <AvatarFallback>
                        {profile?.username?.charAt(0) || user.email?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <div className="flex flex-col space-y-1 p-2">
                    <p className="text-sm font-medium leading-none">{profile?.full_name || 'User'}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {profile?.username ? `@${profile.username}` : user.email}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    Profile Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={() => navigate('/auth')} variant="default">
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t py-4 bg-zoom-lightGray">
        <div className="container flex flex-col items-center justify-between gap-4 px-4 md:flex-row md:px-6">
          <p className="text-center text-sm text-muted-foreground md:text-left">
            &copy; {new Date().getFullYear()} ZoomFree. All rights reserved.
          </p>
          <div className="flex gap-4">
            <a href="#" className="text-sm text-muted-foreground hover:underline">
              Terms
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:underline">
              Privacy
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:underline">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
