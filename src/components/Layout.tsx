
import React from "react";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

const Layout = ({ children, className }: LayoutProps) => {
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
          </nav>
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
