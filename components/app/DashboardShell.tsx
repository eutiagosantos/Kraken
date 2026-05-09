"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Sidebar } from "./sidebar/Sidebar";
import { SidebarProvider, useSidebar } from "./sidebar/SidebarContext";
import { Topbar } from "./topbar/Topbar";

function MainColumn({ children }: { children: ReactNode }) {
  const { collapsed, ready } = useSidebar();
  const pathname = usePathname();

  return (
    <div
      className={cn(
        "flex min-h-screen flex-1 flex-col transition-all duration-300 ease-in-out",
        ready ? (collapsed ? "md:ml-16" : "md:ml-[240px]") : "md:ml-[240px]"
      )}
    >
      <Topbar pathname={pathname} />
      <div className="flex-1 p-4 md:p-6">{children}</div>
    </div>
  );
}

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-dashboard-base font-ui antialiased">
        <Sidebar />
        <MainColumn>{children}</MainColumn>
      </div>
    </SidebarProvider>
  );
}
