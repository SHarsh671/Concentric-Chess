import { Gamepad, Book, History, Settings } from "lucide-react";

import * as React from "react";

import {
  Sidebar,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { getSession } from "@/lib/auth";
import { Button } from "./ui/button";

// This is sample data.
const data = [
  {
    title: "Play",
    url: "/play",
    icon: Gamepad,
  },
  {
    title: "History",
    url: "/history",
    icon: History,
  },
  {
    title: "Rules",
    url: "/rules",
    icon: Book,
  },
];

export async function AppShell({
  children,
}: React.ComponentProps<typeof Sidebar>) {
  const session = await getSession();
  console.log("AppShell session:", session);

  return (
    <SidebarProvider>
      <Sidebar className="border-r-0">
        <SidebarHeader className="py-0 pt-2">
          <a className="flex h-10 items-center px-1 gap-2" href="/">
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-7 items-center justify-center rounded-md">
              <Gamepad className="size-5" />
            </div>
            <span className="truncate font-medium">Concentric Chess</span>
          </a>
        </SidebarHeader>
        <SidebarContent className="px-2">
          <SidebarMenu>
            {data.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <a href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
          {session ? (
            <SidebarMenu className="mt-auto pb-2">
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="/settings">
                    <Settings />
                    <span>Settings</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          ) : (
            <div className="mt-auto pb-2 flex flex-col gap-2">
              <Button className="w-full">
                <a href="/signup">
                  <span>Sign Up</span>
                </a>
              </Button>
              <Button className="w-full" variant="secondary">
                <a href="/login">
                  <span>Log In</span>
                </a>
              </Button>
            </div>
          )}
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 md:hidden">
          <div className="flex flex-1 items-center gap-2 px-3">
            <SidebarTrigger />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 px-4 pb-2 md:pt-2">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
