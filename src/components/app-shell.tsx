import { Gamepad, Book, History, Settings, FlaskConical, Film } from "lucide-react";
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
import Link from "next/link";

const data = [
  { title: "Play",        url: "/play",        icon: Gamepad,      piece: "♟" },
  { title: "History",     url: "/history",     icon: History,      piece: "♜" },
  { title: "Rules",       url: "/rules",       icon: Book,         piece: "♝" },
  { title: "Test Board",  url: "/test-board",  icon: FlaskConical, piece: "♞" },
  { title: "Test Replay", url: "/test-replay", icon: Film,         piece: "♛" },
];

export async function AppShell({
  children,
}: React.ComponentProps<typeof Sidebar>) {
  const session = await getSession();

  return (
    <SidebarProvider>
      <Sidebar className="border-r-0 bg-white">
        {/* Header */}
        <SidebarHeader className="py-0 border-b-4 border-black">
          <Link
            className="flex h-14 items-center px-4 gap-3 hover:bg-black hover:text-white transition-colors group"
            href="/"
          >
            <div className="flex aspect-square size-8 items-center justify-center border-2 border-black bg-black text-white group-hover:bg-white group-hover:text-black transition-colors text-lg font-bold">
              ♔
            </div>
            <span className="truncate font-bold tracking-widest uppercase text-sm">
              Circular Chess
            </span>
          </Link>
        </SidebarHeader>

        <SidebarContent className="px-0 bg-white">
          {/* Nav items */}
          <SidebarMenu className="gap-0 mt-2 px-2">
            {data.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  className="h-11 rounded-none border-2 border-transparent hover:border-black hover:bg-black hover:text-white transition-all group font-bold tracking-wide uppercase text-sm px-3"
                >
                  <Link href={item.url} className="flex items-center gap-3">
                    <span className="text-lg leading-none opacity-60 group-hover:opacity-100">
                      {item.piece}
                    </span>
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>

          {/* Decorative chess row */}
          <div className="mx-2 mt-4 border-t-2 border-b-2 border-black py-2 text-center text-xl tracking-widest opacity-10 select-none">
            ♜♞♝♛♚♝♞♜
          </div>

          {/* Auth section */}
          <div className="mt-auto mx-2 mb-3 pt-4 border-t-2 border-black">
            {session ? (
              <SidebarMenu className="gap-0">
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    className="h-11 rounded-none border-2 border-transparent hover:border-black hover:bg-black hover:text-white transition-all font-bold tracking-wide uppercase text-sm px-3"
                  >
                    <Link href="/settings" className="flex items-center gap-3">
                      <Settings className="size-4" />
                      <span>Settings</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  href="/signup"
                  className="w-full h-11 flex items-center justify-center bg-black text-white border-4 border-black font-bold uppercase tracking-widest text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
                >
                  Sign Up
                </Link>
                <Link
                  href="/login"
                  className="w-full h-11 flex items-center justify-center bg-white text-black border-4 border-black font-bold uppercase tracking-widest text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
                >
                  Log In
                </Link>
              </div>
            )}
          </div>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 md:hidden border-b-4 border-black">
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