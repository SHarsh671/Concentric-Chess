import { Gamepad, Book, History, Settings, FlaskConical } from "lucide-react";

import * as React from "react";
import { cn } from "@/lib/utils";

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
import Link from "next/link";

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
  {
    title: "Test Board",
    url: "/test-board",
    icon: FlaskConical,
  },
];

export async function AppShell({
  children,
}: React.ComponentProps<typeof Sidebar>) {
  const session = await getSession();

  return (
    <SidebarProvider>
      <Sidebar className="border-r-0">
        <SidebarHeader className="py-2 pt-2">
          <Link className="flex h-10 items-center px-1 gap-2" href="/">
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-7 items-center justify-center rounded-md">
              <Gamepad className="size-5" />
            </div>
            <span className="truncate font-bold">Concentric Chess</span>
          </Link>
        </SidebarHeader>
        <SidebarContent className="px-2">
          <SidebarMenu className="gap-2">
            {data.map((item) => {
              const blendIntoSidebar = ["Play", "History", "Rules", "Test Board"].includes(
                item.title,
              );

              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className={cn(
                      "h-9 px-2.5",
                      blendIntoSidebar
                        ? "bg-transparent hover:bg-transparent text-white hover:text-white data-[active=true]:bg-transparent"
                        : "",
                    )}
                  >
                    <Link href={item.url}>
                      <item.icon className="size-6" />
                      <span className="text-base">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
          {session ? (
            <SidebarMenu className="mt-auto pb-2">
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/settings">
                    <Settings />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          ) : (
            <div className="mt-auto pb-2 flex flex-col gap-2">
              <Button className="w-full" asChild>
                <Link href="/signup">
                  <span>Sign Up</span>
                </Link>
              </Button>
              <Button className="w-full" variant="secondary" asChild>
                <Link href="/login">
                  <span>Log In</span>
                </Link>
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
        <div className="flex flex-1 flex-col min-h-screen">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
