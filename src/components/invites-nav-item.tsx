"use client";

import "client-only";
import Link from "next/link";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { usePendingInvites } from "@/hooks/use-pending-invites";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function InvitesNavItem({ enabled }: { enabled: boolean }) {
  const { invites, onNewReceivedInvite } = usePendingInvites(enabled);

  onNewReceivedInvite((invite) => {
    toast(`Game invite from ${invite.opponentUsername}`, {
      description: invite.variant.replace("-", " ").toUpperCase(),
      action: {
        label: "View",
        onClick: () => {
          window.location.href = "/invites";
        },
      },
    });
  });

  if (!enabled) return null;

  const count = invites.received.length;

  return (
    <SidebarMenu className="gap-0">
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          className="h-11 rounded-none border-2 border-transparent hover:border-black hover:bg-black hover:text-white transition-all group font-bold tracking-wide uppercase text-sm px-3"
        >
          <Link href="/invites" className="flex items-center gap-3">
            <Mail className="size-4 opacity-60 group-hover:opacity-100" />
            <span className="flex-1">Invites</span>
            {count > 0 && (
              <span className="flex size-5 items-center justify-center rounded-full bg-black text-white text-xs font-black group-hover:bg-white group-hover:text-black">
                {count}
              </span>
            )}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
